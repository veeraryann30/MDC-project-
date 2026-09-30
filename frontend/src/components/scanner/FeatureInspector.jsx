import React, { useState } from 'react';
import { Database, Search, Check, AlertCircle, Sparkles } from 'lucide-react';

export default function FeatureInspector({ features = {}, details = {} }) {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [
    { id: 'all', label: 'All 34 Features' },
    { id: 'security', label: 'Security & Protocol' },
    { id: 'lexical', label: 'Lexical & Length' },
    { id: 'keyword', label: 'Keywords & Brand' },
    { id: 'entropy', label: 'Entropy & Stats' }
  ];

  const featureMetadata = {
    // Security & Flags
    has_https: { category: 'security', desc: 'HTTPS SSL/TLS encryption active (1=yes, 0=no)' },
    is_ip_address: { category: 'security', desc: 'Hostname is an IPv4 or IPv6 literal rather than a domain' },
    has_suspicious_port: { category: 'security', desc: 'Custom non-standard port specified (e.g. 8080, 8443)' },
    is_shortener: { category: 'security', desc: 'Matches known URL shortener service (bit.ly, t.co, etc.)' },
    has_punycode: { category: 'security', desc: 'IDN Homograph encoding detected (contains xn--)' },
    has_suspicious_tld: { category: 'security', desc: 'High-abuse top level domain (.xyz, .top, .work, etc.)' },
    subdomain_count: { category: 'security', desc: 'Number of subdomain levels in host hierarchy' },
    has_excessive_subdomains: { category: 'security', desc: 'Flagged if subdomains level count >= 3' },
    has_at_symbol: { category: 'security', desc: 'Contains userinfo @ character used to obfuscate host' },
    has_double_slash_redirect: { category: 'security', desc: 'Path contains // open redirect trigger' },
    num_percent_encoded: { category: 'security', desc: 'Count of %XX percent-encoded hex sequences' },

    // Lexical
    url_length: { category: 'lexical', desc: 'Total characters in full URL string' },
    domain_length: { category: 'lexical', desc: 'Total characters in domain hostname' },
    path_length: { category: 'lexical', desc: 'Characters in URL resource path' },
    query_length: { category: 'lexical', desc: 'Characters in query parameters string' },
    num_dots: { category: 'lexical', desc: 'Total dot (.) characters' },
    num_hyphens: { category: 'lexical', desc: 'Total hyphen (-) characters' },
    num_underscores: { category: 'lexical', desc: 'Total underscore (_) characters' },
    num_slashes: { category: 'lexical', desc: 'Total slash (/) characters' },
    num_digits: { category: 'lexical', desc: 'Total numeric digits count' },
    num_special_chars: { category: 'lexical', desc: 'Total special characters count' },
    special_char_ratio: { category: 'lexical', desc: 'Ratio of special chars to URL length' },
    digit_ratio: { category: 'lexical', desc: 'Ratio of numeric digits to URL length' },
    num_subdirs: { category: 'lexical', desc: 'Number of path folder segments' },
    num_query_params: { category: 'lexical', desc: 'Number of query string parameters' },

    // Keywords & Brand
    num_keywords: { category: 'keyword', desc: 'Total matched suspicious credential keywords' },
    has_login_keyword: { category: 'keyword', desc: 'Presence of login/signin keyword' },
    has_verify_keyword: { category: 'keyword', desc: 'Presence of verify/verification keyword' },
    has_banking_keyword: { category: 'keyword', desc: 'Presence of banking/payment/wallet keyword' },
    has_account_keyword: { category: 'keyword', desc: 'Presence of account/password/security keyword' },
    brand_impersonation_detected: { category: 'keyword', desc: 'Brand spoofing or typosquatting detected' },
    brand_score: { category: 'keyword', desc: 'Normalized brand impersonation severity score (0-1)' },

    // Entropy
    url_entropy: { category: 'entropy', desc: 'Shannon entropy (randomness) of full URL' },
    domain_entropy: { category: 'entropy', desc: 'Shannon entropy of domain string' }
  };

  const featureKeys = Object.keys(features);

  const filteredFeatures = featureKeys.filter(key => {
    const meta = featureMetadata[key] || { category: 'lexical', desc: key };
    const matchesCategory = filter === 'all' || meta.category === filter;
    const matchesSearch = key.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          meta.desc.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="rounded-2xl bg-[#090C13] border border-[#1C2230] p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-orange-400" />
            <h3 className="font-bold text-white text-base">
              Feature Extraction Inspector
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Raw numerical feature vector supplied to the Random Forest classifier.
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search features..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-3 py-1.5 bg-[#06080E] border border-[#1C2230] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors w-full sm:w-48"
          />
        </div>
      </div>

      {/* Categories Filter Tabs */}
      <div className="flex flex-wrap gap-1.5 mb-6 border-b border-[#1C2230] pb-3">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setFilter(c.id)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              filter === c.id
                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredFeatures.map((key) => {
          const val = features[key];
          const meta = featureMetadata[key] || { category: 'lexical', desc: key };
          const isFlagged = (typeof val === 'number' && (
            (key.startsWith('has_') && val === 1 && key !== 'has_https') ||
            (key === 'is_ip_address' && val === 1) ||
            (key === 'brand_impersonation_detected' && val === 1) ||
            (key === 'has_suspicious_tld' && val === 1)
          ));

          return (
            <div
              key={key}
              className={`p-3 rounded-xl border transition-all ${
                isFlagged 
                  ? 'bg-rose-950/20 border-rose-800/40 hover:border-rose-700/60'
                  : 'bg-[#06080E] border-[#1C2230] hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-mono text-xs text-slate-300 font-semibold truncate" title={key}>
                  {key}
                </span>
                <span className={`px-2 py-0.5 rounded font-mono text-xs font-bold ${
                  isFlagged 
                    ? 'bg-rose-950 text-rose-300 border border-rose-800' 
                    : 'bg-[#090C13] text-orange-400 border border-[#1C2230]'
                }`}>
                  {typeof val === 'number' ? (Number.isInteger(val) ? val : val.toFixed(3)) : String(val)}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                {meta.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
