# mtm_ai_system/pipeline/full_pipeline.py

import torch
import numpy as np
import cv2
from torchvision import transforms
from PIL import Image

from models.yolo_detector import YOLODetector
from models.canal_segmenter import CanalSegmenter
from models.tooth_segmenter import ToothSegmenter
from models.risk_feature_model import RiskFeatureModel
from models.anfis_model import ANFISModel

from utils.geometry import (
    clean_tooth,
    clean_canal,
    compute_winter,
    compute_depth_class,
    compute_ramus_class,
    compute_min_distance,
    compute_contact,
    compute_root_complexity,
    pca_axis,
    compute_occlusal_plane
)

from utils.visualization import generate_full_visualization
from core.logger import setup_logger

logger = setup_logger()

ROI_SIZE = 512


class SurgicalPlanningPipeline:

    def __init__(self):

        self.device = torch.device(
            "mps" if torch.backends.mps.is_available()
            else "cuda" if torch.cuda.is_available()
            else "cpu"
        )

        logger.info("Loading models...")

        self.yolo = YOLODetector()
        self.canal_model = CanalSegmenter()
        self.tooth_model = ToothSegmenter()
        self.resnet_model = RiskFeatureModel()
        self.anfis_model = ANFISModel()

        self.img_tf = transforms.Compose([
            transforms.Resize((ROI_SIZE, ROI_SIZE)),
            transforms.ToTensor(),
            transforms.Normalize([0.5], [0.5])
        ])

    # ============================================================
    # MAIN PIPELINE
    # ============================================================

    def run(self, img):

        try:
            H, W = img.shape

            # ---------------- Stage 1: YOLO ----------------

            img_rgb = cv2.cvtColor(img, cv2.COLOR_GRAY2RGB)
            detections = self.yolo.predict(img_rgb)

            if len(detections) == 0:
                return self._failure("No third molar detected.")

            x1, y1, x2, y2 = map(int, detections[0]["bbox"])
            tw = x2 - x1

            rx1 = int(np.clip(x1 - 0.45 * tw, 0, W))
            rx2 = int(np.clip(x2 + 0.45 * tw, 0, W))
            ry1 = int(np.clip(y1 - 0.35 * tw, 0, H))
            ry2 = int(np.clip(y2 + 0.85 * tw, 0, H))

            roi = img[ry1:ry2, rx1:rx2]

            if roi.size == 0:
                return self._failure("ROI extraction failed.")

            # ---------------- Stage 2: Segmentation ----------------

            x_tensor = self.img_tf(Image.fromarray(roi)).unsqueeze(0).to(self.device)

            canal_pred = self.canal_model.predict(x_tensor)
            tooth_pred = self.tooth_model.predict(x_tensor)

            center_map = canal_pred["centerline"][0, 0].cpu().numpy()
            canal_mask = clean_canal(
                (center_map > np.percentile(center_map, 96)).astype(np.uint8)
            )

            pred_mask = tooth_pred[0].cpu().numpy()

            third = clean_tooth((pred_mask == 1).astype(np.uint8))
            second = clean_tooth((pred_mask == 2).astype(np.uint8))

            # ---------------- Stage 3: Geometry ----------------

            winter_angle, winter_class = compute_winter(third, second)
            depth_class = compute_depth_class(third, second)
            ramus_class = compute_ramus_class(third, second)
            min_dist = compute_min_distance(third, canal_mask)
            contact = compute_contact(third, canal_mask, min_dist)
            root_complexity = compute_root_complexity(third)

            # Compute PCA & occlusal plane for visualization
            pca_center, pca_dir = pca_axis(third)
            plane_center, plane_dir = compute_occlusal_plane(second)

            # ---------------- Stage 4: CNN ----------------

            cnn_out = self.resnet_model.predict(x_tensor)

            overlap = torch.sigmoid(cnn_out["overlap"]).item()
            interruption = torch.sigmoid(cnn_out["interruption"]).item()
            darkening = torch.sigmoid(cnn_out["darkening"]).item()
            eruption = torch.softmax(cnn_out["eruption"], dim=1)[0, 1].item()

            # ---------------- Stage 5: Fusion ----------------

            proximity = np.exp(-min_dist / 2) if min_dist else 0
            canal_integrity = 0.6 * interruption + 0.4 * darkening
            impaction = (winter_angle / 180) if winter_angle else 0.5
            access = 1 - eruption
            root_complexity_val = root_complexity if root_complexity else 0.5

            feature_vector = torch.tensor([
                [
                    proximity,
                    canal_integrity,
                    impaction,
                    access,
                    root_complexity_val
                ]
            ], dtype=torch.float32).to(self.device)

            risk = self.anfis_model.predict(feature_vector).item()
            decision = self._risk_to_decision(risk)

            # ---------------- Stage 6: Advanced Visualization ----------------

            visualization = generate_full_visualization(
                roi,
                canal_mask,
                third,
                second,
                winter_angle,
                winter_class,
                min_dist,
                pca_center,
                pca_dir,
                plane_center,
                plane_dir
            )

            # ---------------- Final Response ----------------

            return {
                "status": "success",
                "message": "Prediction completed.",
                "risk_score": float(risk),
                "decision": decision,
                "geometric_features": {
                    "winter_angle": winter_angle,
                    "winter_class": winter_class,
                    "pell_depth": depth_class,
                    "ramus_class": ramus_class,
                    "min_distance_mm": min_dist,
                    "contact": contact,
                    "root_complexity": root_complexity
                },
                "cnn_features": {
                    "overlap": overlap,
                    "interruption": interruption,
                    "darkening": darkening
                },
                "visualization": visualization
            }

        except Exception as e:
            logger.error(f"Pipeline error: {str(e)}")
            return self._failure("Pipeline execution failed.")

    # ============================================================
    # Helpers
    # ============================================================

    def _risk_to_decision(self, risk):
        if risk < 0.28:
            return "Low Risk – Routine Extraction"
        elif risk < 0.42:
            return "Moderate Risk – Consider CBCT"
        else:
            return "High Risk – CBCT + Specialist Referral"

    def _failure(self, message):
        return {
            "status": "failed",
            "message": message,
            "risk_score": None,
            "decision": None,
            "geometric_features": None,
            "cnn_features": None,
            "visualization": None
        }