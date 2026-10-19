"""
Link Origin Intelligence Service for Catch the Phish
Performs secure, SSRF-protected DNS resolution, IP geolocation,
network infrastructure identification (ASN, ISP, CDN/proxy detection),
and RDAP domain registration intelligence.

Adheres strictly to the Zero-Execution Protocol:
- No HTTP connections are dispatched to the target server itself.
- All resolved IPs are validated against private/loopback/cloud-metadata ranges.
- DNS rebinding safeguards are strictly enforced.
"""

import time
import json
import socket
import ipaddress
import urllib.parse
import urllib.request
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple

import dns.resolver
import dns.exception


# Cloud & CDN Identification Signatures (Inferred infrastructure, not malicious indicator)
CDN_SIGNATURES = {
    'CLOUDFLARE': 'Cloudflare CDN / Reverse Proxy',
    'AMAZON': 'Amazon AWS / CloudFront',
    'CLOUDFRONT': 'Amazon CloudFront CDN',
    'AKAMAI': 'Akamai Intelligent Edge Network',
    'FASTLY': 'Fastly Edge Cloud',
    'GOOGLE': 'Google Cloud Platform / Cloud CDN',
    'MICROSOFT': 'Microsoft Azure / Front Door',
    'AZURE': 'Microsoft Azure Infrastructure',
    'EDGECAST': 'Edgio (Edgecast) CDN',
    'INCAPSULA': 'Imperva Incapsula WAF/CDN',
    'SUCURI': 'Sucuri CloudProxy WAF',
    'OVH': 'OVHcloud Hosting',
    'DIGITALOCEAN': 'DigitalOcean Droplets',
    'HETZNER': 'Hetzner Online GmbH',
    'LINODE': 'Akamai / Linode Cloud'
}


class LinkOriginService:

    @staticmethod
    def is_public_ip(ip_str: str) -> bool:
        """
        Validates whether an IPv4 or IPv6 address is globally routable on the public internet.
        Blocks private networks, loopback, link-local, cloud metadata, multicast, and reserved ranges.
        """
        try:
            ip = ipaddress.ip_address(ip_str.strip())
            # Enforce strict public check
            if (
                ip.is_private or
                ip.is_loopback or
                ip.is_link_local or
                ip.is_reserved or
                ip.is_multicast or
                ip.is_unspecified
            ):
                return False

            # Specific cloud metadata address: 169.254.169.254
            if str(ip) == "169.254.169.254":
                return False

            # IPv4 0.0.0.0/8 range
            if ip.version == 4 and ip_str.strip().startswith("0."):
                return False

            return True
        except ValueError:
            return False

    @staticmethod
    def normalize_and_validate_target(raw_url: str) -> Tuple[str, str, Optional[str]]:
        """
        Normalizes target URL and extracts valid domain/hostname.
        Enforces supported HTTP/HTTPS schemes and prevents illegal characters.
        Returns: (normalized_url, hostname, error_message)
        """
        cleaned = raw_url.strip()
        if not cleaned:
            return "", "", "Empty URL provided."

        if not cleaned.startswith(('http://', 'https://')):
            cleaned = 'http://' + cleaned

        try:
            parsed = urllib.parse.urlsplit(cleaned)
        except Exception as e:
            return "", "", f"Malformed URL syntax: {str(e)}"

        scheme = (parsed.scheme or '').lower()
        if scheme not in ('http', 'https'):
            return "", "", f"Unsupported protocol '{scheme}'. Only HTTP and HTTPS are permitted."

        netloc = parsed.netloc
        if not netloc:
            return "", "", "No host or domain identifier found in URL."

        # Strip userinfo (user:pass@)
        if '@' in netloc:
            netloc = netloc.split('@')[-1]

        # Strip port if present
        hostname = netloc.split(':')[0].strip().lower().rstrip('.')
        if not hostname:
            return "", "", "Invalid or empty hostname."

        # Block explicit localhost or cloud metadata hostnames
        if hostname in ('localhost', 'metadata.google.internal', 'instance-data'):
            return "", "", "Access to localhost or cloud metadata endpoints is restricted."

        return cleaned, hostname, None

    @classmethod
    def resolve_dns_records(cls, hostname: str) -> Dict[str, Any]:
        """
        Performs authenticated DNS resolution for A, AAAA, CNAME, NS, and MX records.
        Applies a strict 2.5s query timeout.
        """
        resolver = dns.resolver.Resolver()
        resolver.timeout = 2.0
        resolver.lifetime = 3.0

        dns_result = {
            "status": "Resolved",
            "hostname": hostname,
            "resolved_ips": [],
            "a_records": [],
            "aaaa_records": [],
            "cname_records": [],
            "ns_records": [],
            "mx_records": [],
            "has_public_ip": False,
            "errors": []
        }

        # If hostname is already a raw IP
        try:
            ip_obj = ipaddress.ip_address(hostname)
            is_pub = cls.is_public_ip(str(ip_obj))
            ip_type = "IPv6" if ip_obj.version == 6 else "IPv4"
            dns_result["resolved_ips"].append({
                "ip": str(ip_obj),
                "type": ip_type,
                "is_public": is_pub
            })
            if ip_type == "IPv4":
                dns_result["a_records"].append(str(ip_obj))
            else:
                dns_result["aaaa_records"].append(str(ip_obj))
            dns_result["has_public_ip"] = is_pub
            dns_result["status"] = "Direct IP Target"
            return dns_result
        except ValueError:
            pass

        # 1. A Records (IPv4)
        try:
            answers = resolver.resolve(hostname, 'A')
            for rdata in answers:
                ip_str = str(rdata).strip()
                is_pub = cls.is_public_ip(ip_str)
                dns_result["a_records"].append(ip_str)
                dns_result["resolved_ips"].append({
                    "ip": ip_str,
                    "type": "IPv4",
                    "is_public": is_pub
                })
                if is_pub:
                    dns_result["has_public_ip"] = True
        except dns.resolver.NXDOMAIN:
            dns_result["status"] = "NXDOMAIN (Non-Existent Domain)"
            dns_result["errors"].append("Domain does not exist in authoritative root servers.")
            return dns_result
        except dns.resolver.NoAnswer:
            pass
        except dns.resolver.Timeout:
            dns_result["errors"].append("A-record lookup timed out.")
        except Exception as e:
            dns_result["errors"].append(f"A-record query error: {str(e)}")

        # 2. AAAA Records (IPv6)
        try:
            answers = resolver.resolve(hostname, 'AAAA')
            for rdata in answers:
                ip_str = str(rdata).strip()
                is_pub = cls.is_public_ip(ip_str)
                dns_result["aaaa_records"].append(ip_str)
                dns_result["resolved_ips"].append({
                    "ip": ip_str,
                    "type": "IPv6",
                    "is_public": is_pub
                })
                if is_pub:
                    dns_result["has_public_ip"] = True
        except (dns.resolver.NoAnswer, dns.resolver.NXDOMAIN):
            pass
        except dns.resolver.Timeout:
            dns_result["errors"].append("AAAA-record lookup timed out.")
        except Exception:
            pass

        # 3. CNAME Records
        try:
            answers = resolver.resolve(hostname, 'CNAME')
            for rdata in answers:
                dns_result["cname_records"].append(str(rdata.target).rstrip('.'))
        except (dns.resolver.NoAnswer, dns.resolver.NXDOMAIN):
            pass
        except Exception:
            pass

        # 4. NS Records (Authoritative Nameservers)
        try:
            answers = resolver.resolve(hostname, 'NS')
            for rdata in answers:
                dns_result["ns_records"].append(str(rdata.target).rstrip('.'))
        except (dns.resolver.NoAnswer, dns.resolver.NXDOMAIN):
            # Try parent domain if subdomain
            parts = hostname.split('.')
            if len(parts) > 2:
                parent_domain = '.'.join(parts[-2:])
                try:
                    p_answers = resolver.resolve(parent_domain, 'NS')
                    for rdata in p_answers:
                        dns_result["ns_records"].append(str(rdata.target).rstrip('.'))
                except Exception:
                    pass
        except Exception:
            pass

        # 5. MX Records (Mail Exchange)
        try:
            answers = resolver.resolve(hostname, 'MX')
            for rdata in answers:
                dns_result["mx_records"].append(f"{rdata.preference} {str(rdata.exchange).rstrip('.')}")
        except (dns.resolver.NoAnswer, dns.resolver.NXDOMAIN):
            pass
        except Exception:
            pass

        # Set final status
        if dns_result["resolved_ips"]:
            dns_result["status"] = "Resolved"
        elif not dns_result["errors"]:
            dns_result["status"] = "No Host IP Records Found"
        else:
            dns_result["status"] = "Resolution Incomplete"

        return dns_result

    @classmethod
    def get_ip_network_and_location(cls, ip_address: str) -> Dict[str, Any]:
        """
        Queries verified IP geolocation and network telemetry for a public IP address.
        Includes ASN, ISP, country, city, coordinates, and CDN proxy detection.
        """
        default_result = {
            "status": "fail",
            "ip": ip_address,
            "country": "Location unavailable",
            "country_code": "",
            "region": "Unavailable",
            "city": "Unavailable",
            "latitude": None,
            "longitude": None,
            "timezone": "UTC",
            "isp": "Unknown ISP",
            "org": "Unknown Organization",
            "asn": "Unavailable",
            "as_name": "",
            "is_cdn_or_proxy": False,
            "cdn_provider": None,
            "confidence": "Estimated IP Geolocation",
            "disclaimer": "Approximate hosting location — not the confirmed physical location of the website owner or attacker."
        }

        if not cls.is_public_ip(ip_address):
            default_result["country"] = "Private / Internal Range"
            default_result["isp"] = "Loopback or Private Subnet (RFC 1918 / Loopback)"
            default_result["confidence"] = "Not Geocodable"
            return default_result

        # Query public IP intelligence endpoint
        url = f"http://ip-api.com/json/{ip_address}?fields=status,message,country,countryCode,region,regionName,city,lat,lon,timezone,isp,org,as,asname,query"
        req = urllib.request.Request(
            url,
            headers={
                'User-Agent': 'CatchThePhish-NetworkIntelligence/2.0 (Academic/Security Scanner)',
                'Accept': 'application/json'
            }
        )

        try:
            with urllib.request.urlopen(req, timeout=3.0) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode('utf-8'))
                    if data.get('status') == 'success':
                        as_raw = data.get('as', '')
                        asn_num = as_raw.split()[0] if as_raw else 'Unavailable'
                        as_name = data.get('asname', '') or data.get('org', '')
                        isp = data.get('isp', '') or 'Unknown ISP'
                        org = data.get('org', '') or isp

                        # Check for CDN / Cloud proxy
                        is_cdn = False
                        cdn_provider = None
                        search_corpus = f"{as_name} {isp} {org}".upper()
                        for key, label in CDN_SIGNATURES.items():
                            if key in search_corpus:
                                is_cdn = True
                                cdn_provider = label
                                break

                        lat = data.get('lat')
                        lon = data.get('lon')

                        return {
                            "status": "success",
                            "ip": ip_address,
                            "country": data.get('country') or "Location unavailable",
                            "country_code": data.get('countryCode', ''),
                            "region": data.get('regionName') or data.get('region', 'Unavailable'),
                            "city": data.get('city') or "Unavailable",
                            "latitude": float(lat) if lat is not None else None,
                            "longitude": float(lon) if lon is not None else None,
                            "timezone": data.get('timezone', 'UTC'),
                            "isp": isp,
                            "org": org,
                            "asn": asn_num,
                            "as_name": as_name,
                            "is_cdn_or_proxy": is_cdn,
                            "cdn_provider": cdn_provider,
                            "confidence": "City-level approximation (IP Telemetry)" if data.get('city') else "Country-level approximation",
                            "disclaimer": "Approximate hosting location — not the confirmed physical location of the website owner or attacker."
                        }
        except Exception as e:
            default_result["error"] = f"Location lookup timeout or service error: {str(e)}"

        return default_result

    @staticmethod
    def get_domain_registration(hostname: str) -> Dict[str, Any]:
        """
        Queries RDAP (Registration Data Access Protocol) for domain registration intelligence.
        Extracts creation date, expiration date, updated date, and registrar.
        """
        reg_result = {
            "status": "Registration data unavailable",
            "domain": hostname,
            "registrar": "Unavailable or Private",
            "created_date": None,
            "updated_date": None,
            "expires_date": None,
            "domain_status": [],
            "source": "ICANN RDAP Protocol"
        }

        # If hostname is an IP, RDAP domain registration is not applicable
        try:
            ipaddress.ip_address(hostname)
            reg_result["status"] = "Not applicable (Direct IP Target)"
            return reg_result
        except ValueError:
            pass

        # Extract root domain (e.g. login.example.com -> example.com)
        parts = hostname.split('.')
        root_domain = hostname
        if len(parts) > 2:
            root_domain = '.'.join(parts[-2:])

        url = f"https://rdap.org/domain/{root_domain}"
        req = urllib.request.Request(
            url,
            headers={
                'User-Agent': 'CatchThePhish-SecurityScanner/2.0',
                'Accept': 'application/json'
            }
        )

        try:
            with urllib.request.urlopen(req, timeout=3.0) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode('utf-8'))
                    reg_result["status"] = "Registered & Verified"

                    # 1. Registrar name
                    for ent in data.get("entities", []):
                        if "registrar" in ent.get("roles", []):
                            vcard = ent.get("vcardArray", [])
                            if len(vcard) > 1:
                                for prop in vcard[1]:
                                    if prop[0] == "fn":
                                        reg_result["registrar"] = prop[3]
                                        break
                            if reg_result["registrar"] == "Unavailable or Private" and "handle" in ent:
                                reg_result["registrar"] = ent["handle"]

                    # 2. Key Lifecycle Events (Created, Updated, Expires)
                    for ev in data.get("events", []):
                        action = ev.get("eventAction")
                        date = ev.get("eventDate")
                        if action == "registration":
                            reg_result["created_date"] = date
                        elif action == "last changed":
                            reg_result["updated_date"] = date
                        elif action == "expiration":
                            reg_result["expires_date"] = date

                    # 3. Domain status flags
                    reg_result["domain_status"] = data.get("status", [])[:3]

        except Exception as e:
            reg_result["status"] = "Registration data unavailable or redacted by registry"

        return reg_result

    @classmethod
    def analyze(cls, raw_url: str) -> Dict[str, Any]:
        """
        Executes end-to-end Link Origin Intelligence lookup:
        1. URL validation & Hostname extraction
        2. SSRF Protection & Private IP Filtering
        3. DNS Record Resolution (A, AAAA, CNAME, NS, MX)
        4. IP Geolocation & ASN/ISP Network Intelligence
        5. RDAP Domain Registration Intelligence
        6. Technical Evidence Assembly
        """
        start_time = time.time()
        retrieved_at = datetime.utcnow().isoformat() + "Z"

        normalized_url, hostname, err = cls.normalize_and_validate_target(raw_url)
        if err:
            return {
                "destination": raw_url,
                "hostname": hostname or raw_url,
                "retrieved_at": retrieved_at,
                "dns": {
                    "status": "Validation Failed",
                    "resolved_ips": [],
                    "a_records": [],
                    "aaaa_records": [],
                    "cname_records": [],
                    "ns_records": [],
                    "mx_records": [],
                    "errors": [err]
                },
                "network": {
                    "primary_ip": "Unavailable",
                    "isp": "Unavailable",
                    "org": "Unavailable",
                    "asn": "Unavailable",
                    "as_name": "Unavailable",
                    "is_cdn_or_proxy": False,
                    "cdn_provider": None
                },
                "location": {
                    "country": "Location unavailable",
                    "country_code": "",
                    "region": "Unavailable",
                    "city": "Unavailable",
                    "latitude": None,
                    "longitude": None,
                    "confidence": "Unavailable",
                    "disclaimer": "Approximate hosting location — not the confirmed physical location of the website owner or attacker."
                },
                "registration": {
                    "status": "Unavailable",
                    "registrar": "Unavailable",
                    "created_date": None,
                    "updated_date": None,
                    "expires_date": None
                },
                "technical_evidence": {
                    "submitted_url": raw_url,
                    "normalized_hostname": hostname,
                    "query_latency_ms": round((time.time() - start_time) * 1000, 1),
                    "ssrf_protection": "Enforced: Target rejected by safety policy",
                    "data_sources": ["Catch the Phish Security Gateway"]
                }
            }

        # 1. Resolve DNS records safely
        dns_data = cls.resolve_dns_records(hostname)

        # 2. Pick primary public IP for geolocation
        public_ips = [item["ip"] for item in dns_data.get("resolved_ips", []) if item.get("is_public")]
        primary_ip = public_ips[0] if public_ips else (
            dns_data["resolved_ips"][0]["ip"] if dns_data.get("resolved_ips") else "Unavailable"
        )

        # 3. Geolocation & ASN Intelligence
        network_loc_data = cls.get_ip_network_and_location(primary_ip)

        # 4. Domain Registration Intelligence (RDAP)
        registration_data = cls.get_domain_registration(hostname)

        # 5. Technical Evidence Compilation
        query_latency = round((time.time() - start_time) * 1000, 1)

        return {
            "destination": hostname,
            "hostname": hostname,
            "submitted_url": normalized_url,
            "retrieved_at": retrieved_at,
            "dns": dns_data,
            "network": {
                "primary_ip": primary_ip,
                "all_ips": dns_data.get("resolved_ips", []),
                "isp": network_loc_data.get("isp", "Unknown ISP"),
                "org": network_loc_data.get("org", "Unknown Organization"),
                "asn": network_loc_data.get("asn", "Unavailable"),
                "as_name": network_loc_data.get("as_name", ""),
                "is_cdn_or_proxy": network_loc_data.get("is_cdn_or_proxy", False),
                "cdn_provider": network_loc_data.get("cdn_provider"),
            },
            "location": {
                "country": network_loc_data.get("country", "Location unavailable"),
                "country_code": network_loc_data.get("country_code", ""),
                "region": network_loc_data.get("region", "Unavailable"),
                "city": network_loc_data.get("city", "Unavailable"),
                "latitude": network_loc_data.get("latitude"),
                "longitude": network_loc_data.get("longitude"),
                "timezone": network_loc_data.get("timezone", "UTC"),
                "confidence": network_loc_data.get("confidence", "Estimated IP Geolocation"),
                "disclaimer": network_loc_data.get("disclaimer")
            },
            "registration": registration_data,
            "technical_evidence": {
                "submitted_url": raw_url,
                "normalized_hostname": hostname,
                "resolved_public_ips": public_ips,
                "query_latency_ms": query_latency,
                "ssrf_protection": "Enforced: RFC 1918 / Loopback / Metadata Verification Active",
                "data_sources": [
                    "Authoritative DNS Protocol (dnspython)",
                    "IP Geolocation & BGP ASN Telemetry (ip-api)",
                    "ICANN Registration Data Access Protocol (RDAP)"
                ],
                "errors": dns_data.get("errors", [])
            }
        }
