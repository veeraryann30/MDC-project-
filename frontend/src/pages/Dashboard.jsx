import React, { useState, useEffect } from 'react';
import { Link2, Mail, QrCode, MessageSquare, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

/**
 * Dashboard (Services Hub)
 * Premium Apple-inspired Services Hub:
 * - 4 core services: URL, Email, QR Code, Message Scanner
 * - White cards on secondary light background #F5F9FF
 * - Minimal icons, service titles, descriptions, and circular arrow action buttons
 * - Subtle hover elevation and thin blue borders on hover
 */
export default function Dashboard({ setActivePage }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 40);
    return () => clearTimeout(t);
  }, []);

  const services = [
    {
      id: 'url-scanner',
      title: 'URL Threat Scanner',
      badge: 'MODULE 01',
      description: 'Analyze any web link and detect phishing, credential harvesters, or malicious servers.',
      icon: Link2,
      route: 'scanner',
    },
    {
      id: 'email-scanner',
      title: 'Email Scam Forensics',
      badge: 'MODULE 02',
      description: 'Verify inbound emails for spoofed sender headers, deceptive domains, and scam lures.',
      icon: Mail,
      route: 'email-scanner',
    },
    {
      id: 'qr-scanner',
      title: 'QR Code Detector',
      badge: 'MODULE 03',
      description: 'Safely inspect QR codes from images or PDF invoices before loading on your devices.',
      icon: QrCode,
      route: 'qr-scanner',
    },
    {
      id: 'message-scanner',
      title: 'Message Scam Detector',
      badge: 'MODULE 04',
      description: 'Evaluate SMS, WhatsApp, and chat messages for banking KYC and financial fraud patterns.',
      icon: MessageSquare,
      route: 'message-scanner',
    },
  ];

  return (
    <div className="relative min-h-[calc(100vh-64px)] flex flex-col justify-center py-10 sm:py-14 px-4 sm:px-6 lg:px-8 selection:bg-[#2563EB] selection:text-white">
      {/* Services Hub Content */}
      <div className="relative z-10 max-w-6xl mx-auto w-full flex flex-col items-center">
        {/* Header Section */}
        <div 
          className={`text-center max-w-3xl mx-auto mb-10 sm:mb-14 space-y-3 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            mounted 
              ? 'opacity-100 translate-y-0 filter-none' 
              : 'opacity-0 translate-y-6 blur-[2px]'
          }`}
        >
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#DBEAFE] text-xs font-mono font-semibold tracking-wider text-[#2563EB] shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>SECURITY SERVICES</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#111827] leading-tight">
            Protection Suite
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-[#64748B] leading-relaxed max-w-xl mx-auto font-sans">
            A comprehensive suite of explainable static inspection tools to detect and intercept digital fraud.
          </p>
        </div>

        {/* 2x2 Services Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
          {services.map((service, index) => {
            const Icon = service.icon;
            const delay = index * 80 + 50;
            return (
              <div
                key={service.id}
                onClick={() => setActivePage(service.route)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActivePage(service.route);
                  }
                }}
                role="button"
                tabIndex={0}
                style={{
                  transitionDelay: mounted ? `${delay}ms` : '0ms',
                }}
                className={`group relative flex flex-col justify-between p-7 sm:p-8 rounded-2xl bg-white border border-[#E2E8F0] hover:border-[#2563EB]/40 transition-all duration-300 ease-out cursor-pointer shadow-sm hover:shadow-[0_12px_32px_rgba(37,99,235,0.08)] hover:-translate-y-1 select-none dashboard-service-card ${
                  mounted
                    ? 'opacity-100 translate-y-0 filter-none'
                    : 'opacity-0 translate-y-6 blur-[3px]'
                }`}
              >
                <div>
                  {/* Minimal Icon Container */}
                  <div className="w-12 h-12 rounded-xl bg-[#F5F9FF] border border-[#DBEAFE] flex items-center justify-center text-[#2563EB] mb-5 group-hover:bg-[#2563EB] group-hover:text-white transition-all duration-200 dashboard-icon-box">
                    <Icon className="w-5 h-5 stroke-[2]" />
                  </div>

                  <span className="text-[10px] font-mono text-[#2563EB] font-bold tracking-wider uppercase">
                    {service.badge}
                  </span>

                  {/* Service Name */}
                  <h2 className="text-xl font-bold text-[#111827] mt-1 tracking-tight group-hover:text-[#2563EB] transition-colors">
                    {service.title}
                  </h2>

                  <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed mt-2.5">
                    {service.description}
                  </p>
                </div>

                {/* Description and Action Arrow */}
                <div className="flex items-center justify-between gap-4 mt-6 pt-4 border-t border-[#E2E8F0]">
                  <span className="text-xs font-semibold text-[#2563EB]">
                    Launch Workstation
                  </span>
                  <div 
                    className="w-9 h-9 rounded-full bg-[#F5F9FF] border border-[#E2E8F0] flex items-center justify-center text-[#2563EB] group-hover:bg-[#2563EB] group-hover:text-white group-hover:border-[#2563EB] transition-all duration-200 shrink-0 dashboard-arrow-btn"
                    aria-hidden="true"
                  >
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}