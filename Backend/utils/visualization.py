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
# CALCULATE INTERSECTION 
# ============================================================

def get_intersection(c1, d1, c2, d2):
    if c1 is None or d1 is None or c2 is None or d2 is None:
        return None
    cx1, cy1 = c1
    dx1, dy1 = d1
    cx2, cy2 = c2
    dx2, dy2 = d2
    D = -dx1 * dy2 + dy1 * dx2
    if abs(D) < 1e-5:
        return None
    t1 = ((cx2 - cx1) * (-dy2) - (cy2 - cy1) * (-dx2)) / D
    intersect_x = cx1 + t1 * dx1
    intersect_y = cy1 + t1 * dy1
    return np.array([intersect_x, intersect_y])

# ============================================================
# DRAW ANGLE MARKINGS
# ============================================================

def draw_angle_markings(img, center1, dir1, center2, dir2, class_val, third_mask=None, second_mask=None):
    # Store tooth centers
    c1_pt = None
    c2_pt = None
    if center1 is not None:
        c1_pt = (int(center1[0]), int(center1[1]))
    if center2 is not None:
        c2_pt = (int(center2[0]), int(center2[1]))
    
    # 1. Draw Axis Lines
    if c1_pt is not None and dir1 is not None:
        p1a = tuple((center1 - dir1 * 60).astype(int))
        p1b = tuple((center1 + dir1 * 60).astype(int))
        cv2.line(img, p1a, p1b, (255, 255, 0), 2)  # Yellow for 3rd molar axis
        
    if c2_pt is not None and dir2 is not None:
        p2a = tuple((center2 - dir2 * 80).astype(int))
        p2b = tuple((center2 + dir2 * 80).astype(int))
        cv2.line(img, p2a, p2b, (0, 255, 0), 2)    # Green for occlusal plane
            
    # Always put Class text slightly higher than 3rd molar center to prevent overlap with minimum distance line
    if center1 is not None and class_val:
        cv2.putText(img, class_val, (c1_pt[0] - 40, c1_pt[1] - 40), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        
    # 2. Draw Highest Points (Depth/Ramus Logic Visualization)
    if third_mask is not None:
        t_pts = np.column_stack(np.where(third_mask > 0))
        if len(t_pts) > 0:
            top_y_idx = np.argmin(t_pts[:, 0])
            top_pt_t = (int(t_pts[top_y_idx][1]), int(t_pts[top_y_idx][0]))
            cv2.circle(img, top_pt_t, 4, (255, 0, 255), -1)  # Magenta dot for 3rd Molar peak
            
    if second_mask is not None:
        s_pts = np.column_stack(np.where(second_mask > 0))
        if len(s_pts) > 0:
            top_y_idx = np.argmin(s_pts[:, 0])
            top_pt_s = (int(s_pts[top_y_idx][1]), int(s_pts[top_y_idx][0]))
            cv2.circle(img, top_pt_s, 4, (255, 165, 0), -1)  # Orange dot for 2nd Molar peak
            # Draw horizontal reference line for occlusion depth logic
            cv2.line(img, (top_pt_s[0]-50, top_pt_s[1]), (top_pt_t[0]+50, top_pt_s[1]), (255, 165, 0), 1, cv2.LINE_AA)

    return img

# ============================================================
# DRAW DISTANCE LINE
# ============================================================

def draw_min_distance_line(img, third, canal, min_dist_val):
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

    # Red line for BGR format, which translates to a blue line in the frontend due to RGB conversion later
    cv2.line(img, p1, p2, (0, 0, 255), 2)
    
    # Render min distance text offset to the right of the midpoint
    if min_dist_val is not None:
        mid_x = int((p1[0] + p2[0]) / 2)
        mid_y = int((p1[1] + p2[1]) / 2)
        cv2.putText(img, f"{round(min_dist_val, 2)} mm", (mid_x + 10, mid_y), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

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

    # Draw angle markings (lines at intersection, with class & angle labels)
    interp_overlay = draw_angle_markings(
        interp_overlay,
        pca_center,
        pca_axis,
        plane_center,
        plane_axis,
        winter_class,
        third_mask,
        second_mask
    )

    # Draw minimum distance with label
    interp_overlay = draw_min_distance_line(
        interp_overlay,
        third_mask,
        canal_mask,
        min_distance
    )


    # Convert BGR to RGB for frontend
    seg_overlay = cv2.cvtColor(seg_overlay, cv2.COLOR_BGR2RGB)
    interp_overlay = cv2.cvtColor(interp_overlay, cv2.COLOR_BGR2RGB)

    return {
        "roi_image": to_base64(base),
        "segmentation_overlay": to_base64(seg_overlay),
        "interpretation_overlay": to_base64(interp_overlay)
    }