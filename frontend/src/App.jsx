import React, { useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import TopNavbar from './components/layout/TopNavbar';
import Footer from './components/layout/Footer';
import ScrollController from './components/layout/ScrollController';

// Pages
import Dashboard from './pages/Dashboard';
import Scanner from './pages/Scanner';
import Results from './pages/Results';
import History from './pages/History';
import ThreatIntel from './pages/ThreatIntel';
import Analytics from './pages/Analytics';
import Learn from './pages/Learn';
import Settings from './pages/Settings';
import Home from './pages/Home';
import About from './pages/About';

import { api } from './services/api';

export default function App() {
  const [activePage, setActivePage] = useState('home');
  const [scanResult, setScanResult] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [navProgress, setNavProgress] = useState(0);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('catch_the_phish_theme') || 'dark';
  });

  React.useEffect(() => {
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

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
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
        return <Scanner setActivePage={navigateToPage} setScanResult={setScanResult} />;
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
      className="fixed top-0 left-0 right-0 z-[100] h-[2.5px] pointer-events-none bg-transparent"
      aria-hidden="true"
    >
      <div 
        className={`h-full shadow-[0_0_12px_rgba(255,107,53,0.85)] transition-all duration-150 ease-out ${
          theme === 'light' ? 'bg-[#2563EB]' : 'bg-gradient-to-r from-[#FF6B35] to-[#FFA043]'
        }`}
        style={{ width: `${navProgress}%` }}
      />
    </div>
  );

  // Dedicated full-width SHADOW UI Landing Page
  if (activePage === 'home') {
    return (
      <div className="min-h-screen bg-[#0B0B0C] text-[#F5F5F5] font-sans selection:bg-[#FF6B35]/30 selection:text-white antialiased relative">
        {redirectionBeam}
        <ScrollController activePage={activePage} theme={theme} />
        <div className={`page-view-wrapper ${isTransitioning ? 'page-view-exit' : 'page-view-enter'}`}>
          <Home setActivePage={navigateToPage} setScanResult={setScanResult} theme={theme} toggleTheme={toggleTheme} />
        </div>
      </div>
    );
  }

  // Security Operations Console Layout (Dashboard, Scanner, Results, Records, Intelligence, etc.)
  return (
    <div className="min-h-screen bg-[#0B0B0C] text-[#F5F5F5] flex flex-col font-sans selection:bg-[#FF6B35]/30 selection:text-white antialiased relative">
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
        />

        {/* Scroll-Driven Telemetry Controller (Progress Tracker & Back to Top HUD) */}
        <ScrollController activePage={activePage} theme={theme} />

        {/* Global Quick Scan Status Indicator Banner */}
        {isScanning && (
          <div className="bg-[#151517] border-b border-[#FF6B35]/50 px-4 py-2 text-center text-xs text-[#FF6B35] font-mono flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FF6B35] animate-ping" />
            <span>Analyzing target link with 34-feature extraction pipeline & machine learning models...</span>
          </div>
        )}

        {scanError && (
          <div className="bg-[#241315] border-b border-[#FF5C5C]/50 px-4 py-2 text-center text-xs text-[#FF5C5C] font-mono flex items-center justify-center gap-2">
            <span>Scan Error: {scanError}</span>
            <button 
              onClick={() => setScanError('')} 
              className="ml-2 text-[#FF5C5C] hover:text-white underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Dynamic Page Content with Smooth Transition */}
        <main className={`flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 page-view-wrapper ${
          isTransitioning ? 'page-view-exit' : 'page-view-enter'
        }`}>
          {renderPage()}
        </main>

        {/* Footer */}
        <Footer setActivePage={navigateToPage} />
      </div>
    </div>
  );
}
