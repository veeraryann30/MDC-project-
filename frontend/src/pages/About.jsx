import React, { useState, useEffect } from 'react';
import { 
  Info, Cpu, ShieldAlert, Code2, Database, Award, CheckCircle2, 
  ExternalLink, Layers, Terminal, AlertTriangle 
} from 'lucide-react';
import { api } from '../services/api';

export default function About() {
  const [mlMetrics, setMlMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const data = await api.getMLMetrics();
        setMlMetrics(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadMetrics();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-12">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 border border-orange-500/40 text-orange-400 text-xs font-mono">
          <Terminal className="w-3.5 h-3.5" />
          <span>System Architecture & Technical Specifications</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
          About Catch the Phish
        </h1>
        <p className="text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
          An explainable AI and cybersecurity engineering project designed to address the critical vulnerability in human link verification: lack of transparency.
        </p>
      </div>

      {/* Core Philosophy & USP */}
      <div className="p-8 rounded-3xl bg-[#090C13] border border-orange-500/40 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-950/40 border border-orange-500/40 flex items-center justify-center">
            <Award className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Unique Selling Proposition (USP)</h2>
            <p className="text-xs text-orange-400 font-mono">SCAN → ANALYZE → EXPLAIN → EDUCATE</p>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          Traditional security scanners provide a binary <code className="text-rose-400">"Dangerous"</code> or <code className="text-emerald-400">"Safe"</code> label with no underlying context. Catch the Phish unbundles every flagged threat into:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 text-xs font-mono">
          <div className="p-3 rounded-xl bg-[#06080E] border border-[#1C2230]">
            <strong className="text-orange-400 block mb-1">1. What was detected</strong>
            Observed URL structure or token anomaly
          </div>
          <div className="p-3 rounded-xl bg-[#06080E] border border-[#1C2230]">
            <strong className="text-amber-300 block mb-1">2. Why it matters</strong>
            The security risk & hazard implication
          </div>
          <div className="p-3 rounded-xl bg-[#06080E] border border-[#1C2230]">
            <strong className="text-rose-300 block mb-1">3. How attackers use it</strong>
            Real-world adversary exploitation tactics
          </div>
          <div className="p-3 rounded-xl bg-[#06080E] border border-[#1C2230]">
            <strong className="text-emerald-300 block mb-1">4. What you should do</strong>
            Actionable guidance for the end user
          </div>
        </div>
      </div>

      {/* Engineering Philosophy: Andrej Karpathy Guidelines */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#090C13] border border-[#1C2230] space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-950/40 border border-orange-500/30 flex items-center justify-center">
            <Terminal className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">
              Engineering Philosophy: Guided by Andrej Karpathy's Principles
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Enforcing disciplined AI engineering, minimal code surface, and verifiable execution
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
          <div className="p-4 rounded-xl bg-[#06080E] border border-[#1C2230] space-y-1.5">
            <div className="flex items-center gap-2 text-orange-400 font-bold font-mono">
              <span>01. Think Before Coding</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Every design decision—from the 0–100 scoring thresholds to the Levenshtein brand distance limits—was modeled explicitly. Tradeoffs between false positives and detection recall are surfaced transparently.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[#06080E] border border-[#1C2230] space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-400 font-bold font-mono">
              <span>02. Simplicity First</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Rather than introducing bloated deep neural networks or opaque embeddings, Catch the Phish utilizes an interpretable 34-feature vector and Random Forest. Minimal code, zero unnecessary dependencies, and maximum explainability.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[#06080E] border border-[#1C2230] space-y-1.5">
            <div className="flex items-center gap-2 text-amber-400 font-bold font-mono">
              <span>03. Surgical Changes</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Clean modular separation of concerns: feature extraction, brand detection, heuristic evaluation, ML inference, and persistent audit logging operate as independent, surgical units.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[#06080E] border border-[#1C2230] space-y-1.5">
            <div className="flex items-center gap-2 text-blue-400 font-bold font-mono">
              <span>04. Goal-Driven Execution</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              No assumed correctness. Every model evaluation is backed by real confusion matrices, stratified test sets, empirical precision/recall metrics, and end-to-end live testing.
            </p>
          </div>
        </div>
      </div>

      {/* Machine Learning Pipeline Stats */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-orange-400" />
          <h3 className="font-bold text-white text-lg">
            Machine Learning Pipeline & Model Evaluation
          </h3>
        </div>

        {loading ? (
          <div className="p-8 bg-[#090C13] rounded-2xl text-center text-xs font-mono text-orange-400">
            Loading ML training evaluation metrics...
          </div>
        ) : mlMetrics ? (
          <div className="space-y-4">
            {/* Top ML Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-[#090C13] border border-[#1C2230] text-center">
                <div className="text-[11px] font-mono text-slate-400 uppercase">Test Accuracy</div>
                <div className="text-2xl font-bold font-mono text-orange-400 mt-1">
                  {(mlMetrics.models.random_forest.accuracy * 100).toFixed(1)}%
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Random Forest</div>
              </div>
              <div className="p-4 rounded-2xl bg-[#090C13] border border-[#1C2230] text-center">
                <div className="text-[11px] font-mono text-slate-400 uppercase">F1-Score</div>
                <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                  {(mlMetrics.models.random_forest.f1_score * 100).toFixed(1)}%
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Harmonic Mean</div>
              </div>
              <div className="p-4 rounded-2xl bg-[#090C13] border border-[#1C2230] text-center">
                <div className="text-[11px] font-mono text-slate-400 uppercase">Precision</div>
                <div className="text-2xl font-bold font-mono text-blue-400 mt-1">
                  {(mlMetrics.models.random_forest.precision * 100).toFixed(1)}%
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Low False Positives</div>
              </div>
              <div className="p-4 rounded-2xl bg-[#090C13] border border-[#1C2230] text-center">
                <div className="text-[11px] font-mono text-slate-400 uppercase">Recall</div>
                <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
                  {(mlMetrics.models.random_forest.recall * 100).toFixed(1)}%
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">True Phish Identified</div>
              </div>
            </div>

            {/* Model Comparison Table */}
            <div className="p-6 rounded-2xl bg-[#090C13] border border-[#1C2230] space-y-3">
              <h4 className="text-xs font-mono uppercase text-slate-300 font-bold tracking-wider">
                Model Comparison: Random Forest vs. Logistic Regression Baseline
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left font-mono">
                  <thead>
                    <tr className="border-b border-[#1C2230] text-slate-400">
                      <th className="py-2.5 px-3">Algorithm</th>
                      <th className="py-2.5 px-3">Accuracy</th>
                      <th className="py-2.5 px-3">Precision</th>
                      <th className="py-2.5 px-3">Recall</th>
                      <th className="py-2.5 px-3">F1-Score</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1C2230]">
                    <tr className="bg-orange-950/20 text-white font-bold">
                      <td className="py-3 px-3 text-orange-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Random Forest (120 Trees)</span>
                      </td>
                      <td className="py-3 px-3">{(mlMetrics.models.random_forest.accuracy * 100).toFixed(1)}%</td>
                      <td className="py-3 px-3">{(mlMetrics.models.random_forest.precision * 100).toFixed(1)}%</td>
                      <td className="py-3 px-3">{(mlMetrics.models.random_forest.recall * 100).toFixed(1)}%</td>
                      <td className="py-3 px-3">{(mlMetrics.models.random_forest.f1_score * 100).toFixed(1)}%</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                          Production Model
                        </span>
                      </td>
                    </tr>
                    <tr className="text-slate-400">
                      <td className="py-3 px-3">Logistic Regression</td>
                      <td className="py-3 px-3">{(mlMetrics.models.logistic_regression.accuracy * 100).toFixed(1)}%</td>
                      <td className="py-3 px-3">{(mlMetrics.models.logistic_regression.precision * 100).toFixed(1)}%</td>
                      <td className="py-3 px-3">{(mlMetrics.models.logistic_regression.recall * 100).toFixed(1)}%</td>
                      <td className="py-3 px-3">{(mlMetrics.models.logistic_regression.f1_score * 100).toFixed(1)}%</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-[#06080E] text-slate-400 border border-[#1C2230]">
                          Baseline
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
