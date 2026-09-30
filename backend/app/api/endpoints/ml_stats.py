"""
Machine Learning Model Statistics & Explainability Endpoint
Provides training metrics (Accuracy, Precision, Recall, F1), confusion matrix,
and feature importances for frontend visualizations and college project presentations.
"""

import os
import json
from fastapi import APIRouter, HTTPException

router = APIRouter()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
METRICS_PATH = os.path.join(BASE_DIR, "ml", "models", "model_metrics.json")

@router.get("/ml/metrics")
def get_ml_metrics():
    if not os.path.exists(METRICS_PATH):
        raise HTTPException(
            status_code=404,
            detail="Model metrics not found. Please run the ML training pipeline first."
        )

    try:
        with open(METRICS_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading model metrics: {str(e)}")
