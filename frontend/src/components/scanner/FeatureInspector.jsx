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
    <div className="rounded-2xl bg-white border border-[#E2E8F0] p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-[#2563EB]" />
            <h3 className="font-bold text-[#111827] text-base">
              Feature Extraction Inspector
            </h3>
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Raw lexical and topological features passed to the random forest inference classifier.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search feature..."
            className="w-full pl-9 pr-3 py-1.5 bg-[#F5F9FF] border border-[#E2E8F0] rounded-xl text-xs text-[#111827] placeholder-[#94A3B8] font-mono focus:outline-none focus:border-[#2563EB]"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 border-b border-[#E2E8F0]">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setFilter(cat.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              filter === cat.id
                ? 'bg-[#DBEAFE] text-[#2563EB] font-bold shadow-2xs'
                : 'bg-[#F5F9FF] text-[#64748B] hover:text-[#111827] hover:bg-[#E2E8F0]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Features Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#E2E8F0] text-[11px] font-mono text-[#64748B] uppercase">
              <th className="py-2.5 px-3">Feature Name</th>
              <th className="py-2.5 px-3">Extracted Value</th>
              <th className="py-2.5 px-3">Category</th>
              <th className="py-2.5 px-3">Specification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0] font-mono">
            {filteredFeatures.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-[#64748B] text-xs">
                  No features found matching the query.
                </td>
              </tr>
            ) : (
              filteredFeatures.map((key) => {
                const val = features[key];
                const meta = featureMetadata[key] || { category: 'general', desc: 'Custom structural attribute' };
                const isBoolean = typeof val === 'boolean' || val === 0 || val === 1;

                return (
                  <tr key={key} className="hover:bg-[#F5F9FF] transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-[#111827]">
                      {key}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        val === true || val === 1
                          ? 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]'
                          : val === false || val === 0
                          ? 'bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]'
                          : 'bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE]'
                      }`}>
                        {typeof val === 'number' ? (Number.isInteger(val) ? val : val.toFixed(4)) : String(val)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] uppercase tracking-wider text-[#64748B] bg-[#F5F9FF] px-2 py-0.5 rounded border border-[#E2E8F0]">
                        {meta.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[#64748B] text-[11px] font-sans">
                      {meta.desc}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}