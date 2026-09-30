import React from 'react';
import { 
  ShieldCheck, AlertTriangle, XCircle, CheckCircle2, Globe, 
  Lock, Network, Cpu, Info, Shield, Server, FileText, AlertCircle 
} from 'lucide-react';

export default function ThreatAnalysis({ features = {}, details = {}, riskScore = 0, classification = 'SAFE' }) {
  // Helpers to categorize factor severity
  const getStatusBadge = (status) => {
    switch (status) {
      case 'dangerous':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold font-mono uppercase bg-rose-950/80 text-rose-300 border border-rose-800">
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>Dangerous</span>
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold font-mono uppercase bg-amber-950/80 text-amber-300 border border-amber-800">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Warning</span>
          </span>
        );
      case 'safe':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold font-mono uppercase bg-emerald-950/80 text-emerald-300 border border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Safe</span>
          </span>
        );
    }
  };

  // 1. URL Structure Factors
  const urlFactors = [
    {
      label: 'URL Length',
      value: `${features.url_length || 0} chars`,
      status: (features.url_length > 100) ? 'warning' : (features.url_length > 200 ? 'dangerous' : 'safe'),
      note: (features.url_length > 100) ? 'Unusually long URL often used to obscure payloads' : 'Standard URL length'
    },
    {
      label: 'Subdirectories / Paths',
      value: `${features.num_subdirs || 0} segments`,
      status: (features.num_subdirs >= 4) ? 'warning' : 'safe',
      note: (features.num_subdirs >= 4) ? 'Deep directory nesting detected' : 'Normal path structure'
    },
    {
      label: 'Query Parameters',
      value: `${features.num_query_params || 0} params`,
      status: (features.num_query_params >= 4) ? 'warning' : 'safe',
      note: 'Parameter entropy check'
    },
    {
      label: 'Double Slash Redirection',
      value: features.has_double_slash_redirect ? 'Detected (//)' : 'None',
      status: features.has_double_slash_redirect ? 'dangerous' : 'safe',
      note: features.has_double_slash_redirect ? 'Potential open redirect attempt' : 'No path redirection flags'
    }
  ];

  // 2. Domain & Host Identity Factors
  const brandData = details.brand_analysis || {};
  const domainFactors = [
    {
      label: 'Brand Lookalike & Spoofing',
      value: brandData.impersonation_detected ? `Mimics ${brandData.brands?.join(', ')}` : 'Verified / Non-brand',
      status: brandData.impersonation_detected ? 'dangerous' : 'safe',
      note: brandData.impersonation_detected ? 'Typosquatting or brand injection detected' : 'No brand trademark anomalies'
    },
    {
      label: 'Top Level Domain (TLD)',
      value: details.tld ? `.${details.tld}` : 'Standard',
      status: features.has_suspicious_tld ? 'warning' : 'safe',
      note: features.has_suspicious_tld ? 'TLD has high statistical abuse in phishing campaigns' : 'Standard/reputable TLD'
    },
    {
      label: 'Subdomain Stacking',
      value: `${features.subdomain_count || 0} subdomains`,
      status: (features.subdomain_count >= 3) ? 'dangerous' : (features.subdomain_count >= 2 ? 'warning' : 'safe'),
      note: (features.subdomain_count >= 3) ? 'Excessive subdomain depth to mask root host' : 'Standard domain hierarchy'
    },
    {
      label: 'Punycode / IDN Homoglyphs',
      value: features.has_punycode ? 'Present (xn--)' : 'Standard ASCII',
      status: features.has_punycode ? 'dangerous' : 'safe',
      note: features.has_punycode ? 'Internationalized characters may visually spoof letters' : 'Standard Latin character set'
    }
  ];

  // 3. Security & Transport Signals
  const securitySignals = [
    {
      label: 'SSL / TLS Encryption',
      value: features.has_https ? 'HTTPS Enabled' : 'Insecure HTTP',
      status: features.has_https ? 'safe' : 'dangerous',
      note: features.has_https ? 'Encrypted transmission (Note: Phishers can also obtain SSL)' : 'Unencrypted plain text communication'
    },
    {
      label: 'Host Type (IP vs Domain)',
      value: features.is_ip_address ? 'Direct IP Address' : 'Registered Domain',
      status: features.is_ip_address ? 'dangerous' : 'safe',
      note: features.is_ip_address ? 'Legitimate organizations use domain names, not raw IPs' : 'Domain DNS mapping active'
    },
    {
      label: 'Connection Port',
      value: details.port ? `Port :${details.port}` : 'Standard (80/443)',
      status: features.has_suspicious_port ? 'warning' : 'safe',
      note: features.has_suspicious_port ? 'Non-standard port used (frequently for rogue proxies)' : 'Standard web ports'
    },
    {
      label: 'URL Shortener Masking',
      value: features.is_shortener ? 'Masked / Shortened' : 'Direct Destination',
      status: features.is_shortener ? 'warning' : 'safe',
      note: features.is_shortener ? 'Destination hidden behind redirection service' : 'Full target is directly visible'
    }
  ];

  // 4. Content & Keyword Detection Signals
  const matchedKw = details.matched_keywords || [];
  const keywordSignals = [
    {
      label: 'Authentication Keywords',
      value: matchedKw.length > 0 ? matchedKw.join(', ') : 'None',
      status: (matchedKw.length >= 2 || features.has_login_keyword) ? 'warning' : 'safe',
      note: matchedKw.length > 0 ? 'Credential terms detected (login, account, verify, etc.)' : 'Clean lexical vocabulary'
    },
    {
      label: 'Userinfo "@" Credential Trick',
      value: features.has_at_symbol ? 'Detected (@)' : 'None',
      status: features.has_at_symbol ? 'dangerous' : 'safe',
      note: features.has_at_symbol ? 'Everything before @ is ignored by web browsers' : 'No authentication hijack character'
    },
    {
      label: 'Domain Randomness (Entropy)',
      value: features.domain_entropy ? `${features.domain_entropy.toFixed(2)} bits` : 'Normal',
      status: (features.domain_entropy > 4.2) ? 'warning' : 'safe',
      note: (features.domain_entropy > 4.2) ? 'High Shannon entropy suggests algorithmic DGA generation' : 'Natural language character distribution'
    },
    {
      label: 'Percent-Encoded Characters',
      value: `${features.num_percent_encoded || 0} hex codes`,
      status: (features.num_percent_encoded >= 4) ? 'warning' : 'safe',
      note: (features.num_percent_encoded >= 4) ? 'Heavy obfuscation with percent hex encoding' : 'Minimal character encoding'
    }
  ];

  const analysisCategories = [
    { title: 'URL Analysis', icon: FileText, factors: urlFactors, desc: 'Lexical structure, lengths, and path parameter geometry' },
    { title: 'Domain Analysis', icon: Globe, factors: domainFactors, desc: 'Root identity, typosquatting checks, and TLD reputation' },
    { title: 'Security Signals', icon: Lock, factors: securitySignals, desc: 'Transport encryption, IP hosting, and network port hygiene' },
    { title: 'Detection Factors', icon: Cpu, factors: keywordSignals, desc: 'Credential harvesting lures, entropy, and obfuscation tokens' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {analysisCategories.map((cat, idx) => {
          const Icon = cat.icon;
          return (
            <div key={idx} className="p-5 rounded-2xl bg-[#090C13] border border-[#1C2230] shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#1C2230] mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-orange-950/40 border border-orange-500/30 text-orange-400">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{cat.title}</h4>
                      <p className="text-[11px] text-slate-400">{cat.desc}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {cat.factors.map((factor, fIdx) => (
                    <div key={fIdx} className="p-2.5 rounded-xl bg-[#06080E] border border-[#1C2230] text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-200">{factor.label}</span>
                        {getStatusBadge(factor.status)}
                      </div>
                      <div className="flex items-baseline justify-between text-[11px] font-mono">
                        <span className="text-orange-400 font-semibold">{factor.value}</span>
                        <span className="text-slate-400 text-right truncate max-w-[200px]">{factor.note}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
