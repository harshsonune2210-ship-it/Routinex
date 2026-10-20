import React, { useState } from 'react';
import { X, User, Lock, Mail, Globe, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { UserProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onUserChanged: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChanged,
}) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [timezone, setTimezone] = useState(
    typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'America/Los_Angeles'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      if (isRegister) {
        const res = await api.register(email, password, name || 'Commander', timezone);
        onUserChanged(res.user);
      } else {
        const res = await api.login(email, password);
        onUserChanged(res.user);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSonu = async () => {
    setIsLoading(true);
    try {
      const res = await api.login('sonunevaishali14@gmail.com', 'discipline123');
      onUserChanged(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to switch');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-[#0e1017] border border-neutral-800 p-6 shadow-2xl text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isRegister ? 'Create Discipline Account' : 'Commander Sign In'}
              </h3>
              <p className="text-xs text-neutral-400">Secure user-isolated database records</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current User Pill */}
        <div className="mt-4 p-3 rounded-xl bg-neutral-950/80 border border-neutral-800/80 flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] font-mono text-neutral-400 block uppercase">Current Active Account:</span>
            <span className="font-bold text-emerald-400">{currentUser.name}</span>
            <span className="text-neutral-400 font-mono text-[11px] block">{currentUser.email}</span>
          </div>
          <button
            onClick={handleQuickSonu}
            className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-700 text-[11px] text-neutral-300 hover:text-white"
          >
            Switch to Sonu
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {isRegister && (
            <div>
              <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block mb-1">
                Commander Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Alex"
                  className="w-full pl-9 pr-3 py-2 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block mb-1">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="commander@discipline.os"
                className="w-full pl-9 pr-3 py-2 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block mb-1">
              Password *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block mb-1">
                Timezone
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type="text"
                  value={timezone}
                  onChange={e => setTimezone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-4 w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.25)] disabled:opacity-50"
          >
            <span>{isLoading ? 'Processing...' : isRegister ? 'Create Account' : 'Authenticate & Enter'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-4 pt-3 border-t border-neutral-800 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
            className="text-xs text-neutral-400 hover:text-emerald-400 transition"
          >
            {isRegister
              ? 'Already have an account? Sign in here'
              : "Don't have an account? Create one now"}
          </button>
        </div>

      </div>
    </div>
  );
};
