import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';

/**
 * Bookmarklet: select a link's text (or nothing, to check the current page), click the bookmark,
 * and this site opens with that link already being scanned (App.jsx handles /?scan=).
 */
function buildBookmarklet(origin) {
  return (
    "javascript:(function(){var s=String(window.getSelection?window.getSelection():'').trim();" +
    `var u=s||location.href;window.open('${origin}/?scan='+encodeURIComponent(u),'_blank','noopener');})();`
  );
}

export default function BrowserTools() {
  const linkRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const code = useMemo(() => buildBookmarklet(window.location.origin), []);

  // React refuses javascript: hrefs in JSX, so it is set on the element directly (needed for drag-to-bookmarks).
  useEffect(() => {
    linkRef.current?.setAttribute('href', code);
  }, [code]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      /* clipboard blocked: the draggable link still works */
    }
  };

  return (
    <div className="p-6 rounded-[14px] bg-[#151517] border border-[#29292D]">
      <h3 className="text-sm font-semibold text-[#F5F5F5] uppercase tracking-wider font-mono">Browser tools</h3>
      <p className="text-xs text-[#92929A] mt-1 max-w-xl">
        Check links without leaving the page you are on. Links are analysed from their text and are never opened.
      </p>

      <div className="mt-5 space-y-5 text-xs text-[#C9C9D1]">
        <div>
          <div className="font-medium text-[#F5F5F5] text-[13px]">Bookmarklet (any browser)</div>
          <p className="mt-1 text-[#92929A] max-w-xl">
            Drag this button to your bookmarks bar. On any page, select a link's text and click it, or click it with nothing selected to check the page you are on.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2.5">
            <a
              ref={linkRef}
              draggable="true"
              onClick={(e) => e.preventDefault()}
              className="inline-flex cursor-grab items-center rounded-full border border-[#a855f7]/50 bg-[#a855f7]/10 px-4 py-2 text-[13px] font-medium text-[#F5F5F5] hover:bg-[#a855f7]/20"
            >
              Catch the Phish: check link
            </a>
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#29292D] px-3.5 py-2 text-[13px] text-[#C9C9D1] hover:border-[#a855f7] cursor-pointer"
            >
              {copied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
              {copied ? 'Copied' : 'Copy code'}
            </button>
          </div>
        </div>

        <div>
          <div className="font-medium text-[#F5F5F5] text-[13px]">Right-click extension (Chrome, Edge, Brave)</div>
          <ol className="mt-1 list-decimal space-y-1 pl-5 text-[#92929A] max-w-xl">
            <li>Open <code className="rounded bg-[#0A0A0B] px-1.5 py-0.5 text-[#C9C9D1]">chrome://extensions</code> and turn on Developer mode.</li>
            <li>Choose Load unpacked and select the <code className="rounded bg-[#0A0A0B] px-1.5 py-0.5 text-[#C9C9D1]">extension</code> folder from the project.</li>
            <li>Enter your service address when the options page opens.</li>
            <li>Right-click any link and choose Check this link with Catch the Phish.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
