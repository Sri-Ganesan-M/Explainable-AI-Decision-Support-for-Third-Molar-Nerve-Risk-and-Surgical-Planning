# mtm_ai_system/models/tooth_segmenter.py

import torch
import torch.nn as nn
import torch.nn.functional as F
from core.model_registry import ModelRegistry


# =============================
# ARCHITECTURE (EXACT MATCH)
# =============================

class ConvBlock_Tooth(nn.Module):
    def __init__(self, in_c, out_c):
        super().__init__()
        self.block = nn.Sequential(
            nn.Conv2d(in_c, out_c, 3, padding=1),
            nn.BatchNorm2d(out_c),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_c, out_c, 3, padding=1),
            nn.BatchNorm2d(out_c),
            nn.ReLU(inplace=True)
        )

    def forward(self, x):
        return self.block(x)


class AttentionGate_Tooth(nn.Module):
    def __init__(self, F_g, F_l, F_int):
        super().__init__()
        self.W_g = nn.Conv2d(F_g, F_int, 1)
        self.W_x = nn.Conv2d(F_l, F_int, 1)
        self.psi = nn.Sequential(nn.Conv2d(F_int, 1, 1)) 
        self.relu = nn.ReLU(inplace=True)

    def forward(self, g, x):
        if g.shape[2:] != x.shape[2:]:
            g = F.interpolate(g, size=x.shape[2:], mode="bilinear", align_corners=False)
        psi = torch.sigmoid(self.psi(self.relu(self.W_g(g) + self.W_x(x))))
        return x * psi


class AttentionUNet_Tooth(nn.Module):
    def __init__(self, num_classes=3):
        super().__init__()

        self.enc1 = ConvBlock_Tooth(1, 64)
        self.enc2 = ConvBlock_Tooth(64, 128)
        self.enc3 = ConvBlock_Tooth(128, 256)
        self.enc4 = ConvBlock_Tooth(256, 512)
        self.pool = nn.MaxPool2d(2)

        self.up3 = nn.ConvTranspose2d(512, 256, 2, 2)
        self.up2 = nn.ConvTranspose2d(256, 128, 2, 2)
        self.up1 = nn.ConvTranspose2d(128, 64, 2, 2)

        self.att3 = AttentionGate_Tooth(256, 256, 128)
        self.att2 = AttentionGate_Tooth(128, 128, 64)
        self.att1 = AttentionGate_Tooth(64, 64, 32)

        self.dec3 = ConvBlock_Tooth(512, 256)
        self.dec2 = ConvBlock_Tooth(256, 128)
        self.dec1 = ConvBlock_Tooth(128, 64)

        self.out = nn.Conv2d(64, num_classes, 1)

    def forward(self, x):

        e1 = self.enc1(x)
        e2 = self.enc2(self.pool(e1))
        e3 = self.enc3(self.pool(e2))
        e4 = self.enc4(self.pool(e3))

        d3 = self.up3(e4)
        e3 = self.att3(d3, e3)
        d3 = self.dec3(torch.cat([d3, e3], 1))

        d2 = self.up2(d3)
        e2 = self.att2(d2, e2)
        d2 = self.dec2(torch.cat([d2, e2], 1))

        d1 = self.up1(d2)
        e1 = self.att1(d1, e1)
        d1 = self.dec1(torch.cat([d1, e1], 1))

        return self.out(d1)  # logits


# =============================
# WRAPPER
# =============================

class ToothSegmenter:
    def __init__(self):
        registry = ModelRegistry()
        self.device = registry.get_device()
        model_path = registry.get_model_path("tooth_weights")

        self.model = AttentionUNet_Tooth().to(self.device)
        self.model.load_state_dict(torch.load(model_path, map_location=self.device))
        self.model.eval()

    def predict(self, x):
        with torch.no_grad():
            logits = self.model(x.to(self.device))
            probs = torch.softmax(logits, dim=1)
            preds = torch.argmax(probs, dim=1)
        return preds.cpu()