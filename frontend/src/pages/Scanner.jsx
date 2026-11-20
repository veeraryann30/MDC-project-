import React, { useState } from 'react';
import { Search, QrCode, ListChecks } from 'lucide-react';
import UrlScanner from '../components/scanner/UrlScanner';
import QrScanner from '../components/scanner/QrScanner';
import BulkScanner from '../components/scanner/BulkScanner';

const HEADINGS = {
  URL: {
    badge: 'URL SECURITY ANALYSIS',
    title: 'URL Threat Scanner',
    blurb: 'Analyze suspicious links before they compromise your credentials or identity.',
  },
  QR: {
    badge: 'QR SECURITY ANALYSIS',
    title: 'QR Threat Scanner',
    blurb: 'Analyze suspicious QR codes before they redirect to deceptive endpoints.',
  },
  BULK: {
    badge: 'BULK LINK CHECK',
    title: 'Bulk Link Checker',
    blurb: 'Paste or upload a list of links, review them in one table and export the results as CSV.',
  },
};

export default function Scanner({ setActivePage, setScanResult, initialTab = 'URL' }) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'URL' | 'QR' | 'BULK'
  const heading = HEADINGS[activeTab] || HEADINGS.URL;

  const handleScanComplete = (result) => {
    setScanResult(result);
    setActivePage('results');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 select-none font-sans">
      {/* Dual Scanner Tabs: URL SCANNER | QR CODE */}
      <div className="flex items-center justify-center gap-1.5 p-1.5 max-w-md mx-auto rounded-xl bg-white border border-[#E2E8F0] shadow-2xs">
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

        <button
          type="button"
          onClick={() => setActiveTab('BULK')}
          className={`flex-1 py-2 px-4 rounded-lg text-xs font-medium uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'BULK'
              ? 'bg-[#2563EB] text-white font-semibold shadow-xs'
              : 'text-[#64748B] hover:text-[#111827] hover:bg-[#F5F9FF]'
          }`}
        >
          <ListChecks className="w-3.5 h-3.5" />
          <span>BULK</span>
        </button>
      </div>

      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#DBEAFE] text-[#2563EB] text-xs font-mono uppercase tracking-wider font-semibold shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
          <span>{heading.badge}</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-bold text-[#111827] tracking-tight">
          {heading.title}
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B] max-w-lg mx-auto leading-relaxed">
          {heading.blurb}
        </p>
      </div>

      {/* Prominent Scanner Mode View */}
      {activeTab === 'URL' && <UrlScanner onScanComplete={handleScanComplete} />}
      {activeTab === 'QR' && <QrScanner onScanComplete={handleScanComplete} />}
      {activeTab === 'BULK' && <BulkScanner />}
    </div>
  );
}