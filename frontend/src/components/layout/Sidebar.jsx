import React from 'react';
import { 
  LayoutGrid, Search, Clock, BarChart2, Crosshair, 
  BookOpen, Settings, ChevronLeft, ChevronRight, Globe, ArrowLeft, Sun, Moon
} from 'lucide-react';
import Logo from '../common/Logo';

export default function Sidebar({ 
  activePage, 
  setActivePage, 
  isCollapsed, 
  setIsCollapsed, 
  isMobileOpen, 
  setIsMobileOpen,
  theme = 'dark',
  toggleTheme
}) {
  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutGrid },
    { id: 'scanner', label: 'Scanner', icon: Search },
    { id: 'history', label: 'History', icon: Clock },
    { id: 'analytics', label: 'Insights', icon: BarChart2 },
    { id: 'threat-intel', label: 'Threat Intel', icon: Crosshair },
    { id: 'learn', label: 'Threat Guide', icon: BookOpen },
    { id: 'settings', label: 'Settings', icon: Settings },
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
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#101012] border-r border-[#29292D] transition-all duration-200 ease-in-out select-none
          ${isCollapsed ? 'w-16' : 'w-60'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-[#29292D]">
          <div 
            onClick={() => handleNavClick('home')}
            className="cursor-pointer flex items-center overflow-hidden"
            title="Return to Homepage"
          >
            {isCollapsed ? (
              <Logo size="sm" withWordmark={false} />
            ) : (
              <Logo size="sm" withWordmark={true} />
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 rounded-[8px] text-[#92929A] hover:text-[#F5F5F5] hover:bg-[#151517] transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Primary Navigation */}
        <div className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-[10px] text-xs font-medium transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-[#151517] text-[#F5F5F5] font-semibold border-l-2 border-[#FF6B35]'
                    : 'text-[#92929A] hover:text-[#F5F5F5] hover:bg-[#151517]/60'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={`w-4 h-4 shrink-0 stroke-[1.8] ${isActive ? 'text-[#FF6B35]' : 'text-[#92929A]'}`} />
                {!isCollapsed && (
                  <span className="truncate">{item.label}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Actions: Theme Toggle & Landing Page */}
        <div className="p-3 border-t border-[#29292D] space-y-1.5">
          {toggleTheme && (
            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-xs font-mono text-[#92929A] hover:text-[#F5F5F5] hover:bg-[#151517] transition-colors cursor-pointer"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 shrink-0 text-[#2563EB]" />
              ) : (
                <Sun className="w-4 h-4 shrink-0 text-[#FF6B35]" />
              )}
              {!isCollapsed && <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>}
            </button>
          )}

          <button
            onClick={() => handleNavClick('home')}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-xs font-mono text-[#92929A] hover:text-[#F5F5F5] hover:bg-[#151517] transition-colors cursor-pointer"
            title="Return to Landing Page"
          >
            <Globe className="w-4 h-4 shrink-0 text-[#686870]" />
            {!isCollapsed && <span className="truncate">Landing Page</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
