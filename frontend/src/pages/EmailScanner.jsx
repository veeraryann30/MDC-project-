import React, { useState } from 'react';
import { Mail, Upload, Send, Sparkles, AlertCircle, RefreshCw, FileText, Paperclip, CheckCircle } from 'lucide-react';
import { api } from '../services/api';
import ScamResultCard from '../components/common/ScamResultCard';

const SAMPLE_EMAILS = [
  {
    label: "PayPal Spoof + Dangerous Attachment",
    text: `From: "PayPal Account Security" <service@paypa1-security-alert.xyz>
Reply-To: refund-desk@attacker-inbox.com
Subject: Critical Security Alert: Account Suspended
Date: Thu, 14 Nov 2026 10:05:00 +0000
Content-Type: multipart/mixed; boundary="BOUNDARY"

--BOUNDARY
Content-Type: text/plain

Dear Client,
We detected suspicious activity on your PayPal wallet. Your account has been temporarily restricted.
To unlock your account, verify your identity and install the attached security certificate immediately.

--BOUNDARY
Content-Type: application/octet-stream
Content-Disposition: attachment; filename="security_patch.pdf.exe"

MZ...binary...
--BOUNDARY--`
  },
  {
    label: "Microsoft 365 Password Reset Phish",
    text: `From: "IT Helpdesk" <support@it-support-cloud.top>
Subject: Action Required: Your Office365 Password Expires Today
Date: Thu, 14 Nov 2026 09:30:00 +0000

Dear Employee,
Your Microsoft work password is scheduled to expire in 2 hours.
To keep your current password, log into the authentication portal below immediately:
http://office365-verify.click/login/auth.php`
  },
  {
    label: "Clean Company Meeting Agenda",
    text: `From: "Sarah Miller" <sarah.miller@techcorp.com>
Subject: Team Sprint Planning Agenda - Q4
Date: Thu, 14 Nov 2026 08:45:00 +0000

Hi team,
Here is the agenda for our sprint review on Thursday at 10 AM.
Please review the attached notes and prepare your updates.
Best,
Sarah`
  }
];

export default function EmailScanner({ setActivePage }) {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        setInputText(content);
      }
    };
    reader.readAsText(file);
  };

  const handleScan = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || inputText.trim().length < 10) {
      setError('Please provide raw email content, headers, or upload an .eml file.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await api.scanEmail(inputText.trim());
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
    setFileName('');
    setError('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8 select-none font-sans">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DBEAFE] border border-[#BFDBFE] text-[#2563EB] text-xs font-semibold uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
          <span>Module 5: Email Phishing & Header Inspector</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight">
          Email Threat & Header Forensics
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B] max-w-xl mx-auto leading-relaxed">
          Safely parse raw .eml files and email headers without executing attachments. Detect display name spoofing, SPF/DKIM validation failures, and disguised malware attachments.
        </p>
      </div>

      {!result ? (
        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm space-y-6">
          {/* Preset Buttons */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Simulate Real Phishing Attacks:</span>
            </span>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_EMAILS.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => { setInputText(s.text); setFileName(''); }}
                  className="px-3.5 py-1.5 rounded-full bg-[#F5F9FF] hover:bg-[#DBEAFE] border border-[#E2E8F0] hover:border-[#BFDBFE] text-[#2563EB] hover:text-[#1E40AF] text-xs font-medium transition cursor-pointer"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Upload or Paste Form */}
          <form onSubmit={handleScan} className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-[#F5F9FF] border border-[#E2E8F0]">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-[#2563EB] shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-[#111827]">Upload Raw .EML or .TXT File</div>
                  <div className="text-[11px] text-[#64748B]">Zero-execution safe parsing</div>
                </div>
              </div>

              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white hover:bg-[#F5F9FF] border border-[#E2E8F0] hover:border-[#2563EB] text-[#111827] text-xs font-medium transition shadow-sm">
                <Upload className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>{fileName ? `Uploaded: ${fileName}` : 'Choose .eml file'}</span>
                <input
                  type="file"
                  accept=".eml,.txt,.msg"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                Or Paste Full Email Content / Headers:
              </label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="From: Security Support <support@paypa1.xyz>&#10;Subject: Account Locked&#10;&#10;Click here to verify password..."
                rows={6}
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
                    <span>Parsing Headers...</span>
                  </>
                ) : (
                  <>
                    <span>Inspect Email</span>
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header Analysis Pill Bar */}
          {result.headers && (
            <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm space-y-2 text-xs font-mono">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0] pb-2">
                <span className="text-[#64748B]">From: <strong className="text-[#111827]">{result.headers.from || 'N/A'}</strong></span>
                {result.auth_evidence && (
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    result.auth_evidence.spf_status === 'PASS' ? 'bg-emerald-50 text-[#16A34A] border border-emerald-200' :
                    result.auth_evidence.spf_status === 'FAIL' ? 'bg-red-50 text-[#DC2626] border border-red-200' : 'bg-slate-100 text-[#64748B] border border-slate-200'
                  }`}>
                    SPF: {result.auth_evidence.spf_status}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-[#64748B]">
                <span>Subject: <strong className="text-[#111827]">{result.headers.subject || 'N/A'}</strong></span>
                {result.attachments?.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-[#F59E0B] font-semibold">
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>{result.attachments.length} safe attachment metadata item(s)</span>
                  </span>
                )}
              </div>
            </div>
          )}

          <ScamResultCard
            result={result}
            originalContent={inputText}
            analysisType="EMAIL"
            onScanAnother={handleReset}
          />
        </div>
      )}
    </div>
  );
}
