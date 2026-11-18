import React, { useState } from 'react';
import { 
  Shield, Globe, Key, AlertTriangle, CheckCircle2, Lock, 
  ExternalLink, Server, RefreshCw, Database, Terminal, ShieldAlert 
} from 'lucide-react';

export default function ThreatIntel() {
  const [filter, setFilter] = useState('brands');

  const monitoredBrands = [
    { name: 'PayPal', category: 'Fintech & Payments', official: 'paypal.com', riskLevel: 'Critical Target' },
    { name: 'Google / Gmail', category: 'Identity & Cloud', official: 'google.com', riskLevel: 'Critical Target' },
    { name: 'Microsoft 365', category: 'Enterprise SSO', official: 'microsoft.com', riskLevel: 'Critical Target' },
    { name: 'Apple ID', category: 'Consumer Devices', official: 'apple.com', riskLevel: 'High Target' },
    { name: 'Amazon / AWS', category: 'E-Commerce & Cloud', official: 'amazon.com', riskLevel: 'High Target' },
    { name: 'Netflix', category: 'Streaming Subscription', official: 'netflix.com', riskLevel: 'Medium Target' },
    { name: 'Chase Bank', category: 'Retail Banking', official: 'chase.com', riskLevel: 'Critical Target' },
    { name: 'Wells Fargo', category: 'Retail Banking', official: 'wellsfargo.com', riskLevel: 'Critical Target' },
    { name: 'Bank of America', category: 'Retail Banking', official: 'bankofamerica.com', riskLevel: 'Critical Target' },
    { name: 'Binance', category: 'Cryptocurrency Exchange', official: 'binance.com', riskLevel: 'High Target' },
    { name: 'Coinbase', category: 'Cryptocurrency Wallet', official: 'coinbase.com', riskLevel: 'High Target' },
    { name: 'WhatsApp', category: 'Messaging Platform', official: 'whatsapp.com', riskLevel: 'High Target' }
  ];

  const highAbuseTLDs = [
    { tld: '.xyz', reputation: 'Elevated Abuse', cost: '$0.99', primaryUse: 'Throwaway Phishing / Scam Redirects' },
    { tld: '.top', reputation: 'High Malicious Ratio', cost: '$1.49', primaryUse: 'Spam Campaigns & Malvertising' },
    { tld: '.work', reputation: 'Elevated Abuse', cost: '$1.99', primaryUse: 'Fake Job Offers & Credential Harvesting' },
    { tld: '.click', reputation: 'High Malicious Ratio', cost: '$1.29', primaryUse: 'Smishing SMS Phishing' },
    { tld: '.loan', reputation: 'Financial Scam Ratio', cost: '$2.99', primaryUse: 'Predatory Lending Phishing' },
    { tld: '.buzz', reputation: 'Elevated Abuse', cost: '$1.99', primaryUse: 'Viral Survey & Lottery Phishing' },
    { tld: '.icu', reputation: 'High Malicious Ratio', cost: '$0.88', primaryUse: 'Automated Botnet Gateways' },
    { tld: '.monster', reputation: 'Elevated Abuse', cost: '$1.99', primaryUse: 'Disposable Malicious Mirrors' }
  ];

  const keywordSignatures = [
    { word: 'login', category: 'Credential Gateway', severity: 'High' },
    { word: 'signin', category: 'Credential Gateway', severity: 'High' },
    { word: 'verification', category: 'Identity Harvest', severity: 'High' },
    { word: 'account-update', category: 'Account Takeover', severity: 'Medium' },
    { word: 'banking', category: 'Financial Fraud', severity: 'High' },
    { word: 'wallet-connect', category: 'Crypto Drainer', severity: 'Critical' },
    { word: 'secure-portal', category: 'Misleading Trust', severity: 'Medium' },
    { word: 'suspend-notice', category: 'Urgency Social Engineering', severity: 'High' }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8 select-none font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DBEAFE] border border-[#BFDBFE] text-[#2563EB] text-xs font-semibold uppercase tracking-wider mb-2">
            <Shield className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Adversary Signatures & Watchlists</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight">
            Threat Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Signatures, monitored brand catalogs, high-abuse TLDs, and external API connectors.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 rounded-full bg-[#F5F9FF] border border-[#E2E8F0] text-[#64748B] text-xs font-mono font-medium">
            Feed Status: <strong className="text-[#16A34A]">Synchronized</strong>
          </span>
        </div>
      </div>

      {/* API Adapters Status Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm space-y-4">
        <h3 className="text-xs font-semibold text-[#111827] font-mono uppercase tracking-wider flex items-center gap-2">
          <Server className="w-4 h-4 text-[#2563EB]" />
          <span>Threat Intelligence Integrations</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Local Heuristics */}
          <div className="p-4 rounded-xl bg-[#F5F9FF] border border-[#E2E8F0] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#111827]">Local Heuristic Engine</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-[#16A34A] border border-emerald-200">
                ACTIVE
              </span>
            </div>
            <p className="text-[#64748B] text-[11px] leading-relaxed">
              34-feature lexical parser, Shannon entropy calculator, and Levenshtein brand distance analyzer.
            </p>
            <div className="text-[10px] font-mono text-[#2563EB] font-semibold">Zero-Execution Static Sandbox</div>
          </div>

          {/* VirusTotal API */}
          <div className="p-4 rounded-xl bg-[#F5F9FF] border border-[#E2E8F0] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#111827]">VirusTotal v3 API</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-[#64748B] bg-white border border-[#E2E8F0]">
                OPTIONAL PLUG-IN
              </span>
            </div>
            <p className="text-[#64748B] text-[11px] leading-relaxed">
              Multi-engine antivirus domain reputation check. Configured via <code>VIRUSTOTAL_API_KEY</code>.
            </p>
            <div className="text-[10px] font-mono text-[#64748B]">Offline Simulation Fallback Active</div>
          </div>

          {/* Google Safe Browsing */}
          <div className="p-4 rounded-xl bg-[#F5F9FF] border border-[#E2E8F0] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#111827]">Google Safe Browsing</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-[#64748B] bg-white border border-[#E2E8F0]">
                OPTIONAL PLUG-IN
              </span>
            </div>
            <p className="text-[#64748B] text-[11px] leading-relaxed">
              Google threat intelligence lookup feed. Configured via <code>GOOGLE_SAFE_BROWSING_API_KEY</code>.
            </p>
            <div className="text-[10px] font-mono text-[#64748B]">Offline Simulation Fallback Active</div>
          </div>
        </div>
      </div>

      {/* Tabs for Watchlists */}
      <div className="flex border-b border-[#E2E8F0] gap-4 text-xs font-mono">
        <button
          onClick={() => setFilter('brands')}
          className={`pb-3 font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            filter === 'brands' ? 'border-[#2563EB] text-[#2563EB]' : 'border-transparent text-[#64748B] hover:text-[#111827]'
          }`}
        >
          <span>Monitored Brand Targets ({monitoredBrands.length})</span>
        </button>
        <button
          onClick={() => setFilter('tlds')}
          className={`pb-3 font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            filter === 'tlds' ? 'border-[#2563EB] text-[#2563EB]' : 'border-transparent text-[#64748B] hover:text-[#111827]'
          }`}
        >
          <span>High-Abuse TLDs ({highAbuseTLDs.length})</span>
        </button>
        <button
          onClick={() => setFilter('keywords')}
          className={`pb-3 font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            filter === 'keywords' ? 'border-[#2563EB] text-[#2563EB]' : 'border-transparent text-[#64748B] hover:text-[#111827]'
          }`}
        >
          <span>Credential Keywords ({keywordSignatures.length})</span>
        </button>
      </div>

      {/* TAB 1: Monitored Brands */}
      {filter === 'brands' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {monitoredBrands.map((b, idx) => (
            <div key={idx} className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E2E8F0] hover:border-[#2563EB]/40 hover:shadow-md transition-all space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#111827] text-xs sm:text-sm">{b.name}</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-red-50 text-[#DC2626] border border-red-200">
                  {b.riskLevel}
                </span>
              </div>
              <div className="text-xs text-[#64748B]">{b.category}</div>
              <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-[11px] font-mono">
                <span className="text-[#64748B]">Official Host:</span>
                <span className="text-[#2563EB] font-semibold">{b.official}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: High-Abuse TLDs */}
      {filter === 'tlds' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {highAbuseTLDs.map((t, idx) => (
            <div key={idx} className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E2E8F0] hover:border-[#2563EB]/40 hover:shadow-md transition-all space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#2563EB] text-base font-mono">{t.tld}</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-amber-50 text-[#F59E0B] border border-amber-200">
                  {t.reputation}
                </span>
              </div>
              <div className="text-xs text-[#64748B] leading-snug">{t.primaryUse}</div>
              <div className="pt-2 border-t border-[#E2E8F0] text-[10px] font-mono text-[#64748B]">
                Avg Cost: {t.cost}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: Credential Keywords */}
      {filter === 'keywords' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {keywordSignatures.map((k, idx) => (
            <div key={idx} className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E2E8F0] hover:border-[#2563EB]/40 hover:shadow-md transition-all space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#111827] font-mono text-xs">{k.word}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                  k.severity === 'Critical' ? 'bg-red-50 text-[#DC2626] border border-red-200' : 'bg-amber-50 text-[#F59E0B] border border-amber-200'
                }`}>
                  {k.severity}
                </span>
              </div>
              <div className="text-xs text-[#64748B]">{k.category}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
