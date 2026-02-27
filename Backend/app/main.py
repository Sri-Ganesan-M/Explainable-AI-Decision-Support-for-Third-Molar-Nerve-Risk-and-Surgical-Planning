# mtm_ai_system/app/main.py

from fastapi import FastAPI
from app.routes import router
from core.logger import setup_logger

logger = setup_logger()

app = FastAPI(
    title="MTM AI Surgical Planning API",
    version="1.0.0",
    description="AI-Assisted Mandibular Third Molar Surgical Planning"
)

app.include_router(router)

@app.on_event("startup")
def startup_event():
    logger.info("MTM AI API started successfully.")