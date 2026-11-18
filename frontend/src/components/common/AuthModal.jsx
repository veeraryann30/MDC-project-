import React, { useState } from 'react';
import { X, Lock, Mail, User, Shield, AlertCircle, RefreshCw, Check } from 'lucide-react';
import { api } from '../../services/api';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isLogin) {
        const data = await api.loginUser(email.trim(), password);
        setSuccess('Authentication successful!');
        setTimeout(() => {
          if (onAuthSuccess) onAuthSuccess(data.user);
          onClose();
        }, 600);
      } else {
        const data = await api.registerUser(email.trim(), password, fullName.trim());
        setSuccess('Account created and authenticated!');
        setTimeout(() => {
          if (onAuthSuccess) onAuthSuccess(data.user);
          onClose();
        }, 600);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-md p-6 sm:p-8 rounded-2xl bg-white border border-[#E2E8F0] shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[#64748B] hover:text-[#111827] hover:bg-[#F5F9FF] transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex p-2.5 rounded-xl bg-[#DBEAFE] border border-[#BFDBFE] text-[#2563EB] mb-2">
            <Shield className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-[#111827]">
            {isLogin ? 'Security Analyst Login' : 'Create Analyst Account'}
          </h2>
          <p className="text-xs text-[#64748B] font-mono">
            {isLogin
              ? 'Access private audit logs, threat history, and SOC settings.'
              : 'Register your secure credentials with PBKDF2 hashing.'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-[#64748B] uppercase font-semibold">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Veer Aryan"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#F5F9FF] border border-[#E2E8F0] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 text-[#111827] placeholder:text-[#94A3B8] outline-none transition-all"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[#64748B] uppercase font-semibold">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="analyst@catchthephish.io"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#F5F9FF] border border-[#E2E8F0] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 text-[#111827] placeholder:text-[#94A3B8] outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[#64748B] uppercase font-semibold">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#F5F9FF] border border-[#E2E8F0] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 text-[#111827] placeholder:text-[#94A3B8] outline-none transition-all"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-[#DC2626] text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[#16A34A] text-xs font-medium">
              <Check className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#1E40AF] hover:from-[#1E40AF] hover:to-[#1D4ED8] text-white font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
            ) : (
              <span>{isLogin ? 'Sign In to Console' : 'Register Account'}</span>
            )}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="text-center pt-2 border-t border-[#E2E8F0]">
          <button
            onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); }}
            className="text-xs text-[#64748B] hover:text-[#2563EB] font-mono transition cursor-pointer"
          >
            {isLogin
              ? "Don't have an analyst account? Create one →"
              : "Already registered? Sign in →"}
          </button>
        </div>
      </div>
    </div>
  );
  );
}
