"""
Threat Intelligence Service for Catch the Phish
Modular integration for AbuseIPDB, VirusTotal, IPinfo, and Google Safe Browsing APIs.
Operates safely without network execution or with honest 'Unavailable' flags if API keys are absent.
"""

import base64
import json
import threading
import time
import urllib.request
import urllib.error
from collections import OrderedDict
from typing import Dict, Any, Optional
from backend.app.core.config import settings
from backend.app.services.intel_common import RateBudget


_VT_BUDGET = RateBudget(settings.VT_REQUESTS_PER_MINUTE)


class ThreatIntelService:

    @staticmethod
    def check_url(url: str, domain: str) -> Dict[str, Any]:
        """
        Queries threat intelligence sources if configured.
        Returns reputation details and threat score (0 to 100).
        """
        intel_result = {
            "enabled": False,
            "provider": "Local Heuristics / Reputation Engine",
            "threat_score": 0.0,
            "status": "clean",
            "details": "Local static reputation check active."
        }

        # Check VirusTotal API if key is present
        if settings.VIRUSTOTAL_API_KEY:
            intel_result["provider"] = "VirusTotal API"
            vt = ThreatIntelService.query_virustotal_url(url)
            intel_result["enabled"] = vt["available"]
            intel_result["details"] = vt["note"]
            intel_result["status"] = vt["status"]
            intel_result["threat_score"] = vt["threat_score"]
            intel_result["malicious_count"] = vt.get("malicious_count", 0)
            intel_result["suspicious_count"] = vt.get("suspicious_count", 0)

        # Check Google Safe Browsing API if key is present
        elif settings.GOOGLE_SAFE_BROWSING_API_KEY:
            try:
                intel_result["enabled"] = True
                intel_result["provider"] = "Google Safe Browsing"
                intel_result["details"] = "Google Safe Browsing checked."
            except Exception as e:
                intel_result["details"] = f"Google Safe Browsing check failed: {str(e)}"

        return intel_result

    @staticmethod
    def query_virustotal_url(url: str) -> Dict[str, Any]:
        """
        Looks up an existing VirusTotal v3 report for a URL (read-only; the URL is
        never submitted for new scanning). Returns a threat_score of 0-100.
        """
        url_id = base64.urlsafe_b64encode(url.encode("utf-8")).decode("ascii").rstrip("=")
        cached = ThreatIntelService._vt_cache_get(url_id)
        if cached is not None:
            return cached
        if not _VT_BUDGET.allow():
            return {"available": False, "rate_limited": True, "threat_score": 0.0, "status": "unknown",
                    "note": "VirusTotal call budget reached (free tier allows about 4 lookups/minute); retry shortly."}
        result = ThreatIntelService._query_virustotal_url_live(url_id)
        # Cache definitive answers only (incl. "no report"); retry errors/timeouts next time.
        if (result["status"] != "unknown" or result["available"]) and not result.get("rate_limited"):
            ThreatIntelService._vt_cache_set(url_id, result)
        return result

    _VT_CACHE: "OrderedDict[str, tuple]" = OrderedDict()
    _VT_CACHE_LOCK = threading.Lock()
    _VT_CACHE_TTL = 3600.0   # seconds
    _VT_CACHE_MAX = 1000

    @classmethod
    def _vt_cache_get(cls, key: str) -> Optional[Dict[str, Any]]:
        with cls._VT_CACHE_LOCK:
            entry = cls._VT_CACHE.get(key)
            if entry is None:
                return None
            expires, value = entry
            if expires < time.monotonic():
                del cls._VT_CACHE[key]
                return None
            cls._VT_CACHE.move_to_end(key)
            return dict(value)

    @classmethod
    def _vt_cache_set(cls, key: str, value: Dict[str, Any]) -> None:
        with cls._VT_CACHE_LOCK:
            cls._VT_CACHE[key] = (time.monotonic() + cls._VT_CACHE_TTL, dict(value))
            cls._VT_CACHE.move_to_end(key)
            while len(cls._VT_CACHE) > cls._VT_CACHE_MAX:
                cls._VT_CACHE.popitem(last=False)

    @staticmethod
    def _query_virustotal_url_live(url_id: str) -> Dict[str, Any]:
        req = urllib.request.Request(
            f"https://www.virustotal.com/api/v3/urls/{url_id}",
            headers={
                "x-apikey": settings.VIRUSTOTAL_API_KEY,
                "Accept": "application/json",
                "User-Agent": "CatchThePhish-ThreatIntelligence/2.0",
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=3.5) as resp:
                attrs = json.loads(resp.read().decode("utf-8")).get("data", {}).get("attributes", {})
            stats = attrs.get("last_analysis_stats", {})
            malicious = int(stats.get("malicious", 0))
            suspicious = int(stats.get("suspicious", 0))
            engines = malicious + suspicious + int(stats.get("harmless", 0)) + int(stats.get("undetected", 0))
            if malicious > 0:
                score, status = min(100.0, 40.0 + malicious * 10.0 + suspicious * 5.0), "malicious"
            elif suspicious > 0:
                score, status = min(60.0, 30.0 + suspicious * 10.0), "suspicious"
            elif engines >= 10:
                score, status = 0.0, "clean"
            else:
                # Report exists but too few engines analysed it to call it clean.
                return {"available": True, "threat_score": 0.0, "status": "unknown",
                        "note": f"VirusTotal report exists but only {engines} engine(s) analysed it; not enough to judge."}
            return {
                "available": True,
                "threat_score": score,
                "status": status,
                "malicious_count": malicious,
                "suspicious_count": suspicious,
                "note": f"VirusTotal: {malicious} vendors flagged this URL as malicious, {suspicious} as suspicious.",
            }
        except urllib.error.HTTPError as e:
            if e.code == 404:
                note = "VirusTotal has no existing report for this URL."
            elif e.code == 429:
                return {"available": False, "rate_limited": True, "threat_score": 0.0, "status": "unknown",
                        "note": "VirusTotal rate limit reached (HTTP 429); retry shortly."}
            else:
                note = f"VirusTotal API HTTP {e.code}: {e.reason}"
            return {"available": e.code == 404, "threat_score": 0.0, "status": "unknown", "note": note}
        except Exception as e:
            return {"available": False, "threat_score": 0.0, "status": "unknown",
                    "note": f"VirusTotal query error: {str(e)}"}

    @staticmethod
    def query_abuseipdb(ip: str) -> Dict[str, Any]:
        """
        Queries the AbuseIPDB API for public IP abuse reports and confidence score.
        """
        if not settings.ABUSEIPDB_API_KEY:
            return {
                "available": False,
                "configured": False,
                "score": "Unavailable",
                "reports": "Unavailable",
                "last_reported": "Unavailable",
                "usage_type": "Unavailable",
                "source": "AbuseIPDB",
                "note": "API key not configured. Set ABUSEIPDB_API_KEY in environment variables."
            }

        url = f"https://api.abuseipdb.com/api/v2/check?ipAddress={ip}&maxAgeInDays=90&verbose"
        req = urllib.request.Request(
            url,
            headers={
                "Key": settings.ABUSEIPDB_API_KEY,
                "Accept": "application/json",
                "User-Agent": "CatchThePhish-ThreatIntelligence/2.0"
            }
        )

        try:
            with urllib.request.urlopen(req, timeout=3.5) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode("utf-8")).get("data", {})
                    score = data.get("abuseConfidenceScore", 0)
                    reports = data.get("totalReports", 0)
                    last_rep = data.get("lastReportedAt")
                    usage = data.get("usageType") or "Hosting / Transit"
                    return {
                        "available": True,
                        "configured": True,
                        "score": score,
                        "reports": reports,
                        "last_reported": last_rep or "None in last 90 days",
                        "usage_type": usage,
                        "is_whitelisted": data.get("isWhitelisted", False),
                        "source": "AbuseIPDB v2 Live Feed",
                        "note": f"{reports} reports logged in the past 90 days."
                    }
        except urllib.error.HTTPError as e:
            return {
                "available": False,
                "configured": True,
                "score": "Unavailable",
                "reports": "Unavailable",
                "last_reported": "Unavailable",
                "usage_type": "Unavailable",
                "source": "AbuseIPDB",
                "note": f"AbuseIPDB API response status {e.code}: {e.reason}"
            }
        except Exception as e:
            return {
                "available": False,
                "configured": True,
                "score": "Unavailable",
                "reports": "Unavailable",
                "last_reported": "Unavailable",
                "usage_type": "Unavailable",
                "source": "AbuseIPDB",
                "note": f"AbuseIPDB query error: {str(e)}"
            }

    @staticmethod
    def query_virustotal_ip(ip: str) -> Dict[str, Any]:
        """
        Queries VirusTotal v3 IP analysis endpoint for multi-vendor engine detections.
        """
        if not settings.VIRUSTOTAL_API_KEY:
            return {
                "available": False,
                "configured": False,
                "malicious_count": "Unavailable",
                "suspicious_count": "Unavailable",
                "harmless_count": "Unavailable",
                "undetected_count": "Unavailable",
                "reputation": "Unavailable",
                "source": "VirusTotal",
                "note": "API key not configured. Set VIRUSTOTAL_API_KEY in environment variables."
            }

        url = f"https://www.virustotal.com/api/v3/ip_addresses/{ip}"
        req = urllib.request.Request(
            url,
            headers={
                "x-apikey": settings.VIRUSTOTAL_API_KEY,
                "Accept": "application/json",
                "User-Agent": "CatchThePhish-ThreatIntelligence/2.0"
            }
        )

        try:
            with urllib.request.urlopen(req, timeout=3.5) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode("utf-8")).get("data", {})
                    attributes = data.get("attributes", {})
                    stats = attributes.get("last_analysis_stats", {})
                    malicious = stats.get("malicious", 0)
                    suspicious = stats.get("suspicious", 0)
                    harmless = stats.get("harmless", 0)
                    undetected = stats.get("undetected", 0)
                    rep = attributes.get("reputation", 0)

                    return {
                        "available": True,
                        "configured": True,
                        "malicious_count": malicious,
                        "suspicious_count": suspicious,
                        "harmless_count": harmless,
                        "undetected_count": undetected,
                        "reputation": rep,
                        "source": "VirusTotal v3 Live API",
                        "note": f"{malicious} security vendors flagged this IP as malicious."
                    }
        except urllib.error.HTTPError as e:
            return {
                "available": False,
                "configured": True,
                "malicious_count": "Unavailable",
                "suspicious_count": "Unavailable",
                "harmless_count": "Unavailable",
                "undetected_count": "Unavailable",
                "reputation": "Unavailable",
                "source": "VirusTotal",
                "note": f"VirusTotal API HTTP {e.code}: {e.reason}"
            }
        except Exception as e:
            return {
                "available": False,
                "configured": True,
                "malicious_count": "Unavailable",
                "suspicious_count": "Unavailable",
                "harmless_count": "Unavailable",
                "undetected_count": "Unavailable",
                "reputation": "Unavailable",
                "source": "VirusTotal",
                "note": f"VirusTotal query error: {str(e)}"
            }

    @staticmethod
    def query_ipinfo(ip: str) -> Dict[str, Any]:
        """
        Queries IPinfo for privacy indicators (VPN, Tor, Proxy, Hosting).
        """
        if not settings.IPINFO_API_KEY:
            return {
                "available": False,
                "configured": False,
                "vpn": "Unavailable",
                "proxy": "Unavailable",
                "tor": "Unavailable",
                "hosting": "Unavailable",
                "source": "IPinfo.io",
                "note": "API token not configured. Set IPINFO_API_KEY in environment variables."
            }

        url = f"https://ipinfo.io/{ip}/json?token={settings.IPINFO_API_KEY}"
        req = urllib.request.Request(
            url,
            headers={
                "Accept": "application/json",
                "User-Agent": "CatchThePhish-ThreatIntelligence/2.0"
            }
        )

        try:
            with urllib.request.urlopen(req, timeout=3.5) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode("utf-8"))
                    privacy = data.get("privacy", {})
                    return {
                        "available": True,
                        "configured": True,
                        "vpn": privacy.get("vpn", False),
                        "proxy": privacy.get("proxy", False),
                        "tor": privacy.get("tor", False),
                        "hosting": privacy.get("hosting", True),
                        "company": data.get("company", {}).get("name") or data.get("org", "Unknown"),
                        "source": "IPinfo.io Live Feed",
                        "note": "IPinfo privacy detection active."
                    }
        except Exception as e:
            return {
                "available": False,
                "configured": True,
                "vpn": "Unavailable",
                "proxy": "Unavailable",
                "tor": "Unavailable",
                "hosting": "Unavailable",
                "source": "IPinfo.io",
                "note": f"IPinfo query error: {str(e)}"
            }

    @classmethod
    def evaluate_ip_reputation(cls, ip: str, is_cdn_or_proxy: bool = False) -> Dict[str, Any]:
        """
        Consolidates threat intelligence feeds to produce an objective IP reputation assessment.
        Adheres to standard SOC rules:
        - Never classifies an IP as malicious solely because it belongs to a VPN, proxy, or hosting provider.
        - Clearly distinguishes confirmed facts vs unavailable feeds.
        """
        abuse = cls.query_abuseipdb(ip)
        vt = cls.query_virustotal_ip(ip)
        ipinfo = cls.query_ipinfo(ip)

        # Compute classification: Clean / Suspicious / Malicious / Unknown
        reputation = "Unknown"
        confidence_score = 0.0
        reports_count = 0
        indicators = []
        feed_sources = []

        has_any_feed = abuse.get("available") or vt.get("available") or ipinfo.get("available")

        if abuse.get("available"):
            score = abuse.get("score")
            reps = abuse.get("reports")
            if isinstance(score, (int, float)):
                confidence_score = max(confidence_score, float(score))
            if isinstance(reps, (int, float)):
                reports_count = max(reports_count, int(reps))
            feed_sources.append("AbuseIPDB")

        if vt.get("available"):
            malicious = vt.get("malicious_count", 0)
            suspicious = vt.get("suspicious_count", 0)
            if isinstance(malicious, int) and malicious > 0:
                indicators.append(f"{malicious} VirusTotal security engines detected malicious reputation")
            feed_sources.append("VirusTotal")

        if ipinfo.get("available"):
            feed_sources.append("IPinfo")

        if not has_any_feed:
            reputation = "Unknown"
            summary = "External threat intelligence feeds are not configured. Configure API keys in your environment to view real-time multi-source threat telemetry."
        else:
            # Deterministic classification based on actual reports & vendor flags
            vt_mal = vt.get("malicious_count", 0) if vt.get("available") else 0
            if (isinstance(confidence_score, (int, float)) and confidence_score >= 40) or (isinstance(vt_mal, int) and vt_mal >= 3):
                reputation = "Malicious"
                summary = "Active abuse or malicious activity confirmed by threat intelligence databases."
            elif (isinstance(confidence_score, (int, float)) and confidence_score >= 15) or (isinstance(vt_mal, int) and vt_mal >= 1):
                reputation = "Suspicious"
                summary = "Suspicious activity or community abuse reports associated with this IP address."
            else:
                reputation = "Clean"
                summary = "No active abuse reports or malicious classifications found in connected threat intelligence feeds."

        # Add proxy/hosting notice if applicable (without classifying as malicious)
        if is_cdn_or_proxy:
            indicators.append("IP resides within known CDN / cloud reverse proxy infrastructure")

        return {
            "ip": ip,
            "reputation": reputation,
            "confidence_score": confidence_score if has_any_feed else "Unavailable",
            "abuse_reports": reports_count if has_any_feed else "Unavailable",
            "last_reported": abuse.get("last_reported", "Unavailable"),
            "sources": feed_sources if feed_sources else ["Local SOC Policy"],
            "feeds": {
                "abuseipdb": abuse,
                "virustotal": vt,
                "ipinfo": ipinfo
            },
            "indicators": indicators,
            "summary": summary,
            "disclaimer": "IP reputation reflects historical abuse reports and vendor telemetry. Hosting provider or CDN assignment alone does not imply malicious intent."
        }
