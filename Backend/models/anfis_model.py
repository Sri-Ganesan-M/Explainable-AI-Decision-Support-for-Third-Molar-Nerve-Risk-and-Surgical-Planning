# mtm_ai_system/models/anfis_model.py

import torch
import torch.nn as nn
from core.model_registry import ModelRegistry


def gaussian(x, mean, sigma):
    return torch.exp(-0.5 * ((x - mean) / sigma) ** 2)


class ANFIS(nn.Module):
    def __init__(self, input_dim=5, num_rules=10):
        super().__init__()
        self.input_dim = input_dim
        self.num_rules = num_rules

        self.low_means = torch.tensor([0.25]*input_dim)
        self.high_means = torch.tensor([0.75]*input_dim)
        self.sigmas = torch.tensor([0.2]*input_dim)

        self.consequents = nn.Parameter(
            torch.randn(num_rules, input_dim + 1) * 0.1
        )

    def forward(self, x):

        low = gaussian(x, self.low_means.to(x.device), self.sigmas.to(x.device))
        high = gaussian(x, self.high_means.to(x.device), self.sigmas.to(x.device))

        rules = torch.stack([
            high[:,0]*high[:,1],
            high[:,0]*high[:,2],
            high[:,2]*high[:,4],
            low[:,0]*low[:,1]*low[:,2],
            high[:,1],
            high[:,3]*high[:,2],
            high[:,4],
            high[:,0],
            high[:,0]*high[:,1]*high[:,2],
            torch.prod(low, dim=1)
        ], dim=1)

        rules = rules + 1e-6
        norm_rules = rules / torch.sum(rules, dim=1, keepdim=True)

        x_aug = torch.cat([x, torch.ones(x.shape[0],1).to(x.device)], dim=1)
        rule_outputs = torch.matmul(x_aug, self.consequents.T)

        return torch.sum(norm_rules * rule_outputs, dim=1, keepdim=True)


class ANFISModel:
    def __init__(self):
        registry = ModelRegistry()
        self.device = registry.get_device()
        model_path = registry.get_model_path("anfis_weights")

        self.model = ANFIS().to(self.device)
        self.model.load_state_dict(torch.load(model_path, map_location=self.device))
        self.model.eval()

    def predict(self, feature_tensor):
        with torch.no_grad():
            output = self.model(feature_tensor.to(self.device))
        return output.cpu()