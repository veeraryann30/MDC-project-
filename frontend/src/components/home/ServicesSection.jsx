import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Link2, ScanSearch, QrCode, MessageSquareWarning, Radar, ArrowUpRight } from 'lucide-react';

const EASE = [0.16, 1, 0.3, 1];

const SERVICES = [
  {
    id: 'url',
    title: 'Phishing URL Detection',
    description: '34 structural features, a trained model and explainable rules score any link without ever visiting it.',
    icon: Link2,
    route: 'scanner',
  },
  {
    id: 'site',
    title: 'Suspicious Website Analysis',
    description: 'Trace where a site lives: DNS, hosting, IP reputation, SSL and how recently the domain was registered.',
    icon: ScanSearch,
    route: 'phish-trace',
  },
  {
    id: 'qr',
    title: 'QR Code Scam Detection',
    description: 'Decode QR codes from images or PDFs and check the hidden destination before you open it.',
    icon: QrCode,
    route: 'qr-scanner',
  },
  {
    id: 'scam',
    title: 'Digital Scam Detection',
    description: 'Job offers and investment pitches checked for the patterns scammers reuse.',
    icon: MessageSquareWarning,
    route: 'investment-scanner',
  },
  {
    id: 'intel',
    title: 'Security Intelligence',
    description: 'Your scan history, trends and a scam awareness academy, gathered in one place.',
    icon: Radar,
    route: 'threat-intel',
  },
];

export default function ServicesSection({ setActivePage }) {
  const reduced = useReducedMotion();
  const reveal = (i) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: '-60px' },
          transition: { duration: 0.8, ease: EASE, delay: i * 0.07 },
        };

  return (
    <section id="protection-overview" className="ctp-dark bg-ctp-bg text-ctp-text border-t border-ctp-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <motion.p {...reveal(0)} className="text-[13px] tracking-wide text-ctp-accent">
              What we protect
            </motion.p>
            <motion.h2
              {...reveal(1)}
              className="mt-4 font-semibold text-[length:var(--ctp-text-h2)] leading-[1.12] tracking-[-0.035em]"
            >
              Every way a scam reaches you, covered.
            </motion.h2>
            <motion.p {...reveal(2)} className="mt-5 max-w-sm text-[length:var(--ctp-text-body)] leading-relaxed text-ctp-text-2">
              Five checks, one place. Each explains what it found, so you can decide with confidence.
            </motion.p>
          </div>
        </div>

        <ul className="lg:col-span-8 border-t border-ctp-border">
          {SERVICES.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.li key={s.id} {...reveal(i)} className="border-b border-ctp-border">
                <button
                  type="button"
                  onClick={() => setActivePage && setActivePage(s.route)}
                  className="ctp-service group relative w-full text-left grid grid-cols-[auto_1fr_auto] items-center gap-x-5 sm:gap-x-8 py-7 sm:py-8 px-1 sm:px-3 cursor-pointer outline-none focus-visible:bg-ctp-surface"
                >
                  <span aria-hidden="true" className="ctp-service-line" />

                  <span className="ctp-scan-icon relative flex h-12 w-12 items-center justify-center rounded-xl border border-ctp-border text-ctp-text-2 transition-colors duration-300 group-hover:text-ctp-accent group-hover:border-ctp-accent/50 group-focus-visible:text-ctp-accent">
                    <Icon className="h-[22px] w-[22px]" strokeWidth={1.4} />
                  </span>

                  <span className="min-w-0">
                    <span className="flex items-baseline gap-3">
                      <span className="font-mono text-[11px] text-ctp-muted tabular-nums">0{i + 1}</span>
                      <span className="text-lg sm:text-xl font-medium tracking-[-0.015em] transition-transform duration-500 ease-out group-hover:translate-x-1">
                        {s.title}
                      </span>
                    </span>
                    <span className="mt-1.5 block max-w-xl text-sm sm:text-[15px] leading-relaxed text-ctp-text-2 sm:pl-[calc(11px+1.5rem)] sm:ml-0">
                      {s.description}
                    </span>
                  </span>

                  <ArrowUpRight
                    aria-hidden="true"
                    className="h-5 w-5 text-ctp-muted transition-all duration-300 group-hover:text-ctp-accent group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    strokeWidth={1.5}
                  />
                </button>
              </motion.li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
