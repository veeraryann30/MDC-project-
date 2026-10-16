import React, { useState } from 'react';
import { Menu, X, ArrowRight, Shield } from 'lucide-react';
import Logo from '../common/Logo';

export default function LandingNavbar({ 
  setActivePage, 
  onScanButtonClick,
  onSectionNavigate 
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (target) => {
    setMobileMenuOpen(false);
    if (target === 'scanner') {
      setActivePage('scanner');
    } else if (target === 'how-it-works') {
      const el = document.getElementById('how-it-works');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (target === 'threat-fingerprint') {
      const el = document.getElementById('threat-fingerprint');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (target === 'threat-guide') {
      setActivePage('learn');
    } else if (target === 'about') {
      setActivePage('about');
    } else if (target === 'dashboard') {
      setActivePage('dashboard');
    }
  };

  const handleLogoClick = () => {
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-50 h-[72px] bg-[#0B0B0C]/90 backdrop-blur-md border-b border-[#29292D] transition-colors">
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Left: Brand Logo & Wordmark */}
        <div 
          onClick={handleLogoClick}
          className="cursor-pointer group flex items-center transition-transform duration-200 active:scale-95"
        >
          <Logo size="md" withWordmark={true} />
        </div>

        {/* Center / Right Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#92929A]">
          <button
            onClick={() => handleNavClick('scanner')}
            className="hover:text-[#F5F5F5] transition-colors cursor-pointer"
          >
            Scanner
          </button>
          <button
            onClick={() => handleNavClick('how-it-works')}
            className="hover:text-[#F5F5F5] transition-colors cursor-pointer"
          >
            How It Works
          </button>
          <button
            onClick={() => handleNavClick('threat-fingerprint')}
            className="hover:text-[#F5F5F5] transition-colors cursor-pointer"
          >
            Threat Fingerprint
          </button>
          <button
            onClick={() => handleNavClick('threat-guide')}
            className="hover:text-[#F5F5F5] transition-colors cursor-pointer"
          >
            Threat Guide
          </button>
          <button
            onClick={() => handleNavClick('about')}
            className="hover:text-[#F5F5F5] transition-colors cursor-pointer"
          >
            About
          </button>
          <button
            onClick={() => handleNavClick('dashboard')}
            className="hover:text-[#F5F5F5] transition-colors text-xs font-mono uppercase tracking-wider px-2 py-1 rounded border border-[#29292D] hover:border-[#38383E] text-[#92929A] cursor-pointer"
          >
            Dashboard
          </button>
        </nav>

        {/* Far Right: Compact Orange CTA Button */}
        <div className="hidden sm:flex items-center gap-3">
          <button
            onClick={() => setActivePage('scanner')}
            className="px-4 py-2 bg-[#FF6B35] hover:bg-[#ff7b49] active:scale-95 text-white text-xs font-semibold rounded-[10px] transition-all duration-200 cursor-pointer shadow-sm hover:shadow-[0_0_16px_rgba(255,107,53,0.35)] flex items-center gap-1.5"
          >
            <span>Get Started</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.2]" />
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-[#92929A] hover:text-[#F5F5F5] hover:bg-[#151517] border border-[#29292D] transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#101012] border-b border-[#29292D] px-5 py-4 space-y-3 shadow-2xl">
          <button
            onClick={() => handleNavClick('scanner')}
            className="w-full text-left py-2 text-sm text-[#F5F5F5] font-medium"
          >
            Scanner Workstation
          </button>
          <button
            onClick={() => handleNavClick('how-it-works')}
            className="w-full text-left py-2 text-sm text-[#92929A] hover:text-[#F5F5F5]"
          >
            How It Works
          </button>
          <button
            onClick={() => handleNavClick('threat-fingerprint')}
            className="w-full text-left py-2 text-sm text-[#92929A] hover:text-[#F5F5F5]"
          >
            Threat Fingerprint
          </button>
          <button
            onClick={() => handleNavClick('threat-guide')}
            className="w-full text-left py-2 text-sm text-[#92929A] hover:text-[#F5F5F5]"
          >
            Threat Guide
          </button>
          <button
            onClick={() => handleNavClick('about')}
            className="w-full text-left py-2 text-sm text-[#92929A] hover:text-[#F5F5F5]"
          >
            About
          </button>
          <button
            onClick={() => handleNavClick('dashboard')}
            className="w-full text-left py-2 text-sm text-[#92929A] hover:text-[#F5F5F5]"
          >
            SOC Dashboard
          </button>

          <div className="pt-2 border-t border-[#29292D]">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setActivePage('scanner');
              }}
              className="w-full py-2.5 bg-[#FF6B35] hover:bg-[#ff7b49] active:scale-95 text-white text-xs font-semibold rounded-[10px] text-center transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.2]" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
