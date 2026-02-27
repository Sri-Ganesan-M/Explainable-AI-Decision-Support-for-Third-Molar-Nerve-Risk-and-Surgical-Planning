# mtm_ai_system/utils/geometry.py

import cv2
import numpy as np
from sklearn.decomposition import PCA
from scipy.spatial.distance import cdist
from skimage.morphology import skeletonize


PIXEL_SPACING_MM = 0.1


# =============================
# CLEANING
# =============================

def largest_component(mask):
    mask = mask.astype(np.uint8)
    if mask.sum() == 0:
        return mask
    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(mask, 8)
    largest_idx = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])
    return (labels == largest_idx).astype(np.uint8)


def fill_region(mask):
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    filled = np.zeros_like(mask)
    cv2.drawContours(filled, contours, -1, 1, thickness=cv2.FILLED)
    return filled


def clean_tooth(mask):
    mask = largest_component(mask)
    mask = fill_region(mask)
    return cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((3,3), np.uint8))


def clean_canal(mask):
    mask = (mask > 0).astype(np.uint8)
    if mask.sum() == 0:
        return mask
    mask = largest_component(mask)
    mask = cv2.dilate(mask, np.ones((3,3), np.uint8), 1)
    mask = cv2.morphologyEx(mask,
                            cv2.MORPH_CLOSE,
                            cv2.getStructuringElement(cv2.MORPH_RECT,(9,3)))
    mask = cv2.erode(mask, np.ones((3,3), np.uint8), 1)
    return mask


# =============================
# GEOMETRY
# =============================

def root_region(mask):
    rows = np.where(mask > 0)[0]
    if len(rows) == 0:
        return mask
    top, bottom = np.min(rows), np.max(rows)
    cutoff = int(top + 0.4*(bottom-top))
    mask2 = mask.copy()
    mask2[:cutoff,:] = 0
    return mask2


def pca_axis(mask):
    mask = root_region(mask)
    pts = np.column_stack(np.where(mask > 0))
    if len(pts) < 30:
        return None, None
    pts_xy = np.flip(pts, axis=1)
    pca = PCA(n_components=2)
    pca.fit(pts_xy)
    center = np.mean(pts_xy, axis=0)
    return center, pca.components_[0]


def compute_occlusal_plane(second_mask):
    rows = np.where(second_mask > 0)[0]
    if len(rows) < 50:
        return None, None
    top, bottom = np.min(rows), np.max(rows)
    crown_cutoff = int(top + 0.2*(bottom-top))
    crown_mask = second_mask.copy()
    crown_mask[:crown_cutoff,:] = 0
    pts = np.column_stack(np.where(crown_mask > 0))
    if len(pts) < 30:
        return None, None
    pts_xy = np.flip(pts, axis=1)
    pca = PCA(n_components=2)
    pca.fit(pts_xy)
    center = np.mean(pts_xy, axis=0)
    return center, pca.components_[0]


def compute_winter(third, second):
    _, axis = pca_axis(third)
    _, plane = compute_occlusal_plane(second)
    if axis is None or plane is None:
        return None, "Unknown"
    cos_theta = np.dot(axis, plane) / (
        np.linalg.norm(axis) * np.linalg.norm(plane)
    )
    angle = np.degrees(np.arccos(np.clip(cos_theta, -1, 1)))
    if angle <= 10: cls="Vertical"
    elif angle < 80: cls="Mesioangular"
    elif angle <=100: cls="Horizontal"
    else: cls="Distoangular"
    return float(angle), cls


def compute_depth_class(third, second):
    third_pts = np.column_stack(np.where(third > 0))
    second_pts = np.column_stack(np.where(second > 0))
    if len(third_pts)==0 or len(second_pts)==0:
        return "Unknown"
    cusp_row = np.min(third_pts[:,0])
    cej_row = np.min(second_pts[:,0]) + 0.5*(np.max(second_pts[:,0])-np.min(second_pts[:,0]))
    if cusp_row <= cej_row: return "Position A"
    elif cusp_row <= cej_row+20: return "Position B"
    else: return "Position C"


def compute_ramus_class(third, second):
    third_cols = np.where(third > 0)[1]
    second_cols = np.where(second > 0)[1]
    if len(third_cols)==0 or len(second_cols)==0:
        return "Unknown"
    space = np.min(third_cols) - np.max(second_cols)
    tooth_width = np.max(third_cols) - np.min(third_cols)
    if tooth_width==0:
        return "Unknown"
    ratio = space/tooth_width
    if ratio>0.3: return "Class I"
    elif ratio>0.1: return "Class II"
    else: return "Class III"


def compute_min_distance(third, canal):
    third = root_region(third)
    canal_skel = skeletonize(canal > 0).astype(np.uint8)
    t_pts = np.column_stack(np.where(third > 0))
    c_pts = np.column_stack(np.where(canal_skel > 0))
    if len(t_pts)==0 or len(c_pts)==0:
        return None
    return float(np.min(cdist(np.flip(t_pts,1), np.flip(c_pts,1))) * PIXEL_SPACING_MM)


def compute_contact(third, canal, min_dist):
    overlap = np.logical_and(third>0, canal>0)
    if np.any(overlap):
        return 1
    if min_dist is not None and min_dist<=1.0:
        return 1
    return 0


def compute_root_complexity(mask):
    mask = root_region(mask)
    contours,_ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    if len(contours)==0:
        return None
    cnt = contours[0]
    area = cv2.contourArea(cnt)
    peri = cv2.arcLength(cnt, True)
    if area==0:
        return None
    return float((peri**2)/(4*np.pi*area))