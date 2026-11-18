import React, { useState } from 'react';
import { Briefcase, Send, Sparkles, AlertCircle, RefreshCw, Building } from 'lucide-react';
import { api } from '../services/api';
import ScamResultCard from '../components/common/ScamResultCard';

const SAMPLE_JOBS = [
  {
    label: "Amazon WFH with Registration Fee",
    company: "Amazon",
    salary: "₹45,000/month",
    text: "Direct selection for Work From Home Data Entry Specialist at Amazon. Guaranteed salary ₹45,000 per month. No technical interview required. Direct appointment letter. Submit registration fee of ₹1,500 to HR at amazon.careers.hr@gmail.com to confirm your position."
  },
  {
    label: "Fake Internship via Telegram",
    company: "TechNova Global",
    salary: "₹30,000/month",
    text: "Congratulations! You have been selected for a high-paying internship. Contact HR manager via Telegram @TechNova_Recruitment. Mandatory training fee of ₹2,000 required for onboarding equipment."
  },
  {
    label: "Clean Software Engineer Posting",
    company: "Stripe",
    salary: "Competitive",
    text: "Software Engineer - Backend Infrastructure. Requirements: 3+ years experience with Python, distributed systems, and SQL. Apply directly on our verified careers portal at stripe.com/jobs. We never charge candidate fees."
  }
];

export default function JobScanner({ setActivePage }) {
  const [inputText, setInputText] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [claimedSalary, setClaimedSalary] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleScan = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || inputText.trim().length < 5) {
      setError('Please provide at least 5 characters of the job description or offer.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await api.scanJob(inputText.trim(), companyName.trim(), claimedSalary.trim());
      setResult(data);
    } catch (err) {
      setError(err.message || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadPreset = (preset) => {
    setInputText(preset.text);
    setCompanyName(preset.company);
    setClaimedSalary(preset.salary);
  };

  const handleReset = () => {
    setResult(null);
    setInputText('');
    setCompanyName('');
    setClaimedSalary('');
    setError('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8 select-none font-sans">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#121214] border border-[#2c2c2e] text-[#86868b] text-xs font-mono uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-white" />
          <span>Module 3: Fake Job & Internship Scam Detector</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#f5f5f7] tracking-tight">
          Recruitment & Internship Verifier
        </h1>
        <p className="text-xs sm:text-sm text-[#86868b] max-w-xl mx-auto leading-relaxed">
          Verify employment offers and student internship advertisements against advance training fees, fake company impersonation, and unrealistic guaranteed selection.
        </p>
      </div>

      {!result ? (
        <div className="p-6 rounded-xl bg-[#121214] border border-[#2c2c2e] space-y-6">
          {/* Preset Buttons */}
          <div className="space-y-2">
            <span className="text-[11px] font-mono text-[#86868b] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span>Test Real Employment Vectors:</span>
            </span>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_JOBS.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => loadPreset(s)}
                  className="px-3 py-1 rounded-full bg-[#1a1a1e] hover:bg-[#2c2c2e] border border-[#2c2c2e] text-[#86868b] hover:text-[#f5f5f7] text-xs font-mono transition cursor-pointer"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleScan} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#86868b] uppercase tracking-wider">
                  Employer / Company Name (Optional):
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Amazon, Google, Startup Ltd."
                  className="w-full p-3 rounded-full bg-[#0a0a0c] border border-[#2c2c2e] focus:border-white text-[#f5f5f7] text-xs sm:text-sm font-mono placeholder:text-[#86868b] outline-none transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#86868b] uppercase tracking-wider">
                  Claimed Salary / Stipend (Optional):
                </label>
                <input
                  type="text"
                  value={claimedSalary}
                  onChange={(e) => setClaimedSalary(e.target.value)}
                  placeholder="e.g. ₹50,000/month, $10,000"
                  className="w-full p-3 rounded-full bg-[#0a0a0c] border border-[#2c2c2e] focus:border-white text-[#f5f5f7] text-xs sm:text-sm font-mono placeholder:text-[#86868b] outline-none transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-[#86868b] uppercase tracking-wider">
                Paste Job Description, Email, or Offer Message:
              </label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="e.g. Congratulations! You are selected for a WFH Data Entry role. Pay registration fee of ₹1,500..."
                rows={5}
                className="w-full p-4 rounded-xl bg-[#0a0a0c] border border-[#2c2c2e] focus:border-white text-[#f5f5f7] text-xs sm:text-sm font-mono placeholder:text-[#86868b] outline-none transition resize-none"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[#1a1a1e] border border-[#ff453a]/30 text-[#ff453a] text-xs font-mono">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading || !inputText.trim()}
                className="inline-flex items-center gap-2 px-7 py-2.5 rounded-full bg-white hover:bg-[#e2e2e2] text-black font-semibold text-xs sm:text-sm transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-black" />
                    <span>Evaluating Recruitment Indicators...</span>
                  </>
                ) : (
                  <>
                    <span>Verify Opportunity</span>
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
          analysisType="JOB"
          onScanAnother={handleReset}
        />
      )}
    </div>
  );
}
