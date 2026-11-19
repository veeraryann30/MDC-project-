"""
Email sending-server origin for Catch the Phish.

Reads the `Received` routing headers of a pasted email and estimates where the message
entered the mail system, i.e. the location of a MAIL SERVER, never of a person.

Honest limits (also returned to the UI):
- Each mail server adds one `Received` line on top. Only the top lines, added by YOUR mail
  provider, can be trusted. Lines further down were written by earlier servers and can be forged.
- Webmail and bulk-mail providers (Gmail, Outlook, SendGrid...) hide the sender's real location.
- IP geolocation is an estimate, often only city or country level.
"""

import re
from typing import Any, Dict, List, Optional, Tuple

from backend.app.services.link_origin_service import LinkOriginService

# Large mail platforms: the IP belongs to the provider, so it says nothing about the real sender.
MAIL_PROVIDER_KEYWORDS = (
    "GOOGLE", "MICROSOFT", "OUTLOOK", "YAHOO", "PROTON", "ZOHO", "APPLE", "ICLOUD",
    "FASTMAIL", "SENDGRID", "MAILGUN", "MAILCHIMP", "MANDRILL", "AMAZON", "SPARKPOST", "POSTMARK",
)

_IPV4_RE = re.compile(r"(?<![\d.])((?:\d{1,3}\.){3}\d{1,3})(?![\d.])")
_IPV6_BRACKET_RE = re.compile(r"\[(?:IPv6:)?([0-9a-fA-F:]{3,45})\]")
_FROM_CLAUSE_RE = re.compile(r"^\s*from\s+(.*?)(?=\s+by\s|\s*$)", re.IGNORECASE | re.DOTALL)

TRUST_NOTE = (
    "Routing lines written by earlier servers can be forged by the sender. "
    "Only the lines added by your own mail provider are fully trustworthy."
)
DISCLAIMER = (
    "Estimated location of a mail server, not of the sender. "
    "It cannot identify who wrote the email."
)


class EmailOriginService:

    @staticmethod
    def _hop_ips(received_value: str) -> Tuple[str, List[str]]:
        """Returns (claimed hostname, candidate IPs) taken only from the `from` part of a Received line."""
        text = " ".join(str(received_value).split())
        m = _FROM_CLAUSE_RE.match(text)
        if not m:
            return "", []
        clause = m.group(1)
        host = clause.split(" ", 1)[0].strip("()[]")
        ips: List[str] = []
        ips += [x for x in _IPV6_BRACKET_RE.findall(clause) if ":" in x]
        ips += _IPV4_RE.findall(clause)
        return host, ips

    @classmethod
    def analyze(cls, msg) -> Dict[str, Any]:
        received = msg.get_all("Received") or []
        received = [str(r) for r in received]

        if not received:
            return {
                "status": "unavailable",
                "reason": (
                    "No mail-server routing headers (Received lines) were found. "
                    "Paste the full email headers to see which server sent it. "
                    "In Gmail: open the email, then More, then Show original."
                ),
                "disclaimer": DISCLAIMER,
            }

        total = len(received)
        # The list is newest-first; walk from the oldest hop (closest to the sender) forward.
        origin_ip: Optional[str] = None
        claimed_host = ""
        hop_number = 0
        for idx, value in enumerate(reversed(received), start=1):
            host, ips = cls._hop_ips(value)
            public = [ip for ip in ips if LinkOriginService.is_public_ip(ip)]
            if public:
                origin_ip, claimed_host, hop_number = public[0], host, idx
                break

        if not origin_ip:
            return {
                "status": "unavailable",
                "reason": (
                    "The routing headers only contain private or internal addresses, "
                    "so no public sending server could be located."
                ),
                "total_hops": total,
                "disclaimer": DISCLAIMER,
            }

        geo = LinkOriginService.get_ip_network_and_location(origin_ip)
        corpus = f"{geo.get('as_name', '')} {geo.get('isp', '')} {geo.get('org', '')}".upper()
        is_provider = any(k in corpus for k in MAIL_PROVIDER_KEYWORDS)

        located = geo.get("status") == "success" and geo.get("latitude") is not None and geo.get("longitude") is not None
        return {
            "status": "found" if located else "unavailable",
            "reason": None if located else "A sending server IP was found but its location could not be estimated.",
            "ip": origin_ip,
            # Only a real name is useful; a bare IP in the "from" part just repeats the address.
            "claimed_hostname": claimed_host if claimed_host and not _IPV4_RE.fullmatch(claimed_host) and ":" not in claimed_host else None,
            "hop_number": hop_number,
            "total_hops": total,
            "country": geo.get("country"),
            "region": geo.get("region"),
            "city": geo.get("city"),
            "latitude": geo.get("latitude"),
            "longitude": geo.get("longitude"),
            "isp": geo.get("isp"),
            "org": geo.get("org"),
            "asn": geo.get("asn"),
            "is_mail_provider": is_provider,
            "provider_note": (
                "This is a large email provider's server, so the sender's own location is hidden behind it."
                if is_provider else None
            ),
            "confidence": geo.get("confidence"),
            "trust_note": TRUST_NOTE,
            "disclaimer": DISCLAIMER,
        }
