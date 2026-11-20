import React, { useState, useEffect } from 'react';
import { Menu, Search, CheckCircle2, Shield, ArrowRight } from 'lucide-react';
import ThemeToggle from '../common/ThemeToggle';
import { api } from '../../services/api';

export default function TopNavbar({ 
  activePage, 
  setActivePage, 
  isCollapsed, 
  setIsMobileOpen,
  onQuickScan,
  theme,
  toggleTheme,
  openAboutModal
}) {
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const [quickSearch, setQuickSearch] = useState('');

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

  const handleQuickSubmit = (e) => {
    e.preventDefault();
    if (!quickSearch.trim()) return;
    if (onQuickScan) {
      onQuickScan(quickSearch.trim());
    } else {
      setActivePage('scanner');
    }
    setQuickSearch('');
  };

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

      {/* Center: Quick Scanner Bar */}
      <div className="hidden md:flex flex-1 max-w-md mx-4">
        <form onSubmit={handleQuickSubmit} className="relative w-full">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={quickSearch}
            onChange={(e) => setQuickSearch(e.target.value)}
            placeholder="Quick URL scan..."
            className="w-full pl-10 pr-16 py-1.5 bg-[#F5F9FF] border border-[#E2E8F0] rounded-full text-xs font-mono text-[#111827] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#DBEAFE] transition-all"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-[#2563EB] hover:bg-[#1E40AF] text-white font-mono font-medium text-[10px] rounded-full transition-all cursor-pointer shadow-sm"
          >
            Scan
          </button>
        </form>
      </div>

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

        {toggleTheme && <ThemeToggle theme={theme} toggleTheme={toggleTheme} size={34} />}
      </div>
    </header>
  );
}
