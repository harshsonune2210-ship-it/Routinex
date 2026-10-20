import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Volume2, 
  Moon, 
  Clock, 
  Target, 
  Globe, 
  ShieldCheck, 
  Database, 
  Copy, 
  Check, 
  RotateCcw, 
  Trash2, 
  Save, 
  Play, 
  Send,
  Sparkles,
  ExternalLink,
  HelpCircle
} from 'lucide-react';
import { UserSettings, UserProfile } from '../types';
import { api } from '../services/api';
import { soundEngine } from '../utils/audio';
import { registerWebPushSubscription, requestNotificationPermission } from '../utils/push';

interface SettingsPageProps {
  settings: UserSettings;
  onUpdateSettings: (partial: Partial<UserSettings>) => Promise<void>;
  user: UserProfile;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onResetPresets: () => Promise<void>;
  onClearData: () => Promise<void>;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  onUpdateSettings,
  user,
  soundEnabled,
  onToggleSound,
  onResetPresets,
  onClearData,
}) => {
  const [formData, setFormData] = useState<UserSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [pushStatus, setPushStatus] = useState<NotificationPermission>('default');
  const [isRegisteringPush, setIsRegisteringPush] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [supabaseUrl, setSupabaseUrl] = useState(localStorage.getItem('supabase_url') || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(localStorage.getItem('supabase_anon_key') || '');
  const [isTestingPush, setIsTestingPush] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    setFormData(settings);
    if ('Notification' in window) {
      setPushStatus(Notification.permission);
    }
  }, [settings]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      await onUpdateSettings(formData);
      setSaveSuccess(true);
      if (soundEnabled) soundEngine.playTacticalChime();
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to update settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEnablePush = async () => {
    setIsRegisteringPush(true);
    try {
      const perm = await requestNotificationPermission();
      setPushStatus(perm);
      if (perm === 'granted') {
        const success = await registerWebPushSubscription(user.id);
        if (success) {
          await onUpdateSettings({ push_enabled: true });
          setFormData(prev => ({ ...prev, push_enabled: true }));
          if (soundEnabled) soundEngine.playTacticalChime();
        }
      }
    } finally {
      setIsRegisteringPush(false);
    }
  };

  const handleSendTestPush = async () => {
    setIsTestingPush(true);
    setTestResult(null);
    try {
      const res = await api.testPush();
      if (res.success) {
        if (soundEnabled) soundEngine.playTacticalChime();
        setTestResult('Ping dispatched! Notification and Web Audio alert delivered.');
      }
    } catch (err: any) {
      setTestResult(`Ping error: ${err.message || 'Failed to dispatch'}`);
    } finally {
      setIsTestingPush(false);
      setTimeout(() => setTestResult(null), 4000);
    }
  };

  const handleTestSound = (soundChoice: string) => {
    soundEngine.playSound(soundChoice);
  };

  const handleCopySql = () => {
    const sqlSchema = `-- DISCIPLINE OS SCHEMA
-- Run in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT DEFAULT 'Commander',
  timezone TEXT DEFAULT 'America/Los_Angeles'
);
CREATE TABLE IF NOT EXISTS routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  scheduled_time TEXT NOT NULL,
  category TEXT NOT NULL,
  repeat_type TEXT NOT NULL DEFAULT 'daily',
  current_streak INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS routine_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  routine_id UUID NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  status TEXT NOT NULL,
  on_time BOOLEAN DEFAULT true,
  UNIQUE(user_id, routine_id, date)
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_completions ENABLE ROW LEVEL SECURITY;`;

    navigator.clipboard.writeText(sqlSchema);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleSaveSupabaseConfig = () => {
    localStorage.setItem('supabase_url', supabaseUrl.trim());
    localStorage.setItem('supabase_anon_key', supabaseAnonKey.trim());
    alert('Supabase connection parameters saved locally!');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-neutral-800">
        <div>
          <span className="text-xs font-mono tracking-widest text-emerald-400 uppercase">
            SYSTEM CALIBRATION
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-0.5">
            Settings & Notification Hub
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
            Fine-tune reminder precision, audio signals, and backend persistence
          </p>
        </div>

        <button
          onClick={() => handleSave()}
          disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition shadow-[0_0_15px_rgba(16,185,129,0.25)] active:scale-95 disabled:opacity-50"
        >
          {saveSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          <span>{isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Changes'}</span>
        </button>
      </div>

      <div className="space-y-6">
        
        {/* Section 1: Smart Notifications & Web Push */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#0e1017] border border-neutral-800/90 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-wide">
                  Smart Reminder Engine & Web Push
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Reliable backend scheduler triggers notifications at exact scheduled times
                </p>
              </div>
            </div>

            {/* Test Ping Button */}
            <button
              onClick={handleSendTestPush}
              disabled={isTestingPush}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-700/80 text-xs font-semibold text-emerald-400 hover:bg-neutral-800 transition disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isTestingPush ? 'Sending...' : 'Test Ping'}</span>
            </button>
          </div>

          {testResult && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
              {testResult}
            </div>
          )}

          {/* Web Push Permission Banner */}
          <div className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">Browser Push Notifications:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                  pushStatus === 'granted'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {pushStatus}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                {pushStatus === 'granted'
                  ? 'Active: Background service worker receives alerts even if browser tab is closed.'
                  : 'Grant permission to enable system notifications for scheduled routines and grace alerts.'}
              </p>
            </div>

            {pushStatus !== 'granted' && (
              <button
                onClick={handleEnablePush}
                disabled={isRegisteringPush}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition flex-shrink-0"
              >
                {isRegisteringPush ? 'Requesting...' : 'Grant Permission'}
              </button>
            )}
          </div>

          {/* Grace Period & Repeat Intervals Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                Grace Period Duration
              </label>
              <select
                value={formData.grace_period_mins}
                onChange={e => setFormData({ ...formData, grace_period_mins: parseInt(e.target.value, 10) })}
                className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value={5}>5 minutes grace period</option>
                <option value={10}>10 minutes grace period (Recommended)</option>
                <option value={15}>15 minutes grace period</option>
                <option value={20}>20 minutes grace period</option>
                <option value={30}>30 minutes grace period</option>
              </select>
              <span className="text-[10px] text-neutral-400 mt-1 block">
                Time elapsed after scheduled time before "Overdue Warning" triggers.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                Repeat Reminder Interval
              </label>
              <select
                value={formData.repeat_reminder_mins}
                onChange={e => setFormData({ ...formData, repeat_reminder_mins: parseInt(e.target.value, 10) })}
                className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value={10}>Repeat every 10 minutes</option>
                <option value={15}>Repeat every 15 minutes</option>
                <option value={20}>Repeat every 20 minutes</option>
                <option value={30}>Repeat every 30 minutes</option>
              </select>
              <span className="text-[10px] text-neutral-400 mt-1 block">
                Repeats if routine remains incomplete (stops immediately once marked done).
              </span>
            </div>

          </div>

          {/* Morning Brief & Evening Summary Times */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Morning Operational Briefing
              </label>
              <input
                type="time"
                value={formData.morning_brief_time}
                onChange={e => setFormData({ ...formData, morning_brief_time: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-neutral-400 mt-1 block">
                Sends planned agenda overview to prime your morning mindset.
              </span>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                Evening Debrief Summary
              </label>
              <input
                type="time"
                value={formData.evening_summary_time}
                onChange={e => setFormData({ ...formData, evening_summary_time: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-neutral-400 mt-1 block">
                Calculates daily score, completion rate, and streak status.
              </span>
            </div>
          </div>

          {/* Quiet Hours */}
          <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-neutral-400" />
                <span className="text-xs font-bold text-white">Quiet Hours Mode</span>
              </div>
              <input
                type="checkbox"
                checked={formData.quiet_hours_enabled}
                onChange={e => setFormData({ ...formData, quiet_hours_enabled: e.target.checked })}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </div>
            {formData.quiet_hours_enabled && (
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-800/60">
                <div>
                  <label className="text-[10px] font-mono text-neutral-400 uppercase block mb-1">Silence Start</label>
                  <input
                    type="time"
                    value={formData.quiet_hours_start}
                    onChange={e => setFormData({ ...formData, quiet_hours_start: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-neutral-400 uppercase block mb-1">Silence End</label>
                  <input
                    type="time"
                    value={formData.quiet_hours_end}
                    onChange={e => setFormData({ ...formData, quiet_hours_end: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white"
                  />
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Section 2: Audio Signals & Haptics */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#0e1017] border border-neutral-800/90 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <Volume2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-wide">
                  Tactical Audio Synthesizer
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Web Audio signals calibrated for military precision and dopamine feedback
                </p>
              </div>
            </div>

            <button
              onClick={onToggleSound}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition ${
                soundEnabled
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-500'
              }`}
            >
              {soundEnabled ? 'AUDIO ENABLED' : 'AUDIO MUTED'}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { id: 'tactical_chime', label: 'Tactical Chime' },
              { id: 'radar', label: 'Sonar Radar' },
              { id: 'bell', label: 'Zen Bell 528Hz' },
              { id: 'electronic', label: 'Electronic Pulse' },
            ].map(snd => (
              <div
                key={snd.id}
                onClick={() => setFormData({ ...formData, sound_choice: snd.id as any })}
                className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                  formData.sound_choice === snd.id
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-white'
                    : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">{snd.label}</span>
                  {formData.sound_choice === snd.id && (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTestSound(snd.id);
                  }}
                  className="mt-3 py-1 px-2 rounded bg-neutral-900 border border-neutral-700 text-[10px] font-mono font-bold text-emerald-400 hover:bg-neutral-800 flex items-center justify-center gap-1"
                >
                  <Play className="w-2.5 h-2.5 fill-emerald-400" />
                  <span>Preview</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Daily Target Standards */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#0e1017] border border-neutral-800/90 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-wide">
                  Daily Completion Target
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Threshold required to keep your overall daily streak unbroken
                </p>
              </div>
            </div>
            <span className="text-lg font-mono font-black text-emerald-400">
              {formData.daily_target_pct}%
            </span>
          </div>

          <div>
            <input
              type="range"
              min={50}
              max={100}
              step={5}
              value={formData.daily_target_pct}
              onChange={e => setFormData({ ...formData, daily_target_pct: parseInt(e.target.value, 10) })}
              className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] font-mono text-neutral-500 mt-2">
              <span>50% (Lenient)</span>
              <span>80% (Recommended Standard)</span>
              <span>100% (Zero Tolerance)</span>
            </div>
          </div>
        </div>

        {/* Section 4: Supabase Architecture & SQL Setup */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#0e1017] border border-neutral-800/90 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-wide">
                  Supabase Integration & Architecture
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  PostgreSQL schema, RLS policies, and cloud persistence connector
                </p>
              </div>
            </div>

            <button
              onClick={handleCopySql}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-700/80 text-xs font-semibold text-emerald-400 hover:bg-neutral-800 transition"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSql ? 'Copied SQL!' : 'Copy SQL Schema'}</span>
            </button>
          </div>

          <div className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-800/80 text-xs text-neutral-300 space-y-2 leading-relaxed">
            <p>
              <strong>Zero Configuration Mode:</strong> DISCIPLINE OS currently runs with an embedded persistent database with atomic transactions in Express, ready out-of-the-box with zero setup required.
            </p>
            <p>
              <strong>Supabase Cloud Connection:</strong> To sync with your own Supabase project, execute the generated schema in your <strong>Supabase SQL Editor</strong> and paste your Project URL and Anon Key below:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block mb-1">
                Supabase URL
              </label>
              <input
                type="text"
                value={supabaseUrl}
                onChange={e => setSupabaseUrl(e.target.value)}
                placeholder="https://xyzproject.supabase.co"
                className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block mb-1">
                Supabase Anon Key
              </label>
              <input
                type="password"
                value={supabaseAnonKey}
                onChange={e => setSupabaseAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSaveSupabaseConfig}
              className="px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-700 hover:border-emerald-500 text-xs font-bold text-white transition"
            >
              Save Supabase Credentials
            </button>
          </div>
        </div>

        {/* Section 5: Data Management & Presets */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#0e1017] border border-neutral-800/90 shadow-xl space-y-4">
          <div className="pb-3 border-b border-neutral-800">
            <h3 className="text-base font-bold text-white tracking-wide">
              Data Management & Backup
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Reset default preset protocols or export lifetime discipline logs
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onResetPresets}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-neutral-800 transition"
            >
              <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
              <span>Restore Sample Presets</span>
            </button>

            <button
              onClick={onClearData}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-950 border border-rose-500/30 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Clear My Data</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
