import React, { useCallback, useEffect, useRef, useState } from 'react';
import { HelpCircle } from 'lucide-react';
import ResultHero from './ResultHero';
import ReportDrawer from './ReportDrawer';
import AiAnalystCard from './AiAnalystCard';
import ThreatEngineReport from './ThreatEngineReport';
import TechnicalDetails from './TechnicalDetails';
import WhyRiskyPanel from './WhyRiskyPanel';
import QrPayloadDetails from './QrPayloadDetails';
import { heroProps } from '../../lib/heroProps';

const LEGACY = { Malicious: 'PHISHING', Suspicious: 'SUSPICIOUS', Unverified: 'UNVERIFIED', Safe: 'SAFE' };

const NOTICE_TITLES = {
  NO_QR_DETECTED: 'No QR code found',
  INVALID_FILE: 'This file can\'t be scanned',
  ERROR: 'The link couldn\'t be analysed',
};

/**
 * QR scan result in the same short layout as the URL results page:
 * hero (verdict, one line, three actions, checks) + a drawer with the full report.
 */
export default function QrResult({ scanResult: r }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('why');
  const topRef = useRef(null);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => { topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, []);

  // Nothing was decoded or evaluated: say so plainly instead of showing a verdict.
  if (r.risk_classification === 'Inconclusive' || !LEGACY[r.risk_classification]) {
    return (
      <div ref={topRef} className="space-y-3 rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E2E8F0] bg-[#F5F9FF] text-[#64748B]"><HelpCircle className="h-5 w-5" /></span>
          <h3 className="text-base font-bold text-[#111827]">{NOTICE_TITLES[r.status] || 'Nothing to judge yet'}</h3>
        </div>
        <p className="text-sm leading-relaxed text-[#475569]">{r.danger_explanation}</p>
        {r.recommended_actions?.length > 0 && (
          <ul className="space-y-1.5 text-[13px] text-[#475569]">
            {r.recommended_actions.map((a) => <li key={a} className="flex gap-2"><span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#2563EB]" />{a}</li>)}
          </ul>
        )}
      </div>
    );
  }

  const view = {
    id: r.url_scan_id,
    url: r.extracted_url || r.primary_content,
    domain: r.extracted_domain,
    risk_score: r.risk_score,
    classification: LEGACY[r.risk_classification],
    verdict: r.verdict,
    breakdown: r.url_breakdown || {},
    threats_detected: r.threats_detected || [],
    safe_indicators: r.safe_indicators || [],
    features: r.features || {},
    details: r.details || {},
    engine: r.engine,
    intelligence: r.intelligence,
    redirect: r.redirect,
    ai_analysis: r.ai_analysis,
    is_qr: true,
  };

  const { state, label, headline, actions, ai } = heroProps(view, {
    fallbackActions: r.recommended_actions || [],
    preferFallback: !r.engine,
  });

  const kicker = `QR code · ${String(r.file_type || '').replace('application/', '').replace('image/', '').toUpperCase()} · ${r.qr_count} code${r.qr_count === 1 ? '' : 's'} found`;
  // Non-URL payloads and blocked destinations have no engine report: lead with the explanation we do have.
  const shownHeadline = r.engine ? headline : (r.danger_explanation || headline);

  const tabs = [
    { id: 'why', label: 'Why' },
    ...(r.engine ? [{ id: 'checks', label: 'Security checks' }] : []),
    { id: 'technical', label: 'Technical' },
  ];

  return (
    <div ref={topRef} className="scroll-mt-4">
      <ResultHero
        result={view}
        state={state}
        label={label}
        headline={shownHeadline}
        actions={actions}
        kicker={kicker}
        urlLabel={r.is_url ? undefined : r.primary_content}
        onOpenReport={() => setOpen(true)}
        drawerOpen={open}
      />

      <ReportDrawer open={open} onClose={close} title="Full QR report" tabs={tabs} activeTab={tab} onTab={setTab}>
        {tab === 'why' && (
          ai
            ? <AiAnalystCard analysis={ai} compact />
            : <>
                {r.danger_explanation && (
                  <p className="rounded-2xl border border-ctp-border bg-ctp-surface p-4 text-[14px] leading-relaxed text-ctp-text-2">{r.danger_explanation}</p>
                )}
                <WhyRiskyPanel result={view} showSteps={false} />
              </>
        )}
        {tab === 'checks' && r.engine && <ThreatEngineReport result={view} />}
        {tab === 'technical' && (
          <>
            <QrPayloadDetails scanResult={r} />
            <TechnicalDetails result={view} />
          </>
        )}
      </ReportDrawer>
    </div>
  );
}
