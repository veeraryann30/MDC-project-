import React, { useState, useEffect, useLayoutEffect, lazy, Suspense } from 'react';
import { flushSync } from 'react-dom';
import Sidebar from './components/layout/Sidebar';
import TopNavbar from './components/layout/TopNavbar';
import Footer from './components/layout/Footer';
import LandingNavbar from './components/layout/LandingNavbar';
import LandingFooter from './components/layout/LandingFooter';
import ScrollController from './components/layout/ScrollController';
import AboutModal from './components/common/AboutModal';

// Pages. Home loads eagerly (landing); every other page is split into its own chunk
// so the first visit does not download charts, maps and graph libraries it may never use.
import Home from './pages/Home';
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Scanner = lazy(() => import('./pages/Scanner'));
const Results = lazy(() => import('./pages/Results'));
const History = lazy(() => import('./pages/History'));
const ThreatIntel = lazy(() => import('./pages/ThreatIntel'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Learn = lazy(() => import('./pages/Learn'));
const Settings = lazy(() => import('./pages/Settings'));
const About = lazy(() => import('./pages/About'));
const PhishTrace = lazy(() => import('./pages/PhishTrace'));
const MessageScanner = lazy(() => import('./pages/MessageScanner'));
const InvestmentScanner = lazy(() => import('./pages/InvestmentScanner'));
const EmailScanner = lazy(() => import('./pages/EmailScanner'));
const ScamDNA = lazy(() => import('./pages/ScamDNA'));

const PageFallback = () => (
  <div className="py-24 text-center text-xs font-mono text-[#94A3B8]" role="status" aria-live="polite">
    Loading…
  </div>
);

import { api } from './services/api';

export default function App() {
  const [activePage, setActivePage] = useState(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (hash === 'about' || hash === 'about-the-project') return 'about';
      if ([
        'scanner', 'qr-scanner', 'qr', 'message-scanner', 'investment-scanner', 
        'email-scanner', 'scam-dna', 'phish-trace', 'dashboard', 'history', 
        'threat-intel', 'analytics', 'learn', 'settings', 'results'
      ].includes(hash)) {
        return hash;
      }
      const params = new URLSearchParams(window.location.search);
      const page = params.get('page');
      if (page) return page;
    }
    return 'home';
  });
  const [scanResult, setScanResult] = useState(null);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [navProgress, setNavProgress] = useState(0);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('catch_the_phish_theme') || 'light';
  });

  useLayoutEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
    }
    localStorage.setItem('catch_the_phish_theme', theme);
  }, [theme]);

  // Synchronize browser history and hash navigation
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== 'undefined') {
        const hash = window.location.hash.replace('#', '').toLowerCase();
        if (hash) {
          setActivePage(hash);
        } else {
          setActivePage('home');
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Apple-Inspired Circular Reveal Theme Switcher
  const toggleTheme = (e, targetTheme) => {
    const nextTheme = targetTheme || (theme === 'dark' ? 'light' : 'dark');
    if (nextTheme === theme) return;

    const applyThemeClasses = (t) => {
      const root = document.documentElement;
      if (t === 'light') {
        root.classList.remove('dark');
        root.classList.add('light');
      } else {
        root.classList.remove('light');
        root.classList.add('dark');
      }
      localStorage.setItem('catch_the_phish_theme', t);
    };

    // Check for reduced motion preference or lack of View Transitions API support
    const isReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!document.startViewTransition || isReducedMotion) {
      applyThemeClasses(nextTheme);
      setTheme(nextTheme);
      return;
    }

    // Determine epicenter of circular expansion
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;

    if (e) {
      if (typeof e.clientX === 'number' && typeof e.clientY === 'number' && (e.clientX !== 0 || e.clientY !== 0)) {
        x = e.clientX;
        y = e.clientY;
      } else if (e.currentTarget && typeof e.currentTarget.getBoundingClientRect === 'function') {
        const rect = e.currentTarget.getBoundingClientRect();
        x = rect.left + rect.width / 2;
        y = rect.top + rect.height / 2;
      }
    }

    // Calculate maximum radius to the furthest viewport corner
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    try {
      const transition = document.startViewTransition(() => {
        flushSync(() => {
          applyThemeClasses(nextTheme);
          setTheme(nextTheme);
        });
      });

      transition.ready.then(() => {
        try {
          document.documentElement.animate(
            {
              clipPath: [
                `circle(0px at ${x}px ${y}px)`,
                `circle(${endRadius}px at ${x}px ${y}px)`
              ],
            },
            {
              duration: 520,
              easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
              pseudoElement: '::view-transition-new(root)',
            }
          );
        } catch {
          // If pseudoElement is not supported by the browser, default view transition runs smoothly
        }
      }).catch(() => {});
    } catch {
      applyThemeClasses(nextTheme);
      setTheme(nextTheme);
    }
  };

  // Smooth Page Redirection Controller
  const navigateToPage = (newPage) => {
    if (newPage === activePage) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // 1. Initiate smooth exit & top tactile progress beam
    setIsTransitioning(true);
    setNavProgress(40);

    // 2. Midway switch: swap active page and reset scroll without jump
    setTimeout(() => {
      setNavProgress(80);
      setActivePage(newPage);
      window.scrollTo(0, 0);

      if (typeof window !== 'undefined') {
        if (newPage === 'home') {
          window.history.pushState(null, '', window.location.pathname);
        } else {
          window.history.pushState(null, '', `#${newPage}`);
        }
      }

      // 3. Smooth entrance reveal
      setTimeout(() => {
        setIsTransitioning(false);
        setNavProgress(100);

        setTimeout(() => {
          setNavProgress(0);
        }, 160);
      }, 40);
    }, 120);
  };

  const handleQuickScan = async (url) => {
    if (!url || !url.trim()) return;
    setIsScanning(true);
    setScanError('');
    try {
      const data = await api.scanUrl(url.trim());
      setScanResult(data);
      navigateToPage('results');
    } catch (err) {
      setScanError(err.message || 'Quick scan failed. Please check the URL format.');
      navigateToPage('scanner');
    } finally {
      setIsScanning(false);
    }
  };

  const renderPage = () => {
    switch (activePage) {
      case 'home':
        return <Home setActivePage={navigateToPage} setScanResult={setScanResult} />;
      case 'dashboard':
        return <Dashboard setActivePage={navigateToPage} setScanResult={setScanResult} />;
      case 'scanner':
        return <Scanner setActivePage={navigateToPage} setScanResult={setScanResult} initialTab="URL" />;
      case 'qr-scanner':
      case 'qr':
        return <Scanner setActivePage={navigateToPage} setScanResult={setScanResult} initialTab="QR" />;
      case 'message-scanner':
        return <MessageScanner setActivePage={navigateToPage} />;
      case 'job-scanner':
        return <Dashboard setActivePage={navigateToPage} setScanResult={setScanResult} />;
      case 'investment-scanner':
        return <InvestmentScanner setActivePage={navigateToPage} />;
      case 'email-scanner':
        return <EmailScanner setActivePage={navigateToPage} />;
      case 'scam-dna':
        return <ScamDNA setActivePage={navigateToPage} />;
      case 'phish-trace':
        return <PhishTrace setActivePage={navigateToPage} />;
      case 'results':
        return <Results result={scanResult} setActivePage={navigateToPage} />;
      case 'history':
        return <History setActivePage={navigateToPage} setScanResult={setScanResult} />;
      case 'threat-intel':
        return <ThreatIntel />;
      case 'analytics':
        return <Analytics />;
      case 'learn':
        return <Learn />;
      case 'settings':
        return <Settings theme={theme} setTheme={setTheme} toggleTheme={toggleTheme} />;
      case 'about':
        return <About />;
      default:
        return <Home setActivePage={navigateToPage} setScanResult={setScanResult} />;
    }
  };

  // Top Redirection Progress Beam
  const redirectionBeam = navProgress > 0 && (
    <div 
      className="fixed top-0 left-0 right-0 z-[100] h-[2px] pointer-events-none bg-transparent"
      aria-hidden="true"
    >
      <div 
        className="h-full bg-[#2563EB] shadow-[0_0_12px_rgba(37,99,235,0.85)] transition-all duration-150 ease-out"
        style={{ width: `${navProgress}%` }}
      />
    </div>
  );

  // Dedicated full-width Minimalist Light Theme Landing Page
  if (activePage === 'home') {
    return (
      <div className="min-h-screen bg-[#FFFFFF] text-[#111827] font-sans selection:bg-[#2563EB] selection:text-white antialiased relative">
        {redirectionBeam}
        <ScrollController activePage={activePage} theme={theme} />
        <div className={`page-view-wrapper ${isTransitioning ? 'page-view-exit' : 'page-view-enter'}`}>
          <Home 
            setActivePage={navigateToPage} 
            setScanResult={setScanResult} 
            theme={theme} 
            toggleTheme={toggleTheme} 
            openAboutModal={() => setIsAboutModalOpen(true)}
          />
        </div>
        <AboutModal
          isOpen={isAboutModalOpen}
          onClose={() => setIsAboutModalOpen(false)}
          setActivePage={navigateToPage}
        />
      </div>
    );
  }

  // Dedicated full-screen Apple / Linear / Stripe "About the Project" Experience
  if (activePage === 'about') {
    return (
      <div className="min-h-screen bg-[#FFFFFF] text-[#111827] font-sans selection:bg-[#2563EB] selection:text-white antialiased relative">
        {redirectionBeam}
        <ScrollController activePage={activePage} theme={theme} />
        <LandingNavbar 
          activePage="about"
          setActivePage={navigateToPage} 
          theme={theme} 
          toggleTheme={toggleTheme} 
        />
        <div className={`page-view-wrapper ${isTransitioning ? 'page-view-exit' : 'page-view-enter'}`}>
          <Suspense fallback={<PageFallback />}>
            <About setActivePage={navigateToPage} theme={theme} toggleTheme={toggleTheme} />
          </Suspense>
        </div>
        <LandingFooter setActivePage={navigateToPage} />
      </div>
    );
  }

  // Security Operations Console Layout (Dashboard, Scanner, Results, Records, Intelligence, etc.)
  return (
    <div className="min-h-screen bg-[#F5F9FF] text-[#111827] flex flex-col font-sans selection:bg-[#2563EB] selection:text-white antialiased relative">
      {redirectionBeam}

      {/* Sidebar Navigation */}
      <Sidebar
        activePage={activePage}
        setActivePage={navigateToPage}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        theme={theme}
        toggleTheme={toggleTheme}
        openAboutModal={() => setIsAboutModalOpen(true)}
      />

      {/* Main Layout Area */}
      <div 
        className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ease-in-out ${
          isCollapsed ? 'lg:pl-16' : 'lg:pl-60'
        }`}
      >
        {/* Top Navbar */}
        <TopNavbar
          activePage={activePage}
          setActivePage={navigateToPage}
          isCollapsed={isCollapsed}
          setIsMobileOpen={setIsMobileOpen}
          onQuickScan={handleQuickScan}
          theme={theme}
          toggleTheme={toggleTheme}
          openAboutModal={() => setIsAboutModalOpen(true)}
        />

        {/* Scroll-Driven Telemetry Controller (Progress Tracker & Back to Top HUD) */}
        <ScrollController activePage={activePage} theme={theme} />

        {/* Global Quick Scan Status Indicator Banner */}
        {isScanning && (
          <div className="bg-[#EFF6FF] border-b border-[#BFDBFE] px-4 py-2.5 text-center text-xs text-[#2563EB] font-mono flex items-center justify-center gap-2 app-scanning-banner">
            <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-ping" />
            <span className="font-medium">Analyzing target link with 34-feature extraction pipeline & machine learning models...</span>
          </div>
        )}

        {scanError && (
          <div className="bg-[#FEF2F2] border-b border-[#FECACA] px-4 py-2.5 text-center text-xs text-[#DC2626] font-mono flex items-center justify-center gap-2">
            <span className="font-medium">Scan Error: {scanError}</span>
            <button 
              onClick={() => setScanError('')} 
              className="ml-2 text-[#DC2626] hover:text-[#991B1B] underline cursor-pointer font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Dynamic Page Content with Smooth Transition */}
        <main className={`flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 page-view-wrapper ${
          isTransitioning ? 'page-view-exit' : 'page-view-enter'
        }`}>
          <Suspense fallback={<PageFallback />}>
            {renderPage()}
          </Suspense>
        </main>

        {/* Footer */}
        <Footer setActivePage={navigateToPage} />
      </div>

      <AboutModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
        setActivePage={navigateToPage}
      />
    </div>
  );
}
