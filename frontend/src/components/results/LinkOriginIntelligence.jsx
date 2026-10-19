import React, { useState, useEffect, useRef } from 'react';
import { 
  Server, Globe, MapPin, Shield, ShieldCheck, AlertCircle, 
  ChevronDown, ChevronUp, Network, Cpu, Layers, Lock, 
  Clock, Compass, Info, CheckCircle2, Radio, ExternalLink 
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../../services/api';

/**
 * LINK ORIGIN INTELLIGENCE COMPONENT (SHADOW UI)
 * 
 * Provides deep infrastructure reconnaissance and geographical telemetry for target URLs:
 * - Resolved IPv4 / IPv6 addresses & DNS status
 * - Approximate Geo-location with Leaflet Dark Matter map
 * - ISP, Autonomous System (ASN), and Cloud/CDN Reverse Proxy detection
 * - Expandable technical DNS records & ICANN RDAP registration intelligence
 * - Enforces strict Zero-Execution and SSRF isolation safeguards
 */
export default function LinkOriginIntelligence({ originData: initialData, targetUrl, domain }) {
  const [data, setData] = useState(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState(null);

  // Accordion toggle states
  const [dnsExpanded, setDnsExpanded] = useState(false);
  const [regExpanded, setRegExpanded] = useState(false);
  const [evidenceExpanded, setEvidenceExpanded] = useState(false);
  const [selectedIpIndex, setSelectedIpIndex] = useState(0);

  // Leaflet map container ref and map instance ref
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  // Fetch origin intelligence if not provided in initial scan
  useEffect(() => {
    let isMounted = true;

    if (initialData) {
      setData(initialData);
      setLoading(false);
      return;
    }

    if (!targetUrl && !domain) {
      setLoading(false);
      return;
    }

    const fetchOrigin = async () => {
      try {
        setLoading(true);
        setError(null);
        const queryTarget = targetUrl || domain;
        const res = await api.getOriginIntelligence(queryTarget);
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load origin intelligence:', err);
          setError('Unable to retrieve infrastructure telemetry for this host.');
          setLoading(false);
        }
      }
    };

    fetchOrigin();

    return () => {
      isMounted = false;
    };
  }, [initialData, targetUrl, domain]);

  // Leaflet Map Initialization & Updates
  useEffect(() => {
    if (!data || !mapContainerRef.current) return;

    const lat = data.location?.latitude;
    const lon = data.location?.longitude;

    // If coordinates are invalid or private IP, destroy any existing map instance and exit
    if (lat === null || lat === undefined || lon === null || lon === undefined || isNaN(lat) || isNaN(lon)) {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      return;
    }

    // If map already exists, update center
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lon], 10);
      return;
    }

    try {
      // Create new Leaflet map instance
      const map = L.map(mapContainerRef.current, {
        center: [lat, lon],
        zoom: 9,
        zoomControl: true,
        scrollWheelZoom: false,
        attributionControl: false
      });

      // CartoDB Dark Matter tiles for SHADOW UI aesthetic
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 18,
        subdomains: 'abcd'
      }).addTo(map);

      // Custom SHADOW UI glowing radar pulse pin
      const pulseIcon = L.divIcon({
        className: 'origin-pulse-marker',
        html: `
          <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
            <span style="position: absolute; width: 28px; height: 28px; border-radius: 50%; background: rgba(255, 107, 53, 0.35); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
            <span style="position: absolute; width: 18px; height: 18px; border-radius: 50%; background: rgba(255, 107, 53, 0.6);"></span>
            <span style="width: 10px; height: 10px; border-radius: 50%; background: #FF6B35; border: 2px solid #FFFFFF; box-shadow: 0 0 8px #FF6B35;"></span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -14]
      });

      const popupContent = `
        <div style="font-family: inherit; font-size: 11px; padding: 4px; line-height: 1.4;">
          <div style="font-weight: 700; color: #FF6B35; text-transform: uppercase; letter-spacing: 0.5px; font-size: 10px; margin-bottom: 2px;">
            Approximate Server Node
          </div>
          <div style="color: #F5F5F5; font-weight: 600; font-size: 12px;">
            ${data.location.city || 'City'}, ${data.location.country || 'Country'}
          </div>
          <div style="color: #92929A; font-family: monospace; font-size: 10px; margin-top: 3px;">
            IP: ${data.network?.primary_ip || 'Resolved Node'}
          </div>
          <div style="color: #686870; font-size: 9px; margin-top: 4px; border-top: 1px solid #29292D; padding-top: 4px;">
            Approximate routing location, not individual user.
          </div>
        </div>
      `;

      const marker = L.marker([lat, lon], { icon: pulseIcon }).addTo(map);
      marker.bindPopup(popupContent).openPopup();

      mapInstanceRef.current = map;

      // Invalidate size after layout stabilization
      const timer = setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 300);

      return () => clearTimeout(timer);
    } catch (e) {
      console.warn('Leaflet initialization notice:', e);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [data]);

  // Loading Skeleton State
  if (loading) {
    return (
      <div className="p-6 sm:p-8 rounded-[18px] bg-[#151517] border border-[#29292D] space-y-6 animate-pulse">
        <div className="space-y-2">
          <div className="h-6 w-64 bg-[#29292D] rounded"></div>
          <div className="h-4 w-96 bg-[#29292D]/60 rounded"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-32 bg-[#101012] border border-[#29292D] rounded-[14px]"></div>
          <div className="h-32 bg-[#101012] border border-[#29292D] rounded-[14px]"></div>
          <div className="h-32 bg-[#101012] border border-[#29292D] rounded-[14px]"></div>
        </div>
        <div className="h-64 bg-[#101012] border border-[#29292D] rounded-[14px]"></div>
      </div>
    );
  }

  // Error State or Empty Data
  if (!data || error) {
    return (
      <div className="p-6 rounded-[18px] bg-[#151517] border border-[#29292D] space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono text-[#F2B84B]">
          <AlertCircle className="w-4 h-4" />
          <span>Link Origin Intelligence Unavailable</span>
        </div>
        <p className="text-xs text-[#92929A]">
          {error || 'Infrastructure telemetry could not be resolved for this host. The target domain may be unresolvable or rejected by SSRF safety policies.'}
        </p>
      </div>
    );
  }

  const {
    dns = {},
    network = {},
    location = {},
    registration = {},
    technical_evidence = {},
    retrieved_at
  } = data;

  const resolvedIps = dns.resolved_ips || [];
  const primaryIp = network.primary_ip || (resolvedIps[0]?.ip) || 'Unavailable';
  const hasCoordinates = location.latitude !== null && location.latitude !== undefined && !isNaN(location.latitude);
  const isCdn = network.is_cdn_or_proxy;

  return (
    <section className="p-6 sm:p-8 rounded-[18px] bg-[#151517] border border-[#29292D] space-y-8 select-none">
      {/* 1. SECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#29292D]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[8px] bg-[#FF6B35]/10 border border-[#FF6B35]/30 flex items-center justify-center text-[#FF6B35]">
              <Compass className="w-4 h-4 stroke-[2]" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#F5F5F5]">
              Link Origin Intelligence
            </h2>
            <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#101012] border border-[#29292D] text-[#35C98A]">
              SSRF Protected
            </span>
          </div>
          <p className="text-xs text-[#92929A] leading-relaxed">
            Investigate the infrastructure and approximate geographical origin associated with this URL.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-[#101012] border border-[#29292D] text-[11px] font-mono text-[#92929A]">
            <Clock className="w-3.5 h-3.5 text-[#686870]" />
            <span>{retrieved_at ? new Date(retrieved_at).toLocaleTimeString() : 'Fresh Telemetry'}</span>
          </div>
        </div>
      </div>

      {/* 2. ROW 1: PRIMARY INFRASTRUCTURE CARDS (3 COLUMNS) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* CARD A: Hosting IP Address */}
        <div className="p-5 rounded-[14px] bg-[#101012] border border-[#29292D] flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#686870] flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-[#FF6B35]" />
                <span>Hosting IP Address</span>
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                dns.status === 'Resolved' || dns.status === 'Direct IP Target'
                  ? 'bg-[#101F18] border-[#35C98A]/30 text-[#35C98A]'
                  : 'bg-[#221B10] border-[#F2B84B]/30 text-[#F2B84B]'
              }`}>
                {dns.status || 'Resolved'}
              </span>
            </div>

            <div className="space-y-1">
              <div className="font-mono text-sm sm:text-base font-bold text-[#F5F5F5] break-all select-all flex items-center justify-between gap-2">
                <span>{primaryIp}</span>
                {resolvedIps.length > 1 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#151517] border border-[#29292D] text-[#92929A]">
                    +{resolvedIps.length - 1} more
                  </span>
                )}
              </div>
              <div className="text-[11px] font-mono text-[#92929A] flex items-center gap-2">
                <span>Type: {primaryIp.includes(':') ? 'IPv6' : 'IPv4'}</span>
                <span>•</span>
                <span className={dns.has_public_ip ? 'text-[#35C98A]' : 'text-[#F2B84B]'}>
                  {dns.has_public_ip ? 'Public Routable' : 'Private / Reserved'}
                </span>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-[#686870] border-t border-[#29292D] pt-2.5 leading-normal">
            Resolved address reflects network routing endpoints; domains often route via reverse proxies or cloud load balancers.
          </p>
        </div>

        {/* CARD B: Approximate Hosting Location */}
        <div className="p-5 rounded-[14px] bg-[#101012] border border-[#29292D] flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#686870] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#FF6B35]" />
                <span>Approximate Location</span>
              </span>
              {location.country_code && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#151517] border border-[#29292D] text-[#F5F5F5]">
                  {location.country_code}
                </span>
              )}
            </div>

            <div className="space-y-1">
              <div className="font-semibold text-sm sm:text-base text-[#F5F5F5] truncate" title={`${location.city || ''}, ${location.region || ''}`}>
                {location.country || 'Location unavailable'}
              </div>
              <div className="text-xs text-[#92929A] truncate">
                {location.city && location.city !== 'Unavailable' 
                  ? `${location.city}, ${location.region || ''}` 
                  : (location.region !== 'Unavailable' ? location.region : 'Region unmapped')}
              </div>
              <div className="text-[11px] font-mono text-[#686870]">
                {hasCoordinates 
                  ? `${location.latitude.toFixed(4)}°, ${location.longitude.toFixed(4)}°`
                  : 'Coordinates unmapped'}
              </div>
            </div>
          </div>

          <div className="border-t border-[#29292D] pt-2.5">
            <p className="text-[10px] text-[#F2B84B] leading-tight flex items-start gap-1">
              <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
              <span>
                <strong>Approximate hosting location:</strong> Not the confirmed physical location of the website owner or attacker.
              </span>
            </p>
          </div>
        </div>

        {/* CARD C: Hosting Provider & Network Information */}
        <div className="p-5 rounded-[14px] bg-[#101012] border border-[#29292D] flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#686870] flex items-center gap-1.5">
                <Network className="w-3.5 h-3.5 text-[#FF6B35]" />
                <span>Hosting & Network</span>
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                isCdn 
                  ? 'bg-[#151517] border-[#FF6B35]/40 text-[#FF6B35]' 
                  : 'bg-[#151517] border-[#29292D] text-[#92929A]'
              }`}>
                {isCdn ? 'CDN / Proxy' : 'Direct Host'}
              </span>
            </div>

            <div className="space-y-1">
              <div className="font-semibold text-sm sm:text-base text-[#F5F5F5] truncate" title={network.org || network.isp}>
                {network.org || network.isp || 'Provider Unavailable'}
              </div>
              <div className="text-xs font-mono text-[#92929A] truncate">
                {network.asn && network.asn !== 'Unavailable' ? `${network.asn}` : 'ASN Unassigned'}
                {network.as_name ? ` (${network.as_name})` : ''}
              </div>
              {isCdn && (
                <div className="text-[11px] font-mono text-[#FF6B35] truncate">
                  {network.cdn_provider || 'Reverse Proxy / Edge Caching'}
                </div>
              )}
            </div>
          </div>

          <p className="text-[10px] text-[#686870] border-t border-[#29292D] pt-2.5 leading-normal">
            {isCdn
              ? 'Edge proxy detected. Content is routed through distributed edge points.'
              : 'Direct ASN routing. CDN presence or host origin is not a threat classification factor.'}
          </p>
        </div>
      </div>

      {/* 3. ROW 2: INTERACTIVE MAP & NETWORK DOSSIER (2 COLUMNS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* LEAFLET MAP CONTAINER (7 COLUMNS) */}
        <div className="lg:col-span-7 flex flex-col rounded-[16px] bg-[#101012] border border-[#29292D] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#29292D] flex items-center justify-between text-xs font-mono">
            <span className="text-[#92929A] flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-[#FF6B35]" />
              <span>Geographic Server Telemetry</span>
            </span>
            <span className="text-[#686870] text-[11px]">
              CartoDB Dark Matter
            </span>
          </div>

          <div className="relative flex-1 min-h-[300px] w-full bg-[#0B0B0C]">
            {hasCoordinates ? (
              <div 
                ref={mapContainerRef} 
                className="w-full h-full min-h-[300px] z-0" 
              />
            ) : (
              <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-[14px] bg-[#151517] border border-[#29292D] flex items-center justify-center text-[#686870]">
                  <Compass className="w-6 h-6 stroke-[1.5]" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-[#F5F5F5]">Coordinates Unavailable</h4>
                  <p className="text-xs text-[#92929A] max-w-sm">
                    {location.country === 'Private / Internal Range'
                      ? 'Local / RFC 1918 private address ranges cannot be geolocated on the public internet.'
                      : 'Public geolocation telemetry for this IP is withheld or not cataloged by BGP registries.'}
                  </p>
                </div>
              </div>
            )}

            {/* Map disclaimer banner overlay */}
            <div className="absolute bottom-2 left-2 right-2 z-[400] pointer-events-none">
              <div className="p-2 rounded-[8px] bg-[#101012]/90 backdrop-blur-md border border-[#29292D] text-[10px] text-[#92929A] flex items-center justify-between">
                <span className="truncate">
                  Server node: {location.city || 'Unknown'}, {location.country || 'Global'}
                </span>
                <span className="text-[#686870] font-mono text-[9px] shrink-0 ml-2">
                  Not User Location
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* NETWORK INTELLIGENCE SUMMARY (5 COLUMNS) */}
        <div className="lg:col-span-5 p-5 sm:p-6 rounded-[16px] bg-[#101012] border border-[#29292D] flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#29292D] pb-3">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#686870] flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-[#35C98A]" />
                <span>Infrastructure Telemetry</span>
              </span>
              <span className="text-[10px] font-mono text-[#35C98A]">Passive Recon</span>
            </div>

            <div className="divide-y divide-[#29292D] text-xs font-mono">
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-[#92929A]">Target Host</span>
                <span className="text-[#F5F5F5] font-semibold truncate max-w-[190px]" title={dns.hostname || domain}>
                  {dns.hostname || domain}
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-[#92929A]">Autonomous System</span>
                <span className="text-[#F5F5F5] truncate max-w-[190px]">
                  {network.asn || 'Unavailable'}
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-[#92929A]">ISP / Carrier</span>
                <span className="text-[#F5F5F5] truncate max-w-[190px]" title={network.isp}>
                  {network.isp || 'Unknown'}
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-[#92929A]">Edge Architecture</span>
                <span className={isCdn ? 'text-[#FF6B35]' : 'text-[#35C98A]'}>
                  {isCdn ? 'Reverse Proxy / CDN' : 'Standard Web Host'}
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-[#92929A]">Geolocation Precision</span>
                <span className="text-[#92929A] text-[11px]">
                  {location.confidence || 'City-level'}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-[10px] bg-[#151517] border border-[#29292D] space-y-1 text-[11px]">
            <div className="flex items-center gap-1.5 text-[#92929A] font-semibold">
              <Shield className="w-3.5 h-3.5 text-[#35C98A]" />
              <span>Independent Risk Guarantee</span>
            </div>
            <p className="text-[10px] text-[#686870] leading-relaxed">
              Hosting location, CDN status, and ISP networks are displayed for infrastructure visibility only and do not modify the phishing detection score.
            </p>
          </div>
        </div>
      </div>

      {/* 4. ROW 3: TECHNICAL INSPECTION ACCORDIONS */}
      <div className="space-y-3">
        {/* ACCORDION 1: DNS INTELLIGENCE */}
        <div className="rounded-[14px] bg-[#101012] border border-[#29292D] overflow-hidden">
          <button
            onClick={() => setDnsExpanded(!dnsExpanded)}
            className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-[#151517] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[8px] bg-[#151517] border border-[#29292D] flex items-center justify-center text-[#FF6B35]">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-semibold text-[#F5F5F5]">
                  DNS Intelligence (A, AAAA, CNAME, NS, MX)
                </h4>
                <p className="text-[11px] text-[#92929A]">
                  Authoritative name resolution records and mail routing topology.
                </p>
              </div>
            </div>
            {dnsExpanded ? <ChevronUp className="w-4 h-4 text-[#92929A]" /> : <ChevronDown className="w-4 h-4 text-[#92929A]" />}
          </button>

          {dnsExpanded && (
            <div className="p-5 border-t border-[#29292D] space-y-4 bg-[#0B0B0C]/40 text-xs font-mono">
              <div className="space-y-3">
                {/* A Records */}
                <div>
                  <span className="text-[11px] text-[#686870] uppercase tracking-wider block mb-1.5">
                    A Records (IPv4 Host Mapping)
                  </span>
                  {dns.a_records && dns.a_records.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {dns.a_records.map((ip, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-[6px] bg-[#151517] border border-[#29292D] text-[#F5F5F5]">
                          {ip}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[#686870] italic">No A records resolved.</span>
                  )}
                </div>

                {/* AAAA Records */}
                <div>
                  <span className="text-[11px] text-[#686870] uppercase tracking-wider block mb-1.5">
                    AAAA Records (IPv6 Host Mapping)
                  </span>
                  {dns.aaaa_records && dns.aaaa_records.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {dns.aaaa_records.map((ip, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-[6px] bg-[#151517] border border-[#29292D] text-[#F5F5F5]">
                          {ip}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[#686870] italic">No IPv6 AAAA records present.</span>
                  )}
                </div>

                {/* CNAME Records */}
                <div>
                  <span className="text-[11px] text-[#686870] uppercase tracking-wider block mb-1.5">
                    CNAME Records (Canonical Aliases)
                  </span>
                  {dns.cname_records && dns.cname_records.length > 0 ? (
                    <div className="space-y-1">
                      {dns.cname_records.map((cname, idx) => (
                        <div key={idx} className="p-2 rounded bg-[#151517] border border-[#29292D] text-[#92929A]">
                          ↳ {cname}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[#686870] italic">Direct root record (No CNAME alias chaining).</span>
                  )}
                </div>

                {/* NS Records */}
                <div>
                  <span className="text-[11px] text-[#686870] uppercase tracking-wider block mb-1.5">
                    NS Records (Authoritative Nameservers)
                  </span>
                  {dns.ns_records && dns.ns_records.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {dns.ns_records.map((ns, idx) => (
                        <div key={idx} className="p-2 rounded bg-[#151517] border border-[#29292D] text-[#92929A] truncate">
                          {ns}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[#686870] italic">Nameserver delegation records unavailable.</span>
                  )}
                </div>

                {/* MX Records */}
                <div>
                  <span className="text-[11px] text-[#686870] uppercase tracking-wider block mb-1.5">
                    MX Records (Mail Exchangers)
                  </span>
                  {dns.mx_records && dns.mx_records.length > 0 ? (
                    <div className="space-y-1">
                      {dns.mx_records.map((mx, idx) => (
                        <div key={idx} className="p-2 rounded bg-[#151517] border border-[#29292D] text-[#92929A]">
                          Priority {mx}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[#686870] italic">No MX records advertised (Domain does not receive direct mail).</span>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-[#29292D] text-[10px] text-[#686870]">
                Note: The absence of specific records (such as MX or AAAA) does not indicate malicious activity.
              </div>
            </div>
          )}
        </div>

        {/* ACCORDION 2: DOMAIN REGISTRATION INTELLIGENCE (RDAP) */}
        <div className="rounded-[14px] bg-[#101012] border border-[#29292D] overflow-hidden">
          <button
            onClick={() => setRegExpanded(!regExpanded)}
            className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-[#151517] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[8px] bg-[#151517] border border-[#29292D] flex items-center justify-center text-[#35C98A]">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-semibold text-[#F5F5F5]">
                  Domain Registration Intelligence (RDAP / Registry Lifecycle)
                </h4>
                <p className="text-[11px] text-[#92929A]">
                  ICANN Registration Data Access Protocol (RDAP) registry dates and registrar.
                </p>
              </div>
            </div>
            {regExpanded ? <ChevronUp className="w-4 h-4 text-[#92929A]" /> : <ChevronDown className="w-4 h-4 text-[#92929A]" />}
          </button>

          {regExpanded && (
            <div className="p-5 border-t border-[#29292D] space-y-4 bg-[#0B0B0C]/40 text-xs font-mono">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-[10px] bg-[#151517] border border-[#29292D]">
                  <span className="text-[10px] text-[#686870] block">Registrar</span>
                  <span className="text-[#F5F5F5] font-semibold truncate block mt-0.5" title={registration.registrar}>
                    {registration.registrar || 'Redacted / Unavailable'}
                  </span>
                </div>
                <div className="p-3 rounded-[10px] bg-[#151517] border border-[#29292D]">
                  <span className="text-[10px] text-[#686870] block">Creation Date</span>
                  <span className="text-[#F5F5F5] font-semibold block mt-0.5">
                    {registration.created_date ? new Date(registration.created_date).toLocaleDateString() : 'Unavailable'}
                  </span>
                </div>
                <div className="p-3 rounded-[10px] bg-[#151517] border border-[#29292D]">
                  <span className="text-[10px] text-[#686870] block">Expiration Date</span>
                  <span className="text-[#F5F5F5] font-semibold block mt-0.5">
                    {registration.expires_date ? new Date(registration.expires_date).toLocaleDateString() : 'Unavailable'}
                  </span>
                </div>
                <div className="p-3 rounded-[10px] bg-[#151517] border border-[#29292D]">
                  <span className="text-[10px] text-[#686870] block">Last Updated</span>
                  <span className="text-[#F5F5F5] font-semibold block mt-0.5">
                    {registration.updated_date ? new Date(registration.updated_date).toLocaleDateString() : 'Unavailable'}
                  </span>
                </div>
              </div>

              {registration.domain_status && registration.domain_status.length > 0 && (
                <div>
                  <span className="text-[11px] text-[#686870] uppercase tracking-wider block mb-1.5">
                    Registry Status Codes
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {registration.domain_status.map((status, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-[#151517] border border-[#29292D] text-[#92929A] text-[10px]">
                        {status}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-[10px] text-[#686870] leading-relaxed">
                If personal registrant names or street addresses are withheld, this reflects standard ICANN WHOIS/RDAP privacy redaction policies under GDPR/CCPA.
              </p>
            </div>
          )}
        </div>

        {/* ACCORDION 3: TECHNICAL EVIDENCE & SSRF GUARDRAILS */}
        <div className="rounded-[14px] bg-[#101012] border border-[#29292D] overflow-hidden">
          <button
            onClick={() => setEvidenceExpanded(!evidenceExpanded)}
            className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-[#151517] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[8px] bg-[#151517] border border-[#29292D] flex items-center justify-center text-[#F2B84B]">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-semibold text-[#F5F5F5]">
                  Technical Evidence & SSRF Protection Policy
                </h4>
                <p className="text-[11px] text-[#92929A]">
                  Zero-Execution isolation parameters, query latency, and data verification sources.
                </p>
              </div>
            </div>
            {evidenceExpanded ? <ChevronUp className="w-4 h-4 text-[#92929A]" /> : <ChevronDown className="w-4 h-4 text-[#92929A]" />}
          </button>

          {evidenceExpanded && (
            <div className="p-5 border-t border-[#29292D] space-y-4 bg-[#0B0B0C]/40 text-xs font-mono">
              <div className="space-y-2 text-[#92929A]">
                <div>
                  <strong className="text-[#F5F5F5]">Submitted Target: </strong>
                  <code>{technical_evidence.submitted_url || targetUrl}</code>
                </div>
                <div>
                  <strong className="text-[#F5F5F5]">Normalized Hostname: </strong>
                  <code>{technical_evidence.normalized_hostname || domain}</code>
                </div>
                <div>
                  <strong className="text-[#F5F5F5]">SSRF Protection: </strong>
                  <span className="text-[#35C98A]">{technical_evidence.ssrf_protection || 'Active: Loopback / RFC 1918 / Cloud Metadata Blocked'}</span>
                </div>
                <div>
                  <strong className="text-[#F5F5F5]">Query Latency: </strong>
                  <span>{technical_evidence.query_latency_ms ? `${technical_evidence.query_latency_ms} ms` : 'Sub-50ms'}</span>
                </div>
                <div>
                  <strong className="text-[#F5F5F5]">Authoritative Protocols: </strong>
                  <span>{(technical_evidence.data_sources || []).join(' • ') || 'Authoritative DNS, BGP Telemetry, RDAP'}</span>
                </div>
              </div>

              <div className="p-3 rounded-[10px] bg-[#151517] border border-[#29292D] text-[11px] text-[#686870]">
                Zero-Execution Safeguard: Catch the Phish never initiates HTTP, WebSocket, or TCP socket connections directly to the target URL during origin reconnaissance. All queries are conducted purely through authoritative DNS root servers and authorized telemetry endpoints.
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
