import React, { useState } from 'react';
import { Search, QrCode } from 'lucide-react';
import UrlScanner from '../components/scanner/UrlScanner';
import QrScanner from '../components/scanner/QrScanner';

export default function Scanner({ setActivePage, setScanResult, initialTab = 'URL' }) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'URL' | 'QR'

  const handleScanComplete = (result) => {
    setScanResult(result);
    setActivePage('results');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 select-none font-sans">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#DBEAFE] text-[#2563EB] text-xs font-mono uppercase tracking-wider font-semibold shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
          <span>{activeTab === 'URL' ? 'URL SECURITY ANALYSIS' : 'QR SECURITY ANALYSIS'}</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-bold text-[#111827] tracking-tight">
          {activeTab === 'URL' ? 'URL Threat Scanner' : 'QR Threat Scanner'}
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B] max-w-lg mx-auto leading-relaxed">
          {activeTab === 'URL' 
            ? 'Analyze suspicious links before they compromise your credentials or identity.'
            : 'Analyze suspicious QR codes before they redirect to deceptive endpoints.'}
        </p>
      </div>

      {/* Dual Scanner Tabs: URL SCANNER | QR CODE */}
      <div className="flex items-center justify-center gap-1.5 p-1.5 max-w-xs mx-auto rounded-xl bg-white border border-[#E2E8F0] shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveTab('URL')}
          className={`flex-1 py-2 px-4 rounded-lg text-xs font-medium uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'URL'
              ? 'bg-[#2563EB] text-white font-semibold shadow-xs'
              : 'text-[#64748B] hover:text-[#111827] hover:bg-[#F5F9FF]'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>URL</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('QR')}
          className={`flex-1 py-2 px-4 rounded-lg text-xs font-medium uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'QR'
              ? 'bg-[#2563EB] text-white font-semibold shadow-xs'
              : 'text-[#64748B] hover:text-[#111827] hover:bg-[#F5F9FF]'
          }`}
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>QR CODE</span>
        </button>
      </div>

      {/* Prominent Scanner Mode View */}
      {activeTab === 'URL' ? (
        <UrlScanner onScanComplete={handleScanComplete} />
      ) : (
        <QrScanner onScanComplete={handleScanComplete} />
      )}
    </div>
  );
}