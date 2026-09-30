import React, { useState } from 'react';
import { 
  Search, ShieldAlert, Sparkles, Loader2, AlertCircle, 
  ArrowRight, X, Shield, Lock, Terminal, Link2 
} from 'lucide-react';
import { api } from '../../services/api';

export default function UrlScanner({ onScanComplete, initialUrl = '' }) {
  const [url, setUrl] = useState(initialUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scanStep, setScanStep] = useState('');

  const sampleUrls = [
    {
      label: 'Safe Corporate Site',
      url: 'https://www.google.com/search?q=cybersecurity+research',
      dotColor: 'bg-emerald-400'
    },
    {
      label: 'Brand Lookalike (Paypal)',
      url: 'http://paypa1-account-verification.xyz/login.php',
      dotColor: 'bg-amber-400'
    },
    {
      label: 'Raw IP + Custom Port',
      url: 'http://192.168.1.100:8080/secure/bank-login.asp',
      dotColor: 'bg-rose-500'
    },
    {
      label: 'Punycode Homoglyph',
      url: 'http://xn--gogle-pra.com/signin/v2/identifier',
      dotColor: 'bg-purple-400'
    }
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

    try {
      setScanStep('1/4 Parsing URL structure & lexical tokens...');
      await new Promise(r => setTimeout(r, 200));
      setScanStep('2/4 Extracting 34 structural, entropy & security features...');
      await new Promise(r => setTimeout(r, 220));
      setScanStep('3/4 Running Random Forest ML inference...');
      await new Promise(r => setTimeout(r, 220));
      setScanStep('4/4 Evaluating heuristic security rules...');

      const result = await api.scanUrl(trimmed);
      onScanComplete(result);
    } catch (err) {
      setError(err.message || 'Failed to analyze URL. Verify that the backend service is running.');
    } finally {
      setLoading(false);
      setScanStep('');
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
    <div className="w-full max-w-4xl mx-auto">
      {/* Primary Scanner Box */}
      <div className="p-4 sm:p-6 rounded-2xl bg-[#090C13] border border-orange-500/40 shadow-xl relative overflow-hidden">
        {/* Subtle top indicator bar */}
        <div className={`absolute top-0 left-0 right-0 h-1 transition-all ${
          loading ? 'bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500 animate-pulse' : 'bg-orange-500/30'
        }`} />

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1.5 text-orange-400 font-semibold">
              <Link2 className="w-3.5 h-3.5 text-orange-400" />
              <span>Target URL Input</span>
            </span>
            <span className="flex items-center gap-1 text-[11px] text-slate-400">
              <Lock className="w-3.5 h-3.5 text-orange-400" />
              <span>Zero-Execution Static Sandbox</span>
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
                className="w-full pl-4 pr-10 py-3 bg-[#06080E] border border-[#1C2230] rounded-xl text-white placeholder-slate-500 font-mono text-xs sm:text-sm focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]/40 transition-all disabled:opacity-60"
              />

              {url && !loading && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors"
                  title="Clear input"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {url && !loading && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="hidden sm:flex px-3.5 py-3 rounded-xl bg-[#06080E] border border-[#1C2230] hover:border-slate-600 text-slate-400 hover:text-white text-xs font-semibold uppercase tracking-wider transition-all"
                >
                  Clear
                </button>
              )}

              <button
                type="button"
                onClick={() => handleScan()}
                disabled={loading}
                className="w-full sm:w-auto px-7 py-3 bg-[#FF6B00] hover:bg-[#FFA043] disabled:opacity-50 text-black font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,107,0,0.35)] transition-all cursor-pointer whitespace-nowrap"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 stroke-[3]" />
                    <span>Scan URL</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Loading Progress Feedback */}
          {loading && (
            <div className="mt-2 p-2.5 rounded-xl bg-black/60 border border-orange-500/40 flex items-center justify-between text-xs font-mono text-orange-400">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping" />
                <span>{scanStep}</span>
              </span>
              <span className="text-slate-400 text-[10px]">SAFE PARSING</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-1 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Example URL Badges */}
        <div className="mt-4 pt-4 border-t border-[#1C2230]/70 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-mono text-[11px] mr-1">
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
              className="px-3 py-1 rounded-full bg-[#06080E] hover:bg-slate-800 border border-[#1C2230] text-slate-300 hover:text-white transition-all text-[11px] font-mono flex items-center gap-1.5 cursor-pointer"
            >
              <span className={`w-2 h-2 rounded-full ${sample.dotColor}`} />
              <span>{sample.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
