"""
SSRF-safe networking helpers.

Rules this module enforces for anything the *server* contacts on behalf of a scanned link:

1. Only http/https, no credentials in the URL, no odd ports.
2. The hostname is resolved once and EVERY resolved address must be globally routable
   (no loopback / private / link-local / cloud-metadata / CGNAT / reserved / multicast,
   including IPv4-mapped IPv6 and decimal/hex IP spellings, because we judge the resolved
   address, not the text).
3. The connection is pinned to the address we validated (defeats DNS rebinding).
4. Redirects are NEVER followed automatically. ``expand_shortener`` only talks to *known URL
   shortener services* and reads their ``Location`` header; it never requests the destination
   the shortener points to, so a malicious final page is never contacted.
"""

import http.client
import ipaddress
import re
import socket
import ssl
import time
from typing import Any, Dict, List, Optional
from urllib.parse import urljoin, urlparse

from ml.features.extractor import SHORTENER_DOMAINS

ALLOWED_PORTS = {80, 443}
MAX_HOPS = 4
HOP_TIMEOUT = 3.0
TOTAL_BUDGET = 8.0


class UnsafeTarget(Exception):
    """The destination must not be contacted from this server."""


def _ip_is_public(ip: ipaddress._BaseAddress) -> bool:
    if isinstance(ip, ipaddress.IPv6Address) and ip.ipv4_mapped is not None:
        ip = ip.ipv4_mapped
    return bool(ip.is_global) and not (ip.is_multicast or ip.is_unspecified or ip.is_loopback)


_NUMERIC_HOST = re.compile(r"^(0x[0-9a-f]+|[0-9]+)(\.(0x[0-9a-f]+|[0-9]+)){0,3}$", re.I)


def numeric_ip(hostname: str) -> Optional[str]:
    """
    Canonical IPv4 for obfuscated spellings (2130706433, 0x7f000001, 0177.0.0.1, 127.1) that browsers
    accept but that do not look like an address. Returns None for ordinary hostnames / dotted quads.
    """
    h = (hostname or "").strip()
    if not _NUMERIC_HOST.match(h):
        return None
    try:
        canon = socket.inet_ntoa(socket.inet_aton(h))
    except OSError:
        return None
    return None if canon == h else canon


def resolve_public(hostname: str, port: int = 443) -> List[str]:
    """Resolve ``hostname`` and return its addresses; raise UnsafeTarget if any is non-public."""
    if not hostname:
        raise UnsafeTarget("Missing hostname.")
    obfuscated = numeric_ip(hostname)
    if obfuscated:
        hostname = obfuscated
    try:
        infos = socket.getaddrinfo(hostname, port, proto=socket.IPPROTO_TCP)
    except socket.gaierror:
        raise UnsafeTarget("Hostname does not resolve (DNS lookup failed).")
    ips: List[str] = []
    for info in infos:
        addr = info[4][0]
        if addr not in ips:
            ips.append(addr)
    if not ips:
        raise UnsafeTarget("Hostname did not resolve to any address.")
    for addr in ips:
        try:
            ip = ipaddress.ip_address(addr.split("%")[0])
        except ValueError:
            raise UnsafeTarget("Hostname resolved to an unparseable address.")
        if not _ip_is_public(ip):
            raise UnsafeTarget(f"Destination resolves to a non-public address ({ip}); it will not be contacted.")
    return ips


def inspect_target(url: str) -> Dict[str, Any]:
    """
    Decide whether the server may contact ``url``. Never makes an HTTP request.
    Returns {"safe": bool, "reason": str|None, "ips": [...], "resolves": bool, "blocked_private": bool}
    """
    # lookup_ok: the URL text may be sent to third-party reputation services (it is not an internal address).
    out: Dict[str, Any] = {"safe": False, "reason": None, "ips": [], "resolves": False,
                           "blocked_private": False, "lookup_ok": False}
    try:
        parsed = urlparse(url if "://" in url else "http://" + url)
        port = parsed.port
    except ValueError:
        out["reason"] = "Malformed URL."
        return out
    scheme = (parsed.scheme or "").lower()
    if scheme not in ("http", "https"):
        out["reason"] = f"Scheme '{scheme}:' is not http/https."
        return out
    port = port or (443 if scheme == "https" else 80)
    try:
        ips = resolve_public(parsed.hostname or "", port)
        out["ips"], out["resolves"], out["lookup_ok"] = ips, True, True
    except UnsafeTarget as e:
        msg = str(e)
        out["reason"] = msg
        out["blocked_private"] = "non-public" in msg
        out["resolves"] = not ("does not resolve" in msg or "did not resolve" in msg)
        out["lookup_ok"] = not out["blocked_private"]
        return out
    if parsed.username or parsed.password:
        out["reason"] = "URL embeds credentials (user@host); not contacted."
        return out
    if port not in ALLOWED_PORTS:
        out["reason"] = f"Non-standard port {port}; not contacted."
        return out
    out["safe"] = True
    return out


class _PinnedHTTP(http.client.HTTPConnection):
    def __init__(self, host, ip, port, timeout):
        super().__init__(host, port, timeout=timeout)
        self._ip = ip

    def connect(self):
        self.sock = socket.create_connection((self._ip, self.port), timeout=self.timeout)


class _PinnedHTTPS(http.client.HTTPSConnection):
    def __init__(self, host, ip, port, timeout, verify=True):
        ctx = ssl.create_default_context()
        if not verify:
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE
        super().__init__(host, port, timeout=timeout, context=ctx)
        self._ip = ip

    def connect(self):
        sock = socket.create_connection((self._ip, self.port), timeout=self.timeout)
        self.sock = self._context.wrap_socket(sock, server_hostname=self.host)


def _is_shortener_host(host: str) -> bool:
    host = (host or "").lower().rstrip(".")
    return any(host == d or host.endswith("." + d) for d in SHORTENER_DOMAINS)


def is_shortener_url(url: str) -> bool:
    try:
        return _is_shortener_host(urlparse(url if "://" in url else "http://" + url).hostname or "")
    except ValueError:
        return False


def _one_hop(url: str, ip: str, timeout: float) -> Dict[str, Any]:
    parsed = urlparse(url)
    port = parsed.port or (443 if parsed.scheme == "https" else 80)
    conn_cls = _PinnedHTTPS if parsed.scheme == "https" else _PinnedHTTP
    path = (parsed.path or "/") + (("?" + parsed.query) if parsed.query else "")
    headers = {"User-Agent": "CatchThePhish-LinkExpander/1.0", "Accept": "*/*"}
    last_exc: Optional[Exception] = None
    # Strict TLS first. Some hosts omit their intermediate certificate (browsers fetch it, Python does not);
    # only for that exact error do we retry unverified, because we merely read a redirect header and never
    # trust or contact what it points to. The hop is flagged tls_verified=False.
    for verify in ((True, False) if parsed.scheme == "https" else (True,)):
        for method in ("HEAD", "GET"):  # a few shorteners reject HEAD; the body is never read either way
            conn = (conn_cls(parsed.hostname, ip, port, timeout, verify=verify)
                    if parsed.scheme == "https" else conn_cls(parsed.hostname, ip, port, timeout))
            try:
                conn.request(method, path, headers=headers)
                resp = conn.getresponse()
                return {"status": resp.status, "location": resp.getheader("Location"), "tls_verified": verify}
            except ssl.SSLCertVerificationError as e:
                last_exc = e
                if "issuer" not in str(e).lower():
                    raise
                break  # retry whole hop unverified
            except Exception as e:  # noqa: BLE001 - reported to the caller as data
                last_exc = e
            finally:
                conn.close()
    raise last_exc or RuntimeError("request failed")


def expand_shortener(url: str) -> Dict[str, Any]:
    """
    Resolve a short link one redirect at a time WITHOUT contacting the final destination.
    Returns {"is_shortener", "expanded", "chain": [{url, host, status}], "final_url", "stopped_reason", "error"}
    """
    result: Dict[str, Any] = {
        "is_shortener": False, "expanded": False, "chain": [], "final_url": None,
        "stopped_reason": None, "error": None,
    }
    current = url if "://" in url else "http://" + url
    if not is_shortener_url(current):
        result["stopped_reason"] = "Not a known URL-shortener; redirects are not followed (the destination is never contacted)."
        return result
    result["is_shortener"] = True
    started = time.monotonic()

    for _ in range(MAX_HOPS):
        host = urlparse(current).hostname or ""
        if not _is_shortener_host(host):
            result["stopped_reason"] = "Reached a non-shortener destination; it is analysed, not contacted."
            break
        if time.monotonic() - started > TOTAL_BUDGET:
            result["stopped_reason"] = "Time budget exhausted while expanding the link."
            break
        target = inspect_target(current)
        if not target["safe"]:
            result["error"] = target["reason"]
            result["stopped_reason"] = "Blocked by network safety policy."
            break
        try:
            hop = _one_hop(current, target["ips"][0], HOP_TIMEOUT)
        except Exception as e:  # noqa: BLE001
            result["error"] = f"Could not read the redirect: {type(e).__name__}"
            result["stopped_reason"] = "Shortener did not respond."
            break
        result["chain"].append({"url": current, "host": host, "status": hop["status"], "tls_verified": hop.get("tls_verified", True)})
        loc = hop["location"]
        if hop["status"] in (301, 302, 303, 307, 308) and loc:
            nxt = urljoin(current, loc)
            if urlparse(nxt).scheme not in ("http", "https"):
                result["final_url"] = nxt
                result["stopped_reason"] = "Redirect points to a non-web scheme; not followed."
                break
            current = nxt
            result["final_url"] = nxt
            result["expanded"] = True
        else:
            result["stopped_reason"] = "Shortener returned no redirect."
            break
    else:
        result["stopped_reason"] = f"Stopped after {MAX_HOPS} redirects."

    if result["final_url"]:
        fh = urlparse(result["final_url"]).hostname or ""
        result["chain"].append({"url": result["final_url"], "host": fh, "status": None, "not_contacted": True})
    return result
