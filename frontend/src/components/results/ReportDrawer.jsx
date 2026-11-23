import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const EASE = [0.16, 1, 0.3, 1];

/**
 * Slide-over sheet for the full report. Closes with Escape, the backdrop or the X button,
 * locks page scroll while open, keeps keyboard focus inside, and returns focus to the opener.
 */
export default function ReportDrawer({ open, onClose, title, tabs, activeTab, onTab, children }) {
  const reduced = useReducedMotion();
  const panelRef = useRef(null);
  const openerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    openerRef.current = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();

    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); return; }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const f = panelRef.current.querySelectorAll('a[href],button:not([disabled]),input,select,textarea,summary,[tabindex]:not([tabindex="-1"])');
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      openerRef.current?.focus?.();
    };
  }, [open, onClose]);

  // Rendered on document.body: the page layout has transformed ancestors that would otherwise
  // become the containing block for `fixed` and clip or offset the sheet.
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="ctp-console fixed inset-0 z-[80] print:hidden">
          <motion.button
            type="button"
            aria-label="Close report"
            tabIndex={-1}
            className="absolute inset-0 h-full w-full cursor-default bg-black/55 backdrop-blur-[2px]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.25 }}
            onClick={onClose}
          />
          <motion.aside
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            className="ctp-dark absolute right-0 top-0 flex h-full w-full flex-col border-l border-ctp-border bg-ctp-bg text-ctp-text shadow-2xl outline-none sm:max-w-[680px]"
            initial={reduced ? { opacity: 0 } : { x: '100%' }}
            animate={reduced ? { opacity: 1 } : { x: 0 }}
            exit={reduced ? { opacity: 0 } : { x: '100%' }}
            transition={{ duration: reduced ? 0 : 0.45, ease: EASE }}
          >
            <header className="flex items-center justify-between gap-4 border-b border-ctp-border px-5 py-4 sm:px-6">
              <h2 className="text-[15px] font-medium">{title}</h2>
              <button type="button" onClick={onClose} aria-label="Close report" className="rounded-full p-1.5 text-ctp-text-2 transition-colors hover:bg-ctp-surface-2 hover:text-ctp-text cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </header>

            <div role="tablist" aria-label="Report sections" className="flex gap-1 border-b border-ctp-border px-4 pt-2 sm:px-5">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  id={`tab-${t.id}`}
                  role="tab"
                  type="button"
                  aria-selected={activeTab === t.id}
                  aria-controls={`panel-${t.id}`}
                  onClick={() => onTab(t.id)}
                  className={`-mb-px cursor-pointer border-b-2 px-3.5 py-2.5 text-[13.5px] font-medium transition-colors ${
                    activeTab === t.id ? 'border-ctp-accent text-ctp-text' : 'border-transparent text-ctp-text-muted hover:text-ctp-text'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div
              id={`panel-${activeTab}`}
              role="tabpanel"
              aria-labelledby={`tab-${activeTab}`}
              className="flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-6"
            >
              {children}
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
