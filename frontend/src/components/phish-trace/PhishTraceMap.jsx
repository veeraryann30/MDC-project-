import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Globe, Compass, Info, AlertCircle } from 'lucide-react';

/**
 * INTERACTIVE GLOBAL THREAT MAP
 * Visualizes approximate hosting server node location using Leaflet.js and CartoDB Dark Matter tiles.
 * Explicitly distinguishes server datacenter location vs attacker identity.
 */
export default function PhishTraceMap({ location, ip, isp, org, asn }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const lat = location?.latitude;
  const lon = location?.longitude;
  const hasCoordinates = lat !== null && lat !== undefined && lon !== null && lon !== undefined && !isNaN(lat) && !isNaN(lon);

  useEffect(() => {
    if (!hasCoordinates || !mapContainerRef.current) return;

    // If map already exists, re-center
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lon], 9);
      return;
    }

    try {
      const map = L.map(mapContainerRef.current, {
        center: [lat, lon],
        zoom: 9,
        zoomControl: true,
        scrollWheelZoom: false,
        attributionControl: false
      });

      // CartoDB Positron light tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 18,
        subdomains: 'abcd'
      }).addTo(map);

      // Custom Glowing Radar Marker (Primary Blue #2563EB)
      const pulseIcon = L.divIcon({
        className: 'phish-trace-marker',
        html: `
          <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
            <span style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background: rgba(37, 99, 235, 0.25); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
            <span style="position: absolute; width: 20px; height: 20px; border-radius: 50%; background: rgba(37, 99, 235, 0.4);"></span>
            <span style="width: 12px; height: 12px; border-radius: 50%; background: #2563EB; border: 2.5px solid #FFFFFF; box-shadow: 0 0 10px rgba(37, 99, 235, 0.6);"></span>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -16]
      });

      const popupContent = `
        <div style="font-family: inherit; font-size: 11px; padding: 4px; line-height: 1.4; color: #111827;">
          <div style="font-weight: 700; color: #2563EB; text-transform: uppercase; letter-spacing: 0.5px; font-size: 10px; margin-bottom: 2px;">
            HOSTING SERVER NODE
          </div>
          <div style="font-size: 13px; font-weight: 600; color: #111827;">
            ${location?.city || 'City Unavailable'}, ${location?.country || 'Country'}
          </div>
          <div style="font-family: monospace; font-size: 11px; color: #1E40AF; margin-top: 3px;">
            IP: ${ip || 'Resolved Node'}
          </div>
          <div style="font-size: 10px; color: #64748B; margin-top: 2px;">
            Network: ${org || isp || 'Commercial Datacenter'}
          </div>
          <div style="font-size: 9px; color: #94A3B8; margin-top: 5px; border-top: 1px solid #E2E8F0; padding-top: 4px;">
            Estimated server coordinates: ${lat?.toFixed(4)}, ${lon?.toFixed(4)}
          </div>
        </div>
      `;

      const marker = L.marker([lat, lon], { icon: pulseIcon }).addTo(map);
      marker.bindPopup(popupContent).openPopup();

      mapInstanceRef.current = map;

      const timer = setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 250);

      return () => clearTimeout(timer);
    } catch (err) {
      console.warn('Map initialization error:', err);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [hasCoordinates, lat, lon, ip, isp, org, location]);

  if (!hasCoordinates) {
    return (
      <div className="h-[360px] rounded-[16px] bg-white border border-[#E2E8F0] shadow-sm flex flex-col items-center justify-center p-6 text-center space-y-3">
        <div className="w-12 h-12 rounded-[12px] bg-[#F5F9FF] border border-[#E2E8F0] flex items-center justify-center text-[#F59E0B]">
          <AlertCircle className="w-6 h-6 stroke-[1.8]" />
        </div>
        <h4 className="text-sm font-semibold text-[#111827]">
          Geographical Coordinates Unavailable
        </h4>
        <p className="text-xs text-[#64748B] max-w-xs leading-relaxed">
          The resolved IP belongs to a private network, internal range, or public geolocation telemetry could not be resolved for this host.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[16px] bg-white border border-[#E2E8F0] shadow-sm overflow-hidden flex flex-col">
      {/* Map Header */}
      <div className="px-5 py-3.5 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F5F9FF]">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-[#2563EB]" />
          <span className="text-xs font-semibold text-[#111827]">
            Global Server Geolocation
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white border border-[#E2E8F0] text-[#16A34A] font-medium">
            CartoDB Positron
          </span>
        </div>
        <div className="text-[11px] font-mono text-[#64748B]">
          {lat?.toFixed(4)}, {lon?.toFixed(4)}
        </div>
      </div>

      {/* Map Viewport */}
      <div className="relative w-full h-[320px]">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Legend Overlay */}
        <div className="absolute bottom-3 left-3 pointer-events-none bg-white/95 border border-[#E2E8F0] px-3 py-2 rounded-[8px] text-[10px] font-mono space-y-1 backdrop-blur-sm shadow-md z-20">
          <div className="flex items-center gap-2 text-[#111827]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB] animate-pulse" />
            <span className="font-medium">Hosting Datacenter Node</span>
          </div>
          <div className="text-[#64748B] text-[9px]">
            {location?.city ? `${location.city}, ${location.country}` : (location?.country || 'Server Node')}
          </div>
        </div>
      </div>

      {/* Geolocation Disclaimer Notice */}
      <div className="px-4 py-2.5 bg-[#F5F9FF] border-t border-[#E2E8F0] flex items-center gap-2 text-[10.5px] text-[#64748B]">
        <Info className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
        <span>
          <strong className="text-[#111827]">Disclaimer: </strong>
          IP geolocation is an approximation of the hosting server routing node, not the physical location of the threat actor.
        </span>
      </div>
    </div>
  );
}
