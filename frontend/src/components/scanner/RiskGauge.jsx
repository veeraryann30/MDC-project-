import React from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert } from 'lucide-react';

export default function RiskGauge({ score = 0, classification = 'SAFE', label = '' }) {
  const normalizedScore = Math.min(100, Math.max(0, Math.round(score)));

  // Strict thresholds according to prompt:
  // 0–30 = Safe
  // 31–60 = Suspicious
  // 61–100 = Dangerous
  let config = {
    ring: 'text-emerald-500',
    text: 'text-emerald-400',
    badge: 'bg-emerald-950/80 text-emerald-300 border-emerald-800',
    border: 'border-emerald-500/30',
    status: 'SAFE',
    icon: ShieldCheck,
    headline: 'Legitimate / Low Risk URL',
    subtext: 'No critical threat signatures identified in lexical or structural analysis.'
  };

  if (normalizedScore >= 61 || classification === 'PHISHING' || classification === 'DANGEROUS') {
    config = {
      ring: 'text-rose-500',
      text: 'text-rose-400',
      badge: 'bg-rose-950/80 text-rose-300 border-rose-800',
      border: 'border-rose-500/40',
      status: 'DANGEROUS',
      icon: ShieldAlert,
      headline: 'Potential Phishing Threat Detected',
      subtext: 'High-probability credential harvester or adversarial domain structure.'
    };
  } else if (normalizedScore >= 31 || classification === 'SUSPICIOUS') {
    config = {
      ring: 'text-amber-500',
      text: 'text-amber-400',
      badge: 'bg-amber-950/80 text-amber-300 border-amber-800',
      border: 'border-amber-500/40',
      status: 'SUSPICIOUS',
      icon: AlertTriangle,
      headline: 'Suspicious Anomalies Identified',
      subtext: 'Anomalous structure or misleading keywords detected. Exercise high caution.'
    };
  }

  const StatusIcon = config.icon;

  // SVG Circular progress math (radius 72, viewBox 180x180)
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  return (
    <div className={`p-6 rounded-2xl bg-[#090C13] border ${config.border} flex flex-col items-center justify-center text-center relative overflow-hidden`}>
      {/* Background ambient gradient */}
      <div 
        className={`absolute inset-0 opacity-10 pointer-events-none blur-3xl ${
          normalizedScore >= 61 ? 'bg-rose-600' : normalizedScore >= 31 ? 'bg-amber-500' : 'bg-emerald-500'
        }`} 
      />

      {/* SVG Radial Gauge */}
      <div className="relative w-48 h-48 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 180 180">
          {/* Background Track */}
          <circle
            cx="90"
            cy="90"
            r={radius}
            stroke="currentColor"
            strokeWidth="11"
            className="text-slate-800/80"
            fill="transparent"
          />
          {/* Progress Arc */}
          <circle
            cx="90"
            cy="90"
            r={radius}
            stroke="currentColor"
            strokeWidth="11"
            className={`${config.ring} transition-all duration-1000 ease-out`}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>

        {/* Center Readout */}
        <div className="absolute flex flex-col items-center justify-center select-none">
          <span className="text-4xl font-black font-mono text-white tracking-tight">
            {normalizedScore}
          </span>
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest mt-0.5">
            / 100 Score
          </span>
        </div>
      </div>

      {/* Verdict & Badge */}
      <div className="mt-4 flex flex-col items-center gap-2">
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono uppercase tracking-wider border ${config.badge}`}>
          <StatusIcon className="w-4 h-4" />
          <span>Status: {config.status}</span>
        </div>
        <h3 className="font-bold text-white text-base mt-1">
          {config.headline}
        </h3>
        <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
          {label || config.subtext}
        </p>
      </div>
    </div>
  );
}
