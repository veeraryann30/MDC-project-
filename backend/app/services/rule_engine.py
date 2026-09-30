"""
Rule-Based Security Engine & Explainable AI Generator for Catch the Phish
Analyzes extracted features against cybersecurity heuristics and generates
clear, educational explanations formatted for non-technical users and analysts alike.
"""

from typing import Dict, Any, List, Tuple

class RuleEngineService:
    @staticmethod
    def evaluate(features: Dict[str, Any], details: Dict[str, Any]) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], float]:
        """
        Evaluates features and returns:
        1. threats_detected: List of triggered threat indicators with detailed explainability
        2. safe_indicators: List of reassuring positive security signals
        3. rule_score: Calculated risk score (0 to 100) based on heuristics
        """
        threats = []
        safe_signals = []
        raw_penalty = 0.0

        # 1. Brand Impersonation Check (Critical / High)
        brand_data = details.get("brand_analysis", {})
        if brand_data.get("impersonation_detected", False):
            brands = ", ".join(brand_data.get("brands", []))
            first_detail = brand_data.get("details", ["Suspicious brand resemblance"])[0]
            threats.append({
                "id": "brand_impersonation",
                "title": f"Possible Brand Impersonation ({brands.title()})",
                "severity": "HIGH",
                "category": "Domain & Identity",
                "what_was_detected": f"The domain or URL mimics '{brands}' without belonging to its verified official domain ({first_detail}).",
                "why_it_matters": "Attackers disguise fake websites to look like trusted brands to trick victims into surrendering passwords or credit cards.",
                "how_attackers_use_it": "They register lookalike domains with slight typos (typosquatting), character replacements (e.g. '0' for 'o', '1' for 'l'), or inject brand names into subdomains.",
                "what_to_do": f"Do not enter passwords or personal data. Open a new browser tab and navigate directly to the verified website of {brands.title()}."
            })
            raw_penalty += 35.0

        # 2. IP Address in Place of Domain (High)
        if features.get("is_ip_address", 0) == 1:
            threats.append({
                "id": "ip_address_host",
                "title": "Raw IP Address Used Instead of Domain Name",
                "severity": "HIGH",
                "category": "Network & Host",
                "what_was_detected": f"The URL links directly to a numeric IP address ({details.get('domain')}) rather than a registered domain name.",
                "why_it_matters": "Legitimate organizations always use registered domain names. Direct IP addresses are commonly used to bypass domain reputation blocklists and evade takedowns.",
                "how_attackers_use_it": "Cybercriminals host temporary rogue servers or infected computers without registering a legitimate domain to hide their identity.",
                "what_to_do": "Never enter credentials or download files from raw IP address links. Close the page immediately."
            })
            raw_penalty += 30.0

        # 3. Non-Standard / Suspicious Port (Medium-High)
        if features.get("has_suspicious_port", 0) == 1:
            port = details.get("port")
            threats.append({
                "id": "suspicious_port",
                "title": f"Non-Standard Port ({port}) Detected",
                "severity": "MEDIUM",
                "category": "Network & Host",
                "what_was_detected": f"The connection uses port {port} instead of standard web ports (80 for HTTP or 443 for HTTPS).",
                "why_it_matters": "Public web services rarely run on non-standard ports. Attackers frequently use alternative ports to bypass corporate firewalls and run rogue proxy servers.",
                "how_attackers_use_it": "Threat actors launch disposable web servers on custom ports (e.g., 8080, 8888, 4444) on compromised infrastructure.",
                "what_to_do": "Exercise high caution. Verify why the service is hosted on an uncommon port before proceeding."
            })
            raw_penalty += 20.0

        # 4. Punycode / IDN Homograph Attack (High)
        if features.get("has_punycode", 0) == 1:
            threats.append({
                "id": "punycode_homograph",
                "title": "Punycode / IDN Homograph Obfuscation",
                "severity": "HIGH",
                "category": "Domain & Identity",
                "what_was_detected": "The domain contains 'xn--', which indicates Punycode encoding of internationalized characters.",
                "why_it_matters": "Punycode enables visual deception. Cyrillic or Greek letters can look virtually identical to Latin letters in a browser bar (e.g. Cyrillic 'а' looks identical to Latin 'a').",
                "how_attackers_use_it": "Attackers register domains that look identical to genuine sites to deceive human eyes into thinking they are visiting Google, Apple, or Bank of America.",
                "what_to_do": "Inspect the address carefully. Do not trust the visual appearance of international characters in domain names."
            })
            raw_penalty += 30.0

        # 5. URL Shortener (Medium)
        if features.get("is_shortener", 0) == 1:
            threats.append({
                "id": "url_shortener",
                "title": "Shortened / Masked URL",
                "severity": "MEDIUM",
                "category": "Structure & Obfuscation",
                "what_was_detected": f"The domain '{details.get('domain')}' is a recognized URL shortening service.",
                "why_it_matters": "Shortened links obscure the final destination website, making it impossible to see where the link truly leads before clicking.",
                "how_attackers_use_it": "Phishers use URL shorteners in phishing emails and SMS (smishing) messages to slip past spam filters and conceal malicious domains.",
                "what_to_do": "Use a link unshortener or URL expander to preview the actual destination URL before opening it."
            })
            raw_penalty += 15.0

        # 6. High-Abuse / Suspicious TLD (Medium)
        if features.get("has_suspicious_tld", 0) == 1:
            tld = details.get("tld")
            threats.append({
                "id": "suspicious_tld",
                "title": f"High-Risk Top Level Domain (.{tld})",
                "severity": "MEDIUM",
                "category": "Domain & Identity",
                "what_was_detected": f"The domain uses the '.{tld}' extension, which has a documented history of disproportionately high malicious abuse.",
                "why_it_matters": "Certain TLDs offer free or ultra-cheap registrations with minimal identity verification, making them favorites for bulk disposable phishing campaigns.",
                "how_attackers_use_it": "Attackers register dozens of throwaway domains under cheap TLDs to bypass reputation filters until the domains get blacklisted.",
                "what_to_do": "Be extra vigilant with unfamiliar TLDs. Reputable financial institutions and services rarely use these extensions."
            })
            raw_penalty += 20.0

        # 7. Excessive Subdomains (Medium)
        sub_count = features.get("subdomain_count", 0)
        if sub_count >= 3:
            threats.append({
                "id": "excessive_subdomains",
                "title": f"Excessive Subdomain Stacking ({sub_count} Levels)",
                "severity": "MEDIUM",
                "category": "Structure & Obfuscation",
                "what_was_detected": f"The domain contains {sub_count} subdomain segments, forming an unusually convoluted hostname structure.",
                "why_it_matters": "Attackers stack subdomains to push the real root domain off-screen on mobile devices or embed legitimate brand keywords in early labels.",
                "how_attackers_use_it": "For example, 'paypal.com.verify.account-security.attacker.xyz' tricks a user into reading 'paypal.com' while the real owner is 'attacker.xyz'.",
                "what_to_do": "Look at the very end of the domain (just before the first single '/') to identify the true root domain owner."
            })
            raw_penalty += 18.0

        # 8. '@' Symbol Credential Spoofing (High)
        if features.get("has_at_symbol", 0) == 1:
            threats.append({
                "id": "at_symbol_trick",
                "title": "Embedded '@' Symbol in URL",
                "severity": "HIGH",
                "category": "Structure & Obfuscation",
                "what_was_detected": "The URL contains an '@' character within the host authority section.",
                "why_it_matters": "In internet URL standards, everything before the '@' is treated as username information and ignored by web servers, while the real destination is after the '@'.",
                "how_attackers_use_it": "Attackers craft links like 'http://bank.com@malicious-site.com' to deceive users into believing they are visiting 'bank.com'.",
                "what_to_do": "Never click URLs containing '@'. It is almost universally used for deception in consumer links."
            })
            raw_penalty += 35.0

        # 9. Credential Harvesting & Urgency Keywords (Medium)
        matched_kw = details.get("matched_keywords", [])
        if len(matched_kw) >= 2 or ("login" in matched_kw and "account" in matched_kw):
            kw_list = ", ".join(matched_kw)
            threats.append({
                "id": "credential_keywords",
                "title": f"Suspicious Authentication Keywords ({kw_list})",
                "severity": "MEDIUM",
                "category": "Social Engineering",
                "what_was_detected": f"The URL incorporates sensitive authentication terms: {kw_list}.",
                "why_it_matters": "While legitimate portals also use login keywords, their presence on unrecognized or third-party domains strongly suggests credential harvesting.",
                "how_attackers_use_it": "Attackers create spoofed login gates designed to capture usernames, one-time passwords (OTP), and security questions.",
                "what_to_do": "Verify the authenticity of the root domain before typing any credentials or personal identifiers."
            })
            raw_penalty += 15.0
        elif len(matched_kw) == 1:
            raw_penalty += 6.0

        # 10. Insecure Transport / Missing HTTPS (Low-Medium)
        if features.get("has_https", 0) == 0:
            threats.append({
                "id": "http_insecure_transport",
                "title": "Insecure HTTP Protocol (No SSL/TLS Encryption)",
                "severity": "LOW",
                "category": "Transport Security",
                "what_was_detected": "The connection uses unencrypted plain HTTP instead of HTTPS.",
                "why_it_matters": "Data transmitted over plain HTTP is unencrypted and vulnerable to eavesdropping and Man-in-the-Middle (MITM) tampering.",
                "how_attackers_use_it": "Phishing sites and malicious redirection hubs often skip TLS certificates or operate ephemeral HTTP gateways.",
                "what_to_do": "Never enter passwords or private data on unencrypted HTTP websites."
            })
            raw_penalty += 12.0
        else:
            safe_signals.append({
                "id": "https_present",
                "title": "HTTPS Encryption Active",
                "severity": "INFORMATIONAL",
                "category": "Transport Security",
                "what_was_detected": "The connection uses HTTPS with TLS encryption.",
                "why_it_matters": "Connection is encrypted between browser and server.",
                "how_attackers_use_it": "Note: Over 80% of modern phishing sites now also obtain free SSL certificates. HTTPS guarantees encryption, NOT trustworthiness.",
                "what_to_do": "Remember: HTTPS means your connection is private, not that the site is safe."
            })

        # 11. Double Slash Redirect Trick
        if features.get("has_double_slash_redirect", 0) == 1:
            threats.append({
                "id": "double_slash_redirect",
                "title": "Double Slash Path Redirection Indicator",
                "severity": "MEDIUM",
                "category": "Structure & Obfuscation",
                "what_was_detected": "The URL path contains '//' after the protocol specification.",
                "why_it_matters": "Double slashes inside path parameters are frequently utilized to trigger open redirect vulnerabilities or confuse URL parsers.",
                "how_attackers_use_it": "Attackers abuse trusted open redirectors (e.g., legitimate-site.com//evil.com) to bypass web filters.",
                "what_to_do": "Verify whether the link redirects to a different destination than the one displayed."
            })
            raw_penalty += 15.0

        # 12. High Randomness / Domain Entropy
        if features.get("domain_entropy", 0.0) >= 4.2 and features.get("domain_length", 0) > 15:
            threats.append({
                "id": "high_entropy_domain",
                "title": "Unusual Domain Randomness (High Shannon Entropy)",
                "severity": "LOW",
                "category": "Domain & Identity",
                "what_was_detected": f"The domain string exhibits an unusually random character distribution (Entropy: {features.get('domain_entropy')}).",
                "why_it_matters": "High randomness is a signature of Domain Generation Algorithms (DGA) used by malware command-and-control and disposable phishing networks.",
                "how_attackers_use_it": "Automated attack kits generate pseudo-random domain names to evade static reputation filters.",
                "what_to_do": "Scrutinize the organization behind randomly generated web addresses."
            })
            raw_penalty += 10.0

        # 13. Reassuring Clean Indicators if no threats
        if not threats:
            safe_signals.append({
                "id": "clean_domain_structure",
                "title": "Standard Domain Structure",
                "severity": "INFORMATIONAL",
                "category": "Domain & Identity",
                "what_was_detected": "The domain structure is standard with no anomalous subdomains, typosquats, or character masking.",
                "why_it_matters": "Absence of obfuscation tactics aligns with legitimate websites.",
                "how_attackers_use_it": "N/A - Positive indicator.",
                "what_to_do": "Normal safety practices still apply."
            })

        # Bound rule score between 0 and 100
        rule_score = min(100.0, max(0.0, round(raw_penalty, 1)))
        return threats, safe_signals, rule_score
