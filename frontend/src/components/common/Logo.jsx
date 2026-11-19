import React from 'react';

/**
 * Premium Modern Light Brand Logo for Catch the Phish
 * White and Blue visual system: #FFFFFF, #F5F9FF, #2563EB, #1E40AF, #111827.
 */
export default function Logo({ 
  size = 'md', 
  withWordmark = true, 
  withTagline = false,
  uppercase = true,
  tone = 'light',
  className = ''
}) {
  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-9 h-9',
    xl: 'w-11 h-11'
  };

  const textSizes = {
    sm: 'text-xs tracking-wider',
    md: 'text-sm tracking-wider',
    lg: 'text-base tracking-wider',
    xl: 'text-lg tracking-wider'
  };

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Geometric Shield + Hook Glyph in Blue & White */}
      <div className={`relative ${iconSizes[size] || iconSizes.md} shrink-0 flex items-center justify-center`}>
        <img
          src="/logo-mark.svg"
          alt=""
          aria-hidden="true"
          draggable="false"
          className="w-full h-full logo-svg drop-shadow-sm"
        />
      </div>

      {/* Brand Wordmark */}
      {withWordmark && (
        <div className="flex flex-col leading-none">
          <div className={`font-bold font-sans ${uppercase ? 'uppercase tracking-[0.08em]' : 'tracking-tight'} ${'text-ctp-text'} ${textSizes[size] || textSizes.md}`}>
            Catch the Phish<span className="text-[10px] text-ctp-accent-text ml-0.5 font-normal">™</span>
          </div>
          {withTagline && (
            <div className="text-[10px] text-[#64748B] tracking-wider uppercase font-mono mt-1">
              Zero-Execution Security
            </div>
          )}
        </div>
      )}
    </div>
  );
}
