# mtm_ai_system/app/routes.py

from fastapi import APIRouter, UploadFile, File, HTTPException
import numpy as np
import cv2
import torch
from PIL import Image
from app.schemas import PredictionResponse
from pipeline.full_pipeline import SurgicalPlanningPipeline
from core.logger import setup_logger

router = APIRouter()
logger = setup_logger()

# Load pipeline once at startup
pipeline = SurgicalPlanningPipeline()


@router.get("/health")
def health_check():
    return {"status": "healthy", "service": "MTM AI API"}


@router.post("/predict", response_model=PredictionResponse)
async def predict(file: UploadFile = File(...)):

    try:
        contents = await file.read()
        np_img = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(np_img, cv2.IMREAD_GRAYSCALE)

        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image file.")

        result = pipeline.run(img)

        return result

    except Exception as e:
        logger.error(f"Inference failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error.")