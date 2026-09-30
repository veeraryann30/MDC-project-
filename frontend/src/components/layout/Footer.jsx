import React from 'react';
import { Shield, Lock, Terminal, Cpu, Heart } from 'lucide-react';

export default function Footer({ setActivePage }) {
  return (
    <footer className="border-t border-[#1C2230] bg-[#05070B] text-slate-400 text-sm mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-950/40 border border-orange-500/40 flex items-center justify-center">
                <Shield className="w-4 h-4 text-orange-400" />
              </div>
              <span className="font-bold text-white text-base tracking-wider">
                CATCH THE <span className="text-[#FF6B00]">PHISH</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Next-generation Explainable Phishing Detection System. Combining real-time lexical inspection, brand lookalike recognition, and machine learning.
            </p>
            <div className="flex items-center gap-2 text-[11px] font-mono text-orange-400/90 bg-black/60 px-2.5 py-1.5 rounded border border-orange-500/30 w-fit">
              <Terminal className="w-3.5 h-3.5" />
              <span>Safe Static Analysis Engine</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-4 font-mono">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => setActivePage('home')} className="hover:text-orange-400 transition-colors">
                  Home & Overview
                </button>
              </li>
              <li>
                <button onClick={() => setActivePage('scanner')} className="hover:text-orange-400 transition-colors">
                  URL Scanner Workstation
                </button>
              </li>
              <li>
                <button onClick={() => setActivePage('dashboard')} className="hover:text-orange-400 transition-colors">
                  SOC Analytics Dashboard
                </button>
              </li>
              <li>
                <button onClick={() => setActivePage('history')} className="hover:text-orange-400 transition-colors">
                  Audit Scan History
                </button>
              </li>
            </ul>
          </div>

          {/* Educational Modules */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-4 font-mono">
              Phishing Academy
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => setActivePage('learn')} className="hover:text-orange-400 transition-colors">
                  Lookalike Domains & Homoglyphs
                </button>
              </li>
              <li>
                <button onClick={() => setActivePage('learn')} className="hover:text-orange-400 transition-colors">
                  Punycode Attacks & IDN
                </button>
              </li>
              <li>
                <button onClick={() => setActivePage('learn')} className="hover:text-orange-400 transition-colors">
                  Fake Payment & Banking Portals
                </button>
              </li>
              <li>
                <button onClick={() => setActivePage('learn')} className="hover:text-orange-400 transition-colors">
                  Interactive Phishing IQ Quiz
                </button>
              </li>
            </ul>
          </div>

          {/* Security & Ethics Notice */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 font-mono flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              Zero-Execution Principle
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Catch the Phish parses URLs purely as untrusted data strings. It <span className="text-slate-200 font-medium">never connects to, renders, or executes scripts</span> from target domains.
            </p>
            <p className="text-[11px] text-slate-500 italic">
              Developed as a Cybersecurity & Machine Learning Engineering demonstration.
            </p>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[#1C2230] flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Catch the Phish. “Don’t Click. Check First.”</p>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1 text-slate-400">
              <Cpu className="w-3.5 h-3.5 text-orange-400" /> Scikit-Learn + FastAPI + React
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
