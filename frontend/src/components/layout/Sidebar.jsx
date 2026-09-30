import React from 'react';
import { 
  ShieldAlert, Home as HomeIcon, Search, History as ClockIcon, 
  Crosshair, BarChart2, BookOpen, Settings, ChevronLeft, ChevronRight, 
  LayoutGrid, User, Shield, Lock, ExternalLink
} from 'lucide-react';

export default function Sidebar({ 
  activePage, 
  setActivePage, 
  isCollapsed, 
  setIsCollapsed, 
  isMobileOpen, 
  setIsMobileOpen 
}) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: HomeIcon, badge: null },
    { id: 'scanner', label: 'URL Scanner', icon: Search, badge: null },
    { id: 'history', label: 'Scan History', icon: ClockIcon, badge: null },
    { id: 'threat-intel', label: 'Threat Intelligence', icon: Crosshair, badge: 'LIVE' },
    { id: 'analytics', label: 'Analytics', icon: BarChart2, badge: null },
    { id: 'learn', label: 'Education / Learn', icon: BookOpen, badge: null },
    { id: 'settings', label: 'Settings', icon: Settings, badge: null },
  ];

  const handleNavClick = (id) => {
    setActivePage(id);
    if (setIsMobileOpen) setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#07090E] border-r border-[#1C2230] transition-all duration-300 ease-in-out
          ${isCollapsed ? 'w-20' : 'w-64'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-[#1C2230]">
          <div 
            onClick={() => handleNavClick('dashboard')}
            className="flex items-center gap-3 cursor-pointer group overflow-hidden"
          >
            <div className="w-9 h-9 rounded-xl bg-orange-950/40 border border-orange-500/50 flex items-center justify-center shrink-0 group-hover:border-orange-400 group-hover:shadow-[0_0_15px_rgba(255,107,0,0.3)] transition-all">
              <ShieldAlert className="w-5 h-5 text-[#FF6B00] group-hover:scale-105 transition-transform" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-extrabold text-sm tracking-wider text-white">
                  CATCH THE <span className="text-[#FF6B00]">PHISH</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono tracking-tight">
                  Security Operations
                </span>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4 text-orange-400" /> : <ChevronLeft className="w-4 h-4 text-slate-400" />}
          </button>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group relative cursor-pointer ${
                  isActive
                    ? 'bg-[#FF6B00]/10 text-[#FFA043] border border-[#FF6B00] font-semibold shadow-[0_0_15px_rgba(255,107,0,0.18)]'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/40 border border-transparent'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-[#FF6B00]' : 'text-slate-400 group-hover:text-slate-200'}`} />
                {!isCollapsed && (
                  <span className="flex-1 text-left truncate">{item.label}</span>
                )}
                {!isCollapsed && item.badge && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-orange-950/80 text-orange-400 border border-orange-800/60">
                    {item.badge}
                  </span>
                )}

                {/* Collapsed Indicator */}
                {isCollapsed && isActive && (
                  <div className="absolute right-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#FF6B00]" />
                )}
              </button>
            );
          })}

          {/* Quick link to Landing Page / Overview */}
          <div className="pt-3 mt-3 border-t border-[#1C2230]">
            <button
              onClick={() => handleNavClick('home')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                activePage === 'home'
                  ? 'bg-[#FF6B00]/10 text-[#FFA043] border border-[#FF6B00] font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
              }`}
              title="Landing / Overview"
            >
              <LayoutGrid className="w-4 h-4 shrink-0 text-slate-400" />
              {!isCollapsed && <span>Landing / Overview</span>}
            </button>
          </div>
        </div>

        {/* User Profile & Platform Info */}
        <div className="p-3 border-t border-[#1C2230] bg-[#05070B]">
          <div className={`p-2.5 rounded-xl bg-[#090C13] border border-[#1C2230] ${isCollapsed ? 'flex justify-center' : ''}`}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-orange-950/70 border border-orange-500/50 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-orange-400" />
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-white truncate">Security Operator</div>
                  <div className="text-[11px] text-orange-400 font-mono">
                    SOC Level 1
                  </div>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <div className="mt-2.5 p-1.5 rounded-lg bg-black/60 border border-orange-500/30 flex items-center justify-center gap-1.5 text-[11px] font-mono text-orange-400">
                <Shield className="w-3.5 h-3.5 text-orange-400" />
                <span>Zero-Execution</span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
