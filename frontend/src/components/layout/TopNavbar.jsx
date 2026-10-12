import React, { useState, useEffect, useRef } from 'react';
import { 
  Menu, Bell, Search, ShieldAlert, CheckCircle2, 
  ExternalLink, Sparkles, Terminal, X, ArrowRight, Shield, Sun, Moon 
} from 'lucide-react';
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
  const [showNotifications, setShowNotifications] = useState(false);
  const [quickSearch, setQuickSearch] = useState('');
  const notificationRef = useRef(null);

  useEffect(() => {
    const checkStatus = async () => {
      const online = await api.checkHealth();
      setIsBackendOnline(online);
    };
    checkStatus();
    const interval = setInterval(checkStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  // Close notifications on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const pageTitles = {
    home: { title: 'Security Overview', breadcrumb: 'OVERVIEW' },
    dashboard: { title: 'Security Dashboard', breadcrumb: 'SOC TELEMETRY' },
    scanner: { title: 'URL Analysis Workstation', breadcrumb: 'SCANNER' },
    results: { title: 'Threat Intelligence Report', breadcrumb: 'AUDIT REPORT' },
    history: { title: 'Audit Scan History', breadcrumb: 'RECORDS' },
    'threat-intel': { title: 'Threat Intelligence Feeds', breadcrumb: 'INTELLIGENCE' },
    analytics: { title: 'Detection Analytics', breadcrumb: 'METRICS' },
    learn: { title: 'Phishing Awareness Academy', breadcrumb: 'EDUCATION' },
    settings: { title: 'System Settings', breadcrumb: 'CONFIGURATION' }
  };

  const currentMeta = pageTitles[activePage] || { title: 'Security Operations', breadcrumb: 'CONSOLE' };

  const handleQuickSearchSubmit = (e) => {
    e.preventDefault();
    if (!quickSearch.trim()) return;
    if (onQuickScan) {
      onQuickScan(quickSearch.trim());
    } else {
      setActivePage('scanner');
    }
    setQuickSearch('');
  };

  const notifications = [
    {
      id: 1,
      type: 'threat',
      title: 'Phishing Vector Blocked',
      desc: 'paypa1-verification.xyz was flagged with a risk score of 91/100.',
      time: '12m ago'
    },
    {
      id: 2,
      type: 'system',
      title: 'Zero-Execution Shield Active',
      desc: 'Static heuristic engine operating with 34 feature detectors.',
      time: '1h ago'
    },
    {
      id: 3,
      type: 'update',
      title: 'Brand Watchlist Synchronized',
      desc: 'Updated 24 target financial and enterprise brand signatures.',
      time: '3h ago'
    }
  ];

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#07090E]/95 backdrop-blur-md border-b border-[#1C2230] px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
            {currentMeta.breadcrumb}
          </span>
          <h1 className="text-sm sm:text-base font-bold text-white tracking-tight truncate max-w-[200px] sm:max-w-xs md:max-w-md">
            {currentMeta.title}
          </h1>
        </div>
      </div>

      {/* Center: Quick Scan Search Input */}
      <form onSubmit={handleQuickSearchSubmit} className="hidden md:flex flex-1 max-w-md mx-4">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={quickSearch}
            onChange={(e) => setQuickSearch(e.target.value)}
            placeholder="Quick scan URL (e.g., https://example.com)..."
            className="w-full pl-9 pr-14 py-1.5 bg-[#090C13] border border-[#1C2230] rounded-xl text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]/40 transition-all"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FF6B00] text-black hover:bg-[#FFA043] transition-colors"
          >
            SCAN
          </button>
        </div>
      </form>

      {/* Right: Status Indicators, Notifications, Scan Button */}
      <div className="flex items-center gap-2.5">
        {/* Engine Status Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[#090C13] border border-[#1C2230] text-[11px] font-mono">
          <span className={`w-2 h-2 rounded-full ${isBackendOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          <span className="text-slate-400">
            Engine: <strong className={isBackendOnline ? 'text-emerald-400' : 'text-amber-400'}>
              {isBackendOnline ? 'LIVE' : 'CONNECTING'}
            </strong>
          </span>
        </div>

        {/* Zero-Execution Guard Badge */}
        <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 border border-orange-500/40 text-[11px] font-mono text-orange-400">
          <Shield className="w-3.5 h-3.5 text-orange-400" />
          <span>Zero-Execution Guard</span>
        </div>

        {/* Interactive Theme Toggle Button (Dark Tactical Orange <-> Light Cyber Blue & White) */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/70 border border-transparent hover:border-[#1C2230] transition-all cursor-pointer flex items-center justify-center group relative"
          title={theme === 'light' ? 'Switch to Dark Mode (Tactical Cyber)' : 'Switch to Light Mode (Blue & White)'}
          aria-label="Toggle color theme"
        >
          {theme === 'light' ? (
            <Moon className="w-4 h-4 text-blue-600 group-hover:-rotate-12 transition-transform" />
          ) : (
            <Sun className="w-4 h-4 text-orange-400 group-hover:rotate-45 transition-transform" />
          )}
          <span className="sr-only">Toggle theme</span>
        </button>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/70 border border-transparent hover:border-[#1C2230] transition-all relative cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FF6B00] ring-2 ring-[#07090E]" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#0B0F17] border border-orange-500/30 shadow-2xl p-4 z-50 text-xs font-sans">
              <div className="flex items-center justify-between pb-3 border-b border-[#1C2230] mb-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-orange-400" />
                  <span className="font-bold text-white text-sm">Security Alerts & Events</span>
                </div>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2.5 max-h-72 overflow-y-auto">
                {notifications.map((item) => (
                  <div key={item.id} className="p-2.5 rounded-xl bg-[#07090E] border border-[#1C2230] hover:border-orange-500/40 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-white">{item.title}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{item.time}</span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>

              <div className="pt-3 mt-3 border-t border-[#1C2230] text-center">
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    setActivePage('history');
                  }}
                  className="text-orange-400 hover:text-orange-300 text-xs font-semibold"
                >
                  View Full Audit Log →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Primary Scan CTA Button */}
        <button
          onClick={() => setActivePage('scanner')}
          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-black text-xs font-black uppercase tracking-wider shadow-[0_0_15px_rgba(255,107,0,0.35)] transition-all cursor-pointer flex items-center gap-1.5"
        >
          <Shield className="w-3.5 h-3.5 fill-black" />
          <span>SCAN URL</span>
        </button>
      </div>
    </header>
  );
}
