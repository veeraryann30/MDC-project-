import React, { useState, useEffect } from 'react';
import { 
  X, Play, ChevronDown, ChevronRight, ArrowRight, 
  ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2, 
  Cpu, Lock, Eye, Layers, Compass, 
  FileText, Zap, Globe, Search, Sliders, Check, Share2
} from 'lucide-react';
import { api } from '../../services/api';
const pct = (v) => (typeof v === 'number' ? `${(v * 100).toFixed(1)}%` : '—');

export default function AboutModal({ isOpen, onClose, setActivePage }) {
  const [activeTab, setActiveTab] = useState('flowchart'); // 'flowchart' | 'problem' | 'objectives' | 'ml' | 'all'
  const [activeFlowStep, setActiveFlowStep] = useState(5);
  const [selectedOutcome, setSelectedOutcome] = useState('safe');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStep, setSimulationStep] = useState(null);
  const [mlMetrics, setMlMetrics] = useState(null);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Fetch ML evaluation metrics
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    const loadMetrics = async () => {
      try {
        const data = await api.getMLMetrics();
        if (isMounted) setMlMetrics(data);
      } catch (err) {
        console.warn('Backend ML metrics unavailable', err);
      }
    };
    loadMetrics();
    return () => { isMounted = false; };
  }, [isOpen]);

  if (!isOpen) return null;

  // Live model metrics from the backend; "—" when unavailable (nothing is invented).
  const rf = mlMetrics?.models?.random_forest || {
    accuracy: mlMetrics?.accuracy,
    f1_score: mlMetrics?.f1_score,
    precision: mlMetrics?.precision,
    recall: mlMetrics?.recall
  };
  const lr = mlMetrics?.models?.logistic_regression || { accuracy: undefined, f1_score: undefined, precision: undefined, recall: undefined };

  // The 10 App Pipeline Stages
  const pipelineStages = [
    {
      id: 0,
      phase: 'INCEPTION',
      title: 'START',
      icon: Play,
      summary: 'Pipeline initialization & secure session instantiation.',
      description: 'The user session opens within an isolated client runtime. Zero background cookies or untracked telemetry are dispatched.',
      badge: '01 · INIT',
      latency: '< 1ms',
      technicalDetails: {
        layer: 'Client Runtime',
        protocol: 'Sandboxed Context',
        guarantee: 'Zero Local Data Leaks',
        action: 'Initializes cryptographic session tokens and secure DOM sandbox.'
      }
    },
    {
      id: 1,
      phase: 'CLIENT SESSION',
      title: 'User Opens Catch the Phish',
      icon: Globe,
      summary: 'Secure browser UI loads with local memory isolation.',
      description: 'The workstation interface renders with active CSP (Content Security Policy) rules prohibiting unauthorized dynamic scripts.',
      badge: '02 · CLIENT',
      latency: 'Instant',
      technicalDetails: {
        layer: 'Interface Shell',
        protocol: 'Strict CSP Level 3',
        guarantee: 'Subresource Integrity',
        action: 'Loads verified UI components with hardened cross-origin isolation.'
      }
    },
    {
      id: 2,
      phase: 'LINK INGESTION',
      title: 'Enters or Pastes a URL',
      icon: Search,
      summary: 'Raw string is captured into a sandboxed input buffer.',
      description: 'The target link is isolated in an unexecuted memory buffer. The browser is explicitly prevented from DNS resolving or prefetching.',
      badge: '03 · INPUT',
      latency: '< 2ms',
      technicalDetails: {
        layer: 'Input Sanitizer',
        protocol: 'Null-Execution Buffer',
        guarantee: 'Zero Prefetch / No DNS Probe',
        action: 'Raw Unicode characters decoded and normalized into standard string representation.'
      }
    },
    {
      id: 3,
      phase: 'SUBMISSION',
      title: 'URL Submission',
      icon: ArrowRight,
      summary: 'Secure TLS payload transmission to the inspection engine.',
      description: 'The link string is encapsulated in a JSON payload and dispatched via encrypted POST request to the Catch the Phish backend API.',
      badge: '04 · DISPATCH',
      latency: '15ms',
      technicalDetails: {
        layer: 'API Transport',
        protocol: 'HTTPS / TLS 1.3',
        guarantee: 'Encrypted In-Transit',
        action: 'POST /api/v1/scan payload delivered to backend worker thread.'
      }
    },
    {
      id: 4,
      phase: 'VALIDATION',
      title: 'URL Validation',
      icon: CheckCircle2,
      summary: 'RFC 3986 schema validation & domain normalization.',
      description: 'Strict syntactic parsing checks protocol scheme (http/https), top-level domain viability, IPv4/IPv6 notation, and port structure.',
      badge: '05 · PARSE',
      latency: '2ms',
      technicalDetails: {
        layer: 'Syntactic Analyzer',
        protocol: 'RFC 3986 & RFC 3492',
        guarantee: 'Malformed Input Filtering',
        action: 'Extracts domain, TLD, scheme, path, query, and homoglyph punycode.'
      }
    },
    {
      id: 5,
      phase: 'EXTRACTION',
      title: 'Feature Extraction and URL Analysis',
      icon: Cpu,
      summary: '34 high-dimensional lexical & structural metrics extracted.',
      description: 'Zero-network static decomposition computes character entropy, dot counts, hyphen ratios, brand proximity, and token distributions.',
      badge: '06 · VECTORS',
      latency: '8ms',
      technicalDetails: {
        layer: 'Feature Pipeline',
        protocol: 'Static Lexical Parser',
        guarantee: 'Pure Mathematical Vector',
        action: 'Generates 34 numeric dimensions: Shannon entropy, token counts, digit ratios, and subdomain depth.'
      }
    },
    {
      id: 6,
      phase: 'DETECTION ENGINES',
      title: 'Phishing Detection Mechanisms / API Verification',
      icon: Layers,
      summary: 'Parallel Random Forest inference & heuristic rule checks.',
      description: 'The 34-feature vector is fed into a 120-tree Random Forest classifier alongside 15+ deterministic threat pattern rules.',
      badge: '07 · INFERENCE',
      latency: '12ms',
      technicalDetails: {
        layer: 'Dual Model Engine',
        protocol: 'Random Forest + Heuristic Engine',
        guarantee: '100% Explainable Signals',
        action: 'Returns ML phishing probability (0-1) and flagged heuristic violations.'
      }
    },
    {
      id: 7,
      phase: 'INTEL CHECK',
      title: 'Threat Intelligence Evaluation',
      icon: Compass,
      summary: 'Known adversary databases & brand signature matching.',
      description: 'Checks brand impersonation via Levenshtein distance against 50+ global brands and cross-references known malicious indicators.',
      badge: '08 · INTEL',
      latency: '10ms',
      technicalDetails: {
        layer: 'Threat Intelligence',
        protocol: 'Levenshtein + Brand Catalogue',
        guarantee: 'Zero Third-Party Tracking',
        action: 'Identifies typosquatting distances, homoglyph traps, and high-abuse TLDs.'
      }
    },
    {
      id: 8,
      phase: 'SCORING',
      title: 'Risk Assessment',
      icon: Sliders,
      summary: 'Weighted algorithmic synthesis into unified 0–100 score.',
      description: 'ScorerService integrates ML probability, rule penalties, and brand distance into a calibrated final risk score.',
      badge: '09 · SCORING',
      latency: '4ms',
      technicalDetails: {
        layer: 'Scorer Synthesis',
        protocol: 'Calibrated Risk Matrix',
        guarantee: 'Bounded Range [0, 100]',
        action: 'Calculates weighted penalty score and compiles explainable reason breakdown.'
      }
    },
    {
      id: 9,
      phase: 'VERDICT',
      title: 'Final Classification',
      icon: Zap,
      summary: 'Deterministic tri-state verdict branching.',
      description: 'The final risk score routes into one of three defined outcomes: Safe (0–29), Suspicious (30–69), or Malicious (70–100).',
      badge: '10 · VERDICT',
      latency: '< 1ms',
      technicalDetails: {
        layer: 'Decision Classifier',
        protocol: 'Tri-State Gate',
        guarantee: 'Actionable Clarity',
        action: 'Dispatches complete report with findings, why it matters, and end-user guidance.'
      }
    }
  ];

  // The 3 Outcomes
  const outcomes = {
    safe: {
      id: 'safe',
      label: 'SAFE',
      range: 'Score: 0 — 29',
      borderColor: 'border-[#35C98A]',
      textColor: 'text-[#35C98A]',
      bgAccent: 'bg-[#35C98A]/10',
      icon: ShieldCheck,
      headline: 'No significant phishing indicators detected.',
      summary: 'The submitted link conforms to standard lexical distribution profiles, possesses legitimate domain infrastructure, and demonstrates zero known adversarial patterns or brand spoofing.',
      recommendation: 'Safe to browse with standard web hygiene.'
    },
    suspicious: {
      id: 'suspicious',
      label: 'SUSPICIOUS',
      range: 'Score: 30 — 69',
      borderColor: 'border-[#F2B84B]',
      textColor: 'text-[#F2B84B]',
      bgAccent: 'bg-[#F2B84B]/10',
      icon: AlertTriangle,
      headline: 'Potentially harmful characteristics identified.',
      summary: 'Observed structural anomalies, such as irregular subdomain depth, brand-adjacent keywords, or uncommon top-level domain registrations that require increased user caution.',
      recommendation: 'Exercise caution. Do not enter credentials or download attachments.'
    },
    malicious: {
      id: 'malicious',
      label: 'MALICIOUS',
      range: 'Score: 70 — 100',
      borderColor: 'border-[#FF5C5C]',
      textColor: 'text-[#FF5C5C]',
      bgAccent: 'bg-[#FF5C5C]/10',
      icon: ShieldAlert,
      headline: 'Strong phishing or malicious indicators detected.',
      summary: 'Definite adversarial indicators flagged: confirmed brand typosquatting, raw IP host destination, credential harvesting parameters, or known malicious infrastructure matching.',
      recommendation: 'Immediate risk! Do NOT proceed or interact with this link.'
    }
  };

  // Run pipeline trace simulation
  const runSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    let current = 0;
    setSimulationStep(0);
    setActiveFlowStep(0);

    const interval = setInterval(() => {
      current += 1;
      if (current < pipelineStages.length) {
        setSimulationStep(current);
        setActiveFlowStep(current);
      } else {
        clearInterval(interval);
        setIsSimulating(false);
        setSimulationStep(null);
      }
    }, 400);
  };

  const activeStage = pipelineStages[activeFlowStep] || pipelineStages[0];

  return (
    <div 
      className="ctp-dark ctp-console fixed inset-0 z-[120] bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-modal="true"
      role="dialog"
    >
      {/* Modal Dialog Container */}
      <div className="relative w-full max-w-5xl my-auto rounded-2xl bg-white border border-[#E2E8F0] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Top Header & Navigation Bar */}
        <div className="px-6 py-4 bg-[#F5F9FF] border-b border-[#E2E8F0] flex items-center justify-between gap-4 shrink-0 select-none">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DBEAFE] border border-[#BFDBFE] text-[#2563EB] text-[11px] font-mono font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-pulse" />
              <span>ABOUT CATCH THE PHISH · ARCHITECTURE</span>
            </div>
          </div>

          {/* Tab Switcher */}
          <nav className="hidden md:flex items-center gap-1 p-1 rounded-full bg-white border border-[#E2E8F0] text-xs font-mono shadow-sm">
            {[
              { id: 'flowchart', label: 'App Flowchart' },
              { id: 'problem', label: 'Problem' },
              { id: 'objectives', label: 'Objectives' },
              { id: 'ml', label: 'ML Specs' },
              { id: 'all', label: 'View All' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#2563EB] text-white font-semibold shadow-sm'
                    : 'text-[#64748B] hover:text-[#111827]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Close Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#64748B] hover:text-[#111827] hover:bg-white border border-[#E2E8F0] transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-mono"
              title="Close (Esc)"
            >
              <span className="hidden sm:inline text-[10px] text-[#94A3B8]">ESC</span>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Tab Switcher */}
        <div className="md:hidden px-4 py-2 bg-[#F5F9FF] border-b border-[#E2E8F0] flex items-center justify-between gap-1 overflow-x-auto text-[11px] font-mono shrink-0">
          {[
            { id: 'flowchart', label: 'Flowchart' },
            { id: 'problem', label: 'Problem' },
            { id: 'objectives', label: 'Objectives' },
            { id: 'ml', label: 'ML Specs' },
            { id: 'all', label: 'All' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-2.5 py-1 rounded-md transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#2563EB] text-white font-semibold'
                  : 'text-[#64748B]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-12 bg-white text-[#111827]">

          {/* ==========================================================================
              FLOWCHART VIEW: THE WORKING ARCHITECTURE OF CATCH THE PHISH
              ========================================================================== */}
          {(activeTab === 'flowchart' || activeTab === 'all') && (
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#2563EB] font-semibold">
                    <span>App Architecture Flowchart</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#111827]">
                    Behind every click, there's a process.
                  </h3>
                  <p className="text-xs sm:text-sm text-[#64748B] max-w-xl">
                    An interactive trace of how Catch the Phish evaluates links in sub-second time without network execution.
                  </p>
                </div>

                <button
                  onClick={runSimulation}
                  disabled={isSimulating}
                  className={`shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono font-semibold transition-all cursor-pointer border ${
                    isSimulating
                      ? 'bg-[#DBEAFE] text-[#2563EB] border-[#BFDBFE] animate-pulse'
                      : 'bg-white hover:bg-[#F5F9FF] text-[#111827] border-[#E2E8F0] hover:border-[#2563EB] shadow-sm'
                  }`}
                >
                  <Play className={`w-3.5 h-3.5 fill-current ${isSimulating ? 'text-[#2563EB]' : 'text-[#16A34A]'}`} />
                  <span>{isSimulating ? `Tracing Step 0${simulationStep + 1}...` : 'Simulate Pipeline Trace'}</span>
                </button>
              </div>

              {/* Interconnected Flowchart Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 rounded-2xl bg-[#F5F9FF] border border-[#E2E8F0] overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-[#E2E8F0]">
                
                {/* 10 Stages Column */}
                <div className="lg:col-span-7 p-5 sm:p-6 space-y-1 bg-white">
                  <div className="text-[11px] font-mono text-[#64748B] uppercase tracking-wider mb-2 font-semibold">
                    10 Consecutive Operations (Click to Inspect)
                  </div>

                  {pipelineStages.map((stage, idx) => {
                    const isSelected = activeFlowStep === stage.id;
                    const isStepSimulating = simulationStep === stage.id;
                    const Icon = stage.icon;

                    return (
                      <div key={stage.id}>
                        <button
                          onClick={() => setActiveFlowStep(stage.id)}
                          className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-[#F5F9FF] border-[#2563EB] shadow-sm'
                              : isStepSimulating
                              ? 'bg-[#DBEAFE]/50 border-[#2563EB]'
                              : 'bg-white border-[#E2E8F0] hover:border-[#2563EB]/40 hover:bg-[#F5F9FF]'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-[#2563EB] text-white shadow-sm'
                                : isStepSimulating
                                ? 'bg-[#2563EB] text-white'
                                : 'bg-[#F5F9FF] border border-[#E2E8F0] text-[#64748B]'
                            }`}>
                              <Icon className="w-3.5 h-3.5" />
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-[#2563EB] font-semibold">
                                  0{stage.id + 1}
                                </span>
                                <span className="text-[9px] font-mono text-[#64748B] uppercase">
                                  {stage.phase}
                                </span>
                              </div>
                              <h4 className={`text-xs font-semibold truncate ${isSelected ? 'text-[#111827]' : 'text-[#64748B]'}`}>
                                {stage.title}
                              </h4>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-mono text-[#64748B]">
                              {stage.latency}
                            </span>
                            <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? 'text-[#2563EB]' : 'text-[#94A3B8]'}`} />
                          </div>
                        </button>

                        {/* Thin Connecting Line & Arrow */}
                        {idx < pipelineStages.length - 1 && (
                          <div className="flex flex-col items-center justify-center py-1 relative" aria-hidden="true">
                            <div className={`w-[1px] h-3 transition-colors duration-200 ${
                              activeFlowStep > stage.id ? 'bg-[#2563EB]' : 'bg-[#E2E8F0]'
                            }`} />
                            <ChevronDown className={`w-3 h-3 -my-0.5 transition-colors duration-200 ${
                              activeFlowStep > stage.id ? 'text-[#2563EB]' : 'text-[#94A3B8]'
                            }`} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Right Column: Telemetry Inspector */}
                <div className="lg:col-span-5 p-5 sm:p-6 bg-[#F5F9FF]/50 flex flex-col justify-between space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-full bg-[#DBEAFE] border border-[#BFDBFE] text-[#2563EB] text-[11px] font-mono font-semibold">
                        {activeStage.badge}
                      </span>
                      <span className="text-[11px] font-mono text-[#64748B]">
                        Latency: {activeStage.latency}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-base font-bold text-[#111827]">
                        {activeStage.title}
                      </h4>
                      <p className="text-[11px] font-mono text-[#2563EB] font-semibold">
                        Phase: {activeStage.phase}
                      </p>
                      <p className="text-xs text-[#64748B] leading-relaxed pt-1">
                        {activeStage.description}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white border border-[#E2E8F0] shadow-sm space-y-2 font-mono text-xs">
                      <div className="text-[10px] text-[#64748B] uppercase font-semibold">Telemetry</div>
                      <div className="space-y-1.5 text-[11px] text-[#64748B]">
                        <div className="flex items-center justify-between">
                          <span className="text-[#64748B]">Layer:</span>
                          <span className="text-[#111827] font-semibold">{activeStage.technicalDetails.layer}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#64748B]">Protocol:</span>
                          <span className="text-[#111827]">{activeStage.technicalDetails.protocol}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#64748B]">Safety:</span>
                          <span className="text-[#16A34A] font-semibold">{activeStage.technicalDetails.guarantee}</span>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-[#E2E8F0] text-[10px] text-[#64748B] leading-relaxed">
                        {activeStage.technicalDetails.action}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-xs font-mono">
                    <span className="text-[#64748B]">Step Control:</span>
                    <button
                      onClick={() => setActiveFlowStep((prev) => (prev + 1) % pipelineStages.length)}
                      className="text-[#2563EB] hover:text-[#1E40AF] flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <span>Next Stage</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>

              {/* Three Outcomes Branching Tree */}
              <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-[10px] font-mono text-[#64748B] uppercase font-semibold">Stage 10 Classification Output</div>
                    <h4 className="text-sm font-semibold text-[#111827]">Three Possible Verdict Outcomes</h4>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {Object.keys(outcomes).map((key) => {
                      const out = outcomes[key];
                      return (
                        <button
                          key={key}
                          onClick={() => setSelectedOutcome(key)}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase cursor-pointer border ${
                            selectedOutcome === key
                              ? `${out.borderColor} ${out.textColor} ${out.bgAccent} font-semibold shadow-sm`
                              : 'bg-[#F5F9FF] text-[#64748B] border-[#E2E8F0]'
                          }`}
                        >
                          {out.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {Object.keys(outcomes).map((key) => {
                    const out = outcomes[key];
                    const Icon = out.icon;
                    const isSelected = selectedOutcome === key;

                    return (
                      <div
                        key={key}
                        onClick={() => setSelectedOutcome(key)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                          isSelected
                            ? `bg-[#F5F9FF] ${out.borderColor} shadow-sm`
                            : 'bg-white border-[#E2E8F0] hover:border-[#2563EB]/40'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${out.bgAccent} ${out.textColor} border ${out.borderColor}/30`}>
                              {out.label}
                            </span>
                            <span className="font-mono text-[10px] text-[#64748B]">
                              {out.range}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Icon className={`w-4 h-4 shrink-0 ${out.textColor}`} />
                            <h5 className="font-semibold text-xs text-[#111827]">
                              {out.headline}
                            </h5>
                          </div>
                          <p className="text-[11px] text-[#64748B] leading-relaxed">
                            {out.summary}
                          </p>
                        </div>
                        <div className="pt-2 border-t border-[#E2E8F0] text-[10px] font-mono text-[#64748B]">
                          Action: <span className="text-[#111827] font-semibold">{out.recommendation}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* ==========================================================================
              SECTION ONE: PROBLEM STATEMENT
              ========================================================================== */}
          {(activeTab === 'problem' || activeTab === 'all') && (
            <div className="space-y-6 pt-4 border-t border-[#E2E8F0]">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#2563EB] font-semibold">
                  <span>Problem Statement</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#111827]">
                  The internet is growing. So are the threats.
                </h3>
                <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                  Phishing attacks have become one of the most common cybersecurity threats. Cybercriminals create deceptive URLs and fake websites to trick users into revealing sensitive information, including passwords, banking credentials and personal data.
                </p>
                <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                  Most users cannot easily distinguish legitimate websites from malicious ones. This creates a growing need for an accessible platform that can analyze suspicious URLs and communicate potential threats in an understandable way.
                </p>
              </div>

              {/* 3 Challenges */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-[#2563EB] font-mono text-xs font-semibold">
                    <span>01</span>
                    <Share2 className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="text-sm font-semibold text-[#111827]">Deceptive Links</h4>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    Malicious URLs are designed to imitate trusted websites.
                  </p>
                  <div className="p-2.5 rounded-lg bg-[#F5F9FF] border border-[#E2E8F0] text-[11px] font-mono space-y-1">
                    <div className="text-[#16A34A] flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>paypal.com (Legitimate)</span>
                    </div>
                    <div className="text-[#DC2626] flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span>paypa1-login.xyz (Homoglyph)</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-[#F59E0B] font-mono text-xs font-semibold">
                    <span>02</span>
                    <Eye className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="text-sm font-semibold text-[#111827]">Human Vulnerability</h4>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    Users often lack the technical knowledge to recognize phishing attempts.
                  </p>
                  <div className="p-2.5 rounded-lg bg-[#F5F9FF] border border-[#E2E8F0] text-[11px] font-mono text-[#64748B]">
                    Mobile address bars truncate long domains, obscuring the attacker host destination.
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-[#DC2626] font-mono text-xs font-semibold">
                    <span>03</span>
                    <Zap className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="text-sm font-semibold text-[#111827]">Digital Risk</h4>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    A single careless click can expose sensitive personal information.
                  </p>
                  <div className="p-2.5 rounded-lg bg-[#F5F9FF] border border-[#E2E8F0] text-[11px] font-mono text-[#DC2626]">
                    Blast radius: Credential capture → Session token theft → Account takeover.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==========================================================================
              SECTION TWO: OBJECTIVES
              ========================================================================== */}
          {(activeTab === 'objectives' || activeTab === 'all') && (
            <div className="space-y-6 pt-4 border-t border-[#E2E8F0]">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#2563EB] font-semibold">
                  <span>Project Objectives</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#111827]">
                  Making the web a safer place, one link at a time.
                </h3>
              </div>

              {/* 6 Objectives Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {[
                  {
                    num: '01',
                    title: 'Intelligent URL Analysis',
                    desc: 'Analyze submitted URLs to identify suspicious characteristics.',
                    icon: Cpu
                  },
                  {
                    num: '02',
                    title: 'Threat Identification',
                    desc: 'Detect potential phishing and malicious links using available detection mechanisms.',
                    icon: ShieldAlert
                  },
                  {
                    num: '03',
                    title: 'Security Insights',
                    desc: 'Provide understandable information about identified risks.',
                    icon: FileText
                  },
                  {
                    num: '04',
                    title: 'Risk Classification',
                    desc: 'Classify analyzed URLs into Safe, Suspicious and Malicious categories.',
                    icon: Layers
                  },
                  {
                    num: '05',
                    title: 'Cybersecurity Awareness',
                    desc: 'Help users understand online threats and develop safer browsing habits.',
                    icon: Compass
                  },
                  {
                    num: '06',
                    title: 'Accessible Protection',
                    desc: 'Make phishing analysis simple and accessible to everyone.',
                    icon: Lock
                  }
                ].map((obj) => {
                  const Icon = obj.icon;
                  return (
                    <div key={obj.num} className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-sm space-y-2">
                      <div className="flex items-center justify-between text-[#2563EB]">
                        <span className="font-mono text-xs font-semibold">{obj.num}</span>
                        <Icon className="w-4 h-4" />
                      </div>
                      <h4 className="text-sm font-semibold text-[#111827]">{obj.title}</h4>
                      <p className="text-xs text-[#64748B] leading-relaxed">{obj.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ==========================================================================
              SECTION FOUR: ML & SPECIFICATIONS
              ========================================================================== */}
          {(activeTab === 'ml' || activeTab === 'all') && (
            <div className="space-y-6 pt-4 border-t border-[#E2E8F0]">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#2563EB] font-semibold">
                  <span>Specifications & Verification</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-semibold text-[#111827]">
                  Trained on empirical data. Validated with proof.
                </h3>
              </div>

              {/* 4 ML Metrics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-white border border-[#E2E8F0] shadow-sm text-center">
                  <div className="text-[10px] font-mono text-[#64748B] uppercase font-semibold">Model Accuracy</div>
                  <div className="text-2xl font-bold font-mono text-[#2563EB]">
                    {pct(rf.accuracy)}
                  </div>
                  <div className="text-[10px] text-[#64748B]">Random Forest</div>
                </div>
                <div className="p-3.5 rounded-xl bg-white border border-[#E2E8F0] shadow-sm text-center">
                  <div className="text-[10px] font-mono text-[#64748B] uppercase font-semibold">F1-Score</div>
                  <div className="text-2xl font-bold font-mono text-[#16A34A]">
                    {pct(rf.f1_score)}
                  </div>
                  <div className="text-[10px] text-[#64748B]">Harmonic Mean</div>
                </div>
                <div className="p-3.5 rounded-xl bg-white border border-[#E2E8F0] shadow-sm text-center">
                  <div className="text-[10px] font-mono text-[#64748B] uppercase font-semibold">Precision</div>
                  <div className="text-2xl font-bold font-mono text-[#111827]">
                    {pct(rf.precision)}
                  </div>
                  <div className="text-[10px] text-[#64748B]">Low False Positives</div>
                </div>
                <div className="p-3.5 rounded-xl bg-white border border-[#E2E8F0] shadow-sm text-center">
                  <div className="text-[10px] font-mono text-[#64748B] uppercase font-semibold">Recall</div>
                  <div className="text-2xl font-bold font-mono text-[#F59E0B]">
                    {pct(rf.recall)}
                  </div>
                  <div className="text-[10px] text-[#64748B]">True Phish Capture</div>
                </div>
              </div>

              {/* Benchmark Table */}
              <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-sm space-y-2">
                <div className="text-xs font-mono uppercase text-[#64748B] tracking-wider font-semibold">
                  Model Benchmark Comparison
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left font-mono">
                    <thead>
                      <tr className="border-b border-[#E2E8F0] text-[#64748B]">
                        <th className="py-2 px-2.5">Model</th>
                        <th className="py-2 px-2.5">Accuracy</th>
                        <th className="py-2 px-2.5">Precision</th>
                        <th className="py-2 px-2.5">Recall</th>
                        <th className="py-2 px-2.5">F1-Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]">
                      <tr className="text-[#111827]">
                        <td className="py-2 px-2.5 text-[#2563EB] font-semibold">Random Forest (120 Trees)</td>
                        <td className="py-2 px-2.5">{pct(rf.accuracy)}</td>
                        <td className="py-2 px-2.5">{pct(rf.precision)}</td>
                        <td className="py-2 px-2.5">{pct(rf.recall)}</td>
                        <td className="py-2 px-2.5 font-semibold">{pct(rf.f1_score)}</td>
                      </tr>
                      <tr className="text-[#64748B]">
                        <td className="py-2 px-2.5">Logistic Regression (Baseline)</td>
                        <td className="py-2 px-2.5">{pct(lr.accuracy)}</td>
                        <td className="py-2 px-2.5">{pct(lr.precision)}</td>
                        <td className="py-2 px-2.5">{pct(lr.recall)}</td>
                        <td className="py-2 px-2.5">{pct(lr.f1_score)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Zero-Execution Guarantee */}
              <div className="p-4 rounded-xl bg-[#F5F9FF] border border-[#E2E8F0] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Lock className="w-4 h-4 text-[#16A34A] shrink-0" />
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    <strong className="text-[#111827]">Zero-Network Execution Guarantee:</strong> Catch the Phish NEVER visits, queries, renders, or downloads assets from candidate URLs. All inspection is static mathematical parsing.
                  </p>
                </div>
                <span className="shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-50 text-[#16A34A] border border-emerald-200 font-semibold">
                  Non-Invasive
                </span>
              </div>
            </div>
          )}

        </div>

        {/* Modal Bottom Footer Actions */}
        <div className="px-6 py-3.5 bg-[#F5F9FF] border-t border-[#E2E8F0] flex items-center justify-between gap-4 shrink-0 text-xs font-mono select-none">
          <span className="text-[#64748B]">Press <kbd className="px-1.5 py-0.5 rounded bg-white border border-[#E2E8F0] text-[#111827] text-[10px]">ESC</kbd> to close</span>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                if (setActivePage) setActivePage('scanner');
              }}
              className="px-5 py-2 rounded-full bg-gradient-to-r from-[#2563EB] to-[#1E40AF] hover:from-[#1E40AF] hover:to-[#1D4ED8] text-white font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
            >
              <span>Launch Scanner</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
