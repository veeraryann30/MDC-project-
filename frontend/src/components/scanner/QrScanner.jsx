import React, { useState, useRef } from 'react';
import { 
  QrCode, UploadCloud, FileText, CheckCircle2, AlertTriangle, 
  XCircle, Copy, Check, ArrowRight, RefreshCw, Shield, Lock, 
  ExternalLink, File, HelpCircle, AlertOctagon
} from 'lucide-react';
import { api } from '../../services/api';

export default function QrScanner({ onScanComplete }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [copied, setCopied] = useState(false);
  
  const fileInputRef = useRef(null);

  const sampleQrs = [
    { label: 'Phishing Lookalike QR', path: '/samples/qr/sample-phish.png', name: 'sample-phish.png', type: 'image/png' },
    { label: 'Safe Corporate QR', path: '/samples/qr/sample-safe.png', name: 'sample-safe.png', type: 'image/png' },
    { label: 'SSRF Loopback QR', path: '/samples/qr/sample-ssrf.png', name: 'sample-ssrf.png', type: 'image/png' },
    { label: 'Plain Wi-Fi QR', path: '/samples/qr/sample-wifi.png', name: 'sample-wifi.png', type: 'image/png' },
    { label: 'PDF Invoice QR', path: '/samples/qr/sample-invoice.pdf', name: 'sample-invoice.pdf', type: 'application/pdf' },
  ];

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;

    setError('');
    setScanResult(null);

    const validExtensions = ['.png', '.jpg', '.jpeg', '.pdf'];
    const ext = '.' + selectedFile.name.split('.').pop().toLowerCase();
    
    if (!validExtensions.includes(ext)) {
      setError(`Unsupported file type (${ext}). Please upload a PNG, JPG, JPEG image or a PDF document.`);
      return;
    }

    if (selectedFile.size > 15 * 1024 * 1024) {
      setError('File size exceeds the 15 MB safe threshold.');
      return;
    }

    setFile(selectedFile);

    if (selectedFile.type.startsWith('image/')) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleClear = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setScanResult(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleLoadSample = async (sample) => {
    try {
      setError('');
      setScanResult(null);
      const res = await fetch(sample.path);
      const blob = await res.blob();
      const sampleFile = new File([blob], sample.name, { type: sample.type });
      handleFileSelect(sampleFile);
    } catch (err) {
      setError('Failed to load sample QR file: ' + err.message);
    }
  };

  const handleScan = async () => {
    if (!file) {
      setError('Please select or drop a QR code file first.');
      return;
    }

    setLoading(true);
    setError('');
    setScanResult(null);

    try {
      const result = await api.scanQr(file);
      setScanResult(result);
    } catch (err) {
      setError(err.message || 'Failed to analyze QR code file. Please verify file format.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getClassificationBadge = (classification) => {
    switch (classification) {
      case 'Malicious':
        return {
          bg: 'bg-[#FEF2F2] border-[#FECACA] text-[#DC2626]',
          label: 'MALICIOUS DESTINATION',
          icon: AlertOctagon
        };
      case 'Suspicious':
        return {
          bg: 'bg-[#FFFBEB] border-[#FDE68A] text-[#D97706]',
          label: 'SUSPICIOUS LINK',
          icon: AlertTriangle
        };
      case 'Safe':
        return {
          bg: 'bg-[#F0FDF4] border-[#BBF7D0] text-[#16A34A]',
          label: 'VERIFIED SAFE',
          icon: CheckCircle2
        };
      case 'Inconclusive':
      default:
        return {
          bg: 'bg-[#F5F9FF] border-[#E2E8F0] text-[#64748B]',
          label: 'INCONCLUSIVE',
          icon: HelpCircle
        };
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 select-none font-sans">
      {/* Upload Container — White Card with Subtle Border */}
      <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[#E2E8F0] pb-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-[#111827] flex items-center gap-2">
              <QrCode className="w-4 h-4 text-[#2563EB]" />
              <span>QR Code Scam Detector (Quishing Analysis)</span>
            </h2>
            <p className="text-xs text-[#64748B]">
              Decodes embedded links or text vectors and evaluates deception indicators with zero script execution.
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#64748B]">
            <Lock className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Zero-Execution Sandbox</span>
          </div>
        </div>

        {/* Upload Drag-and-Drop Area */}
        {!file ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 ${
              isDragging 
                ? 'border-[#2563EB] bg-[#DBEAFE]/30' 
                : 'border-[#E2E8F0] hover:border-[#2563EB]/40 bg-[#F5F9FF]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.pdf"
              onChange={(e) => handleFileSelect(e.target.files[0])}
              className="hidden"
            />

            <div className="max-w-xs mx-auto space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-white border border-[#DBEAFE] flex items-center justify-center text-[#2563EB] shadow-xs">
                <UploadCloud className="w-6 h-6 stroke-[1.5]" />
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold text-[#111827]">
                  Click to upload or drag and drop QR code
                </p>
                <p className="text-[11px] font-mono text-[#64748B]">
                  Supports PNG, JPG, JPEG, and PDF (Max 15MB)
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* File Preview Card */
          <div className="p-4 rounded-xl bg-[#F5F9FF] border border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-150">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {previewUrl ? (
                <div className="w-14 h-14 rounded-lg border border-[#E2E8F0] overflow-hidden bg-white shrink-0 p-1 flex items-center justify-center">
                  <img src={previewUrl} alt="QR Code Preview" className="max-w-full max-h-full object-contain" />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-lg border border-[#E2E8F0] bg-white shrink-0 flex items-center justify-center text-[#2563EB]">
                  <FileText className="w-7 h-7 stroke-[1.5]" />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="text-xs font-mono font-semibold text-[#111827] truncate max-w-xs sm:max-w-sm">
                  {file.name}
                </div>
                <div className="text-[11px] font-mono text-[#64748B] flex items-center gap-2 mt-0.5">
                  <span>{(file.size / 1024).toFixed(1)} KB</span>
                  <span>·</span>
                  <span className="uppercase">{file.name.split('.').pop()}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleClear}
                disabled={loading}
                className="px-3.5 py-1.5 rounded-full text-xs font-mono text-[#64748B] hover:text-[#111827] hover:bg-[#E2E8F0] transition-colors cursor-pointer"
              >
                Change File
              </button>

              <button
                type="button"
                onClick={handleScan}
                disabled={loading}
                className="px-6 py-2.5 bg-gradient-to-r from-[#2563EB] to-[#1E40AF] hover:from-[#1D4ED8] hover:to-[#1E3A8A] active:scale-95 text-white text-xs font-sans font-semibold tracking-wider rounded-xl transition-all disabled:opacity-50 inline-flex items-center gap-2 cursor-pointer shadow-sm"
              >
                {loading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <span>Analyze QR Code</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* 1-Click Sample Injection Triggers */}
        <div className="pt-2 border-t border-[#E2E8F0] space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-[#64748B]">
            <span>Try sample QR:</span>
            {sampleQrs.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleLoadSample(s)}
                className="px-2.5 py-1 rounded-lg bg-[#F5F9FF] hover:bg-[#DBEAFE] border border-[#E2E8F0] text-[#2563EB] transition-colors cursor-pointer"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs font-mono text-[#DC2626] flex items-center justify-between">
            <span>{error}</span>
            <button 
              onClick={() => setError('')} 
              className="text-xs text-[#DC2626] hover:underline cursor-pointer font-bold"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* DETAILED QR SECURITY REPORT DOSSIER */}
      {scanResult && (
        <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] space-y-6 shadow-sm animate-in fade-in duration-200">
          {/* Header Summary Banner */}
          {(() => {
            const badge = getClassificationBadge(scanResult.risk_classification);
            const BadgeIcon = badge.icon;
            return (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#F5F9FF] border border-[#E2E8F0]">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-[#64748B]">
                    <span>Decoded QR Verdict</span>
                    <span>·</span>
                    <span>{scanResult.file_type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider border inline-flex items-center gap-1.5 ${badge.bg}`}>
                      <BadgeIcon className="w-3.5 h-3.5" />
                      <span>{badge.label}</span>
                    </span>
                    <span className="text-xs text-[#64748B] font-mono">
                      ({scanResult.qr_count} QR Code{scanResult.qr_count !== 1 ? 's' : ''} detected)
                    </span>
                  </div>
                </div>

                {/* Risk Score */}
                <div className="flex items-center gap-3">
                  <div className="text-right font-mono">
                    <div className="text-[10px] uppercase text-[#64748B]">Risk Score</div>
                    <div className="text-xl font-bold text-[#111827]">
                      {Math.round(scanResult.risk_score)} / 100
                    </div>
                  </div>
                  <div className="px-3 py-1.5 rounded-full border border-[#E2E8F0] bg-white text-xs font-mono font-bold uppercase tracking-wider text-[#2563EB]">
                    {scanResult.risk_tier} RISK
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Extracted QR Content Card */}
          <div className="p-4 rounded-xl bg-[#F5F9FF] border border-[#E2E8F0] space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#64748B]">
              <span className="uppercase tracking-wider">
                Extracted Payload {scanResult.is_url ? '(Destination URL)' : '(Plain Text Content)'}
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(scanResult.primary_content)}
                className="text-[#2563EB] hover:text-[#1E40AF] inline-flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-[#16A34A]" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy Payload'}</span>
              </button>
            </div>

            <div className="p-3 rounded-lg bg-white border border-[#E2E8F0] font-mono text-xs text-[#111827] break-all select-text leading-relaxed">
              {scanResult.primary_content}
            </div>

            <div className="text-[10px] font-mono text-[#64748B] flex items-center justify-between pt-1">
              <span>Zero-Execution Protocol: Payload inspected as inert text. Never dispatched to remote web servers.</span>
              {scanResult.is_url && scanResult.extracted_domain && (
                <span className="font-semibold text-[#2563EB]">Domain: {scanResult.extracted_domain}</span>
              )}
            </div>
          </div>

          {/* Why Destination May Be Dangerous */}
          <div className="p-4 rounded-xl bg-[#F5F9FF] border border-[#E2E8F0] space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#64748B] font-semibold">
              Security Analysis & Danger Explanation
            </span>
            <p className="text-xs text-[#111827] leading-relaxed font-sans">
              {scanResult.danger_explanation}
            </p>
          </div>

          {/* Recommended Safety Actions & Detected Threat Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Safety Actions */}
            <div className="p-4 rounded-xl bg-[#F5F9FF] border border-[#E2E8F0] space-y-3">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#64748B] font-semibold">
                Recommended Safety Actions
              </span>
              <ul className="space-y-2 text-xs text-[#64748B]">
                {scanResult.recommended_actions.map((act, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-[#2563EB] font-bold mt-0.5">•</span>
                    <span className="text-[#111827]">{act}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Detected Indicators */}
            <div className="p-4 rounded-xl bg-[#F5F9FF] border border-[#E2E8F0] space-y-3">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#64748B] font-semibold">
                Evaluated Threat Markers ({scanResult.threats_detected.length})
              </span>
              {scanResult.threats_detected.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {scanResult.threats_detected.map((t, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-white border border-[#E2E8F0] text-xs space-y-0.5">
                      <div className="font-semibold text-[#111827] flex items-center justify-between text-[11px]">
                        <span>{t.title || t.id}</span>
                        <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded-md border border-[#FECACA] bg-[#FEF2F2] text-[#DC2626] font-bold">
                          {t.severity || 'EVALUATED'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#64748B] leading-tight">
                        {t.what_was_detected || t.why_it_matters}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-[#16A34A] font-mono py-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>No anomalous deception signatures or threats detected.</span>
                </div>
              )}
            </div>
          </div>

          {/* Deep Dive Action (if URL extracted) */}
          {scanResult.is_url && onScanComplete && (
            <div className="pt-2 border-t border-[#E2E8F0] flex justify-end">
              <button
                type="button"
                onClick={() => onScanComplete({
                  url: scanResult.extracted_url,
                  domain: scanResult.extracted_domain,
                  risk_score: scanResult.risk_score,
                  classification: scanResult.risk_classification === 'Malicious' ? 'PHISHING' : scanResult.risk_classification === 'Suspicious' ? 'SUSPICIOUS' : 'SAFE',
                  breakdown: scanResult.url_breakdown || {
                    final_score: scanResult.risk_score,
                    ml_score: scanResult.risk_score,
                    rule_score: scanResult.risk_score,
                    threat_intel_score: 0.0
                  },
                  threats_detected: scanResult.threats_detected,
                  safe_indicators: scanResult.safe_indicators,
                  origin_intelligence: scanResult.origin_intelligence
                })}
                className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1E40AF] text-white text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <span>Open in URL Forensic Dossier</span>
                <ArrowRight className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}