# mtm_ai_system/utils/visualization.py

import cv2
import base64
import numpy as np
from scipy.spatial.distance import cdist

ROI_SIZE = 512


# ============================================================
# BASE64 HELPER
# ============================================================

def to_base64(img):
    _, buffer = cv2.imencode(".png", img)
    return base64.b64encode(buffer).decode("utf-8")


# ============================================================
# DRAW PCA AXIS
# ============================================================

def draw_axis(img, center, direction, color=(255,255,0), length=100):
    if center is None or direction is None:
        return img

    p1 = tuple((center - direction * length).astype(int))
    p2 = tuple((center + direction * length).astype(int))
    cv2.line(img, p1, p2, color, 2)
    return img


# ============================================================
# DRAW DISTANCE LINE
# ============================================================

def draw_min_distance_line(img, third, canal):
    pts1 = np.column_stack(np.where(third > 0))
    pts2 = np.column_stack(np.where(canal > 0))

    if len(pts1) == 0 or len(pts2) == 0:
        return img

    pts1_xy = np.flip(pts1, axis=1)
    pts2_xy = np.flip(pts2, axis=1)

    dists = cdist(pts1_xy, pts2_xy)
    idx = np.unravel_index(np.argmin(dists), dists.shape)

    p1 = tuple(pts1_xy[idx[0]])
    p2 = tuple(pts2_xy[idx[1]])

    cv2.line(img, p1, p2, (0,0,255), 2)
    return img


# ============================================================
# MAIN VISUALIZATION FUNCTION
# ============================================================

def generate_full_visualization(
    roi,
    canal_mask,
    third_mask,
    second_mask,
    winter_angle,
    winter_class,
    min_distance,
    pca_center,
    pca_axis,
    plane_center,
    plane_axis
):

    base = cv2.cvtColor(
        cv2.resize(roi, (ROI_SIZE, ROI_SIZE)),
        cv2.COLOR_GRAY2BGR
    )

    # =============================
    # 1️⃣ Segmentation Overlay
    # =============================

    seg_overlay = base.copy()
    seg_overlay[canal_mask > 0] = [255, 0, 0]

    contours, _ = cv2.findContours(third_mask.astype(np.uint8),
                                   cv2.RETR_EXTERNAL,
                                   cv2.CHAIN_APPROX_NONE)
    cv2.drawContours(seg_overlay, contours, -1, (0,255,255), 2)

    contours2, _ = cv2.findContours(second_mask.astype(np.uint8),
                                    cv2.RETR_EXTERNAL,
                                    cv2.CHAIN_APPROX_NONE)
    cv2.drawContours(seg_overlay, contours2, -1, (0,255,0), 2)

    # =============================
    # 2️⃣ Interpretation Overlay
    # =============================

    interp_overlay = seg_overlay.copy()

    # Draw PCA axis (Third molar)
    interp_overlay = draw_axis(
        interp_overlay,
        pca_center,
        pca_axis,
        color=(255,255,0),
        length=120
    )

    # Draw occlusal plane
    interp_overlay = draw_axis(
        interp_overlay,
        plane_center,
        plane_axis,
        color=(0,255,0),
        length=150
    )

    # Draw distance line
    interp_overlay = draw_min_distance_line(
        interp_overlay,
        third_mask,
        canal_mask
    )

    # Add text annotations
    cv2.putText(interp_overlay,
                f"Angle: {round(winter_angle,1) if winter_angle else 'N/A'}",
                (20,30),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                (255,255,255),
                2)

    cv2.putText(interp_overlay,
                f"Class: {winter_class}",
                (20,60),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                (255,255,255),
                2)

    if min_distance:
        cv2.putText(interp_overlay,
                    f"Min Dist: {round(min_distance,2)} mm",
                    (20,90),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.7,
                    (255,255,255),
                    2)

    # Convert BGR to RGB for frontend
    seg_overlay = cv2.cvtColor(seg_overlay, cv2.COLOR_BGR2RGB)
    interp_overlay = cv2.cvtColor(interp_overlay, cv2.COLOR_BGR2RGB)

    return {
        "roi_image": to_base64(base),
        "segmentation_overlay": to_base64(seg_overlay),
        "interpretation_overlay": to_base64(interp_overlay)
    }