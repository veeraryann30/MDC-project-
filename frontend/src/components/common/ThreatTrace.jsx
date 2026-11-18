import React from 'react';
import { Check } from 'lucide-react';

/**
 * THREAT TRACE — Signature Analysis Stage Tracker
 * Visualizes the 4 stages of URL verification in modern light theme:
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
        <div className="relative w-24 h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
          <div 
            className="absolute top-0 bottom-0 left-0 bg-[#2563EB] transition-all duration-300 ease-out"
            style={{ width: isScanning ? `${progressPercent}%` : (stage >= 4 ? '100%' : '0%') }}
          />
        </div>
        <span className="text-[#64748B] text-[11px]">
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
        <div className="absolute left-3 right-3 top-1/2 -translate-y-1/2 h-[2px] bg-[#E2E8F0] z-0" />

        {/* Active Animated Progress Line in Primary Blue */}
        <div 
          className="absolute left-3 top-1/2 -translate-y-1/2 h-[2px] bg-[#2563EB] transition-all duration-300 ease-out z-0"
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

          return (
            <div 
              key={st.id} 
              className="relative z-10 flex flex-col items-center group"
            >
              {/* Node Circle */}
              <div 
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 text-[10px] font-mono font-medium ${
                  isCompleted
                    ? 'bg-[#F0FDF4] border-2 border-[#16A34A] text-[#16A34A] shadow-xs'
                    : isActive
                    ? 'bg-white border-2 border-[#2563EB] text-[#2563EB] shadow-[0_0_10px_rgba(37,99,235,0.4)] scale-110'
                    : 'bg-[#F5F9FF] border border-[#E2E8F0] text-[#64748B]'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                ) : (
                  <span>{st.id}</span>
                )}
              </div>

              {/* Node Label */}
              <div className="mt-2 text-center">
                <span 
                  className={`text-[11px] font-mono tracking-tight block transition-colors duration-150 ${
                    isActive
                      ? 'text-[#2563EB] font-bold'
                      : isCompleted
                      ? 'text-[#16A34A] font-medium'
                      : 'text-[#64748B]'
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