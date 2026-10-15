import React, { useState, useEffect } from 'react';
import { 
  History as HistoryIcon, Search, Trash2, Filter, Eye, AlertCircle, 
  ShieldCheck, AlertTriangle, ShieldAlert, RefreshCw, X, ArrowUpDown, 
  ChevronLeft, ChevronRight, CheckCircle2, XCircle, ArrowRight 
} from 'lucide-react';
import { api } from '../services/api';

export default function History({ setActivePage, setScanResult }) {
  const [historyItems, setHistoryItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [sortField, setSortField] = useState('date'); // 'date' | 'score'
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' | 'desc'
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const offset = (currentPage - 1) * pageSize;
      const data = await api.getHistory(search, filterClass, pageSize, offset);
      setHistoryItems(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [filterClass, currentPage]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchHistory();
  };

  const handleSortToggle = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleDeleteItem = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this audit entry?')) return;
    try {
      await api.deleteHistoryItem(id);
      setHistoryItems(prev => prev.filter(i => i.id !== id));
      setTotal(prev => Math.max(0, prev - 1));
    } catch (err) {
      alert('Failed to delete item: ' + err.message);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to purge all scan history? This action cannot be undone.')) return;
    setDeleteLoading(true);
    try {
      await api.clearAllHistory();
      setHistoryItems([]);
      setTotal(0);
    } catch (err) {
      alert('Failed to clear history: ' + err.message);
    } finally {
      setDeleteLoading(false);
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
      alert('Failed to fetch full record: ' + err.message);
    }
  };

  const getStatusBadge = (classification) => {
    const norm = (classification || 'SAFE').toUpperCase();
    if (norm === 'PHISHING' || norm === 'DANGEROUS') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono uppercase bg-rose-950/80 text-rose-300 border border-rose-800">
          <XCircle className="w-3 h-3 text-rose-400" />
          <span>PHISHING</span>
        </span>
      );
    }
    if (norm === 'SUSPICIOUS') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono uppercase bg-amber-950/80 text-amber-300 border border-amber-800">
          <AlertTriangle className="w-3 h-3 text-amber-400" />
          <span>SUSPICIOUS</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono uppercase bg-emerald-950/80 text-emerald-300 border border-emerald-800">
        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
        <span>SAFE</span>
      </span>
    );
  };

  // Client-side sorting for current page items
  const sortedItems = [...historyItems].sort((a, b) => {
    if (sortField === 'score') {
      return sortDirection === 'desc' ? b.risk_score - a.risk_score : a.risk_score - b.risk_score;
    }
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return sortDirection === 'desc' ? dateB - dateA : dateA - dateB;
  });

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 scroll-reveal">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/60 border border-orange-500/40 text-orange-400 text-xs font-mono mb-2">
            <HistoryIcon className="w-3.5 h-3.5" />
            <span>Persistent Audit Trail</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
            Scan History
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Search, filter, and inspect previously analyzed URLs stored in the SQLite database.
          </p>
        </div>

        {total > 0 && (
          <button
            onClick={handleClearAll}
            disabled={deleteLoading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-950/40 border border-rose-800/80 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All History</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#090C13] border border-[#1C2230] flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm scroll-reveal">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by URL or domain..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-[#06080E] border border-[#1C2230] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-all font-mono"
          />
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(''); fetchHistory(); }}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>

        {/* Classification Filters & Sort */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-slate-400 font-mono mr-1">Status:</span>
          {[
            { label: 'ALL', val: '' },
            { label: 'SAFE', val: 'SAFE' },
            { label: 'SUSPICIOUS', val: 'SUSPICIOUS' },
            { label: 'PHISHING', val: 'PHISHING' }
          ].map((cat) => (
            <button
              key={cat.val}
              onClick={() => {
                setFilterClass(cat.val);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                filterClass === cat.val
                  ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40 font-bold'
                  : 'bg-[#06080E] text-slate-400 hover:text-white border border-[#1C2230]'
              }`}
            >
              {cat.label}
            </button>
          ))}

          {/* Sort Toggle */}
          <button
            onClick={() => handleSortToggle('score')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
              sortField === 'score'
                ? 'bg-orange-950/60 text-orange-300 border-orange-500/50'
                : 'bg-[#06080E] text-slate-400 border border-[#1C2230] hover:text-white'
            }`}
            title="Sort by risk score"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Score {sortField === 'score' ? (sortDirection === 'desc' ? '↓' : '↑') : ''}</span>
          </button>

          <button
            onClick={fetchHistory}
            className="p-2 rounded-lg bg-[#06080E] border border-[#1C2230] text-slate-400 hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* History Table */}
      <div className="rounded-2xl bg-[#090C13] border border-[#1C2230] overflow-hidden shadow-sm scroll-reveal">
        {loading ? (
          <div className="py-16 text-center text-xs font-mono text-orange-400">
            Querying audit records from SQLite database...
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
            <div className="text-sm font-semibold text-slate-300">No scan records found</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Scan a URL using the scanner to record your first audit log entry.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#06080E] border-b border-[#1C2230] text-slate-400 font-mono uppercase text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Target URL</th>
                  <th className="py-3.5 px-4 cursor-pointer select-none" onClick={() => handleSortToggle('score')}>
                    <span className="flex items-center gap-1">
                      Risk Score
                      <ArrowUpDown className="w-3 h-3" />
                    </span>
                  </th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 cursor-pointer select-none" onClick={() => handleSortToggle('date')}>
                    <span className="flex items-center gap-1">
                      Date
                      <ArrowUpDown className="w-3 h-3" />
                    </span>
                  </th>
                  <th className="py-3.5 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1C2230]/60 font-mono">
                {sortedItems.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => handleViewDetail(item)}
                    className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 max-w-xs sm:max-w-md">
                      <div className="text-white font-semibold truncate group-hover:text-orange-400 transition-colors">
                        {item.domain}
                      </div>
                      <div className="text-slate-400 text-[11px] truncate max-w-sm">
                        {item.url}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`font-bold ${
                        item.risk_score >= 61 ? 'text-rose-400' : item.risk_score >= 31 ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {Math.round(item.risk_score)}/100
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(item.classification)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {new Date(item.created_at).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleViewDetail(item)}
                          className="px-2.5 py-1 rounded-lg bg-[#06080E] border border-[#1C2230] hover:border-orange-500/50 text-slate-300 hover:text-white transition-colors"
                        >
                          View Report
                        </button>
                        <button
                          onClick={(e) => handleDeleteItem(item.id, e)}
                          className="p-1.5 rounded-lg hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {total > pageSize && (
          <div className="p-4 bg-[#06080E] border-t border-[#1C2230] flex items-center justify-between text-xs font-mono text-slate-400">
            <div>
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, total)} of {total} records
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg bg-[#090C13] border border-[#1C2230] disabled:opacity-40 hover:text-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span>Page {currentPage} of {totalPages}</span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg bg-[#090C13] border border-[#1C2230] disabled:opacity-40 hover:text-white"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
