# mtm_ai_system/core/model_registry.py

from core.config import Config
from pathlib import Path
import torch

class ModelRegistry:
    def __init__(self):
        self.config = Config()
        self.base_dir = Path(__file__).resolve().parent.parent

    def get_device(self):

        if torch.backends.mps.is_available():
            return torch.device("mps")
        elif torch.cuda.is_available():
            return torch.device("cuda")
        else:
            return torch.device("cpu")

    def get_model_path(self, key):
        relative_path = self.config.get(f"paths.{key}")
        return self.base_dir / relative_path