import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Menu, X, ArrowRight } from 'lucide-react';
import ThemeToggle from '../common/ThemeToggle';
import Logo from '../common/Logo';
import AuthButtons from '../common/AuthButtons';

const NAV_ITEMS = [
  { id: 'home', label: 'Home', action: 'home', active: ['home'] },
  { id: 'scanner', label: 'Scanner', action: 'scan', active: ['scanner', 'qr-scanner'] },
  { id: 'services', label: 'Services', action: 'features', active: ['dashboard'] },
  { id: 'how', label: 'How it Works', action: 'how-it-works', active: [], lgOnly: true },
  { id: 'about', label: 'About', mobileLabel: 'About Architecture', action: 'about', active: ['about'] },
];

/**
 * LandingNavbar
 * Premium Minimal Light Navigation Bar
 * Features:
 * - White background with subtle bottom border (#E2E8F0)
 * - Catch the Phish logo on the left
 * - Minimal navigation links with blue active indicator
 * - Rounded blue CTA button (#2563EB)
 * - Sticky navbar with smooth transition on scroll
 */
export default function LandingNavbar({ 
  activePage = 'home',
  setActivePage, 
  openAboutModal,
  theme = 'light',
  toggleTheme,
  tone = 'light'
}) {
  // Always token-styled: colours come from the active theme (dark or light), not from 	one.
  const dark = true;
  const reduced = useReducedMotion();
  const [hoverId, setHoverId] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (pageId) => {
    setMobileMenuOpen(false);
    if (pageId === 'home') {
      if (activePage === 'home') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (setActivePage) {
        setActivePage('home');
      }
    } else if (pageId === 'scan') {
      if (setActivePage) setActivePage('scanner');
    } else if (pageId === 'how-it-works') {
      if (openAboutModal) {
        openAboutModal();
      } else if (setActivePage) {
        setActivePage('about');
      }
    } else if (pageId === 'features') {
      if (setActivePage) {
        setActivePage('dashboard');
      }
    } else if (pageId === 'about') {
      if (openAboutModal) {
        openAboutModal();
      } else if (setActivePage) {
        setActivePage('about');
      }
    }
  };

  return (
    <header
      className={`landing-nav ctp-dark ${scrolled ? 'is-scrolled' : ''} sticky top-3 z-50 mx-auto mt-3 w-[min(1120px,calc(100%-24px))] rounded-2xl border backdrop-blur-xl transition-[background-color,box-shadow] duration-300`}
    >      <div className="h-14 px-3 sm:px-4 flex items-center justify-between">
        {/* ====================================================================
            LEFT: LOGO
            ==================================================================== */}
        <div 
          onClick={() => handleNavClick('home')}
          className="cursor-pointer group flex items-center gap-2 select-none transition-opacity hover:opacity-95"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleNavClick('home')}
          aria-label="Catch the Phish Homepage"
        >
          <Logo size="sm" withWordmark={true} withTagline={false} tone={tone} />
        </div>

        {/* ====================================================================
            CENTER: MINIMAL NAVIGATION LINKS WITH BLUE ACTIVE INDICATOR
            ==================================================================== */}
        <nav
          className="hidden md:flex items-center gap-1 text-xs font-sans"
          onMouseLeave={() => setHoverId(null)}
        >
          {NAV_ITEMS.map((item) => {
            const isActive = item.active?.includes(activePage);
            const pillOn = hoverId ? hoverId === item.id : isActive;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.action)}
                onMouseEnter={() => setHoverId(item.id)}
                onFocus={() => setHoverId(item.id)}
                onBlur={() => setHoverId(null)}
                className={`relative whitespace-nowrap px-3.5 py-1.5 rounded-full font-medium transition-colors duration-200 cursor-pointer ${item.lgOnly ? 'hidden lg:inline-block' : ''} ${
                  dark ? (pillOn || isActive ? 'text-ctp-text' : 'text-ctp-text-2') : (pillOn || isActive ? 'text-[#2563EB]' : 'text-[#64748B]')
                } ${isActive ? 'font-semibold' : ''}`}
              >
                {pillOn && (
                  <motion.span
                    layoutId={reduced ? undefined : 'landing-nav-pill'}
                    className={`absolute inset-0 -z-0 rounded-full ${dark ? 'bg-ctp-surface-2' : 'bg-[#DBEAFE]/70'}`}
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative z-10">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* ====================================================================
            RIGHT: THEME TOGGLE, GITHUB & ROUNDED BLUE CTA BUTTON
            ==================================================================== */}
        <div className="hidden md:flex items-center gap-2.5">
          {toggleTheme && <ThemeToggle theme={theme} toggleTheme={toggleTheme} size={34} />}
          <AuthButtons quietSignup />

          <button
            type="button"
            onClick={() => handleNavClick('scan')}
            className="ctp-btn ctp-btn-primary h-9 px-4 text-xs"
          >
            <span>Scan a Link</span>
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.2} />
          </button>        </div>

        {/* ====================================================================
            MOBILE HAMBURGER BUTTON & CTA
            ==================================================================== */}
        <div className="flex md:hidden items-center gap-2">
          {toggleTheme && <ThemeToggle theme={theme} toggleTheme={toggleTheme} size={32} />}
          <button
            type="button"
            onClick={() => handleNavClick('scan')}
            className="ctp-btn ctp-btn-primary h-8 px-3 text-xs"
          >
            Scan Link
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg bg-ctp-surface border border-ctp-border text-ctp-text cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ====================================================================
          MOBILE DRAWER MENU
          ==================================================================== */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            key="drawer"
            initial={reduced ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden overflow-hidden border-t border-ctp-border"
          >
            <div className="px-4 py-4 space-y-1">
              <div className="pb-3 mb-2 border-b border-ctp-border flex">
                <AuthButtons quietSignup compact onNavigate={() => setMobileMenuOpen(false)} />
              </div>
              {NAV_ITEMS.map((item, i) => (
                <motion.button
                  key={item.id}
                  type="button"
                  initial={reduced ? false : { opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.04 * i, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => handleNavClick(item.action)}
                  className={`w-full text-left py-2.5 px-3 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    dark
                      ? `${item.active?.includes(activePage) ? 'text-ctp-text' : 'text-ctp-text-2'} hover:bg-ctp-surface-2 hover:text-ctp-text`
                      : `${item.active?.includes(activePage) ? 'text-[#111827]' : 'text-[#64748B]'} hover:text-[#2563EB] hover:bg-[#F5F9FF]`
                  }`}
                >
                  {item.mobileLabel || item.label}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
