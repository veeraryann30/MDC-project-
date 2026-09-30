"""
Machine Learning Inference Service for Catch the Phish
Loads trained Random Forest classifier and runs real-time probability prediction.
"""

import os
import joblib
import numpy as np
from typing import Dict, Any, Tuple
from ml.features.extractor import FEATURE_NAMES

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
MODEL_PATH = os.path.join(BASE_DIR, "ml", "models", "phishing_rf_model.joblib")

class MLService:
    _model = None

    @classmethod
    def get_model(cls):
        if cls._model is None:
            if os.path.exists(MODEL_PATH):
                cls._model = joblib.load(MODEL_PATH)
            else:
                # If model not trained yet, attempt to train on startup
                from ml.training.train import train_and_evaluate_models
                train_and_evaluate_models()
                cls._model = joblib.load(MODEL_PATH)
        return cls._model

    @classmethod
    def predict(cls, features: Dict[str, Any]) -> Tuple[float, bool]:
        """
        Returns:
        - ml_score: Phishing risk score from 0.0 to 100.0
        - is_phishing: boolean classification
        """
        model = cls.get_model()
        vector = [features.get(col, 0.0) for col in FEATURE_NAMES]
        X = np.array([vector], dtype=np.float32)

        try:
            probabilities = model.predict_proba(X)[0]
            phish_prob = float(probabilities[1]) # probability of class 1 (phishing)
            is_phish = bool(model.predict(X)[0] == 1)
            ml_score = round(phish_prob * 100.0, 1)
            return ml_score, is_phish
        except Exception as e:
            # Fallback in case of prediction failure
            return 0.0, False
