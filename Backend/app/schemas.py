# mtm_ai_system/app/schemas.py

from pydantic import BaseModel
from typing import Optional, Dict, Any


class VisualizationResponse(BaseModel):
    roi_image: Optional[str] = None
    segmentation_overlay: Optional[str] = None
    interpretation_overlay: Optional[str] = None


class PredictionResponse(BaseModel):
    status: str
    message: str
    risk_score: Optional[float] = None
    decision: Optional[str] = None
    geometric_features: Optional[Dict[str, Any]] = None
    cnn_features: Optional[Dict[str, Any]] = None
    visualization: Optional[VisualizationResponse] = None