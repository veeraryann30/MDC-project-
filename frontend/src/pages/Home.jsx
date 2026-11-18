import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import LandingNavbar from '../components/layout/LandingNavbar';
import LandingFooter from '../components/layout/LandingFooter';
import HeroSection from '../components/home/HeroSection';
import ServicesSection from '../components/home/ServicesSection';
import UrlScanner from '../components/scanner/UrlScanner';

/**
 * Home Page — Premium White & Blue Cybersecurity SaaS Redesign
 * Apple & Stripe inspired design system:
 * - 80% White (#FFFFFF)
 * - 15% Light Blue (#F5F9FF & #DBEAFE)
 * - 5% Deep Blue (#2563EB & #1E40AF)
 */
export default function Home({ setActivePage, setScanResult, theme, toggleTheme, openAboutModal }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 40);
    return () => clearTimeout(t);
  }, []);

  const handleScanLink = () => {
    if (setActivePage) {
      setActivePage('scanner');
    }
  };

  const handleExploreProtection = () => {
    const section = document.getElementById('protection-overview');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    } else if (setActivePage) {
      setActivePage('dashboard');
    }
  };

  const handleScanComplete = (result) => {
    if (setScanResult) setScanResult(result);
    if (setActivePage) setActivePage('results');
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#111827] flex flex-col font-sans selection:bg-[#2563EB] selection:text-white relative overflow-x-hidden">
      {/* ======================================================================
          1. NAVIGATION BAR
          ====================================================================== */}
      <LandingNavbar 
        activePage="home"
        setActivePage={setActivePage} 
        openAboutModal={openAboutModal}
        theme={theme} 
        toggleTheme={toggleTheme} 
        tone="dark"
      />

      <main className="flex-1 relative z-10 flex flex-col">
        {/* 2. HERO - dark cinematic section with lazy 3D shield (see components/home/HeroSection) */}
        <HeroSection onScan={handleScanLink} onExplore={handleExploreProtection} />


        {/* 3. SERVICES - dark, continues the hero */}
        <ServicesSection setActivePage={setActivePage} />

        {/* ====================================================================
            4. SCANNER INTERFACE — THE VISUAL HIGHLIGHT SECTION
            ==================================================================== */}
        <section className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 bg-[#F5F9FF] border-y border-[#E2E8F0]">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#DBEAFE] text-xs font-mono text-[#2563EB] shadow-2xs uppercase tracking-wider font-semibold">
                <Search className="w-3.5 h-3.5" />
                <span>Instant Forensic Verification</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#111827]">
                Analyze Any Link in Real Time
              </h2>
              <p className="text-sm sm:text-base text-[#64748B] max-w-xl mx-auto">
                Paste any suspicious link below. Our zero-execution engine extracts 34 structural features without ever visiting the destination.
              </p>
            </div>

            {/* Live URL Scanner Component */}
            <UrlScanner onScanComplete={handleScanComplete} />
          </div>
        </section>

        {/* ====================================================================
            5. ARCHITECTURE HIGHLIGHT BANNER
            ==================================================================== */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-[#2563EB] to-[#1E40AF] text-white">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div className="space-y-1.5">
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
                Built on Zero-Execution Verification Architecture
              </h3>
              <p className="text-sm text-blue-100 max-w-xl">
                Unlike traditional scanners that fetch malicious payloads, Catch the Phish inspects structural patterns safely in an air-gapped lexical model.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActivePage('about')}
              className="px-6 py-3 rounded-full bg-white text-[#2563EB] hover:bg-blue-50 font-semibold text-xs sm:text-sm tracking-wide shadow-md hover:shadow-lg transition-all shrink-0 cursor-pointer"
            >
              Explore Architecture
            </button>
          </div>
        </section>
      </main>

      {/* ======================================================================
          6. FOOTER
          ====================================================================== */}
      <LandingFooter setActivePage={setActivePage} />
    </div>
  );
}
