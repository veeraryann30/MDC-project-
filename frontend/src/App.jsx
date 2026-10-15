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
  const [activePage, setActivePage] = useState('dashboard');
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
      case 'home':
        return <Home setActivePage={setActivePage} setScanResult={setScanResult} />;
      case 'about':
        return <About />;
      default:
        return <Dashboard setActivePage={setActivePage} setScanResult={setScanResult} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#050608] text-slate-100 flex flex-col font-sans selection:bg-[#FF6B00] selection:text-black antialiased transition-colors duration-300">
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
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
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
          <div className="bg-black/90 border-b border-orange-500/50 px-4 py-2 text-center text-xs text-orange-400 font-mono flex items-center justify-center gap-2 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-[#FF6B00] animate-ping" />
            <span>Analyzing target link with 34-feature extraction pipeline & machine learning models...</span>
          </div>
        )}

        {scanError && (
          <div className="bg-rose-950/80 border-b border-rose-800/80 px-4 py-2 text-center text-xs text-rose-300 font-mono flex items-center justify-center gap-2">
            <span>Scan Error: {scanError}</span>
            <button 
              onClick={() => setScanError('')} 
              className="ml-2 text-rose-400 hover:text-white underline cursor-pointer"
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
