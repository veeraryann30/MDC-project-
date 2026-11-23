import React from 'react';
import { CheckCircle2 } from 'lucide-react';

/**
 * Analyst view: domain facts, signal values, every rule that fired and the raw feature evidence.
 * Reads only what the backend returned for this scan.
 */
export default function TechnicalDetails({ result }) {
  const {
    url = '',
    domain = '',
    breakdown = {},
    threats_detected = [],
    safe_indicators = [],
    features = {},
    details = {},
  } = result;

  const hasFeatures = Object.keys(features || {}).length > 0;

  const sevStyle = (severity) =>
    severity === 'MEDIUM' || severity === 'ELEVATED'
      ? { color: '#F59E0B', cls: 'bg-[#FFFBEB] border-[#FDE68A] text-[#D97706]' }
      : severity === 'LOW'
        ? { color: '#64748B', cls: 'bg-slate-100 border-[#E2E8F0] text-[#475569]' }
        : { color: '#DC2626', cls: 'bg-[#FEF2F2] border-[#FECACA] text-[#DC2626]' };

  return (
    <div className="space-y-5 font-sans">
      {/* Domain + signals */}
      {hasFeatures && (
      <div className="space-y-5 rounded-2xl border border-[#E2E8F0] bg-white p-5">
        <div>
          <span className="mb-2 block font-mono text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">Domain summary</span>
          <div className="divide-y divide-[#E2E8F0] font-mono text-xs">
            <div className="flex justify-between py-2"><span className="text-[#64748B]">Hostname</span><span className="max-w-[260px] truncate font-semibold text-[#111827]" title={domain}>{domain}</span></div>
            <div className="flex justify-between py-2">
              <span className="text-[#64748B]">Transport security</span>
              <span className={features.has_https ? 'font-semibold text-[#16A34A]' : 'font-semibold text-[#DC2626]'}>{features.has_https ? 'HTTPS encrypted' : 'Insecure HTTP'}</span>
            </div>
            <div className="flex justify-between py-2"><span className="text-[#64748B]">Top-level domain</span><span className="text-[#111827]">.{details.tld || '—'}</span></div>
            <div className="flex justify-between py-2"><span className="text-[#64748B]">Character entropy</span><span className="font-medium text-[#111827]">{features.domain_entropy ?? features.entropy ?? '—'}</span></div>
          </div>
        </div>

        <div className="border-t border-[#E2E8F0] pt-4">
          <span className="mb-2.5 block font-mono text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">Signal values</span>
          <div className="grid grid-cols-2 gap-2.5 font-mono text-xs">
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F5F9FF] p-3">
              <span className="block text-[10px] text-[#64748B]">Machine learning</span>
              <span className="text-base font-bold text-[#2563EB]">{breakdown.ml_score ?? 0}%</span>
              <span className="mt-0.5 block text-[10px] text-[#64748B]">Random Forest + Logistic Regression</span>
            </div>
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F5F9FF] p-3">
              <span className="block text-[10px] text-[#64748B]">Heuristic rules</span>
              <span className="text-base font-bold text-[#2563EB]">{breakdown.rule_score ?? 0}%</span>
              <span className="mt-0.5 block text-[10px] text-[#64748B]">Lexical logic</span>
            </div>
          </div>
        </div>
      </div>

      )}

      {/* Findings */}
      <div className="space-y-3 rounded-2xl border border-[#E2E8F0] bg-white p-5">
        <h3 className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-[#111827]">
          Findings
          <span className="rounded-full border border-[#DBEAFE] bg-[#F5F9FF] px-2.5 py-0.5 text-[10px] font-bold text-[#2563EB]">{threats_detected.length} flagged</span>
        </h3>

        {threats_detected.length > 0 ? (
          <div className="space-y-2.5">
            {threats_detected.map((threat, idx) => {
              const sev = threat.severity || 'HIGH';
              const st = sevStyle(sev);
              return (
                <div key={threat.id || idx} className="space-y-1.5 rounded-xl border border-[#E2E8F0] bg-[#F5F9FF] p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#111827]">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: st.color }} />
                      <span>{threat.title}</span>
                    </div>
                    <span className={`rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold ${st.cls}`}>{sev}</span>
                  </div>
                  <p className="text-xs leading-relaxed text-[#64748B]">{threat.description || threat.what_was_detected}</p>
                  {threat.why_it_matters && (
                    <p className="border-t border-[#E2E8F0] pt-1.5 text-[11px] italic text-[#475569]">
                      <strong className="not-italic text-[#111827]">Why it matters: </strong>{threat.why_it_matters}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-1.5 rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] p-6 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-[#16A34A]" />
            <h4 className="text-sm font-bold text-[#111827]">No anomalies identified</h4>
            <p className="mx-auto max-w-sm text-xs text-[#64748B]">No rule fired on this link&apos;s structure, domain or keywords.</p>
          </div>
        )}

        {safe_indicators.length > 0 && (
          <div className="space-y-2 border-t border-[#E2E8F0] pt-4">
            <span className="block font-mono text-[11px] font-bold uppercase tracking-wider text-[#16A34A]">Trust signals</span>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {safe_indicators.map((safe, idx) => (
                <div key={safe.id || idx} className="space-y-1 rounded-xl border border-[#E2E8F0] bg-[#F5F9FF] p-3 text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-[#16A34A]"><CheckCircle2 className="h-3.5 w-3.5 shrink-0" /><span>{safe.title}</span></div>
                  <p className="text-[11px] leading-tight text-[#64748B]">{safe.description || safe.what_was_detected}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Raw evidence */}
      {hasFeatures && (
      <div className="space-y-3 rounded-2xl border border-[#E2E8F0] bg-white p-5 font-mono text-xs">
        <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">Forensic evidence</span>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {[
            ['URL length', `${features.url_length || url.length} chars`],
            ['Subdomains', features.subdomain_count ?? 0],
            ['Directory depth', features.num_subdirs ?? 0],
            ['Punycode / IDN', features.has_punycode ? 'Detected' : 'Standard', features.has_punycode],
            ['Raw IP target', features.is_ip_address || features.has_ip ? 'Yes' : 'No', features.is_ip_address || features.has_ip],
            ['URL shortener', features.is_shortener ? 'Yes' : 'No', features.is_shortener],
          ].map(([k, v, bad]) => (
            <div key={k} className="rounded-xl border border-[#E2E8F0] bg-[#F5F9FF] p-3">
              <span className="block text-[10px] text-[#64748B]">{k}</span>
              <span className={`font-bold ${bad ? 'text-[#DC2626]' : 'text-[#111827]'}`}>{v}</span>
            </div>
          ))}
        </div>
        <div className="space-y-1.5 rounded-xl border border-[#E2E8F0] bg-[#F5F9FF] p-3.5 text-[#64748B]">
          <div><strong className="text-[#111827]">Matched keywords: </strong>
            {details.matched_keywords?.length ? <span className="font-bold text-[#DC2626]">{details.matched_keywords.join(', ')}</span> : <span className="font-bold text-[#16A34A]">None</span>}
          </div>
          {details.brand_analysis && (
            <div><strong className="text-[#111827]">Brand check: </strong>
              {details.brand_analysis.impersonation_detected
                ? <span className="font-bold text-[#DC2626]">Impersonation flag for {details.brand_analysis.brands?.join(', ')}</span>
                : <span className="font-bold text-[#16A34A]">No look-alike detected</span>}
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
