export interface PredictResponse {
  status: string;
  message: string;
  nerve_injury_risk: {
    score: number;
    category: string;
    recommendation: string;
  } | null;
  surgical_difficulty: {
    score: number;
    winter_classification: string;
  } | null;
  geometric_features: {
    winter_angle: number;
    winter_class: string;
    pell_depth: string;
    ramus_class: string;
    min_distance_mm: number;
    contact: number;
    root_complexity: number;
  } | null;
  cnn_features: {
    overlap: number;
    interruption: number;
    darkening: number;
  } | null;
  visualization: {
    roi_image: string;
    segmentation_overlay: string;
    interpretation_overlay: string;
  } | null;
}

export async function predict(file: File): Promise<PredictResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/predict", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let errorMessage = `Error: ${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData && errorData.detail) {
        errorMessage = errorData.detail;
      }
    } catch {
      // Fallback to default if not JSON
    }
    throw new Error(errorMessage);
  }

  return response.json();
}
