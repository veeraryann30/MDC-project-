"""
URL Feature Extractor for Catch the Phish
Extracts lexical, structural, security, and keyword features from untrusted URLs
WITHOUT ever opening or making network connections to the target.
"""

import math
import re
from urllib.parse import urlparse, parse_qs
from typing import Dict, Any, List

# Suspicious TLDs with high historical abuse rates in phishing
SUSPICIOUS_TLDS = {
    "xyz", "top", "tk", "ml", "ga", "cf", "gq", "work", "loan", 
    "click", "fit", "buzz", "country", "kim", "science", "party", 
    "gdn", "mom", "date", "racing", "win", "stream", "bid", "men",
    "download", "accountant", "faith", "cricket", "trade", "vip", "icu",
    "monster", "rest", "cam"
}

# Known URL shorteners
SHORTENER_DOMAINS = {
    "bit.ly", "tinyurl.com", "goo.gl", "t.co", "is.gd", "buff.ly",
    "ow.ly", "adf.ly", "bit.do", "mcaf.ee", "rebrand.ly", "cutt.ly",
    "tiny.cc", "lnkd.in", "db.tt", "qr.ae", "trib.al", "shorturl.at"
}

# Suspicious keywords commonly seen in credential harvesting and social engineering
SUSPICIOUS_KEYWORDS = [
    "login", "signin", "verify", "verification", "account", "password",
    "update", "secure", "banking", "payment", "wallet", "confirm",
    "free", "bonus", "security", "admin", "webscr", "ebayisapi",
    "auth", "recover", "alert", "billing", "service", "support",
    "invoice", "credential", "suspend", "unlock", "passcode"
]

# Major brand names often impersonated in phishing attacks
TARGET_BRANDS = [
    "paypal", "google", "microsoft", "apple", "amazon", "netflix",
    "facebook", "meta", "instagram", "chase", "wellsfargo", "bankofamerica",
    "citi", "binance", "coinbase", "whatsapp", "telegram", "steam",
    "dropbox", "yahoo", "outlook", "office365", "dhl", "fedex", "usps"
]

# Official domain suffixes for brands to prevent false positives on legitimate domains
LEGITIMATE_BRAND_DOMAINS = {
    "paypal": ["paypal.com", "paypal.me"],
    "google": ["google.com", "google.co", "google.org", "gmail.com", "google.co.in", "google.co.uk"],
    "microsoft": ["microsoft.com", "live.com", "office.com", "office365.com", "azure.com"],
    "apple": ["apple.com", "icloud.com"],
    "amazon": ["amazon.com", "amazon.co.uk", "amazon.in", "aws.amazon.com"],
    "netflix": ["netflix.com"],
    "facebook": ["facebook.com", "fb.com", "meta.com"],
    "meta": ["meta.com", "facebook.com", "instagram.com"],
    "instagram": ["instagram.com"],
    "chase": ["chase.com"],
    "wellsfargo": ["wellsfargo.com"],
    "bankofamerica": ["bankofamerica.com", "bofa.com"],
    "citi": ["citi.com", "citibank.com"],
    "binance": ["binance.com"],
    "coinbase": ["coinbase.com"],
    "whatsapp": ["whatsapp.com"],
    "telegram": ["telegram.org", "t.me"],
    "steam": ["steampowered.com", "steamcommunity.com"],
    "dropbox": ["dropbox.com"],
    "yahoo": ["yahoo.com"],
    "outlook": ["outlook.com", "hotmail.com"],
    "office365": ["office365.com", "office.com"],
    "dhl": ["dhl.com"],
    "fedex": ["fedex.com"],
    "usps": ["usps.com"]
}


def calculate_entropy(text: str) -> float:
    """Calculates Shannon entropy of a string as a proxy for randomness."""
    if not text:
        return 0.0
    entropy = 0.0
    length = len(text)
    char_counts: Dict[str, int] = {}
    for c in text:
        char_counts[c] = char_counts.get(c, 0) + 1
    for count in char_counts.values():
        p = count / length
        entropy -= p * math.log2(p)
    return round(entropy, 4)


def is_ip_host(netloc: str) -> int:
    """Checks if hostname is an IPv4 or IPv6 address."""
    # Strip port if present
    host = netloc.split(":")[0].strip("[]")
    
    # IPv4 regex
    ipv4_pattern = r"^(\d{1,3}\.){3}\d{1,3}$"
    if re.match(ipv4_pattern, host):
        parts = host.split(".")
        if all(0 <= int(p) <= 255 for p in parts):
            return 1
            
    # IPv6 check
    if ":" in host and not host.endswith(":"):
        return 1
        
    # Hex or octal IP format check (e.g., 0x7f000001 or 0177.0.0.1)
    if re.match(r"^0x[0-9a-fA-F]+$", host) or re.match(r"^0\d+(\.0\d+)*$", host):
        return 1
        
    return 0


def levenshtein_distance(s1: str, s2: str) -> int:
    """Computes Levenshtein distance between two strings."""
    if len(s1) < len(s2):
        return levenshtein_distance(s2, s1)
    if len(s2) == 0:
        return len(s1)
        
    previous_row = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row
        
    return previous_row[-1]


def detect_brand_impersonation(domain: str, full_url: str) -> Dict[str, Any]:
    """
    Detects possible brand impersonation in domain or URL path.
    Looks for:
    - Homoglyphs/character substitutions (e.g., paypa1, micros0ft, app1e)
    - Levenshtein distance similarity to major brands
    - Target brand names placed in subdomains or misleading hyphenated combos
    """
    domain_lower = domain.lower()
    url_lower = full_url.lower()
    
    # Strip standard port
    clean_domain = domain_lower.split(":")[0]
    
    # Common character substitutions used by attackers
    substitutions = {
        '0': 'o', '1': 'l', '3': 'e', '4': 'a', '5': 's', 
        '@': 'a', 'v': 'u', 'vv': 'w', 'rn': 'm'
    }
    
    normalized_domain = clean_domain
    for char, rep in substitutions.items():
        normalized_domain = normalized_domain.replace(char, rep)
        
    detected_brands = []
    highest_severity = 0.0
    impersonation_details = []
    
    for brand in TARGET_BRANDS:
        legit_domains = LEGITIMATE_BRAND_DOMAINS.get(brand, [])
        is_legit = any(clean_domain == ld or clean_domain.endswith("." + ld) for ld in legit_domains)
        
        if is_legit:
            # Genuine official brand domain - skip
            continue
            
        # 1. Brand name in subdomain or hyphenated combo (e.g., paypal-verify.com, paypal.com.attacker.com)
        if brand in clean_domain:
            detected_brands.append(brand)
            highest_severity = max(highest_severity, 0.9)
            impersonation_details.append(f"Brand '{brand}' appears in untrusted domain '{clean_domain}'")
            continue
            
        # 2. Check normalized domain with character substitutions (e.g., paypa1 -> paypal)
        if brand in normalized_domain:
            detected_brands.append(brand)
            highest_severity = max(highest_severity, 0.95)
            impersonation_details.append(f"Character substitution mimics '{brand}' in '{clean_domain}'")
            continue
            
        # 3. Levenshtein distance on domain labels
        labels = clean_domain.split(".")
        main_label = labels[-2] if len(labels) >= 2 else labels[0]
        dist = levenshtein_distance(main_label, brand)
        if 1 <= dist <= 2 and abs(len(main_label) - len(brand)) <= 2:
            detected_brands.append(brand)
            highest_severity = max(highest_severity, 0.85)
            impersonation_details.append(f"Domain label '{main_label}' is typosquatted from '{brand}' (edit distance {dist})")
            continue
            
        # 4. Brand in path or query with login/verify keywords
        if brand in url_lower and any(kw in url_lower for kw in ["login", "verify", "account", "security"]):
            highest_severity = max(highest_severity, 0.6)
            detected_brands.append(brand)
            impersonation_details.append(f"Brand '{brand}' combined with credential keywords in URL path")
            
    return {
        "impersonation_detected": len(detected_brands) > 0,
        "brands": list(set(detected_brands)),
        "impersonation_score": highest_severity,
        "details": impersonation_details
    }


def extract_features(raw_url: str) -> Dict[str, Any]:
    """
    Extracts numerical and categorical feature vector for a URL.
    Returns:
    - raw_features: dict with human-readable and raw metrics
    - feature_vector: flat numerical dict suitable for ML model inference
    """
    url = raw_url.strip()
    if not re.match(r"^[a-zA-Z]+://", url):
        # Default to http:// for parsing purposes if protocol omitted
        parsed = urlparse("http://" + url)
        has_explicit_scheme = 0
        scheme = "http"
    else:
        parsed = urlparse(url)
        has_explicit_scheme = 1
        scheme = parsed.scheme.lower()
        
    netloc = parsed.netloc.lower()
    path = parsed.path
    query = parsed.query
    
    # Clean domain without port
    domain = netloc.split(":")[0]
    
    # 1. Basic length features
    url_length = len(url)
    domain_length = len(domain)
    path_length = len(path)
    query_length = len(query)
    
    # 2. Structural punctuation counts
    num_dots = url.count(".")
    num_hyphens = url.count("-")
    num_underscores = url.count("_")
    num_slashes = url.count("/")
    num_question_marks = url.count("?")
    num_equal_signs = url.count("=")
    num_ampersands = url.count("&")
    num_percent = url.count("%")
    
    # Subdirectories count
    path_segments = [seg for seg in path.split("/") if seg]
    num_subdirs = len(path_segments)
    
    # Query parameters count
    query_params = parse_qs(query)
    num_query_params = len(query_params)
    
    # Digits and special characters
    num_digits = sum(1 for c in url if c.isdigit())
    special_chars = set("!@#$%^&*()_+=-[]{}|;:,.<>?/~`")
    num_special_chars = sum(1 for c in url if c in special_chars)
    special_char_ratio = round(num_special_chars / max(url_length, 1), 4)
    digit_ratio = round(num_digits / max(url_length, 1), 4)
    
    # 3. Security features
    has_https = 1 if scheme == "https" else 0
    ip_host = is_ip_host(netloc)
    
    # Non-standard port check
    port = parsed.port
    has_suspicious_port = 0
    if port and port not in (80, 443):
        has_suspicious_port = 1
        
    # URL Shortener
    is_shortener = 1 if any(shortener in domain for shortener in SHORTENER_DOMAINS) else 0
    
    # Punycode / IDN Homograph
    has_punycode = 1 if "xn--" in domain else 0
    
    # Suspicious TLD
    tld = domain.split(".")[-1] if "." in domain else ""
    has_suspicious_tld = 1 if tld in SUSPICIOUS_TLDS else 0
    
    # Subdomain count
    domain_parts = domain.split(".")
    # Standard: example.com has 2 parts (subdomain_count = 0)
    # sub.example.com has 3 parts (subdomain_count = 1)
    subdomain_count = max(0, len(domain_parts) - 2) if not ip_host else 0
    has_excessive_subdomains = 1 if subdomain_count >= 3 else 0
    
    # '@' symbol check (userinfo credential hiding trick)
    has_at_symbol = 1 if "@" in url else 0
    
    # Double slash redirection in path
    has_double_slash_redirect = 1 if "//" in path else 0
    
    # Shannon Entropy
    url_entropy = calculate_entropy(url)
    domain_entropy = calculate_entropy(domain)
    
    # 4. Keyword features
    url_lower = url.lower()
    matched_keywords = [kw for kw in SUSPICIOUS_KEYWORDS if kw in url_lower]
    num_keywords = len(matched_keywords)
    has_login_keyword = 1 if ("login" in url_lower or "signin" in url_lower) else 0
    has_verify_keyword = 1 if ("verify" in url_lower or "verification" in url_lower) else 0
    has_banking_keyword = 1 if ("banking" in url_lower or "payment" in url_lower or "wallet" in url_lower) else 0
    has_account_keyword = 1 if ("account" in url_lower or "password" in url_lower or "security" in url_lower) else 0
    
    # 5. Brand Impersonation check
    brand_check = detect_brand_impersonation(domain, url)
    brand_impersonation_detected = 1 if brand_check["impersonation_detected"] else 0
    brand_score = brand_check["impersonation_score"]
    
    # Flat numerical dictionary representing the feature vector for Scikit-Learn
    feature_vector = {
        "url_length": url_length,
        "domain_length": domain_length,
        "path_length": path_length,
        "query_length": query_length,
        "num_dots": num_dots,
        "num_hyphens": num_hyphens,
        "num_underscores": num_underscores,
        "num_slashes": num_slashes,
        "num_digits": num_digits,
        "num_special_chars": num_special_chars,
        "special_char_ratio": special_char_ratio,
        "digit_ratio": digit_ratio,
        "num_subdirs": num_subdirs,
        "num_query_params": num_query_params,
        "has_https": has_https,
        "is_ip_address": ip_host,
        "has_suspicious_port": has_suspicious_port,
        "is_shortener": is_shortener,
        "has_punycode": has_punycode,
        "has_suspicious_tld": has_suspicious_tld,
        "subdomain_count": subdomain_count,
        "has_excessive_subdomains": has_excessive_subdomains,
        "has_at_symbol": has_at_symbol,
        "has_double_slash_redirect": has_double_slash_redirect,
        "num_percent_encoded": num_percent,
        "url_entropy": url_entropy,
        "domain_entropy": domain_entropy,
        "num_keywords": num_keywords,
        "has_login_keyword": has_login_keyword,
        "has_verify_keyword": has_verify_keyword,
        "has_banking_keyword": has_banking_keyword,
        "has_account_keyword": has_account_keyword,
        "brand_impersonation_detected": brand_impersonation_detected,
        "brand_score": brand_score
    }
    
    # Detailed metadata for UI inspection and explainability
    raw_details = {
        "url": url,
        "scheme": scheme,
        "domain": domain,
        "path": path,
        "query": query,
        "tld": tld,
        "port": port,
        "matched_keywords": matched_keywords,
        "brand_analysis": brand_check,
        "entropy": {
            "url_entropy": url_entropy,
            "domain_entropy": domain_entropy
        }
    }
    
    return {
        "features": feature_vector,
        "details": raw_details
    }


# Standard list of feature names in fixed order for ML training and inference consistency
FEATURE_NAMES = [
    "url_length",
    "domain_length",
    "path_length",
    "query_length",
    "num_dots",
    "num_hyphens",
    "num_underscores",
    "num_slashes",
    "num_digits",
    "num_special_chars",
    "special_char_ratio",
    "digit_ratio",
    "num_subdirs",
    "num_query_params",
    "has_https",
    "is_ip_address",
    "has_suspicious_port",
    "is_shortener",
    "has_punycode",
    "has_suspicious_tld",
    "subdomain_count",
    "has_excessive_subdomains",
    "has_at_symbol",
    "has_double_slash_redirect",
    "num_percent_encoded",
    "url_entropy",
    "domain_entropy",
    "num_keywords",
    "has_login_keyword",
    "has_verify_keyword",
    "has_banking_keyword",
    "has_account_keyword",
    "brand_impersonation_detected",
    "brand_score"
]
