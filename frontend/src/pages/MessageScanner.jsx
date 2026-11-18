import React, { useState } from 'react';
import { MessageSquare, Send, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import ScamResultCard from '../components/common/ScamResultCard';

const SAMPLE_MESSAGES = [
  {
    label: "SBI KYC Block Threat",
    text: "Dear SBI customer, your NetBanking account will be blocked today within 24 hours. Update your KYC immediately at http://sbi-kyc-verify.top to avoid permanent suspension. Never share your OTP with anyone."
  },
  {
    label: "KBC Lottery Winner ₹25L",
    text: "Congratulations! You have won ₹25,00,000 in KBC Lottery Lucky Draw. Contact official WhatsApp manager +91-9876543210. Pay registration fee of ₹2,500 to process your prize money."
  },
  {
    label: "UPI Refund Scam",
    text: "Your refund of ₹3,499 from Paytm is approved. Scan this QR code and enter your UPI PIN to receive the credit into your bank account immediately."
  },
  {
    label: "Clean Message",
    text: "Hey, are we still meeting tomorrow at 4 PM for the project review? Let me know if the library works for you."
  }
];

export default function MessageScanner({ setActivePage }) {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleScan = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || inputText.trim().length < 5) {
      setError('Please enter at least 5 characters to analyze.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await api.scanMessage(inputText.trim());
      setResult(data);
    } catch (err) {
      setError(err.message || 'Analysis failed. Please check network connection.');
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 select-none font-sans">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#DBEAFE] text-[#2563EB] text-xs font-mono uppercase tracking-wider font-semibold shadow-2xs">
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Module 2: AI Message Scam Detector</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-bold text-[#111827] tracking-tight">
          SMS & Message Threat Scanner
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B] max-w-xl mx-auto leading-relaxed">
          Analyze suspicious SMS, WhatsApp, and chat messages for financial coercion, fake lottery prizes, KYC suspension threats, and OTP interception.
        </p>
      </div>

      {!result ? (
        <div className="p-6 sm:p-7 rounded-2xl bg-white border border-[#E2E8F0] space-y-6 shadow-sm">
          {/* Preset Buttons */}
          <div className="space-y-2">
            <span className="text-[11px] font-mono text-[#64748B] uppercase tracking-wider flex items-center gap-1.5 font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Try Real Attack Presets:</span>
            </span>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_MESSAGES.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => setInputText(s.text)}
                  className="px-3 py-1.5 rounded-lg bg-[#F5F9FF] hover:bg-[#DBEAFE] border border-[#E2E8F0] text-[#2563EB] hover:text-[#1E40AF] text-xs font-mono transition cursor-pointer"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleScan} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-[#64748B] uppercase tracking-wider font-semibold">
                Paste Suspicious Message Text:
              </label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="e.g. URGENT: Your bank account is suspended. Update KYC now at http://... or never share OTP."
                rows={5}
                className="w-full p-4 rounded-xl bg-[#F5F9FF] border border-[#E2E8F0] focus:border-[#2563EB] focus:ring-2 focus:ring-[#DBEAFE] focus:bg-white text-[#111827] text-xs sm:text-sm font-mono placeholder:text-[#94A3B8] outline-none transition resize-none"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-xs font-mono">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#DC2626]" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading || !inputText.trim()}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-[#2563EB] hover:bg-[#1E40AF] text-white font-semibold text-xs sm:text-sm transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Analyzing Indicators...</span>
                  </>
                ) : (
                  <>
                    <span>Scan Message</span>
                    <Send className="w-4 h-4" />
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
          analysisType="MESSAGE"
          onScanAnother={handleReset}
        />
      )}
    </div>
  );
}