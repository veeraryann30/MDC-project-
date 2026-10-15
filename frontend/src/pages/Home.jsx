import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, Cpu, Lock, Eye, AlertTriangle, ArrowRight, Zap, CheckCircle2, Award, Terminal } from 'lucide-react';
import UrlScanner from '../components/scanner/UrlScanner';
import { api } from '../services/api';

export default function Home({ setActivePage, setScanResult }) {
  const [stats, setStats] = useState({
    total_scans: 0,
    phishing_count: 0,
    safe_count: 0,
    avg_risk_score: 0
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await api.getDashboardStats();
        setStats(data);
      } catch (err) {
        // Default demo stats if backend starting
      }
    };
    loadStats();
  }, []);

  const handleScanComplete = (result) => {
    setScanResult(result);
    setActivePage('results');
  };

  const steps = [
    {
      num: '01',
      title: 'Paste',
      desc: 'Enter any untrusted or suspicious URL safely.',
      border: 'border-orange-500/30'
    },
    {
      num: '02',
      title: 'Analyze',
      desc: 'Our engine extracts 34 lexical and security features and evaluates ML models.',
      border: 'border-orange-500/30'
    },
    {
      num: '03',
      title: 'Understand',
      desc: 'View an explainable risk score breaking down why the link is dangerous.',
      border: 'border-amber-500/30'
    },
    {
      num: '04',
      title: 'Learn',
      desc: 'Master the attacker’s techniques and protect yourself on future links.',
      border: 'border-emerald-500/30'
    }
  ];

  const featuresList = [
    {
      icon: Eye,
      title: 'Explainable AI Detection',
      desc: 'We never just say "This is phishing". We explain the exact mechanics behind every flagged anomaly in plain language.'
    },
    {
      icon: ShieldAlert,
      title: 'Brand Impersonation Engine',
      desc: 'Modular Levenshtein distance & homoglyph detection uncovering typosquats of PayPal, Google, Apple, and banks.'
    },
    {
      icon: Cpu,
      title: 'Scikit-Learn ML Pipeline',
      desc: 'Trained on thousands of benign and adversarial URLs utilizing Random Forest and Logistic Regression models.'
    },
    {
      icon: Lock,
      title: 'Zero-Execution Safety',
      desc: 'Zero network calls to target sites. URLs are evaluated strictly as untrusted data, keeping your browser 100% safe.'
    }
  ];

  return (
    <div className="space-y-24 py-6">
      {/* Hero Section */}
      <section className="relative text-center space-y-6 pt-8 sm:pt-14 max-w-4xl mx-auto px-4">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 border border-orange-500/40 text-orange-400 text-xs font-mono">
          <Terminal className="w-3.5 h-3.5 text-orange-400" />
          <span>Explainable Phishing Intelligence Platform</span>
        </div>

        {/* Title & Tagline */}
        <div className="space-y-3">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white uppercase">
            CATCH THE <span className="text-[#FF6B00]">PHISH</span>
          </h1>
          <p className="text-xl sm:text-2xl font-mono text-orange-400 font-semibold tracking-wide">
            “Don’t Click. Check First.”
          </p>
        </div>

        <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          Analyze suspicious links before opening them. Our multi-layered security engine unmasks credential harvesters, lookalike brands, and hidden exploits—then teaches you how they work.
        </p>

        {/* Scanner Component */}
        <div className="pt-6">
          <UrlScanner onScanComplete={handleScanComplete} />
        </div>

        {/* Quick Stats Bar */}
        <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto font-mono text-xs">
          <div className="p-3 rounded-xl bg-[#090C13] border border-[#1C2230] text-center">
            <div className="text-xl font-bold text-white">{stats.total_scans || '3,400+'}</div>
            <div className="text-slate-400 text-[11px] mt-0.5">URLs Scanned</div>
          </div>
          <div className="p-3 rounded-xl bg-[#090C13] border border-[#1C2230] text-center">
            <div className="text-xl font-bold text-rose-400">{stats.phishing_count || '1,600+'}</div>
            <div className="text-slate-400 text-[11px] mt-0.5">Phishing Blocked</div>
          </div>
          <div className="p-3 rounded-xl bg-[#090C13] border border-[#1C2230] text-center">
            <div className="text-xl font-bold text-emerald-400">34</div>
            <div className="text-slate-400 text-[11px] mt-0.5">Features Extracted</div>
          </div>
          <div className="p-3 rounded-xl bg-[#090C13] border border-[#1C2230] text-center">
            <div className="text-xl font-bold text-orange-400">100%</div>
            <div className="text-slate-400 text-[11px] mt-0.5">Zero Execution</div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 scroll-reveal">
        <div className="text-center space-y-2 mb-12">
          <h2 className="text-xs font-mono uppercase tracking-widest text-orange-400 font-bold">
            Workflow Architecture
          </h2>
          <h3 className="text-2xl sm:text-3xl font-bold text-white">
            How Catch the Phish Works
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            A 4-step security pipeline from untrusted string input to actionable human learning.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className={`p-6 rounded-2xl bg-[#090C13] border ${step.border} relative overflow-hidden group hover:border-orange-500 transition-all scroll-reveal scroll-stagger-${idx + 1}`}
            >
              <div className="text-3xl font-black font-mono text-slate-700/60 mb-3 group-hover:text-orange-400/40 transition-colors">
                {step.num}
              </div>
              <h4 className="text-lg font-bold text-white mb-2">
                {step.title}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Product Highlights */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 scroll-reveal">
        <div className="text-center space-y-2 mb-12">
          <h2 className="text-xs font-mono uppercase tracking-widest text-orange-400 font-bold">
            Core Capabilities
          </h2>
          <h3 className="text-2xl sm:text-3xl font-bold text-white">
            Built for Real-World Cyber Defense
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {featuresList.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className={`p-6 rounded-2xl bg-[#090C13] border border-[#1C2230] flex gap-4 items-start hover:border-orange-500/40 transition-all scroll-reveal scroll-stagger-${(idx % 2) + 1}`}
              >
                <div className="p-3 rounded-xl bg-orange-950/40 border border-orange-500/30 shrink-0">
                  <Icon className="w-6 h-6 text-orange-400" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-white">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Academy CTA Banner */}
      <section className="max-w-5xl mx-auto px-4 scroll-reveal">
        <div className="p-8 sm:p-10 rounded-3xl bg-[#090C13] border border-orange-500/40 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono text-orange-400 font-semibold uppercase">
              <Award className="w-4 h-4" />
              <span>Interactive Cybersecurity Academy</span>
            </div>
            <h3 className="text-2xl font-bold text-white">
              Want to Test Your Phishing Detection Skills?
            </h3>
            <p className="text-xs text-slate-300 max-w-lg">
              Explore 10 hands-on attack breakdown cards and challenge yourself with our interactive 6-question Phishing IQ Quiz.
            </p>
          </div>
          <button
            onClick={() => setActivePage('learn')}
            className="px-6 py-3 bg-[#FF6B00] hover:bg-[#FFA043] text-black font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 shadow-[0_0_20px_rgba(255,107,0,0.3)] transition-all shrink-0 cursor-pointer"
          >
            <span>Enter Phishing Academy</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
}
