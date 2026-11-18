import React, { useState, useEffect } from 'react';
import { ArrowRight, ShieldCheck, Search, Link2, Mail, QrCode, MessageSquare, Lock, Cpu, Sparkles, CheckCircle2, ChevronRight, Zap } from 'lucide-react';
import LandingNavbar from '../components/layout/LandingNavbar';
import LandingFooter from '../components/layout/LandingFooter';
import HeroSection from '../components/home/HeroSection';
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

  const services = [
    {
      id: 'url-scanner',
      title: 'URL Threat Intelligence',
      badge: 'MODULE 01',
      description: 'Lexical analysis and structural entropy checks on suspicious links in real time.',
      icon: Link2,
      route: 'scanner',
    },
    {
      id: 'email-scanner',
      title: 'Email Scam Forensics',
      badge: 'MODULE 02',
      description: 'Header inspection, spoofing indicators, and AI body verification for phishing emails.',
      icon: Mail,
      route: 'email-scanner',
    },
    {
      id: 'qr-scanner',
      title: 'QR Code Shield',
      badge: 'MODULE 03',
      description: 'Decode and safely verify QR vectors before loading them on mobile devices.',
      icon: QrCode,
      route: 'qr-scanner',
    },
    {
      id: 'message-scanner',
      title: 'Message Scam Detector',
      badge: 'MODULE 04',
      description: 'Instant analysis for bank KYC, lottery, and UPI refund SMS or chat fraud.',
      icon: MessageSquare,
      route: 'message-scanner',
    },
  ];

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

        {/* ====================================================================
            3. SCANNER INTERFACE — THE VISUAL HIGHLIGHT SECTION
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
            4. PROTECTION MODULES — CLEAN WHITE CARDS ON LIGHT BLUE
            ==================================================================== */}
        <section id="protection-overview" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F5F9FF] border border-[#DBEAFE] text-xs font-mono text-[#2563EB] font-semibold tracking-wide">
              <span>Comprehensive Defense</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#111827]">
              Multi-Layer Threat Intelligence
            </h2>
            <p className="text-base text-[#64748B]">
              Protection across every major vector attackers use to breach identities and digital assets.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <div
                  key={service.id}
                  onClick={() => setActivePage(service.route)}
                  role="button"
                  tabIndex={0}
                  className="group p-6 rounded-2xl bg-white border border-[#E2E8F0] hover:border-[#2563EB]/40 shadow-sm hover:shadow-[0_12px_30px_rgba(37,99,235,0.08)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    {/* Minimal Icon Box with Light Blue Background */}
                    <div className="w-11 h-11 rounded-xl bg-[#F5F9FF] border border-[#DBEAFE] flex items-center justify-center text-[#2563EB] mb-5 group-hover:bg-[#2563EB] group-hover:text-white transition-all duration-200">
                      <Icon className="w-5 h-5 stroke-[2]" />
                    </div>

                    <span className="text-[10px] font-mono text-[#2563EB] font-bold tracking-wider uppercase">
                      {service.badge}
                    </span>

                    <h3 className="text-lg font-bold text-[#111827] mt-1 tracking-tight group-hover:text-[#2563EB] transition-colors">
                      {service.title}
                    </h3>

                    <p className="text-xs text-[#64748B] leading-relaxed mt-2.5">
                      {service.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#E2E8F0] flex items-center justify-between text-xs font-medium text-[#2563EB]">
                    <span>Launch Module</span>
                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              );
            })}
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
