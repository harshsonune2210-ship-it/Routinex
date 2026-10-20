import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  Trophy, 
  CheckCircle2, 
  Sparkles, 
  Lock, 
  Unlock, 
  ShieldCheck, 
  Award,
  Zap,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { Milestone } from '../types';
import { soundEngine } from '../utils/audio';
import { fireMilestoneBurst } from '../utils/confetti';

interface StreaksPageProps {
  soundEnabled: boolean;
}

export const StreaksPage: React.FC<StreaksPageProps> = ({ soundEnabled }) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [celebratingMilestone, setCelebratingMilestone] = useState<Milestone | null>(null);

  useEffect(() => {
    async function fetchStreaks() {
      try {
        setIsLoading(true);
        const res = await api.getStreaks();
        setData(res);
      } catch (err) {
        console.error('Failed to load streaks data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStreaks();
  }, []);

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center py-24 text-neutral-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono">CALCULATING STREAKS & MILESTONES...</span>
        </div>
      </div>
    );
  }

  const { overall_current_streak, overall_longest_streak, milestones, heatmap_90_days, routine_streaks } = data;

  const triggerCelebration = (m: Milestone) => {
    setCelebratingMilestone(m);
    if (soundEnabled) soundEngine.playCelebrationFanfare();
    fireMilestoneBurst();
  };

  // Group heatmap into columns of 7 for 90-day GitHub style grid
  const weeks: Array<Array<{ date: string; count: number; met_target: boolean; score: number }>> = [];
  let currentWeek: Array<{ date: string; count: number; met_target: boolean; score: number }> = [];

  heatmap_90_days.forEach((day: any) => {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });
  if (currentWeek.length > 0) weeks.push(currentWeek);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Header */}
      <div className="pb-3 border-b border-neutral-800">
        <span className="text-xs font-mono tracking-widest text-orange-400 uppercase">
          CONSISTENCY COMPOUNDING ENGINE
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-0.5">
          Streak History & Milestones
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
          Honor unbroken commitment and conquer legendary discipline milestones
        </p>
      </div>

      {/* Hero Streak Showcase */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#12141c] to-[#0a0c10] border border-orange-500/30 shadow-[0_0_30px_rgba(249,115,22,0.12)]">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-bold font-mono">
              <Flame className="w-4 h-4 fill-orange-400 animate-bounce" />
              <span>OVERALL SYSTEM STREAK</span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-5xl sm:text-6xl font-black text-white font-mono tracking-tight">
                {overall_current_streak}
              </span>
              <span className="text-xl sm:text-2xl font-bold text-orange-400 font-mono">CONSECUTIVE DAYS</span>
            </div>
            <p className="text-xs sm:text-sm text-neutral-300 max-w-xl leading-relaxed">
              Maintained by consistently surpassing your daily 80% completion standard. Rest and non-scheduled days are safeguarded!
            </p>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 pt-4 sm:pt-0 border-t sm:border-t-0 border-neutral-800">
            <div className="p-3 rounded-2xl bg-neutral-950/80 border border-neutral-800 text-right">
              <span className="text-[10px] font-mono text-neutral-400 block uppercase">All-Time Record</span>
              <span className="text-xl font-black text-white font-mono">{overall_longest_streak} Days</span>
            </div>
            <button
              onClick={() => {
                if (soundEnabled) soundEngine.playCelebrationFanfare();
                fireMilestoneBurst();
              }}
              className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-black text-xs font-black transition shadow-[0_0_15px_rgba(249,115,22,0.3)] active:scale-95 flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>Ignite Fanfare</span>
            </button>
          </div>
        </div>
      </div>

      {/* 90-Day Tactical Heatmap Grid */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#0e1017] border border-neutral-800/90 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-neutral-800 mb-5">
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">
              90-Day Discipline Consistency Matrix
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Daily adherence record across the last 3 months
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono text-neutral-400">
            <span>Less</span>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-neutral-900 border border-neutral-800" />
              <span className="w-3 h-3 rounded bg-emerald-950 border border-emerald-900" />
              <span className="w-3 h-3 rounded bg-emerald-800" />
              <span className="w-3 h-3 rounded bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            </div>
            <span>Target Hit</span>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-1.5 min-w-[680px]">
            {weeks.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col gap-1.5">
                {week.map((cell) => {
                  let bg = 'bg-neutral-900/60 border-neutral-800/60';
                  if (cell.count > 0) {
                    if (cell.met_target) {
                      bg = 'bg-emerald-500 border-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.3)]';
                    } else if (cell.score >= 50) {
                      bg = 'bg-emerald-700/80 border-emerald-600/80';
                    } else {
                      bg = 'bg-amber-600/50 border-amber-500/50';
                    }
                  }

                  return (
                    <div
                      key={cell.date}
                      className={`w-3.5 h-3.5 rounded-sm border transition-all cursor-pointer hover:scale-125 ${bg}`}
                      title={`${cell.date}: ${cell.count} tasks done (${cell.score}%). ${cell.met_target ? 'Target Met!' : 'Pending/Partial'}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Milestone Celebrations Showcase */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#0e1017] border border-neutral-800/90 shadow-xl">
        <div className="pb-4 border-b border-neutral-800 mb-6">
          <h3 className="text-base font-bold text-white tracking-wide">
            Hall of Milestones
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Key psychological threshold markers on the path to unbreakable discipline
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {milestones.map((m: Milestone) => (
            <div
              key={m.days}
              className={`p-5 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                m.achieved
                  ? 'bg-neutral-900/90 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.08)]'
                  : 'bg-neutral-950/60 border-neutral-800/80 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-neutral-800/80 mb-3">
                  <span className="text-2xl">{m.icon}</span>
                  {m.achieved ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      <Unlock className="w-3 h-3" />
                      <span>UNLOCKED</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono text-neutral-500">
                      <Lock className="w-3 h-3" />
                      <span>LOCKED</span>
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-2">
                  <h4 className="text-base font-black text-white">{m.title}</h4>
                  <span className="text-xs font-mono font-bold text-emerald-400">{m.days} DAYS</span>
                </div>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                  {m.desc}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-neutral-800/80">
                <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
                  <span className="text-neutral-400">Progress:</span>
                  <span className={m.achieved ? 'text-emerald-400 font-bold' : 'text-neutral-400'}>
                    {m.current_progress}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-neutral-900 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-700 ${
                      m.achieved ? 'bg-emerald-400' : 'bg-neutral-600'
                    }`}
                    style={{ width: `${m.current_progress}%` }}
                  />
                </div>

                {m.achieved && (
                  <button
                    onClick={() => triggerCelebration(m)}
                    className="mt-3 w-full py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold hover:bg-emerald-500/20 transition flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Celebrate Milestone</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Routine Specific Streaks Board */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#0e1017] border border-neutral-800/90 shadow-xl">
        <div className="pb-4 border-b border-neutral-800 mb-5">
          <h3 className="text-base font-bold text-white tracking-wide">
            Individual Routine Streaks
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Routine-by-routine consistency without double-counting
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {routine_streaks.map((r: any) => (
            <div
              key={r.id}
              className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800/80 flex items-center justify-between"
            >
              <div className="min-w-0 pr-3">
                <h4 className="text-xs font-bold text-white truncate">{r.name}</h4>
                <span className="text-[10px] text-neutral-500 font-mono">{r.category}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400 font-mono font-bold text-xs flex-shrink-0">
                <Flame className="w-3.5 h-3.5 fill-orange-400" />
                <span>{r.current_streak}d</span>
                <span className="text-[10px] text-neutral-500 ml-1">
                  (best {r.longest_streak}d)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
