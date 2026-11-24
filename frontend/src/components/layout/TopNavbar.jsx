import React, { useState, useEffect } from 'react';
import { Menu, CheckCircle2, Shield, ArrowRight } from 'lucide-react';
import ThemeToggle from '../common/ThemeToggle';
import { api } from '../../services/api';

export default function TopNavbar({ 
  activePage, 
  setActivePage, 
  isCollapsed, 
  setIsMobileOpen,
  theme,
  toggleTheme,
  openAboutModal
}) {
  const [isBackendOnline, setIsBackendOnline] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      const online = await api.checkHealth();
      setIsBackendOnline(online);
    };
    checkStatus();
    const interval = setInterval(checkStatus, 20000);
    return () => clearInterval(interval);
  }, []);

  const pageMeta = {
    dashboard: { title: 'Dashboard', breadcrumb: 'OVERVIEW' },
    scanner: { title: 'URL Scanner Workstation', breadcrumb: 'MODULE 1: URL & WEB' },
    'qr-scanner': { title: 'QR Code Scam Detector', breadcrumb: 'MODULE 1B: QR CODE' },
    'investment-scanner': { title: 'Investment & Financial Scam Detector', breadcrumb: 'MODULE 4: FINANCIAL' },
    'phish-trace': { title: 'Attacker Infrastructure & Geolocation Intelligence', breadcrumb: 'PHISH TRACE' },
    results: { title: 'Threat Fingerprint Report', breadcrumb: 'AUDIT REPORT' },
    history: { title: 'Scan History & Multi-Channel Audit Trail', breadcrumb: 'RECORDS' },
    'threat-intel': { title: 'Threat Intelligence Feeds', breadcrumb: 'INTELLIGENCE' },
    analytics: { title: 'Detection Analytics & Insights', breadcrumb: 'INSIGHTS' },
    learn: { title: 'Scam Awareness Academy & IQ Quiz', breadcrumb: 'ACADEMY' },
    settings: { title: 'Settings & Appearance', breadcrumb: 'CONFIG' },
    about: { title: 'System Architecture & ML', breadcrumb: 'DOCS' }
  };

  const current = pageMeta[activePage] || { title: 'Security Console', breadcrumb: 'SECURITY' };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] px-4 sm:px-6 flex items-center justify-between gap-4 select-none">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex min-w-0 flex-1 items-center gap-3 md:flex-none">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="lg:hidden p-2 rounded-full text-[#64748B] hover:text-[#111827] hover:bg-[#F5F9FF] transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex min-w-0 flex-col">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-[#2563EB] uppercase tracking-wider font-semibold">
              {current.breadcrumb}
            </span>
          </div>
          <h1 className="text-sm sm:text-base font-semibold text-[#111827] tracking-tight truncate">
            {current.title}
          </h1>
        </div>
      </div>

      <div className="flex-1" />

      {/* Right: Engine Status & Actions */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={() => setActivePage('about')}
          className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono border transition-all duration-150 cursor-pointer topnav-about-btn ${
            activePage === 'about'
              ? 'bg-[#DBEAFE]/80 text-[#2563EB] border-[#BFDBFE] font-medium'
              : 'bg-[#F5F9FF] hover:bg-[#EFF6FF] border-[#E2E8F0] hover:border-[#2563EB]/40 text-[#64748B] hover:text-[#2563EB]'
          }`}
          title="About the Project & Architecture"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
          <span>About Project</span>
        </button>

        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#F5F9FF] border border-[#E2E8F0] text-[11px] font-mono text-[#64748B] topnav-engine-status">
          <span className={`w-1.5 h-1.5 rounded-full ${isBackendOnline ? 'bg-[#16A34A]' : 'bg-[#F59E0B]'}`} />
          <span className="hidden sm:inline">
            Engine: {isBackendOnline ? 'Online' : 'Checking'}
          </span>
        </div>

        {/* On phones the theme toggle lives in the sidebar; dropping it here leaves room for the title and account buttons. */}
        {toggleTheme && <span className="hidden sm:inline-flex"><ThemeToggle theme={theme} toggleTheme={toggleTheme} size={34} /></span>}
      </div>
    </header>
  );
}
