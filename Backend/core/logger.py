# mtm_ai_system/core/logger.py
import logging
from pathlib import Path
from core.config import Config

def setup_logger():
    config = Config()
    log_file = config.get("logging.log_file")
    log_level = config.get("logging.level")

    base_dir = Path(__file__).resolve().parent.parent
    log_path = base_dir / log_file
    log_path.parent.mkdir(parents=True, exist_ok=True)

    logging.basicConfig(
        filename=str(log_path),
        level=getattr(logging, log_level),
        format="%(asctime)s - %(levelname)s - %(message)s"
    )

    return logging.getLogger("MTM_AI")