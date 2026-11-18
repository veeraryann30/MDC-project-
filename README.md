# CATCH THE PHISH
### *“Detect the Deception. Prevent the Damage.”*
#### AI-POWERED MULTI-CHANNEL DIGITAL SCAM DETECTION & PREVENTION PLATFORM

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.141+-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Scikit-Learn](https://img.shields.io/badge/scikit--learn-1.9+-F7931E?style=flat&logo=scikit-learn&logoColor=white)](https://scikit-learn.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat&logo=vite&logoColor=white)](https://vite.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Vercel Deployment](https://img.shields.io/badge/Vercel-Production%20Live-000000?style=flat&logo=vercel&logoColor=white)](https://catch-the-phish-app.vercel.app)

**Catch the Phish** is an enterprise-grade cybersecurity platform designed to detect, analyze, classify, and explain multiple vectors of online deception.

Rather than providing an opaque binary verdict ("Phishing" vs "Safe"), Catch the Phish breaks down every detected anomaly into human-understandable concepts:
1. **WHAT** was detected (extracted evidence and matched phrases).
2. **WHY** it matters (the security impact and psychological manipulation tactic).
3. **HOW** the scam operates (deconstructed via our proprietary **SCAM DNA** engine).
4. **WHAT ACTIONS** the user must take immediately.

---

## Live Deployments & Interactive Workstations

- 🌐 **Production Vercel Cloud Platform**: [https://catch-the-phish-app.vercel.app](https://catch-the-phish-app.vercel.app)
- 🚀 **Local Backend API**: `http://127.0.0.1:8000`
- 📑 **Interactive Swagger API Docs**: `http://127.0.0.1:8000/docs`

---

## Core Detection Modules

### Module 1: Advanced URL & Website Scanner (Preserved & Upgraded)
- Zero-execution static analysis: extracts 34 lexical and structural features without network fetching.
- Brand impersonation detection using Levenshtein distance, homoglyph character substitutions (e.g., `paypa1`, `g00gle`, `app1e`), and subdomain injection detection.
- Machine Learning inference using an ensemble Random Forest model evaluated with balanced datasets.
- Integration with Phish Trace infrastructure mapping (DNS, IP reputation, ASN routing, and SSL certificates).

### Module 2: AI Message Scam Detector (SMS / WhatsApp)
- Identifies SMS, WhatsApp, and messaging scams targeting retail banking customers.
- Detects KYC update deadlines, urgent account freeze threats, OTP interception demands, fake lottery windfalls, and suspicious shortlinks.
- Highlights exact offending substrings with character offset bounds.

### Module 3: Fake Job & Internship Scam Detector
- Specialized recruitment fraud analyzer tailored for students, fresh graduates, and remote job seekers.
- Flags upfront registration and training fee traps, direct appointment promises without technical interviews, and enterprise HR impersonation over free public webmail accounts (@gmail.com).
- Adheres to the principle of not penalizing unknown small businesses solely for being unfamiliar.

### Module 4: Investment & Financial Scam Detector
- Unmasks high-yield investment programs (HYIP), automated crypto arbitrage bots, and "pig butchering" schemes.
- Detects mathematically impossible "guaranteed returns", capital protection claims, Ponzi multi-level referral structures, and advance withdrawal fee traps.

### Module 5: Email Phishing & Social Engineering Detector
- Zero-execution RFC 822 email parser supporting both pasted text and `.eml` file uploads.
- Evaluates sender display-name spoofing, Return-Path / Reply-To mismatches, and cryptographic SPF/DKIM/DMARC headers.
- Inspects attachment metadata safely without opening files, identifying executable scripts (`.exe`, `.scr`, `.vbs`, `.iso`) and double extensions (`invoice.pdf.exe`).

### Module 6: SCAM DNA — Explainable Scam Intelligence
- Central intelligence engine that deconstructs deceptive communication into fundamental manipulation tactics:
  1. **Upfront Payment Demand**
  2. **Artificial Urgency & Coercion**
  3. **Unrealistic Opportunity Promise**
  4. **Authority & Corporate Impersonation**
  5. **Credential & Secret Harvesting**
  6. **Off-Platform Channel Redirection**
  7. **Ponzi / Multi-Level Referral Mechanics**
  8. **Sender Identity / Header Mismatch**
- Produces an evidence-backed report with risk contribution weights and actionable safety steps.

---

## Standard 4-Tier Risk Assessment Engine

Scores range from 0 to 100, categorized into calibrated tiers:
- 🟢 **0–29: LOW RISK** — Standard conventions, benign indicators.
- 🟡 **30–59: MODERATE RISK** — Anomalous phrasing, exercise caution.
- 🟠 **60–79: HIGH RISK** — Deceptive signals or brand spoofing observed.
- 🔴 **80–100: CRITICAL RISK** — High-confidence fraud or credential harvesting.
- ⚪ **INCONCLUSIVE** — Returned when submitted content lacks sufficient data.

---

## Architecture & Technology Stack

```text
c:/veer cyber security project/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── endpoints/
│   │   │   │   ├── auth.py           # /api/auth (Register, Login, Me with JWT)
│   │   │   │   ├── scan.py           # /api/scan (Preserved URL Scanner)
│   │   │   │   ├── scam.py           # /api/scam (Message, Job, Investment, Email, DNA)
│   │   │   │   ├── academy.py        # /api/academy (Curriculum & interactive Quiz)
│   │   │   │   ├── history.py        # /api/history (Multi-channel & URL history)
│   │   │   │   ├── dashboard.py      # /api/dashboard/stats (Database telemetry)
│   │   │   │   ├── phish_trace.py    # /api/phish-trace (Infrastructure OSINT)
│   │   │   │   └── ml_stats.py       # /api/ml/metrics (Model metrics)
│   │   │   └── api.py                # Aggregated APIRouter
│   │   ├── core/config.py            # Environment settings
│   │   ├── database/
│   │   │   ├── models.py             # User, ScamAnalysisRecord, ScanRecord, AcademyProgress
│   │   │   └── session.py            # SQLAlchemy SQLite engine
│   │   ├── security/
│   │   │   └── auth.py               # PBKDF2 password hashing & HMAC-SHA256 JWT
│   │   ├── services/
│   │   │   ├── nlp_engine.py         # Central NLP & phrase highlighting engine
│   │   │   ├── scam_dna_service.py   # SCAM DNA explainable taxonomy
│   │   │   ├── message_scanner_service.py # Module 2 SMS scanner
│   │   │   ├── job_scam_service.py   # Module 3 Recruitment scanner
│   │   │   ├── investment_scam_service.py # Module 4 Financial scanner
│   │   │   ├── email_scam_service.py # Module 5 Email & EML parser
│   │   │   ├── rule_engine.py        # URL Heuristics engine
│   │   │   ├── ml_service.py         # URL Random Forest predictor
│   │   │   └── scorer.py             # Unified 4-tier risk scorer
│   │   └── main.py                   # FastAPI application & demonstration seeding
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── ScamResultCard.jsx# Reusable explainable report card with PDF/JSON export
│   │   │   │   └── AuthModal.jsx     # Security analyst registration & login modal
│   │   │   └── layout/
│   │   │       ├── Sidebar.jsx       # 11-view SOC navigation bar
│   │   │       └── TopNavbar.jsx     # Header with status & analyst profile
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx         # Multi-channel SOC overview with Recharts
│   │   │   ├── Scanner.jsx           # Module 1 URL Scanner
│   │   │   ├── MessageScanner.jsx    # Module 2 AI Message Scam Detector
│   │   │   ├── JobScanner.jsx        # Module 3 Fake Job & Internship Detector
│   │   │   ├── InvestmentScanner.jsx # Module 4 Investment Scam Detector
│   │   │   ├── EmailScanner.jsx      # Module 5 Email Phishing & Header Forensics
│   │   │   ├── ScamDNA.jsx           # Module 6 Central SCAM DNA Engine
│   │   │   ├── History.jsx           # Unified multi-channel audit trail
│   │   │   ├── Learn.jsx             # Scam Awareness Academy & IQ Quiz
│   │   │   ├── ThreatIntel.jsx       # Threat Intelligence feeds
│   │   │   └── PhishTrace.jsx        # Infrastructure mapping workstation
│   │   └── services/api.js           # API client with complete client-side fallbacks
├── tests/
│   ├── test_url_scanner.py
│   ├── test_message_scanner.py
│   ├── test_job_scam.py
│   ├── test_investment_scam.py
│   ├── test_email_scam.py
│   ├── test_auth_security.py
│   └── run_all_tests.py              # Master test suite runner
└── README.md
```

---

## Verification & Testing

Catch the Phish includes a comprehensive automated test suite. Execute tests from the workspace root:

```bash
python tests/run_all_tests.py
```

### Test Suite Execution Output
```text
=================================================================
  CATCH THE PHISH: FULL PLATFORM TEST SUITE EXECUTION
=================================================================
test_expired_token_rejection (test_auth_security.TestAuthSecurity) ... ok
test_jwt_token_creation_and_payload (test_auth_security.TestAuthSecurity) ... ok
test_password_hashing_and_verification (test_auth_security.TestAuthSecurity) ... ok
test_tampered_token_rejection (test_auth_security.TestAuthSecurity) ... ok
test_clean_internal_email (test_email_scam.TestEmailScamDetector) ... ok
test_display_name_spoof_with_executable_attachment (test_email_scam.TestEmailScamDetector) ... ok
test_advance_withdrawal_fee_trap (test_investment_scam.TestInvestmentScamDetector) ... ok
test_clean_financial_commentary (test_investment_scam.TestInvestmentScamDetector) ... ok
test_guaranteed_return_crypto_ponzi (test_investment_scam.TestInvestmentScamDetector) ... ok
test_clean_legitimate_job_posting (test_job_scam.TestJobScamDetector) ... ok
test_fake_internship_with_upfront_registration_fee (test_job_scam.TestJobScamDetector) ... ok
test_guaranteed_selection_no_interview (test_job_scam.TestJobScamDetector) ... ok
test_clean_message (test_message_scanner.TestMessageScanner) ... ok
test_kyc_and_otp_banking_fraud (test_message_scanner.TestMessageScanner) ... ok
test_lottery_prize_lure (test_message_scanner.TestMessageScanner) ... ok
test_clean_legitimate_url (test_url_scanner.TestURLScanner) ... ok
test_phishing_brand_impersonation_url (test_url_scanner.TestURLScanner) ... ok
test_raw_ip_address_host (test_url_scanner.TestURLScanner) ... ok

Ran 18 tests in 1.95s
[SUCCESS] All test suites passed with zero errors!
```

---

## Installation & Local Execution

### 1. Backend Server (FastAPI)
```bash
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
Default Demonstration Analyst Account (**local development only** — it is never created when
`APP_ENV=production`; see `docs/DEPLOYMENT.md`):
- **Email**: `analyst@catchthephish.io`
- **Password**: `CyberGuard2026!`

### 2. Frontend Development Server (React + Vite)
```bash
cd frontend
npm.cmd run dev
```

### 3. Vercel Cloud Deployment
Deploy directly using the 1-click script:
```bash
deploy-to-vercel.bat
```
Or execute via CLI:
```bash
cd frontend && npm run build && npx vercel --prod
```
Live Production URL: [https://catch-the-phish-app.vercel.app](https://catch-the-phish-app.vercel.app)
