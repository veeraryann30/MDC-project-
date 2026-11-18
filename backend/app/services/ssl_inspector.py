"""
SSL / TLS Certificate Inspection Service for Catch the Phish
Safely extracts SSL certificate metadata using standard Python ssl and socket libraries.
Enforces strict timeouts and SSRF safeguards.
"""

import socket
import ssl
from datetime import datetime
from typing import Dict, Any, List, Optional
import ipaddress


class SSLInspectorService:

    @staticmethod
    def is_public_ip(ip_str: str) -> bool:
        """Enforces that socket connection cannot be made to private/loopback/cloud IP ranges."""
        try:
            ip = ipaddress.ip_address(ip_str.strip())
            return not (
                ip.is_private or
                ip.is_loopback or
                ip.is_link_local or
                ip.is_reserved or
                ip.is_multicast or
                ip.is_unspecified or
                str(ip) == "169.254.169.254"
            )
        except ValueError:
            return False

    @classmethod
    def inspect(cls, hostname: str, ip_address: Optional[str] = None, port: int = 443) -> Dict[str, Any]:
        """
        Inspects the SSL certificate for a target hostname.
        If an IP address is provided, connects directly to that IP to prevent DNS rebinding,
        while transmitting the SNI hostname.
        """
        result: Dict[str, Any] = {
            "has_ssl": False,
            "status": "No SSL Certificate Detected",
            "issuer": "Unavailable",
            "issuer_org": "Unavailable",
            "subject": "Unavailable",
            "subject_org": "Unavailable",
            "valid_from": None,
            "valid_to": None,
            "days_remaining": None,
            "is_expired": False,
            "sans": [],
            "serial_number": None,
            "version": None,
            "cipher": None,
            "error": None
        }

        # SSRF Check
        target_host = ip_address if ip_address and cls.is_public_ip(ip_address) else hostname
        if ip_address and not cls.is_public_ip(ip_address):
            result["status"] = "SSRF Restricted"
            result["error"] = "Cannot inspect internal or private IP address."
            return result

        cert = None
        cipher = None
        is_trusted = False

        # Attempt 1: Verified connection with default trust store
        try:
            context = ssl.create_default_context()
            with socket.create_connection((target_host, port), timeout=3.0) as sock:
                with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                    cert = ssock.getpeercert()
                    cipher = ssock.cipher()
                    is_trusted = True
        except ssl.SSLCertVerificationError as e:
            # Attempt 2: Untrusted or self-signed cert — retrieve binary cert to parse fields
            try:
                unverified_context = ssl._create_unverified_context()
                with socket.create_connection((target_host, port), timeout=3.0) as sock:
                    with unverified_context.wrap_socket(sock, server_hostname=hostname) as ssock:
                        cert = ssock.getpeercert()
                        # If getpeercert() is empty for unverified context, use cert binary
                        cipher = ssock.cipher()
                        if not cert:
                            der_cert = ssock.getpeercert(binary_form=True)
                            if der_cert:
                                # Standard SSL parsing
                                cert = ssl._ssl._test_decode_cert(ssock.getpeercert(binary_form=True)) if hasattr(ssl, '_ssl') else {}
            except Exception:
                pass
            result["status"] = "Self-Signed or Untrusted CA"
            result["error"] = f"SSL Verification Warning: {str(e.strerror if hasattr(e, 'strerror') else e)}"
        except (socket.timeout, TimeoutError):
            result["status"] = "Connection Timed Out"
            result["error"] = "SSL handshake timed out on port 443."
            return result
        except ConnectionRefusedError:
            result["status"] = "Port 443 Closed"
            result["error"] = "Target server refused connection on port 443 (HTTP only)."
            return result
        except Exception as e:
            result["status"] = "Handshake Failed"
            result["error"] = f"SSL connection error: {str(e)}"
            return result

        if not cert:
            if not result["error"]:
                result["status"] = "No Certificate Presented"
            return result

        result["has_ssl"] = True
        if is_trusted:
            result["status"] = "Valid & Trusted"

        # Parse Subject
        subject_dict = {}
        for rdn in cert.get("subject", ()):
            for key, val in rdn:
                subject_dict[key] = val
        result["subject"] = subject_dict.get("commonName") or hostname
        result["subject_org"] = subject_dict.get("organizationName") or "Unavailable"

        # Parse Issuer
        issuer_dict = {}
        for rdn in cert.get("issuer", ()):
            for key, val in rdn:
                issuer_dict[key] = val
        result["issuer"] = issuer_dict.get("commonName") or issuer_dict.get("organizationName") or "Unavailable"
        result["issuer_org"] = issuer_dict.get("organizationName") or result["issuer"]

        # Parse Dates
        not_before = cert.get("notBefore")
        not_after = cert.get("notAfter")
        if not_before:
            result["valid_from"] = not_before
        if not_after:
            result["valid_to"] = not_after
            try:
                # SSL date format example: 'May 10 12:00:00 2026 GMT'
                exp_date = datetime.strptime(not_after, "%b %d %H:%M:%S %Y %Z")
                now = datetime.utcnow()
                delta = (exp_date - now).days
                result["days_remaining"] = delta
                if delta < 0:
                    result["is_expired"] = True
                    result["status"] = "Certificate Expired"
            except Exception:
                pass

        # Parse Subject Alternative Names (SANs)
        sans: List[str] = []
        for san_type, san_val in cert.get("subjectAltName", ()):
            if san_type.lower() == "dns":
                sans.append(san_val)
        result["sans"] = sans[:15]  # Cap at 15

        # Serial Number & Cipher
        result["serial_number"] = str(cert.get("serialNumber") or "Unavailable")
        result["version"] = cert.get("version")
        if cipher:
            result["cipher"] = f"{cipher[0]} ({cipher[1]})"

        return result
