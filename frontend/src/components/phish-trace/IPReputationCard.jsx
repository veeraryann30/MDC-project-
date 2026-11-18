import React from 'react';
import { 
  ShieldCheck, ShieldAlert, AlertTriangle, Shield, 
  ExternalLink, CheckCircle2, XCircle, Info, Database, Activity, Server
} from 'lucide-react';

/**
 * IP REPUTATION ANALYSIS CARD
 * Evaluates IP threat reputation from AbuseIPDB, VirusTotal, and IPinfo.
 * Enforces SOC ethics: Never classify as malicious solely due to hosting/VPN/proxy infrastructure.
 */
export default function IPReputationCard({ threatIntel, network, ip }) {
  const intel = threatIntel || {};
  const reputation = (intel.reputation || 'Unknown').toUpperCase();
  const confidenceScore = intel.confidence_score;
  const abuseReports = intel.abuse_reports;
  const feeds = intel.feeds || {};

  let badge = {
    label: 'CLEAN REPUTATION',
    color: '#16A34A',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: ShieldCheck,
    summary: intel.summary || 'No historical abuse reports or malicious classifications found.'
  };

  if (reputation === 'MALICIOUS') {
    badge = {
      label: 'MALICIOUS IP',
      color: '#DC2626',
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: ShieldAlert,
      summary: intel.summary || 'Active abuse or verified malicious activity detected in threat feeds.'
    };
  } else if (reputation === 'SUSPICIOUS') {
    badge = {
      label: 'SUSPICIOUS REPUTATION',
      color: '#F59E0B',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      icon: AlertTriangle,
      summary: intel.summary || 'Suspicious signals or recent abuse incidents associated with this IP.'
    };
  } else if (reputation === 'UNKNOWN') {
    badge = {
      label: 'UNRATED / UNKNOWN',
      color: '#64748B',
      bg: 'bg-slate-100',
      border: 'border-slate-200',
      icon: Shield,
      summary: intel.summary || 'External threat feeds unconfigured. Local heuristic evaluation active.'
    };
  }

  const Icon = badge.icon;

  return (
    <div className="rounded-2xl bg-white border border-[#E2E8F0] shadow-sm p-5 sm:p-6 space-y-6 font-sans">
      {/* Header & Overall Verdict */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm" style={{ backgroundColor: `${badge.color}15`, color: badge.color, border: `1px solid ${badge.color}40` }}>
            <Icon className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider font-semibold">
                Threat Intelligence Verdict
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${badge.bg} ${badge.border}`} style={{ color: badge.color }}>
                {badge.label}
              </span>
            </div>
            <div className="text-sm sm:text-base font-bold text-[#111827] font-mono mt-0.5">
              IP: {ip || network?.ip || 'Unavailable'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-[#64748B]">
          <span>Sources: </span>
          <span className="text-[#111827] font-semibold">{Array.isArray(intel.sources) ? intel.sources.join(', ') : 'AbuseIPDB / VT'}</span>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
        {/* Metric 1: Abuse Reports */}
        <div className="p-3.5 rounded-xl bg-[#F5F9FF] border border-[#E2E8F0] space-y-1">
          <span className="text-[10px] text-[#64748B] uppercase font-semibold">Abuse Reports</span>
          <div className="text-base sm:text-lg font-bold text-[#111827]">
            {abuseReports !== undefined && abuseReports !== 'Unavailable' ? abuseReports : 'Unavailable'}
          </div>
          <span className="text-[10px] text-[#64748B] block truncate">
            {intel.last_reported ? `Last: ${intel.last_reported}` : 'Last 90 days'}
          </span>
        </div>

        {/* Metric 2: Confidence Score */}
        <div className="p-3.5 rounded-xl bg-[#F5F9FF] border border-[#E2E8F0] space-y-1">
          <span className="text-[10px] text-[#64748B] uppercase font-semibold">Confidence Score</span>
          <div className="text-base sm:text-lg font-bold" style={{ color: badge.color }}>
            {confidenceScore !== undefined && confidenceScore !== 'Unavailable' ? `${confidenceScore}%` : 'Unavailable'}
          </div>
          <span className="text-[10px] text-[#64748B] block truncate">
            {reputation === 'MALICIOUS' ? 'High threat ratio' : (reputation === 'SUSPICIOUS' ? 'Moderate alert' : 'Clean / Safe')}
          </span>
        </div>

        {/* Metric 3: Network ASN & ISP */}
        <div className="p-3.5 rounded-xl bg-[#F5F9FF] border border-[#E2E8F0] space-y-1">
          <span className="text-[10px] text-[#64748B] uppercase font-semibold">Network ASN</span>
          <div className="text-sm font-bold text-[#2563EB] truncate">
            {network?.asn || 'Unavailable'}
          </div>
          <span className="text-[10px] text-[#64748B] block truncate">
            {network?.isp || 'Unknown ISP'}
          </span>
        </div>

        {/* Metric 4: Hosting Organization */}
        <div className="p-3.5 rounded-xl bg-[#F5F9FF] border border-[#E2E8F0] space-y-1">
          <span className="text-[10px] text-[#64748B] uppercase font-semibold">Hosting Provider</span>
          <div className="text-sm font-bold text-[#1E40AF] truncate">
            {network?.cdn_provider || network?.org || 'Unknown Provider'}
          </div>
          <span className="text-[10px] text-[#64748B] block truncate">
            {network?.is_cdn_or_proxy ? 'Reverse Proxy Active' : 'Direct Server IP'}
          </span>
        </div>
      </div>

      {/* Multi-Feed Integration Deep Dive */}
      <div className="space-y-2">
        <span className="text-[11px] font-mono uppercase tracking-wider text-[#64748B] font-semibold block">
          Threat Intelligence Feeds
        </span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {/* AbuseIPDB */}
          <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#111827]">AbuseIPDB</span>
              {feeds.abuseipdb?.available ? (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-50 text-[#16A34A] border border-emerald-200">CONNECTED</span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-slate-100 text-[#64748B] border border-slate-200">UNCONFIGURED</span>
              )}
            </div>
            <p className="text-[11px] text-[#64748B] leading-relaxed">
              {feeds.abuseipdb?.note || 'Community crowd-sourced abuse reports and malicious IP database.'}
            </p>
            <div className="text-[10px] font-mono text-[#64748B]">
              Score: <strong className="text-[#111827]">{feeds.abuseipdb?.score ?? 'Unavailable'}</strong> | Reports: <strong className="text-[#111827]">{feeds.abuseipdb?.reports ?? 'Unavailable'}</strong>
            </div>
          </div>

          {/* VirusTotal */}
          <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#111827]">VirusTotal</span>
              {feeds.virustotal?.available ? (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-50 text-[#16A34A] border border-emerald-200">CONNECTED</span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-slate-100 text-[#64748B] border border-slate-200">UNCONFIGURED</span>
              )}
            </div>
            <p className="text-[11px] text-[#64748B] leading-relaxed">
              {feeds.virustotal?.note || 'Multi-engine antivirus scanner analysis and reputation aggregator.'}
            </p>
            <div className="text-[10px] font-mono text-[#64748B]">
              Malicious Detections: <strong className="text-[#DC2626]">{feeds.virustotal?.malicious_count ?? 'Unavailable'}</strong>
            </div>
          </div>

          {/* IPinfo */}
          <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#111827]">IPinfo Privacy Feed</span>
              {feeds.ipinfo?.available ? (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-50 text-[#16A34A] border border-emerald-200">CONNECTED</span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-slate-100 text-[#64748B] border border-slate-200">UNCONFIGURED</span>
              )}
            </div>
            <p className="text-[11px] text-[#64748B] leading-relaxed">
              {feeds.ipinfo?.note || 'Detects VPN tunnels, proxy gateways, Tor exit nodes, and hosting centers.'}
            </p>
            <div className="text-[10px] font-mono text-[#64748B]">
              VPN: <strong className="text-[#111827]">{String(feeds.ipinfo?.vpn ?? 'Unavailable')}</strong> | Tor: <strong className="text-[#111827]">{String(feeds.ipinfo?.tor ?? 'Unavailable')}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* SOC Policy Notice */}
      <div className="p-3.5 rounded-xl bg-[#F5F9FF] border border-[#E2E8F0] flex items-start gap-2.5 text-xs text-[#64748B] leading-relaxed">
        <Info className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
        <div>
          <strong className="text-[#111827]">SOC Evaluation Rule: </strong>
          An IP address is never classified as malicious solely because it belongs to a VPN, proxy, or cloud hosting provider. Malicious classification requires verified evidence of abuse reports or security engine detections.
        </div>
      </div>
    </div>
  );
}
