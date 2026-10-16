import React from 'react';
import { Check } from 'lucide-react';

/**
 * THREAT TRACE — Signature Analysis Stage Tracker (SHADOW UI)
 * Visualizes the 4 stages of URL verification:
 * URL RECEIVED → URL ANALYSIS → INDICATOR CHECKS → REPORT
 */
export default function ThreatTrace({ 
  stage = 0, 
  isScanning = false, 
  compact = false,
  className = '' 
}) {
  const stages = [
    { id: 1, label: 'URL Received', short: 'Received' },
    { id: 2, label: 'URL Analysis', short: 'Analysis' },
    { id: 3, label: 'Indicator Checks', short: 'Indicators' },
    { id: 4, label: 'Report', short: 'Report' }
  ];

  // Calculate progress percentage: 1: 0%, 2: 33%, 3: 66%, 4: 100%
  const currentStage = Math.max(1, Math.min(4, stage || 1));
  const progressPercent = ((currentStage - 1) / (stages.length - 1)) * 100;

  if (compact) {
    return (
      <div className={`flex items-center gap-2 text-xs font-mono ${className}`}>
        <div className="relative w-24 h-1 bg-[#29292D] rounded-full overflow-hidden">
          <div 
            className="absolute top-0 bottom-0 left-0 bg-[#FF6B35] transition-all duration-300 ease-out"
            style={{ width: isScanning ? `${progressPercent}%` : (stage >= 4 ? '100%' : '0%') }}
          />
        </div>
        <span className="text-[#92929A] text-[11px]">
          {isScanning ? stages[currentStage - 1]?.label : 'Ready'}
        </span>
      </div>
    );
  }

  return (
    <div className={`w-full py-3 select-none ${className}`}>
      {/* Top track container */}
      <div className="relative flex items-center justify-between">
        {/* Background Connecting Line */}
        <div className="absolute left-3 right-3 top-1/2 -translate-y-1/2 h-[1.5px] bg-[#29292D] z-0" />

        {/* Active Animated Progress Line */}
        <div 
          className="absolute left-3 top-1/2 -translate-y-1/2 h-[1.5px] bg-[#FF6B35] transition-all duration-300 ease-out z-0"
          style={{ 
            width: isScanning || stage >= 4 
              ? `calc(${progressPercent}% * (100% - 24px) / 100)` 
              : '0%' 
          }}
        />

        {/* Stage Nodes */}
        {stages.map((st) => {
          const isCompleted = stage > st.id || (stage === 4 && st.id === 4);
          const isActive = stage === st.id && isScanning;
          const isPending = stage < st.id;

          return (
            <div 
              key={st.id} 
              className="relative z-10 flex flex-col items-center group"
            >
              {/* Node Circle */}
              <div 
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 text-[10px] font-mono font-medium ${
                  isCompleted
                    ? 'bg-[#151517] border border-[#35C98A] text-[#35C98A]'
                    : isActive
                    ? 'bg-[#151517] border-2 border-[#FF6B35] text-[#FF6B35] shadow-[0_0_8px_rgba(255,107,53,0.3)]'
                    : 'bg-[#101012] border border-[#29292D] text-[#686870]'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-3 h-3 stroke-[2.5]" />
                ) : (
                  <span>{st.id}</span>
                )}
              </div>

              {/* Node Label */}
              <div className="mt-2 text-center">
                <span 
                  className={`text-[11px] font-mono tracking-tight block transition-colors duration-150 ${
                    isActive
                      ? 'text-[#F5F5F5] font-semibold'
                      : isCompleted
                      ? 'text-[#92929A]'
                      : 'text-[#686870]'
                  }`}
                >
                  <span className="hidden sm:inline">{st.label}</span>
                  <span className="sm:hidden">{st.short}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
