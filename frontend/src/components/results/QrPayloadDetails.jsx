import React, { useState } from 'react';
import { Copy, Check, QrCode } from 'lucide-react';

/** What was decoded from the image or PDF, plus basic file facts. Shown as inert text; never opened. */
export default function QrPayloadDetails({ scanResult: r }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    if (!r.primary_content) return;
    navigator.clipboard.writeText(r.primary_content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const others = (r.extracted_contents || []).slice(1);

  return (
    <div className="space-y-4 rounded-2xl border border-[#E2E8F0] bg-white p-5 font-sans">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-[#111827]">
          <QrCode className="h-4 w-4 text-[#2563EB]" /> Decoded QR payload
        </h3>
        <button type="button" onClick={copy} className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-semibold text-[#2563EB] hover:text-[#1E40AF]">
          {copied ? <Check className="h-3 w-3 text-[#16A34A]" /> : <Copy className="h-3 w-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <div className="select-text break-all rounded-lg border border-[#E2E8F0] bg-[#F5F9FF] p-3 font-mono text-xs leading-relaxed text-[#111827]">
        {r.primary_content}
      </div>
      <p className="text-[11px] text-[#64748B]">
        {r.is_url ? 'The destination was never opened. Its address may be checked against threat-intelligence services.' : 'Inspected as plain text.'}
      </p>

      <dl className="grid grid-cols-2 gap-2.5 font-mono text-xs sm:grid-cols-4">
        {[
          ['File', r.filename],
          ['Type', r.file_type],
          ['Size', `${r.file_size_kb} KB`],
          ['QR codes', r.qr_count],
        ].map(([k, v]) => (
          <div key={k} className="min-w-0 rounded-xl border border-[#E2E8F0] bg-[#F5F9FF] p-3">
            <dt className="text-[10px] text-[#64748B]">{k}</dt>
            <dd className="truncate font-bold text-[#111827]" title={String(v)}>{v}</dd>
          </div>
        ))}
      </dl>

      {others.length > 0 && (
        <div>
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">Other codes found (not analysed)</span>
          <ul className="space-y-1.5">
            {others.map((c) => (
              <li key={c} className="select-text break-all rounded-lg border border-[#E2E8F0] bg-[#F5F9FF] px-3 py-2 font-mono text-[11px] text-[#475569]">{c}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
