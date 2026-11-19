"""
Email Phishing & Header Analyzer for Catch the Phish (Module 5)
Zero-execution parser for raw RFC 822 email content, .eml files, and email headers.
Evaluates SPF/DKIM/DMARC evidence, display name spoofing, embedded URLs,
and attachment metadata without executing code.
"""

import re
import email
from email import policy
from typing import Dict, Any, List, Optional
from backend.app.services.nlp_engine import NLPEngine
from backend.app.services.email_origin_service import EmailOriginService
from backend.app.services.scam_dna_service import ScamDNAService
from backend.app.services.scorer import ScorerService
from ml.features.extractor import extract_features
from backend.app.services.rule_engine import RuleEngineService
from backend.app.services.ml_service import MLService

# Suspicious file extensions
DANGEROUS_EXTENSIONS = {
    ".exe", ".scr", ".vbs", ".bat", ".cmd", ".hta", ".js", ".jse",
    ".wsf", ".ps1", ".iso", ".img", ".dmg", ".jar", ".cpl", ".msc"
}
MACRO_EXTENSIONS = {".docm", ".xlsm", ".pptm", ".dotm"}


class EmailScamService:

    @classmethod
    def analyze_raw_email(cls, raw_content: str) -> Dict[str, Any]:
        """
        Parses raw .eml RFC 822 string or pasted email text safely.
        """
        if not raw_content or len(raw_content.strip()) < 10:
            return {
                "risk_score": 0.0,
                "risk_tier": "INCONCLUSIVE",
                "risk_tier_label": "Inconclusive / Empty Email",
                "email_verdict": "Inconclusive",
                "detected_indicators": [],
                "highlighted_phrases": [],
                "headers": {},
                "auth_results": {},
                "embedded_urls": [],
                "attachments": [],
                "explanation": "Please provide raw email headers, an .eml file content, or pasted email body.",
                "recommended_actions": ["Submit the full email headers and body for forensic analysis."]
            }

        # 1. Parse using Python's standard email parser in default safe policy
        msg = email.message_from_string(raw_content, policy=policy.default)

        # Extract primary headers
        from_hdr = msg.get("From", "")
        reply_to = msg.get("Reply-To", "")
        return_path = msg.get("Return-Path", "")
        subject = msg.get("Subject", "")
        date_hdr = msg.get("Date", "")
        auth_hdr = msg.get("Authentication-Results", "")
        spf_hdr = msg.get("Received-SPF", "")

        # Extract body text safely
        body_text = ""
        attachments = []

        if msg.is_multipart():
            for part in msg.walk():
                content_type = part.get_content_type()
                disposition = str(part.get("Content-Disposition", ""))
                filename = part.get_filename()

                # If it is an attachment, inspect metadata safely (NEVER execute or load into memory)
                if filename or "attachment" in disposition:
                    fn = filename or "unnamed_attachment"
                    ext = "." + fn.split(".")[-1].lower() if "." in fn else ""
                    size = len(part.get_payload(decode=True) or b"")
                    is_dangerous = ext in DANGEROUS_EXTENSIONS or ext in MACRO_EXTENSIONS
                    has_double_extension = bool(re.search(r"\.[a-zA-Z0-9]{2,4}\.(exe|scr|vbs|bat|js)$", fn, re.IGNORECASE))

                    attachments.append({
                        "filename": fn,
                        "extension": ext,
                        "size_bytes": size,
                        "size_readable": f"{round(size / 1024, 1)} KB" if size > 1024 else f"{size} B",
                        "content_type": content_type,
                        "is_dangerous": is_dangerous or has_double_extension,
                        "has_double_extension": has_double_extension
                    })
                elif content_type in ["text/plain", "text/html"]:
                    payload = part.get_payload(decode=True)
                    if payload:
                        try:
                            body_text += " " + payload.decode("utf-8", errors="replace")
                        except Exception:
                            pass
        else:
            payload = msg.get_payload(decode=True)
            if payload:
                body_text = payload.decode("utf-8", errors="replace")
            else:
                body_text = raw_content

        # Clean HTML tags from body text for NLP scanning
        clean_body = re.sub(r"<[^>]+>", " ", body_text)
        clean_body = re.sub(r"\s+", " ", clean_body).strip()
        if not clean_body:
            clean_body = raw_content

        # 2. Extract Authentication Evidence (SPF, DKIM, DMARC)
        auth_evidence = cls._parse_auth_headers(auth_hdr, spf_hdr, raw_content)

        # 3. Analyze Sender & Spoofing Markers
        sender_analysis = cls._analyze_sender(from_hdr, reply_to, return_path)

        # 4. Extract and analyze embedded links
        embedded_raw_urls = NLPEngine.extract_urls(clean_body)
        inspected_urls = []
        url_risk_boost = 0.0

        for u in embedded_raw_urls[:4]:
            try:
                extracted = extract_features(u)
                u_features = extracted["features"]
                u_details = extracted["details"]
                _, _, u_rule_score = RuleEngineService.evaluate(u_features, u_details)
                u_ml_score, _ = MLService.predict(u_features)
                u_risk = max(u_rule_score, u_ml_score)
                inspected_urls.append({
                    "url": u,
                    "domain": u_details["domain"],
                    "risk_score": u_risk,
                    "is_suspicious": u_risk >= 50.0
                })
                if u_risk >= 65.0:
                    url_risk_boost = max(url_risk_boost, 30.0)
            except Exception:
                inspected_urls.append({"url": u, "domain": "Unknown", "risk_score": 0.0, "is_suspicious": False})

        # 5. Run NLP & Scam DNA
        context_meta = {
            "auth_mismatch": sender_analysis["is_spoofed"] or auth_evidence["spf_status"] == "FAIL",
            "auth_mismatch_detail": sender_analysis.get("spoof_reason", "Header and sender mismatch detected.")
        }
        dna_result = ScamDNAService.analyze(clean_body, context_meta)

        # 6. Aggregate Threat Indicators
        email_threats = []

        # Attachment threats
        for att in attachments:
            if att["is_dangerous"]:
                email_threats.append({
                    "id": "malicious_attachment_extension",
                    "title": f"High-Risk Attachment ({att['filename']})",
                    "category": "Malware Vector",
                    "severity": "CRITICAL",
                    "what_was_detected": f"File '{att['filename']}' carries an executable or macro extension ({att['extension']}).",
                    "why_it_matters": "Attackers disguise trojans and ransomware using script and executable email attachments."
                })

        # Sender spoof threats
        if sender_analysis["is_spoofed"]:
            email_threats.append({
                "id": "sender_spoofing",
                "title": "Display Name / Sender Domain Spoofing",
                "category": "Header Deception",
                "severity": "CRITICAL",
                "what_was_detected": sender_analysis["spoof_reason"],
                "why_it_matters": "Attackers forge the display name of trusted brands while emails originate from unrelated servers."
            })

        # Reply-To discrepancy
        if sender_analysis["has_reply_to_mismatch"]:
            email_threats.append({
                "id": "reply_to_mismatch",
                "title": "Reply-To Address Mismatch",
                "category": "Header Manipulation",
                "severity": "HIGH",
                "what_was_detected": f"Sender is '{from_hdr}' but replies redirect to '{reply_to}'.",
                "why_it_matters": "Used in business email compromise (BEC) to hijack responses away from the legitimate sender."
            })

        # SPF / DKIM failure evidence
        if auth_evidence["spf_status"] == "FAIL":
            email_threats.append({
                "id": "spf_validation_fail",
                "title": "SPF Authentication Failure",
                "category": "Email Security Authentication",
                "severity": "HIGH",
                "what_was_detected": "The transmitting IP address is not authorized in the domain's DNS SPF record.",
                "why_it_matters": "SPF failure provides concrete evidence that the sender is unauthorized to transmit on behalf of the domain."
            })

        # Combine all indicators
        all_threats = email_threats + dna_result["detected_indicators"]
        dedup_threats = []
        seen = set()
        for t in all_threats:
            if t["title"] not in seen:
                seen.add(t["title"])
                dedup_threats.append(t)

        # Composite score
        header_risk = 0.0
        if any(att["is_dangerous"] for att in attachments):
            header_risk += 45.0
        if sender_analysis["is_spoofed"]:
            header_risk += 35.0
        if sender_analysis["has_reply_to_mismatch"]:
            header_risk += 25.0
        if auth_evidence["spf_status"] == "FAIL":
            header_risk += 25.0

        final_score = min(100.0, max(0.0, round(dna_result["risk_score"] + header_risk + url_risk_boost, 1)))
        tier_info = ScorerService.classify_score(final_score)

        if final_score <= 29.0:
            verdict = "Likely Legitimate Email"
            explanation = "Email headers align with sending domains and the body lacks urgent credential harvesting or malicious attachments."
            actions = ["Standard vigilance: verify sender identity when handling financial transactions."]
        elif final_score <= 59.0:
            verdict = "Suspicious Email / Caution Advised"
            explanation = "Moderate warning signals detected in email headers, link destinations, or psychological urgency cues."
            actions = ["Do not click links or download attachments. Confirm sender identity via a secondary channel."]
        else:
            verdict = "High-Risk Phishing / Social Engineering Campaign"
            explanation = "High-confidence email threat identified! Exhibits active spoofing, dangerous attachments, or credential harvesting links."
            actions = [
                "DO NOT open attachments or click links.",
                "Do not reply with credentials, passwords, or personal identity details.",
                "Mark as Phishing in your email client and notify your security administrator."
            ]

        # Estimated location of the sending MAIL SERVER (from Received headers); never blocks the analysis.
        try:
            sender_origin = EmailOriginService.analyze(msg)
        except Exception:
            sender_origin = {
                "status": "unavailable",
                "reason": "The sending server location could not be determined.",
            }

        return {
            "risk_score": final_score,
            "risk_tier": tier_info["tier"],
            "risk_tier_label": tier_info["tier_label"],
            "email_verdict": verdict,
            "confidence_score": dna_result["confidence_score"],
            "sender_origin": sender_origin,
            "headers": {
                "from": from_hdr,
                "reply_to": reply_to,
                "return_path": return_path,
                "subject": subject,
                "date": date_hdr
            },
            "sender_analysis": sender_analysis,
            "auth_evidence": auth_evidence,
            "attachments": attachments,
            "embedded_urls": inspected_urls,
            "detected_indicators": dedup_threats,
            "highlighted_phrases": dna_result["highlighted_phrases"],
            "scam_dna": dna_result,
            "explanation": explanation,
            "recommended_actions": actions
        }

    @staticmethod
    def _parse_auth_headers(auth_hdr: str, spf_hdr: str, raw_text: str) -> Dict[str, Any]:
        """Safely inspects SPF, DKIM, and DMARC results from email authentication headers."""
        combined = (auth_hdr + " " + spf_hdr + " " + raw_text[:2000]).lower()

        spf_status = "UNKNOWN"
        if "spf=pass" in combined or "pass (spf" in combined:
            spf_status = "PASS"
        elif "spf=fail" in combined or "fail (spf" in combined:
            spf_status = "FAIL"
        elif "spf=softfail" in combined:
            spf_status = "SOFTFAIL"
        elif "spf=neutral" in combined:
            spf_status = "NEUTRAL"

        dkim_status = "UNKNOWN"
        if "dkim=pass" in combined or "pass (dkim" in combined:
            dkim_status = "PASS"
        elif "dkim=fail" in combined or "fail (dkim" in combined:
            dkim_status = "FAIL"

        dmarc_status = "UNKNOWN"
        if "dmarc=pass" in combined:
            dmarc_status = "PASS"
        elif "dmarc=fail" in combined:
            dmarc_status = "FAIL"

        return {
            "spf_status": spf_status,
            "dkim_status": dkim_status,
            "dmarc_status": dmarc_status,
            "disclaimer": "Authentication passes indicate transmission authorization from the specified domain, but do not guarantee that the content itself is benign."
        }

    @staticmethod
    def _analyze_sender(from_hdr: str, reply_to: str, return_path: str) -> Dict[str, Any]:
        """Detects display name impersonation and return-path mismatches."""
        from_str = from_hdr or ""
        # Extract display name and email address
        name_match = re.match(r'^"?([^"<]+)"?\s*<?([^>]*)>?', from_str.strip())
        display_name = name_match.group(1).strip() if name_match else ""
        from_email = name_match.group(2).strip() if name_match else from_str.strip()

        from_domain = from_email.split("@")[-1].lower() if "@" in from_email else ""
        reply_domain = reply_to.split("@")[-1].lower() if "@" in reply_to else ""

        is_spoofed = False
        spoof_reason = ""

        # Impersonating major brand in display name with mismatched domain
        trusted_brands = ["paypal", "microsoft", "google", "apple", "amazon", "netflix", "chase", "dhl", "fedex"]
        disp_lower = display_name.lower()

        for b in trusted_brands:
            if b in disp_lower and b not in from_domain:
                is_spoofed = True
                spoof_reason = f"Display name impersonates '{display_name}' but email originates from unverified domain '{from_domain}'."
                break

        has_reply_mismatch = bool(from_domain and reply_domain and from_domain != reply_domain)

        return {
            "display_name": display_name,
            "email_address": from_email,
            "domain": from_domain,
            "is_spoofed": is_spoofed,
            "spoof_reason": spoof_reason,
            "has_reply_to_mismatch": has_reply_mismatch
        }
