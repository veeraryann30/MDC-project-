import React, { useState, useEffect } from 'react';
import { 
  History as HistoryIcon, Search, Trash2, Filter, Eye, AlertCircle, 
  ShieldCheck, AlertTriangle, ShieldAlert, RefreshCw, X, ArrowUpDown, 
  ChevronLeft, ChevronRight, CheckCircle2, XCircle, ArrowRight,
  MessageSquare, Briefcase, TrendingUp, Mail, Dna, Download, FileJson
} from 'lucide-react';
import { api } from '../services/api';
import ScamResultCard from '../components/common/ScamResultCard';

export default function History({ setActivePage, setScanResult }) {
  const [activeTab, setActiveTab] = useState('MULTI_CHANNEL'); // 'MULTI_CHANNEL' | 'URL_SCANS'
  const [historyItems, setHistoryItems] = useState([]);
  const [scamItems, setScamItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [selectedRecord, setSelectedRecord] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const offset = (currentPage - 1) * pageSize;
      if (activeTab === 'MULTI_CHANNEL') {
        const data = await api.getScamHistory(search, filterClass, 'ALL', pageSize, offset);
        setScamItems(data.items || []);
        setTotal(data.total || 0);
      } else {
        const data = await api.getHistory(search, filterClass, pageSize, offset);
        setHistoryItems(data.items || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [activeTab, filterClass, currentPage]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchHistory();
  };

  const handleDeleteItem = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this audit record?')) return;
    try {
      if (activeTab === 'MULTI_CHANNEL') {
        await api.deleteScamHistoryItem(id);
        setScamItems(prev => prev.filter(i => i.id !== id));
      } else {
        await api.deleteHistoryItem(id);
        setHistoryItems(prev => prev.filter(i => i.id !== id));
      }
      setTotal(prev => Math.max(0, prev - 1));
    } catch (err) {
      alert('Failed to delete item: ' + err.message);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to purge all records in this view?')) return;
    try {
      if (activeTab === 'MULTI_CHANNEL') {
        await api.clearScamHistory();
        setScamItems([]);
      } else {
        await api.clearAllHistory();
        setHistoryItems([]);
      }
      setTotal(0);
    } catch (err) {
      alert('Failed to clear records: ' + err.message);
    }
  };

  const handleInspectUrlItem = async (item) => {
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
        features: fullRecord.features || fullRecord.extracted_features || {},
        details: {},
        created_at: fullRecord.created_at,
        // Unified-engine data (absent on scans recorded before the upgrade)
        verdict: fullRecord.verdict || undefined,
        engine: fullRecord.engine_report || undefined,
        ai_analysis: fullRecord.engine_report?.ai_analysis || undefined,
        intelligence: fullRecord.engine_report?.sources || undefined,
        redirect: fullRecord.engine_report?.redirect || undefined,
        is_qr: fullRecord.scan_type === 'QR',
      };
      setScanResult(mapped);
      setActivePage('results');
    } catch (err) {
      alert('Failed to fetch full record: ' + err.message);
    }
  };

  const handleInspectScamItem = (item) => {
    setSelectedRecord(item);
  };

  const getTierBadge = (tier, score) => {
    const t = (tier || 'LOW').toUpperCase();
    if (t === 'CRITICAL' || t === 'HIGH' || t === 'PHISHING' || t === 'MALICIOUS') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold font-mono uppercase bg-red-50 text-[#DC2626] border border-red-200">
          <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
          <span>Blocked ({score})</span>
        </span>
      );
    }
    if (t === 'UNVERIFIED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold font-mono uppercase bg-slate-100 text-[#475569] border border-slate-300">
          <span className="w-1.5 h-1.5 rounded-full bg-[#64748B]" />
          <span>Unverified ({score})</span>
        </span>
      );
    }
    if (t === 'MODERATE' || t === 'SUSPICIOUS') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold font-mono uppercase bg-amber-50 text-[#F59E0B] border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
          <span>Flagged ({score})</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold font-mono uppercase bg-emerald-50 text-[#16A34A] border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
        <span>Safe ({score})</span>
      </span>
    );
  };

  const getChannelIcon = (type) => {
    switch (type) {
      case 'MESSAGE': return <MessageSquare className="w-3.5 h-3.5 text-[#2563EB]" />;
      case 'JOB': return <Briefcase className="w-3.5 h-3.5 text-[#2563EB]" />;
      case 'INVESTMENT': return <TrendingUp className="w-3.5 h-3.5 text-[#2563EB]" />;
      case 'EMAIL': return <Mail className="w-3.5 h-3.5 text-[#2563EB]" />;
      case 'DNA': return <Dna className="w-3.5 h-3.5 text-[#2563EB]" />;
      default: return <HistoryIcon className="w-3.5 h-3.5 text-[#64748B]" />;
    }
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 select-none font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DBEAFE] border border-[#BFDBFE] text-[#2563EB] text-xs font-semibold uppercase tracking-wider mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
            <span>Audit Trail & Telemetry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight">
            Recent Activity
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Real-time log of inspected payloads across your organization.
          </p>
        </div>

        {/* Tab Selector — Pill Design */}
        <div className="flex rounded-full bg-[#F5F9FF] border border-[#E2E8F0] p-1 text-xs font-mono">
          <button
            onClick={() => { setActiveTab('MULTI_CHANNEL'); setCurrentPage(1); }}
            className={`px-4 py-1.5 rounded-full transition-all cursor-pointer font-medium ${
              activeTab === 'MULTI_CHANNEL' ? 'bg-[#2563EB] text-white font-semibold shadow-sm' : 'text-[#64748B] hover:text-[#111827]'
            }`}
          >
            Multi-Channel Scans
          </button>
          <button
            onClick={() => { setActiveTab('URL_SCANS'); setCurrentPage(1); }}
            className={`px-4 py-1.5 rounded-full transition-all cursor-pointer font-medium ${
              activeTab === 'URL_SCANS' ? 'bg-[#2563EB] text-white font-semibold shadow-sm' : 'text-[#64748B] hover:text-[#111827]'
            }`}
          >
            URL Scans
          </button>
        </div>
      </div>

      {/* Detail Modal for Selected Multi-Channel Item */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div className="flex items-center gap-2">
                {getChannelIcon(selectedRecord.analysis_type)}
                <span className="text-sm font-bold text-[#111827] uppercase font-mono">
                  {selectedRecord.analysis_type} Forensic Record #{selectedRecord.id}
                </span>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1 rounded-full hover:bg-[#F5F9FF] text-[#64748B] hover:text-[#111827] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <ScamResultCard
              result={selectedRecord}
              originalContent={selectedRecord.content_snippet}
              analysisType={selectedRecord.analysis_type}
            />
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm text-xs font-mono">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search content snippet, domain or threat..."
            className="w-full pl-10 pr-4 py-2 rounded-full bg-[#F5F9FF] border border-[#E2E8F0] text-[#111827] placeholder-[#94A3B8] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all"
          />
        </form>

        <div className="flex items-center gap-2">
          <select
            value={filterClass}
            onChange={(e) => { setFilterClass(e.target.value); setCurrentPage(1); }}
            className="px-4 py-2 rounded-full bg-[#F5F9FF] border border-[#E2E8F0] text-[#111827] outline-none cursor-pointer focus:border-[#2563EB] transition-colors"
          >
            <option value="ALL">All Categories</option>
            {activeTab === 'MULTI_CHANNEL' ? (
              <>
                <option value="INVESTMENT">Crypto & Financial</option>
              </>
            ) : (
              <>
                <option value="PHISHING">Phishing Only</option>
                <option value="UNVERIFIED">Unverified Only</option>
                <option value="SUSPICIOUS">Suspicious Only</option>
                <option value="SAFE">Safe Only</option>
              </>
            )}
          </select>

          <button
            onClick={handleClearAll}
            className="p-2 rounded-full bg-[#F5F9FF] hover:bg-red-50 border border-[#E2E8F0] hover:border-red-200 text-[#64748B] hover:text-[#DC2626] transition-colors cursor-pointer"
            title="Purge View Records"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table Records */}
      <div className="rounded-2xl bg-white border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {activeTab === 'MULTI_CHANNEL' ? (
            scamItems.length > 0 ? (
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="text-[#64748B] border-b border-[#E2E8F0] bg-[#F5F9FF] text-[11px] uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Channel</th>
                    <th className="py-3 px-4">Payload & Vector</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Verdict</th>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {scamItems.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => handleInspectScamItem(item)}
                      className="hover:bg-[#F5F9FF]/60 transition cursor-pointer group"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 font-bold text-[#111827]">
                          <span className="w-6 h-6 rounded-full bg-[#DBEAFE] border border-[#BFDBFE] flex items-center justify-center">
                            {getChannelIcon(item.analysis_type)}
                          </span>
                          <span>{item.analysis_type}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs truncate text-[#111827] group-hover:text-[#2563EB] transition font-medium">
                        {item.content_snippet}
                      </td>
                      <td className="py-3.5 px-4 text-[#64748B]">
                        {item.scam_category}
                      </td>
                      <td className="py-3.5 px-4">
                        {getTierBadge(item.risk_tier, Math.round(item.risk_score))}
                      </td>
                      <td className="py-3.5 px-4 text-[#64748B] text-[11px]">
                        {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleInspectScamItem(item)}
                            className="px-3 py-1 rounded-full bg-[#F5F9FF] hover:bg-[#DBEAFE] border border-[#E2E8F0] hover:border-[#BFDBFE] text-[#2563EB] hover:text-[#1E40AF] text-[11px] font-medium transition-colors cursor-pointer"
                          >
                            Inspect
                          </button>
                          <button
                            onClick={(e) => handleDeleteItem(item.id, e)}
                            className="p-1 text-[#64748B] hover:text-[#DC2626] transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-14 text-center text-xs text-[#64748B] font-mono">
                No multi-channel scam analyses found. Submit text via Message, Investment, or Email scanners.
              </div>
            )
          ) : (
            historyItems.length > 0 ? (
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="text-[#64748B] border-b border-[#E2E8F0] bg-[#F5F9FF] text-[11px] uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">URL Destination</th>
                    <th className="py-3 px-4">Domain</th>
                    <th className="py-3 px-4">Verdict</th>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {historyItems.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => handleInspectUrlItem(item)}
                      className="hover:bg-[#F5F9FF]/60 transition cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 max-w-xs truncate text-[#111827] group-hover:text-[#2563EB] transition font-medium">
                        {item.url}
                      </td>
                      <td className="py-3.5 px-4 text-[#64748B]">
                        {item.domain}
                      </td>
                      <td className="py-3.5 px-4">
                        {getTierBadge(item.classification, Math.round(item.risk_score))}
                      </td>
                      <td className="py-3.5 px-4 text-[#64748B] text-[11px]">
                        {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleInspectUrlItem(item)}
                            className="px-3 py-1 rounded-full bg-[#F5F9FF] hover:bg-[#DBEAFE] border border-[#E2E8F0] hover:border-[#BFDBFE] text-[#2563EB] hover:text-[#1E40AF] text-[11px] font-medium transition-colors cursor-pointer"
                          >
                            Dossier
                          </button>
                          <button
                            onClick={(e) => handleDeleteItem(item.id, e)}
                            className="p-1 text-[#64748B] hover:text-[#DC2626] transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-14 text-center text-xs text-[#64748B] font-mono">
                No URL scans found. Submit links via URL Threat Scanner.
              </div>
            )
          )}
        </div>
      </div>

      {/* Pagination & Telemetry Quota Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm text-xs font-mono text-[#64748B]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
          <span>Page {currentPage} of {totalPages} ({total} total audit records logged)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            className="px-3 py-1 rounded-full bg-[#F5F9FF] hover:bg-[#DBEAFE] border border-[#E2E8F0] text-[#111827] hover:text-[#2563EB] disabled:opacity-40 transition-colors cursor-pointer"
          >
            Previous
          </button>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            className="px-3 py-1 rounded-full bg-[#F5F9FF] hover:bg-[#DBEAFE] border border-[#E2E8F0] text-[#111827] hover:text-[#2563EB] disabled:opacity-40 transition-colors cursor-pointer"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
