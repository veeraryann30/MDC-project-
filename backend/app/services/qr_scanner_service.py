"""
QR Code Scam Detector Service
Extracts QR codes from images (PNG, JPG, JPEG) and PDF documents using OpenCV, Pillow, and PyPDF.
Performs zero-execution lexical analysis, SSRF & protocol protection, machine learning inference,
and threat intelligence correlation without ever opening or visiting the destination link.
"""

import io
import re
import ipaddress
import urllib.parse
from datetime import datetime
from typing import List, Dict, Any, Tuple, Optional

import cv2
import numpy as np
from PIL import Image
import pypdf
from sqlalchemy.orm import Session

from backend.app.database.models import ScanRecord, ScamAnalysisRecord
from ml.features.extractor import extract_features
from backend.app.services.rule_engine import RuleEngineService
from backend.app.services.ml_service import MLService
from backend.app.services.threat_intel import ThreatIntelService
from backend.app.services.scorer import ScorerService
from backend.app.services.link_origin_service import LinkOriginService

MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024  # 15 MB
ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".pdf"}

# Common internal / SSRF sensitive IP networks
PRIVATE_NETWORKS = [
    ipaddress.ip_network("127.0.0.0/8"),      # Loopback
    ipaddress.ip_network("10.0.0.0/8"),       # Private Class A
    ipaddress.ip_network("172.16.0.0/12"),    # Private Class B
    ipaddress.ip_network("192.168.0.0/16"),   # Private Class C
    ipaddress.ip_network("169.254.0.0/16"),   # Link-Local / Cloud Metadata (169.254.169.254)
    ipaddress.ip_network("::1/128"),          # IPv6 Loopback
    ipaddress.ip_network("fc00::/7"),         # IPv6 Unique Local
    ipaddress.ip_network("fe80::/10"),        # IPv6 Link-Local
]


class QRScannerService:

    @staticmethod
    def validate_file(file_name: str, file_bytes: bytes) -> Tuple[bool, str, str]:
        """
        Validates file extension, size, and magic bytes.
        Returns (is_valid, file_type, error_message).
        """
        if not file_bytes:
            return False, "unknown", "Uploaded file is empty (0 bytes)."

        if len(file_bytes) > MAX_FILE_SIZE_BYTES:
            size_mb = round(len(file_bytes) / (1024 * 1024), 2)
            return False, "unknown", f"File size ({size_mb} MB) exceeds maximum safe limit of 15 MB."

        ext = ""
        if "." in file_name:
            ext = "." + file_name.rsplit(".", 1)[-1].lower()

        if ext not in ALLOWED_EXTENSIONS:
            return False, "unsupported", f"Unsupported file extension '{ext}'. Allowed formats: PNG, JPG, JPEG, PDF."

        # Magic bytes verification
        if ext == ".png":
            if not file_bytes.startswith(b"\x89PNG\r\n\x1a\n"):
                return False, "png", "File has a .png extension but invalid PNG header signature."
            return True, "image/png", ""

        if ext in {".jpg", ".jpeg"}:
            if not (file_bytes.startswith(b"\xff\xd8\xff") or b"JFIF" in file_bytes[:32] or b"Exif" in file_bytes[:32]):
                return False, "jpeg", "File has a .jpg/.jpeg extension but invalid JPEG header signature."
            return True, "image/jpeg", ""

        if ext == ".pdf":
            if not file_bytes.startswith(b"%PDF-"):
                return False, "pdf", "File has a .pdf extension but invalid PDF header signature."
            return True, "application/pdf", ""

        return True, "image", ""

    @staticmethod
    def _decode_cv_image(cv_img: np.ndarray) -> List[str]:
        """
        Applies OpenCV QR detectors (Aruco-based and standard) with multiple preprocessing passes.
        """
        if cv_img is None or cv_img.size == 0:
            return []

        detectors = []
        if hasattr(cv2, "QRCodeDetectorAruco"):
            detectors.append(cv2.QRCodeDetectorAruco())
        detectors.append(cv2.QRCodeDetector())

        found: List[str] = []

        def try_detect(img_matrix):
            for det in detectors:
                try:
                    ok, decoded_info, _, _ = det.detectAndDecodeMulti(img_matrix)
                    if ok:
                        for item in decoded_info:
                            s = str(item).strip()
                            if s and s not in found:
                                found.append(s)
                    if found:
                        return True
                except Exception:
                    pass
                try:
                    val, _, _ = det.detectAndDecode(img_matrix)
                    s = str(val).strip()
                    if s and s not in found:
                        found.append(s)
                    if found:
                        return True
                except Exception:
                    pass
            return False

        # Pass 1: Raw image
        if try_detect(cv_img):
            return found

        # Pass 2: Grayscale
        try:
            if len(cv_img.shape) == 3 and cv_img.shape[2] == 3:
                gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
            else:
                gray = cv_img

            if try_detect(gray):
                return found

            # Pass 3: Otsu binarization
            _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            if try_detect(thresh):
                return found

            # Pass 4: Adaptive Gaussian threshold
            adaptive = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 51, 10)
            if try_detect(adaptive):
                return found
        except Exception:
            pass

        return found

    @classmethod
    def extract_qr_from_bytes(cls, file_name: str, file_bytes: bytes) -> List[str]:
        """
        Decodes QR codes from image or PDF bytes.
        """
        ext = ""
        if "." in file_name:
            ext = "." + file_name.rsplit(".", 1)[-1].lower()

        results: List[str] = []

        if ext == ".pdf":
            try:
                reader = pypdf.PdfReader(io.BytesIO(file_bytes))
                for page_idx, page in enumerate(reader.pages):
                    if page_idx >= 15:  # Limit processing to first 15 pages for safety
                        break
                    for img_obj in page.images:
                        try:
                            nparr = np.frombuffer(img_obj.data, np.uint8)
                            cv_img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                            if cv_img is not None:
                                decoded = cls._decode_cv_image(cv_img)
                                for d in decoded:
                                    if d not in results:
                                        results.append(d)
                        except Exception:
                            continue
            except Exception as pdf_err:
                print(f"[!] PDF extraction warning: {pdf_err}")
        else:
            # Image file (PNG, JPG, JPEG)
            try:
                nparr = np.frombuffer(file_bytes, np.uint8)
                cv_img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                if cv_img is not None:
                    results = cls._decode_cv_image(cv_img)
                
                # If OpenCV couldn't load, attempt PIL fallback
                if not results:
                    pil_img = Image.open(io.BytesIO(file_bytes))
                    if pil_img.mode != "RGB":
                        pil_img = pil_img.convert("RGB")
                    cv_img_pil = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
                    results = cls._decode_cv_image(cv_img_pil)
            except Exception as img_err:
                print(f"[!] Image extraction error: {img_err}")

        return results

    @staticmethod
    def is_valid_url(text: str) -> bool:
        """
        Checks whether extracted text resembles a web URL or URI scheme.
        """
        t = text.strip()
        # Any URI scheme (http, https, javascript, file, data, etc.)
        if re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*:", t):
            return True
        if re.match(r"^www\.[a-zA-Z0-9-]+\.[a-zA-Z]{2,}", t, re.IGNORECASE):
            return True
        # Check standard domain format
        if re.match(r"^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(/.*)?$", t, re.IGNORECASE):
            return True
        return False

    @staticmethod
    def normalize_url(text: str) -> str:
        """
        Normalizes extracted URL without executing network calls.
        Preserves non-standard URI schemes (e.g. javascript:, file:) so SSRF/protocol safety can inspect them.
        """
        t = text.strip()
        if re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*:", t):
            if re.match(r"^https?:(?!\/\/)", t, re.IGNORECASE):
                return re.sub(r"^https?:", "http://", t, flags=re.IGNORECASE)
            return t
        return "http://" + t

    @classmethod
    def check_ssrf_and_protocol(cls, url_str: str) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        """
        Validates URL scheme and destination host to prevent SSRF and unsafe protocol execution.
        Returns (is_unsafe, risk_description, threat_indicator_dict).
        """
        parsed = urllib.parse.urlparse(url_str)
        scheme = parsed.scheme.lower()

        # 1. Dangerous non-web schemes
        if scheme and scheme not in {"http", "https"}:
            threat = {
                "id": "unsafe_scheme",
                "title": f"Dangerous Protocol Execution ({scheme}:)",
                "severity": "CRITICAL",
                "what_was_detected": f"QR code encodes a '{scheme}' URI scheme instead of standard HTTP/HTTPS.",
                "why_it_matters": "Non-web schemes can invoke local application handlers, arbitrary shell commands, or local file reads."
            }
            return True, f"Blocked unsafe '{scheme}:' protocol in QR code payload.", threat

        hostname = parsed.hostname or ""

        # 2. Localhost string check
        if hostname.lower() in {"localhost", "loopback", "127.0.0.1", "0.0.0.0"}:
            threat = {
                "id": "ssrf_localhost",
                "title": "Server-Side Request Forgery (SSRF) / Loopback Target",
                "severity": "CRITICAL",
                "what_was_detected": f"QR code targets local loopback host: '{hostname}'.",
                "why_it_matters": "Quishing attack targeting internal admin panels or services hosted on the scanning device."
            }
            return True, "Destination points to local loopback (SSRF threat).", threat

        # 3. IP address evaluation (Private networks, cloud metadata)
        try:
            ip_obj = ipaddress.ip_address(hostname)
            for priv_net in PRIVATE_NETWORKS:
                if ip_obj in priv_net:
                    is_meta = str(ip_obj) == "169.254.169.254"
                    title = "Cloud Metadata Service Probing (AWS/GCP SSRF)" if is_meta else "Private Network SSRF Target"
                    threat = {
                        "id": "ssrf_private_network",
                        "title": title,
                        "severity": "CRITICAL",
                        "what_was_detected": f"QR code targets reserved private IP address '{ip_obj}' within {priv_net}.",
                        "why_it_matters": "Attack vector designed to probe intranet systems or extract cloud IAM credentials."
                    }
                    return True, f"Destination targets internal network address '{ip_obj}'.", threat
        except ValueError:
            # Hostname is a domain name, not an IP literal
            pass

        return False, "", None

    @classmethod
    def analyze_qr_file(cls, file_name: str, file_bytes: bytes, db: Session) -> Dict[str, Any]:
        """
        Complete end-to-end QR Code Scam Detection pipeline.
        """
        file_size_kb = round(len(file_bytes) / 1024, 2)

        # 1. Validate file
        is_valid, file_type, val_err = cls.validate_file(file_name, file_bytes)
        if not is_valid:
            return {
                "success": False,
                "status": "INVALID_FILE",
                "filename": file_name,
                "file_type": file_type,
                "file_size_kb": file_size_kb,
                "qr_count": 0,
                "extracted_contents": [],
                "primary_content": "",
                "is_url": False,
                "extracted_url": None,
                "extracted_domain": None,
                "risk_classification": "Inconclusive",
                "risk_score": 0.0,
                "risk_tier": "INCONCLUSIVE",
                "danger_explanation": val_err,
                "recommended_actions": [
                    "Upload a valid image in PNG, JPG, JPEG format or a PDF document.",
                    "Ensure the file is not corrupted or truncated."
                ],
                "threats_detected": [],
                "safe_indicators": [],
                "created_at": datetime.utcnow()
            }

        # 2. Extract QR codes
        extracted = cls.extract_qr_from_bytes(file_name, file_bytes)
        if not extracted:
            return {
                "success": False,
                "status": "NO_QR_DETECTED",
                "filename": file_name,
                "file_type": file_type,
                "file_size_kb": file_size_kb,
                "qr_count": 0,
                "extracted_contents": [],
                "primary_content": "",
                "is_url": False,
                "extracted_url": None,
                "extracted_domain": None,
                "risk_classification": "Inconclusive",
                "risk_score": 0.0,
                "risk_tier": "INCONCLUSIVE",
                "danger_explanation": (
                    "No readable QR code pattern could be resolved from the uploaded file. "
                    "The QR code may be cropped, partially obscured, low resolution, or damaged."
                ),
                "recommended_actions": [
                    "Ensure the entire QR code square including its three corner positioning markers is clearly visible.",
                    "Avoid extreme glare, blur, or heavy angle distortion.",
                    "Crop the image closer to the QR code boundaries before uploading."
                ],
                "threats_detected": [],
                "safe_indicators": [],
                "created_at": datetime.utcnow()
            }

        primary_content = extracted[0]
        is_url = cls.is_valid_url(primary_content)

        # 3. If extracted content is a URL
        if is_url:
            norm_url = cls.normalize_url(primary_content)

            # SSRF & Protocol Safety Check
            is_unsafe_proto, proto_desc, ssrf_threat = cls.check_ssrf_and_protocol(norm_url)
            if is_unsafe_proto:
                threats = [ssrf_threat] if ssrf_threat else []
                return {
                    "success": True,
                    "status": "UNSAFE_PROTOCOL",
                    "filename": file_name,
                    "file_type": file_type,
                    "file_size_kb": file_size_kb,
                    "qr_count": len(extracted),
                    "extracted_contents": extracted,
                    "primary_content": primary_content,
                    "is_url": True,
                    "extracted_url": norm_url,
                    "extracted_domain": urllib.parse.urlparse(norm_url).netloc,
                    "risk_classification": "Malicious",
                    "risk_score": 95.0,
                    "risk_tier": "CRITICAL",
                    "danger_explanation": proto_desc,
                    "recommended_actions": [
                        "Do not open or scan this QR code.",
                        "This code attempts an internal network SSRF attack or dangerous protocol execution.",
                        "Notify physical security or IT administrators if this QR was found on public signage."
                    ],
                    "threats_detected": threats,
                    "safe_indicators": [],
                    "created_at": datetime.utcnow()
                }

            # Run through Catch the Phish existing URL scanning engine (Zero-Execution)
            try:
                extracted_features = extract_features(norm_url)
                features = extracted_features["features"]
                details = extracted_features["details"]
                domain = details["domain"]

                threats_detected, safe_indicators, rule_score = RuleEngineService.evaluate(features, details)
                ml_score, is_phish = MLService.predict(features)
                intel = ThreatIntelService.check_url(norm_url, domain)
                threat_intel_score = intel.get("threat_score", 0.0)

                risk_breakdown = ScorerService.calculate_risk(
                    ml_score=ml_score,
                    rule_score=rule_score,
                    threat_intel_score=threat_intel_score,
                    threats_detected=threats_detected,
                    domain=domain
                )

                final_score = risk_breakdown["final_score"]
                classification = risk_breakdown["classification"]

                # Optional Link Origin check
                origin_intel = None
                try:
                    origin_intel = LinkOriginService.analyze(norm_url)
                except Exception:
                    pass

                # Map classification to Safe | Suspicious | Malicious | Inconclusive
                if classification == "PHISHING" or final_score >= 65:
                    risk_class = "Malicious"
                    risk_tier = "HIGH" if final_score < 85 else "CRITICAL"
                elif classification == "SUSPICIOUS" or final_score >= 30:
                    risk_class = "Suspicious"
                    risk_tier = "MODERATE"
                else:
                    risk_class = "Safe"
                    risk_tier = "SAFE"

                # Generate contextual danger explanation
                if risk_class == "Malicious":
                    threat_titles = [t.get("title", "") for t in threats_detected[:3]]
                    danger_explanation = (
                        f"High-confidence phishing indicators identified in destination structure. "
                        f"Identified cues: {', '.join(threat_titles) if threat_titles else 'Suspicious brand impersonation pattern'}. "
                        f"The QR code is designed to lure victims into entering credentials or transferring funds."
                    )
                    actions = [
                        "Do not open or follow this QR destination link on your mobile or desktop browser.",
                        "Do not enter passwords, credit card numbers, or authorization codes.",
                        "If this QR was placed on a parking meter, restaurant table, or bill payment, report sticker tampering."
                    ]
                elif risk_class == "Suspicious":
                    danger_explanation = (
                        f"Anomalous markers detected in the destination URL structure or domain reputation. "
                        f"The link exhibits deceptive or atypical characteristics (score: {final_score}/100)."
                    )
                    actions = [
                        "Exercise caution before proceeding.",
                        "Verify the root domain matches the organization's official portal before clicking.",
                        "Do not download files or install configuration profiles prompted by this destination."
                    ]
                else:
                    danger_explanation = (
                        "The destination domain matches legitimate architectural conventions and displays "
                        "zero anomalous brand impersonation or deceptive lexical cues."
                    )
                    actions = [
                        "Link appears benign based on static lexical analysis and recognized domain conventions.",
                        "Always confirm that the mobile browser displays valid HTTPS encryption when loading."
                    ]

                # Persist in SQLite database
                scan_record = ScanRecord(
                    url=norm_url,
                    domain=domain,
                    risk_score=final_score,
                    classification=classification,
                    ml_score=ml_score,
                    rule_score=rule_score,
                    threat_intel_score=threat_intel_score,
                    detected_threats=threats_detected,
                    features=features,
                    detection_method="QR Code OpenCV + ML + Rule Heuristics",
                    created_at=datetime.utcnow()
                )
                db.add(scan_record)

                scam_record = ScamAnalysisRecord(
                    analysis_type="QR",
                    content_snippet=f"[QR File: {file_name}] -> {norm_url}"[:250],
                    risk_score=final_score,
                    risk_tier=risk_tier,
                    scam_category="QR Code (Quishing) Scam",
                    confidence_score=92.0,
                    detected_indicators=threats_detected,
                    highlighted_phrases=[{"text": norm_url, "start": 0, "end": len(norm_url), "severity": risk_tier}],
                    scam_dna_breakdown={"primary_scam_pattern": "Quishing Vector", "confidence_score": 90.0},
                    recommended_actions=actions,
                    metadata_info={"filename": file_name, "file_type": file_type, "qr_count": len(extracted)},
                    created_at=datetime.utcnow()
                )
                db.add(scam_record)
                db.commit()
                db.refresh(scan_record)

                return {
                    "success": True,
                    "status": "SUCCESS",
                    "filename": file_name,
                    "file_type": file_type,
                    "file_size_kb": file_size_kb,
                    "qr_count": len(extracted),
                    "extracted_contents": extracted,
                    "primary_content": primary_content,
                    "is_url": True,
                    "extracted_url": norm_url,
                    "extracted_domain": domain,
                    "risk_classification": risk_class,
                    "risk_score": final_score,
                    "risk_tier": risk_tier,
                    "danger_explanation": danger_explanation,
                    "recommended_actions": actions,
                    "threats_detected": threats_detected,
                    "safe_indicators": safe_indicators,
                    "url_scan_id": scan_record.id,
                    "url_breakdown": risk_breakdown,
                    "threat_intel": intel,
                    "origin_intelligence": origin_intel,
                    "created_at": scan_record.created_at
                }

            except Exception as scan_err:
                db.rollback()
                print(f"[!] QR URL scan error: {scan_err}")
                return {
                    "success": False,
                    "status": "ERROR",
                    "filename": file_name,
                    "file_type": file_type,
                    "file_size_kb": file_size_kb,
                    "qr_count": len(extracted),
                    "extracted_contents": extracted,
                    "primary_content": primary_content,
                    "is_url": True,
                    "extracted_url": norm_url,
                    "extracted_domain": urllib.parse.urlparse(norm_url).netloc,
                    "risk_classification": "Inconclusive",
                    "risk_score": 0.0,
                    "risk_tier": "INCONCLUSIVE",
                    "danger_explanation": f"Extracted URL could not be evaluated: {scan_err}",
                    "recommended_actions": ["Verify input and retry verification."],
                    "threats_detected": [],
                    "safe_indicators": [],
                    "created_at": datetime.utcnow()
                }

        # 4. Extracted content is plain text / non-URL
        lower_txt = primary_content.lower()
        is_wifi_config = primary_content.startswith("WIFI:") or "wi-fi" in lower_txt or "wifi" in lower_txt

        has_urgency = any(w in lower_txt for w in ["urgent", "immediately", "suspended", "expire", "action required"])
        has_finance = any(w in lower_txt for w in ["upi id", "pay to", "transfer fee", "bitcoin wallet", "crypto wallet", "claim prize", "lottery winner", "pay rs", "pay ₹"])
        has_credential_harvesting = any(w in lower_txt for w in [
            "share otp", "enter otp", "send otp", "provide password", "enter password", 
            "reset password", "verify kyc", "update kyc", "pan card blocked", "aadhaar verification", 
            "account suspended", "bank credentials"
        ]) or (has_urgency and any(w in lower_txt for w in ["otp", "password", "pin", "credential"]))

        text_threats = []
        if not is_wifi_config:
            if has_urgency:
                text_threats.append({
                    "id": "urgency_pressure",
                    "title": "Artificial Urgency in QR Text",
                    "severity": "HIGH",
                    "what_was_detected": "QR payload conveys aggressive urgency or punitive threat cues.",
                    "why_it_matters": "Reduces victim deliberation time to facilitate fraud."
                })
            if has_finance:
                text_threats.append({
                    "id": "financial_solicitation",
                    "title": "Financial / Payment Demand in QR Payload",
                    "severity": "CRITICAL" if has_credential_harvesting else "HIGH",
                    "what_was_detected": "QR code encodes payment addresses, UPI IDs, or financial transfer instructions.",
                    "why_it_matters": "Direct vector for payment diversion or fraudulent requests."
                })
            if has_credential_harvesting:
                text_threats.append({
                    "id": "credential_interception",
                    "title": "Credential / Identity Harvesting Payload",
                    "severity": "CRITICAL",
                    "what_was_detected": "Text prompts user to furnish OTP, PIN, KYC, or account access credentials.",
                    "why_it_matters": "Identity theft and unauthorized account access."
                })

        if text_threats:
            risk_score = 88.0 if has_credential else 72.0 if has_finance else 45.0
            risk_class = "Malicious" if risk_score >= 70 else "Suspicious"
            risk_tier = "CRITICAL" if risk_score >= 80 else "HIGH" if risk_score >= 60 else "MODERATE"
            explanation = "Extracted QR text contains explicit financial demands, urgency markers, or credential requests."
            actions = [
                "Do not send payments, scan in payment apps, or follow the instructions in this QR text.",
                "Verify the request through independent official customer service numbers."
            ]
        else:
            risk_score = 5.0
            risk_class = "Safe"
            risk_tier = "SAFE"
            explanation = "Extracted text content exhibits zero coercive or fraudulent markers."
            actions = [
                "Content appears to be neutral text or configuration data.",
                "Never share sensitive personal information unless you initiated the request."
            ]

        # Persist text scam record
        scam_record = ScamAnalysisRecord(
            analysis_type="QR",
            content_snippet=f"[QR Text File: {file_name}] -> {primary_content}"[:250],
            risk_score=risk_score,
            risk_tier=risk_tier,
            scam_category="QR Code Text Analysis",
            confidence_score=90.0,
            detected_indicators=text_threats,
            highlighted_phrases=[{"text": primary_content[:50], "start": 0, "end": min(50, len(primary_content)), "severity": risk_tier}],
            scam_dna_breakdown={"primary_scam_pattern": "QR Text Vector", "confidence_score": 85.0},
            recommended_actions=actions,
            metadata_info={"filename": file_name, "file_type": file_type, "qr_count": len(extracted)},
            created_at=datetime.utcnow()
        )
        db.add(scam_record)
        db.commit()

        return {
            "success": True,
            "status": "SUCCESS",
            "filename": file_name,
            "file_type": file_type,
            "file_size_kb": file_size_kb,
            "qr_count": len(extracted),
            "extracted_contents": extracted,
            "primary_content": primary_content,
            "is_url": False,
            "extracted_url": None,
            "extracted_domain": None,
            "risk_classification": risk_class,
            "risk_score": risk_score,
            "risk_tier": risk_tier,
            "danger_explanation": explanation,
            "recommended_actions": actions,
            "threats_detected": text_threats,
            "safe_indicators": [] if text_threats else [{
                "id": "benign_payload",
                "title": "Benign Text Structure",
                "severity": "SAFE",
                "what_was_detected": "Zero deceptive or financial extraction cues in plain text.",
                "why_it_matters": "Baseline safe data exchange."
            }],
            "created_at": datetime.utcnow()
        }
