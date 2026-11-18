import React, { useRef, useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, Lock, Cpu, Globe, Search, ArrowRight, Activity, Zap } from 'lucide-react';

/**
 * HeroCyberVisual
 * Premium Apple/Stripe-level Cybersecurity Visual
 * Features:
 * - Floating security shield with soft ambient glow
 * - Minimal live threat detection interface card
 * - Animated blue scanning indicator beam
 * - Subtle blue glowing particles and radial ambient gradient
 * - Interactive GPU-accelerated 3D parallax tracking
 */
export default function HeroCyberVisual({ setActivePage, onScrollDown }) {
  const containerRef = useRef(null);
  const [scanStep, setScanStep] = useState(0);

  // Cycle through simulated scanner steps for rich live feeling
  useEffect(() => {
    const interval = setInterval(() => {
      setScanStep((prev) => (prev + 1) % 3);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;

    containerRef.current.style.setProperty('--mx', Math.max(-1, Math.min(1, x)).toFixed(3));
    containerRef.current.style.setProperty('--my', Math.max(-1, Math.min(1, y)).toFixed(3));
  };

  const handleMouseLeave = () => {
    if (!containerRef.current) return;
    containerRef.current.style.setProperty('--mx', '0');
    containerRef.current.style.setProperty('--my', '0');
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full max-w-[560px] mx-auto min-h-[460px] sm:min-h-[500px] flex items-center justify-center select-none py-4"
      style={{
        '--mx': '0',
        '--my': '0',
      }}
    >
      {/* ======================================================================
          1. SOFT BLUE RADIAL GRADIENTS & AMBIENT GLOW
          ====================================================================== */}
      <div 
        className="absolute inset-0 bg-gradient-to-tr from-blue-100/70 via-blue-50/40 to-transparent rounded-full filter blur-[70px] pointer-events-none transform -translate-y-4" 
        aria-hidden="true" 
      />
      <div 
        className="absolute w-72 h-72 rounded-full bg-[#2563EB]/10 filter blur-[60px] pointer-events-none" 
        aria-hidden="true" 
      />

      {/* ======================================================================
          2. FLOATING BLUE PARTICLES / AMBIENT NODES
          ====================================================================== */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {/* Particle 1 */}
        <span 
          className="absolute top-10 left-12 w-2.5 h-2.5 rounded-full bg-[#2563EB]/40 animate-pulse shadow-[0_0_10px_rgba(37,99,235,0.6)]"
          style={{ animationDuration: '3.2s' }}
        />
        {/* Particle 2 */}
        <span 
          className="absolute top-28 right-10 w-2 h-2 rounded-full bg-[#3B82F6]/50 animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.5)]"
          style={{ animationDuration: '4.1s', animationDelay: '1s' }}
        />
        {/* Particle 3 */}
        <span 
          className="absolute bottom-16 left-16 w-3 h-3 rounded-full bg-[#60A5FA]/30 animate-pulse shadow-[0_0_12px_rgba(37,99,235,0.4)]"
          style={{ animationDuration: '3.7s', animationDelay: '1.5s' }}
        />
        {/* Particle 4 */}
        <span 
          className="absolute bottom-24 right-14 w-2 h-2 rounded-full bg-[#2563EB]/40 animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.5)]"
          style={{ animationDuration: '4.5s', animationDelay: '0.5s' }}
        />
      </div>

      {/* ======================================================================
          3. MAIN CYBERSECURITY CONTAINER WITH 3D TILT
          ====================================================================== */}
      <div 
        className="relative z-10 w-full flex flex-col items-center transition-transform duration-300 ease-out"
        style={{
          transform: 'perspective(1000px) rotateY(calc(var(--mx, 0) * 8deg)) rotateX(calc(var(--my, 0) * -8deg)) translateY(calc(var(--my, 0) * 6px))',
        }}
      >
        {/* Floating Security Shield Badge on Top */}
        <div className="relative mb-5 animate-float-slow">
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-b from-white to-[#F5F9FF] border border-[#BFDBFE] p-1 flex items-center justify-center shadow-[0_12px_32px_rgba(37,99,235,0.18)]">
            {/* Glowing Inner Shield */}
            <div className="w-full h-full rounded-xl bg-gradient-to-tr from-[#2563EB] to-[#1E40AF] flex items-center justify-center text-white shadow-inner">
              <ShieldCheck className="w-10 h-10 text-white stroke-[2.2] drop-shadow-md" />
            </div>
            {/* Ambient Pulse Ring */}
            <span className="absolute -inset-1.5 rounded-3xl border border-[#2563EB]/25 animate-ping opacity-60 pointer-events-none" style={{ animationDuration: '3s' }} />
          </div>
        </div>

        {/* Minimal Threat Detection Interface Card */}
        <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-2xl border border-[#E2E8F0] shadow-[0_20px_50px_-10px_rgba(37,99,235,0.12),0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden relative group">
          {/* Animated Scanning Beam Indicator */}
          <div 
            className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#2563EB] to-transparent shadow-[0_0_12px_#2563EB] z-20 pointer-events-none animate-scan-line"
            aria-hidden="true" 
          />

          {/* Top Interface Bar */}
          <div className="px-5 py-3.5 bg-[#F5F9FF] border-b border-[#E2E8F0] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] animate-pulse" />
              <span className="text-xs font-semibold text-[#111827] tracking-tight">Zero-Execution Threat Guard</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white border border-[#DBEAFE] text-[10px] font-mono font-medium text-[#2563EB]">
              <Activity className="w-3 h-3 text-[#2563EB]" />
              <span>LIVE 34-POINT SCAN</span>
            </div>
          </div>

          {/* Main Inspection Body */}
          <div className="p-5 space-y-4">
            {/* Target Link Visual */}
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-7 h-7 rounded-lg bg-[#DBEAFE] flex items-center justify-center shrink-0">
                  <Globe className="w-3.5 h-3.5 text-[#2563EB]" />
                </div>
                <div className="flex flex-col truncate">
                  <span className="text-[10px] font-mono text-[#64748B] uppercase">Target Vector</span>
                  <span className="text-xs font-mono font-semibold text-[#111827] truncate">
                    {scanStep === 0 && 'https://verify-account.bank-portal.com'}
                    {scanStep === 1 && 'https://portal-secure-update.net/auth'}
                    {scanStep === 2 && 'https://legitimate-service.org/login'}
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-[#DC2626]/10 text-[#DC2626] font-mono text-[10px] font-semibold shrink-0">
                {scanStep === 0 ? 'ANALYZING' : scanStep === 1 ? 'FLAGGED' : 'SAFE'}
              </span>
            </div>

            {/* Verification Features Grid */}
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-[#F5F9FF] border border-[#E2E8F0] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-[#64748B] font-mono leading-none">Lexical Match</span>
                  <span className="text-xs font-semibold text-[#111827] mt-0.5">34 Features OK</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#F5F9FF] border border-[#E2E8F0] flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#2563EB] shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-[#64748B] font-mono leading-none">ML Random Forest</span>
                  <span className="text-xs font-semibold text-[#111827] mt-0.5">99.8% Confidence</span>
                </div>
              </div>
            </div>

            {/* Bottom Status Verdict Banner */}
            <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#64748B]">
                <Lock className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Isolated Sandbox Environment</span>
              </div>
              <button
                type="button"
                onClick={() => setActivePage && setActivePage('scanner')}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2563EB] hover:text-[#1E40AF] transition-colors cursor-pointer"
              >
                <span>Launch Scanner</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Floating Telemetry Chips Around Card */}
        <div className="w-full max-w-md flex items-center justify-between mt-3 px-2 text-[11px] font-mono text-[#64748B]">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#E2E8F0] shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
            <span>Static Analysis Mode</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#E2E8F0] shadow-xs">
            <Zap className="w-3 h-3 text-[#2563EB]" />
            <span>&lt; 250ms Response</span>
          </div>
        </div>
      </div>
    </div>
  );
}