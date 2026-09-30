import React from 'react';
import { 
  Search, ShieldAlert, AlertTriangle, ShieldCheck, CheckCircle2, 
  Info, ArrowRight, Shield, Lock, Terminal, Cpu 
} from 'lucide-react';
import UrlScanner from '../components/scanner/UrlScanner';

export default function Scanner({ setActivePage, setScanResult }) {
  const handleScanComplete = (result) => {
    setScanResult(result);
    setActivePage('results');
  };

  const analystChecklist = [
    {
      title: 'Root Domain Authority Verification',
      desc: 'Identify the exact two labels preceding the first single slash (/). Attackers inject reputable brand names into subdomains to mislead human readers.'
    },
    {
      title: 'Transport Layer Security (TLS/SSL)',
      desc: 'HTTPS guarantees that in-transit communication is encrypted between client and server, but over 80% of modern phishing domains now also possess free SSL certificates.'
    },
    {
      title: 'Host Architecture & Ephemeral IPs',
      desc: 'Consumer websites rarely run directly on raw numeric IP addresses or non-standard web ports (e.g., :8080, :4444, :8888).'
    },
    {
      title: 'Homoglyph & Punycode Deception',
      desc: 'Scrutinize individual character glyphs. Punycode domains (xn--) render Cyrillic or Greek symbols that appear visually identical to standard Latin characters.'
    }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-10">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 border border-orange-500/40 text-orange-400 text-xs font-mono">
          <Search className="w-3.5 h-3.5" />
          <span>Deep Heuristic & ML Inspection Workstation</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          URL Threat Scanner
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
          Safely analyze suspicious URLs without executing scripts, loading remote assets, or triggering attacker tracking pixels.
        </p>
      </div>

      {/* Prominent Scanner Card */}
      <UrlScanner onScanComplete={handleScanComplete} />

      {/* Pre-Flight Analyst Checklist */}
      <div className="pt-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-2">
            <Terminal className="w-4 h-4 text-orange-400" />
            <span>SOC Analyst Triage Methodology</span>
          </h3>
          <span className="text-[11px] font-mono text-orange-400">Zero-Execution Protocol</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analystChecklist.map((tip, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-[#090C13] border border-[#1C2230] hover:border-orange-500/40 transition-all space-y-2"
            >
              <div className="flex items-center gap-2 text-white font-bold text-xs sm:text-sm">
                <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0" />
                <span>{tip.title}</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed pl-6">
                {tip.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
