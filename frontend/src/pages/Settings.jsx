import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, Shield, Sliders, Bell, Eye, Database, 
  Trash2, Save, CheckCircle2, AlertTriangle, RefreshCw, Cpu, 
  Lock, Terminal, HelpCircle, HardDrive, Info
} from 'lucide-react';
import { api } from '../services/api';
import SoundToggle from '../components/common/SoundToggle';

export default function Settings({ theme = 'light', setTheme, toggleTheme }) {
  const [activeTab, setActiveTab] = useState('scan');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [clearStatus, setClearStatus] = useState('');

  // Settings state stored in localStorage
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('catch_the_phish_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return {
      theme: 'light',
      accentColor: 'blue',
      compactDensity: false,
      enableGridBg: false,
      heuristicSensitivity: 'strict',
      mlWeight: 45,
      heuristicWeight: 35,
      intelWeight: 20,
      levenshteinThreshold: 2,
      punycodeCheck: true,
      zeroExecutionMode: true,
      anonymizeUrls: false,
      retentionDays: 90,
      notifyHighRisk: true,
      soundAlerts: false
    };
  });

  const [dbStats, setDbStats] = useState(null);

  useEffect(() => {
    api.getDashboardStats().then(setDbStats).catch(() => null);
  }, []);

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    localStorage.setItem('catch_the_phish_settings', JSON.stringify(settings));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all configuration settings to default production parameters?')) {
      const defaults = {
        theme: 'tactical-orange',
        accentColor: 'orange',
        compactDensity: false,
        enableGridBg: true,
        heuristicSensitivity: 'strict',
        mlWeight: 45,
        heuristicWeight: 35,
        intelWeight: 20,
        levenshteinThreshold: 2,
        punycodeCheck: true,
        zeroExecutionMode: true,
        anonymizeUrls: false,
        retentionDays: 90,
        notifyHighRisk: true,
        soundAlerts: false
      };
      setSettings(defaults);
      localStorage.setItem('catch_the_phish_settings', JSON.stringify(defaults));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('WARNING: Are you sure you want to permanently erase all scanned URL history from the local database? This action cannot be reversed.')) {
      return;
    }
    try {
      setClearStatus('clearing');
      await api.clearAllHistory();
      setClearStatus('cleared');
      setTimeout(() => setClearStatus(''), 4000);
      api.getDashboardStats().then(setDbStats).catch(() => null);
    } catch (err) {
      setClearStatus('error');
      setTimeout(() => setClearStatus(''), 4000);
    }
  };

  const tabs = [
    { id: 'scan', label: 'Detection Engine', icon: Sliders },
    { id: 'security', label: 'Security & Privacy', icon: Shield },
    { id: 'notifications', label: 'Alerts & Events', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Eye },
    { id: 'about', label: 'System Diagnostics', icon: Terminal },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E2E8F0]">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#DBEAFE] text-[#2563EB] text-xs font-mono font-semibold shadow-2xs">
            <SettingsIcon className="w-3.5 h-3.5" />
            <span>OPERATIONAL CONFIGURATION CONSOLE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight">
            System Settings
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Tune heuristic engine thresholds, privacy policies, alerting behavior, and inspection rules.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleResetDefaults}
            className="px-4 py-2 rounded-xl bg-white border border-[#E2E8F0] hover:border-[#2563EB]/40 text-[#64748B] hover:text-[#111827] text-xs font-mono transition-colors cursor-pointer shadow-2xs"
          >
            Reset Defaults
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1E40AF] text-white text-xs font-semibold tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-sm hover:shadow"
          >
            {savedSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1.5 p-1.5 bg-white border border-[#E2E8F0] rounded-2xl shadow-2xs overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                isActive
                  ? 'bg-[#DBEAFE]/80 text-[#2563EB] font-bold shadow-2xs'
                  : 'text-[#64748B] hover:text-[#111827] hover:bg-[#F5F9FF]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#2563EB]' : 'text-[#64748B]'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Detection Engine */}
      {activeTab === 'scan' && (
        <div className="space-y-6">
          <div className="p-6 rounded-[14px] bg-[#151517] border border-[#29292D] space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-[#F5F5F5] uppercase tracking-wider font-mono">
                Heuristic & Scoring Pipeline
              </h3>
              <p className="text-xs text-[#92929A] mt-1">
                Configure how the multi-layered evaluation algorithm weights individual detection vectors.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Sensitivity */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-[#F5F5F5] flex items-center justify-between">
                  <span>Heuristic Strictness</span>
                  <span className="font-mono text-[#FF6B35] uppercase text-[11px]">{settings.heuristicSensitivity}</span>
                </label>
                <select
                  value={settings.heuristicSensitivity}
                  onChange={(e) => handleChange('heuristicSensitivity', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#101012] border border-[#29292D] rounded-[10px] text-xs text-[#F5F5F5] focus:outline-none focus:border-[#FF6B35]"
                >
                  <option value="moderate">Moderate (Standard enterprise false-positive mitigation)</option>
                  <option value="strict">Strict (Elevated detection of novel obfuscation)</option>
                  <option value="paranoid">Paranoid (Flag all shortened & dynamic redirect domains)</option>
                </select>
                <span className="text-[11px] text-[#686870] leading-tight block">
                  Strict mode aggressively flags lookalikes and excessive directory nesting.
                </span>
              </div>

              {/* Brand Squatting Distance */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-[#F5F5F5] flex items-center justify-between">
                  <span>Brand Similarity Distance</span>
                  <span className="font-mono text-[#FF6B35] text-[11px]">Tolerance: {settings.levenshteinThreshold} chars</span>
                </label>
                <select
                  value={settings.levenshteinThreshold}
                  onChange={(e) => handleChange('levenshteinThreshold', Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-[#101012] border border-[#29292D] rounded-[10px] text-xs text-[#F5F5F5] focus:outline-none focus:border-[#FF6B35]"
                >
                  <option value={1}>1 edit (Conservative: paypa1.com, g00gle.com)</option>
                  <option value={2}>2 edits (Standard: paypaal.com, microsoftt.com)</option>
                  <option value={3}>3 edits (Aggressive: app1e-id-verify.com)</option>
                </select>
                <span className="text-[11px] text-[#686870] leading-tight block">
                  Maximum Levenshtein edit distance used when comparing URLs to brand dictionaries.
                </span>
              </div>
            </div>

            {/* Pipeline Weighting Slider Distribution */}
            <div className="pt-4 border-t border-[#29292D] space-y-4">
              <h4 className="text-xs font-semibold text-[#F5F5F5] font-mono uppercase">
                Scoring Model Calibration (Default: 45% ML / 35% Heuristic / 20% Intel)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3.5 rounded-[10px] bg-[#101012] border border-[#29292D]">
                  <div className="flex justify-between text-xs font-mono mb-2">
                    <span className="text-[#92929A]">Random Forest ML</span>
                    <span className="text-[#FF6B35] font-bold">{settings.mlWeight}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="70"
                    value={settings.mlWeight}
                    onChange={(e) => handleChange('mlWeight', Number(e.target.value))}
                    className="w-full accent-[#FF6B35]"
                  />
                </div>
                <div className="p-3.5 rounded-[10px] bg-[#101012] border border-[#29292D]">
                  <div className="flex justify-between text-xs font-mono mb-2">
                    <span className="text-[#92929A]">Rule-Based Heuristics</span>
                    <span className="text-[#F2B84B] font-bold">{settings.heuristicWeight}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="70"
                    value={settings.heuristicWeight}
                    onChange={(e) => handleChange('heuristicWeight', Number(e.target.value))}
                    className="w-full accent-[#F2B84B]"
                  />
                </div>
                <div className="p-3.5 rounded-[10px] bg-[#101012] border border-[#29292D]">
                  <div className="flex justify-between text-xs font-mono mb-2">
                    <span className="text-[#92929A]">Threat Intelligence</span>
                    <span className="text-[#FF6B35] font-bold">{settings.intelWeight}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={settings.intelWeight}
                    onChange={(e) => handleChange('intelWeight', Number(e.target.value))}
                    className="w-full accent-[#FF6B35]"
                  />
                </div>
              </div>
            </div>

            {/* Checkboxes */}
            <div className="pt-2 space-y-3">
              <label className="flex items-center gap-3 p-3 rounded-[10px] bg-[#101012] border border-[#29292D] hover:border-[#686870] cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.punycodeCheck}
                  onChange={(e) => handleChange('punycodeCheck', e.target.checked)}
                  className="rounded w-4 h-4 accent-[#FF6B35]"
                />
                <div>
                  <span className="text-xs font-semibold text-[#F5F5F5] block">Strict Punycode & IDN Inspection</span>
                  <span className="text-[11px] text-[#686870]">Flag any non-ASCII or homoglyph characters masquerading as Latin alphabet</span>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Security & Privacy */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="p-6 rounded-[14px] bg-[#151517] border border-[#29292D] space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-[#F5F5F5] uppercase tracking-wider font-mono">
                Security & Data Safeguards
              </h3>
              <p className="text-xs text-[#92929A] mt-1">
                Zero-execution containment rules and scan privacy settings.
              </p>
            </div>

            {/* Zero-Execution Mode Display */}
            <div className="p-4 rounded-[12px] bg-[#101012] border border-[#29292D] flex items-start gap-4">
              <div className="p-2.5 rounded-[8px] bg-[#1B1B1F] text-[#FF6B35] shrink-0 border border-[#29292D]">
                <Lock className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-semibold text-[#F5F5F5] uppercase tracking-wider font-mono">
                    Zero-Execution Architecture (Enforced)
                  </h4>
                  <span className="px-2 py-0.5 rounded-[6px] bg-[#151517] text-[#35C98A] border border-[#35C98A]/30 text-[10px] font-mono">
                    Active
                  </span>
                </div>
                <p className="text-xs text-[#92929A] leading-relaxed">
                  Catch the Phish strictly treats URLs as untrusted strings. The platform never establishes HTTP connections, resolves external images, executes client scripts, or pings target hosts. This guarantees immunity to drive-by exploits.
                </p>
              </div>
            </div>

            {/* Privacy Controls */}
            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-3 p-3.5 rounded-[10px] bg-[#101012] border border-[#29292D] hover:border-[#686870] cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.anonymizeUrls}
                  onChange={(e) => handleChange('anonymizeUrls', e.target.checked)}
                  className="rounded w-4 h-4 accent-[#FF6B35]"
                />
                <div>
                  <span className="text-xs font-semibold text-[#F5F5F5] block">URL Parameter Sanitization</span>
                  <span className="text-[11px] text-[#686870]">Strip access tokens, session IDs, and query keys before saving to telemetry database</span>
                </div>
              </label>

              <div className="p-3.5 rounded-[10px] bg-[#101012] border border-[#29292D] flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold text-[#F5F5F5] block">Telemetry Retention Window</span>
                  <span className="text-[11px] text-[#686870]">Configure how long past audit logs remain in SQLite cache</span>
                </div>
                <select
                  value={settings.retentionDays}
                  onChange={(e) => handleChange('retentionDays', Number(e.target.value))}
                  className="px-3 py-1.5 bg-[#151517] border border-[#29292D] rounded-[8px] text-xs text-[#F5F5F5]"
                >
                  <option value={30}>30 Days</option>
                  <option value={90}>90 Days</option>
                  <option value={180}>180 Days</option>
                  <option value={365}>1 Year</option>
                </select>
              </div>
            </div>

            {/* Dangerous Actions: Purge Database */}
            <div className="pt-4 border-t border-[#29292D] space-y-3">
              <h4 className="text-xs font-semibold text-[#FF5C5C] font-mono uppercase flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>Destructive Operations</span>
              </h4>
              <div className="p-4 rounded-[12px] bg-[#101012] border border-[#29292D] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold text-[#F5F5F5]">Purge Local Audit Log Database</div>
                  <div className="text-[11px] text-[#686870]">
                    Permanently delete all stored scan history and classification telemetry from SQLite.
                  </div>
                </div>
                <button
                  onClick={handleClearHistory}
                  disabled={clearStatus === 'clearing'}
                  className="px-4 py-2 bg-[#151517] hover:bg-[#FF5C5C]/20 border border-[#FF5C5C]/40 text-[#FF5C5C] rounded-[10px] text-xs font-mono flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{clearStatus === 'clearing' ? 'Purging...' : clearStatus === 'cleared' ? 'Database Cleared!' : 'Erase All History'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Alerts & Events */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <div className="p-6 rounded-[14px] bg-[#151517] border border-[#29292D] space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-[#F5F5F5] uppercase tracking-wider font-mono">
                Operator Alerts & Signals
              </h3>
              <p className="text-xs text-[#92929A] mt-1">
                Customize in-app and browser notifications for critical threat scores.
              </p>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3.5 rounded-[10px] bg-[#101012] border border-[#29292D] hover:border-[#686870] cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifyHighRisk}
                  onChange={(e) => handleChange('notifyHighRisk', e.target.checked)}
                  className="rounded w-4 h-4 accent-[#FF6B35]"
                />
                <div>
                  <span className="text-xs font-semibold text-[#F5F5F5] block">Immediate Critical Threat Toast</span>
                  <span className="text-[11px] text-[#686870]">Display persistent alert pop-up when a scanned link exceeds 60/100 risk score</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3.5 rounded-[10px] bg-[#101012] border border-[#29292D] hover:border-[#686870] cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.soundAlerts}
                  onChange={(e) => handleChange('soundAlerts', e.target.checked)}
                  className="rounded w-4 h-4 accent-[#FF6B35]"
                />
                <div>
                  <span className="text-xs font-semibold text-[#F5F5F5] block">Acoustic Warning Signal</span>
                  <span className="text-[11px] text-[#686870]">Play subtle acoustic feedback when confirmed phishing signatures are encountered</span>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Appearance */}
      {activeTab === 'appearance' && (
        <div className="space-y-6">
          <div className="p-6 rounded-[14px] bg-[#151517] border border-[#29292D] space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-[#F5F5F5] uppercase tracking-wider font-mono">
                Interface Customization
              </h3>
              <p className="text-xs text-[#92929A] mt-1">
                Configure color themes and visual density according to your workstation preferences.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option 1: Light Mode - Premium White & Blue (Primary) */}
              <div 
                onClick={(e) => {
                  handleChange('theme', 'light');
                  if (toggleTheme) toggleTheme(e, 'light');
                  else if (setTheme) setTheme('light');
                }}
                className={`p-5 rounded-2xl border cursor-pointer transition-all duration-200 shadow-2xs ${
                  theme === 'light'
                    ? 'bg-[#F5F9FF] border-[#2563EB] shadow-xs' 
                    : 'bg-white border-[#E2E8F0] hover:border-[#2563EB]/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-[#111827]">Light Theme</span>
                  <span className="w-4 h-4 rounded-full bg-[#A855F7] shadow-xs" />
                </div>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Clean white canvas with neutral greys, deep purple accents and crisp borders.
                </p>
                <div className="mt-3 flex items-center gap-1.5 text-xs font-mono text-[#2563EB] font-bold">
                  <span>{theme === 'light' ? '● Currently Active' : 'Select Light Theme'}</span>
                </div>
              </div>

              {/* Option 2: Dark Mode */}
              <div 
                onClick={(e) => {
                  handleChange('theme', 'dark');
                  if (toggleTheme) toggleTheme(e, 'dark');
                  else if (setTheme) setTheme('dark');
                }}
                className={`p-5 rounded-2xl border cursor-pointer transition-all duration-200 shadow-2xs ${
                  theme === 'dark'
                    ? 'bg-[#F5F9FF] border-[#2563EB] shadow-xs' 
                    : 'bg-white border-[#E2E8F0] hover:border-[#2563EB]/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-[#111827]">Dark Mode</span>
                  <span className="w-4 h-4 rounded-full bg-[#111827]" />
                </div>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Pure black canvas with charcoal surfaces, purple accents and high-contrast status colours. Follows your system setting until you choose.
                </p>
                <div className="mt-3 flex items-center gap-1.5 text-xs font-mono text-[#64748B]">
                  <span>{theme === 'dark' ? '● Currently Active' : 'Select Dark Theme'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-[14px] bg-[#151517] border border-[#29292D]">
            <div className="flex items-start justify-between gap-6">
              <div>
                <h3 className="text-sm font-semibold text-[#F5F5F5] uppercase tracking-wider font-mono">
                  Sound Effects
                </h3>
                <p className="text-xs text-[#92929A] mt-1 max-w-xl">
                  Play a short sound when a scan finishes: a soft chime for safe, a gentle tone for suspicious and a low double pulse for dangerous.
                  Off by default; sounds only play after a real scan result and never replace the visual warning.
                </p>
              </div>
              <SoundToggle variant="switch" />
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: System Diagnostics */}
      {activeTab === 'about' && (
        <div className="space-y-6">
          <div className="p-6 rounded-[14px] bg-[#151517] border border-[#29292D] space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-[#F5F5F5] uppercase tracking-wider font-mono">
                System Diagnostics & Technical Specifications
              </h3>
              <p className="text-xs text-[#92929A] mt-1">
                Telemetry statistics and active model parameters for academic/SOC presentations.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-mono">
              <div className="p-4 rounded-[10px] bg-[#101012] border border-[#29292D]">
                <span className="text-[#686870] text-[10px] block mb-1">MACHINE LEARNING CORE</span>
                <span className="font-semibold text-[#F5F5F5] text-sm">Random Forest Classifier</span>
                <div className="mt-2 text-[#FF6B35] text-[11px]">34 Lexical & Structural Features</div>
              </div>

              <div className="p-4 rounded-[10px] bg-[#101012] border border-[#29292D]">
                <span className="text-[#686870] text-[10px] block mb-1">LOCAL TELEMETRY STORE</span>
                <span className="font-semibold text-[#F5F5F5] text-sm">SQLite Engine</span>
                <div className="mt-2 text-[#35C98A] text-[11px]">
                  {dbStats ? `${dbStats.total_scans || 0} Records Stored` : 'Active'}
                </div>
              </div>

              <div className="p-4 rounded-[10px] bg-[#101012] border border-[#29292D]">
                <span className="text-[#686870] text-[10px] block mb-1">API SERVICE SPECIFICATION</span>
                <span className="font-semibold text-[#F5F5F5] text-sm">FastAPI v0.110+</span>
                <div className="mt-2 text-[#92929A] text-[11px]">Port 8000 / Sub-10ms Latency</div>
              </div>
            </div>

            {/* Engineering Standards */}
            <div className="p-4 rounded-[10px] bg-[#101012] border border-[#29292D] space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono text-[#FF6B35]">
                <Terminal className="w-4 h-4" />
                <span>Architecture Principles: Andrej Karpathy Framework</span>
              </div>
              <p className="text-xs text-[#92929A] leading-relaxed">
                Adheres strictly to first-principles thinking: <strong>Think Before Coding</strong> (state assumptions explicitly), <strong>Simplicity First</strong> (no speculative bloat), <strong>Surgical Changes</strong> (zero unintended side effects), and <strong>Goal-Driven Execution</strong> (measurable verification).
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
