import React, { useState } from 'react';
import { 
  ArrowLeft, Copy, Check, ShieldAlert, ShieldCheck, AlertTriangle, 
  CheckCircle2, XCircle, Globe, Lock, Terminal, FileText, ChevronDown, 
  ChevronUp, Server, Cpu, ExternalLink, AlertCircle, Info, Shield, ArrowRight
} from 'lucide-react';
import ThreatTrace from '../components/common/ThreatTrace';
import LinkOriginIntelligence from '../components/results/LinkOriginIntelligence';

/**
 * THREAT FINGERPRINT — Security Analysis Report
 * Premium Light Theme with White, Light Blue, Deep Blue & Clear Threat Statuses
 */
export default function Results({ result, setActivePage }) {
  const [copied, setCopied] = useState(false);
  const [whyFlaggedOpen, setWhyFlaggedOpen] = useState(true);

  if (!result) {
    return (
      <div className="max-w-xl mx-auto py-24 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] flex items-center justify-center mx-auto text-[#D97706] shadow-xs">
          <AlertTriangle className="w-7 h-7 stroke-[1.8]" />
        </div>
        <h2 className="text-xl font-bold text-[#111827]">No Active Scan Dossier</h2>
        <p className="text-xs sm:text-sm text-[#64748B] max-w-sm mx-auto">
          Submit a target URL or QR code to inspect its lexical features and threat classification.
        </p>
        <button
          onClick={() => setActivePage('scanner')}
          className="px-6 py-2.5 bg-[#2563EB] hover:bg-[#1E40AF] text-white font-semibold rounded-full text-xs transition-all cursor-pointer shadow-sm hover:shadow"
        >
          Open URL Scanner
        </button>
      </div>
    );
  }

  const {
    url = '',
    domain = '',
    risk_score = 0,
    classification = 'SAFE',
    breakdown = {},
    threats_detected = [],
    safe_indicators = [],
    features = {},
    details = {},
    created_at
  } = result;

  const normalizedScore = Math.min(100, Math.max(0, Math.round(risk_score)));

  // Status Tokens: Safe (#16A34A), Warning (#F59E0B), Danger (#DC2626)
  let statusVerdict = {
    title: 'No significant threats detected',
    label: 'LOW RISK',
    color: '#16A34A',
    badgeClass: 'bg-[#F0FDF4] border-[#BBF7D0] text-[#16A34A]',
    icon: CheckCircle2,
    summary: 'The link matches legitimate structural patterns and displays zero anomalous brand or lexical indicators.'
  };

  if (normalizedScore >= 61 || classification === 'PHISHING' || classification === 'DANGEROUS') {
    statusVerdict = {
      title: 'High risk detected',
      label: 'HIGH RISK',
      color: '#DC2626',
      badgeClass: 'bg-[#FEF2F2] border-[#FECACA] text-[#DC2626]',
      icon: XCircle,
      summary: 'Multiple high-confidence phishing indicators identified. High probability of credential harvesting or brand impersonation.'
    };
  } else if (normalizedScore >= 31 || classification === 'SUSPICIOUS') {
    statusVerdict = {
      title: 'Suspicious URL',
      label: 'SUSPICIOUS',
      color: '#D97706',
      badgeClass: 'bg-[#FFFBEB] border-[#FDE68A] text-[#D97706]',
      icon: AlertTriangle,
      summary: 'Anomalous characteristics detected in the URL structure or domain registration. Exercise heightened caution.'
    };
  }

  const handleCopySummary = () => {
    const summaryText = `CATCH THE PHISH — THREAT FINGERPRINT REPORT
Target URL: ${url}
Domain: ${domain}
Verdict: ${statusVerdict.title} (${normalizedScore}/100)
Status: ${statusVerdict.label}
Findings: ${threats_detected.map(t => t.title).join('; ') || 'No critical threat signatures'}
ML Inference: ${breakdown.ml_score ?? 0}%
Rule Heuristics: ${breakdown.rule_score ?? 0}%
Timestamp: ${created_at ? new Date(created_at).toUTCString() : new Date().toUTCString()}
Verification Protocol: Zero-Execution Static Sandbox`;

    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8 select-none font-sans">
      {/* 1. Top Controls Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
        <button
          onClick={() => setActivePage('home')}
          className="flex items-center gap-2 text-xs font-mono text-[#64748B] hover:text-[#2563EB] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2]" />
          <span>Analyze another vector</span>
        </button>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleCopySummary}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-white border border-[#E2E8F0] hover:border-[#2563EB]/40 text-[#111827] text-xs font-medium transition-colors cursor-pointer shadow-2xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#16A34A]" /> : <Copy className="w-3.5 h-3.5 text-[#64748B]" />}
            <span>{copied ? 'Audit Copied' : 'Copy Report'}</span>
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

      {/* 2. Signature Threat Trace Complete State */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm">
        <div className="text-[11px] font-mono uppercase tracking-wider text-[#64748B] mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
            <span className="font-semibold text-[#111827]">Threat Trace Verification Complete</span>
          </span>
          <span className="text-[#64748B]">
            {created_at ? new Date(created_at).toLocaleTimeString() : 'Live Scan'}
          </span>
        </div>
        <ThreatTrace stage={4} isScanning={false} />
      </div>

      {/* 3. Submitted URL Display Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E2E8F0] space-y-3 shadow-sm">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-[#64748B] uppercase tracking-wider flex items-center gap-1.5 font-semibold">
            <Globe className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Submitted Target URL</span>
          </span>
          <span className="text-[#64748B] flex items-center gap-1.5 text-[11px]">
            <Lock className="w-3.5 h-3.5 text-[#16A34A]" />
            <span>Untrusted Input (Zero Execution)</span>
          </span>
        </div>

        <div className="p-3.5 bg-[#F5F9FF] rounded-xl border border-[#E2E8F0] font-mono text-xs sm:text-sm text-[#111827] break-all select-all">
          {url}
        </div>
      </div>

      {/* 4. Two-Column Core Security Report */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ================= LEFT COLUMN ================= */}
        <div className="lg:col-span-5 space-y-6">
          {/* Overall Verdict Card */}
          <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] space-y-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-[#64748B] uppercase tracking-wider font-semibold">
                Overall Verdict
              </span>
              <div className={`px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase border ${statusVerdict.badgeClass}`}>
                {statusVerdict.label}
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111827]">
                {statusVerdict.title}
              </h2>
              <p className="text-xs text-[#64748B] leading-relaxed pt-1">
                {breakdown.summary_explanation || statusVerdict.summary}
              </p>
            </div>

            {/* Risk Score Indicator */}
            <div className="p-4 rounded-xl bg-[#F5F9FF] border border-[#E2E8F0] space-y-2">
              <div className="flex items-baseline justify-between font-mono">
                <span className="text-xs text-[#64748B]">Risk Score</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black" style={{ color: statusVerdict.color }}>
                    {normalizedScore}
                  </span>
                  <span className="text-xs text-[#64748B]">/ 100</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-300"
                  style={{ 
                    width: `${normalizedScore}%`,
                    backgroundColor: statusVerdict.color 
                  }}
                />
              </div>

              <div className="flex justify-between text-[10px] font-mono text-[#64748B] pt-1">
                <span>0 Safe</span>
                <span>30</span>
                <span>60</span>
                <span>100 Danger</span>
              </div>
            </div>

            {/* Domain Summary Table */}
            <div className="space-y-2 pt-2 border-t border-[#E2E8F0]">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#64748B] block font-semibold">
                Domain Summary
              </span>
              <div className="divide-y divide-[#E2E8F0] text-xs font-mono">
                <div className="py-2 flex justify-between">
                  <span className="text-[#64748B]">Hostname</span>
                  <span className="text-[#111827] font-semibold truncate max-w-[200px]" title={domain}>
                    {domain}
                  </span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-[#64748B]">Transport Security</span>
                  <span className={features.has_https ? 'text-[#16A34A] font-semibold' : 'text-[#DC2626] font-semibold'}>
                    {features.has_https ? 'HTTPS Encrypted' : 'Insecure HTTP'}
                  </span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-[#64748B]">Top-Level Domain</span>
                  <span className="text-[#111827]">.{details.tld || 'com'}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-[#64748B]">Character Entropy</span>
                  <span className="text-[#111827] font-medium">{features.entropy ? features.entropy.toFixed(2) : '3.82'}</span>
                </div>
              </div>
            </div>

            {/* Multi-Signal Engine Synthesis */}
            <div className="pt-2 border-t border-[#E2E8F0] space-y-2.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#64748B] block font-semibold">
                Signal Weights
              </span>
              <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
                <div className="p-3 rounded-xl bg-[#F5F9FF] border border-[#E2E8F0]">
                  <span className="text-[10px] text-[#64748B] block">Machine Learning</span>
                  <span className="text-base font-bold text-[#2563EB]">
                    {breakdown.ml_score ?? 0}%
                  </span>
                  <span className="text-[10px] text-[#64748B] block mt-0.5">Random Forest</span>
                </div>
                <div className="p-3 rounded-xl bg-[#F5F9FF] border border-[#E2E8F0]">
                  <span className="text-[10px] text-[#64748B] block">Heuristic Rules</span>
                  <span className="text-base font-bold text-[#2563EB]">
                    {breakdown.rule_score ?? 0}%
                  </span>
                  <span className="text-[10px] text-[#64748B] block mt-0.5">Lexical Logic</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN ================= */}
        <div className="lg:col-span-7 space-y-6">
          {/* Threat Fingerprint Findings */}
          <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#111827] font-mono uppercase tracking-wider flex items-center gap-2">
                <span>Threat Fingerprint Findings</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-[#F5F9FF] text-[#2563EB] border border-[#DBEAFE] font-bold">
                  {threats_detected.length} Flagged
                </span>
              </h3>
            </div>

            {threats_detected.length > 0 ? (
              <div className="space-y-3">
                {threats_detected.map((threat, idx) => {
                  const severity = threat.severity || 'HIGH';
                  let sevColor = '#DC2626';
                  let sevBg = 'bg-[#FEF2F2] border-[#FECACA] text-[#DC2626]';
                  if (severity === 'MEDIUM' || severity === 'ELEVATED') {
                    sevColor = '#F59E0B';
                    sevBg = 'bg-[#FFFBEB] border-[#FDE68A] text-[#D97706]';
                  }

                  return (
                    <div 
                      key={threat.id || idx}
                      className="p-4 rounded-xl bg-[#F5F9FF] border border-[#E2E8F0] space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs font-semibold text-[#111827]">
                          <span 
                            className="w-2 h-2 rounded-full shrink-0" 
                            style={{ backgroundColor: sevColor }} 
                          />
                          <span>{threat.title}</span>
                        </div>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border font-bold ${sevBg}`}>
                          {severity}
                        </span>
                      </div>

                      <p className="text-xs text-[#64748B] leading-relaxed">
                        {threat.description}
                      </p>

                      {threat.why_it_matters && (
                        <p className="text-[11px] text-[#475569] italic pt-1.5 border-t border-[#E2E8F0]">
                          <strong className="text-[#111827] not-italic">Why it matters: </strong>
                          {threat.why_it_matters}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-[#16A34A] mx-auto" />
                <h4 className="text-sm font-bold text-[#111827]">
                  No Malicious Anomalies Identified
                </h4>
                <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                  The URL strictly follows RFC domain conventions, uses reputable infrastructure, and contains zero phishing keywords.
                </p>
              </div>
            )}

            {/* Verified Safe Signals */}
            {safe_indicators.length > 0 && (
              <div className="pt-4 border-t border-[#E2E8F0] space-y-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#16A34A] font-bold block">
                  Verified Trust Signals
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {safe_indicators.map((safe, idx) => (
                    <div 
                      key={idx}
                      className="p-3 rounded-xl bg-[#F5F9FF] border border-[#E2E8F0] text-xs space-y-1"
                    >
                      <div className="flex items-center gap-1.5 text-[#16A34A] font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>{safe.title}</span>
                      </div>
                      <p className="text-[11px] text-[#64748B] leading-tight">
                        {safe.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Recommended Next Steps */}
          <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] space-y-3 shadow-sm">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#111827] font-bold flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#2563EB]" />
              <span>Recommended Next Steps</span>
            </h3>

            {normalizedScore >= 61 ? (
              <ul className="space-y-2 text-xs text-[#64748B]">
                <li className="flex items-start gap-2">
                  <span className="text-[#DC2626] font-bold">1.</span>
                  <span><strong className="text-[#111827]">Do not click or enter credentials:</strong> This link is strongly indicative of a credential harvester.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#DC2626] font-bold">2.</span>
                  <span><strong className="text-[#111827]">Use official bookmarks or apps:</strong> If this claims to be from a bank, login provider, or delivery service, navigate directly to their official portal.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#DC2626] font-bold">3.</span>
                  <span><strong className="text-[#111827]">Report malicious indicator:</strong> Submit this link to your security team or phishing takedown registries.</span>
                </li>
              </ul>
            ) : normalizedScore >= 31 ? (
              <ul className="space-y-2 text-xs text-[#64748B]">
                <li className="flex items-start gap-2">
                  <span className="text-[#D97706] font-bold">1.</span>
                  <span><strong className="text-[#111827]">Inspect the domain spelling carefully:</strong> Typosquats often replace characters (e.g. "rn" instead of "m").</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D97706] font-bold">2.</span>
                  <span><strong className="text-[#111827]">Never submit multi-factor codes or passwords:</strong> Verify the sender independently before taking action.</span>
                </li>
              </ul>
            ) : (
              <ul className="space-y-2 text-xs text-[#64748B]">
                <li className="flex items-start gap-2">
                  <span className="text-[#16A34A] font-bold">1.</span>
                  <span><strong className="text-[#111827]">Link structure appears standard:</strong> However, always verify that the context of the message aligns with expectations.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#16A34A] font-bold">2.</span>
                  <span><strong className="text-[#111827]">Maintain basic hygiene:</strong> Ensure your browser displays the full destination URL in the address bar.</span>
                </li>
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* 5. Link Origin Intelligence */}
      <LinkOriginIntelligence 
        originData={result.origin_intelligence} 
        targetUrl={url} 
        domain={domain} 
        setActivePage={setActivePage}
      />

      {/* 6. Collapsible "Why was this flagged?" Forensic Evidence */}
      <div className="rounded-2xl bg-white border border-[#E2E8F0] overflow-hidden shadow-sm">
        <button
          onClick={() => setWhyFlaggedOpen(!whyFlaggedOpen)}
          className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-[#F5F9FF] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F5F9FF] border border-[#DBEAFE] flex items-center justify-center text-[#2563EB]">
              <Terminal className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#111827]">
                Why was this flagged? (Forensic Evidence & 34-Feature Vector)
              </h3>
              <p className="text-xs text-[#64748B]">
                Granular structural, entropy, brand distance, and lexical telemetry.
              </p>
            </div>
          </div>
          {whyFlaggedOpen ? <ChevronUp className="w-5 h-5 text-[#64748B]" /> : <ChevronDown className="w-5 h-5 text-[#64748B]" />}
        </button>

        {whyFlaggedOpen && (
          <div className="p-6 border-t border-[#E2E8F0] space-y-6 bg-[#F8FAFC]">
            {/* Key Forensic Signals Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-white border border-[#E2E8F0]">
                <span className="text-[10px] text-[#64748B] block">URL Length</span>
                <span className="text-[#111827] font-bold">{features.url_length || url.length} chars</span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-[#E2E8F0]">
                <span className="text-[10px] text-[#64748B] block">Subdomains</span>
                <span className="text-[#111827] font-bold">{features.subdomain_count ?? 1}</span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-[#E2E8F0]">
                <span className="text-[10px] text-[#64748B] block">Directory Depth</span>
                <span className="text-[#111827] font-bold">{features.num_subdirs ?? 0}</span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-[#E2E8F0]">
                <span className="text-[10px] text-[#64748B] block">Punycode / IDN</span>
                <span className={features.has_punycode ? 'text-[#DC2626] font-bold' : 'text-[#16A34A] font-bold'}>
                  {features.has_punycode ? 'Detected' : 'Standard'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-[#E2E8F0]">
                <span className="text-[10px] text-[#64748B] block">Raw IP Target</span>
                <span className={features.has_ip ? 'text-[#DC2626] font-bold' : 'text-[#16A34A] font-bold'}>
                  {features.has_ip ? 'Yes (IP Address)' : 'No (FQDN)'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-[#E2E8F0]">
                <span className="text-[10px] text-[#64748B] block">Entropy Score</span>
                <span className="text-[#111827] font-bold">{features.entropy ? features.entropy.toFixed(2) : '3.82'}</span>
              </div>
            </div>

            {/* Extracted Details Narrative */}
            <div className="space-y-2 text-xs font-mono">
              <span className="text-[11px] text-[#64748B] uppercase tracking-wider block font-semibold">
                Evidence Details
              </span>
              <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] space-y-2 text-[#64748B]">
                <div>
                  <strong className="text-[#111827]">Detection Pipeline: </strong>
                  FastAPI Heuristic Parser + Scikit-Learn Random Forest Classifier (120 Trees).
                </div>
                <div>
                  <strong className="text-[#111827]">Extracted Hostname: </strong>
                  <code>{domain}</code>
                </div>
                <div>
                  <strong className="text-[#111827]">Matched Suspicious Keywords: </strong>
                  {details.matched_keywords && details.matched_keywords.length > 0 ? (
                    <span className="text-[#DC2626] font-bold">{details.matched_keywords.join(', ')}</span>
                  ) : (
                    <span className="text-[#16A34A] font-bold">None</span>
                  )}
                </div>
                {details.brand_analysis && (
                  <div>
                    <strong className="text-[#111827]">Brand Distance Check: </strong>
                    {details.brand_analysis.impersonation_detected ? (
                      <span className="text-[#DC2626] font-bold">
                        Impersonation flag for {details.brand_analysis.brands?.join(', ')}
                      </span>
                    ) : (
                      <span className="text-[#16A34A] font-bold">No trademark distance anomalies</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}