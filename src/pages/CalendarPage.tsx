import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Check, 
  Clock, 
  AlertCircle, 
  RotateCcw,
  Sparkles,
  Layers
} from 'lucide-react';
import { api } from '../services/api';
import { RoutineCategory } from '../types';
import { soundEngine } from '../utils/audio';

interface CalendarPageProps {
  onSetStatus: (routineId: string, status: 'completed' | 'missed' | 'pending', actualTime?: string | null, notes?: string) => Promise<void>;
  soundEnabled: boolean;
  onNavigateDateToDashboard: (date: string) => void;
}

export const CalendarPage: React.FC<CalendarPageProps> = ({
  onSetStatus,
  soundEnabled,
  onNavigateDateToDashboard,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day'>('month');
  const [monthData, setMonthData] = useState<{ [date: string]: any }>({});
  const [selectedDayDate, setSelectedDayDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1; // 1-12

  const fetchMonth = async () => {
    try {
      setIsLoading(true);
      const res = await api.getCalendarMonth(year, month);
      setMonthData(res.days || {});
    } catch (err) {
      console.error('Failed to load month calendar:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMonth();
  }, [year, month]);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDayDate(new Date().toISOString().split('T')[0]);
  };

  // Calendar Day Generation
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay(); // 0 is Sun
  // Convert to Mon=0 ... Sun=6
  const startingCol = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  const daysInMonth = new Date(year, month, 0).getDate();

  const daysGrid: Array<{ dateStr: string; dayNumber: number; isCurrentMonth: boolean }> = [];

  // Previous month padding
  const prevMonthDays = new Date(year, month - 1, 0).getDate();
  for (let i = startingCol - 1; i >= 0; i--) {
    const dNum = prevMonthDays - i;
    const prevM = month - 1 === 0 ? 12 : month - 1;
    const prevY = month - 1 === 0 ? year - 1 : year;
    const dStr = `${prevY}-${String(prevM).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`;
    daysGrid.push({ dateStr: dStr, dayNumber: dNum, isCurrentMonth: false });
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    daysGrid.push({ dateStr: dStr, dayNumber: d, isCurrentMonth: true });
  }

  // Next month padding to reach multiple of 7
  const remaining = (7 - (daysGrid.length % 7)) % 7;
  for (let d = 1; d <= remaining; d++) {
    const nextM = month + 1 === 13 ? 1 : month + 1;
    const nextY = month + 1 === 13 ? year + 1 : year;
    const dStr = `${nextY}-${String(nextM).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    daysGrid.push({ dateStr: dStr, dayNumber: d, isCurrentMonth: false });
  }

  const selectedDayDetails = monthData[selectedDayDate] || null;

  const handleDayTaskStatus = async (routineId: string, status: 'completed' | 'missed' | 'pending') => {
    const now = status === 'completed' ? new Date().toISOString() : null;
    await onSetStatus(routineId, status, now);
    if (soundEnabled) {
      if (status === 'completed') soundEngine.playTacticalChime();
      else soundEngine.playRadarPing();
    }
    await fetchMonth();
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-neutral-800">
        <div>
          <span className="text-xs font-mono tracking-widest text-emerald-400 uppercase">
            TEMPORAL CADENCE
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-0.5">
            Discipline Calendar
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
            Audit historical consistency and correct past logs
          </p>
        </div>

        {/* View & Navigation Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Month Switcher */}
          <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded-xl p-1">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-bold text-white font-mono min-w-[120px] text-center">
              {monthNames[month - 1]} {year}
            </span>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={goToToday}
            className="px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-bold text-emerald-400 hover:bg-neutral-800 transition"
          >
            Today
          </button>
        </div>
      </div>

      {/* Main Grid & Inspection Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Month View Matrix */}
        <div className="lg:col-span-8 p-5 sm:p-6 rounded-2xl bg-[#0e1017] border border-neutral-800/90 shadow-xl">
          
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center pb-3 border-b border-neutral-800/80 mb-2 font-mono text-xs font-bold text-neutral-400">
            <span>MON</span>
            <span>TUE</span>
            <span>WED</span>
            <span>THU</span>
            <span>FRI</span>
            <span className="text-emerald-400">SAT</span>
            <span className="text-emerald-400">SUN</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {daysGrid.map((cell) => {
              const dayData = monthData[cell.dateStr];
              const isSelected = selectedDayDate === cell.dateStr;
              const isToday = cell.dateStr === new Date().toISOString().split('T')[0];

              // Color based on completion rate
              let badgeColor = 'bg-neutral-900 border-neutral-800';
              if (dayData && dayData.planned_count > 0) {
                if (dayData.completion_rate >= 80) {
                  badgeColor = 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300';
                } else if (dayData.completion_rate >= 40) {
                  badgeColor = 'bg-amber-500/15 border-amber-500/40 text-amber-300';
                } else {
                  badgeColor = 'bg-rose-500/15 border-rose-500/40 text-rose-300';
                }
              }

              return (
                <button
                  key={cell.dateStr}
                  onClick={() => setSelectedDayDate(cell.dateStr)}
                  className={`min-h-[72px] sm:min-h-[88px] p-2 rounded-xl border flex flex-col justify-between text-left transition relative ${
                    cell.isCurrentMonth ? '' : 'opacity-30'
                  } ${
                    isSelected
                      ? 'ring-2 ring-emerald-400 border-emerald-400 bg-neutral-900/90 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                      : 'hover:border-neutral-700 bg-neutral-950/60 border-neutral-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-mono font-bold ${
                      isToday ? 'px-1.5 py-0.5 rounded bg-emerald-500 text-black' : 'text-neutral-300'
                    }`}>
                      {cell.dayNumber}
                    </span>

                    {dayData && dayData.planned_count > 0 && (
                      <span className={`text-[10px] font-mono px-1 rounded border ${badgeColor}`}>
                        {dayData.completion_rate}%
                      </span>
                    )}
                  </div>

                  {/* Task counts indicator dots */}
                  {dayData && dayData.planned_count > 0 ? (
                    <div className="mt-1 space-y-1">
                      <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden flex">
                        <div
                          style={{ width: `${dayData.completion_rate}%` }}
                          className="bg-emerald-500 h-full"
                        />
                        {dayData.missed_count > 0 && (
                          <div
                            style={{ width: `${(dayData.missed_count / dayData.planned_count) * 100}%` }}
                            className="bg-rose-500 h-full"
                          />
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-neutral-400 hidden sm:block">
                        {dayData.completed_count}/{dayData.planned_count} done
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] font-mono text-neutral-600 italic">rest</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Color Key */}
          <div className="flex flex-wrap items-center gap-4 mt-6 pt-4 border-t border-neutral-800 text-xs text-neutral-400 font-mono">
            <span className="text-neutral-400">DISCIPLINE KEY:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>≥80% Target Met</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>40-79% Partial</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>&lt;40% Critical Miss</span>
            </div>
          </div>

        </div>

        {/* Selected Day Audit Drawer */}
        <div className="lg:col-span-4 p-5 sm:p-6 rounded-2xl bg-[#0e1017] border border-neutral-800/90 shadow-xl flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-neutral-800 mb-4">
              <span className="text-[10px] font-mono text-emerald-400 tracking-wider uppercase">
                SELECTED DAY AUDIT
              </span>
              <h3 className="text-base font-bold text-white tracking-wide mt-0.5">
                {new Date(selectedDayDate + 'T12:00:00').toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </h3>
            </div>

            {selectedDayDetails && selectedDayDetails.tasks && selectedDayDetails.tasks.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono bg-neutral-950/80 p-2.5 rounded-xl border border-neutral-800">
                  <span>COMPLETION RATE:</span>
                  <span className="text-emerald-400 font-bold">{selectedDayDetails.completion_rate}%</span>
                </div>

                <p className="text-[11px] text-neutral-400">
                  Tap status buttons below to retroactively log or correct entries:
                </p>

                <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                  {selectedDayDetails.tasks.map((task: any) => {
                    const isDone = task.status === 'completed';
                    const isMissed = task.status === 'missed';

                    return (
                      <div
                        key={task.routine_id}
                        className={`p-3 rounded-xl border transition ${
                          isDone
                            ? 'bg-neutral-900/40 border-neutral-800'
                            : isMissed
                            ? 'bg-rose-950/15 border-rose-500/30'
                            : 'bg-neutral-900/80 border-neutral-800'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[10px] font-bold text-white px-1.5 py-0.5 rounded bg-neutral-950 border border-neutral-800">
                                {task.scheduled_time}
                              </span>
                              <span className="text-xs font-bold text-white">
                                {task.name}
                              </span>
                            </div>
                            <span className="text-[10px] text-neutral-400 block mt-1 font-mono">
                              Status: {task.status.toUpperCase()} {task.on_time ? '(On-Time)' : '(Late)'}
                            </span>
                          </div>

                          {/* Quick Toggle Controls */}
                          <div className="flex items-center gap-1">
                            {!isDone && (
                              <button
                                onClick={() => handleDayTaskStatus(task.routine_id, 'completed')}
                                className="px-2 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-bold transition flex items-center gap-1"
                              >
                                <Check className="w-3 h-3" />
                                <span>Done</span>
                              </button>
                            )}
                            {isDone && (
                              <button
                                onClick={() => handleDayTaskStatus(task.routine_id, 'pending')}
                                className="p-1 rounded-lg bg-neutral-950 hover:bg-neutral-800 text-neutral-400 text-[10px]"
                                title="Reset to pending"
                              >
                                <RotateCcw className="w-3 h-3" />
                              </button>
                            )}
                            {!isMissed && !isDone && (
                              <button
                                onClick={() => handleDayTaskStatus(task.routine_id, 'missed')}
                                className="px-2 py-1 rounded-lg bg-neutral-900 text-neutral-400 hover:text-rose-400 text-[10px] border border-neutral-800"
                              >
                                Miss
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-neutral-500">
                <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-30 text-emerald-400" />
                <p className="text-xs font-semibold text-neutral-300">Rest Day</p>
                <p className="text-[11px] text-neutral-500 mt-1">
                  No routine protocols planned for this date.
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-800">
            <button
              onClick={() => onNavigateDateToDashboard(selectedDayDate)}
              className="w-full py-2.5 rounded-xl bg-neutral-900 border border-neutral-700 hover:border-emerald-500 text-xs font-bold text-white transition flex items-center justify-center gap-2"
            >
              <span>Inspect in Live Dashboard</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
