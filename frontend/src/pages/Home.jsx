import React, { useState, useEffect } from 'react';
import LandingNavbar from '../components/layout/LandingNavbar';
import LandingFooter from '../components/layout/LandingFooter';
import HeroSection from '../components/home/HeroSection';
import FeatureCards from '../components/home/FeatureCards';
import CursorAccent from '../components/common/CursorAccent';
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
    <div className="min-h-screen bg-[#FFFFFF] text-[#111827] flex flex-col font-sans selection:bg-[#2563EB] selection:text-white relative overflow-x-clip">
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

      <CursorAccent />
      <main className="flex-1 relative z-10 flex flex-col">
        {/* 2. HERO - dark cinematic section with lazy 3D shield (see components/home/HeroSection) */}
        <HeroSection onScan={handleScanLink} onExplore={handleExploreProtection} />


        {/* 3. FEATURES - four cards with CSS-3D illustrations */}
        <FeatureCards setActivePage={setActivePage} />

        {/* 4. SCANNER - dark, same surface as hero and services */}
        <section className="ctp-dark bg-ctp-bg text-ctp-text border-t border-ctp-border">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
            <div className="text-center">
              <p className="text-[13px] tracking-wide text-ctp-accent">Try it now</p>
              <h2 className="mt-4 font-semibold text-[length:var(--ctp-text-h1)] leading-[1.08] tracking-[-0.035em]">
                Check any link in seconds.
              </h2>
              <p className="mt-4 mx-auto max-w-xl text-[length:var(--ctp-text-body)] leading-relaxed text-ctp-text-2">
                Paste a link below. We extract 34 structural features and score it without ever opening the destination.
              </p>
            </div>

            <div className="mt-10">
              <UrlScanner onScanComplete={handleScanComplete} />
            </div>
          </div>
        </section>

        {/* 5. ARCHITECTURE - quiet closing statement */}
        <section className="ctp-dark bg-ctp-bg text-ctp-text border-t border-ctp-border">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div className="space-y-2">
              <h3 className="text-xl sm:text-2xl font-semibold tracking-[-0.02em]">
                Built on zero-execution verification.
              </h3>
              <p className="text-sm sm:text-[15px] text-ctp-text-2 max-w-xl leading-relaxed">
                Unlike scanners that fetch the page, Catch the Phish inspects the structure of a link without ever opening it.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActivePage('about')}
              className="inline-flex items-center h-11 px-6 rounded-full border border-ctp-border-strong text-sm font-medium text-ctp-text hover:bg-ctp-surface-2 transition-colors cursor-pointer shrink-0"
            >
              Explore architecture
            </button>
          </div>
        </section>
      </main>

      {/* ======================================================================
          6. FOOTER
          ====================================================================== */}
      <LandingFooter setActivePage={setActivePage} tone="dark" />
    </div>
  );
}
