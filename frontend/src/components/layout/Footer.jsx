import React from 'react';
import { Lock, Shield, ArrowUpRight } from 'lucide-react';
import Logo from '../common/Logo';

export default function Footer({ setActivePage }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[#E2E8F0] bg-white text-[#64748B] text-xs mt-16 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-3 md:col-span-1">
            <Logo size="sm" withWordmark={true} withTagline={false} />
            <p className="text-xs text-[#64748B] leading-relaxed">
              Transparent phishing URL and QR detection powered by lexical inspection, brand verification, and machine learning inference.
            </p>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#2563EB] bg-[#F5F9FF] px-3 py-1 rounded-full border border-[#DBEAFE] w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
              <span className="font-semibold">Zero-Execution Protocol</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[#111827] mb-3 font-mono">
              Console
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => setActivePage('home')} className="hover:text-[#2563EB] transition-colors cursor-pointer">
                  Landing Page
                </button>
              </li>
              <li>
                <button onClick={() => setActivePage('dashboard')} className="hover:text-[#2563EB] transition-colors cursor-pointer">
                  Services Hub
                </button>
              </li>
              <li>
                <button onClick={() => setActivePage('scanner')} className="hover:text-[#2563EB] transition-colors cursor-pointer">
                  URL Scanner
                </button>
              </li>
              <li>
                <button onClick={() => setActivePage('qr-scanner')} className="hover:text-[#2563EB] transition-colors cursor-pointer">
                  QR Scanner
                </button>
              </li>
              <li>
                <button onClick={() => setActivePage('history')} className="hover:text-[#2563EB] transition-colors cursor-pointer">
                  Audit History
                </button>
              </li>
            </ul>
          </div>

          {/* Intelligence Modules */}
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[#111827] mb-3 font-mono">
              Intelligence
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => setActivePage('threat-intel')} className="hover:text-[#2563EB] transition-colors cursor-pointer">
                  Threat Intel
                </button>
              </li>
            </ul>
          </div>

          {/* Safety & Protocol */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[#111827] font-mono flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Zero-Execution Protocol</span>
            </h4>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Target links are parsed strictly as untrusted text vectors. No requests are dispatched to destination web servers.
            </p>
            <div className="pt-2">
              <button
                onClick={() => setActivePage('about')}
                className="inline-flex items-center gap-1 text-xs text-[#2563EB] hover:text-[#1E40AF] font-medium"
              >
                <span>Read security specifications</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#64748B] font-mono">
          <p>© {currentYear} Catch the Phish. Built for defensive cybersecurity.</p>
          <p>Status: All heuristic & ML verification models operational.</p>
        </div>
      </div>
    </footer>
  );
}
