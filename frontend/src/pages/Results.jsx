import React, { useState } from 'react';
import { 
  ArrowLeft, Copy, Check, ShieldAlert, ShieldCheck, AlertTriangle, 
  CheckCircle2, XCircle, Globe, Lock, Terminal, FileText, ChevronDown, 
  ChevronUp, Server, Cpu, ExternalLink, AlertCircle, Info, Shield
} from 'lucide-react';
import ThreatTrace from '../components/common/ThreatTrace';
import LinkOriginIntelligence from '../components/results/LinkOriginIntelligence';

/**
 * THREAT FINGERPRINT — Signature Security Analysis Report (SHADOW UI)
 * Professional two-column cybersecurity dossier with explainable findings.
 */
export default function Results({ result, setActivePage }) {
  const [copied, setCopied] = useState(false);
  const [whyFlaggedOpen, setWhyFlaggedOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('fingerprint'); // 'fingerprint' | 'raw_features'

  if (!result) {
    return (
      <div className="max-w-xl mx-auto py-24 text-center space-y-4">
        <div className="w-12 h-12 rounded-[14px] bg-[#151517] border border-[#29292D] flex items-center justify-center mx-auto text-[#F2B84B]">
          <AlertTriangle className="w-6 h-6 stroke-[1.8]" />
        </div>
        <h2 className="text-xl font-bold text-[#F5F5F5]">No Active Scan Dossier</h2>
        <p className="text-xs text-[#92929A] max-w-sm mx-auto">
          Submit a target URL to analyze its lexical features, brand lookalikes, and threat classification.
        </p>
        <button
          onClick={() => setActivePage('home')}
          className="px-5 py-2.5 bg-[#FF6B35] hover:bg-[#ff7b49] text-white font-semibold rounded-[10px] text-xs transition-all cursor-pointer"
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

  // SHADOW UI Status Tokens: Safe (#35C98A), Warning (#F2B84B), Danger (#FF5C5C)
  let statusVerdict = {
    title: 'No significant threats detected',
    label: 'LOW RISK',
    color: '#35C98A',
    badgeClass: 'bg-[#101F18] border-[#35C98A]/40 text-[#35C98A]',
    icon: CheckCircle2,
    summary: 'The link matches legitimate structural patterns and displays zero anomalous brand or lexical indicators.'
  };

  if (normalizedScore >= 61 || classification === 'PHISHING' || classification === 'DANGEROUS') {
    statusVerdict = {
      title: 'High risk',
      label: 'HIGH RISK',
      color: '#FF5C5C',
      badgeClass: 'bg-[#241315] border-[#FF5C5C]/40 text-[#FF5C5C]',
      icon: XCircle,
      summary: 'Multiple high-confidence phishing indicators identified. High probability of credential harvesting or brand impersonation.'
    };
  } else if (normalizedScore >= 31 || classification === 'SUSPICIOUS') {
    statusVerdict = {
      title: 'Suspicious URL',
      label: 'SUSPICIOUS',
      color: '#F2B84B',
      badgeClass: 'bg-[#221B10] border-[#F2B84B]/40 text-[#F2B84B]',
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8 select-none">
      {/* 1. Top Controls Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#29292D]">
        <button
          onClick={() => setActivePage('home')}
          className="flex items-center gap-2 text-xs font-mono text-[#92929A] hover:text-[#F5F5F5] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2]" />
          <span>Analyze another URL</span>
        </button>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleCopySummary}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-[#151517] border border-[#29292D] hover:border-[#38383E] text-[#F5F5F5] text-xs font-medium transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#35C98A]" /> : <Copy className="w-3.5 h-3.5 text-[#92929A]" />}
            <span>{copied ? 'Audit Copied' : 'Copy Report'}</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-[#151517] border border-[#29292D] hover:border-[#38383E] text-[#92929A] hover:text-[#F5F5F5] text-xs font-medium transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* 2. Signature Threat Trace: Settled Complete State */}
      <div className="p-4 sm:p-5 rounded-[16px] bg-[#151517] border border-[#29292D]">
        <div className="text-[11px] font-mono uppercase tracking-wider text-[#92929A] mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#35C98A]" />
            <span>Threat Trace Verification Complete</span>
          </span>
          <span className="text-[#686870]">
            {created_at ? new Date(created_at).toLocaleTimeString() : 'Live Scan'}
          </span>
        </div>
        <ThreatTrace stage={4} isScanning={false} />
      </div>

      {/* 3. Submitted URL Display Card */}
      <div className="p-5 sm:p-6 rounded-[16px] bg-[#151517] border border-[#29292D] space-y-3">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-[#92929A] uppercase tracking-wider flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-[#FF6B35]" />
            <span>Submitted Target URL</span>
          </span>
          <span className="text-[#686870] flex items-center gap-1 text-[11px]">
            <Lock className="w-3 h-3 text-[#35C98A]" />
            <span>Untrusted Input (Zero Execution)</span>
          </span>
        </div>

        <div className="p-3.5 bg-[#101012] rounded-[10px] border border-[#29292D] font-mono text-xs sm:text-sm text-[#F5F5F5] break-all select-all">
          {url}
        </div>
      </div>

      {/* 4. Two-Column Core Security Report */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ================= LEFT COLUMN ================= */}
        <div className="lg:col-span-5 space-y-6">
          {/* Overall Verdict Card */}
          <div className="p-6 rounded-[16px] bg-[#151517] border border-[#29292D] space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-[#686870] uppercase tracking-wider">
                Overall Verdict
              </span>
              <div className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold uppercase border ${statusVerdict.badgeClass}`}>
                {statusVerdict.label}
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F5F5F5]">
                {statusVerdict.title}
              </h2>
              <p className="text-xs text-[#92929A] leading-relaxed pt-1">
                {breakdown.summary_explanation || statusVerdict.summary}
              </p>
            </div>

            {/* Risk Score Indicator */}
            <div className="p-4 rounded-[12px] bg-[#101012] border border-[#29292D] space-y-2">
              <div className="flex items-baseline justify-between font-mono">
                <span className="text-xs text-[#92929A]">Risk Score</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black" style={{ color: statusVerdict.color }}>
                    {normalizedScore}
                  </span>
                  <span className="text-xs text-[#686870]">/ 100</span>
                </div>
              </div>

              {/* Thin restrained progress bar */}
              <div className="w-full h-1.5 bg-[#29292D] rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-300"
                  style={{ 
                    width: `${normalizedScore}%`,
                    backgroundColor: statusVerdict.color 
                  }}
                />
              </div>

              <div className="flex justify-between text-[10px] font-mono text-[#686870] pt-1">
                <span>0 Safe</span>
                <span>30</span>
                <span>60</span>
                <span>100 Danger</span>
              </div>
            </div>

            {/* Domain Summary Table */}
            <div className="space-y-2 pt-2 border-t border-[#29292D]">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#686870] block">
                Domain Summary
              </span>
              <div className="divide-y divide-[#29292D] text-xs font-mono">
                <div className="py-2 flex justify-between">
                  <span className="text-[#92929A]">Hostname</span>
                  <span className="text-[#F5F5F5] font-semibold truncate max-w-[200px]" title={domain}>
                    {domain}
                  </span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-[#92929A]">Transport Security</span>
                  <span className={features.has_https ? 'text-[#35C98A]' : 'text-[#FF5C5C]'}>
                    {features.has_https ? 'HTTPS Encrypted' : 'Insecure HTTP'}
                  </span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-[#92929A]">Top-Level Domain</span>
                  <span className="text-[#F5F5F5]">.{details.tld || 'com'}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-[#92929A]">Character Entropy</span>
                  <span className="text-[#F5F5F5]">{features.entropy ? features.entropy.toFixed(2) : '3.82'}</span>
                </div>
              </div>
            </div>

            {/* Multi-Signal Engine Synthesis */}
            <div className="pt-2 border-t border-[#29292D] space-y-2.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#686870] block">
                Signal Weights
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-3 rounded-[10px] bg-[#101012] border border-[#29292D]">
                  <span className="text-[10px] text-[#686870] block">Machine Learning</span>
                  <span className="text-sm font-bold text-[#F5F5F5]">
                    {breakdown.ml_score ?? 0}%
                  </span>
                  <span className="text-[10px] text-[#92929A] block mt-0.5">Random Forest</span>
                </div>
                <div className="p-3 rounded-[10px] bg-[#101012] border border-[#29292D]">
                  <span className="text-[10px] text-[#686870] block">Heuristic Rules</span>
                  <span className="text-sm font-bold text-[#F5F5F5]">
                    {breakdown.rule_score ?? 0}%
                  </span>
                  <span className="text-[10px] text-[#92929A] block mt-0.5">Lexical Logic</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN ================= */}
        <div className="lg:col-span-7 space-y-6">
          {/* Threat Fingerprint Findings */}
          <div className="p-6 rounded-[16px] bg-[#151517] border border-[#29292D] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#F5F5F5] font-mono uppercase tracking-wider flex items-center gap-2">
                <span>Threat Fingerprint Findings</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-[#101012] text-[#92929A] border border-[#29292D]">
                  {threats_detected.length} Flagged
                </span>
              </h3>
            </div>

            {threats_detected.length > 0 ? (
              <div className="space-y-3">
                {threats_detected.map((threat, idx) => {
                  const severity = threat.severity || 'HIGH';
                  let sevColor = '#FF5C5C';
                  let sevBg = 'bg-[#FF5C5C]/10 border-[#FF5C5C]/30 text-[#FF5C5C]';
                  if (severity === 'MEDIUM' || severity === 'ELEVATED') {
                    sevColor = '#F2B84B';
                    sevBg = 'bg-[#F2B84B]/10 border-[#F2B84B]/30 text-[#F2B84B]';
                  }

                  return (
                    <div 
                      key={threat.id || idx}
                      className="p-4 rounded-[12px] bg-[#101012] border border-[#29292D] space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs font-semibold text-[#F5F5F5]">
                          <span 
                            className="w-2 h-2 rounded-full shrink-0" 
                            style={{ backgroundColor: sevColor }} 
                          />
                          <span>{threat.title}</span>
                        </div>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${sevBg}`}>
                          {severity}
                        </span>
                      </div>

                      <p className="text-xs text-[#92929A] leading-relaxed">
                        {threat.description}
                      </p>

                      {threat.why_it_matters && (
                        <p className="text-[11px] text-[#686870] italic pt-1 border-t border-[#29292D]/60">
                          <strong className="text-[#92929A] not-italic">Why it matters: </strong>
                          {threat.why_it_matters}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 rounded-[12px] bg-[#101012] border border-[#35C98A]/30 text-center space-y-2">
                <CheckCircle2 className="w-9 h-9 text-[#35C98A] mx-auto" />
                <h4 className="text-sm font-semibold text-[#F5F5F5]">
                  No Malicious Anomalies Identified
                </h4>
                <p className="text-xs text-[#92929A] max-w-sm mx-auto">
                  The URL strictly follows RFC domain conventions, uses reputable infrastructure, and contains zero phishing keywords.
                </p>
              </div>
            )}

            {/* Verified Safe Signals */}
            {safe_indicators.length > 0 && (
              <div className="pt-4 border-t border-[#29292D] space-y-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#35C98A] font-semibold block">
                  Verified Trust Signals
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {safe_indicators.map((safe, idx) => (
                    <div 
                      key={idx}
                      className="p-3 rounded-[10px] bg-[#101012] border border-[#29292D] text-xs space-y-1"
                    >
                      <div className="flex items-center gap-1.5 text-[#35C98A] font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>{safe.title}</span>
                      </div>
                      <p className="text-[11px] text-[#92929A] leading-tight">
                        {safe.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Recommended Next Steps */}
          <div className="p-6 rounded-[16px] bg-[#151517] border border-[#29292D] space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#F5F5F5] font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#FF6B35]" />
              <span>Recommended Next Steps</span>
            </h3>

            {normalizedScore >= 61 ? (
              <ul className="space-y-2 text-xs text-[#92929A]">
                <li className="flex items-start gap-2">
                  <span className="text-[#FF5C5C] font-bold">1.</span>
                  <span><strong>Do not click or enter credentials:</strong> This link is strongly indicative of a credential harvester.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#FF5C5C] font-bold">2.</span>
                  <span><strong>Use official bookmarks or apps:</strong> If this claims to be from a bank, login provider, or delivery service, navigate directly to their official portal.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#FF5C5C] font-bold">3.</span>
                  <span><strong>Report malicious indicator:</strong> Submit this link to your security team or phishing takedown registries.</span>
                </li>
              </ul>
            ) : normalizedScore >= 31 ? (
              <ul className="space-y-2 text-xs text-[#92929A]">
                <li className="flex items-start gap-2">
                  <span className="text-[#F2B84B] font-bold">1.</span>
                  <span><strong>Inspect the domain spelling carefully:</strong> Typosquats often replace characters (e.g. "rn" instead of "m").</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#F2B84B] font-bold">2.</span>
                  <span><strong>Never submit multi-factor codes or passwords:</strong> Verify the sender independently before taking action.</span>
                </li>
              </ul>
            ) : (
              <ul className="space-y-2 text-xs text-[#92929A]">
                <li className="flex items-start gap-2">
                  <span className="text-[#35C98A] font-bold">1.</span>
                  <span><strong>Link structure appears standard:</strong> However, always verify that the context of the message aligns with expectations.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#35C98A] font-bold">2.</span>
                  <span><strong>Maintain basic hygiene:</strong> Ensure your browser displays the full destination URL in the address bar.</span>
                </li>
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* 5. Link Origin Intelligence (Infrastructure, Geolocation & DNS Reconnaissance) */}
      <LinkOriginIntelligence 
        originData={result.origin_intelligence} 
        targetUrl={url} 
        domain={domain} 
      />

      {/* 6. Collapsible "Why was this flagged?" Forensic Evidence */}
      <div className="rounded-[16px] bg-[#151517] border border-[#29292D] overflow-hidden">
        <button
          onClick={() => setWhyFlaggedOpen(!whyFlaggedOpen)}
          className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-[#1B1B1F] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[8px] bg-[#101012] border border-[#29292D] flex items-center justify-center text-[#FF6B35]">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#F5F5F5]">
                Why was this flagged? (Forensic Evidence & 34-Feature Vector)
              </h3>
              <p className="text-xs text-[#92929A]">
                Granular structural, entropy, brand distance, and lexical telemetry.
              </p>
            </div>
          </div>
          {whyFlaggedOpen ? <ChevronUp className="w-5 h-5 text-[#92929A]" /> : <ChevronDown className="w-5 h-5 text-[#92929A]" />}
        </button>

        {whyFlaggedOpen && (
          <div className="p-6 border-t border-[#29292D] space-y-6 bg-[#101012]/60">
            {/* Key Forensic Signals Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs font-mono">
              <div className="p-3 rounded-[10px] bg-[#151517] border border-[#29292D]">
                <span className="text-[10px] text-[#686870] block">URL Length</span>
                <span className="text-[#F5F5F5] font-bold">{features.url_length || url.length} chars</span>
              </div>
              <div className="p-3 rounded-[10px] bg-[#151517] border border-[#29292D]">
                <span className="text-[10px] text-[#686870] block">Subdomains</span>
                <span className="text-[#F5F5F5] font-bold">{features.subdomain_count ?? 1}</span>
              </div>
              <div className="p-3 rounded-[10px] bg-[#151517] border border-[#29292D]">
                <span className="text-[10px] text-[#686870] block">Directory Depth</span>
                <span className="text-[#F5F5F5] font-bold">{features.num_subdirs ?? 0}</span>
              </div>
              <div className="p-3 rounded-[10px] bg-[#151517] border border-[#29292D]">
                <span className="text-[10px] text-[#686870] block">Punycode / IDN</span>
                <span className={features.has_punycode ? 'text-[#FF5C5C] font-bold' : 'text-[#35C98A] font-bold'}>
                  {features.has_punycode ? 'Detected' : 'Standard'}
                </span>
              </div>
              <div className="p-3 rounded-[10px] bg-[#151517] border border-[#29292D]">
                <span className="text-[10px] text-[#686870] block">Raw IP Target</span>
                <span className={features.has_ip ? 'text-[#FF5C5C] font-bold' : 'text-[#35C98A] font-bold'}>
                  {features.has_ip ? 'Yes (IP Address)' : 'No (FQDN)'}
                </span>
              </div>
              <div className="p-3 rounded-[10px] bg-[#151517] border border-[#29292D]">
                <span className="text-[10px] text-[#686870] block">Entropy Score</span>
                <span className="text-[#F5F5F5] font-bold">{features.entropy ? features.entropy.toFixed(2) : '3.82'}</span>
              </div>
            </div>

            {/* Extracted Details Narrative */}
            <div className="space-y-2 text-xs font-mono">
              <span className="text-[11px] text-[#686870] uppercase tracking-wider block">
                Evidence Details
              </span>
              <div className="p-4 rounded-[10px] bg-[#151517] border border-[#29292D] space-y-2 text-[#92929A]">
                <div>
                  <strong className="text-[#F5F5F5]">Detection Pipeline: </strong>
                  FastAPI Heuristic Parser + Scikit-Learn Random Forest Classifier (120 Trees).
                </div>
                <div>
                  <strong className="text-[#F5F5F5]">Extracted Hostname: </strong>
                  <code>{domain}</code>
                </div>
                <div>
                  <strong className="text-[#F5F5F5]">Matched Suspicious Keywords: </strong>
                  {details.matched_keywords && details.matched_keywords.length > 0 ? (
                    <span className="text-[#FF5C5C]">{details.matched_keywords.join(', ')}</span>
                  ) : (
                    <span className="text-[#35C98A]">None</span>
                  )}
                </div>
                {details.brand_analysis && (
                  <div>
                    <strong className="text-[#F5F5F5]">Brand Distance Check: </strong>
                    {details.brand_analysis.impersonation_detected ? (
                      <span className="text-[#FF5C5C]">
                        Impersonation flag for {details.brand_analysis.brands?.join(', ')}
                      </span>
                    ) : (
                      <span className="text-[#35C98A]">No trademark distance anomalies</span>
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
