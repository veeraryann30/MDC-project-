import React, { useState } from 'react';
import { TrendingUp, Send, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import ScamResultCard from '../components/common/ScamResultCard';

const SAMPLE_INVESTMENTS = [
  {
    label: "200% Guaranteed Return Ponzi",
    text: "Join our automated AI trading pool! Guaranteed 200% profit in 48 hours with zero market risk. Double your crypto immediately. Refer 3 friends to unlock daily passive binary downline commissions."
  },
  {
    label: "Advance Withdrawal Tax Trap",
    text: "Your trading account has accumulated $38,500 in profits! To unfreeze your balance and withdraw to your bank account, you must pay a 10% gas fee and tax clearance deposit of $3,850 upfront."
  },
  {
    label: "Seed Phrase Solicitation",
    text: "TrustWallet Security Notice: To sync your decentralized tokens and claim 500 USDT airdrop, connect your wallet and input your 12-word recovery seed phrase on our secure verification portal."
  },
  {
    label: "Clean Index Fund Commentary",
    text: "Low-cost index funds invest across broad market indexes such as the Nifty 50 or S&P 500. Investments are subject to market volatility. Past returns do not assure future gains."
  }
];

export default function InvestmentScanner({ setActivePage }) {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleScan = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || inputText.trim().length < 5) {
      setError('Please provide at least 5 characters of the financial proposal.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await api.scanInvestment(inputText.trim());
      setResult(data);
    } catch (err) {
      setError(err.message || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setInputText('');
    setError('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8 select-none">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DBEAFE] border border-[#BFDBFE] text-[#2563EB] text-xs font-semibold uppercase tracking-wider">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Module 4: Investment & Financial Scam Detector</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight">
          Financial & Crypto Scam Verifier
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B] max-w-xl mx-auto leading-relaxed">
          Inspect high-yield investment proposals, cryptocurrency schemes, automated trading bots, and Ponzi referral promises against mathematically deceptive claims.
        </p>
      </div>

      {!result ? (
        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm space-y-6">
          {/* Preset Buttons */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Test Financial Scenarios:</span>
            </span>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_INVESTMENTS.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => setInputText(s.text)}
                  className="px-3.5 py-1.5 rounded-full bg-[#F5F9FF] hover:bg-[#DBEAFE] border border-[#E2E8F0] hover:border-[#BFDBFE] text-[#2563EB] hover:text-[#1E40AF] text-xs font-medium transition cursor-pointer"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleScan} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                Paste Investment Pitch, Telegram Message, or Ad Text:
              </label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="e.g. Guaranteed 200% return in 48 hours. Zero risk crypto trading bot..."
                rows={5}
                className="w-full p-4 rounded-xl bg-[#F5F9FF] border border-[#E2E8F0] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 text-[#111827] text-xs sm:text-sm font-mono placeholder:text-[#94A3B8] outline-none transition resize-none"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-[#DC2626] text-xs font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading || !inputText.trim()}
                className="inline-flex items-center gap-2 px-7 py-2.5 rounded-full bg-gradient-to-r from-[#2563EB] to-[#1E40AF] hover:from-[#1E40AF] hover:to-[#1D4ED8] text-white font-semibold text-xs sm:text-sm transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Analyzing Financial Mathematics...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Verify Scheme</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <ScamResultCard
          result={result}
          originalContent={inputText}
          analysisType="INVESTMENT"
          onScanAnother={handleReset}
        />
      )}
    </div>
  );
}
