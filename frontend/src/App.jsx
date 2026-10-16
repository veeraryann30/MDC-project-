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

  const handleQuickScan = async (url) => {
    if (!url || !url.trim()) return;
    setIsScanning(true);
    setScanError('');
    try {
      const data = await api.scanUrl(url.trim());
      setScanResult(data);
      setActivePage('results');
    } catch (err) {
      setScanError(err.message || 'Quick scan failed. Please check the URL format.');
      setActivePage('scanner');
    } finally {
      setIsScanning(false);
    }
  };

  const renderPage = () => {
    switch (activePage) {
      case 'home':
        return <Home setActivePage={setActivePage} setScanResult={setScanResult} />;
      case 'dashboard':
        return <Dashboard setActivePage={setActivePage} setScanResult={setScanResult} />;
      case 'scanner':
        return <Scanner setActivePage={setActivePage} setScanResult={setScanResult} />;
      case 'results':
        return <Results result={scanResult} setActivePage={setActivePage} />;
      case 'history':
        return <History setActivePage={setActivePage} setScanResult={setScanResult} />;
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
        return <Home setActivePage={setActivePage} setScanResult={setScanResult} />;
    }
  };

  // Dedicated full-width SHADOW UI Landing Page
  if (activePage === 'home') {
    return (
      <div className="min-h-screen bg-[#0B0B0C] text-[#F5F5F5] font-sans selection:bg-[#FF6B35]/30 selection:text-white antialiased">
        <ScrollController activePage={activePage} theme={theme} />
        <Home setActivePage={setActivePage} setScanResult={setScanResult} />
      </div>
    );
  }

  // Security Operations Console Layout (Dashboard, Scanner, Results, Records, Intelligence, etc.)
  return (
    <div className="min-h-screen bg-[#0B0B0C] text-[#F5F5F5] flex flex-col font-sans selection:bg-[#FF6B35]/30 selection:text-white antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
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
          setActivePage={setActivePage}
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

        {/* Dynamic Page Content */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {renderPage()}
        </main>

        {/* Footer */}
        <Footer setActivePage={setActivePage} />
      </div>
    </div>
  );
}
