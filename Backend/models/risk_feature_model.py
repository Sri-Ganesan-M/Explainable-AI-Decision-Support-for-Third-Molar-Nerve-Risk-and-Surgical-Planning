# mtm_ai_system/models/risk_feature_model.py

import torch
import torch.nn as nn
from torchvision import models
from core.model_registry import ModelRegistry


class MultiHeadResNet18(nn.Module):
    def __init__(self):
        super().__init__()

        base = models.resnet18(weights=models.ResNet18_Weights.IMAGENET1K_V1)

        old_conv = base.conv1
        base.conv1 = nn.Conv2d(1, 64, 7, 2, 3, bias=False)
        base.conv1.weight.data = old_conv.weight.data.mean(dim=1, keepdim=True)

        self.encoder = nn.Sequential(*list(base.children())[:-1])
        self.dropout = nn.Dropout(0.3)

        f = 512
        self.overlap   = nn.Linear(f,1)
        self.interrupt = nn.Linear(f,1)
        self.dark      = nn.Linear(f,1)

        self.curve = nn.Linear(f,3)
        self.ang   = nn.Linear(f,4)
        self.depth = nn.Linear(f,3)
        self.erupt = nn.Linear(f,3)

    def forward(self,x):
        f = self.encoder(x).flatten(1)
        f = self.dropout(f)

        return {
            "overlap":      self.overlap(f).squeeze(1),
            "interruption": self.interrupt(f).squeeze(1),
            "darkening":    self.dark(f).squeeze(1),
            "curvature":    self.curve(f),
            "angulation":   self.ang(f),
            "depth":        self.depth(f),
            "eruption":     self.erupt(f),
        }


class RiskFeatureModel:
    def __init__(self):
        registry = ModelRegistry()
        self.device = registry.get_device()
        model_path = registry.get_model_path("resnet_weights")

        self.model = MultiHeadResNet18().to(self.device)
        self.model.load_state_dict(torch.load(model_path, map_location=self.device))
        self.model.eval()

    def predict(self, x):
        with torch.no_grad():
            outputs = self.model(x.to(self.device))
        return {k: v.cpu() for k, v in outputs.items()}