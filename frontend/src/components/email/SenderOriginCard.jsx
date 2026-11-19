import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Info, AlertTriangle } from 'lucide-react';
import { addBaseMap } from '../../lib/mapTiles';

/**
 * Where the email entered the mail system, estimated from its Received headers.
 * This is the location of a MAIL SERVER, never of a person. The wording below says so.
 */
export default function SenderOriginCard({ origin }) {
  const mapRef = useRef(null);
  const instance = useRef(null);

  const found = origin?.status === 'found' && Number.isFinite(origin.latitude) && Number.isFinite(origin.longitude);

  useEffect(() => {
    if (!found || !mapRef.current) return undefined;
    const center = [origin.latitude, origin.longitude];
    const map = L.map(mapRef.current, { center, zoom: 7, scrollWheelZoom: false, attributionControl: false });
    addBaseMap(L, map);
    // A shaded area (not a pin) because IP geolocation is only approximate.
    L.circle(center, { radius: 30000, color: '#2563EB', weight: 1.5, fillColor: '#2563EB', fillOpacity: 0.18 }).addTo(map);
    L.circleMarker(center, { radius: 6, color: '#FFFFFF', weight: 2, fillColor: '#2563EB', fillOpacity: 1 }).addTo(map);
    instance.current = map;
    const t = setTimeout(() => map.invalidateSize(), 250);
    return () => {
      clearTimeout(t);
      map.remove();
      instance.current = null;
    };
  }, [found, origin?.latitude, origin?.longitude]);

  if (!origin) return null;

  const where = [origin.city, origin.region, origin.country].filter((v, i, a) => v && v !== 'Unavailable' && a.indexOf(v) === i).join(', ');

  return (
    <section aria-labelledby="sender-origin-heading" className="rounded-2xl bg-white border border-[#E2E8F0] shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[#E2E8F0] bg-[#F5F9FF] flex items-center justify-between gap-3">
        <h2 id="sender-origin-heading" className="text-xs font-bold text-[#111827] flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-[#2563EB]" aria-hidden="true" />
          Where this email was sent from
        </h2>
        <span className="text-[11px] text-[#64748B]">Estimated mail-server location</span>
      </div>

      {found ? (
        <div className="grid grid-cols-1 md:grid-cols-5">
          <div className="md:col-span-3 min-h-[260px]">
            <div ref={mapRef} className="w-full h-full min-h-[260px] z-0" role="img" aria-label={`Map of the estimated sending server location: ${where}`} />
          </div>
          <dl className="md:col-span-2 p-5 space-y-3 text-xs">
            <div>
              <dt className="text-[#64748B]">Estimated location</dt>
              <dd className="mt-0.5 font-semibold text-[#111827] text-sm">{where || 'Unavailable'}</dd>
            </div>
            <div>
              <dt className="text-[#64748B]">Sending server address</dt>
              <dd className="mt-0.5 font-mono text-[#111827] break-all">{origin.ip}</dd>
            </div>
            {origin.claimed_hostname && (
              <div>
                <dt className="text-[#64748B]">Name the server gave itself</dt>
                <dd className="mt-0.5 font-mono text-[#111827] break-all">{origin.claimed_hostname}</dd>
              </div>
            )}
            <div>
              <dt className="text-[#64748B]">Network</dt>
              <dd className="mt-0.5 text-[#111827]">{origin.org || origin.isp || 'Unknown'}{origin.asn && origin.asn !== 'Unavailable' ? ` (${origin.asn})` : ''}</dd>
            </div>
            <div>
              <dt className="text-[#64748B]">Position in the route</dt>
              <dd className="mt-0.5 text-[#111827]">Earliest public server (step {origin.hop_number} of {origin.total_hops})</dd>
            </div>
          </dl>
        </div>
      ) : (
        <div className="p-5 text-xs text-[#64748B] flex items-start gap-2.5">
          <Info className="w-4 h-4 mt-0.5 shrink-0 text-[#2563EB]" aria-hidden="true" />
          <p>{origin.reason || 'The sending server location is not available for this email.'}</p>
        </div>
      )}

      <div className="px-5 py-4 border-t border-[#E2E8F0] space-y-2 text-[11px] leading-relaxed text-[#64748B]">
        {origin.provider_note && (
          <p className="flex items-start gap-2 text-[#B45309]">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
            <span>{origin.provider_note}</span>
          </p>
        )}
        <p><strong className="text-[#111827]">{origin.disclaimer}</strong></p>
        {origin.trust_note && <p>{origin.trust_note}</p>}
        {found && origin.confidence && <p>Accuracy: {origin.confidence}. The shaded circle shows the uncertain area.</p>}
      </div>
    </section>
  );
}
