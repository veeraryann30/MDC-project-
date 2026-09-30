# Catch the Phish - Machine Learning Datasets

This folder stores the training and evaluation datasets for the Catch the Phish ML pipeline.

## 1. Default Dataset: `urls_dataset.csv`
- Generated using `python ml/dataset/dataset_builder.py`
- Contains balanced samples (3,400+ entries) of:
  - **Legitimate URLs (label = 0)**: Top domains, multi-level paths, safe query schemes, legitimate subdomains.
  - **Phishing URLs (label = 1)**: Typosquatted brand domains, character substitutions, IP-based URLs with non-standard ports, excessive subdomains, brand-in-subdomain spoofing, high-abuse TLDs, punycode strings, and credential theft vectors.

## 2. Format Specification
Any custom external dataset must follow this CSV format:
```csv
url,label
https://www.google.com,0
http://paypa1-security-verification.xyz/login.php,1
```
- `url`: Full URL string (e.g. `http://...` or `https://...`)
- `label`: `0` for Safe / Legitimate, `1` for Phishing / High-Risk

## 3. Integrating Public Benchmarks
You can drop in datasets from:
- **PhishTank**: (phishtank.org - Verified online phishing URLs)
- **Kaggle Phishing URLs**: (e.g. `taruntiwarihp/phishing-site-urls` or `sid321axn/malicious-urls-dataset`)
- **ISCX-URL2016**: UNB malicious URL dataset

After replacing or appending to `urls_dataset.csv`, run:
```bash
python ml/training/train.py
```
This re-extracts the 34 lexical and security features, cross-validates, retrains the Random Forest and Logistic Regression models, updates evaluation metrics, and saves the new `.joblib` model.
