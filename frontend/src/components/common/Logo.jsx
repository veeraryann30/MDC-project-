import React from 'react';

/**
 * Minimal Geometric Brand Logo for Catch the Phish (SHADOW UI)
 * Combines: Shield geometry + phishing hook / cursor notch + digital protection node.
 */
export default function Logo({ 
  size = 'md', 
  withWordmark = true, 
  withTagline = false,
  className = '' 
}) {
  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-8 h-8',
    xl: 'w-10 h-10'
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  };

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Geometric Shield + Hook Glyph */}
      <div className={`relative ${iconSizes[size] || iconSizes.md} shrink-0 flex items-center justify-center`}>
        <svg 
          viewBox="0 0 32 32" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full logo-svg"
        >
          {/* Subtle outer geometric shield outline */}
          <path 
            d="M16 3L6 7.5V15.5C6 22.2 10.3 27.8 16 29.5C21.7 27.8 26 22.2 26 15.5V7.5L16 3Z" 
            stroke="#29292D" 
            strokeWidth="1.5" 
            fill="#151517"
          />

          {/* Inner protective contour */}
          <path 
            d="M16 6.2L8.5 9.8V15.5C8.5 20.8 11.8 25.2 16 26.8C20.2 25.2 23.5 20.8 23.5 15.5V9.8L16 6.2Z" 
            stroke="#38383E" 
            strokeWidth="1.2" 
            fill="#101012"
          />

          {/* Phishing Hook / Precision Cursor Glyph */}
          <path 
            d="M16 11V18C16 19.6569 14.6569 21 13 21C11.3431 21 10 19.6569 10 18" 
            stroke="#F5F5F5" 
            strokeWidth="1.75" 
            strokeLinecap="round"
          />

          {/* Restrained Brand Accent: Detection Dot */}
          <circle 
            cx="19.5" 
            cy="13.5" 
            r="2" 
            fill="#FF6B35" 
          />
        </svg>
      </div>

      {/* Brand Wordmark */}
      {withWordmark && (
        <div className="flex flex-col leading-none">
          <div className={`font-semibold tracking-[-0.01em] text-[#F5F5F5] ${textSizes[size] || textSizes.md}`}>
            Catch the Phish
          </div>
          {withTagline && (
            <div className="text-[11px] text-[#92929A] tracking-normal font-normal mt-1">
              Don't trust the link. Verify it.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
