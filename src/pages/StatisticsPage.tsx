import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  AlertTriangle, 
  CheckCircle, 
  Flame, 
  Target, 
  Sparkles,
  Zap,
  ArrowUpRight
} from 'lucide-react';
import { api } from '../services/api';

export const StatisticsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        setIsLoading(true);
        const res = await api.getAnalytics();
        setData(res);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, []);

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center py-24 text-neutral-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono">CALCULATING DISCIPLINE ANALYTICS...</span>
        </div>
      </div>
    );
  }

  const { trend_14_days, category_breakdown, best_routines, most_missed, routine_performance } = data;

  // Max value in 14-day trend for scaling SVG bars
  const maxPlanned = Math.max(...trend_14_days.map((d: any) => Math.max(d.planned, 1)));

  // Total completions across categories
  const totalCatCompletions = category_breakdown.reduce((acc: number, c: any) => acc + c.total_completions, 0);

  // Overall average punctuality
  const totalCompleted = routine_performance.reduce((acc: number, r: any) => acc + r.completed_count, 0);
  const onTimeCount = routine_performance.reduce((acc: number, r: any) => acc + Math.round((r.completed_count * r.punctuality_pct) / 100), 0);
  const averagePunctuality = totalCompleted > 0 ? Math.round((onTimeCount / totalCompleted) * 100) : 100;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Header */}
      <div className="pb-3 border-b border-neutral-800">
        <span className="text-xs font-mono tracking-widest text-emerald-400 uppercase">
          PERFORMANCE INTELLIGENCE
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-0.5">
          Productivity & Consistency Analytics
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
          Objective breakdown of execution volume, punctuality, and habit patterns
        </p>
      </div>

      {/* Top 3 High Impact KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className="p-5 rounded-2xl bg-[#0e1017] border border-neutral-800/90 shadow-sm">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-mono font-semibold uppercase">Average Punctuality</span>
            <Target className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white font-mono">{averagePunctuality}%</span>
            <span className="text-xs text-emerald-400 font-bold">ON-TIME</span>
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">
            Completed within configured 10m grace period
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0e1017] border border-neutral-800/90 shadow-sm">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-mono font-semibold uppercase">14-Day Consistency</span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white font-mono">
              {Math.round(trend_14_days.reduce((a: number, b: any) => a + b.rate, 0) / trend_14_days.length)}%
            </span>
            <span className="text-xs text-blue-400 font-bold">AVG RATE</span>
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">
            Sustained target adherence across 2 weeks
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0e1017] border border-neutral-800/90 shadow-sm">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-mono font-semibold uppercase">Total Reps Completed</span>
            <Zap className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white font-mono">{totalCompleted}</span>
            <span className="text-xs text-purple-400 font-bold">ROUTINES</span>
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">
            Confirmed disciplined task executions
          </p>
        </div>

      </div>

      {/* 14-Day Productivity & Discipline Trend Chart */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#0e1017] border border-neutral-800/90 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-neutral-800 mb-6">
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">
              14-Day Consistency & Discipline Trend
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Daily completion volume vs planned targets
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500" />
              <span className="text-neutral-300">Completed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-rose-500/60" />
              <span className="text-neutral-300">Missed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-neutral-800" />
              <span className="text-neutral-400">Planned Target</span>
            </div>
          </div>
        </div>

        {/* SVG/Bar Responsive Chart */}
        <div className="h-64 flex items-end justify-between gap-1.5 sm:gap-3 pt-6 px-1">
          {trend_14_days.map((day: any) => {
            const barHeightPct = day.planned > 0 ? (day.completed / maxPlanned) * 100 : 0;
            const missedHeightPct = day.planned > 0 ? (day.missed / maxPlanned) * 100 : 0;
            const totalPlannedPct = (day.planned / maxPlanned) * 100;

            return (
              <div key={day.date} className="flex-1 flex flex-col items-center h-full justify-end group">
                
                {/* Tooltip on hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-900 border border-neutral-700 p-2 rounded-lg text-center text-[10px] font-mono pointer-events-none mb-2 z-10 shadow-xl whitespace-nowrap">
                  <div className="text-emerald-400 font-bold">{day.day}</div>
                  <div className="text-white">{day.completed}/{day.planned} completed ({day.rate}%)</div>
                  <div className="text-neutral-400">Discipline Score: {day.discipline_score}%</div>
                </div>

                {/* Bar Stack Container */}
                <div 
                  className="w-full max-w-[28px] bg-neutral-900 rounded-t-lg relative flex flex-col justify-end overflow-hidden border border-neutral-800"
                  style={{ height: `${Math.max(totalPlannedPct, 12)}%` }}
                >
                  {/* Missed portion */}
                  {day.missed > 0 && (
                    <div 
                      className="w-full bg-rose-500/80" 
                      style={{ height: `${missedHeightPct}%` }}
                    />
                  )}
                  {/* Completed portion */}
                  <div 
                    className="w-full bg-emerald-500 transition-all duration-500" 
                    style={{ height: `${barHeightPct}%` }}
                  />
                </div>

                {/* Day Label */}
                <span className="mt-2 text-[10px] font-mono text-neutral-400 group-hover:text-emerald-400 transition truncate max-w-[42px] text-center">
                  {day.day.split(' ')[0]}
                </span>
                <span className="text-[9px] font-mono text-neutral-400">
                  {day.day.split(' ')[1]}
                </span>
              </div>
            );
          })}
        </div>

      </div>

      {/* Two Column Grid: Category Breakdown + Routine Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Category Distribution */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#0e1017] border border-neutral-800/90 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">Category Distribution</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Where your disciplined focus is directed</p>
            </div>
            <PieChart className="w-4 h-4 text-neutral-500" />
          </div>

          <div className="space-y-3.5">
            {category_breakdown.map((cat: any) => {
              const pct = totalCatCompletions > 0
                ? Math.round((cat.total_completions / totalCatCompletions) * 100)
                : 0;

              return (
                <div key={cat.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">{cat.category}</span>
                    <span className="font-mono text-neutral-400 text-[11px]">
                      {cat.total_completions} reps ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-neutral-900 overflow-hidden border border-neutral-800">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Best Performing vs Missed Pattern */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#0e1017] border border-neutral-800/90 shadow-xl space-y-6">
          
          {/* Top Routines */}
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800 mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <h4 className="text-sm font-bold text-white">Best Performing Routines</h4>
              </div>
              <span className="text-[10px] font-mono text-emerald-400">HIGHEST COMPLETION</span>
            </div>

            <div className="space-y-2">
              {best_routines.slice(0, 3).map((r: any) => (
                <div key={r.routine_id} className="p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white block truncate">{r.name}</span>
                    <span className="text-[10px] text-neutral-500 font-mono">
                      {r.scheduled_time} • {r.category}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-400 font-mono font-bold block">{r.completed_count} done</span>
                    <span className="text-[10px] text-neutral-400 font-mono">{r.punctuality_pct}% on-time</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Missed Patterns Warning */}
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800 mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <h4 className="text-sm font-bold text-white">Friction Points & Missed Patterns</h4>
              </div>
              <span className="text-[10px] font-mono text-rose-400">REQUIRES CALIBRATION</span>
            </div>

            <div className="space-y-2">
              {most_missed.filter((m: any) => m.missed_count > 0).length === 0 ? (
                <p className="text-xs text-neutral-500 py-3 text-center font-mono">
                  No recurring misses detected. Execution is locked in!
                </p>
              ) : (
                most_missed.filter((m: any) => m.missed_count > 0).slice(0, 3).map((r: any) => (
                  <div key={r.routine_id} className="p-2.5 rounded-xl bg-rose-950/15 border border-rose-500/30 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-neutral-200 block truncate">{r.name}</span>
                      <span className="text-[10px] text-neutral-500 font-mono">
                        Scheduled at {r.scheduled_time}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-rose-400 font-mono font-bold block">{r.missed_count} misses</span>
                      <span className="text-[10px] text-neutral-400 font-mono">Check grace period</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
