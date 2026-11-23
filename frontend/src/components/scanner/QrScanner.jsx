import React, { useState, useRef, useEffect } from 'react';
import { QrCode, UploadCloud, FileText, ArrowRight, Lock, Camera, X } from 'lucide-react';
import { api } from '../../services/api';
import QrResult from '../results/QrResult';

/**
 * Live camera capture. A frame is only grabbed when a QR code is seen (detected locally with jsQR) or the
 * user presses Capture; the frame is then sent through the same backend scan as an uploaded image.
 * The scanned address is never opened. Everything is released when the panel closes.
 */
function CameraCapture({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [status, setStatus] = useState('starting'); // starting | scanning | denied | unsupported
  const doneRef = useRef(false);

  const grab = () => new Promise((resolve) => {
    const v = videoRef.current;
    const cv = canvasRef.current;
    if (!v || !cv || !v.videoWidth) { resolve(null); return; }
    cv.width = v.videoWidth;
    cv.height = v.videoHeight;
    cv.getContext('2d', { willReadFrequently: true }).drawImage(v, 0, 0);
    cv.toBlob((b) => resolve(b), 'image/png');
  });

  const finish = async () => {
    if (doneRef.current) return;
    const blob = await grab();
    if (!blob) return;
    doneRef.current = true;
    onCapture(new File([blob], 'camera-capture.png', { type: 'image/png' }));
  };

  useEffect(() => {
    let stream;
    let timer;
    let cancelled = false;
    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) { setStatus('unsupported'); return; }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      } catch {
        if (!cancelled) setStatus('denied');
        return;
      }
      if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
      const v = videoRef.current;
      v.srcObject = stream;
      await v.play().catch(() => {});
      setStatus('scanning');
      const { default: jsQR } = await import('jsqr');
      timer = setInterval(() => {
        const cv = canvasRef.current;
        if (!v.videoWidth || !cv || doneRef.current) return;
        const w = Math.min(640, v.videoWidth);
        const h = Math.round((v.videoHeight / v.videoWidth) * w);
        cv.width = w; cv.height = h;
        const ctx = cv.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(v, 0, 0, w, h);
        const found = jsQR(ctx.getImageData(0, 0, w, h).data, w, h);
        if (found?.data) finish();
      }, 350);
    })();
    return () => {
      cancelled = true;
      clearInterval(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-[#0F172A] p-3 space-y-3">
      <div className="relative overflow-hidden rounded-lg bg-black aspect-video flex items-center justify-center">
        <video ref={videoRef} muted playsInline className="h-full w-full object-cover" aria-label="Camera preview" />
        <canvas ref={canvasRef} className="hidden" />
        {status === 'scanning' && (
          <span aria-hidden="true" className="pointer-events-none absolute inset-6 rounded-lg border-2 border-[#60A5FA]/80 shadow-[0_0_0_9999px_rgba(15,23,42,0.35)]" />
        )}
        {status !== 'scanning' && (
          <p role="status" className="absolute inset-0 flex items-center justify-center px-6 text-center text-xs text-slate-200">
            {status === 'starting' && 'Starting camera…'}
            {status === 'denied' && 'Camera access was blocked. Allow it in your browser settings, or upload an image instead.'}
            {status === 'unsupported' && 'This browser or connection does not support camera access (HTTPS is required). Upload an image instead.'}
          </p>
        )}
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] text-slate-300">Point the camera at a QR code. It is scanned only — the link is never opened.</p>
        <div className="flex items-center gap-2 shrink-0">
          <button type="button" onClick={finish} disabled={status !== 'scanning'} className="px-3 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1E40AF] disabled:opacity-40 text-white text-xs font-semibold cursor-pointer">Capture</button>
          <button type="button" onClick={onClose} aria-label="Close camera" className="p-1.5 rounded-lg text-slate-300 hover:bg-white/10 cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
      </div>
    </div>
  );
}

export default function QrScanner() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  
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

  const handleCameraCapture = (capturedFile) => {
    setCameraOpen(false);
    handleFileSelect(capturedFile);
    runScan(capturedFile);
  };

  const handleScan = () => runScan(file);

  const runScan = async (target) => {
    if (!target) {
      setError('Please select or drop a QR code file first.');
      return;
    }

    setLoading(true);
    setError('');
    setScanResult(null);

    try {
      const result = await api.scanQr(target);
      setScanResult(result);
    } catch (err) {
      setError(err.message || 'Failed to analyze QR code file. Please verify file format.');
    } finally {
      setLoading(false);
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

        {cameraOpen && <CameraCapture onCapture={handleCameraCapture} onClose={() => setCameraOpen(false)} />}

        {/* Upload Drag-and-Drop Area */}
        {!file && !cameraOpen ? (
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
        ) : cameraOpen ? null : (
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

        {!cameraOpen && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => { setError(''); setScanResult(null); setCameraOpen(true); }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#DBEAFE] bg-white hover:bg-[#F5F9FF] text-xs font-semibold text-[#2563EB] cursor-pointer transition-colors"
            >
              <Camera className="w-4 h-4" />
              <span>Scan with camera</span>
            </button>
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

      {/* RESULT: same short layout as the URL results page */}
      {scanResult && <QrResult key={`${scanResult.filename}-${scanResult.created_at}`} scanResult={scanResult} />}
    </div>
  );
}