import React from 'react';
import { ShieldCheck, ExternalLink } from 'lucide-react';
import Logo from '../common/Logo';

function GitHubIcon({ className = "w-3.5 h-3.5" }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
    </svg>
  );
}

export default function LandingFooter({ setActivePage, tone = 'light' }) {
  const dark = tone === 'dark';
  const hov = dark ? 'hover:text-ctp-text' : 'hover:text-[#2563EB]';
  const head = dark ? 'text-ctp-text' : 'text-[#111827]';
  const rule = dark ? 'border-ctp-border' : 'border-[#E2E8F0]';
  const currentYear = new Date().getFullYear();

  const handleNav = (page) => {
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className={`${dark ? 'ctp-dark border-ctp-border bg-ctp-bg text-ctp-text-2' : 'border-[#E2E8F0] bg-white text-[#64748B]'} border-t text-xs py-14 select-none`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
          {/* Brand Info */}
          <div className="md:col-span-5 space-y-3.5">
            <div 
              onClick={() => handleNav('home')} 
              className="cursor-pointer inline-block"
            >
              <Logo size="md" withWordmark={true} withTagline={false} tone={tone} />
            </div>
            <p className={`${dark ? 'text-ctp-text-2' : 'text-[#64748B]'} text-xs leading-relaxed max-w-sm font-sans`}>
              Next-generation digital threat intelligence and phishing verification platform. Built with zero-execution static analysis and transparent forensic machine learning.
            </p>
            <div className={`flex items-center gap-2.5 text-[11px] font-mono px-3 py-1 rounded-full w-fit border ${dark ? 'text-ctp-text-2 border-ctp-border' : 'text-[#2563EB] bg-[#F5F9FF] border-[#DBEAFE]'}`}>
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${dark ? 'bg-ctp-accent' : 'bg-[#2563EB]'}`} />
              <span className="font-semibold">DETECT · ANALYZE · PROTECT</span>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="md:col-span-2 space-y-3">
            <h4 className={`text-[11px] font-mono uppercase tracking-widest ${head} font-bold`}>
              Navigation
            </h4>
            <ul className="space-y-2 font-sans text-xs">
              <li>
                <button 
                  onClick={() => handleNav('home')} 
                  className={`${hov} transition-colors cursor-pointer`}
                >
                  Home
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNav('scanner')} 
                  className={`${hov} transition-colors cursor-pointer`}
                >
                  URL Scanner
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNav('dashboard')} 
                  className={`${hov} transition-colors cursor-pointer`}
                >
                  Services Hub
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNav('about')} 
                  className={`${hov} transition-colors cursor-pointer`}
                >
                  Architecture & Docs
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNav('history')} 
                  className={`${hov} transition-colors cursor-pointer`}
                >
                  Audit History
                </button>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div className="md:col-span-3 space-y-3">
            <h4 className={`text-[11px] font-mono uppercase tracking-widest ${head} font-bold`}>
              Services
            </h4>
            <ul className="space-y-2 font-sans text-xs">
              <li>
                <button 
                  onClick={() => handleNav('scanner')} 
                  className={`${hov} transition-colors cursor-pointer`}
                >
                  01 URL Threat Intelligence
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNav('qr-scanner')} 
                  className={`${hov} transition-colors cursor-pointer`}
                >
                  02 QR Code Scam Detector
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNav('message-scanner')} 
                  className={`${hov} transition-colors cursor-pointer`}
                >
                  03 Message Scam Detector
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNav('email-scanner')} 
                  className={`${hov} transition-colors cursor-pointer`}
                >
                  04 Email Phishing Analysis
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNav('scam-dna')} 
                  className={`${hov} transition-colors cursor-pointer`}
                >
                  05 Scam DNA Fingerprint
                </button>
              </li>
            </ul>
          </div>

          {/* Social Links & Trust */}
          <div className="md:col-span-2 space-y-3">
            <h4 className={`text-[11px] font-mono uppercase tracking-widest ${head} font-bold`}>
              Resources
            </h4>
            <ul className="space-y-2 font-sans text-xs">
              <li>
                <a 
                  href="https://github.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className={`${hov} transition-colors inline-flex items-center gap-1.5`}
                >
                  <GitHubIcon className="w-3.5 h-3.5" />
                  <span>GitHub Repository</span>
                </a>
              </li>
              <li>
                <button 
                  onClick={() => handleNav('threat-intel')} 
                  className={`${hov} transition-colors cursor-pointer`}
                >
                  Threat Intel Feeds
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNav('learn')} 
                  className={`${hov} transition-colors cursor-pointer`}
                >
                  Security Academy
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Disclaimer & Copyright */}
        <div className={`pt-8 border-t ${rule} flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] font-mono ${dark ? 'text-ctp-muted' : 'text-[#64748B]'}`}>
          <p>
            © {currentYear} CATCH THE PHISH. All rights reserved. Zero-Execution Verification Architecture.
          </p>
          <p className="text-right max-w-md">
            Defensive cybersecurity research platform. Protected with machine learning heuristics & lexical signature pipelines.
          </p>
        </div>
      </div>
    </footer>
  );
}
