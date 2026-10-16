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
    if (!window.confirm('Delete this audit entry from SQLite records?')) return;
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
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold font-mono uppercase bg-[#241315] text-[#FF5C5C] border border-[#FF5C5C]/30">
          <XCircle className="w-3 h-3 text-[#FF5C5C]" />
          <span>PHISHING</span>
        </span>
      );
    }
    if (norm === 'SUSPICIOUS') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold font-mono uppercase bg-[#221B10] text-[#F2B84B] border border-[#F2B84B]/30">
          <AlertTriangle className="w-3 h-3 text-[#F2B84B]" />
          <span>SUSPICIOUS</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold font-mono uppercase bg-[#101F18] text-[#35C98A] border border-[#35C98A]/30">
        <CheckCircle2 className="w-3 h-3 text-[#35C98A]" />
        <span>SAFE</span>
      </span>
    );
  };

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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-[#151517] border border-[#29292D] text-[#92929A] text-xs font-mono uppercase tracking-wider mb-2">
            <HistoryIcon className="w-3.5 h-3.5 text-[#FF6B35]" />
            <span>Persistent Audit Trail</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F5F5] tracking-tight">
            Scan History
          </h1>
          <p className="text-xs text-[#92929A] mt-1">
            Search, filter, and inspect previously analyzed URLs stored in the SQLite database.
          </p>
        </div>

        {total > 0 && (
          <button
            onClick={handleClearAll}
            disabled={deleteLoading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-[10px] bg-[#151517] border border-[#29292D] hover:border-[#FF5C5C]/50 text-[#92929A] hover:text-[#FF5C5C] text-xs font-mono transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 sm:p-4 rounded-[14px] bg-[#151517] border border-[#29292D] flex flex-col md:flex-row items-center justify-between gap-3 shadow-sm">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#686870] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by URL or domain..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-[#101012] border border-[#29292D] rounded-[10px] text-xs text-[#F5F5F5] placeholder-[#686870] focus:outline-none focus:border-[#FF6B35] transition-all font-mono"
          />
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(''); fetchHistory(); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#686870] hover:text-[#F5F5F5]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>

        {/* Classification Filters & Sort */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-[#686870] font-mono mr-1">Status:</span>
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
              className={`px-2.5 py-1 rounded-[8px] text-xs font-mono transition-colors cursor-pointer ${
                filterClass === cat.val
                  ? 'bg-[#101012] text-[#F5F5F5] border border-[#FF6B35] font-semibold'
                  : 'bg-[#101012] text-[#92929A] hover:text-[#F5F5F5] border border-[#29292D]'
              }`}
            >
              {cat.label}
            </button>
          ))}

          {/* Sort Toggle */}
          <button
            onClick={() => handleSortToggle('score')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-[8px] text-xs font-mono border transition-colors cursor-pointer ${
              sortField === 'score'
                ? 'bg-[#101012] text-[#FF6B35] border-[#FF6B35]'
                : 'bg-[#101012] text-[#92929A] border-[#29292D] hover:text-[#F5F5F5]'
            }`}
            title="Sort by risk score"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Score {sortField === 'score' ? (sortDirection === 'desc' ? '↓' : '↑') : ''}</span>
          </button>

          <button
            onClick={fetchHistory}
            className="p-1.5 rounded-[8px] bg-[#101012] border border-[#29292D] text-[#92929A] hover:text-[#F5F5F5] transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#FF6B35]' : ''}`} />
          </button>
        </div>
      </div>

      {/* History Table */}
      <div className="rounded-[16px] bg-[#151517] border border-[#29292D] overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-xs font-mono text-[#92929A]">
            Querying audit records from SQLite database...
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <AlertCircle className="w-7 h-7 text-[#686870] mx-auto" />
            <div className="text-sm font-semibold text-[#F5F5F5]">No scan records found</div>
            <p className="text-xs text-[#92929A] max-w-sm mx-auto">
              {search || filterClass ? 'Try clearing your filters or search terms.' : 'Submit any link in the URL scanner to generate audit records.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="text-[#686870] border-b border-[#29292D] text-[10px] uppercase">
                  <th className="py-3 px-4">URL / Hostname</th>
                  <th className="py-3 px-4 cursor-pointer select-none" onClick={() => handleSortToggle('score')}>
                    <span className="flex items-center gap-1">
                      Risk Score
                      <ArrowUpDown className="w-3 h-3" />
                    </span>
                  </th>
                  <th className="py-3 px-4">Verdict</th>
                  <th className="py-3 px-4 cursor-pointer select-none" onClick={() => handleSortToggle('date')}>
                    <span className="flex items-center gap-1">
                      Date
                      <ArrowUpDown className="w-3 h-3" />
                    </span>
                  </th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#29292D]/60 font-mono">
                {sortedItems.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => handleViewDetail(item)}
                    className="hover:bg-[#1B1B1F] transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 max-w-xs sm:max-w-md">
                      <div className="text-[#F5F5F5] font-semibold truncate group-hover:text-[#FF6B35] transition-colors">
                        {item.domain}
                      </div>
                      <div className="text-[#686870] text-[11px] truncate max-w-sm">
                        {item.url}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`font-bold ${
                        item.risk_score >= 61 ? 'text-[#FF5C5C]' : item.risk_score >= 31 ? 'text-[#F2B84B]' : 'text-[#35C98A]'
                      }`}>
                        {Math.round(item.risk_score)}/100
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(item.classification)}
                    </td>
                    <td className="py-3.5 px-4 text-[#92929A] text-[11px]">
                      {new Date(item.created_at).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleViewDetail(item)}
                          className="px-2.5 py-1 rounded-[6px] bg-[#101012] border border-[#29292D] hover:border-[#38383E] text-[#92929A] hover:text-[#F5F5F5] transition-colors"
                        >
                          Inspect
                        </button>
                        <button
                          onClick={(e) => handleDeleteItem(item.id, e)}
                          className="p-1.5 rounded-[6px] hover:bg-[#241315] text-[#686870] hover:text-[#FF5C5C] transition-colors"
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
          <div className="p-3.5 bg-[#101012] border-t border-[#29292D] flex items-center justify-between text-xs font-mono text-[#92929A]">
            <div>
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, total)} of {total} records
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded-[6px] bg-[#151517] border border-[#29292D] disabled:opacity-40 hover:text-[#F5F5F5] cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span>Page {currentPage} of {totalPages}</span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-1 rounded-[6px] bg-[#151517] border border-[#29292D] disabled:opacity-40 hover:text-[#F5F5F5] cursor-pointer"
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
