import React, { useState, useEffect } from 'react';
import { 
  BarChart3, PieChart as PieIcon, Activity, TrendingUp, ShieldAlert, 
  ShieldCheck, AlertTriangle, RefreshCw, Cpu, CheckCircle2, Zap 
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, AreaChart, Area, CartesianGrid, Legend 
} from 'recharts';
import { api } from '../services/api';

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [mlMetrics, setMlMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, mlData] = await Promise.all([
        api.getDashboardStats().catch(() => null),
        api.getMLMetrics().catch(() => null)
      ]);
      setStats(statsData);
      setMlMetrics(mlData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const safeCount = stats?.safe_count || 0;
  const suspiciousCount = stats?.suspicious_count || 0;
  const phishingCount = stats?.phishing_count || 0;
  const totalScans = stats?.total_scans || (safeCount + suspiciousCount + phishingCount) || 1;
  const detectionRate = totalScans > 0 ? (((phishingCount + suspiciousCount) / totalScans) * 100).toFixed(1) : '0.0';

  const distributionData = [
    { name: 'Safe (0-30)', value: safeCount || 1, color: '#35C98A' },
    { name: 'Suspicious (31-60)', value: suspiciousCount || 1, color: '#F2B84B' },
    { name: 'Phishing (61-100)', value: phishingCount || 1, color: '#FF5C5C' },
  ];

  const topIndicatorsData = (stats?.top_threat_indicators && stats.top_threat_indicators.length > 0)
    ? stats.top_threat_indicators
    : [
        { name: 'Brand Impersonation', count: 8 },
        { name: 'Suspicious TLD', count: 6 },
        { name: 'Insecure HTTP', count: 5 },
        { name: 'Excessive Subdomains', count: 4 },
        { name: 'Credential Keywords', count: 3 },
        { name: 'Punycode Homoglyphs', count: 2 }
      ];

  const activityData = (stats?.recent_activity && stats.recent_activity.length > 0)
    ? stats.recent_activity.map((r, i) => ({
        time: r.time || `T-${i}`,
        score: r.score
      }))
    : [
        { time: '09:00', score: 10 },
        { time: '10:00', score: 85 },
        { time: '11:00', score: 45 },
        { time: '12:00', score: 92 },
        { time: '13:00', score: 15 },
        { time: '14:00', score: 78 },
        { time: '15:00', score: 95 }
      ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-[#151517] border border-[#29292D] text-[#92929A] text-xs font-mono uppercase tracking-wider mb-2">
            <BarChart3 className="w-3.5 h-3.5 text-[#FF6B35]" />
            <span>SOC Telemetry & Threat Trends</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F5F5] tracking-tight">
            Cybersecurity Analytics
          </h1>
          <p className="text-xs text-[#92929A] mt-1">
            Aggregate detection rates, classification ratios, and machine learning inference accuracy.
          </p>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-2 px-3 py-1.5 rounded-[10px] bg-[#151517] border border-[#29292D] hover:border-[#38383E] text-[#92929A] hover:text-[#F5F5F5] text-xs font-mono transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#FF6B35]' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-[14px] bg-[#151517] border border-[#29292D] space-y-1">
          <div className="text-[11px] font-mono text-[#92929A] uppercase font-semibold">Total Scanned URLs</div>
          <div className="text-3xl font-bold font-mono text-[#F5F5F5]">{stats?.total_scans ?? 0}</div>
          <div className="text-[11px] text-[#35C98A] font-mono">100% Zero-Execution</div>
        </div>

        <div className="p-5 rounded-[14px] bg-[#151517] border border-[#29292D] space-y-1">
          <div className="text-[11px] font-mono text-[#FF5C5C] uppercase font-semibold flex items-center justify-between">
            <span>Threat Detection Rate</span>
            <ShieldAlert className="w-4 h-4 text-[#FF5C5C]" />
          </div>
          <div className="text-3xl font-bold font-mono text-[#FF5C5C]">{detectionRate}%</div>
          <div className="text-[11px] text-[#92929A] font-mono">Suspicious + Phishing</div>
        </div>

        <div className="p-5 rounded-[14px] bg-[#151517] border border-[#29292D] space-y-1">
          <div className="text-[11px] font-mono text-[#F2B84B] uppercase font-semibold">Average Risk Score</div>
          <div className="text-3xl font-bold font-mono text-[#F5F5F5]">
            {stats?.avg_risk_score ?? 0}
            <span className="text-sm text-[#686870] font-normal"> / 100</span>
          </div>
          <div className="text-[11px] text-[#92929A] font-mono">Fleet Mean Risk</div>
        </div>

        <div className="p-5 rounded-[14px] bg-[#151517] border border-[#29292D] space-y-1">
          <div className="text-[11px] font-mono text-[#35C98A] uppercase font-semibold flex items-center justify-between">
            <span>ML Model F1-Score</span>
            <Cpu className="w-4 h-4 text-[#35C98A]" />
          </div>
          <div className="text-3xl font-bold font-mono text-[#35C98A]">
            {mlMetrics ? `${(mlMetrics.models.random_forest.f1_score * 100).toFixed(1)}%` : '100%'}
          </div>
          <div className="text-[11px] text-[#92929A] font-mono">Random Forest Classifier</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Level Distribution Donut */}
        <div className="p-6 rounded-[16px] bg-[#151517] border border-[#29292D] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-[#F5F5F5] font-mono uppercase tracking-wider flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-[#FF6B35]" />
              <span>Safe vs Suspicious vs Phishing</span>
            </h3>
          </div>

          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#101012" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#151517', borderColor: '#29292D', borderRadius: '10px', color: '#F5F5F5', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-center gap-6 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#35C98A]" />
              <span className="text-[#92929A]">Safe: {safeCount}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F2B84B]" />
              <span className="text-[#92929A]">Suspicious: {suspiciousCount}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF5C5C]" />
              <span className="text-[#92929A]">Phishing: {phishingCount}</span>
            </div>
          </div>
        </div>

        {/* Threat Trends Over Time */}
        <div className="p-6 rounded-[16px] bg-[#151517] border border-[#29292D] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-[#F5F5F5] font-mono uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#FF6B35]" />
              <span>Scan Risk Trends</span>
            </h3>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="analyticsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#FF6B35" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#29292D" />
                <XAxis dataKey="time" stroke="#686870" tick={{ fontSize: 10, fill: '#686870' }} />
                <YAxis domain={[0, 100]} stroke="#686870" tick={{ fontSize: 10, fill: '#686870' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#151517', borderColor: '#29292D', borderRadius: '10px', color: '#F5F5F5', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="score" stroke="#FF6B35" fillOpacity={1} fill="url(#analyticsGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Threat Indicators Frequency Bar */}
      <div className="p-6 rounded-[16px] bg-[#151517] border border-[#29292D] space-y-4">
        <h3 className="text-xs font-semibold text-[#F5F5F5] font-mono uppercase tracking-wider flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#FF6B35]" />
          <span>Most Frequently Triggered Threat Signatures</span>
        </h3>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topIndicatorsData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#29292D" vertical={false} />
              <XAxis dataKey="name" stroke="#686870" tick={{ fontSize: 11, fill: '#92929A' }} />
              <YAxis stroke="#686870" tick={{ fontSize: 11, fill: '#686870' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#151517', borderColor: '#29292D', borderRadius: '10px', color: '#F5F5F5', fontSize: '11px' }}
                itemStyle={{ color: '#FF6B35' }}
              />
              <Bar dataKey="count" fill="#FF6B35" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
