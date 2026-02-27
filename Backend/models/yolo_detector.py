# models/yolo_detector.py

from ultralytics import YOLO
from core.model_registry import ModelRegistry

class YOLODetector:
    def __init__(self):
        registry = ModelRegistry()
        self.device = registry.get_device()
        self.model_path = registry.get_model_path("yolo_weights")

        self.model = YOLO(str(self.model_path))

    def predict(self, image):
        results = self.model(image, device=self.device)

        detections = []
        for r in results:
            for box in r.boxes:
                detections.append({
                    "bbox": box.xyxy[0].cpu().tolist(),
                    "confidence": float(box.conf[0]),
                    "class_id": int(box.cls[0])
                })
        return detections