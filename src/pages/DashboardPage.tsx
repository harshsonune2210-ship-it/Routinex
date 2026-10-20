import React, { useState } from 'react';
import { 
  Flame, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Plus, 
  RotateCcw, 
  ArrowUpRight, 
  ChevronRight,
  Sparkles,
  Zap,
  Target,
  Award,
  Calendar as CalendarIcon,
  Check
} from 'lucide-react';
import { CircularProgress } from '../components/CircularProgress';
import { TimelineItem, DashboardStats, RoutineCategory } from '../types';
import { soundEngine } from '../utils/audio';
import { fireTacticalConfetti } from '../utils/confetti';

interface DashboardPageProps {
  stats: DashboardStats;
  timeline: TimelineItem[];
  userName: string;
  onSetStatus: (routineId: string, status: 'completed' | 'missed' | 'pending', actualTime?: string | null, notes?: string) => Promise<void>;
  onOpenAddModal: () => void;
  onNavigateTab: (tab: string) => void;
  soundEnabled: boolean;
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  stats,
  timeline,
  userName,
  onSetStatus,
  onOpenAddModal,
  onNavigateTab,
  soundEnabled,
  selectedDate,
  onSelectDate,
}) => {
  const [actingRoutineId, setActingRoutineId] = useState<string | null>(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState<TimelineItem | null>(null);

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  // Category styles
  const categoryThemes: Record<RoutineCategory, { border: string; bg: string; text: string; dot: string }> = {
    Exercise: { border: 'border-emerald-500/40', bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
    Study: { border: 'border-purple-500/40', bg: 'bg-purple-500/10', text: 'text-purple-400', dot: 'bg-purple-400' },
    Work: { border: 'border-blue-500/40', bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-400' },
    Health: { border: 'border-cyan-500/40', bg: 'bg-cyan-500/10', text: 'text-cyan-400', dot: 'bg-cyan-400' },
    'Personal Growth': { border: 'border-amber-500/40', bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-400' },
    Other: { border: 'border-neutral-500/40', bg: 'bg-neutral-500/10', text: 'text-neutral-400', dot: 'bg-neutral-400' },
  };

  // Motivational quote determination
  const getMotivationalBanner = () => {
    if (timeline.length === 0) {
      return {
        title: 'Calibrate Your Day',
        desc: 'No routines scheduled for this date. Add your daily anchors to initiate discipline tracking.',
        color: 'border-neutral-700 bg-neutral-900/60',
      };
    }
    if (stats.completed === stats.total_planned && stats.total_planned > 0) {
      return {
        title: '🎯 Mission Accomplished: Flawless Execution',
        desc: `Every routine crushed today. Your discipline score is ${stats.discipline_score}%. Rest well, commander.`,
        color: 'border-emerald-500/50 bg-emerald-950/20 shadow-[0_0_20px_rgba(16,185,129,0.15)]',
      };
    }
    if (stats.missed > 0) {
      return {
        title: 'Adapt & Recover Momentum',
        desc: `${stats.missed} routine marked missed. Setbacks are data points, not destiny. Reclaim the standard on the next task.`,
        color: 'border-amber-500/40 bg-amber-950/20',
      };
    }
    if (stats.progress_pct >= 60) {
      return {
        title: 'Momentum Unlocked: Finishing Strong',
        desc: `You have cleared ${stats.completed} routines. Keep laser focus for the final stretch.`,
        color: 'border-emerald-500/30 bg-emerald-950/15',
      };
    }
    return {
      title: 'Action Precedes Motivation',
      desc: 'Small disciplined repetitions compound into unbreakable character. Execute routine #1.',
      color: 'border-neutral-800 bg-neutral-900/50',
    };
  };

  const banner = getMotivationalBanner();

  const handleMarkDone = async (item: TimelineItem) => {
    try {
      setActingRoutineId(item.routine.id);
      const now = new Date().toISOString();
      await onSetStatus(item.routine.id, 'completed', now);

      if (soundEnabled) {
        if (stats.completed + 1 >= stats.total_planned) {
          soundEngine.playCelebrationFanfare();
          fireTacticalConfetti();
        } else {
          soundEngine.playTacticalChime();
        }
      }
    } finally {
      setActingRoutineId(null);
    }
  };

  const handleMarkMissed = async (routineId: string) => {
    try {
      setActingRoutineId(routineId);
      await onSetStatus(routineId, 'missed');
      if (soundEnabled) soundEngine.playRadarPing();
    } finally {
      setActingRoutineId(null);
    }
  };

  const handleResetPending = async (routineId: string) => {
    try {
      setActingRoutineId(routineId);
      await onSetStatus(routineId, 'pending', null);
    } finally {
      setActingRoutineId(null);
    }
  };

  // Formatted display date
  const dateObj = new Date(selectedDate + 'T12:00:00');
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Top Header & Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-neutral-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono tracking-widest text-emerald-400 uppercase">
              {isToday ? 'DAILY OPERATIONAL STATUS' : 'HISTORICAL LOG REVIEW'}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-0.5">
            Good day, <span className="text-emerald-400">{userName}</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-0.5 flex items-center gap-2">
            <CalendarIcon className="w-3.5 h-3.5 text-neutral-500" />
            <span>{formattedDate}</span>
            {!isToday && (
              <button
                onClick={() => onSelectDate(new Date().toISOString().split('T')[0])}
                className="text-xs text-emerald-400 underline hover:text-emerald-300 ml-2"
              >
                Return to Today
              </button>
            )}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition shadow-[0_0_15px_rgba(16,185,129,0.25)] active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Routine</span>
          </button>
        </div>
      </div>

      {/* Motivational Progress Banner */}
      <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${banner.color}`}>
        <div className="flex items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 p-2 rounded-xl bg-neutral-950/80 border border-white/10 text-emerald-400">
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
                {banner.title}
              </h3>
              <p className="text-xs sm:text-sm text-neutral-300 mt-0.5 max-w-2xl">
                {banner.desc}
              </p>
            </div>
          </div>
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[10px] font-mono text-neutral-400">DISCIPLINE TARGET</span>
            <span className="text-sm font-mono font-black text-emerald-400">{stats.daily_target_pct}% MIN</span>
          </div>
        </div>
      </div>

      {/* Key Metric Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Metric 1: Current Streak */}
        <div 
          onClick={() => onNavigateTab('streaks')}
          className="p-4 rounded-2xl bg-[#0e1017] border border-neutral-800/80 hover:border-orange-500/40 transition cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider font-mono">Current Streak</span>
            <Flame className="w-4 h-4 text-orange-400 fill-orange-400 group-hover:scale-110 transition" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono">{stats.current_streak}</span>
            <span className="text-xs text-orange-400 font-bold">DAYS</span>
          </div>
          <p className="text-[11px] text-neutral-400 mt-1 flex items-center justify-between">
            <span>Longest: {stats.longest_streak}d</span>
            <ArrowUpRight className="w-3 h-3 text-neutral-400 group-hover:text-orange-400 transition" />
          </p>
        </div>

        {/* Metric 2: Discipline Score */}
        <div className="p-4 rounded-2xl bg-[#0e1017] border border-neutral-800/80 hover:border-emerald-500/40 transition shadow-sm">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider font-mono">Discipline Score</span>
            <Target className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono">{stats.discipline_score}</span>
            <span className="text-xs text-emerald-400 font-bold">/ 100</span>
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">
            Punctuality + Task Volume
          </p>
        </div>

        {/* Metric 3: Weekly Consistency */}
        <div 
          onClick={() => onNavigateTab('statistics')}
          className="p-4 rounded-2xl bg-[#0e1017] border border-neutral-800/80 hover:border-blue-500/40 transition cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider font-mono">7-Day Consistency</span>
            <Award className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono">{stats.weekly_completion_rate}%</span>
          </div>
          <p className="text-[11px] text-neutral-400 mt-1 flex items-center justify-between">
            <span>Target: ≥ {stats.daily_target_pct}%</span>
            <ArrowUpRight className="w-3 h-3 text-neutral-400 group-hover:text-blue-400 transition" />
          </p>
        </div>

        {/* Metric 4: All-time Completed */}
        <div className="p-4 rounded-2xl bg-[#0e1017] border border-neutral-800/80 hover:border-purple-500/40 transition shadow-sm">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider font-mono">Total Completed</span>
            <CheckCircle2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono">{stats.total_completed_all_time}</span>
            <span className="text-xs text-purple-400 font-bold">TASKS</span>
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">
            Lifetime discipline reps
          </p>
        </div>

      </div>

      {/* Main Content Layout: Progress Gauge (Left) + Timeline (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Progress Ring & Daily Breakdown */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-6 rounded-2xl bg-[#0e1017] border border-neutral-800/90 shadow-xl flex flex-col items-center text-center">
            <div className="w-full flex items-center justify-between pb-4 border-b border-neutral-800/80 mb-6">
              <span className="text-xs font-mono font-bold tracking-wider text-neutral-300 uppercase">
                Daily Completion
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                stats.progress_pct >= stats.daily_target_pct
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                {stats.progress_pct >= stats.daily_target_pct ? 'TARGET MET' : 'IN PROGRESS'}
              </span>
            </div>

            {/* Circular Progress Component */}
            <CircularProgress
              percentage={stats.progress_pct}
              completed={stats.completed}
              total={stats.total_planned}
              disciplineScore={stats.discipline_score}
            />

            {/* Breakdown Mini Cards */}
            <div className="w-full grid grid-cols-3 gap-2 mt-6 pt-5 border-t border-neutral-800/80">
              <div className="p-2.5 rounded-xl bg-neutral-950/60 border border-emerald-500/20 text-center">
                <span className="text-[10px] font-mono text-neutral-400 block">COMPLETED</span>
                <span className="text-lg font-black font-mono text-emerald-400">{stats.completed}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800 text-center">
                <span className="text-[10px] font-mono text-neutral-400 block">PENDING</span>
                <span className="text-lg font-black font-mono text-neutral-300">{stats.pending}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-neutral-950/60 border border-rose-500/20 text-center">
                <span className="text-[10px] font-mono text-neutral-400 block">MISSED</span>
                <span className="text-lg font-black font-mono text-rose-400">{stats.missed}</span>
              </div>
            </div>

            {/* Date Quick Switchers */}
            <div className="w-full mt-4 pt-3 border-t border-neutral-800/60 flex items-center justify-between text-xs text-neutral-400">
              <span>View History:</span>
              <button
                onClick={() => onNavigateTab('calendar')}
                className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
              >
                <span>Full Calendar</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Motivational Tip Box */}
          <div className="p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800/80 text-xs space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <Sparkles className="w-4 h-4" />
              <span>Streak Protection Rule</span>
            </div>
            <p className="text-neutral-400 text-[11px] leading-relaxed">
              Completing your task within your <strong>10m grace period</strong> preserves maximum discipline score. Late completions still uphold your consistency streak!
            </p>
          </div>
        </div>

        {/* Right Column: Chronological Routine Timeline */}
        <div className="lg:col-span-8 space-y-4">
          <div className="p-5 sm:p-6 rounded-2xl bg-[#0e1017] border border-neutral-800/90 shadow-xl">
            
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800/80 mb-5">
              <div>
                <h2 className="text-base font-bold text-white tracking-wide">Today's Chronological Protocol</h2>
                <p className="text-xs text-neutral-400 mt-0.5">Tasks scheduled in chronological order</p>
              </div>
              <span className="text-xs font-mono font-bold text-neutral-400 bg-neutral-900 px-2.5 py-1 rounded-lg border border-neutral-800">
                {timeline.length} ROUTINES
              </span>
            </div>

            {timeline.length === 0 ? (
              <div className="text-center py-12 px-4 border border-dashed border-neutral-800 rounded-2xl">
                <Target className="w-10 h-10 mx-auto text-neutral-600 mb-2" />
                <h3 className="text-sm font-bold text-neutral-300">No Routines Scheduled</h3>
                <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                  There are no active routines configured for this day. Deploy routines to activate tracking.
                </p>
                <button
                  onClick={onOpenAddModal}
                  className="mt-4 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Routine Now</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {timeline.map((item) => {
                  const theme = categoryThemes[item.routine.category] || categoryThemes.Other;
                  const isCompleted = item.status === 'completed';
                  const isMissed = item.status === 'missed';
                  const isPending = item.status === 'pending';
                  const isActing = actingRoutineId === item.routine.id;

                  return (
                    <div
                      key={item.routine.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isCompleted
                          ? 'bg-neutral-900/40 border-neutral-800/80 opacity-85'
                          : isMissed
                          ? 'bg-rose-950/10 border-rose-500/30'
                          : 'bg-neutral-900/80 border-neutral-700/80 hover:border-emerald-500/40 shadow-sm'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        
                        {/* Routine Details */}
                        <div className="flex items-start gap-3.5 min-w-0">
                          
                          {/* Time & Category Pill */}
                          <div className="flex-shrink-0 flex flex-col items-center">
                            <span className="font-mono text-xs font-bold text-white px-2 py-1 rounded bg-neutral-950 border border-neutral-800">
                              {item.routine.scheduled_time}
                            </span>
                            <div className="mt-1 flex items-center gap-1">
                              <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`} />
                              <span className={`text-[10px] font-semibold ${theme.text}`}>
                                {item.routine.category}
                              </span>
                            </div>
                          </div>

                          {/* Routine Title & Description */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className={`text-sm font-bold tracking-tight truncate ${
                                isCompleted ? 'text-neutral-300 line-through' : 'text-white'
                              }`}>
                                {item.routine.name}
                              </h4>

                              {/* Routine Streak Pill */}
                              {item.routine.current_streak > 0 && (
                                <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-orange-500/10 text-orange-400 border border-orange-500/30">
                                  <Flame className="w-3 h-3 fill-orange-400" />
                                  <span>{item.routine.current_streak}d</span>
                                </span>
                              )}

                              {/* Status Badges */}
                              {isCompleted && (
                                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${
                                  item.on_time
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                    : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                                }`}>
                                  {item.on_time ? 'DONE • ON-TIME' : 'DONE • LATE'}
                                </span>
                              )}

                              {isMissed && (
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded border font-semibold bg-rose-500/20 text-rose-300 border-rose-500/40">
                                  MISSED
                                </span>
                              )}
                            </div>

                            {item.routine.description && (
                              <p className="text-xs text-neutral-400 mt-1 line-clamp-1">
                                {item.routine.description}
                              </p>
                            )}

                            {/* Recorded completion info */}
                            {isCompleted && item.completed_at && (
                              <p className="text-[11px] font-mono text-neutral-400 mt-1">
                                Finished at {new Date(item.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            )}
                          </div>

                        </div>

                        {/* Interactive Buttons */}
                        <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                          
                          {isPending && (
                            <>
                              <button
                                onClick={() => handleMarkDone(item)}
                                disabled={isActing}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition shadow-[0_0_12px_rgba(16,185,129,0.2)] active:scale-95 disabled:opacity-50"
                              >
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                <span>Mark Done</span>
                              </button>

                              <button
                                onClick={() => handleMarkMissed(item.routine.id)}
                                disabled={isActing}
                                className="px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-neutral-400 hover:text-rose-400 hover:border-rose-500/40 text-xs font-medium transition"
                                title="Mark as Missed"
                              >
                                Missed
                              </button>
                            </>
                          )}

                          {isCompleted && (
                            <button
                              onClick={() => handleResetPending(item.routine.id)}
                              disabled={isActing}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white text-xs font-medium transition"
                              title="Reset status"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Undo</span>
                            </button>
                          )}

                          {isMissed && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleMarkDone(item)}
                                disabled={isActing}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 text-xs font-bold transition"
                              >
                                <Check className="w-3 h-3" />
                                <span>Complete Late</span>
                              </button>
                              <button
                                onClick={() => handleResetPending(item.routine.id)}
                                disabled={isActing}
                                className="px-2 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white text-xs"
                                title="Reset status"
                              >
                                <RotateCcw className="w-3 h-3" />
                              </button>
                            </div>
                          )}

                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </div>

      </div>

    </div>
  );
};
