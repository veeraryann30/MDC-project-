"""
Dataset Builder for Catch the Phish ML Pipeline
Generates or loads a comprehensive, balanced dataset of legitimate and phishing URLs
covering diverse attack vectors and benign website patterns.
"""

import os
import random
import pandas as pd
from typing import List, Tuple

# Representative legitimate base domains across diverse industries & TLDs
LEGITIMATE_DOMAINS = [
    "google.com", "youtube.com", "facebook.com", "wikipedia.org", "amazon.com",
    "reddit.com", "netflix.com", "yahoo.com", "twitter.com", "instagram.com",
    "linkedin.com", "github.com", "microsoft.com", "apple.com", "stackoverflow.com",
    "nytimes.com", "cnn.com", "bbc.co.uk", "medium.com", "cloudflare.com",
    "mozilla.org", "adobe.com", "wordpress.org", "spotify.com", "dropbox.com",
    "salesforce.com", "twitch.tv", "ebay.com", "zoom.us", "quora.com",
    "aliexpress.com", "imgur.com", "tumblr.com", "pinterest.com", "nih.gov",
    "stanford.edu", "mit.edu", "harvard.edu", "nasa.gov", "who.int",
    "weather.com", "imdb.com", "booking.com", "airbnb.com", "forbes.com",
    "theguardian.com", "huffpost.com", "espn.com", "nature.com", "sciencedirect.com",
    "reuters.com", "bloomberg.com", "wsj.com", "bbc.com", "britannica.com",
    "craigslist.org", "etsy.com", "coursera.org", "udemy.com", "khanacademy.org"
]

LEGITIMATE_PATHS = [
    "",
    "about",
    "contact-us",
    "articles/2024/tech-overview",
    "search?q=cybersecurity+research",
    "products/category/hardware",
    "docs/api/v2/reference",
    "wiki/Artificial_intelligence",
    "watch?v=dQw4w9WgXcQ",
    "feed/rss.xml",
    "blog/posts/getting-started-with-python",
    "profile/user1234",
    "questions/54321/how-to-optimize-performance",
    "explore/trending/topics",
    "help/support/faq",
    "news/world/technology-updates",
    "events/annual-conference-registration",
    "publications/scientific-paper-2024.pdf",
    "download/release-notes-v1.4.0",
    "privacy-policy.html",
    "terms-of-service",
    "courses/computer-science-101",
    "catalog/items?page=2&sort=asc",
    "community/discussions/general",
    "gallery/nature-photography"
]

PHISHING_PATTERNS = [
    # 1. Lookalike brand domains / typosquatting
    ("http://paypa1-account-verification.xyz/login.php", 1),
    ("http://micros0ft-security-update.top/auth/login", 1),
    ("http://app1e-id-verify.com.account-recovery.xyz/login", 1),
    ("http://g00gle-drive-shared-file.cf/document/view", 1),
    ("http://netf1ix-billing-update.com/signin", 1),
    ("http://amaz0n-security-alert.work/account/suspend", 1),
    ("http://chase-bank-verify-identity.ml/secure/banking", 1),
    ("http://wellsfarg0-online-access.ga/login.asp", 1),
    ("http://binaance-wallet-connect.top/auth/verify", 1),
    ("http://c0inbase-airdrop-bonus.xyz/claim-tokens", 1),
    ("http://faceb00k-security-checkpoint.click/login", 1),
    ("http://instagraam-badge-verification.fit/login", 1),
    
    # 2. IP address hosts with non-standard ports
    ("http://192.168.1.105:8080/secure/login.php", 1),
    ("http://45.33.32.156:8888/banking/auth.asp", 1),
    ("http://185.220.101.5:4444/paypal/signin.html", 1),
    ("http://103.251.167.20:8000/apple/id/verify", 1),
    ("http://194.67.210.12/webscr/login?cmd=_login-run", 1),
    ("http://89.248.165.74:9090/update-account-credentials", 1),
    
    # 3. Excessive subdomains & brand embedding
    ("http://login.paypal.com.account.verify.auth.evilhost.com/cgi-bin", 1),
    ("http://secure.banking.chase.com.update.customer-session.xyz/auth", 1),
    ("http://account.apple.com.manage.security.id.suspicious-domain.top/id", 1),
    ("http://service.netflix.com.billing.update.card.payment-gateway.loan/pay", 1),
    ("http://microsoft.online.verify.user.credentials.tokens-verify.buzz/login", 1),
    
    # 4. Punycode & IDN homograph attacks
    ("http://xn--gogle-pra.com/signin/v2/identifier", 1),
    ("http://xn--pple-45a.com/icloud/find-my-iphone", 1),
    ("http://xn--paypa-fsa.com/cgi-bin/webscr", 1),
    ("http://xn--amazn-rqa.com/ap/signin", 1),
    
    # 5. Userinfo / @ symbol credential spoofing
    ("http://paypal.com@attacker-controlled-server.com/login", 1),
    ("http://google.com@auth-verification-service.xyz/account", 1),
    ("http://bankofamerica.com@phish-domain.top/signin", 1),
    
    # 6. Urgent social engineering keywords and bonus/free lures
    ("http://crypto-bonus-free-airdrop.xyz/claim-500-eth", 1),
    ("http://urgent-account-suspension-alert.top/verify-now", 1),
    ("http://instant-loan-approval-no-credit-check.click/apply", 1),
    ("http://lottery-winner-notification-claim-prize.buzz/claim", 1),
    ("http://secure-wallet-recovery-passphrase-seed.work/unlock", 1)
]


def generate_synthetic_corpus(sample_size: int = 3200) -> pd.DataFrame:
    """
    Generates a structured, balanced corpus of realistic URLs with high fidelity.
    Combines authentic base domains, typical corporate/academic/editorial paths,
    diverse query schemas, along with real phishing attack archetypes.
    """
    random.seed(42)
    urls: List[str] = []
    labels: List[int] = []
    
    half_size = sample_size // 2
    
    # --- Generate Legitimate URLs ---
    schemes = ["https://", "https://", "https://", "http://"] # Mostly HTTPS
    subdomain_prefixes = ["", "www.", "www.", "blog.", "support.", "api.", "docs.", "shop.", "news.", "m."]
    
    for _ in range(half_size):
        scheme = random.choice(schemes)
        domain = random.choice(LEGITIMATE_DOMAINS)
        sub = random.choice(subdomain_prefixes)
        
        # If domain already has sub, do not overstack
        if sub and ("." in domain.split(".")[0]):
            sub = ""
            
        path = random.choice(LEGITIMATE_PATHS)
        
        # Add realistic random query params occasionally
        if random.random() < 0.35 and "?" not in path:
            param_key = random.choice(["id", "page", "lang", "ref", "view", "category", "tab"])
            param_val = random.choice(["1", "tech", "en", "home", "detail", "item42", "recent"])
            query = f"?{param_key}={param_val}"
        else:
            query = ""
            
        full_url = f"{scheme}{sub}{domain}/{path}{query}".rstrip("/")
        urls.append(full_url)
        labels.append(0) # 0 = Legitimate / Safe
        
    # --- Generate Phishing URLs ---
    # 1. Include explicit curated seed phishing patterns
    for phish_url, label in PHISHING_PATTERNS:
        urls.append(phish_url)
        labels.append(label)
        
    remaining_phish = half_size - len(PHISHING_PATTERNS)
    
    suspicious_tlds = ["xyz", "top", "work", "click", "buzz", "loan", "fit", "icu", "monster", "cf", "gq", "ml"]
    target_brands = ["paypal", "google", "apple", "amazon", "netflix", "microsoft", "chase", "binance", "coinbase", "wellsfargo"]
    typo_subs = {"o": "0", "l": "1", "e": "3", "a": "4", "s": "5"}
    phish_keywords = ["login", "signin", "verify", "account", "security", "update", "banking", "wallet", "confirm"]
    phish_paths = [
        "login.php", "signin.html", "account/verify", "auth/secure-login",
        "webscr?cmd=_login-run", "checkpoint/update", "confirm-identity",
        "wallet/unlock-passphrase", "security/restore-account", "billing/update-card",
        "verification/step2", "cgi-bin/account_update.asp"
    ]
    
    for i in range(remaining_phish):
        pattern_type = random.choice(["brand_typo", "subdomain_stack", "ip_host", "keyword_combo", "tld_abuse"])
        
        if pattern_type == "brand_typo":
            brand = random.choice(target_brands)
            # Typosquat brand
            chars = list(brand)
            for idx, c in enumerate(chars):
                if c in typo_subs and random.random() < 0.7:
                    chars[idx] = typo_subs[c]
                    break
            typo_brand = "".join(chars)
            tld = random.choice(suspicious_tlds)
            path = random.choice(phish_paths)
            url = f"http://{typo_brand}-{random.choice(phish_keywords)}.{tld}/{path}"
            
        elif pattern_type == "subdomain_stack":
            brand = random.choice(target_brands)
            kw = random.choice(phish_keywords)
            tld = random.choice(suspicious_tlds)
            fake_host = f"{kw}.{brand}.com.customer-security-alert-{random.randint(10, 99)}.{tld}"
            path = random.choice(phish_paths)
            url = f"http://{fake_host}/{path}"
            
        elif pattern_type == "ip_host":
            ip = f"{random.randint(11, 220)}.{random.randint(1, 254)}.{random.randint(1, 254)}.{random.randint(1, 254)}"
            port = random.choice(["", ":8080", ":8443", ":8888", ":9090", ":4444"])
            kw = random.choice(phish_keywords)
            url = f"http://{ip}{port}/{kw}/session-{random.randint(1000, 9999)}/verify.html"
            
        elif pattern_type == "tld_abuse":
            brand = random.choice(target_brands)
            tld = random.choice(suspicious_tlds)
            action = random.choice(["secure-support", "helpdesk-center", "recovery-portal", "notice-resolution"])
            url = f"http://{brand}-{action}.{tld}/{random.choice(phish_paths)}?token={random.randint(100000, 999999)}"
            
        else: # keyword_combo
            kw1 = random.choice(phish_keywords)
            kw2 = random.choice(phish_keywords)
            tld = random.choice(suspicious_tlds)
            url = f"http://free-{kw1}-{kw2}-bonus.{tld}/claim?user_id={random.randint(1000, 9999)}"
            
        urls.append(url)
        labels.append(1)
        
    df = pd.DataFrame({"url": urls, "label": labels})
    # Shuffle
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)
    return df


def build_and_save_dataset(filepath: str = "ml/dataset/urls_dataset.csv", sample_size: int = 3400) -> str:
    """Builds and writes dataset CSV to disk."""
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    df = generate_synthetic_corpus(sample_size=sample_size)
    df.to_csv(filepath, index=False)
    print(f"[*] Dataset successfully generated and saved to {filepath}")
    print(f"[*] Total rows: {len(df)} | Legitimate (0): {sum(df['label'] == 0)} | Phishing (1): {sum(df['label'] == 1)}")
    return filepath


if __name__ == "__main__":
    build_and_save_dataset()
