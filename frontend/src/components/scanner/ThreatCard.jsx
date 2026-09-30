import React, { useState } from 'react';
import { 
  AlertCircle, AlertTriangle, Info, CheckCircle2, 
  ChevronDown, ChevronUp, ArrowRight, Shield 
} from 'lucide-react';

export default function ThreatCard({ threat, isSafe = false }) {
  const [isExpanded, setIsExpanded] = useState(true);

  const severityConfig = {
    HIGH: {
      border: 'border-rose-500/40 hover:border-rose-500/60',
      badge: 'bg-rose-950/80 text-rose-300 border-rose-800',
      icon: AlertCircle,
      iconColor: 'text-rose-400',
      accentBar: 'bg-rose-500'
    },
    MEDIUM: {
      border: 'border-amber-500/40 hover:border-amber-500/60',
      badge: 'bg-amber-950/80 text-amber-300 border-amber-800',
      icon: AlertTriangle,
      iconColor: 'text-amber-400',
      accentBar: 'bg-amber-500'
    },
    LOW: {
      border: 'border-orange-500/30 hover:border-orange-500/50',
      badge: 'bg-orange-950/80 text-orange-300 border-orange-800',
      icon: Info,
      iconColor: 'text-orange-400',
      accentBar: 'bg-orange-500'
    },
    INFORMATIONAL: {
      border: 'border-emerald-500/30 hover:border-emerald-500/50',
      badge: 'bg-emerald-950/80 text-emerald-300 border-emerald-800',
      icon: CheckCircle2,
      iconColor: 'text-emerald-400',
      accentBar: 'bg-emerald-500'
    }
  };

  const config = severityConfig[threat.severity] || severityConfig.MEDIUM;
  const Icon = config.icon;

  return (
    <div className={`rounded-xl bg-[#090C13] border ${config.border} transition-all overflow-hidden mb-3 relative`}>
      {/* Colored Left Accent Strip */}
      <div className={`absolute top-0 bottom-0 left-0 w-1 ${config.accentBar}`} />

      {/* Header Bar */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="pl-5 pr-4 py-3.5 flex items-center justify-between cursor-pointer select-none hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-[#06080E] border border-[#1C2230]">
            <Icon className={`w-4 h-4 ${config.iconColor}`} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-white text-xs sm:text-sm">
                {threat.title}
              </h4>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border ${config.badge}`}>
                {threat.severity}
              </span>
              {threat.category && (
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-black/60 border border-[#1C2230]">
                  {threat.category}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
              {threat.what_was_detected}
            </p>
          </div>
        </div>

        <button 
          type="button"
          aria-label="Toggle details"
          className="p-1 text-slate-400 hover:text-white transition-colors ml-2"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expandable Explainability Details */}
      {isExpanded && (
        <div className="pl-5 pr-4 pb-4 pt-1 border-t border-[#1C2230] text-xs space-y-3 bg-[#06080E]/60 font-sans">
          {/* 1. What was detected */}
          <div>
            <div className="flex items-center gap-1.5 text-slate-200 font-semibold mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
              <span>What Was Detected</span>
            </div>
            <p className="text-slate-300 pl-3 leading-relaxed text-xs">
              {threat.what_was_detected}
            </p>
          </div>

          {/* 2. Why it matters */}
          <div>
            <div className="flex items-center gap-1.5 text-slate-200 font-semibold mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>Why It Matters</span>
            </div>
            <p className="text-slate-300 pl-3 leading-relaxed text-xs">
              {threat.why_it_matters}
            </p>
          </div>

          {/* 3. How attackers use it */}
          <div>
            <div className="flex items-center gap-1.5 text-slate-200 font-semibold mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              <span>How Attackers Use It</span>
            </div>
            <p className="text-slate-300 pl-3 leading-relaxed text-xs">
              {threat.how_attackers_use_it}
            </p>
          </div>

          {/* 4. What the user should do */}
          <div className="pt-2 border-t border-[#1C2230]">
            <div className="flex items-center gap-1.5 text-orange-400 font-semibold mb-1">
              <ArrowRight className="w-3.5 h-3.5 text-orange-400" />
              <span>Recommended Operator Action</span>
            </div>
            <p className="text-slate-200 pl-3 font-medium bg-orange-950/20 p-2.5 rounded-lg border border-orange-500/30 text-xs">
              {threat.what_to_do}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
