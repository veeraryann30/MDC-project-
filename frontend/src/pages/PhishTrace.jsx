import React, { useState, useEffect } from 'react';
import { 
  Compass, Search, Globe, Shield, ShieldCheck, ShieldAlert, 
  AlertTriangle, Server, Network, ArrowRight, RefreshCw, 
  CheckCircle2, XCircle, Clock, Database, Layers, Radio, ExternalLink, History
} from 'lucide-react';
import { api } from '../services/api';
import PhishTraceMap from '../components/phish-trace/PhishTraceMap';
import IPReputationCard from '../components/phish-trace/IPReputationCard';
import InfrastructureDetails from '../components/phish-trace/InfrastructureDetails';
import InfrastructureGraph from '../components/phish-trace/InfrastructureGraph';
import IntelligenceReport from '../components/phish-trace/IntelligenceReport';

/**
 * PHISH TRACE — Attacker Infrastructure & Geolocation Intelligence Workstation
 * SOC-grade platform for deep domain reconnaissance, IP intelligence, and infrastructure mapping.
 */
export default function PhishTrace({ setActivePage }) {
  const [urlInput, setUrlInput] = useState('');
  const [isTracing, setIsTracing] = useState(false);
  const [traceStep, setTraceStep] = useState(0);
  const [traceResult, setTraceResult] = useState(null);
  const [traceError, setTraceError] = useState('');
  const [historyItems, setHistoryItems] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const sampleTargets = [
    { label: 'PayPal Impersonation', url: 'http://paypa1-account-verification.xyz/login.php' },
    { label: 'Microsoft Fake Portal', url: 'http://micros0ft-security-update.top/auth/verify-account' },
    { label: 'Google Clean Domain', url: 'https://www.google.com/search?q=cybersecurity' }
  ];

  const traceSteps = [
    { id: 1, label: 'SSRF & URL Normalization', desc: 'Validating against RFC 1918 & loopback ranges' },
    { id: 2, label: 'DNS Resolution & Routing', desc: 'Querying A, AAAA, CNAME, and NS records' },
    { id: 3, label: 'IP Geolocation & BGP ASN', desc: 'Querying hosting datacenter and BGP routing' },
    { id: 4, label: 'SSL & RDAP Lifecycle', desc: 'Extracting X.509 cert and registration age' },
    { id: 5, label: 'Threat Feeds & Graph Mapping', desc: 'Evaluating AbuseIPDB, VT, and shared infrastructure' }
  ];

  const loadHistory = async () => {
    try {
      const data = await api.getPhishTraceHistory('', '', 10, 0);
      setHistoryItems(data?.items || []);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleTraceSubmit = async (e, customUrl) => {
    if (e) e.preventDefault();
    const target = (customUrl || urlInput).trim();
    if (!target || isTracing) return;

    if (customUrl) setUrlInput(customUrl);

    setIsTracing(true);
    setTraceError('');
    setTraceStep(1);

    const stepInterval = setInterval(() => {
      setTraceStep((prev) => (prev < 5 ? prev + 1 : prev));
    }, 280);

    try {
      const dossier = await api.traceInfrastructure(target);
      clearInterval(stepInterval);
      setTraceStep(5);
      setTimeout(() => {
        setTraceResult(dossier);
        setIsTracing(false);
        setTraceStep(0);
        loadHistory();
      }, 350);
    } catch (err) {
      clearInterval(stepInterval);
      setIsTracing(false);
      setTraceStep(0);
      setTraceError(err.message || 'Infrastructure trace failed. Check URL format or host connectivity.');
    }
  };

  const handleLoadHistoricalTrace = async (id) => {
    try {
      setIsTracing(true);
      const dossier = await api.getPhishTraceItem(id);
      if (dossier) {
        setTraceResult(dossier);
        setUrlInput(dossier.submitted_url || dossier.hostname || '');
      }
    } catch (e) {
      console.warn('Failed to load historical trace item:', e);
    } finally {
      setIsTracing(false);
      setShowHistoryModal(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 select-none font-sans print:p-0 print:m-0">
      {/* 1. SOC HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0] print:hidden">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DBEAFE] border border-[#BFDBFE] text-[#2563EB] text-xs font-semibold uppercase tracking-wider">
            <Compass className="w-3.5 h-3.5 animate-spin-slow text-[#2563EB]" />
            <span>SOC Reconnaissance Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight flex items-center gap-3">
            <span>PHISH TRACE</span>
            <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[#DBEAFE] text-[#2563EB] border border-[#BFDBFE]">
              v2.0 THREAT INTEL
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] max-w-2xl leading-relaxed">
            Attacker infrastructure reconnaissance and geolocation intelligence. Analyze hosting datacenters, IP abuse history, SSL certificates, BGP ASN routing, and shared infrastructure clusters.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={() => setShowHistoryModal(!showHistoryModal)}
            className="px-4 py-2 rounded-full bg-white hover:bg-[#F5F9FF] border border-[#E2E8F0] hover:border-[#2563EB] text-xs font-mono font-medium text-[#111827] flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            title="View Trace Audit History"
          >
            <History className="w-4 h-4 text-[#2563EB]" />
            <span>Audit History ({historyItems.length})</span>
          </button>
        </div>
      </div>

      {/* 2. URL INPUT WORKSTATION */}
      <div className="rounded-2xl bg-white border border-[#E2E8F0] shadow-sm p-6 sm:p-8 space-y-4 print:hidden">
        <form onSubmit={handleTraceSubmit} className="space-y-4">
          <label className="text-xs font-semibold uppercase tracking-wider text-[#64748B] block">
            Target URL or Hostname for Infrastructure Reconnaissance
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Enter suspicious link or domain (e.g. paypa1-account-verification.xyz/login.php)..."
                disabled={isTracing}
                className="w-full pl-10 pr-4 py-3 bg-[#F5F9FF] border border-[#E2E8F0] rounded-xl text-xs sm:text-sm font-mono text-[#111827] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={isTracing || !urlInput.trim()}
              className="px-7 py-3 bg-gradient-to-r from-[#2563EB] to-[#1E40AF] hover:from-[#1E40AF] hover:to-[#1D4ED8] disabled:opacity-50 text-white font-mono font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm hover:shadow shrink-0"
            >
              {isTracing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>TRACING INFRASTRUCTURE...</span>
                </>
              ) : (
                <>
                  <Compass className="w-4 h-4" />
                  <span>TRACE INFRASTRUCTURE</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Quick Sample Targets */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#E2E8F0] text-xs">
          <span className="text-[11px] font-semibold text-[#64748B]">Sample Targets:</span>
          {sampleTargets.map((st, idx) => (
            <button
              key={idx}
              onClick={() => handleTraceSubmit(null, st.url)}
              disabled={isTracing}
              className="px-3 py-1 rounded-full bg-[#F5F9FF] hover:bg-[#DBEAFE] border border-[#E2E8F0] hover:border-[#BFDBFE] text-[11px] font-mono text-[#2563EB] hover:text-[#1E40AF] transition-all cursor-pointer"
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Error Alert */}
        {traceError && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-[#DC2626] font-mono flex items-center justify-between">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 shrink-0" />
              <span>{traceError}</span>
            </div>
            <button 
              onClick={() => setTraceError('')}
              className="text-[#DC2626] hover:underline font-semibold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Scanning Animation Progress Stepper */}
        {isTracing && (
          <div className="p-5 sm:p-6 rounded-2xl bg-[#F5F9FF] border border-[#BFDBFE] space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-[#2563EB] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-ping" />
                Active Reconnaissance Pipeline Running...
              </span>
              <span className="text-xs font-mono text-[#64748B]">
                Stage {traceStep} of 5
              </span>
            </div>

            {/* Stepper Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              {traceSteps.map((st) => {
                const isComplete = traceStep > st.id;
                const isCurrent = traceStep === st.id;
                return (
                  <div
                    key={st.id}
                    className={`p-3 rounded-xl border transition-all text-xs font-mono space-y-1 ${
                      isComplete
                        ? 'bg-emerald-50 border-emerald-200 text-[#16A34A]'
                        : isCurrent
                        ? 'bg-white border-[#2563EB] text-[#2563EB] shadow-sm'
                        : 'bg-white/60 border-[#E2E8F0] text-[#64748B]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold">Step {st.id}</span>
                      {isComplete && <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />}
                    </div>
                    <div className="text-[11px] font-semibold truncate">{st.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 3. AUDIT HISTORY MODAL / DRAWER */}
      {showHistoryModal && (
        <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-lg space-y-4 print:hidden">
          <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
            <h3 className="text-sm font-semibold text-[#111827] font-mono flex items-center gap-2">
              <History className="w-4 h-4 text-[#2563EB]" />
              <span>Historical Infrastructure Traces</span>
            </h3>
            <button
              onClick={() => setShowHistoryModal(false)}
              className="text-xs text-[#64748B] hover:text-[#111827] cursor-pointer"
            >
              Close
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-[#64748B]">
                  <th className="pb-2">Domain</th>
                  <th className="pb-2">Resolved IP</th>
                  <th className="pb-2">Country</th>
                  <th className="pb-2">Reputation</th>
                  <th className="pb-2">Timestamp</th>
                  <th className="pb-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {historyItems.map((item) => (
                  <tr key={item.id} className="hover:bg-[#F5F9FF] transition-colors">
                    <td className="py-2.5 text-[#111827] font-semibold">{item.domain}</td>
                    <td className="py-2.5 text-[#2563EB]">{item.ip || 'Unavailable'}</td>
                    <td className="py-2.5 text-[#64748B]">{item.country || 'Unavailable'}</td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.reputation === 'Malicious' ? 'bg-red-50 text-[#DC2626] border border-red-200' : (
                          item.reputation === 'Suspicious' ? 'bg-amber-50 text-[#F59E0B] border border-amber-200' : 'bg-emerald-50 text-[#16A34A] border border-emerald-200'
                        )
                      }`}>
                        {item.reputation}
                      </span>
                    </td>
                    <td className="py-2.5 text-[#64748B]">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent'}
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => handleLoadHistoricalTrace(item.id)}
                        className="px-2.5 py-1 rounded-full bg-[#F5F9FF] hover:bg-[#DBEAFE] border border-[#E2E8F0] text-[#2563EB] text-[10px] font-semibold transition-colors cursor-pointer"
                      >
                        Load Dossier
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. ACTIVE TRACE DOSSIER PRESENTATION */}
      {traceResult && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* STEP 2: DOMAIN EXTRACTION METRIC ROW */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm space-y-1">
              <span className="text-[10px] text-[#64748B] uppercase font-semibold">Extracted Domain</span>
              <div className="text-sm font-bold text-[#111827] truncate">
                {traceResult.hostname}
              </div>
              <span className="text-[10px] text-[#64748B] block truncate">
                Host Target
              </span>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm space-y-1">
              <span className="text-[10px] text-[#64748B] uppercase font-semibold">Subdomain</span>
              <div className="text-sm font-bold text-[#2563EB] truncate">
                {traceResult.domain_components?.subdomain || 'None (Apex Domain)'}
              </div>
              <span className="text-[10px] text-[#64748B] block truncate">
                Prefix Scope
              </span>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm space-y-1">
              <span className="text-[10px] text-[#64748B] uppercase font-semibold">Top-Level Domain (TLD)</span>
              <div className="text-sm font-bold text-[#1E40AF] truncate">
                {traceResult.domain_components?.tld || '.com'}
              </div>
              <span className="text-[10px] text-[#64748B] block truncate">
                Root Registry
              </span>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm space-y-1">
              <span className="text-[10px] text-[#64748B] uppercase font-semibold">Resolved Primary IP</span>
              <div className="text-sm font-bold text-[#16A34A] truncate">
                {traceResult.ip_intelligence?.ip || 'Unavailable'}
              </div>
              <span className="text-[10px] text-[#64748B] block truncate">
                Routing Destination
              </span>
            </div>
          </div>

          {/* STEP 3 & 4: INTERACTIVE WORLD MAP & IP NETWORK */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* World Map */}
            <PhishTraceMap
              location={traceResult.ip_intelligence}
              ip={traceResult.ip_intelligence?.ip}
              isp={traceResult.ip_intelligence?.isp}
              org={traceResult.ip_intelligence?.org}
              asn={traceResult.ip_intelligence?.asn}
            />

            {/* Network & ASN Telemetry */}
            <div className="rounded-2xl bg-white border border-[#E2E8F0] shadow-sm p-5 sm:p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                <h3 className="text-sm font-semibold text-[#111827] font-mono flex items-center gap-2">
                  <Server className="w-4 h-4 text-[#2563EB]" />
                  <span>Network & Autonomous System Telemetry</span>
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-[#DBEAFE] border border-[#BFDBFE] text-[#2563EB] font-semibold">
                  BGP Routing
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3.5 rounded-xl bg-[#F5F9FF] border border-[#E2E8F0] space-y-1">
                  <span className="text-[10px] text-[#64748B] uppercase">Autonomous System</span>
                  <div className="text-sm font-bold text-[#2563EB]">
                    {traceResult.ip_intelligence?.asn || 'Unavailable'}
                  </div>
                  <span className="text-[10px] text-[#64748B] block truncate">
                    {traceResult.ip_intelligence?.as_name || 'Autonomous Network'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F5F9FF] border border-[#E2E8F0] space-y-1">
                  <span className="text-[10px] text-[#64748B] uppercase">Internet Service Provider</span>
                  <div className="text-sm font-bold text-[#111827] truncate">
                    {traceResult.ip_intelligence?.isp || 'Unknown ISP'}
                  </div>
                  <span className="text-[10px] text-[#64748B] block truncate">
                    Transit Network
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F5F9FF] border border-[#E2E8F0] space-y-1">
                  <span className="text-[10px] text-[#64748B] uppercase">Hosting Provider / Organization</span>
                  <div className="text-sm font-bold text-[#111827] truncate">
                    {traceResult.ip_intelligence?.org || 'Unknown Org'}
                  </div>
                  <span className="text-[10px] text-[#64748B] block truncate">
                    Datacenter Entity
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F5F9FF] border border-[#E2E8F0] space-y-1">
                  <span className="text-[10px] text-[#64748B] uppercase">Proxy / VPN / CDN Mask</span>
                  <div className="text-sm font-bold text-[#111827] truncate">
                    {traceResult.ip_intelligence?.is_cdn_or_proxy ? (
                      <span className="text-[#F59E0B]">Active ({traceResult.ip_intelligence.cdn_provider})</span>
                    ) : (
                      <span className="text-[#16A34A]">Direct Hosting (No CDN Mask)</span>
                    )}
                  </div>
                  <span className="text-[10px] text-[#64748B] block truncate">
                    Edge Shield Detection
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F5F9FF] border border-[#E2E8F0] flex items-center justify-between text-xs font-mono">
                <span className="text-[#64748B]">Query Roundtrip Latency:</span>
                <span className="text-[#16A34A] font-bold">{traceResult.latency_ms} ms</span>
              </div>
            </div>
          </div>

          {/* STEP 5: IP REPUTATION ANALYSIS */}
          <IPReputationCard
            threatIntel={traceResult.threat_intelligence}
            network={traceResult.ip_intelligence}
            ip={traceResult.ip_intelligence?.ip}
          />

          {/* STEP 6: INFRASTRUCTURE DETAILS (DNS, SSL, RDAP) */}
          <InfrastructureDetails
            dns={traceResult.dns}
            ssl={traceResult.ssl_certificate}
            registration={traceResult.domain_registration}
            network={traceResult.ip_intelligence}
          />

          {/* STEP 7: INFRASTRUCTURE RELATIONSHIP MAPPING (CYTOSCAPE GRAPH) */}
          {traceResult.infrastructure_relationships && (
            <InfrastructureGraph
              elements={traceResult.infrastructure_relationships.cytoscape_elements}
              summary={traceResult.infrastructure_relationships.summary}
              disclaimer={traceResult.infrastructure_relationships.disclaimer}
            />
          )}

          {/* STEP 8: FINAL INTELLIGENCE REPORT & EXPORT */}
          <IntelligenceReport dossier={traceResult} />
        </div>
      )}

      {/* Empty State / Call to Action */}
      {!traceResult && !isTracing && (
        <div className="p-12 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#DBEAFE] border border-[#BFDBFE] flex items-center justify-center mx-auto text-[#2563EB]">
            <Compass className="w-7 h-7 stroke-[1.8]" />
          </div>
          <h3 className="text-lg font-bold text-[#111827]">
            No Target Infrastructure Analyzed Yet
          </h3>
          <p className="text-xs sm:text-sm text-[#64748B] max-w-md mx-auto leading-relaxed">
            Enter a suspicious link above or select a sample target to initiate full infrastructure reconnaissance, world mapping, threat intelligence evaluation, and relational graph analysis.
          </p>
        </div>
      )}
    </div>
  );
}
