# CATCH THE PHISH
### *“Don’t Click. Check First.”*

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Scikit-Learn](https://img.shields.io/badge/scikit--learn-1.4+-F7931E?style=flat&logo=scikit-learn&logoColor=white)](https://scikit-learn.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

**Catch the Phish** is a production-grade, explainable cybersecurity application and Machine Learning showcase designed to analyze untrusted links without executing them.

Rather than giving a black-box binary verdict ("Phishing" vs "Safe"), Catch the Phish breaks down every detected anomaly into human-understandable concepts:
1. **What was detected**
2. **Why it matters**
3. **How attackers use it**
4. **What you should do**

---

## Key Features

- **Safe Static Analysis (Zero-Execution Principle)**: The system parses URLs purely as raw data strings. It **never** sends HTTP requests to, renders, or executes scripts from untrusted domains.
- **34-Feature Extraction Vector**: Analyzes lexical dimensions, structural markers, protocol flags, punctuation counts, Shannon entropy, and suspicious credential keywords.
- **Modular Brand Impersonation Detection**: Uses Levenshtein edit distance, homoglyph character substitutions (e.g. `paypa1`, `g00gle`, `app1e`), and subdomain injection detection against a modular catalog of major brands (PayPal, Microsoft, Apple, Google, Chase, Binance, etc.).
- **Real Machine Learning Pipeline**: Built with Python and Scikit-Learn. Employs a 120-estimator Random Forest classifier trained on balanced legitimate and adversarial URL corpora, evaluated with test Accuracy, Precision, Recall, F1-Score, and Confusion Matrix.
- **Multi-Signal Risk Scoring (0–100)**:
  - 🟢 **0–29**: SAFE
  - 🟠 **30–69**: SUSPICIOUS
  - 🔴 **70–100**: HIGH RISK / PHISHING
- **Phishing Awareness Academy**: 10 interactive lessons covering lookalike domains, fake login pages, punycode attacks, URL manipulation, and QR code phishing, accompanied by a 6-scenario interactive **Phishing IQ Quiz**.
- **Audit Scan History & SOC Analytics Dashboard**: Real-time SQLite persistence storing historical scans with search, classification filtering, and Recharts-powered analytics for risk distribution and threat indicator frequency.
- **Guided by Andrej Karpathy's Engineering Principles**: Adheres strictly to the four tenets (*Think Before Coding*, *Simplicity First*, *Surgical Changes*, *Goal-Driven Verification*) ensuring verifiable, interpretable, and bloat-free cybersecurity architecture.

---

## Project Structure

```text
c:/veer cyber security project/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── endpoints/
│   │   │   │   ├── scan.py          # /api/scan (static analysis & report generation)
│   │   │   │   ├── history.py       # /api/history (search, filter, delete)
│   │   │   │   ├── dashboard.py     # /api/dashboard/stats (KPIs & chart aggregation)
│   │   │   │   └── ml_stats.py      # /api/ml/metrics (model evaluation reports)
│   │   │   └── api.py               # Aggregated APIRouter
│   │   ├── core/
│   │   │   └── config.py            # App configuration & settings
│   │   ├── database/
│   │   │   ├── session.py           # SQLAlchemy SQLite engine & sessionmaker
│   │   │   └── models.py            # ScanRecord ORM entity
│   │   ├── schemas/
│   │   │   ├── scan.py              # Pydantic request & response schemas
│   │   │   └── history.py           # Pydantic history & dashboard schemas
│   │   ├── services/
│   │   │   ├── brand_detector.py    # Brand catalog & similarity scoring
│   │   │   ├── rule_engine.py       # Explainable heuristic rules & educational text
│   │   │   ├── ml_service.py        # Random Forest model inference
│   │   │   ├── threat_intel.py      # Modular VirusTotal / Safe Browsing adapter
│   │   │   └── scorer.py            # Hybrid multi-signal risk calculation (0-100)
│   │   └── main.py                  # FastAPI app entrypoint with CORS & demo seeding
│   └── requirements.txt
├── ml/
│   ├── dataset/
│   │   ├── dataset_builder.py       # Balanced corpus generator (safe & phishing URLs)
│   │   ├── urls_dataset.csv         # Training & evaluation dataset
│   │   └── README.md                # Dataset format and external integration guide
│   ├── features/
│   │   └── extractor.py             # 34-feature extraction engine
│   ├── training/
│   │   └── train.py                 # Multi-model training, cross-validation & export
│   ├── models/
│   │   ├── phishing_rf_model.joblib # Serialized Random Forest model
│   │   ├── phishing_lr_model.joblib # Serialized Logistic Regression baseline
│   │   └── model_metrics.json       # Acc, Precision, Recall, F1, Confusion Matrix
│   └── evaluation/
│       └── evaluate.py              # Interactive CLI prediction tool
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.jsx       # Cyber header with live engine status
│   │   │   │   └── Footer.jsx       # Zero-execution disclaimer and navigation
│   │   │   └── scanner/
│   │   │       ├── UrlScanner.jsx   # Hero scanner with sample attack vectors
│   │   │       ├── RiskGauge.jsx    # Circular SVG risk score gauge
│   │   │       ├── ThreatCard.jsx   # Explainable indicator cards
│   │   │       └── FeatureInspector.jsx # 34-feature vector inspector
│   │   ├── pages/
│   │   │   ├── Home.jsx             # Hero, quick scan, and feature highlights
│   │   │   ├── Scanner.jsx          # Dedicated deep analysis workstation
│   │   │   ├── Results.jsx          # Security audit report with tabs and advice
│   │   │   ├── Dashboard.jsx        # SOC dashboard with Recharts visualizations
│   │   │   ├── History.jsx          # Searchable, filterable audit log
│   │   │   ├── Learn.jsx            # 10 lessons + interactive Phishing IQ Quiz
│   │   │   └── About.jsx            # System architecture, ML metrics & college guide
│   │   ├── services/
│   │   │   └── api.js               # API service layer
│   │   ├── App.jsx                  # Main application routing & state container
│   │   ├── index.css                # Glassmorphic cyber theme & Tailwind styling
│   │   └── main.jsx
│   ├── package.json
│   └── tailwind.config.js
└── README.md
```

---

## Quickstart Guide

### 1. Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### 2. Backend Setup
```bash
# Optional: Install requirements
pip install -r backend/requirements.txt

# Start FastAPI backend server
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
The backend will be live at `http://127.0.0.1:8000`.
API documentation is automatically available at `http://127.0.0.1:8000/docs`.

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The application will be accessible in your browser at `http://127.0.0.1:5173`.

### 4. Retraining the ML Pipeline (Optional)
To retrain the Random Forest and Logistic Regression models on a fresh dataset:
```bash
python ml/training/train.py
```
This regenerates `ml/models/phishing_rf_model.joblib` and updates `ml/models/model_metrics.json`.

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/scan` | Analyzes a URL string statically, evaluates ML & heuristics, logs to DB, and returns explainable report. |
| `GET` | `/api/history` | Retrieves paginated scan history with `search` and `classification` filters. |
| `DELETE` | `/api/history/{id}` | Deletes a single audit scan entry. |
| `DELETE` | `/api/history` | Clears all scan history entries. |
| `GET` | `/api/dashboard/stats` | Aggregates counts, average risk scores, top threat indicators, and recent scans. |
| `GET` | `/api/ml/metrics` | Returns model evaluation metrics, confusion matrix, and feature importances. |
| `GET` | `/api/health` | Service health check and model loading status. |

---

## Security & Ethics Notice

Catch the Phish strictly complies with safe cybersecurity engineering standards. Submitted URLs are never retrieved or executed over the network. The system is designed for educational, research, and defensive threat analysis purposes.
