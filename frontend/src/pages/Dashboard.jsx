import React, { useState, useEffect } from 'react';
import { 
  Activity, ShieldCheck, AlertTriangle, ShieldAlert, RefreshCw, 
  Search, ArrowRight, Eye, Shield, Lock, CheckCircle2, 
  Clock, ExternalLink, Link2, Bug, Globe, ChevronDown, XCircle
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip 
} from 'recharts';
import ThreatTrace from '../components/common/ThreatTrace';
import { api } from '../services/api';

export default function Dashboard({ setActivePage, setScanResult }) {
  const [stats, setStats] = useState(null);
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);

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
    }, 180);

    try {
      const result = await api.scanUrl(target);
      clearInterval(stepInterval);
      setScanStep(4);
      setTimeout(() => {
        setScanning(false);
        setScanResult(result);
        setActivePage('results');
      }, 250);
    } catch (err) {
      clearInterval(stepInterval);
      setScanning(false);
      setScanStep(0);
      alert(err.message || 'Scan failed. Check URL format.');
    }
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

  const safeCount = stats?.safe_count ?? 0;
  const suspiciousCount = stats?.suspicious_count ?? 0;
  const phishingCount = stats?.phishing_count ?? 0;
  const totalScans = stats?.total_scans ?? (safeCount + suspiciousCount + phishingCount);

  const donutData = [
    { name: 'Safe', value: safeCount || 1, color: '#35C98A' },
    { name: 'Suspicious', value: suspiciousCount || 0, color: '#F2B84B' },
    { name: 'Malicious', value: phishingCount || 0, color: '#FF5C5C' }
  ];

  return (
    <div className="space-y-8 pb-12 select-none">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F5F5F5]">
            Security Overview
          </h1>
          <p className="text-xs text-[#92929A]">
            Monitor fleet URL telemetry, analyze suspicious targets, and inspect recent detection records.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="px-3 py-1.5 rounded-[10px] bg-[#151517] hover:bg-[#1B1B1F] border border-[#29292D] text-xs font-mono text-[#92929A] hover:text-[#F5F5F5] flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#FF6B35]' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* 2. Main URL Scanner Card */}
      <section className="p-5 sm:p-6 rounded-[16px] bg-[#151517] border border-[#29292D] space-y-4 shadow-sm">
        <div className="flex items-center justify-between text-xs font-mono text-[#92929A]">
          <span className="flex items-center gap-1.5 text-[#F5F5F5] font-semibold">
            <Link2 className="w-3.5 h-3.5 text-[#FF6B35]" />
            <span>Quick URL Scanner</span>
          </span>
          <span className="flex items-center gap-1 text-[11px] text-[#686870]">
            <Lock className="w-3.5 h-3.5 text-[#35C98A]" />
            <span>Zero-Execution Protocol</span>
          </span>
        </div>

        <form onSubmit={handleScanSubmit} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              disabled={scanning}
              placeholder="Paste suspicious URL to analyze (e.g., http://paypa1-verify.xyz/login)..."
              className="w-full px-3 py-2.5 bg-[#101012] border border-[#29292D] rounded-[10px] text-xs font-mono text-[#F5F5F5] placeholder-[#686870] focus:outline-none focus:border-[#FF6B35] transition-all disabled:opacity-60"
            />
          </div>

          <button
            type="submit"
            disabled={scanning || !urlInput.trim()}
            className="px-5 py-2.5 bg-[#FF6B35] hover:bg-[#ff7b49] disabled:opacity-40 text-white font-semibold text-xs rounded-[10px] transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap shadow-sm"
          >
            {scanning ? (
              <>
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <span>Analyze</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {scanning && (
          <div className="pt-2 border-t border-[#29292D]">
            <ThreatTrace stage={scanStep} isScanning={scanning} />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
          <span className="text-[#686870] font-mono text-[11px]">Test vectors:</span>
          {[
            { label: 'Safe Corporate', url: 'https://www.google.com/search?q=cybersecurity' },
            { label: 'Brand Lookalike', url: 'http://paypa1-account-verification.xyz/login.php' },
            { label: 'Raw IP + Port', url: 'http://192.168.1.100:8080/secure/bank.asp' }
          ].map((v, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setUrlInput(v.url);
                handleScanSubmit(null, v.url);
              }}
              className="px-2 py-0.5 rounded-[6px] bg-[#101012] hover:bg-[#1B1B1F] border border-[#29292D] text-[#92929A] hover:text-[#F5F5F5] text-[10px] font-mono transition-colors cursor-pointer"
            >
              {v.label}
            </button>
          ))}
        </div>
      </section>

      {/* 3. Four Fleet Telemetry KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Scans */}
        <div 
          onClick={() => setActivePage('history')}
          className="p-5 rounded-[14px] bg-[#151517] border border-[#29292D] hover:border-[#38383E] transition-colors cursor-pointer space-y-2"
        >
          <div className="flex items-center justify-between text-xs text-[#92929A] font-mono">
            <span className="uppercase tracking-wider">Total Scanned</span>
            <Globe className="w-4 h-4 text-[#92929A]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#F5F5F5]">
            {totalScans}
          </div>
          <div className="text-[11px] text-[#686870] font-mono">
            Persistent SQLite Records →
          </div>
        </div>

        {/* Card 2: Threats Detected */}
        <div 
          onClick={() => setActivePage('history')}
          className="p-5 rounded-[14px] bg-[#151517] border border-[#29292D] hover:border-[#38383E] transition-colors cursor-pointer space-y-2"
        >
          <div className="flex items-center justify-between text-xs text-[#92929A] font-mono">
            <span className="uppercase tracking-wider">High Risk Threats</span>
            <ShieldAlert className="w-4 h-4 text-[#FF5C5C]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#FF5C5C]">
            {phishingCount}
          </div>
          <div className="text-[11px] text-[#686870] font-mono">
            Confirmed Phishing Signatures →
          </div>
        </div>

        {/* Card 3: Suspicious */}
        <div 
          onClick={() => setActivePage('history')}
          className="p-5 rounded-[14px] bg-[#151517] border border-[#29292D] hover:border-[#38383E] transition-colors cursor-pointer space-y-2"
        >
          <div className="flex items-center justify-between text-xs text-[#92929A] font-mono">
            <span className="uppercase tracking-wider">Suspicious Links</span>
            <AlertTriangle className="w-4 h-4 text-[#F2B84B]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#F2B84B]">
            {suspiciousCount}
          </div>
          <div className="text-[11px] text-[#686870] font-mono">
            Anomalous Indicators →
          </div>
        </div>

        {/* Card 4: Safe */}
        <div 
          onClick={() => setActivePage('history')}
          className="p-5 rounded-[14px] bg-[#151517] border border-[#29292D] hover:border-[#38383E] transition-colors cursor-pointer space-y-2"
        >
          <div className="flex items-center justify-between text-xs text-[#92929A] font-mono">
            <span className="uppercase tracking-wider">Verified Benign</span>
            <CheckCircle2 className="w-4 h-4 text-[#35C98A]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#35C98A]">
            {safeCount}
          </div>
          <div className="text-[11px] text-[#686870] font-mono">
            Zero Malicious Tokens →
          </div>
        </div>
      </section>

      {/* 4. Insights Row: Ratio Distribution & Signatures */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Classification Distribution */}
        <div className="lg:col-span-5 p-6 rounded-[16px] bg-[#151517] border border-[#29292D] space-y-4">
          <div className="flex items-center justify-between border-b border-[#29292D] pb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#F5F5F5] font-mono">
              Classification Breakdown
            </h3>
            <span className="text-[11px] font-mono text-[#686870]">
              Fleet Ratio
            </span>
          </div>

          <div className="h-48 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#101012" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#151517', borderColor: '#29292D', borderRadius: '10px', color: '#F5F5F5', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono pt-2 border-t border-[#29292D]">
            <div>
              <span className="text-[#35C98A] block font-bold">{safeCount}</span>
              <span className="text-[10px] text-[#686870]">Safe</span>
            </div>
            <div>
              <span className="text-[#F2B84B] block font-bold">{suspiciousCount}</span>
              <span className="text-[10px] text-[#686870]">Suspicious</span>
            </div>
            <div>
              <span className="text-[#FF5C5C] block font-bold">{phishingCount}</span>
              <span className="text-[10px] text-[#686870]">Malicious</span>
            </div>
          </div>
        </div>

        {/* Right: Top Threat Indicators */}
        <div className="lg:col-span-7 p-6 rounded-[16px] bg-[#151517] border border-[#29292D] space-y-4">
          <div className="flex items-center justify-between border-b border-[#29292D] pb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#F5F5F5] font-mono flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-[#FF6B35]" />
              <span>Observed Threat Signatures</span>
            </h3>
            <span className="text-[11px] font-mono text-[#686870]">Heuristic Weight</span>
          </div>

          <div className="space-y-3 pt-1 text-xs font-mono">
            {[
              { label: 'Brand Typosquatting & Impersonation', pct: 42, color: '#FF5C5C' },
              { label: 'High-Abuse Top-Level Domains (.xyz, .top)', pct: 28, color: '#F2B84B' },
              { label: 'Credential Harvesting Path (/login, /auth)', pct: 18, color: '#FF5C5C' },
              { label: 'Punycode / IDN Homoglyph Encoding', pct: 12, color: '#F2B84B' }
            ].map((ind, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#92929A]">{ind.label}</span>
                  <span className="font-bold text-[#F5F5F5]">{ind.pct}%</span>
                </div>
                <div className="h-2 w-full bg-[#101012] rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all" 
                    style={{ width: `${ind.pct}%`, backgroundColor: ind.color }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Recent Scans Table (Clean, Structured) */}
      <section className="p-6 rounded-[16px] bg-[#151517] border border-[#29292D] space-y-4">
        <div className="flex items-center justify-between border-b border-[#29292D] pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#92929A]" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#F5F5F5] font-mono">
              Recent Scans
            </h3>
          </div>
          <button
            onClick={() => setActivePage('history')}
            className="text-xs text-[#92929A] hover:text-[#F5F5F5] font-mono flex items-center gap-1 cursor-pointer"
          >
            <span>All records</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {historyItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="text-[#686870] border-b border-[#29292D] text-[10px] uppercase">
                  <th className="py-2.5 px-3">URL / Domain</th>
                  <th className="py-2.5 px-3">Verdict</th>
                  <th className="py-2.5 px-3">Date & Time</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#29292D]/60">
                {historyItems.slice(0, 5).map((item) => {
                  const score = Math.round(item.risk_score || 0);
                  const isSafe = score <= 30;
                  const isSuspicious = score > 30 && score <= 60;
                  return (
                    <tr 
                      key={item.id} 
                      onClick={() => handleViewDetail(item)}
                      className="hover:bg-[#1B1B1F] transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-3 max-w-xs truncate text-[#F5F5F5] group-hover:text-[#FF6B35] transition-colors">
                        {item.url}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          isSafe
                            ? 'bg-[#101F18] text-[#35C98A] border-[#35C98A]/30'
                            : isSuspicious
                            ? 'bg-[#221B10] text-[#F2B84B] border-[#F2B84B]/30'
                            : 'bg-[#241315] text-[#FF5C5C] border-[#FF5C5C]/30'
                        }`}>
                          <span>{item.classification}</span>
                          <span className="text-[9px] opacity-75">({score})</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#92929A] text-[11px]">
                        {new Date(item.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleViewDetail(item)}
                          className="px-2.5 py-1 rounded-[6px] bg-[#101012] hover:bg-[#1B1B1F] border border-[#29292D] text-[#92929A] hover:text-[#F5F5F5] text-[11px] transition-colors cursor-pointer"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center space-y-2">
            <p className="text-xs text-[#92929A]">No scan records found in persistent audit trail.</p>
            <p className="text-[11px] text-[#686870]">Submit any URL using the scanner above to generate your first report.</p>
          </div>
        )}
      </section>
    </div>
  );
}
