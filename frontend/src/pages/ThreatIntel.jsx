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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-[#151517] border border-[#29292D] text-[#92929A] text-xs font-mono uppercase tracking-wider mb-2">
            <Shield className="w-3.5 h-3.5 text-[#FF6B35]" />
            <span>Adversary Signatures & Watchlists</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F5F5] tracking-tight">
            Threat Intelligence
          </h1>
          <p className="text-xs text-[#92929A] mt-1">
            Signatures, monitored brand catalogs, high-abuse TLDs, and external API connectors.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-[10px] bg-[#151517] border border-[#29292D] text-[#92929A] text-xs font-mono">
            Feed Status: <strong className="text-[#35C98A]">Synchronized</strong>
          </span>
        </div>
      </div>

      {/* API Adapters Status Card */}
      <div className="p-6 rounded-[16px] bg-[#151517] border border-[#29292D] space-y-4">
        <h3 className="text-xs font-semibold text-[#F5F5F5] font-mono uppercase tracking-wider flex items-center gap-2">
          <Server className="w-4 h-4 text-[#FF6B35]" />
          <span>Threat Intelligence Integrations</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Local Heuristics */}
          <div className="p-4 rounded-[12px] bg-[#101012] border border-[#29292D] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#F5F5F5]">Local Heuristic Engine</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#101F18] text-[#35C98A] border border-[#35C98A]/30">
                ACTIVE
              </span>
            </div>
            <p className="text-[#92929A] text-[11px] leading-relaxed">
              34-feature lexical parser, Shannon entropy calculator, and Levenshtein brand distance analyzer.
            </p>
            <div className="text-[10px] font-mono text-[#FF6B35]">Zero-Execution Static Sandbox</div>
          </div>

          {/* VirusTotal API */}
          <div className="p-4 rounded-[12px] bg-[#101012] border border-[#29292D] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#F5F5F5]">VirusTotal v3 API</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono text-[#686870] border border-[#29292D]">
                OPTIONAL PLUG-IN
              </span>
            </div>
            <p className="text-[#92929A] text-[11px] leading-relaxed">
              Multi-engine antivirus domain reputation check. Configured via <code>VIRUSTOTAL_API_KEY</code>.
            </p>
            <div className="text-[10px] font-mono text-[#686870]">Offline Simulation Fallback Active</div>
          </div>

          {/* Google Safe Browsing */}
          <div className="p-4 rounded-[12px] bg-[#101012] border border-[#29292D] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#F5F5F5]">Google Safe Browsing</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono text-[#686870] border border-[#29292D]">
                OPTIONAL PLUG-IN
              </span>
            </div>
            <p className="text-[#92929A] text-[11px] leading-relaxed">
              Google threat intelligence lookup feed. Configured via <code>GOOGLE_SAFE_BROWSING_API_KEY</code>.
            </p>
            <div className="text-[10px] font-mono text-[#686870]">Offline Simulation Fallback Active</div>
          </div>
        </div>
      </div>

      {/* Tabs for Watchlists */}
      <div className="flex border-b border-[#29292D] gap-4 text-xs font-mono">
        <button
          onClick={() => setFilter('brands')}
          className={`pb-3 font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            filter === 'brands' ? 'border-[#FF6B35] text-[#F5F5F5]' : 'border-transparent text-[#92929A] hover:text-[#F5F5F5]'
          }`}
        >
          <span>Monitored Brand Targets ({monitoredBrands.length})</span>
        </button>
        <button
          onClick={() => setFilter('tlds')}
          className={`pb-3 font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            filter === 'tlds' ? 'border-[#FF6B35] text-[#F5F5F5]' : 'border-transparent text-[#92929A] hover:text-[#F5F5F5]'
          }`}
        >
          <span>High-Abuse TLDs ({highAbuseTLDs.length})</span>
        </button>
        <button
          onClick={() => setFilter('keywords')}
          className={`pb-3 font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            filter === 'keywords' ? 'border-[#FF6B35] text-[#F5F5F5]' : 'border-transparent text-[#92929A] hover:text-[#F5F5F5]'
          }`}
        >
          <span>Credential Keywords ({keywordSignatures.length})</span>
        </button>
      </div>

      {/* TAB 1: Monitored Brands */}
      {filter === 'brands' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {monitoredBrands.map((b, idx) => (
            <div key={idx} className="p-4 rounded-[12px] bg-[#151517] border border-[#29292D] hover:border-[#38383E] transition-colors space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#F5F5F5] text-xs sm:text-sm">{b.name}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#241315] text-[#FF5C5C] border border-[#FF5C5C]/30">
                  {b.riskLevel}
                </span>
              </div>
              <div className="text-xs text-[#92929A]">{b.category}</div>
              <div className="pt-2 border-t border-[#29292D] flex items-center justify-between text-[11px] font-mono">
                <span className="text-[#686870]">Official Host:</span>
                <span className="text-[#FF6B35] font-semibold">{b.official}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: High-Abuse TLDs */}
      {filter === 'tlds' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {highAbuseTLDs.map((t, idx) => (
            <div key={idx} className="p-4 rounded-[12px] bg-[#151517] border border-[#29292D] hover:border-[#38383E] transition-colors space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#FF6B35] text-base font-mono">{t.tld}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#221B10] text-[#F2B84B] border border-[#F2B84B]/30">
                  {t.reputation}
                </span>
              </div>
              <div className="text-xs text-[#92929A] leading-snug">{t.primaryUse}</div>
              <div className="pt-2 border-t border-[#29292D] text-[10px] font-mono text-[#686870]">
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
            <div key={idx} className="p-4 rounded-[12px] bg-[#151517] border border-[#29292D] hover:border-[#38383E] transition-colors space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#F5F5F5] font-mono text-xs">{k.word}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                  k.severity === 'Critical' ? 'bg-[#241315] text-[#FF5C5C] border border-[#FF5C5C]/30' : 'bg-[#221B10] text-[#F2B84B] border border-[#F2B84B]/30'
                }`}>
                  {k.severity}
                </span>
              </div>
              <div className="text-xs text-[#92929A]">{k.category}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
