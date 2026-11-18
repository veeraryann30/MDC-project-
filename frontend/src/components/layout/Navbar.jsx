import React, { useState, useEffect } from 'react';
import { Shield, Activity, BookOpen, History, BarChart3, Search, Info } from 'lucide-react';
import { api } from '../../services/api';
import Logo from '../common/Logo';

export default function Navbar({ activePage, setActivePage }) {
  const [isBackendOnline, setIsBackendOnline] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      const online = await api.checkHealth();
      setIsBackendOnline(online);
    };
    checkStatus();
    const interval = setInterval(checkStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'home', label: 'Home', icon: Shield },
    { id: 'scanner', label: 'Scanner', icon: Search },
    { id: 'dashboard', label: 'Services', icon: BarChart3 },
    { id: 'history', label: 'History', icon: History },
    { id: 'learn', label: 'Academy', icon: BookOpen },
    { id: 'about', label: 'About', icon: Info },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div 
            onClick={() => setActivePage('home')}
            className="flex items-center gap-3 cursor-pointer select-none"
          >
            <Logo size="sm" withWordmark={true} withTagline={false} />
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#DBEAFE]/70 text-[#2563EB] font-semibold'
                      : 'text-[#64748B] hover:text-[#2563EB] hover:bg-[#F5F9FF]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#2563EB]' : 'text-[#64748B]'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Backend Engine Status & Quick Action */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-[#F5F9FF] border border-[#E2E8F0] text-xs font-mono">
              <span className={`w-2 h-2 rounded-full ${isBackendOnline ? 'bg-[#16A34A] animate-pulse' : 'bg-[#F59E0B]'}`} />
              <span className="text-[#64748B]">
                Engine: <span className={isBackendOnline ? 'text-[#16A34A] font-semibold' : 'text-[#F59E0B]'}>
                  {isBackendOnline ? 'ONLINE' : 'CONNECTING...'}
                </span>
              </span>
            </div>

            <button
              onClick={() => setActivePage('scanner')}
              className="px-4 py-1.5 rounded-full bg-[#2563EB] hover:bg-[#1E40AF] text-white text-xs font-semibold tracking-wide shadow-sm hover:shadow transition-all"
            >
              Scan URL
            </button>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-[#E2E8F0] overflow-x-auto gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`flex flex-col items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium ${
                  isActive ? 'text-[#2563EB] font-semibold' : 'text-[#64748B]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
