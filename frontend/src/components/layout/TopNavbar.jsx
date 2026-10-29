import React, { useState, useEffect } from 'react';
import { Menu, Search, CheckCircle2, Shield, Sun, Moon, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';

export default function TopNavbar({ 
  activePage, 
  setActivePage, 
  isCollapsed, 
  setIsMobileOpen,
  onQuickScan,
  theme,
  toggleTheme
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
    dashboard: { title: 'Security Overview', breadcrumb: 'CONSOLE' },
    scanner: { title: 'URL Scanner Workstation', breadcrumb: 'WORKSTATION' },
    results: { title: 'Threat Fingerprint Report', breadcrumb: 'AUDIT REPORT' },
    history: { title: 'Scan History & Audit Trail', breadcrumb: 'RECORDS' },
    'threat-intel': { title: 'Threat Intelligence Feeds', breadcrumb: 'INTELLIGENCE' },
    analytics: { title: 'Detection Analytics & Insights', breadcrumb: 'INSIGHTS' },
    learn: { title: 'Threat Guide & Academy', breadcrumb: 'EDUCATION' },
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
    <header className="sticky top-0 z-30 h-16 bg-[#101012] border-b border-[#29292D] px-4 sm:px-6 flex items-center justify-between gap-4 select-none">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="lg:hidden p-2 rounded-[8px] text-[#92929A] hover:text-[#F5F5F5] hover:bg-[#151517] transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-[#686870] uppercase tracking-wider">
              {current.breadcrumb}
            </span>
          </div>
          <h1 className="text-sm sm:text-base font-semibold text-[#F5F5F5] truncate">
            {current.title}
          </h1>
        </div>
      </div>

      {/* Center: Quick Scanner Bar */}
      <div className="hidden md:flex flex-1 max-w-md mx-4">
        <form onSubmit={handleQuickSubmit} className="relative w-full">
          <Search className="w-4 h-4 text-[#686870] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={quickSearch}
            onChange={(e) => setQuickSearch(e.target.value)}
            placeholder="Quick URL scan..."
            className="w-full pl-9 pr-14 py-2 bg-[#151517] border border-[#29292D] rounded-[10px] text-xs font-mono text-[#F5F5F5] placeholder-[#686870] focus:outline-none focus:border-[#FF6B35] transition-all"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-1 bg-[#101012] hover:bg-[#1B1B1F] border border-[#29292D] text-[#92929A] hover:text-[#F5F5F5] text-[10px] font-mono rounded-[6px] transition-colors cursor-pointer"
          >
            Scan
          </button>
        </form>
      </div>

      {/* Right: Engine Status & Actions */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-[8px] bg-[#151517] border border-[#29292D] text-xs font-mono">
          <span className={`w-2 h-2 rounded-full ${isBackendOnline ? 'bg-[#35C98A]' : 'bg-[#F2B84B]'}`} />
          <span className="hidden sm:inline text-[#92929A] text-[11px]">
            Engine: {isBackendOnline ? 'Online' : 'Checking'}
          </span>
        </div>

        {toggleTheme && (
          <button
            onClick={(e) => toggleTheme(e)}
            className="p-2 rounded-[8px] bg-[#151517] border border-[#29292D] text-[#92929A] hover:text-[#F5F5F5] transition-colors cursor-pointer relative overflow-hidden group"
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            aria-label="Toggle theme"
          >
            <span className="relative flex items-center justify-center w-4 h-4">
              <Sun 
                className={`w-4 h-4 text-[#FF6B35] absolute transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  theme === 'dark' 
                    ? 'rotate-0 scale-100 opacity-100' 
                    : 'rotate-90 scale-0 opacity-0 pointer-events-none'
                }`} 
              />
              <Moon 
                className={`w-4 h-4 text-[#2563EB] absolute transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  theme === 'light' 
                    ? 'rotate-0 scale-100 opacity-100' 
                    : '-rotate-90 scale-0 opacity-0 pointer-events-none'
                }`} 
              />
            </span>
          </button>
        )}
      </div>
    </header>
  );
}
