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
      {/* Primary Scanner Box */}
      <div className="p-4 sm:p-5 rounded-[16px] bg-[#151517] border border-[#29292D] shadow-lg">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs text-[#92929A] font-mono">
            <span className="flex items-center gap-1.5 text-[#F5F5F5] font-semibold">
              <Link2 className="w-3.5 h-3.5 text-[#FF6B35]" />
              <span>Target URL Input</span>
            </span>
            <span className="flex items-center gap-1 text-[11px] text-[#686870]">
              <Lock className="w-3.5 h-3.5 text-[#35C98A]" />
              <span>Zero-Execution Static Sandbox</span>
            </span>
          </div>

          {/* Input & Action Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
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
                className="w-full pl-3 pr-9 py-2.5 bg-[#101012] border border-[#29292D] rounded-[10px] text-[#F5F5F5] placeholder-[#686870] font-mono text-xs sm:text-sm focus:outline-none focus:border-[#FF6B35] transition-all disabled:opacity-60"
              />

              {url && !loading && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#686870] hover:text-[#F5F5F5] rounded-[6px] hover:bg-[#1B1B1F] transition-colors"
                  title="Clear input"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => handleScan()}
              disabled={loading}
              className="px-6 py-2.5 bg-[#FF6B35] hover:bg-[#ff7b49] disabled:opacity-50 text-white font-semibold text-xs sm:text-sm rounded-[10px] flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap shadow-sm"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
            <div className="pt-2 border-t border-[#29292D] mt-1">
              <ThreatTrace stage={scanStage} isScanning={loading} />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-1 p-3 rounded-[10px] bg-[#241315] border border-[#FF5C5C]/40 text-[#FF5C5C] text-xs flex items-center gap-2 font-mono">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Example URL Badges */}
        <div className="mt-4 pt-3 border-t border-[#29292D] flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[#686870] font-mono text-[11px] mr-1">
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
              className="px-2.5 py-1 rounded-[8px] bg-[#101012] hover:bg-[#1B1B1F] border border-[#29292D] text-[#92929A] hover:text-[#F5F5F5] transition-colors text-[11px] font-mono cursor-pointer"
            >
              {sample.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
