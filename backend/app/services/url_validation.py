"""
Input validation for the URL scanner. Runs BEFORE any analysis, so text that is not a web address
(for example "adsajv") is rejected instead of being scored.

Accepted:  http(s) links, or a bare address such as example.com/path, 203.0.113.7:8080, [::1]/x
Rejected:  words, sentences, other schemes (javascript:, ftp:, mailto:, file:, data:), single-label hosts
           (except localhost), malformed hosts/ports, addresses containing spaces.
"""

import ipaddress
import re
from typing import Optional, Tuple
from urllib.parse import urlparse

from backend.app.services.net_safety import numeric_ip

INVALID_MESSAGE = (
    "This is not a valid web address. Enter a full link such as https://example.com/login "
    "or a domain such as example.com."
)
SCHEME_MESSAGE = "Only http and https links can be scanned."

_HAS_SCHEME = re.compile(r"^[A-Za-z][A-Za-z0-9+.-]*://")
_SCHEME_NO_SLASHES = re.compile(r"^[A-Za-z][A-Za-z0-9+.-]*:(?!\d+(?:[/?#]|$))")  # javascript:..., mailto:...; not host:port
_LABEL = re.compile(r"^[a-z0-9_](?:[a-z0-9_-]{0,61}[a-z0-9_])?$")


def _valid_host(host: str) -> bool:
    host = host.rstrip(".").lower()
    if not host or len(host) > 253:
        return False
    try:
        ipaddress.ip_address(host.strip("[]"))
        return True
    except ValueError:
        pass
    if numeric_ip(host):  # 2130706433, 0x7f000001: valid (and later flagged as obfuscated)
        return True
    if host == "localhost":
        return True
    try:
        host = host.encode("idna").decode("ascii")  # internationalised names -> punycode
    except UnicodeError:
        return False
    labels = host.split(".")
    if len(labels) < 2:
        return False
    if not all(_LABEL.match(lbl) for lbl in labels):
        return False
    tld = labels[-1]
    return bool(re.fullmatch(r"[a-z]{2,63}", tld) or re.fullmatch(r"xn--[a-z0-9-]{1,59}", tld))


def check_url(raw: str) -> Tuple[bool, Optional[str]]:
    """Returns (is_valid, error_message)."""
    s = (raw or "").strip()
    if not s:
        return False, "URL cannot be empty."
    if re.search(r"\s", s):
        return False, INVALID_MESSAGE
    if _HAS_SCHEME.match(s):
        candidate = s
    elif _SCHEME_NO_SLASHES.match(s):
        return False, SCHEME_MESSAGE
    else:
        candidate = "http://" + s
    try:
        parsed = urlparse(candidate)
        host = parsed.hostname
        _ = parsed.port  # raises ValueError on a bad port
    except ValueError:
        return False, INVALID_MESSAGE
    if parsed.scheme.lower() not in ("http", "https"):
        return False, SCHEME_MESSAGE
    if not host or not _valid_host(host):
        return False, INVALID_MESSAGE
    return True, None
