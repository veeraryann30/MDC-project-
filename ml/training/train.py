"""
Machine Learning Training Pipeline for Catch the Phish
1. Loads/cleans URL dataset
2. Extracts 34 URL features
3. Splits into train & test sets (80/20)
4. Trains multiple models (Random Forest, Logistic Regression)
5. Evaluates metrics (Accuracy, Precision, Recall, F1, Confusion Matrix)
6. Serializes trained models (.joblib) and exports metrics (model_metrics.json)
"""

import os
import sys
import json
import time
import joblib
from typing import Tuple, Dict, Any, List
import numpy as np
import pandas as pd
from datetime import datetime
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
)

# Add project root to sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

from ml.features.extractor import extract_features, FEATURE_NAMES
from ml.dataset.dataset_builder import build_and_save_dataset


def load_or_create_dataset(csv_path: str) -> pd.DataFrame:
    """Loads dataset from CSV or generates one if it does not exist."""
    if not os.path.exists(csv_path):
        print(f"[*] Dataset not found at {csv_path}. Generating dataset...")
        build_and_save_dataset(filepath=csv_path, sample_size=3200)
        
    df = pd.read_csv(csv_path)
    print(f"[*] Raw dataset loaded: {len(df)} rows")
    
    # Cleaning
    df = df.dropna(subset=["url", "label"])
    df["url"] = df["url"].astype(str).str.strip()
    df = df[df["url"].str.len() > 3]
    df = df.drop_duplicates(subset=["url"])
    print(f"[*] Cleaned dataset: {len(df)} rows (Legit: {sum(df['label'] == 0)}, Phish: {sum(df['label'] == 1)})")
    return df


def extract_features_from_dataframe(df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
    """Extracts numerical feature matrix X and label vector y."""
    print("[*] Extracting 34 features for all URLs in dataset...")
    start_time = time.time()
    
    feature_rows = []
    labels = []
    
    for idx, row in df.iterrows():
        url = row["url"]
        label = int(row["label"])
        extracted = extract_features(url)
        feats = [extracted["features"][col] for col in FEATURE_NAMES]
        feature_rows.append(feats)
        labels.append(label)
        
    X = np.array(feature_rows, dtype=np.float32)
    y = np.array(labels, dtype=np.int32)
    
    elapsed = time.time() - start_time
    print(f"[*] Feature extraction completed in {elapsed:.2f}s. Feature matrix shape: {X.shape}")
    return X, y


def train_and_evaluate_models():
    """Main training routine."""
    dataset_path = os.path.join(BASE_DIR, "ml", "dataset", "urls_dataset.csv")
    models_dir = os.path.join(BASE_DIR, "ml", "models")
    os.makedirs(models_dir, exist_ok=True)
    
    df = load_or_create_dataset(dataset_path)
    X, y = extract_features_from_dataframe(df)
    
    # Train / Test split (80/20) with stratification
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    print(f"[*] Train set size: {X_train.shape[0]} | Test set size: {X_test.shape[0]}")
    
    # Feature Scaler for linear models
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # 1. Random Forest Classifier
    print("\n[*] Training Random Forest Classifier...")
    rf = RandomForestClassifier(
        n_estimators=120,
        max_depth=16,
        min_samples_split=4,
        random_state=42,
        n_jobs=-1
    )
    rf.fit(X_train, y_train)
    rf_pred = rf.predict(X_test)
    
    rf_metrics = {
        "model_name": "Random Forest",
        "accuracy": round(float(accuracy_score(y_test, rf_pred)), 4),
        "precision": round(float(precision_score(y_test, rf_pred, zero_division=0)), 4),
        "recall": round(float(recall_score(y_test, rf_pred, zero_division=0)), 4),
        "f1_score": round(float(f1_score(y_test, rf_pred, zero_division=0)), 4),
        "confusion_matrix": confusion_matrix(y_test, rf_pred).tolist()
    }
    print(f"    Random Forest -> Accuracy: {rf_metrics['accuracy']:.4f}, F1: {rf_metrics['f1_score']:.4f}, Precision: {rf_metrics['precision']:.4f}, Recall: {rf_metrics['recall']:.4f}")
    
    # 2. Logistic Regression Classifier
    print("\n[*] Training Logistic Regression Baseline...")
    lr = LogisticRegression(max_iter=1000, random_state=42)
    lr.fit(X_train_scaled, y_train)
    lr_pred = lr.predict(X_test_scaled)
    
    lr_metrics = {
        "model_name": "Logistic Regression",
        "accuracy": round(float(accuracy_score(y_test, lr_pred)), 4),
        "precision": round(float(precision_score(y_test, lr_pred, zero_division=0)), 4),
        "recall": round(float(recall_score(y_test, lr_pred, zero_division=0)), 4),
        "f1_score": round(float(f1_score(y_test, lr_pred, zero_division=0)), 4),
        "confusion_matrix": confusion_matrix(y_test, lr_pred).tolist()
    }
    print(f"    Logistic Regression -> Accuracy: {lr_metrics['accuracy']:.4f}, F1: {lr_metrics['f1_score']:.4f}, Precision: {lr_metrics['precision']:.4f}, Recall: {lr_metrics['recall']:.4f}")
    
    # Feature Importances from Random Forest
    importances = rf.feature_importances_
    sorted_idx = np.argsort(importances)[::-1]
    top_features = []
    for idx in sorted_idx:
        top_features.append({
            "feature": FEATURE_NAMES[idx],
            "importance": round(float(importances[idx]), 4)
        })
        
    print("\n[*] Top 10 Most Influential Features:")
    for f in top_features[:10]:
        print(f"    - {f['feature']}: {f['importance']:.4f}")
        
    # Determine best model
    best_model_name = "Random Forest" if rf_metrics["f1_score"] >= lr_metrics["f1_score"] else "Logistic Regression"
    print(f"\n[*] Best Model Selected: {best_model_name}")
    
    # Save artifacts
    rf_path = os.path.join(models_dir, "phishing_rf_model.joblib")
    lr_path = os.path.join(models_dir, "phishing_lr_model.joblib")
    scaler_path = os.path.join(models_dir, "feature_scaler.joblib")
    metrics_path = os.path.join(models_dir, "model_metrics.json")
    
    joblib.dump(rf, rf_path)
    joblib.dump(lr, lr_path)
    joblib.dump(scaler, scaler_path)
    
    summary_report = {
        "trained_at": datetime.utcnow().isoformat() + "Z",
        "total_samples": len(df),
        "train_samples": int(X_train.shape[0]),
        "test_samples": int(X_test.shape[0]),
        "features_count": len(FEATURE_NAMES),
        "feature_names": FEATURE_NAMES,
        "best_model": best_model_name,
        "models": {
            "random_forest": rf_metrics,
            "logistic_regression": lr_metrics
        },
        "top_features": top_features
    }
    
    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(summary_report, f, indent=2)
        
    print(f"\n[*] Artifacts saved successfully:")
    print(f"    - {rf_path}")
    print(f"    - {lr_path}")
    print(f"    - {scaler_path}")
    print(f"    - {metrics_path}")
    
    return summary_report


if __name__ == "__main__":
    train_and_evaluate_models()
