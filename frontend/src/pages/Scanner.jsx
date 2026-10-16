import React from 'react';
import { 
  Search, CheckCircle2, Terminal, Shield, Lock
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-10 select-none">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-[#151517] border border-[#29292D] text-[#92929A] text-xs font-mono uppercase tracking-wider">
          <Search className="w-3.5 h-3.5 text-[#FF6B35]" />
          <span>Heuristic & ML URL Workstation</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F5F5] tracking-tight">
          URL Threat Scanner
        </h1>
        <p className="text-xs sm:text-sm text-[#92929A] max-w-lg mx-auto leading-relaxed">
          Safely analyze suspicious URLs without executing scripts, loading remote assets, or triggering attacker tracking pixels.
        </p>
      </div>

      {/* Prominent Scanner Card */}
      <UrlScanner onScanComplete={handleScanComplete} />

      {/* Pre-Flight Analyst Checklist */}
      <div className="pt-2 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono uppercase tracking-wider text-[#92929A] font-semibold flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#FF6B35]" />
            <span>SOC Analyst Triage Methodology</span>
          </h3>
          <span className="text-[11px] font-mono text-[#35C98A]">Zero-Execution Protocol</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analystChecklist.map((tip, idx) => (
            <div
              key={idx}
              className="p-5 rounded-[14px] bg-[#151517] border border-[#29292D] space-y-2"
            >
              <div className="flex items-center gap-2 text-[#F5F5F5] font-semibold text-xs sm:text-sm">
                <CheckCircle2 className="w-4 h-4 text-[#FF6B35] shrink-0" />
                <span>{tip.title}</span>
              </div>
              <p className="text-xs text-[#92929A] leading-relaxed pl-6 font-normal">
                {tip.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
