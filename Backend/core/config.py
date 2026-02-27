# mtm_ai_system/core/config.py
import yaml
from pathlib import Path

class Config:
    def __init__(self, config_path="configs/production.yaml"):

        # Always resolve from PROJECT ROOT
        project_root = Path(__file__).resolve().parents[1]

        self.config_path = project_root / config_path

        if not self.config_path.exists():
            raise FileNotFoundError(
                f"Config file not found at {self.config_path}"
            )

        with open(self.config_path, "r") as f:
            self.config = yaml.safe_load(f)

    def get(self, key):
        keys = key.split(".")
        value = self.config
        for k in keys:
            value = value[k]
        return value