import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowRight, Shield, ShieldCheck, ShieldAlert, Lock, Terminal, 
  CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronUp, 
  ExternalLink, Layers, Sparkles, Eye, Cpu, Database
} from 'lucide-react';
import LandingNavbar from '../components/layout/LandingNavbar';
import LandingFooter from '../components/layout/LandingFooter';
import ThreatTrace from '../components/common/ThreatTrace';

export default function Home({ setActivePage }) {
  const [scrollY, setScrollY] = useState(0);
  const [activeScenario, setActiveScenario] = useState('microsoft');
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const showcaseRef = useRef(null);
  const [showcaseTilt, setShowcaseTilt] = useState({ rotateX: 10, scale: 0.95 });

  // 1. Smooth Hardware-Accelerated Scroll & Parallax Tracker
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentY = window.scrollY;
          setScrollY(currentY);

          // Cinematic 3D leveling calculation for showcase frame
          if (showcaseRef.current) {
            const rect = showcaseRef.current.getBoundingClientRect();
            const viewportH = window.innerHeight;
            // When showcase is entering viewport from bottom, it starts tilted at 10deg
            // As it reaches center of screen, it becomes flush at 0deg
            const progress = Math.min(Math.max((viewportH - rect.top) / (viewportH * 0.75), 0), 1);
            const calculatedRotateX = 10 * (1 - progress);
            const calculatedScale = 0.95 + 0.05 * progress;
            setShowcaseTilt({
              rotateX: Math.max(0, calculatedRotateX),
              scale: Math.min(1, calculatedScale)
            });
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Demo Scenarios for Interactive Threat Fingerprint Showcase
  const demoScenarios = {
    microsoft: {
      url: 'https://login.microsoft-verify365.xyz/auth/session?token=49a0e1',
      verdict: 'Credential Harvesting Attack',
      riskScore: 88,
      status: 'danger',
      brand: 'Microsoft 365',
      similarity: 'Unauthorized Typosquat',
      entropy: '4.62 (High Anomaly)',
      mlScore: '94.2% Phishing Confidence',
      findings: [
        {
          title: 'Brand Impersonation & Typosquatting',
          severity: 'CRITICAL',
          desc: 'Domain label incorporates "microsoft" into an unauthorized root domain (microsoft-verify365.xyz).',
          why: 'Attackers use trusted brand tokens to deceive users into assuming corporate legitimacy.'
        },
        {
          title: 'High-Abuse Top Level Domain (.xyz)',
          severity: 'ELEVATED',
          desc: 'The registration TLD has a statistically elevated ratio of phishing and disposable campaigns.',
          why: 'Adversaries favor inexpensive, throwaway domains that can be rapidly abandoned when blacklisted.'
        },
        {
          title: 'Credential Gateway Signatures',
          severity: 'HIGH',
          desc: 'Path components include /auth/session targeting corporate login cookies.',
          why: 'Directs submitted form credentials to an adversarial server instead of Microsoft identity providers.'
        }
      ]
    },
    paypal: {
      url: 'http://paypa1-account-verification.xyz/login.php?cmd=_login-run',
      verdict: 'High-Risk Brand Lookalike',
      riskScore: 92,
      status: 'danger',
      brand: 'PayPal',
      similarity: 'Homoglyph Substitution (1 -> l)',
      entropy: '4.78 (Severe Anomaly)',
      mlScore: '96.5% Phishing Confidence',
      findings: [
        {
          title: 'Character Substitution Typosquatting',
          severity: 'CRITICAL',
          desc: 'The letter "l" is substituted with the number "1" (paypa1 instead of paypal).',
          why: 'Visually indistinguishable to human eyes in many system fonts, fooling quick glances.'
        },
        {
          title: 'Unencrypted Authentication (HTTP)',
          severity: 'HIGH',
          desc: 'Login form is served over plaintext HTTP without TLS encryption.',
          why: 'Legitimate financial platforms enforce HTTPS with HSTS headers unconditionally.'
        },
        {
          title: 'Urgency / Account Verification Trigger',
          severity: 'ELEVATED',
          desc: 'Subdomain leverages urgent security lure terms: "account-verification".',
          why: 'Creates artificial panic to compel users to enter credentials without scrutiny.'
        }
      ]
    },
    google: {
      url: 'https://www.google.com/search?q=cybersecurity+defense+protocols',
      verdict: 'Legitimate Enterprise Domain',
      riskScore: 4,
      status: 'safe',
      brand: 'Google',
      similarity: 'Authentic Official Host',
      entropy: '3.12 (Normal Lexical)',
      mlScore: '0.8% Phishing Probability',
      findings: [
        {
          title: 'Authentic Organizational Domain',
          severity: 'SAFE',
          desc: 'Host google.com is verified against canonical brand authority records.',
          why: 'The primary domain belongs to the official verified entity.'
        },
        {
          title: 'Standard Lexical Structure',
          severity: 'SAFE',
          desc: 'Standard query parameters for public search queries with no suspicious credential tokens.',
          why: 'Matches benign search engine usage patterns.'
        }
      ]
    }
  };

  const currentData = demoScenarios[activeScenario];

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-[#F5F5F5] flex flex-col font-sans selection:bg-[#FF6B35]/30 selection:text-white relative overflow-x-hidden">
      {/* Parallax Background Grid Layer */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, #29292D 1px, transparent 1px)`,
          backgroundSize: '36px 36px',
          transform: `translateY(${scrollY * 0.12}px)`
        }}
        aria-hidden="true"
      />

      {/* Parallax Ambient Radial Glow Layer */}
      <div 
        className="fixed top-0 left-1/2 -translate-x-1/2 pointer-events-none z-0 w-[800px] h-[500px] rounded-full blur-[140px] opacity-15"
        style={{
          background: 'radial-gradient(circle, #FF6B35 0%, rgba(255, 107, 53, 0) 70%)',
          transform: `translate(-50%, ${scrollY * 0.2}px)`
        }}
        aria-hidden="true"
      />

      {/* 1. Slim Landing Navigation Bar */}
      <LandingNavbar setActivePage={setActivePage} />

      <main className="flex-1 relative z-10">
        {/* ==========================================================================
            ACT 1: THE PROLOGUE — HERO & GET STARTED GATEWAY
            ========================================================================== */}
        <section className="pt-24 sm:pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center space-y-8 relative">
          {/* Parallax Floating Telemetry Badges (Foreground depth) */}
          <div 
            className="hidden lg:flex items-center gap-2 absolute -left-12 top-28 px-3 py-1.5 rounded-[10px] bg-[#151517]/80 backdrop-blur-md border border-[#29292D] text-[#92929A] text-[11px] font-mono shadow-xl transition-transform duration-100 ease-out pointer-events-none"
            style={{ transform: `translateY(${scrollY * -0.08}px)` }}
          >
            <Lock className="w-3.5 h-3.5 text-[#35C98A]" />
            <span>Zero Network Execution</span>
          </div>

          <div 
            className="hidden lg:flex items-center gap-2 absolute -right-12 top-40 px-3 py-1.5 rounded-[10px] bg-[#151517]/80 backdrop-blur-md border border-[#29292D] text-[#92929A] text-[11px] font-mono shadow-xl transition-transform duration-100 ease-out pointer-events-none"
            style={{ transform: `translateY(${scrollY * 0.14}px)` }}
          >
            <Cpu className="w-3.5 h-3.5 text-[#FF6B35]" />
            <span>34 Feature Lexical Vector</span>
          </div>

          {/* Eyebrow Label */}
          <div className="scroll-reveal in-view inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#151517] border border-[#29292D] text-[#92929A] text-xs font-mono uppercase tracking-[0.08em]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B35]" />
            <span>PERSONAL CYBERSECURITY · URL INTELLIGENCE</span>
          </div>

          {/* Main Heading */}
          <h1 className="scroll-reveal in-view scroll-stagger-1 text-4xl sm:text-6xl lg:text-[72px] font-bold tracking-[-0.03em] leading-[1.06] text-[#F5F5F5] max-w-4xl mx-auto">
            Don't trust the link.<br />
            <span className="text-[#FF6B35]">Verify it.</span>
          </h1>

          {/* Short Description */}
          <p className="scroll-reveal in-view scroll-stagger-2 text-base sm:text-lg text-[#92929A] max-w-[600px] mx-auto leading-relaxed font-normal">
            Analyze suspicious URLs, uncover phishing indicators, and understand the risks before you click.
          </p>

          {/* Primary "Get Started" Option (Redirects directly to Scanner) */}
          <div className="scroll-reveal in-view scroll-stagger-3 pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setActivePage('scanner')}
              className="btn-apple btn-apple-glow w-full sm:w-auto px-8 py-3.5 bg-[#FF6B35] hover:bg-[#ff7b49] active:scale-95 text-white font-semibold text-sm rounded-[10px] inline-flex items-center justify-center gap-2.5 shadow-lg shadow-[#FF6B35]/25 cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4 stroke-[2.2]" />
            </button>

            <button
              onClick={() => {
                const el = document.getElementById('story');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="btn-apple w-full sm:w-auto px-6 py-3.5 bg-[#151517] hover:bg-[#1B1B1F] border border-[#29292D] hover:border-[#686870] text-[#92929A] hover:text-[#F5F5F5] font-mono text-xs rounded-[10px] inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Explore Threat Story</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Static Sandbox Trust Badge */}
          <div className="scroll-reveal in-view scroll-stagger-4 pt-2 flex items-center justify-center gap-2 text-xs text-[#686870] font-mono">
            <Lock className="w-3.5 h-3.5 text-[#35C98A]" />
            <span>Untrusted String Sandboxing · Zero HTTP Dispatch</span>
          </div>

          {/* 3 Capability Indicators */}
          <div className="pt-10 flex items-center justify-center gap-3 sm:gap-8 text-[11px] font-mono tracking-wider text-[#686870] uppercase">
            <span>01 URL Analysis</span>
            <span className="text-[#29292D]">/</span>
            <span>02 Threat Indicators</span>
            <span className="text-[#29292D]">/</span>
            <span>03 Explainable Results</span>
          </div>
        </section>

        {/* Thin Divider */}
        <div className="max-w-5xl mx-auto px-4">
          <div className="h-[1px] bg-[#29292D]" />
        </div>

        {/* ==========================================================================
            ACT 2: SCROLLYTELLING — THE ANATOMY OF DECEPTION
            ========================================================================== */}
        <section id="story" className="py-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-16">
          <div className="text-center space-y-3 max-w-xl mx-auto scroll-reveal">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono text-[#FF6B35] uppercase tracking-wider font-semibold">
              <span>Chapter 01</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F5F5]">
              The Anatomy of a Phish
            </h2>
            <p className="text-sm text-[#92929A] leading-relaxed">
              Modern cyber attacks don't use obvious broken links. They construct sophisticated deceptive illusions designed to fool the human subconscious.
            </p>
          </div>

          {/* 3 Scrollytelling Visual Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Typosquatting */}
            <div className="card-apple p-6 rounded-[14px] bg-[#151517] border border-[#29292D] space-y-4 scroll-reveal">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-[#FF6B35]">
                  01 / SPOOFING
                </span>
                <span className="w-2 h-2 rounded-full bg-[#FF5C5C]" />
              </div>
              <h3 className="text-base font-semibold text-[#F5F5F5]">
                Brand Typosquatting
              </h3>
              <p className="text-xs text-[#92929A] leading-relaxed">
                Adversaries register lookalike domains by swapping glyphs—substituting letters with numbers (e.g., <code className="text-[#FF5C5C]">paypa1.com</code>) or appending security buzzwords.
              </p>
              <div className="p-3 rounded-[10px] bg-[#101012] border border-[#29292D] text-[11px] font-mono space-y-1">
                <div className="text-[#35C98A] flex items-center justify-between">
                  <span>paypal.com</span>
                  <span className="text-[10px] text-[#686870]">Legitimate</span>
                </div>
                <div className="text-[#FF5C5C] flex items-center justify-between">
                  <span>paypa1-verify.xyz</span>
                  <span className="text-[10px] text-[#FF5C5C]">Adversarial</span>
                </div>
              </div>
            </div>

            {/* Card 2: Deep Obfuscation */}
            <div className="card-apple p-6 rounded-[14px] bg-[#151517] border border-[#29292D] space-y-4 scroll-reveal scroll-stagger-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-[#FF6B35]">
                  02 / PATHWAYS
                </span>
                <span className="w-2 h-2 rounded-full bg-[#F2B84B]" />
              </div>
              <h3 className="text-base font-semibold text-[#F5F5F5]">
                Payload Obfuscation
              </h3>
              <p className="text-xs text-[#92929A] leading-relaxed">
                Excessive directory nesting, encoded hex queries, and raw IP addresses mask the destination to slip past legacy keyword blocklists.
              </p>
              <div className="p-3 rounded-[10px] bg-[#101012] border border-[#29292D] text-[11px] font-mono space-y-1">
                <div className="text-[#686870] text-[10px]">Shannon Entropy Metric</div>
                <div className="text-[#F2B84B] font-bold">4.78 Bits / Token (High Anomaly)</div>
              </div>
            </div>

            {/* Card 3: Zero-Execution */}
            <div className="card-apple p-6 rounded-[14px] bg-[#151517] border border-[#29292D] space-y-4 scroll-reveal scroll-stagger-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-[#FF6B35]">
                  03 / ISOLATION
                </span>
                <span className="w-2 h-2 rounded-full bg-[#35C98A]" />
              </div>
              <h3 className="text-base font-semibold text-[#F5F5F5]">
                Zero-Execution Static Sandbox
              </h3>
              <p className="text-xs text-[#92929A] leading-relaxed">
                Catch the Phish parses strings exclusively. It never opens an HTTP handshake, loads attacker scripts, or reveals your identity to adversary beacons.
              </p>
              <div className="p-3 rounded-[10px] bg-[#101012] border border-[#29292D] text-[11px] font-mono text-[#35C98A] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Immune to Zero-Day Drive-Bys</span>
              </div>
            </div>
          </div>
        </section>

        {/* Thin Divider */}
        <div className="max-w-5xl mx-auto px-4">
          <div className="h-[1px] bg-[#29292D]" />
        </div>

        {/* ==========================================================================
            ACT 3: CINEMATIC SCROLLING — THE THREAT FINGERPRINT SHOWCASE
            ========================================================================== */}
        <section id="threat-fingerprint" className="py-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 scroll-reveal">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-mono text-[#FF6B35] uppercase tracking-wider font-semibold">
                <span>Chapter 02 · Signature Intelligence</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F5F5]">
                The Threat Fingerprint
              </h2>
              <p className="text-xs sm:text-sm text-[#92929A] max-w-lg">
                Instead of opaque binary warnings, Catch the Phish unbundles every flagged threat into transparent, plain-English security evidence.
              </p>
            </div>

            {/* Scenario Switcher Controls */}
            <div className="flex items-center gap-1.5 p-1 bg-[#151517] border border-[#29292D] rounded-[10px] text-xs font-mono">
              <button
                onClick={() => setActiveScenario('microsoft')}
                className={`px-3 py-1.5 rounded-[8px] transition-all cursor-pointer ${
                  activeScenario === 'microsoft'
                    ? 'bg-[#1B1B1F] text-[#FF6B35] font-semibold border border-[#29292D]'
                    : 'text-[#92929A] hover:text-[#F5F5F5]'
                }`}
              >
                Microsoft Phish
              </button>
              <button
                onClick={() => setActiveScenario('paypal')}
                className={`px-3 py-1.5 rounded-[8px] transition-all cursor-pointer ${
                  activeScenario === 'paypal'
                    ? 'bg-[#1B1B1F] text-[#FF6B35] font-semibold border border-[#29292D]'
                    : 'text-[#92929A] hover:text-[#F5F5F5]'
                }`}
              >
                PayPal Lookalike
              </button>
              <button
                onClick={() => setActiveScenario('google')}
                className={`px-3 py-1.5 rounded-[8px] transition-all cursor-pointer ${
                  activeScenario === 'google'
                    ? 'bg-[#1B1B1F] text-[#35C98A] font-semibold border border-[#29292D]'
                    : 'text-[#92929A] hover:text-[#F5F5F5]'
                }`}
              >
                Safe Enterprise
              </button>
            </div>
          </div>

          {/* Cinematic 3D Tilting Dossier Container */}
          <div className="cinematic-viewport">
            <div 
              ref={showcaseRef}
              className="cinematic-tilt rounded-[18px] bg-[#151517] border border-[#29292D] p-6 sm:p-8 space-y-6 shadow-2xl"
              style={{
                transform: `rotateX(${showcaseTilt.rotateX}deg) scale(${showcaseTilt.scale})`,
                boxShadow: `0 24px 60px -20px rgba(0, 0, 0, 0.7)`
              }}
            >
              {/* Header Stage Tracker */}
              <div className="pb-4 border-b border-[#29292D]">
                <ThreatTrace stage={4} isScanning={false} />
              </div>

              {/* Analyzed Target URL Header */}
              <div className="p-4 rounded-[12px] bg-[#101012] border border-[#29292D] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                <div className="space-y-1 overflow-hidden">
                  <span className="text-[#686870] uppercase text-[10px] block">Analyzed Destination</span>
                  <span className="text-[#F5F5F5] break-all select-all font-mono">
                    {currentData.url}
                  </span>
                </div>
                <div className={`inline-flex items-center gap-2 self-start sm:self-center px-3 py-1 rounded-full text-xs font-semibold shrink-0 border ${
                  currentData.status === 'safe'
                    ? 'bg-[#101F18] border-[#35C98A]/40 text-[#35C98A]'
                    : 'bg-[#241315] border-[#FF5C5C]/40 text-[#FF5C5C]'
                }`}>
                  {currentData.status === 'safe' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  <span>{currentData.status === 'safe' ? 'SAFE' : 'HIGH RISK'} ({currentData.riskScore} / 100)</span>
                </div>
              </div>

              {/* Two-Column Dossier Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: Verdict Summary */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="p-5 rounded-[14px] bg-[#101012] border border-[#29292D] space-y-4">
                    <div>
                      <span className="text-[11px] font-mono text-[#686870] uppercase">Detection Verdict</span>
                      <h3 className="text-lg font-bold text-[#F5F5F5] mt-0.5">
                        {currentData.verdict}
                      </h3>
                    </div>

                    {/* Restrained Score Indicator */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-[#92929A]">Risk Confidence</span>
                        <span className={`font-bold ${currentData.status === 'safe' ? 'text-[#35C98A]' : 'text-[#FF5C5C]'}`}>
                          {currentData.riskScore} / 100
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[#29292D] rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${currentData.status === 'safe' ? 'bg-[#35C98A]' : 'bg-[#FF5C5C]'}`}
                          style={{ width: `${currentData.riskScore}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#29292D] grid grid-cols-2 gap-2 text-[11px] font-mono">
                      <div>
                        <span className="text-[#686870] block">Target Brand:</span>
                        <span className="text-[#F5F5F5] font-semibold">{currentData.brand}</span>
                      </div>
                      <div>
                        <span className="text-[#686870] block">Host Distance:</span>
                        <span className={currentData.status === 'safe' ? 'text-[#35C98A]' : 'text-[#FF5C5C]'}>
                          {currentData.similarity}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Threat Findings */}
                <div className="lg:col-span-7 space-y-3">
                  {currentData.findings.map((f, i) => (
                    <div key={i} className="p-4 rounded-[12px] bg-[#101012] border border-[#29292D] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#F5F5F5] flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            f.severity === 'SAFE' ? 'bg-[#35C98A]' : f.severity === 'ELEVATED' ? 'bg-[#F2B84B]' : 'bg-[#FF5C5C]'
                          }`} />
                          {f.title}
                        </span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                          f.severity === 'SAFE'
                            ? 'text-[#35C98A] bg-[#35C98A]/10 border-[#35C98A]/30'
                            : f.severity === 'ELEVATED'
                            ? 'text-[#F2B84B] bg-[#F2B84B]/10 border-[#F2B84B]/30'
                            : 'text-[#FF5C5C] bg-[#FF5C5C]/10 border-[#FF5C5C]/30'
                        }`}>
                          {f.severity}
                        </span>
                      </div>
                      <p className="text-xs text-[#92929A] leading-relaxed">
                        {f.desc}
                      </p>
                      <p className="text-[11px] text-[#686870] italic">
                        Why it matters: {f.why}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Collapsible Technical Evidence Dossier */}
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
                  <div className="mt-3 p-4 rounded-[12px] bg-[#101012] border border-[#29292D] space-y-3 text-xs font-mono text-[#92929A] scroll-reveal in-view">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="p-2.5 rounded-[8px] bg-[#151517] border border-[#29292D]">
                        <span className="text-[10px] text-[#686870] block">Target Domain:</span>
                        <span className="text-[#F5F5F5] break-all">{currentData.url.split('/')[2]}</span>
                      </div>
                      <div className="p-2.5 rounded-[8px] bg-[#151517] border border-[#29292D]">
                        <span className="text-[10px] text-[#686870] block">Shannon Entropy:</span>
                        <span className="text-[#F5F5F5]">{currentData.entropy}</span>
                      </div>
                      <div className="p-2.5 rounded-[8px] bg-[#151517] border border-[#29292D]">
                        <span className="text-[10px] text-[#686870] block">ML Random Forest:</span>
                        <span className={currentData.status === 'safe' ? 'text-[#35C98A]' : 'text-[#FF5C5C]'}>
                          {currentData.mlScore}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-[8px] bg-[#151517] border border-[#29292D]">
                        <span className="text-[10px] text-[#686870] block">Analysis Sandbox:</span>
                        <span className="text-[#35C98A]">Zero-Execution Protocol</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Thin Divider */}
        <div className="max-w-5xl mx-auto px-4">
          <div className="h-[1px] bg-[#29292D]" />
        </div>

        {/* ==========================================================================
            ACT 4: HOW IT WORKS (3 MINIMAL STEPS)
            ========================================================================== */}
        <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-14">
          <div className="text-center space-y-3 max-w-xl mx-auto scroll-reveal">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono text-[#FF6B35] uppercase tracking-wider font-semibold">
              <span>Chapter 03 · Operational Methodology</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F5F5]">
              Security, without the guesswork.
            </h2>
            <p className="text-sm text-[#92929A] leading-relaxed">
              Understand what makes a link suspicious, why it matters, and what to do next.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card-apple p-6 rounded-[14px] bg-[#151517] border border-[#29292D] space-y-3 scroll-reveal">
              <div className="font-mono text-xs font-semibold text-[#FF6B35]">
                01 — Submit
              </div>
              <h3 className="text-base font-semibold text-[#F5F5F5]">
                Submit the link
              </h3>
              <p className="text-xs text-[#92929A] leading-relaxed">
                Paste any link you want to investigate without ever visiting or rendering it in your personal browser.
              </p>
            </div>

            <div className="card-apple p-6 rounded-[14px] bg-[#151517] border border-[#29292D] space-y-3 scroll-reveal scroll-stagger-1">
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

            <div className="card-apple p-6 rounded-[14px] bg-[#151517] border border-[#29292D] space-y-3 scroll-reveal scroll-stagger-2">
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

        {/* ==========================================================================
            ACT 5: FINAL ACTION CTA — WORKSTATION ENTRYWAY
            ========================================================================== */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center space-y-6">
          <div className="card-apple p-8 sm:p-12 rounded-[18px] bg-[#151517] border border-[#29292D] space-y-5 shadow-2xl scroll-reveal">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F5F5]">
              Verify any suspicious URL in seconds.
            </h2>
            <p className="text-xs sm:text-sm text-[#92929A] max-w-md mx-auto leading-relaxed">
              Zero network execution. Fast explainable insights. Backed by machine learning and first-principles cybersecurity engineering.
            </p>
            <div className="pt-2">
              <button
                onClick={() => setActivePage('scanner')}
                className="btn-apple btn-apple-glow px-8 py-3.5 bg-[#FF6B35] hover:bg-[#ff7b49] active:scale-95 text-white font-semibold text-xs sm:text-sm rounded-[10px] inline-flex items-center gap-2 shadow-lg shadow-[#FF6B35]/25 cursor-pointer"
              >
                <span>Get Started in the Workstation</span>
                <ArrowRight className="w-4 h-4 stroke-[2.2]" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Landing Footer */}
      <LandingFooter setActivePage={setActivePage} />
    </div>
  );
}
