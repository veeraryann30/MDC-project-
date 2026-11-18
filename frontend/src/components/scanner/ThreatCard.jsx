import React, { useState } from 'react';
import { 
  AlertCircle, AlertTriangle, Info, CheckCircle2, 
  ChevronDown, ChevronUp, ArrowRight
} from 'lucide-react';

export default function ThreatCard({ threat, isSafe = false }) {
  const [isExpanded, setIsExpanded] = useState(true);

  const severityConfig = {
    HIGH: {
      border: 'border-[#FECACA]',
      badge: 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]',
      icon: AlertCircle,
      iconColor: 'text-[#DC2626]',
      accentBar: 'bg-[#DC2626]'
    },
    MEDIUM: {
      border: 'border-[#FDE68A]',
      badge: 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]',
      icon: AlertTriangle,
      iconColor: 'text-[#D97706]',
      accentBar: 'bg-[#F59E0B]'
    },
    LOW: {
      border: 'border-[#DBEAFE]',
      badge: 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]',
      icon: Info,
      iconColor: 'text-[#2563EB]',
      accentBar: 'bg-[#2563EB]'
    },
    INFORMATIONAL: {
      border: 'border-[#BBF7D0]',
      badge: 'bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]',
      icon: CheckCircle2,
      iconColor: 'text-[#16A34A]',
      accentBar: 'bg-[#16A34A]'
    }
  };

  const config = severityConfig[threat.severity] || severityConfig.MEDIUM;
  const Icon = config.icon;

  return (
    <div className={`rounded-xl bg-white border ${config.border} shadow-2xs hover:shadow-xs transition-all overflow-hidden mb-3 relative`}>
      {/* Colored Left Accent Strip */}
      <div className={`absolute top-0 bottom-0 left-0 w-1 ${config.accentBar}`} />

      {/* Header Bar */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="pl-5 pr-4 py-3.5 flex items-center justify-between cursor-pointer select-none hover:bg-[#F5F9FF] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-[#F5F9FF] border border-[#E2E8F0]">
            <Icon className={`w-4 h-4 ${config.iconColor}`} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-[#111827] text-xs sm:text-sm">
                {threat.title}
              </h4>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border ${config.badge}`}>
                {threat.severity}
              </span>
              {threat.category && (
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono text-[#64748B] bg-[#F5F9FF] border border-[#E2E8F0]">
                  {threat.category}
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#64748B] mt-0.5 line-clamp-1">
              {threat.what_was_detected}
            </p>
          </div>
        </div>

        <button 
          type="button"
          aria-label="Toggle details"
          className="p-1 text-[#64748B] hover:text-[#111827] transition-colors ml-2"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expandable Explainability Details */}
      {isExpanded && (
        <div className="pl-5 pr-4 pb-4 pt-2.5 border-t border-[#E2E8F0] text-xs space-y-3 bg-[#F8FAFC] font-sans">
          {/* 1. What was detected */}
          <div>
            <div className="flex items-center gap-1.5 text-[#111827] font-semibold mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
              <span>What Was Detected</span>
            </div>
            <p className="text-[#475569] pl-3 leading-relaxed text-xs">
              {threat.what_was_detected}
            </p>
          </div>

          {/* 2. Why it matters */}
          <div>
            <div className="flex items-center gap-1.5 text-[#111827] font-semibold mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
              <span>Why It Matters</span>
            </div>
            <p className="text-[#475569] pl-3 leading-relaxed text-xs">
              {threat.why_it_matters}
            </p>
          </div>

          {/* 3. How attackers use it */}
          <div>
            <div className="flex items-center gap-1.5 text-[#111827] font-semibold mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
              <span>How Attackers Use It</span>
            </div>
            <p className="text-[#475569] pl-3 leading-relaxed text-xs">
              {threat.how_attackers_use_it}
            </p>
          </div>

          {/* 4. What the user should do */}
          <div className="pt-2 border-t border-[#E2E8F0]">
            <div className="flex items-center gap-1.5 text-[#2563EB] font-semibold mb-1">
              <ArrowRight className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Recommended Operator Action</span>
            </div>
            <p className="text-[#111827] pl-3 font-medium bg-white p-3 rounded-lg border border-[#DBEAFE] text-xs shadow-2xs">
              {threat.what_to_do}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}