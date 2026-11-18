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
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-9 h-9'
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
        <svg 
          viewBox="0 0 32 32" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full logo-svg drop-shadow-sm"
        >
          {/* Subtle outer geometric shield outline */}
          <path 
            d="M16 3L6 7.5V15.5C6 22.2 10.3 27.8 16 29.5C21.7 27.8 26 22.2 26 15.5V7.5L16 3Z" 
            style={{ stroke: 'var(--ctp-border-strong)', fill: 'var(--ctp-surface)' }} 
            strokeWidth="1.5" 
            
          />

          {/* Inner protective contour */}
          <path 
            d="M16 6.2L8.5 9.8V15.5C8.5 20.8 11.8 25.2 16 26.8C20.2 25.2 23.5 20.8 23.5 15.5V9.8L16 6.2Z" 
            style={{ stroke: 'var(--ctp-accent)', fill: 'var(--ctp-bg)' }} 
            strokeWidth="1.2" 
            
          />

          {/* Phishing Hook / Precision Cursor Glyph in Primary Blue */}
          <path 
            d="M16 11V18C16 19.6569 14.6569 21 13 21C11.3431 21 10 19.6569 10 18" 
            style={{ stroke: 'var(--ctp-accent)' }} 
            strokeWidth="2" 
            strokeLinecap="round"
          />

          {/* Active Blue Detection Node */}
          <circle 
            cx="19.5" 
            cy="13.5" 
            r="2" 
            style={{ fill: 'var(--ctp-accent)' }} 
          />
        </svg>
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
