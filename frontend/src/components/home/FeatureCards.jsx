import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import TiltCard from '../common/TiltCard';

const EASE = [0.16, 1, 0.3, 1];

/* ---------- Lightweight CSS-3D illustrations (no WebGL; styles in index.css: .f3d-*) ---------- */

function LinkObject() {
  return (
    <div className="f3d-obj f3d-float">
      <span className="f3d-link f3d-link-a" />
      <span className="f3d-link f3d-link-b" />
      <span className="f3d-orb" />
    </div>
  );
}

function QrObject() {
  // 7x7 module pattern: three finder squares plus data modules (illustrative, not a real code)
  const cells = '1110101011101010100110110111011100110010100110010101111';
  return (
    <div className="f3d-obj f3d-qr-spin">
      <span className="f3d-plate f3d-plate-back" />
      <div className="f3d-plate f3d-qr-face">
        <svg viewBox="0 0 7 7" className="h-full w-full" shapeRendering="crispEdges" aria-hidden="true">
          {[...cells].map((c, i) => c === '1' && (
            <rect key={i} x={i % 7} y={Math.floor(i / 7)} width="1" height="1" rx="0.12" fill="currentColor" />
          ))}
        </svg>
        <span className="f3d-scanline" />
      </div>
    </div>
  );
}

function BookObject() {
  return (
    <div className="f3d-obj f3d-book">
      <span className="f3d-page f3d-page-4" />
      <span className="f3d-page f3d-page-3" />
      <span className="f3d-page f3d-page-2" />
      <span className="f3d-page f3d-page-1" />
      <span className="f3d-cover">
        <span className="f3d-cover-lines" />
      </span>
    </div>
  );
}

function QuizObject() {
  return (
    <div className="f3d-obj f3d-float">
      <div className="f3d-qcard">
        <span className="f3d-qmark">?</span>
        <span className="f3d-qopt" />
        <span className="f3d-qopt f3d-qopt-hit" />
        <span className="f3d-qopt" />
      </div>
    </div>
  );
}

const FEATURES = [
  { id: 'url', title: 'URL Scanner', description: 'Paste any link. Get a risk score and a plain-language explanation, without ever opening it.', route: 'scanner', tone: 'purple', Object: LinkObject },
  { id: 'qr', title: 'QR Scanner', description: 'Upload a QR code from an image or PDF and see where it really leads before you scan.', route: 'qr-scanner', tone: 'green', Object: QrObject },
  { id: 'learn', title: 'Learn', description: 'Short lessons on how phishing works and the signs attackers hope you will miss.', route: 'learn', tone: 'amber', Object: BookObject },
  { id: 'quiz', title: 'Quiz', description: 'Test your instincts on realistic links and messages, with the reasoning explained.', route: 'learn', tone: 'purple', Object: QuizObject },
];

export default function FeatureCards({ setActivePage }) {
  const reduced = useReducedMotion();

  return (
    <section id="protection-overview" className="ctp-dark bg-ctp-bg text-ctp-text border-t border-ctp-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div className="max-w-2xl">
          <motion.p
            initial={reduced ? false : { opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.7, ease: EASE }}
            className="text-[13px] tracking-wide text-ctp-accent-text"
          >
            Features
          </motion.p>
          <motion.h2
            initial={reduced ? false : { opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.8, ease: EASE, delay: 0.05 }}
            className="ctp-display mt-4 text-[length:var(--ctp-text-h1)]"
          >
            Four ways to stay ahead of scams.
          </motion.h2>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4" style={{ perspective: 1400 }}>
          {FEATURES.map((f, i) => {
            const Obj = f.Object;
            return (
              <motion.div
                key={f.id}
                initial={reduced ? false : { opacity: 0, y: 40, rotateX: 12 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.9, ease: EASE, delay: i * 0.09 }}
              >
                <TiltCard
                  as="button"
                  type="button"
                  onClick={() => setActivePage && setActivePage(f.route)}
                  className={`f3d-card f3d-tone-${f.tone} group relative flex h-full w-full cursor-pointer flex-col rounded-3xl border border-ctp-border bg-ctp-surface p-5 text-left outline-none transition-[border-color] duration-300 hover:border-ctp-border-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ctp-accent active:scale-[0.985]`}
                  style={{ boxShadow: 'var(--ctp-shadow-sm)' }}
                  aria-label={`${f.title}: ${f.description}`}
                >
                  <div className="f3d-stage relative z-10 mb-5 flex h-44 items-center justify-center rounded-2xl border border-ctp-border bg-ctp-bg-2">
                    <Obj />
                  </div>
                  <div className="relative z-10 flex items-start justify-between gap-3">
                    <h3 className="text-lg font-medium tracking-[-0.01em]">{f.title}</h3>
                    <ArrowUpRight className="mt-0.5 h-5 w-5 shrink-0 text-ctp-text-2 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ctp-accent-text" strokeWidth={1.6} />
                  </div>
                  <p className="relative z-10 mt-2 text-sm leading-relaxed text-ctp-text-2">{f.description}</p>
                </TiltCard>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
