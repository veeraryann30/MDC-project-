import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Copy, Check, AlertTriangle, FileText } from 'lucide-react';
import ResultHero from '../components/results/ResultHero';
import ReportDrawer from '../components/results/ReportDrawer';
import AiAnalystCard from '../components/results/AiAnalystCard';
import ThreatEngineReport from '../components/results/ThreatEngineReport';
import TechnicalDetails from '../components/results/TechnicalDetails';
import WhyRiskyPanel from '../components/results/WhyRiskyPanel';
import { heroProps } from '../lib/heroProps';

/**
 * Scan result. The first view is only the answer: verdict, one sentence, up to three actions and
 * which security checks ran. The full evidence opens in a drawer (Why / Checks / Technical).
 */
export default function Results({ result, setActivePage }) {
  const [copied, setCopied] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tab, setTab] = useState('why');
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  // A new scan always starts on the short view.
  useEffect(() => { setDrawerOpen(false); setTab('why'); }, [result]);

  if (!result) {
    return (
      <div className="max-w-xl mx-auto py-24 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] flex items-center justify-center mx-auto text-[#D97706] shadow-xs">
          <AlertTriangle className="w-7 h-7 stroke-[1.8]" />
        </div>
        <h2 className="text-xl font-bold text-[#111827]">No scan to show</h2>
        <p className="text-xs sm:text-sm text-[#64748B] max-w-sm mx-auto">
          Scan a link or a QR code to see its verdict here.
        </p>
        <button
          onClick={() => setActivePage('scanner')}
          className="px-6 py-2.5 bg-[#2563EB] hover:bg-[#1E40AF] text-white font-semibold rounded-full text-xs transition-all cursor-pointer shadow-sm hover:shadow"
        >
          Open URL scanner
        </button>
      </div>
    );
  }

  const { url = '', domain = '', risk_score = 0, breakdown = {}, threats_detected = [], created_at } = result;
  const score = Math.min(100, Math.max(0, Math.round(Number(risk_score) || 0)));
  const { state, label, headline, actions, ai } = heroProps(result);

  const tabs = [
    { id: 'why', label: 'Why' },
    ...(result.engine ? [{ id: 'checks', label: 'Security checks' }] : []),
    { id: 'technical', label: 'Technical' },
  ];

  const handleCopySummary = () => {
    const text = `CATCH THE PHISH - SCAN REPORT
Target URL: ${url}
Domain: ${domain}
Verdict: ${label} (${score}/100)${result.engine ? `, ${result.engine.confidence.label.toLowerCase()} confidence` : ''}
Findings: ${threats_detected.map((t) => t.title).join('; ') || 'No critical threat signatures'}
ML: ${breakdown.ml_score ?? 0}%  Rules: ${breakdown.rule_score ?? 0}%
Timestamp: ${created_at ? new Date(created_at).toUTCString() : new Date().toUTCString()}
The link was never opened by the scanner.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
        <button
          onClick={() => setActivePage('scanner')}
          className="flex items-center gap-2 text-xs font-mono text-[#64748B] hover:text-[#2563EB] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2]" />
          <span>Scan another link</span>
        </button>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleCopySummary}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-white border border-[#E2E8F0] hover:border-[#2563EB]/40 text-[#111827] text-xs font-medium transition-colors cursor-pointer shadow-2xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#16A34A]" /> : <Copy className="w-3.5 h-3.5 text-[#64748B]" />}
            <span>{copied ? 'Copied' : 'Copy report'}</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-white border border-[#E2E8F0] hover:border-[#2563EB]/40 text-[#64748B] hover:text-[#111827] text-xs font-medium transition-colors cursor-pointer shadow-2xs"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      <ResultHero
        result={{ ...result, url }}
        state={state}
        label={label}
        headline={headline}
        actions={actions}
        onOpenReport={() => setDrawerOpen(true)}
        drawerOpen={drawerOpen}
      />

      <ReportDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        title="Full report"
        tabs={tabs}
        activeTab={tab}
        onTab={setTab}
      >
        {tab === 'why' && (ai ? <AiAnalystCard analysis={ai} compact /> : <WhyRiskyPanel result={result} showSteps={false} />)}
        {tab === 'checks' && result.engine && <ThreatEngineReport result={result} />}
        {tab === 'technical' && <TechnicalDetails result={result} />}
      </ReportDrawer>
    </div>
  );
}
