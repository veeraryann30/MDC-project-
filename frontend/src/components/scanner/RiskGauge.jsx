import React from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert } from 'lucide-react';

export default function RiskGauge({ score = 0, classification = 'SAFE', label = '' }) {
  const normalizedScore = Math.min(100, Math.max(0, Math.round(score)));

  // Strict thresholds:
  // 0–30 = Safe (#16A34A)
  // 31–60 = Suspicious (#F59E0B)
  // 61–100 = Dangerous (#DC2626)
  let config = {
    ring: 'text-[#16A34A]',
    text: 'text-[#16A34A]',
    badge: 'bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]',
    border: 'border-[#BBF7D0]',
    glowBg: 'bg-[#16A34A]/5',
    status: 'SAFE',
    icon: ShieldCheck,
    headline: 'Legitimate / Low Risk URL',
    subtext: 'No critical threat signatures identified in lexical or structural analysis.'
  };

  if (normalizedScore >= 61 || classification === 'PHISHING' || classification === 'DANGEROUS') {
    config = {
      ring: 'text-[#DC2626]',
      text: 'text-[#DC2626]',
      badge: 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]',
      border: 'border-[#FECACA]',
      glowBg: 'bg-[#DC2626]/5',
      status: 'DANGEROUS',
      icon: ShieldAlert,
      headline: 'Potential Phishing Threat Detected',
      subtext: 'High-probability credential harvester or adversarial domain structure.'
    };
  } else if (normalizedScore >= 31 || classification === 'SUSPICIOUS') {
    config = {
      ring: 'text-[#F59E0B]',
      text: 'text-[#D97706]',
      badge: 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]',
      border: 'border-[#FDE68A]',
      glowBg: 'bg-[#F59E0B]/5',
      status: 'SUSPICIOUS',
      icon: AlertTriangle,
      headline: 'Suspicious Anomalies Identified',
      subtext: 'Anomalous structure or misleading keywords detected. Exercise high caution.'
    };
  }

  const StatusIcon = config.icon;

  // SVG Circular progress math (radius 70, viewBox 180x180)
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  return (
    <div className={`p-6 sm:p-7 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden`}>
      {/* Background subtle ambient gradient */}
      <div 
        className={`absolute inset-0 ${config.glowBg} pointer-events-none blur-2xl`} 
      />

      {/* SVG Radial Gauge */}
      <div className="relative w-48 h-48 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 180 180">
          {/* Background Track in Light Slate */}
          <circle
            cx="90"
            cy="90"
            r={radius}
            stroke="currentColor"
            strokeWidth="11"
            className="text-[#E2E8F0]"
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
          <span className="text-4xl font-extrabold font-mono text-[#111827] tracking-tight">
            {normalizedScore}
          </span>
          <span className="text-[11px] font-mono text-[#64748B] uppercase tracking-widest mt-0.5">
            / 100 Score
          </span>
        </div>
      </div>

      {/* Verdict & Badge */}
      <div className="mt-4 flex flex-col items-center gap-2 relative z-10">
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono uppercase tracking-wider border ${config.badge}`}>
          <StatusIcon className="w-4 h-4" />
          <span>Status: {config.status}</span>
        </div>
        <h3 className="font-bold text-[#111827] text-base mt-1">
          {config.headline}
        </h3>
        <p className="text-xs text-[#64748B] max-w-xs leading-relaxed">
          {label || config.subtext}
        </p>
      </div>
    </div>
  );
}