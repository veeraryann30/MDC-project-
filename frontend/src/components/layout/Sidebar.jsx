import React from 'react';
import { 
  LayoutGrid, Search, Clock, 
  Settings, ChevronLeft, ChevronRight, Globe,
  MessageSquare, Mail, Dna, QrCode
} from 'lucide-react';
import Logo from '../common/Logo';
import ThemeToggle from '../common/ThemeToggle';

export default function Sidebar({ 
  activePage, 
  setActivePage, 
  isCollapsed, 
  setIsCollapsed, 
  isMobileOpen, 
  setIsMobileOpen, 
  theme = 'dark',
  toggleTheme,
  openAboutModal
}) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'scanner', label: 'URL Scanner', icon: Search },
    { id: 'qr-scanner', label: 'QR Scanner', icon: QrCode },
    { id: 'message-scanner', label: 'Message Scanner', icon: MessageSquare },
    { id: 'email-scanner', label: 'Email Scanner', icon: Mail },
    { id: 'scam-dna', label: 'Scam DNA', icon: Dna },
    { id: 'history', label: 'History', icon: Clock },
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
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#FFFFFF] border-r border-[#E2E8F0] shadow-sm transition-all duration-200 ease-in-out select-none
          ${isCollapsed ? 'w-16' : 'w-60'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-[#E2E8F0]">
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
            className="hidden lg:flex p-1.5 rounded-full text-[#64748B] hover:text-[#111827] hover:bg-[#F5F9FF] border border-transparent hover:border-[#E2E8F0] transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Primary Navigation */}
        <div className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer sidebar-nav-item ${
                  isActive
                    ? 'bg-[#DBEAFE]/80 text-[#2563EB] font-semibold shadow-xs sidebar-nav-item-active'
                    : 'text-[#64748B] hover:text-[#2563EB] hover:bg-[#F5F9FF]'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={`w-4 h-4 shrink-0 stroke-[1.8] ${isActive ? 'text-[#2563EB]' : 'text-[#64748B]'}`} />
                {!isCollapsed && (
                  <span className="truncate">{item.label}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Actions: Theme Toggle & Landing Page */}
        <div className="p-3 border-t border-[#E2E8F0] space-y-1.5">
          {toggleTheme && (
            <div className="flex items-center gap-2.5 px-1.5 py-1">
              <ThemeToggle theme={theme} toggleTheme={toggleTheme} size={32} />
              {!isCollapsed && (
                <span className="text-xs font-mono text-ctp-text-2">
                  {theme === 'dark' ? 'Dark theme' : 'Light theme'}
                </span>
              )}
            </div>
          )}

          <button
            onClick={() => handleNavClick('home')}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-mono text-[#64748B] hover:text-[#2563EB] hover:bg-[#F5F9FF] transition-colors cursor-pointer"
            title="Return to Landing Page"
          >
            <Globe className="w-4 h-4 shrink-0 text-[#64748B]" />
            {!isCollapsed && <span className="truncate">Landing Page</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
