import React, { useState } from 'react';
import { Dna, Send, Sparkles, AlertCircle, RefreshCw, Layers, ShieldCheck, Activity } from 'lucide-react';
import { api } from '../services/api';
import ScamResultCard from '../components/common/ScamResultCard';

const SAMPLE_DNA_INPUTS = [
  {
    label: "Prompt Benchmark Example",
    text: "Congratulations! You have been selected for a high-paying internship. Pay ₹1,500 for registration to confirm your position within 24 hours."
  },
  {
    label: "Crypto Ponzi & Referral Lure",
    text: "Guaranteed 200% return in 48 hours! 100% risk-free. Deposit 0.05 BTC and invite 3 friends for passive downline binary commissions."
  },
  {
    label: "Bank Account KYC Coercion",
    text: "Immediate action required: Your bank account will be blocked today. Click the link to update your PAN and verify OTP now to avoid suspension."
  },
  {
    label: "Clean Communication",
    text: "Hi Veer, please review the pull request for the database migration when you have a moment. Let me know if any tests need tweaking."
  }
];

export default function ScamDNA({ setActivePage }) {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleScan = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || inputText.trim().length < 5) {
      setError('Please provide at least 5 characters to extract Scam DNA.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await api.scanDNA(inputText.trim());
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8 select-none font-sans">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DBEAFE] border border-[#BFDBFE] text-[#2563EB] text-xs font-semibold uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
          <span>Module 6: Explainable Scam Intelligence</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight">
          SCAM DNA Intelligence Engine
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B] max-w-xl mx-auto leading-relaxed">
          Deconstructs manipulative digital content into psychological manipulation tactics, financial extraction demands, and technical spoofing genes with evidence-backed explanations.
        </p>
      </div>

      {!result ? (
        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm space-y-6">
          {/* Preset Buttons */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Analyze Canonical Benchmark Inputs:</span>
            </span>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_DNA_INPUTS.map((s, idx) => (
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
                Paste Any Suspicious Digital Content:
              </label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="e.g. Congratulations! You have been selected for a high-paying internship. Pay ₹1,500 for registration to confirm your position..."
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
                    <span>Sequencing Scam DNA Dimensions...</span>
                  </>
                ) : (
                  <>
                    <Dna className="w-4 h-4" />
                    <span>Extract Scam DNA</span>
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
          analysisType="SCAM DNA"
          onScanAnother={handleReset}
        />
      )}
    </div>
  );
}
