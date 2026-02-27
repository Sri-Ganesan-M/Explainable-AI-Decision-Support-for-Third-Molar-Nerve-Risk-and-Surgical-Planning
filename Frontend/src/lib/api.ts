export interface PredictResponse {
  status: string;
  message: string;
  risk_score: number | null;
  decision: string | null;
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
    throw new Error(`Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
