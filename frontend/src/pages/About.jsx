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
      <div className="text-center space-y-3 scroll-reveal">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#151517] border border-[#29292D] text-[#FF6B35] text-xs font-mono">
          <Terminal className="w-3.5 h-3.5" />
          <span>System Architecture & Technical Specifications</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-semibold text-[#F5F5F5] tracking-tight">
          About Catch the Phish
        </h1>
        <p className="text-sm text-[#92929A] max-w-2xl mx-auto leading-relaxed">
          An explainable AI and cybersecurity engineering project designed to address the critical vulnerability in human link verification: lack of transparency.
        </p>
      </div>

      {/* Core Philosophy & USP */}
      <div className="p-8 rounded-[14px] bg-[#151517] border border-[#29292D] space-y-4 scroll-reveal">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[10px] bg-[#1B1B1F] border border-[#29292D] flex items-center justify-center">
            <Award className="w-5 h-5 text-[#FF6B35]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#F5F5F5]">Unique Selling Proposition (USP)</h2>
            <p className="text-xs text-[#FF6B35] font-mono">SCAN → ANALYZE → EXPLAIN → EDUCATE</p>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-[#92929A] leading-relaxed">
          Traditional security scanners provide a binary <code className="text-[#FF5C5C]">"Dangerous"</code> or <code className="text-[#35C98A]">"Safe"</code> label with no underlying context. Catch the Phish unbundles every flagged threat into:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 text-xs font-mono">
          <div className="p-3 rounded-[10px] bg-[#101012] border border-[#29292D]">
            <strong className="text-[#FF6B35] block mb-1">1. What was detected</strong>
            <span className="text-[#92929A]">Observed URL structure or token anomaly</span>
          </div>
          <div className="p-3 rounded-[10px] bg-[#101012] border border-[#29292D]">
            <strong className="text-[#F2B84B] block mb-1">2. Why it matters</strong>
            <span className="text-[#92929A]">The security risk & hazard implication</span>
          </div>
          <div className="p-3 rounded-[10px] bg-[#101012] border border-[#29292D]">
            <strong className="text-[#FF5C5C] block mb-1">3. How attackers use it</strong>
            <span className="text-[#92929A]">Real-world adversary exploitation tactics</span>
          </div>
          <div className="p-3 rounded-[10px] bg-[#101012] border border-[#29292D]">
            <strong className="text-[#35C98A] block mb-1">4. What you should do</strong>
            <span className="text-[#92929A]">Actionable guidance for the end user</span>
          </div>
        </div>
      </div>

      {/* Engineering Philosophy: Andrej Karpathy Guidelines */}
      <div className="p-6 sm:p-8 rounded-[14px] bg-[#151517] border border-[#29292D] space-y-4 scroll-reveal">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[10px] bg-[#1B1B1F] border border-[#29292D] flex items-center justify-center">
            <Terminal className="w-5 h-5 text-[#FF6B35]" />
          </div>
          <div>
            <h3 className="font-semibold text-[#F5F5F5] text-base">
              Engineering Philosophy: Guided by Andrej Karpathy's Principles
            </h3>
            <p className="text-xs text-[#686870] font-mono">
              Enforcing disciplined AI engineering, minimal code surface, and verifiable execution
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
          <div className="p-4 rounded-[10px] bg-[#101012] border border-[#29292D] space-y-1.5">
            <div className="flex items-center gap-2 text-[#FF6B35] font-semibold font-mono">
              <span>01. Think Before Coding</span>
            </div>
            <p className="text-[#92929A] leading-relaxed">
              Every design decision—from the 0–100 scoring thresholds to the Levenshtein brand distance limits—was modeled explicitly. Tradeoffs between false positives and detection recall are surfaced transparently.
            </p>
          </div>
          <div className="p-4 rounded-[10px] bg-[#101012] border border-[#29292D] space-y-1.5">
            <div className="flex items-center gap-2 text-[#35C98A] font-semibold font-mono">
              <span>02. Simplicity First</span>
            </div>
            <p className="text-[#92929A] leading-relaxed">
              Rather than introducing bloated deep neural networks or opaque embeddings, Catch the Phish utilizes an interpretable 34-feature vector and Random Forest. Minimal code, zero unnecessary dependencies, and maximum explainability.
            </p>
          </div>
          <div className="p-4 rounded-[10px] bg-[#101012] border border-[#29292D] space-y-1.5">
            <div className="flex items-center gap-2 text-[#F2B84B] font-semibold font-mono">
              <span>03. Surgical Changes</span>
            </div>
            <p className="text-[#92929A] leading-relaxed">
              Clean modular separation of concerns: feature extraction, brand detection, heuristic evaluation, ML inference, and persistent audit logging operate as independent, surgical units.
            </p>
          </div>
          <div className="p-4 rounded-[10px] bg-[#101012] border border-[#29292D] space-y-1.5">
            <div className="flex items-center gap-2 text-[#F5F5F5] font-semibold font-mono">
              <span>04. Goal-Driven Execution</span>
            </div>
            <p className="text-[#92929A] leading-relaxed">
              No assumed correctness. Every model evaluation is backed by real confusion matrices, stratified test sets, empirical precision/recall metrics, and end-to-end live testing.
            </p>
          </div>
        </div>
      </div>

      {/* Machine Learning Pipeline Stats */}
      <div className="space-y-4 scroll-reveal">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-[#FF6B35]" />
          <h3 className="font-semibold text-[#F5F5F5] text-lg">
            Machine Learning Pipeline & Model Evaluation
          </h3>
        </div>

        {loading ? (
          <div className="p-8 bg-[#151517] border border-[#29292D] rounded-[14px] text-center text-xs font-mono text-[#FF6B35]">
            Loading ML training evaluation metrics...
          </div>
        ) : mlMetrics ? (
          <div className="space-y-4">
            {/* Top ML Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-[14px] bg-[#151517] border border-[#29292D] text-center">
                <div className="text-[11px] font-mono text-[#686870] uppercase">Test Accuracy</div>
                <div className="text-2xl font-bold font-mono text-[#FF6B35] mt-1">
                  {(mlMetrics.models.random_forest.accuracy * 100).toFixed(1)}%
                </div>
                <div className="text-[10px] text-[#92929A] mt-0.5">Random Forest</div>
              </div>
              <div className="p-4 rounded-[14px] bg-[#151517] border border-[#29292D] text-center">
                <div className="text-[11px] font-mono text-[#686870] uppercase">F1-Score</div>
                <div className="text-2xl font-bold font-mono text-[#35C98A] mt-1">
                  {(mlMetrics.models.random_forest.f1_score * 100).toFixed(1)}%
                </div>
                <div className="text-[10px] text-[#92929A] mt-0.5">Harmonic Mean</div>
              </div>
              <div className="p-4 rounded-[14px] bg-[#151517] border border-[#29292D] text-center">
                <div className="text-[11px] font-mono text-[#686870] uppercase">Precision</div>
                <div className="text-2xl font-bold font-mono text-[#F5F5F5] mt-1">
                  {(mlMetrics.models.random_forest.precision * 100).toFixed(1)}%
                </div>
                <div className="text-[10px] text-[#92929A] mt-0.5">Low False Positives</div>
              </div>
              <div className="p-4 rounded-[14px] bg-[#151517] border border-[#29292D] text-center">
                <div className="text-[11px] font-mono text-[#686870] uppercase">Recall</div>
                <div className="text-2xl font-bold font-mono text-[#F2B84B] mt-1">
                  {(mlMetrics.models.random_forest.recall * 100).toFixed(1)}%
                </div>
                <div className="text-[10px] text-[#92929A] mt-0.5">True Phish Identified</div>
              </div>
            </div>

            {/* Model Comparison Table */}
            <div className="p-6 rounded-[14px] bg-[#151517] border border-[#29292D] space-y-3">
              <h4 className="text-xs font-mono uppercase text-[#92929A] font-semibold tracking-wider">
                Model Comparison: Random Forest vs. Logistic Regression Baseline
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left font-mono">
                  <thead>
                    <tr className="border-b border-[#29292D] text-[#686870]">
                      <th className="py-2.5 px-3">Algorithm</th>
                      <th className="py-2.5 px-3">Accuracy</th>
                      <th className="py-2.5 px-3">Precision</th>
                      <th className="py-2.5 px-3">Recall</th>
                      <th className="py-2.5 px-3">F1-Score</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#29292D]">
                    <tr className="text-[#F5F5F5] font-medium">
                      <td className="py-3 px-3 text-[#FF6B35] flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#35C98A]" />
                        <span>Random Forest (120 Trees)</span>
                      </td>
                      <td className="py-3 px-3">{(mlMetrics.models.random_forest.accuracy * 100).toFixed(1)}%</td>
                      <td className="py-3 px-3">{(mlMetrics.models.random_forest.precision * 100).toFixed(1)}%</td>
                      <td className="py-3 px-3">{(mlMetrics.models.random_forest.recall * 100).toFixed(1)}%</td>
                      <td className="py-3 px-3">{(mlMetrics.models.random_forest.f1_score * 100).toFixed(1)}%</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-semibold bg-[#101012] text-[#35C98A] border border-[#35C98A]/30">
                          Production Model
                        </span>
                      </td>
                    </tr>
                    <tr className="text-[#92929A]">
                      <td className="py-3 px-3">Logistic Regression</td>
                      <td className="py-3 px-3">{(mlMetrics.models.logistic_regression.accuracy * 100).toFixed(1)}%</td>
                      <td className="py-3 px-3">{(mlMetrics.models.logistic_regression.precision * 100).toFixed(1)}%</td>
                      <td className="py-3 px-3">{(mlMetrics.models.logistic_regression.recall * 100).toFixed(1)}%</td>
                      <td className="py-3 px-3">{(mlMetrics.models.logistic_regression.f1_score * 100).toFixed(1)}%</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-[6px] text-[10px] bg-[#101012] text-[#686870] border border-[#29292D]">
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
