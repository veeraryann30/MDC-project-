import React, { useState, useEffect } from 'react';
import { 
  Activity, ShieldCheck, AlertTriangle, ShieldAlert, RefreshCw, 
  Search, ArrowRight, Eye, Shield, Lock, CheckCircle2, 
  Clock, ExternalLink, Link2, Bug, Globe, ChevronDown
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip 
} from 'recharts';
import { api } from '../services/api';

export default function Dashboard({ setActivePage, setScanResult }) {
  const [stats, setStats] = useState(null);
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [ratioView, setRatioView] = useState('fleet'); // 'fleet' | 'volume'
  const [indicatorSort, setIndicatorSort] = useState('frequency'); // 'frequency' | 'severity'

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, historyData] = await Promise.all([
        api.getDashboardStats().catch(() => null),
        api.getHistory('', '', 10, 0).catch(() => ({ items: [], total: 0 }))
      ]);
      setStats(statsData);
      setHistoryItems(historyData?.items || []);
      setError('');
    } catch (err) {
      setError('Could not connect to backend server. Make sure FastAPI is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleScanSubmit = async (e, customUrl) => {
    if (e) e.preventDefault();
    const target = (customUrl || urlInput).trim();
    if (!target || scanning) return;

    if (customUrl) setUrlInput(customUrl);

    setScanning(true);
    setScanStep(1);

    const stepInterval = setInterval(() => {
      setScanStep((prev) => (prev < 4 ? prev + 1 : prev));
    }, 220);

    try {
      const result = await api.scanUrl(target);
      clearInterval(stepInterval);
      setScanStep(4);
      setTimeout(() => {
        setScanning(false);
        setScanResult(result);
        setActivePage('results');
      }, 300);
    } catch (err) {
      clearInterval(stepInterval);
      setScanning(false);
      alert(err.message || 'Scan failed. Check URL format.');
    }
  };

  const handleTestVector = (testUrl) => {
    setUrlInput(testUrl);
    handleScanSubmit(null, testUrl);
  };

  const handleViewDetail = async (item) => {
    try {
      const fullRecord = await api.getHistoryItem(item.id);
      const mapped = {
        id: fullRecord.id,
        url: fullRecord.url,
        domain: fullRecord.domain,
        risk_score: fullRecord.risk_score,
        classification: fullRecord.classification,
        breakdown: {
          final_score: fullRecord.risk_score,
          ml_score: fullRecord.ml_score,
          rule_score: fullRecord.rule_score,
          threat_intel_score: fullRecord.threat_intel_score,
          classification: fullRecord.classification,
          classification_label: fullRecord.classification,
          summary_explanation: `Historical scan performed on ${new Date(fullRecord.created_at).toLocaleString()}`
        },
        threats_detected: fullRecord.detected_threats || [],
        safe_indicators: [],
        features: fullRecord.extracted_features || {},
        details: {},
        created_at: fullRecord.created_at
      };
      setScanResult(mapped);
      setActivePage('results');
    } catch (err) {
      alert('Failed to load scan record: ' + err.message);
    }
  };

  // Stats calculation
  const totalScans = stats?.total_scans ?? 8;
  const phishingCount = stats?.phishing_count ?? 3;
  const safeCount = stats?.safe_count ?? 5;
  const suspiciousCount = stats?.suspicious_count ?? 0;

  const safePct = totalScans > 0 ? Math.round((safeCount / totalScans) * 100) : 62;
  const suspiciousPct = totalScans > 0 ? Math.round((suspiciousCount / totalScans) * 100) : 0;
  const phishingPct = totalScans > 0 ? Math.round((phishingCount / totalScans) * 100) : 38;

  const donutData = [
    { name: 'Safe', value: safeCount || 5, color: '#10B981' },
    { name: 'Suspicious', value: suspiciousCount || 0, color: '#F59E0B' },
    { name: 'Malicious', value: phishingCount || 3, color: '#EF4444' }
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* 1. HERO SECTION WITH TACTICAL GLOBE RADAR BACKGROUND */}
      <section className="relative text-center pt-4 pb-2 px-4 overflow-hidden rounded-3xl">
        {/* Globe / Radar Wireframe Background */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-35 -z-10">
          <svg className="w-[700px] h-[350px] text-[#FF6B00]" viewBox="0 0 800 400" fill="none">
            <ellipse cx="400" cy="200" rx="360" ry="180" stroke="currentColor" strokeWidth="1" strokeDasharray="4 6" opacity="0.4" />
            <ellipse cx="400" cy="200" rx="280" ry="140" stroke="currentColor" strokeWidth="1" opacity="0.6" />
            <ellipse cx="400" cy="200" rx="200" ry="100" stroke="currentColor" strokeWidth="1" strokeDasharray="6 6" opacity="0.5" />
            <ellipse cx="400" cy="200" rx="120" ry="60" stroke="currentColor" strokeWidth="1" opacity="0.7" />
            <path d="M400,20 C400,20 180,90 180,200 C180,310 400,380 400,380" stroke="currentColor" strokeWidth="1" opacity="0.5" />
            <path d="M400,20 C400,20 620,90 620,200 C620,310 400,380 400,380" stroke="currentColor" strokeWidth="1" opacity="0.5" />
            <path d="M400,20 C400,20 280,100 280,200 C280,300 400,380 400,380" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
            <path d="M400,20 C400,20 520,100 520,200 C520,300 400,380 400,380" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
            <line x1="400" y1="20" x2="400" y2="380" stroke="currentColor" strokeWidth="1" opacity="0.6" />
            <line x1="40" y1="200" x2="760" y2="200" stroke="currentColor" strokeWidth="1" opacity="0.4" />
          </svg>
        </div>

        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-48 bg-[#FF6B00]/15 blur-3xl rounded-full pointer-events-none -z-10" />

        {/* Left & Right HUD Framing Badges */}
        <div className="hidden lg:flex items-start justify-between max-w-6xl mx-auto px-4 text-[10px] font-mono tracking-widest text-slate-500 mb-2">
          <div 
            onClick={() => setActivePage('threat-intel')}
            className="text-left border-l-2 border-t-2 border-orange-500/50 pl-3 pt-2 cursor-pointer hover:border-orange-500 hover:text-slate-300 transition-colors"
            title="View Threat Intelligence"
          >
            <div className="text-orange-400 font-bold">SECURE</div>
            <div>BROWSE</div>
            <div>STAY AHEAD</div>
          </div>
          <div 
            onClick={() => setActivePage('analytics')}
            className="text-right border-r-2 border-t-2 border-orange-500/50 pr-3 pt-2 cursor-pointer hover:border-orange-500 hover:text-slate-300 transition-colors"
            title="View SOC Analytics"
          >
            <div className="text-orange-400 font-bold">DETECT</div>
            <div>ANALYZE</div>
            <div>PREVENT</div>
          </div>
        </div>

        {/* Central Badge */}
        <button 
          onClick={() => setActivePage('threat-intel')}
          className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-black/80 border border-orange-500/60 hover:border-orange-400 text-orange-400 text-xs font-mono tracking-wider shadow-[0_0_15px_rgba(255,107,0,0.2)] mb-4 cursor-pointer transition-colors"
          title="Click to view Live Threat Intelligence Feeds"
        >
          <Activity className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
          <span>REAL-TIME PHISHING THREAT DETECTION</span>
        </button>

        {/* Headline */}
        <div className="space-y-1 max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-wide uppercase">
            PROTECT YOURSELF FROM
          </h2>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-wider text-[#FF6B00] uppercase drop-shadow-[0_0_35px_rgba(255,107,0,0.45)]">
            PHISHING
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed pt-2">
            Analyze suspicious URLs before opening them. Our multi-layered security engine identifies credential theft, lookalike domains, and zero-day lures without executing malicious scripts.
          </p>
        </div>

        {/* Target URL Input Card (Centered, Tactical Border) */}
        <div className="max-w-4xl mx-auto mt-6">
          <div className="bg-[#090C13] border border-orange-500/40 rounded-2xl p-4 sm:p-5 shadow-[0_0_30px_rgba(255,107,0,0.12)] relative">
            {/* Corner HUD tick marks */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-orange-500" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-orange-500" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-orange-500" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-orange-500" />

            {/* Input Header Row */}
            <div className="flex items-center justify-between pb-3 text-xs">
              <div className="flex items-center gap-2 text-orange-400 font-bold font-mono">
                <Link2 className="w-4 h-4 text-orange-400" />
                <span className="text-white">Target URL Input</span>
              </div>
              <button 
                onClick={() => setActivePage('settings')}
                className="flex items-center gap-1.5 text-slate-400 hover:text-orange-400 font-mono text-[11px] transition-colors cursor-pointer"
                title="View Sandbox Configuration"
              >
                <Lock className="w-3.5 h-3.5 text-orange-400" />
                <span>Zero-Execution Static Sandbox</span>
              </button>
            </div>

            {/* Input & Scan Button */}
            <form onSubmit={handleScanSubmit} className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Link2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="Paste suspicious URL here (e.g., http://paypal-verify.xyz/login)..."
                  className="w-full pl-10 pr-4 py-3 bg-[#06080E] border border-[#1C2230] rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]/40 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={scanning || !urlInput.trim()}
                className="px-6 py-3 bg-[#FF6B00] hover:bg-[#FFA043] disabled:opacity-50 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(255,107,0,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <Search className="w-4 h-4 stroke-[3]" />
                <span>{scanning ? 'SCANNING...' : 'SCAN URL'}</span>
              </button>
            </form>

            {/* Multi-step Scanning Status Feedback */}
            {scanning && (
              <div className="mt-4 p-3 bg-black/60 border border-orange-500/50 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-orange-400">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping" />
                    <span>
                      {scanStep === 1 && 'Extracting 34 structural & lexical features...'}
                      {scanStep === 2 && 'Executing heuristic brand lookalike engine...'}
                      {scanStep === 3 && 'Evaluating Random Forest ML probability...'}
                      {scanStep === 4 && 'Synthesizing explainable threat telemetry...'}
                    </span>
                  </span>
                  <span className="font-bold">{scanStep * 25}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-300 rounded-full"
                    style={{ width: `${scanStep * 25}%` }}
                  />
                </div>
              </div>
            )}

            {/* Test Vectors Row */}
            <div className="mt-4 pt-3 border-t border-[#1C2230]/70 flex flex-wrap items-center gap-2 text-xs font-mono">
              <span className="text-slate-400 text-[11px] mr-1">Try test vectors:</span>

              <button
                type="button"
                onClick={() => handleTestVector('https://www.google.com')}
                className="px-3 py-1 rounded-full bg-[#06080E] hover:bg-slate-800 border border-[#1C2230] hover:border-emerald-500/50 text-slate-300 hover:text-white text-[11px] flex items-center gap-1.5 transition-all cursor-pointer"
                title="Click to automatically test this Safe URL"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Safe Corporate Site</span>
              </button>

              <button
                type="button"
                onClick={() => handleTestVector('http://paypa1-security.xyz/login')}
                className="px-3 py-1 rounded-full bg-[#06080E] hover:bg-slate-800 border border-[#1C2230] hover:border-amber-500/50 text-slate-300 hover:text-white text-[11px] flex items-center gap-1.5 transition-all cursor-pointer"
                title="Click to automatically test this Brand Lookalike"
              >
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Brand Lookalike (Paypal)</span>
              </button>

              <button
                type="button"
                onClick={() => handleTestVector('http://192.168.1.100:8080/admin')}
                className="px-3 py-1 rounded-full bg-[#06080E] hover:bg-slate-800 border border-[#1C2230] hover:border-rose-500/50 text-slate-300 hover:text-white text-[11px] flex items-center gap-1.5 transition-all cursor-pointer"
                title="Click to automatically test this IP + Port link"
              >
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Raw IP + Custom Port</span>
              </button>

              <button
                type="button"
                onClick={() => handleTestVector('http://xn--appl-43a.com/verify')}
                className="px-3 py-1 rounded-full bg-[#06080E] hover:bg-slate-800 border border-[#1C2230] hover:border-purple-500/50 text-slate-300 hover:text-white text-[11px] flex items-center gap-1.5 transition-all cursor-pointer"
                title="Click to automatically test this Punycode link"
              >
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                <span>Punycode Homoglyph</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SECURITY FLEET TELEMETRY HEADER & 4 KPI CARDS */}
      <section className="space-y-4">
        {/* Telemetry Header */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="text-orange-500 flex items-center">
              <svg className="w-5 h-5 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-white font-mono">
              SECURITY FLEET TELEMETRY
            </h3>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="px-3 py-1 bg-[#090C13] border border-[#1C2230] hover:border-orange-500/50 rounded-lg text-xs font-mono text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Refresh Dashboard Data"
          >
            <RefreshCw className={`w-3 h-3 text-orange-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>

        {/* 4 KPI Cards (Clickable to view filtered logs) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: URLS SCANNED */}
          <div 
            onClick={() => setActivePage('history')}
            className="p-4 rounded-2xl bg-[#090C13] border border-[#1C2230] hover:border-orange-500/60 relative overflow-hidden transition-all group cursor-pointer hover:shadow-[0_0_15px_rgba(255,107,0,0.12)]"
            title="Click to view all Scanned URLs"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-950/40 border border-orange-500/30 flex items-center justify-center text-orange-400">
                  <Globe className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">
                  URLS SCANNED
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-0.5">
                ↑ +12%
              </span>
            </div>

            <div className="flex items-baseline justify-between mt-3">
              <div>
                <div className="text-3xl font-black text-white font-mono">
                  {totalScans}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 group-hover:text-orange-400 transition-colors">
                  Real-time Audit Log →
                </div>
              </div>

              {/* Micro sparkline bar graphics */}
              <div className="flex items-end gap-1 h-8 opacity-80">
                <span className="w-1.5 h-3 bg-orange-500/40 rounded-t" />
                <span className="w-1.5 h-5 bg-orange-500/60 rounded-t" />
                <span className="w-1.5 h-4 bg-orange-500/50 rounded-t" />
                <span className="w-1.5 h-7 bg-orange-500/80 rounded-t" />
                <span className="w-1.5 h-6 bg-orange-500 rounded-t" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500/0 via-orange-500/50 to-orange-500/0" />
          </div>

          {/* Card 2: THREATS DETECTED */}
          <div 
            onClick={() => setActivePage('history')}
            className="p-4 rounded-2xl bg-[#090C13] border border-[#1C2230] hover:border-rose-500/60 relative overflow-hidden transition-all group cursor-pointer hover:shadow-[0_0_15px_rgba(239,68,68,0.15)]"
            title="Click to view Phishing Threats in History"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-950/40 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">
                  THREATS DETECTED
                </span>
              </div>
              <span className="text-[10px] font-mono text-rose-400 font-bold flex items-center gap-0.5">
                ↑ +50%
              </span>
            </div>

            <div className="flex items-baseline justify-between mt-3">
              <div>
                <div className="text-3xl font-black text-rose-500 font-mono">
                  {phishingCount}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1 group-hover:text-rose-400 transition-colors">
                  <span className="text-rose-400 font-bold">🔥</span> High Risk / Phishing →
                </div>
              </div>

              {/* Micro sparkline bar graphics */}
              <div className="flex items-end gap-1 h-8 opacity-80">
                <span className="w-1.5 h-2 bg-rose-500/40 rounded-t" />
                <span className="w-1.5 h-4 bg-rose-500/60 rounded-t" />
                <span className="w-1.5 h-5 bg-rose-500/70 rounded-t" />
                <span className="w-1.5 h-3 bg-rose-500/50 rounded-t" />
                <span className="w-1.5 h-8 bg-rose-500 rounded-t" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-rose-500/0 via-rose-500/50 to-rose-500/0" />
          </div>

          {/* Card 3: SUSPICIOUS URLS */}
          <div 
            onClick={() => setActivePage('history')}
            className="p-4 rounded-2xl bg-[#090C13] border border-[#1C2230] hover:border-amber-500/60 relative overflow-hidden transition-all group cursor-pointer hover:shadow-[0_0_15px_rgba(245,158,11,0.15)]"
            title="Click to view Suspicious URLs in History"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-950/40 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Bug className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">
                  SUSPICIOUS URLS
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">
                0%
              </span>
            </div>

            <div className="flex items-baseline justify-between mt-3">
              <div>
                <div className="text-3xl font-black text-amber-400 font-mono">
                  {suspiciousCount}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 group-hover:text-amber-400 transition-colors">
                  ⚠ Anomalous Signatures →
                </div>
              </div>

              {/* Micro sparkline bar graphics */}
              <div className="flex items-end gap-1 h-8 opacity-80">
                <span className="w-1.5 h-3 bg-amber-500/30 rounded-t" />
                <span className="w-1.5 h-2 bg-amber-500/40 rounded-t" />
                <span className="w-1.5 h-1 bg-amber-500/30 rounded-t" />
                <span className="w-1.5 h-2 bg-amber-500/40 rounded-t" />
                <span className="w-1.5 h-2 bg-amber-500/50 rounded-t" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500/0 via-amber-500/50 to-amber-500/0" />
          </div>

          {/* Card 4: SAFE URLS */}
          <div 
            onClick={() => setActivePage('history')}
            className="p-4 rounded-2xl bg-[#090C13] border border-[#1C2230] hover:border-emerald-500/60 relative overflow-hidden transition-all group cursor-pointer hover:shadow-[0_0_15px_rgba(16,185,129,0.15)]"
            title="Click to view Safe URLs in History"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">
                  SAFE URLS
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-0.5">
                ↑ +25%
              </span>
            </div>

            <div className="flex items-baseline justify-between mt-3">
              <div>
                <div className="text-3xl font-black text-emerald-400 font-mono">
                  {safeCount}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 group-hover:text-emerald-400 transition-colors">
                  Clean / Verified →
                </div>
              </div>

              {/* Micro sparkline bar graphics */}
              <div className="flex items-end gap-1 h-8 opacity-80">
                <span className="w-1.5 h-4 bg-emerald-500/40 rounded-t" />
                <span className="w-1.5 h-6 bg-emerald-500/60 rounded-t" />
                <span className="w-1.5 h-5 bg-emerald-500/50 rounded-t" />
                <span className="w-1.5 h-8 bg-emerald-500/80 rounded-t" />
                <span className="w-1.5 h-7 bg-emerald-500 rounded-t" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500/0 via-emerald-500/50 to-emerald-500/0" />
          </div>
        </div>
      </section>

      {/* 3. CHARTS ROW: RISK CLASSIFICATION RATIO & TOP THREAT INDICATORS */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Card: RISK CLASSIFICATION RATIO */}
        <div className="p-5 rounded-2xl bg-[#090C13] border border-[#1C2230] space-y-4">
          <div className="flex items-center justify-between border-b border-[#1C2230] pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                RISK CLASSIFICATION RATIO
              </h4>
            </div>
            <div className="relative">
              <select
                value={ratioView}
                onChange={(e) => setRatioView(e.target.value)}
                className="text-[11px] font-mono text-slate-300 bg-black/60 px-2.5 py-1 rounded border border-[#1C2230] focus:border-orange-500 outline-none cursor-pointer"
              >
                <option value="fleet">Fleet Share %</option>
                <option value="volume">Total Volume</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 pt-2">
            {/* Donut Chart */}
            <div className="relative w-44 h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={74}
                    paddingAngle={4}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-white font-mono">{totalScans}</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-tight">Total Scanned</span>
              </div>
            </div>

            {/* Legend Stats Table */}
            <div className="space-y-2.5 min-w-[180px] text-xs font-mono">
              <div 
                onClick={() => setActivePage('history')}
                className="flex items-center justify-between p-1.5 rounded-lg bg-black/40 hover:bg-black/60 cursor-pointer transition-colors"
                title="Filter Safe URLs"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />
                  <span className="text-slate-300">Safe</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-white">{safeCount}</span>
                  <span className="text-slate-400 text-[11px]">{ratioView === 'fleet' ? `${safePct}%` : `${safeCount} links`}</span>
                </div>
              </div>

              <div 
                onClick={() => setActivePage('history')}
                className="flex items-center justify-between p-1.5 rounded-lg bg-black/40 hover:bg-black/60 cursor-pointer transition-colors"
                title="Filter Suspicious URLs"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
                  <span className="text-slate-300">Suspicious</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-white">{suspiciousCount}</span>
                  <span className="text-slate-400 text-[11px]">{ratioView === 'fleet' ? `${suspiciousPct}%` : `${suspiciousCount} links`}</span>
                </div>
              </div>

              <div 
                onClick={() => setActivePage('history')}
                className="flex items-center justify-between p-1.5 rounded-lg bg-black/40 hover:bg-black/60 cursor-pointer transition-colors"
                title="Filter Malicious URLs"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
                  <span className="text-slate-300">Malicious</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-white">{phishingCount}</span>
                  <span className="text-slate-400 text-[11px]">{ratioView === 'fleet' ? `${phishingPct}%` : `${phishingCount} links`}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Card: TOP THREAT INDICATORS */}
        <div className="p-5 rounded-2xl bg-[#090C13] border border-[#1C2230] space-y-4">
          <div className="flex items-center justify-between border-b border-[#1C2230] pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-orange-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                TOP THREAT INDICATORS
              </h4>
            </div>
            <div className="relative">
              <select
                value={indicatorSort}
                onChange={(e) => setIndicatorSort(e.target.value)}
                className="text-[11px] font-mono text-slate-300 bg-black/60 px-2.5 py-1 rounded border border-[#1C2230] focus:border-orange-500 outline-none cursor-pointer"
              >
                <option value="frequency">Frequency %</option>
                <option value="severity">Risk Severity</option>
              </select>
            </div>
          </div>

          <div className="space-y-3.5 pt-2 text-xs font-mono">
            {/* Indicator 1 */}
            <div 
              onClick={() => setActivePage('threat-intel')}
              className="space-y-1 cursor-pointer group"
              title="Click to explore Phishing Keywords in Threat Intel"
            >
              <div className="flex justify-between text-slate-300 text-[11px] group-hover:text-orange-400 transition-colors">
                <span>Phishing Keywords</span>
                <span className="text-orange-400 font-bold">{indicatorSort === 'frequency' ? '42%' : 'High'}</span>
              </div>
              <div className="h-3 w-full bg-[#06080E] rounded border border-[#1C2230] overflow-hidden p-0.5">
                <div className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded transition-all" style={{ width: '42%' }} />
              </div>
            </div>

            {/* Indicator 2 */}
            <div 
              onClick={() => setActivePage('threat-intel')}
              className="space-y-1 cursor-pointer group"
              title="Click to explore Lookalike Domains in Threat Intel"
            >
              <div className="flex justify-between text-slate-300 text-[11px] group-hover:text-orange-400 transition-colors">
                <span>Lookalike Domains</span>
                <span className="text-orange-400 font-bold">{indicatorSort === 'frequency' ? '28%' : 'Critical'}</span>
              </div>
              <div className="h-3 w-full bg-[#06080E] rounded border border-[#1C2230] overflow-hidden p-0.5">
                <div className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded transition-all" style={{ width: '28%' }} />
              </div>
            </div>

            {/* Indicator 3 */}
            <div 
              onClick={() => setActivePage('threat-intel')}
              className="space-y-1 cursor-pointer group"
              title="Click to explore Suspicious Parameters in Threat Intel"
            >
              <div className="flex justify-between text-slate-300 text-[11px] group-hover:text-orange-400 transition-colors">
                <span>Suspicious Parameters</span>
                <span className="text-orange-400 font-bold">{indicatorSort === 'frequency' ? '18%' : 'Medium'}</span>
              </div>
              <div className="h-3 w-full bg-[#06080E] rounded border border-[#1C2230] overflow-hidden p-0.5">
                <div className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded transition-all" style={{ width: '18%' }} />
              </div>
            </div>

            {/* Indicator 4 */}
            <div 
              onClick={() => setActivePage('threat-intel')}
              className="space-y-1 cursor-pointer group"
              title="Click to explore IP-based URLs in Threat Intel"
            >
              <div className="flex justify-between text-slate-300 text-[11px] group-hover:text-orange-400 transition-colors">
                <span>IP-based URLs</span>
                <span className="text-orange-400 font-bold">{indicatorSort === 'frequency' ? '12%' : 'High'}</span>
              </div>
              <div className="h-3 w-full bg-[#06080E] rounded border border-[#1C2230] overflow-hidden p-0.5">
                <div className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded transition-all" style={{ width: '12%' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. RECENT SCANS TABLE */}
      {historyItems.length > 0 && (
        <section className="p-5 rounded-2xl bg-[#090C13] border border-[#1C2230] space-y-4">
          <div className="flex items-center justify-between border-b border-[#1C2230] pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Recent Security Audits
              </h4>
            </div>
            <button
              onClick={() => setActivePage('history')}
              className="text-xs text-orange-400 hover:text-orange-300 font-semibold font-mono flex items-center gap-1 cursor-pointer"
            >
              <span>View All Logs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="text-slate-400 border-b border-[#1C2230] text-[10px] uppercase">
                  <th className="py-2.5 px-3">Target URL</th>
                  <th className="py-2.5 px-3">Risk Score</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1C2230]/50">
                {historyItems.slice(0, 5).map((item) => {
                  const score = Math.round(item.risk_score || 0);
                  const isSafe = score <= 30;
                  const isSuspicious = score > 30 && score <= 60;
                  return (
                    <tr 
                      key={item.id} 
                      onClick={() => handleViewDetail(item)}
                      className="hover:bg-white/[0.04] transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-3 max-w-xs truncate text-white group-hover:text-orange-400 transition-colors">
                        {item.url}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`font-bold ${isSafe ? 'text-emerald-400' : isSuspicious ? 'text-amber-400' : 'text-rose-400'}`}>
                          {score} / 100
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isSafe
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                            : isSuspicious
                            ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                            : 'bg-rose-950/80 text-rose-300 border border-rose-800'
                        }`}>
                          {item.classification}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleViewDetail(item)}
                          className="px-2.5 py-1 rounded bg-[#06080E] hover:bg-orange-500 hover:text-black border border-[#1C2230] hover:border-orange-500 text-slate-300 text-[10px] transition-all cursor-pointer"
                        >
                          View Report
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
