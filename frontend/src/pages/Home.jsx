import React, { useState, useRef } from 'react';
import { 
  Search, Link2, ShieldAlert, ShieldCheck, AlertTriangle, 
  ChevronDown, ChevronUp, ArrowRight, Lock, Globe, Terminal, 
  CheckCircle2, XCircle, FileText, Check, AlertCircle, Copy, Cpu, Layers
} from 'lucide-react';
import LandingNavbar from '../components/layout/LandingNavbar';
import LandingFooter from '../components/layout/LandingFooter';
import ThreatTrace from '../components/common/ThreatTrace';
import { api } from '../services/api';

export default function Home({ setActivePage, setScanResult }) {
  const [url, setUrl] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanStage, setScanStage] = useState(0);
  const [error, setError] = useState('');
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [copiedDemo, setCopiedDemo] = useState(false);
  const scannerInputRef = useRef(null);

  const sampleVectors = [
    { label: 'Safe Corporate', url: 'https://www.google.com/search?q=cybersecurity' },
    { label: 'Brand Lookalike', url: 'http://paypa1-account-verification.xyz/login.php' },
    { label: 'Raw IP + Port', url: 'http://192.168.1.100:8080/secure/bank.asp' },
    { label: 'Punycode Homoglyph', url: 'http://xn--gogle-pra.com/signin' }
  ];

  const handleScanSubmit = async (targetUrl = url) => {
    const trimmed = (targetUrl || url).trim();
    if (!trimmed) {
      setError('Please paste or enter a URL to analyze.');
      if (scannerInputRef.current) scannerInputRef.current.focus();
      return;
    }

    if (trimmed.length > 2048) {
      setError('URL exceeds maximum permitted length of 2048 characters.');
      return;
    }

    setError('');
    setScanning(true);
    setScanStage(1); // 1: URL Received

    // Realistic progressive stage advance without artificial delays
    const stageTimer1 = setTimeout(() => setScanStage(2), 160); // 2: URL Analysis
    const stageTimer2 = setTimeout(() => setScanStage(3), 320); // 3: Indicator Checks

    try {
      const result = await api.scanUrl(trimmed);
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      setScanStage(4); // 4: Report ready

      setTimeout(() => {
        setScanning(false);
        setScanResult(result);
        setActivePage('results');
      }, 250);
    } catch (err) {
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      setScanning(false);
      setScanStage(0);
      setError(err.message || 'Analysis failed. Please verify the URL format or check server connection.');
    }
  };

  const handleFocusScanner = () => {
    const el = document.getElementById('hero-scanner');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => {
        if (scannerInputRef.current) scannerInputRef.current.focus();
      }, 300);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-[#F5F5F5] flex flex-col font-sans selection:bg-[#FF6B35]/30 selection:text-white">
      {/* 1. Landing Navigation Bar */}
      <LandingNavbar 
        setActivePage={setActivePage}
        onScanButtonClick={handleFocusScanner}
      />

      {/* 2. Main Hero Section */}
      <main className="flex-1">
        <section className="pt-20 sm:pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center space-y-8">
          {/* Eyebrow Label */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#151517] border border-[#29292D] text-[#92929A] text-xs font-mono uppercase tracking-[0.08em]">
            <span>PERSONAL CYBERSECURITY · URL INTELLIGENCE</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-6xl lg:text-[68px] font-bold tracking-[-0.03em] leading-[1.08] text-[#F5F5F5] max-w-4xl mx-auto">
            Don't trust the link.<br />
            <span className="text-[#FF6B35]">Verify it.</span>
          </h1>

          {/* Description */}
          <p className="text-base sm:text-lg text-[#92929A] max-w-[620px] mx-auto leading-relaxed font-normal">
            Analyze suspicious URLs, uncover phishing indicators, and understand the risks before you click.
          </p>

          {/* 3. Prominent URL Scanner */}
          <div id="hero-scanner" className="pt-4 max-w-[740px] mx-auto">
            <div className="p-2 sm:p-2.5 rounded-[16px] bg-[#151517] border border-[#29292D] focus-within:border-[#FF6B35] transition-all duration-200 shadow-xl">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleScanSubmit();
                }}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
              >
                {/* Search/Link Icon */}
                <div className="hidden sm:flex items-center pl-3 text-[#686870]">
                  <Search className="w-5 h-5 stroke-[2]" />
                </div>

                {/* Input Field */}
                <input
                  ref={scannerInputRef}
                  type="text"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    if (error) setError('');
                  }}
                  disabled={scanning}
                  placeholder="Paste a suspicious URL here..."
                  className="w-full px-3 py-3 bg-transparent text-[#F5F5F5] placeholder-[#686870] font-mono text-sm focus:outline-none disabled:opacity-60"
                  aria-label="URL to analyze for phishing threats"
                />

                {/* Orange Analyze Button */}
                <button
                  type="submit"
                  disabled={scanning}
                  className="px-6 py-3 bg-[#FF6B35] hover:bg-[#ff7b49] active:bg-[#e05824] disabled:opacity-50 text-white font-semibold text-xs sm:text-sm rounded-[10px] transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shadow-sm"
                >
                  {scanning ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <span>Analyze URL</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.2]" />
                    </>
                  )}
                </button>
              </form>

              {/* Threat Trace Animation Progress Bar */}
              {scanning && (
                <div className="pt-3 px-2 border-t border-[#29292D] mt-2">
                  <ThreatTrace stage={scanStage} isScanning={scanning} />
                </div>
              )}
            </div>

            {/* Error Banner */}
            {error && (
              <div className="mt-3 p-3 rounded-[12px] bg-[#1F1415] border border-[#FF5C5C]/40 text-[#FF5C5C] text-xs flex items-center justify-center gap-2 font-mono">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Helper Message Below Input */}
            <p className="mt-3 text-xs text-[#92929A] font-normal">
              No need to open the link. Analyze it first.
            </p>

            {/* Test Vector Pills */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="text-[#686870] text-[11px] font-mono">
                Sample inputs:
              </span>
              {sampleVectors.map((v, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setUrl(v.url);
                    handleScanSubmit(v.url);
                  }}
                  disabled={scanning}
                  className="px-2.5 py-1 rounded-[8px] bg-[#101012] hover:bg-[#1B1B1F] border border-[#29292D] text-[#92929A] hover:text-[#F5F5F5] text-[11px] font-mono transition-colors cursor-pointer"
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Subtle Capability Indicators */}
          <div className="pt-8 flex items-center justify-center gap-4 sm:gap-8 text-[11px] font-mono tracking-wider text-[#686870] uppercase">
            <span>URL Analysis</span>
            <span className="text-[#29292D]">/</span>
            <span>Threat Indicators</span>
            <span className="text-[#29292D]">/</span>
            <span>Explainable Results</span>
          </div>
        </section>

        {/* Thin Divider */}
        <div className="max-w-5xl mx-auto px-4">
          <div className="h-[1px] bg-[#29292D]" />
        </div>

        {/* 5. How It Works Section */}
        <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-14">
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F5F5]">
              Security, without the guesswork.
            </h2>
            <p className="text-sm text-[#92929A] leading-relaxed">
              Understand what makes a link suspicious, why it matters, and what to do next.
            </p>
          </div>

          {/* 3 Simple Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 01 */}
            <div className="p-6 rounded-[14px] bg-[#151517] border border-[#29292D] space-y-3">
              <div className="font-mono text-xs font-semibold text-[#FF6B35]">
                01 — Submit
              </div>
              <h3 className="text-base font-semibold text-[#F5F5F5]">
                Paste the URL
              </h3>
              <p className="text-xs text-[#92929A] leading-relaxed">
                Paste any link you want to investigate without ever visiting or rendering it in your browser.
              </p>
            </div>

            {/* Step 02 */}
            <div className="p-6 rounded-[14px] bg-[#151517] border border-[#29292D] space-y-3">
              <div className="font-mono text-xs font-semibold text-[#FF6B35]">
                02 — Analyze
              </div>
              <h3 className="text-base font-semibold text-[#F5F5F5]">
                Evaluate indicators
              </h3>
              <p className="text-xs text-[#92929A] leading-relaxed">
                The engine extracts 34 lexical and structural features and tests brand typosquatting models.
              </p>
            </div>

            {/* Step 03 */}
            <div className="p-6 rounded-[14px] bg-[#151517] border border-[#29292D] space-y-3">
              <div className="font-mono text-xs font-semibold text-[#FF6B35]">
                03 — Understand
              </div>
              <h3 className="text-base font-semibold text-[#F5F5F5]">
                Review the verdict
              </h3>
              <p className="text-xs text-[#92929A] leading-relaxed">
                Receive an explainable security dossier clarifying exactly why the link is safe or dangerous.
              </p>
            </div>
          </div>
        </section>

        {/* Thin Divider */}
        <div className="max-w-5xl mx-auto px-4">
          <div className="h-[1px] bg-[#29292D]" />
        </div>

        {/* 6. Signature Feature Preview — Threat Fingerprint */}
        <section id="threat-fingerprint" className="py-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-mono text-[#FF6B35] uppercase tracking-wider font-semibold">
                <span>Signature Feature</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F5F5]">
                The Threat Fingerprint
              </h2>
              <p className="text-xs sm:text-sm text-[#92929A] max-w-lg">
                Instead of opaque binary warnings, Catch the Phish deconstructs flagged threats into transparent, plain-English security evidence.
              </p>
            </div>

            <div className="px-2.5 py-1 rounded-[8px] bg-[#151517] border border-[#29292D] text-[11px] font-mono text-[#92929A]">
              Interactive Demonstration
            </div>
          </div>

          {/* Interactive Report Preview Dossier */}
          <div className="rounded-[18px] bg-[#151517] border border-[#29292D] p-6 sm:p-8 space-y-6 shadow-2xl">
            {/* Header Stage Tracker */}
            <div className="pb-4 border-b border-[#29292D]">
              <ThreatTrace stage={4} isScanning={false} />
            </div>

            {/* Target Sample Header */}
            <div className="p-4 rounded-[12px] bg-[#101012] border border-[#29292D] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
              <div className="space-y-1 overflow-hidden">
                <span className="text-[#686870] uppercase text-[10px] block">Analyzed Destination</span>
                <span className="text-[#F5F5F5] break-all select-all font-mono">
                  https://login.microsoft-verify365.xyz/auth/session
                </span>
              </div>
              <div className="inline-flex items-center gap-2 self-start sm:self-center px-3 py-1 rounded-full bg-[#241315] border border-[#FF5C5C]/40 text-[#FF5C5C] font-semibold text-xs shrink-0">
                <XCircle className="w-3.5 h-3.5" />
                <span>HIGH RISK (88 / 100)</span>
              </div>
            </div>

            {/* Two-Column Demonstration Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Verdict Summary */}
              <div className="lg:col-span-5 space-y-4">
                <div className="p-5 rounded-[14px] bg-[#101012] border border-[#29292D] space-y-4">
                  <div>
                    <span className="text-[11px] font-mono text-[#686870] uppercase">Detection Verdict</span>
                    <h3 className="text-lg font-bold text-[#F5F5F5] mt-0.5">
                      Credential Harvesting Attack
                    </h3>
                  </div>

                  {/* Restrained Score Indicator */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-[#92929A]">Risk Confidence</span>
                      <span className="text-[#FF5C5C] font-bold">88 / 100</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#29292D] rounded-full overflow-hidden">
                      <div className="h-full bg-[#FF5C5C] rounded-full w-[88%]" />
                    </div>
                  </div>

                  <p className="text-xs text-[#92929A] leading-relaxed">
                    This domain mimics Microsoft single sign-on branding while operating under a high-abuse throwaway TLD without authorized certificates.
                  </p>

                  <div className="pt-3 border-t border-[#29292D] grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div>
                      <span className="text-[#686870] block">Target Brand:</span>
                      <span className="text-[#F5F5F5] font-semibold">Microsoft 365</span>
                    </div>
                    <div>
                      <span className="text-[#686870] block">Host Distance:</span>
                      <span className="text-[#FF5C5C] font-semibold">Spoofed Lookalike</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Threat Findings */}
              <div className="lg:col-span-7 space-y-3">
                {/* Finding 1 */}
                <div className="p-4 rounded-[12px] bg-[#101012] border border-[#29292D] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#F5F5F5] flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#FF5C5C]" />
                      Brand Impersonation & Typosquatting
                    </span>
                    <span className="text-[10px] font-mono text-[#FF5C5C] px-2 py-0.5 rounded bg-[#FF5C5C]/10 border border-[#FF5C5C]/30">
                      CRITICAL
                    </span>
                  </div>
                  <p className="text-xs text-[#92929A] leading-relaxed">
                    Domain label incorporates "microsoft" into an unauthorized root domain (<code className="text-[#F5F5F5]">microsoft-verify365.xyz</code>).
                  </p>
                  <p className="text-[11px] text-[#686870] italic">
                    Why it matters: Attackers use trusted brand tokens to deceive users into assuming corporate legitimacy.
                  </p>
                </div>

                {/* Finding 2 */}
                <div className="p-4 rounded-[12px] bg-[#101012] border border-[#29292D] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#F5F5F5] flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#F2B84B]" />
                      High-Abuse Top Level Domain (.xyz)
                    </span>
                    <span className="text-[10px] font-mono text-[#F2B84B] px-2 py-0.5 rounded bg-[#F2B84B]/10 border border-[#F2B84B]/30">
                      ELEVATED
                    </span>
                  </div>
                  <p className="text-xs text-[#92929A] leading-relaxed">
                    The registration TLD has a statistically elevated ratio of phishing and disposable scam campaigns.
                  </p>
                  <p className="text-[11px] text-[#686870] italic">
                    Why it matters: Adversaries favor inexpensive, throwaway domains that can be rapidly abandoned when blacklisted.
                  </p>
                </div>

                {/* Finding 3 */}
                <div className="p-4 rounded-[12px] bg-[#101012] border border-[#29292D] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#F5F5F5] flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#FF5C5C]" />
                      Credential Gateway Signatures
                    </span>
                    <span className="text-[10px] font-mono text-[#FF5C5C] px-2 py-0.5 rounded bg-[#FF5C5C]/10 border border-[#FF5C5C]/30">
                      HIGH
                    </span>
                  </div>
                  <p className="text-xs text-[#92929A] leading-relaxed">
                    Path components include <code className="text-[#F5F5F5]">/auth/session</code> targeting corporate login cookies.
                  </p>
                  <p className="text-[11px] text-[#686870] italic">
                    Why it matters: Directs submitted form credentials to an adversarial database instead of Microsoft identity providers.
                  </p>
                </div>
              </div>
            </div>

            {/* Collapsible "Why was this flagged?" Section */}
            <div className="pt-2 border-t border-[#29292D]">
              <button
                type="button"
                onClick={() => setPreviewExpanded(!previewExpanded)}
                className="w-full py-2.5 px-4 rounded-[10px] bg-[#101012] hover:bg-[#1B1B1F] border border-[#29292D] flex items-center justify-between text-xs font-mono text-[#92929A] hover:text-[#F5F5F5] transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-[#FF6B35]" />
                  <span>Why was this flagged? (Technical Evidence Dossier)</span>
                </span>
                {previewExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {previewExpanded && (
                <div className="mt-3 p-4 rounded-[12px] bg-[#101012] border border-[#29292D] space-y-3 text-xs font-mono text-[#92929A]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-2.5 rounded-[8px] bg-[#151517] border border-[#29292D]">
                      <span className="text-[10px] text-[#686870] block">Extracted Hostname:</span>
                      <span className="text-[#F5F5F5]">login.microsoft-verify365.xyz</span>
                    </div>
                    <div className="p-2.5 rounded-[8px] bg-[#151517] border border-[#29292D]">
                      <span className="text-[10px] text-[#686870] block">Shannon Entropy:</span>
                      <span className="text-[#F5F5F5]">4.62 (Elevated Anomaly)</span>
                    </div>
                    <div className="p-2.5 rounded-[8px] bg-[#151517] border border-[#29292D]">
                      <span className="text-[10px] text-[#686870] block">ML Random Forest:</span>
                      <span className="text-[#FF5C5C]">94.2% Phishing Confidence</span>
                    </div>
                    <div className="p-2.5 rounded-[8px] bg-[#151517] border border-[#29292D]">
                      <span className="text-[10px] text-[#686870] block">Analysis Method:</span>
                      <span className="text-[#35C98A]">Zero-Execution Lexical Sandbox</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#686870] leading-relaxed pt-1">
                    Every URL analyzed with Catch the Phish generates this granular forensic breakdown, enabling security teams and individuals to understand exactly how threat decisions are determined.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 7. Action CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center space-y-6">
          <div className="p-8 sm:p-12 rounded-[18px] bg-[#151517] border border-[#29292D] space-y-5">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F5F5]">
              Verify any suspicious URL in seconds.
            </h2>
            <p className="text-xs sm:text-sm text-[#92929A] max-w-md mx-auto">
              Zero network execution. Fast explainable insights. Backed by machine learning and first-principles cybersecurity engineering.
            </p>
            <div className="pt-2">
              <button
                onClick={handleFocusScanner}
                className="px-7 py-3 bg-[#FF6B35] hover:bg-[#ff7b49] text-white font-semibold text-xs sm:text-sm rounded-[10px] transition-all cursor-pointer inline-flex items-center gap-2 shadow-sm"
              >
                <span>Analyze a URL Now</span>
                <ArrowRight className="w-4 h-4 stroke-[2.2]" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* 8. Landing Footer */}
      <LandingFooter setActivePage={setActivePage} />
    </div>
  );
}
