import React, { useState } from 'react';
import { 
  ShieldAlert, ShieldCheck, AlertTriangle, ArrowLeft, Copy, Check, 
  Layers, Cpu, FileText, CheckCircle2, Shield, AlertCircle, Globe, 
  Lock, Share2, ArrowRight, Server, Terminal, XCircle 
} from 'lucide-react';
import RiskGauge from '../components/scanner/RiskGauge';
import ThreatCard from '../components/scanner/ThreatCard';
import ThreatAnalysis from '../components/scanner/ThreatAnalysis';
import FeatureInspector from '../components/scanner/FeatureInspector';

export default function Results({ result, setActivePage }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'factors', 'features', 'actions'
  const [copied, setCopied] = useState(false);

  if (!result) {
    return (
      <div className="max-w-2xl mx-auto py-24 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white">No Analysis Data In Memory</h2>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Please submit a target URL from the scanner to generate a security evaluation report.
        </p>
        <button
          onClick={() => setActivePage('scanner')}
          className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-black font-extrabold rounded-xl text-xs uppercase tracking-wider"
        >
          Open URL Scanner
        </button>
      </div>
    );
  }

  const {
    url,
    domain,
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

  // Risk Classification status label according to strict user specs:
  // 0–30: Safe, 31–60: Suspicious, 61–100: Dangerous
  let statusBadge = {
    label: 'SAFE',
    badgeClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-800',
    title: 'Legitimate / Low Risk URL',
    icon: CheckCircle2,
    color: 'text-emerald-400'
  };

  if (normalizedScore >= 61 || classification === 'PHISHING' || classification === 'DANGEROUS') {
    statusBadge = {
      label: 'DANGEROUS',
      badgeClass: 'bg-rose-950/80 text-rose-300 border-rose-800',
      title: 'Potential Phishing Threat Detected',
      icon: XCircle,
      color: 'text-rose-400'
    };
  } else if (normalizedScore >= 31 || classification === 'SUSPICIOUS') {
    statusBadge = {
      label: 'SUSPICIOUS',
      badgeClass: 'bg-amber-950/80 text-amber-300 border-amber-800',
      title: 'Suspicious Anomalies Identified',
      icon: AlertTriangle,
      color: 'text-amber-400'
    };
  }

  const handleCopyReport = () => {
    const summary = `CATCH THE PHISH THREAT AUDIT REPORT
Target URL: ${url}
Domain: ${domain}
Risk Score: ${normalizedScore}/100
Status Verdict: ${statusBadge.label}
Primary Findings: ${threats_detected.map(t => t.title).join('; ') || 'No critical threat signatures'}
ML Inference Score: ${breakdown.ml_score ?? 0}%
Static Heuristic Score: ${breakdown.rule_score ?? 0}%
Evaluated via: Catch the Phish AI & Heuristic Engine (Zero-Execution Protocol)`;

    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Breadcrumb & Share Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <button
          onClick={() => setActivePage('scanner')}
          className="flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-orange-400 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Scanner</span>
        </button>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={handleCopyReport}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#090C13] border border-[#1C2230] hover:border-orange-500/50 text-slate-300 hover:text-white text-xs font-medium transition-all cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Audit Copied' : 'Copy Audit Summary'}</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#090C13] border border-[#1C2230] hover:border-slate-600 text-slate-300 hover:text-white text-xs font-medium transition-all cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Target URL Header Card */}
      <div className="p-6 rounded-2xl bg-[#090C13] border border-[#1C2230] shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
          <span className="font-mono text-orange-400 uppercase tracking-wider font-semibold flex items-center gap-2">
            <Globe className="w-4 h-4 text-orange-400" />
            <span>Target Scanned URL (Untrusted Input)</span>
          </span>
          <span className="text-slate-400 font-mono text-[11px]">
            {created_at ? new Date(created_at).toLocaleString() : 'Live Static Audit'}
          </span>
        </div>

        <div className="p-3.5 bg-[#06080E] rounded-xl border border-[#1C2230] font-mono text-xs sm:text-sm text-slate-200 break-all select-all">
          {url}
        </div>

        {/* Quick Metadata Badges Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 pt-1 text-xs font-mono">
          <div className="p-2.5 rounded-xl bg-[#06080E] border border-[#1C2230]">
            <span className="text-[10px] text-slate-400 block">Domain Host</span>
            <span className="text-white font-bold truncate block" title={domain}>{domain}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#06080E] border border-[#1C2230]">
            <span className="text-[10px] text-slate-400 block">SSL / Transport</span>
            <span className={features.has_https ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
              {features.has_https ? 'HTTPS Encrypted' : 'Insecure HTTP'}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#06080E] border border-[#1C2230]">
            <span className="text-[10px] text-slate-400 block">URL Length</span>
            <span className="text-white font-bold">{features.url_length || 0} characters</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#06080E] border border-[#1C2230]">
            <span className="text-[10px] text-slate-400 block">Path Segments</span>
            <span className="text-white font-bold">{features.num_subdirs || 0} folders</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#06080E] border border-[#1C2230]">
            <span className="text-[10px] text-slate-400 block">Keywords</span>
            <span className="text-white font-bold">{details.matched_keywords?.length || 0} found</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#06080E] border border-[#1C2230]">
            <span className="text-[10px] text-slate-400 block">Threat Intel</span>
            <span className="text-orange-400 font-bold">Reputation Verified</span>
          </div>
        </div>
      </div>

      {/* Main Score Verdict & Multi-Signal Architecture */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Visual Circular Risk Indicator */}
        <div className="md:col-span-1">
          <RiskGauge
            score={normalizedScore}
            classification={classification}
            label={breakdown.classification_label}
          />
        </div>

        {/* Multi-Signal Engine Synthesis */}
        <div className="md:col-span-2 p-6 rounded-2xl bg-[#090C13] border border-[#1C2230] flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-orange-400" />
                <h3 className="font-bold text-white text-base">
                  Multi-Signal Risk Assessment
                </h3>
              </div>
              <div className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase border ${statusBadge.badgeClass}`}>
                {statusBadge.label}
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans mt-2">
              {breakdown.summary_explanation || statusBadge.title}
            </p>
          </div>

          {/* Sub-Score Breakdown Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {/* Machine Learning */}
            <div className="p-3.5 rounded-xl bg-[#06080E] border border-[#1C2230] space-y-1">
              <span className="text-[10px] font-mono text-orange-400 uppercase font-semibold block">
                Machine Learning
              </span>
              <div className="text-2xl font-bold font-mono text-white">
                {breakdown.ml_score ?? 0}%
              </div>
              <span className="text-[10px] text-slate-400 block">
                Random Forest Inference
              </span>
            </div>

            {/* Heuristic Security Logic */}
            <div className="p-3.5 rounded-xl bg-[#06080E] border border-[#1C2230] space-y-1">
              <span className="text-[10px] font-mono text-amber-400 uppercase font-semibold block">
                Heuristic Rules
              </span>
              <div className="text-2xl font-bold font-mono text-white">
                {breakdown.rule_score ?? 0}%
              </div>
              <span className="text-[10px] text-slate-400 block">
                Deterministic Rule Weights
              </span>
            </div>

            {/* Threat Intelligence */}
            <div className="p-3.5 rounded-xl bg-[#06080E] border border-[#1C2230] space-y-1">
              <span className="text-[10px] font-mono text-emerald-400 uppercase font-semibold block">
                Threat Intelligence
              </span>
              <div className="text-2xl font-bold font-mono text-white">
                {breakdown.threat_intel_score > 0 ? `${breakdown.threat_intel_score}%` : 'Clean'}
              </div>
              <span className="text-[10px] text-slate-400 block">
                Reputation Cache Status
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-[#1C2230] gap-2 sm:gap-6 overflow-x-auto text-xs sm:text-sm">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-orange-500 text-orange-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Threat Factors & Signals ({threats_detected.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('factors')}
          className={`pb-3 font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'factors'
              ? 'border-orange-500 text-orange-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Structured Threat Analysis</span>
        </button>

        <button
          onClick={() => setActiveTab('features')}
          className={`pb-3 font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'features'
              ? 'border-orange-500 text-orange-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Deep Feature Vector (34)</span>
        </button>

        <button
          onClick={() => setActiveTab('actions')}
          className={`pb-3 font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'actions'
              ? 'border-orange-500 text-orange-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Operator Action Plan</span>
        </button>
      </div>

      {/* TAB 1: Detected Indicators & Explainability Cards */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {threats_detected.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-mono uppercase tracking-wider text-rose-400 font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>Reasons Behind Detection Verdict ({threats_detected.length} anomalies)</span>
                </h3>
                <span className="text-[11px] font-mono text-slate-400">Click any card to expand full forensic details</span>
              </div>

              {threats_detected.map((threat, idx) => (
                <ThreatCard key={threat.id || idx} threat={threat} />
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-[#090C13] border border-emerald-500/30 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h4 className="text-base font-bold text-white">No Malicious Anomalies Detected</h4>
              <p className="text-xs text-slate-300 max-w-md mx-auto">
                The URL adheres to standard domain registration patterns and contains zero high-risk phishing tokens.
              </p>
            </div>
          )}

          {/* Safe Positive Signals */}
          {safe_indicators.length > 0 && (
            <div className="pt-4 space-y-3">
              <h3 className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Verified Trust Signals</span>
              </h3>
              {safe_indicators.map((safe, idx) => (
                <ThreatCard key={safe.id || idx} threat={safe} isSafe={true} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Structured Threat Analysis (URL, Domain, Security, Detection Factors) */}
      {activeTab === 'factors' && (
        <ThreatAnalysis 
          features={features} 
          details={details} 
          riskScore={normalizedScore} 
          classification={classification} 
        />
      )}

      {/* TAB 3: Feature Inspector */}
      {activeTab === 'features' && (
        <FeatureInspector features={features} details={details} />
      )}

      {/* TAB 4: Action Plan */}
      {activeTab === 'actions' && (
        <div className="p-6 rounded-2xl bg-[#090C13] border border-[#1C2230] space-y-4">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Shield className="w-5 h-5 text-orange-400" />
            <span>Recommended Security Action Plan</span>
          </h3>

          {normalizedScore >= 61 ? (
            <div className="space-y-4 text-xs text-slate-300">
              <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 flex items-start gap-3">
                <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block text-sm font-bold">CRITICAL WARNING: DO NOT OPEN THIS URL</strong>
                  <p className="mt-1 text-slate-300 leading-relaxed">
                    This URL scored {normalizedScore}/100 and presents active credential theft or brand impersonation vectors.
                  </p>
                </div>
              </div>
              <ul className="space-y-2.5 list-disc list-inside text-slate-300 pl-2 leading-relaxed">
                <li>Never enter corporate or personal usernames, passwords, or two-factor authentication codes.</li>
                <li>Do not download or execute any installer, macro document, or payload offered by this domain.</li>
                <li>Block this domain at the firewall / DNS level if managing an organizational network.</li>
                <li>If you entered credentials prior to running this check, immediately change your real password on the official website.</li>
              </ul>
            </div>
          ) : normalizedScore >= 31 ? (
            <div className="space-y-4 text-xs text-slate-300">
              <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/80 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block text-sm font-bold">SUSPICIOUS ANOMALIES: EXERCISE CAUTION</strong>
                  <p className="mt-1 text-slate-300 leading-relaxed">
                    This URL deviates from standard reputable domain behavior ({breakdown.classification_label}).
                  </p>
                </div>
              </div>
              <ul className="space-y-2.5 list-disc list-inside text-slate-300 pl-2 leading-relaxed">
                <li>Double check the root domain authority in your browser bar before submitting data.</li>
                <li>Verify the legitimacy of the sender through a separate out-of-band communication channel.</li>
              </ul>
            </div>
          ) : (
            <div className="space-y-4 text-xs text-slate-300">
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/80 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block text-sm font-bold">VERIFIED CLEAN / LOW RISK</strong>
                  <p className="mt-1 text-slate-300 leading-relaxed">
                    No malicious lexical or structural indicators were triggered.
                  </p>
                </div>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Standard internet security practices still apply. Ensure browser extensions and TLS certificates remain validated.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
