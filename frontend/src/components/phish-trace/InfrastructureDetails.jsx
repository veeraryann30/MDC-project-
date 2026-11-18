import React, { useState } from 'react';
import { 
  Server, Shield, Lock, Clock, Calendar, CheckCircle2, 
  AlertTriangle, ChevronDown, ChevronUp, Layers, Cpu, Globe, Key 
} from 'lucide-react';

/**
 * INFRASTRUCTURE DETAILS COMPONENT
 * Displays deep technical DNS, SSL/TLS X.509 certificate, and ICANN RDAP registration intelligence.
 */
export default function InfrastructureDetails({ dns, ssl, registration, network }) {
  const [activeTab, setActiveTab] = useState('ssl'); // 'ssl' | 'dns' | 'rdap'

  const dnsData = dns || {};
  const sslData = ssl || {};
  const regData = registration || {};

  const tabs = [
    { id: 'ssl', label: 'SSL / TLS Certificate', icon: Lock, badge: sslData.has_ssl ? 'Active' : 'No SSL' },
    { id: 'dns', label: 'DNS Telemetry', icon: Server, badge: `${(dnsData.a_records || []).length + (dnsData.ns_records || []).length} Records` },
    { id: 'rdap', label: 'Domain Registration (RDAP)', icon: Calendar, badge: regData.domain_age_readable ? regData.domain_age_readable.split(' ')[0] : 'RDAP' }
  ];

  return (
    <div className="rounded-2xl bg-white border border-[#E2E8F0] shadow-sm overflow-hidden">
      {/* Tab Navigation Header */}
      <div className="flex border-b border-[#E2E8F0] bg-[#F5F9FF] overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 px-5 py-3.5 text-xs font-mono font-medium transition-all whitespace-nowrap cursor-pointer border-b-2 ${
                isActive
                  ? 'border-[#2563EB] text-[#2563EB] bg-white font-semibold'
                  : 'border-transparent text-[#64748B] hover:text-[#111827] hover:bg-white/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#2563EB]' : 'text-[#64748B]'}`} />
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                isActive ? 'bg-[#DBEAFE] text-[#2563EB]' : 'bg-slate-100 text-[#64748B]'
              }`}>
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      <div className="p-5 sm:p-6 bg-white text-[#111827]">
        {/* TAB 1: SSL CERTIFICATE */}
        {activeTab === 'ssl' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E2E8F0]">
              <div>
                <h4 className="text-sm font-semibold text-[#111827] flex items-center gap-2">
                  <span>SSL / TLS Inspection</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    sslData.status === 'Valid & Trusted'
                      ? 'bg-emerald-50 text-[#16A34A] border border-emerald-200'
                      : sslData.has_ssl
                      ? 'bg-amber-50 text-[#F59E0B] border border-amber-200'
                      : 'bg-red-50 text-[#DC2626] border border-red-200'
                  }`}>
                    {sslData.status || 'No SSL'}
                  </span>
                </h4>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Extracted via native Zero-Execution TLS SNI handshake on port 443.
                </p>
              </div>

              {sslData.days_remaining !== null && sslData.days_remaining !== undefined && (
                <div className="text-xs font-mono text-right">
                  <span className="text-[#64748B]">Expires in: </span>
                  <strong className={sslData.days_remaining < 15 ? 'text-[#DC2626]' : 'text-[#16A34A]'}>
                    {sslData.days_remaining} days
                  </strong>
                </div>
              )}
            </div>

            {sslData.has_ssl ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-4 rounded-xl bg-[#F5F9FF] border border-[#E2E8F0] space-y-2">
                  <span className="text-[10px] text-[#64748B] uppercase font-semibold">Subject & Entity</span>
                  <div className="text-sm font-bold text-[#111827]">{sslData.subject || 'Unavailable'}</div>
                  <div className="text-[#64748B]">Organization: {sslData.subject_org || 'Unavailable'}</div>
                  <div className="text-[#64748B]">Cipher: {sslData.cipher || 'Standard TLS'}</div>
                </div>

                <div className="p-4 rounded-xl bg-[#F5F9FF] border border-[#E2E8F0] space-y-2">
                  <span className="text-[10px] text-[#64748B] uppercase font-semibold">Certificate Authority (Issuer)</span>
                  <div className="text-sm font-bold text-[#2563EB]">{sslData.issuer || 'Unavailable'}</div>
                  <div className="text-[#64748B]">Issuer Org: {sslData.issuer_org || 'Unavailable'}</div>
                  <div className="text-[#64748B]">Serial: {sslData.serial_number || 'Unavailable'}</div>
                </div>

                <div className="p-4 rounded-xl bg-[#F5F9FF] border border-[#E2E8F0] space-y-2 md:col-span-2">
                  <span className="text-[10px] text-[#64748B] uppercase font-semibold">Validity Lifespan</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[#111827]">
                    <div>Valid From: <strong className="text-[#64748B]">{sslData.valid_from || 'Unavailable'}</strong></div>
                    <div>Valid Until: <strong className="text-[#64748B]">{sslData.valid_to || 'Unavailable'}</strong></div>
                  </div>
                  {sslData.sans && sslData.sans.length > 0 && (
                    <div className="pt-2 border-t border-[#E2E8F0]">
                      <span className="text-[10px] text-[#64748B] uppercase block mb-1 font-semibold">
                        Subject Alternative Names (SANs):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {sslData.sans.map((s, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-full bg-white border border-[#E2E8F0] text-[10px] text-[#64748B]">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-xl bg-red-50 border border-red-200 text-xs text-[#DC2626] space-y-1">
                <div className="font-semibold">No Active SSL/TLS Certificate Presented</div>
                <p className="text-xs text-[#64748B]">
                  The target server did not respond to TLS negotiation on port 443 or refused encrypted connections.
                  Plaintext HTTP links represent a major credential theft vector.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DNS TELEMETRY */}
        {activeTab === 'dns' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <h4 className="text-sm font-semibold text-[#111827] font-mono">
                Authoritative DNS Records
              </h4>
              <span className="text-xs font-mono font-semibold text-[#16A34A] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Status: {dnsData.status || 'Resolved'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              {/* A Records */}
              <div className="p-4 rounded-xl bg-[#F5F9FF] border border-[#E2E8F0] space-y-2">
                <span className="text-[10px] text-[#64748B] uppercase font-semibold">A Records (IPv4)</span>
                {dnsData.a_records && dnsData.a_records.length > 0 ? (
                  <ul className="space-y-1">
                    {dnsData.a_records.map((ip, i) => (
                      <li key={i} className="text-[#2563EB] font-semibold">{ip}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-[#64748B]">No IPv4 records returned</div>
                )}
              </div>

              {/* Nameservers */}
              <div className="p-4 rounded-xl bg-[#F5F9FF] border border-[#E2E8F0] space-y-2">
                <span className="text-[10px] text-[#64748B] uppercase font-semibold">Authoritative Nameservers (NS)</span>
                {dnsData.ns_records && dnsData.ns_records.length > 0 ? (
                  <ul className="space-y-1">
                    {dnsData.ns_records.map((ns, i) => (
                      <li key={i} className="text-[#16A34A] font-semibold">{ns}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-[#64748B]">No NS records returned</div>
                )}
              </div>

              {/* MX Records */}
              <div className="p-4 rounded-xl bg-[#F5F9FF] border border-[#E2E8F0] space-y-2">
                <span className="text-[10px] text-[#64748B] uppercase font-semibold">Mail Exchange (MX)</span>
                {dnsData.mx_records && dnsData.mx_records.length > 0 ? (
                  <ul className="space-y-1">
                    {dnsData.mx_records.map((mx, i) => (
                      <li key={i} className="text-[#111827]">{mx}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-[#64748B]">No MX records configured</div>
                )}
              </div>

              {/* CNAME & TXT */}
              <div className="p-4 rounded-xl bg-[#F5F9FF] border border-[#E2E8F0] space-y-2">
                <span className="text-[10px] text-[#64748B] uppercase font-semibold">CNAME Aliases</span>
                {dnsData.cname_records && dnsData.cname_records.length > 0 ? (
                  <ul className="space-y-1">
                    {dnsData.cname_records.map((cn, i) => (
                      <li key={i} className="text-[#111827]">{cn}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-[#64748B]">Direct host canonical mapping</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: RDAP REGISTRATION */}
        {activeTab === 'rdap' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <h4 className="text-sm font-semibold text-[#111827] font-mono">
                ICANN RDAP Registration Telemetry
              </h4>
              <span className="text-xs font-mono text-[#64748B]">
                Protocol: RDAP (Modern WHOIS)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3.5 rounded-xl bg-[#F5F9FF] border border-[#E2E8F0] space-y-1">
                <span className="text-[10px] text-[#64748B] uppercase font-semibold">Registrar</span>
                <div className="text-sm font-bold text-[#111827] truncate">
                  {regData.registrar || 'Unavailable or Private'}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F5F9FF] border border-[#E2E8F0] space-y-1">
                <span className="text-[10px] text-[#64748B] uppercase font-semibold">Domain Age</span>
                <div className="text-sm font-bold text-[#16A34A]">
                  {regData.domain_age_readable || 'Unavailable'}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F5F9FF] border border-[#E2E8F0] space-y-1">
                <span className="text-[10px] text-[#64748B] uppercase font-semibold">Status</span>
                <div className="text-sm font-bold text-[#111827]">
                  {regData.status || 'Active'}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F5F9FF] border border-[#E2E8F0] space-y-1 md:col-span-3">
                <span className="text-[10px] text-[#64748B] uppercase font-semibold">Registration Lifecycle Events</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[#64748B] pt-1">
                  <div>Created: <strong className="text-[#111827]">{regData.created_date ? new Date(regData.created_date).toLocaleDateString() : 'Unavailable'}</strong></div>
                  <div>Last Changed: <strong className="text-[#111827]">{regData.updated_date ? new Date(regData.updated_date).toLocaleDateString() : 'Unavailable'}</strong></div>
                  <div>Expires: <strong className="text-[#111827]">{regData.expires_date ? new Date(regData.expires_date).toLocaleDateString() : 'Unavailable'}</strong></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
