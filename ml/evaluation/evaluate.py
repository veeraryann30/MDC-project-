"""
Evaluation Utility for Catch the Phish
Allows evaluating any single URL or batch of URLs with the trained Random Forest model.
"""

import os
import sys
import joblib
import numpy as np

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

from ml.features.extractor import extract_features, FEATURE_NAMES

MODEL_PATH = os.path.join(BASE_DIR, "ml", "models", "phishing_rf_model.joblib")


def predict_url(url: str):
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Model not found at {MODEL_PATH}. Run python ml/training/train.py first.")
        
    model = joblib.load(MODEL_PATH)
    extracted = extract_features(url)
    vector = [extracted["features"][col] for col in FEATURE_NAMES]
    X = np.array([vector], dtype=np.float32)
    
    prediction = int(model.predict(X)[0])
    probabilities = model.predict_proba(X)[0]
    
    return {
        "url": url,
        "is_phishing": bool(prediction == 1),
        "phishing_probability": round(float(probabilities[1]), 4),
        "safe_probability": round(float(probabilities[0]), 4),
        "features": extracted["features"],
        "details": extracted["details"]
    }


if __name__ == "__main__":
    test_urls = [
        "https://www.google.com/search?q=machine+learning",
        "http://paypa1-account-verification.xyz/login.php",
        "http://192.168.1.1:8080/secure/admin"
    ]
    for u in test_urls:
        res = predict_url(u)
        print(f"URL: {res['url']}")
        print(f"  Phishing Probability: {res['phishing_probability'] * 100:.1f}% | Verdict: {'PHISHING' if res['is_phishing'] else 'SAFE'}")
