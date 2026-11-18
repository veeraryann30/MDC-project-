import React, { useState } from 'react';
import { Search, Lock, X, AlertCircle, Link2, ArrowRight } from 'lucide-react';
import ThreatTrace from '../common/ThreatTrace';
import { api } from '../../services/api';

export default function UrlScanner({ onScanComplete, initialUrl = '' }) {
  const [url, setUrl] = useState(initialUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scanStage, setScanStage] = useState(0);

  const sampleUrls = [
    { label: 'Safe Corporate', url: 'https://www.google.com/search?q=cybersecurity+research' },
    { label: 'Brand Lookalike (Paypal)', url: 'http://paypa1-account-verification.xyz/login.php' },
    { label: 'Raw IP + Custom Port', url: 'http://192.168.1.100:8080/secure/bank-login.asp' },
    { label: 'Punycode Homoglyph', url: 'http://xn--gogle-pra.com/signin/v2/identifier' }
  ];

  const handleScan = async (targetUrl = url) => {
    const trimmed = targetUrl.trim();
    if (!trimmed) {
      setError('Please enter or paste a valid URL to analyze.');
      return;
    }

    if (trimmed.length > 2048) {
      setError('URL exceeds maximum safe length of 2048 characters.');
      return;
    }

    setError('');
    setLoading(true);
    setScanStage(1); // URL Received

    const t1 = setTimeout(() => setScanStage(2), 150); // URL Analysis
    const t2 = setTimeout(() => setScanStage(3), 300); // Indicator Checks

    try {
      const result = await api.scanUrl(trimmed);
      clearTimeout(t1);
      clearTimeout(t2);
      setScanStage(4); // Report
      setTimeout(() => {
        setLoading(false);
        setScanStage(0);
        onScanComplete(result);
      }, 250);
    } catch (err) {
      clearTimeout(t1);
      clearTimeout(t2);
      setLoading(false);
      setScanStage(0);
      setError(err.message || 'Failed to analyze URL. Verify that the backend service is running.');
    }
  };

  const handleClear = () => {
    setUrl('');
    setError('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleScan();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto select-none">
      {/* Primary Scanner Box — White card with subtle shadow */}
      <div className="p-5 sm:p-7 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm hover:shadow-[0_10px_30px_rgba(37,99,235,0.06)] transition-all duration-200 scanner-card-container">
        <div className="flex flex-col gap-3.5">
          {/* Header Row */}
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="flex items-center gap-1.5 text-[#111827] font-semibold scanner-header-label">
              <Link2 className="w-4 h-4 text-[#2563EB] scanner-header-icon" />
              <span>Target URL Input</span>
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-[#64748B]">
              <Lock className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Zero-Execution Protocol</span>
            </span>
          </div>

          {/* Input & Action Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1">
              <input
                type="text"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (error) setError('');
                }}
                onKeyDown={handleKeyDown}
                disabled={loading}
                placeholder="Paste suspicious URL here (e.g., http://paypa1-verify.xyz/login)..."
                className="w-full pl-4 pr-10 py-3.5 bg-[#F5F9FF] border border-[#E2E8F0] rounded-xl text-[#111827] placeholder-[#94A3B8] font-mono text-xs sm:text-sm focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#DBEAFE] focus:bg-white transition-all disabled:opacity-60 scanner-input-field"
              />

              {url && !loading && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#64748B] hover:text-[#111827] rounded-full hover:bg-[#E2E8F0] transition-colors"
                  title="Clear input"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Blue Gradient Scan Button */}
            <button
              type="button"
              onClick={() => handleScan()}
              disabled={loading}
              className="px-7 py-3.5 bg-gradient-to-r from-[#2563EB] to-[#1E40AF] hover:from-[#1D4ED8] hover:to-[#1E3A8A] disabled:opacity-50 text-white font-semibold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap shadow-[0_2px_10px_rgba(37,99,235,0.28)] hover:shadow-[0_4px_16px_rgba(37,99,235,0.4)] active:scale-95 scanner-submit-btn"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <span>Scan URL</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.2]" />
                </>
              )}
            </button>
          </div>

          {/* Threat Trace Animation Progress */}
          {loading && (
            <div className="pt-3 border-t border-[#E2E8F0] mt-1">
              <ThreatTrace stage={scanStage} isScanning={loading} />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-1 p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-xs flex items-center gap-2 font-mono">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#DC2626]" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Example URL Badges */}
        <div className="mt-4 pt-3.5 border-t border-[#E2E8F0] flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[#64748B] font-mono text-[11px] mr-1">
            Try test vectors:
          </span>
          {sampleUrls.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setUrl(sample.url);
                handleScan(sample.url);
              }}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg bg-[#F5F9FF] hover:bg-[#DBEAFE] border border-[#E2E8F0] hover:border-[#BFDBFE] text-[#2563EB] transition-colors text-[11px] font-mono cursor-pointer test-vector-badge"
            >
              {sample.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}