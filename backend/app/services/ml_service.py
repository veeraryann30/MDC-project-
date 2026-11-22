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

    _lr = None
    _scaler = None
    _lr_checked = False

    @classmethod
    def lr_available(cls) -> bool:
        cls._load_lr()
        return cls._lr is not None and cls._scaler is not None

    @classmethod
    def _load_lr(cls):
        if cls._lr_checked:
            return
        cls._lr_checked = True
        lr_path = os.path.join(BASE_DIR, "ml", "models", "phishing_lr_model.joblib")
        sc_path = os.path.join(BASE_DIR, "ml", "models", "feature_scaler.joblib")
        try:
            if os.path.exists(lr_path) and os.path.exists(sc_path):
                cls._lr = joblib.load(lr_path)
                cls._scaler = joblib.load(sc_path)
        except Exception:
            cls._lr = cls._scaler = None

    @classmethod
    def predict_lr(cls, features: Dict[str, Any]):
        """Logistic Regression phishing probability (0-100), or None if the model is unavailable."""
        cls._load_lr()
        if cls._lr is None or cls._scaler is None:
            return None
        try:
            X = np.array([[features.get(col, 0.0) for col in FEATURE_NAMES]], dtype=np.float32)
            return round(float(cls._lr.predict_proba(cls._scaler.transform(X))[0][1]) * 100.0, 1)
        except Exception:
            return None

    @classmethod
    def predict_all(cls, features: Dict[str, Any]) -> Dict[str, Any]:
        """Both classifiers. Weights favour the Random Forest (stronger on held-out data)."""
        rf_score, rf_is_phish = cls.predict(features)
        lr_score = cls.predict_lr(features)
        if lr_score is None:
            ensemble = rf_score
        else:
            ensemble = round(0.7 * rf_score + 0.3 * lr_score, 1)
        return {
            "rf": rf_score,
            "lr": lr_score,
            "ensemble": ensemble,
            "rf_is_phishing": rf_is_phish,
            "models_disagree": lr_score is not None and abs(rf_score - lr_score) >= 40,
        }

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
