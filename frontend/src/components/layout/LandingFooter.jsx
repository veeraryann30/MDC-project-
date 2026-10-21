import React from 'react';
import { Shield, Lock, ExternalLink, Terminal } from 'lucide-react';
import Logo from '../common/Logo';

function GitHubIcon({ className = "w-3.5 h-3.5" }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
    </svg>
  );
}

export default function LandingFooter({ setActivePage }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[#29292D] bg-[#0B0B0C] text-[#92929A] text-xs py-14 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Brand Info */}
          <div className="md:col-span-5 space-y-3">
            <Logo size="md" withWordmark={true} withTagline={false} />
            <p className="text-[#92929A] text-xs leading-relaxed max-w-sm font-normal">
              A minimalist, explainable phishing detection engine. Zero network execution, real-time lexical inspection, brand lookalike verification, and machine learning inference.
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-[#151517] border border-[#29292D] text-[#92929A] text-[11px] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-[#35C98A]" />
              <span>Zero-Execution Protocol</span>
            </div>
          </div>

          {/* Product Links */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-[11px] font-mono uppercase tracking-wider text-[#F5F5F5] font-semibold">
              Product
            </h4>
            <ul className="space-y-2">
              <li>
                <button 
                  onClick={() => setActivePage('scanner')} 
                  className="hover:text-[#F5F5F5] transition-colors cursor-pointer"
                >
                  URL Scanner
                </button>
              </li>
              <li>
                <button 
                  onClick={() => {
                    const el = document.getElementById('how-it-works');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }} 
                  className="hover:text-[#F5F5F5] transition-colors cursor-pointer"
                >
                  How It Works
                </button>
              </li>
              <li>
                <button 
                  onClick={() => {
                    const el = document.getElementById('threat-fingerprint');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }} 
                  className="hover:text-[#F5F5F5] transition-colors cursor-pointer"
                >
                  Threat Fingerprint
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setActivePage('dashboard')} 
                  className="hover:text-[#F5F5F5] transition-colors cursor-pointer"
                >
                  SOC Telemetry Console
                </button>
              </li>
            </ul>
          </div>

          {/* Knowledge & Privacy */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-[11px] font-mono uppercase tracking-wider text-[#F5F5F5] font-semibold">
              Intelligence & Privacy
            </h4>
            <ul className="space-y-2">
              <li>
                <button 
                  onClick={() => setActivePage('learn')} 
                  className="hover:text-[#F5F5F5] transition-colors cursor-pointer"
                >
                  Threat Guide & Academy
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setActivePage('about')} 
                  className="hover:text-[#F5F5F5] transition-colors cursor-pointer"
                >
                  Model Architecture & Evaluation
                </button>
              </li>
              <li>
                <span className="text-[#686870] cursor-default">
                  Zero Data Tracking · Untrusted String Sandboxing
                </span>
              </li>
              <li className="pt-1">
                <a 
                  href="https://github.com/veeraryann30/MDC-project-" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[#F5F5F5] hover:text-[#FF6B35] transition-colors font-mono text-[11px]"
                >
                  <GitHubIcon className="w-3.5 h-3.5" />
                  <span>github.com/veeraryann30/MDC-project-</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom subtle separator and copyright */}
        <div className="pt-8 border-t border-[#29292D] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#686870]">
          <div className="space-y-0.5 text-center sm:text-left">
            <div>
              © 2026 VeerAryan Bhadwal. All rights reserved.
            </div>
            <div className="text-[10px] text-[#92929A] font-mono">
              part of : MDC Projects CSE Cyber SEcurity (Batch2025)
            </div>
          </div>
          <div className="font-mono text-[#686870]">
            SHADOW UI · v2.0
          </div>
        </div>
      </div>
    </footer>
  );
}
