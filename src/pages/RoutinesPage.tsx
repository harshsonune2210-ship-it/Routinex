import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Flame, 
  Clock, 
  Calendar, 
  Sparkles, 
  CheckCircle, 
  Tag, 
  RotateCcw
} from 'lucide-react';
import { Routine, RoutineCategory } from '../types';
import { soundEngine } from '../utils/audio';

interface RoutinesPageProps {
  routines: Routine[];
  onOpenAddModal: () => void;
  onEditRoutine: (routine: Routine) => void;
  onDeleteRoutine: (id: string) => Promise<void>;
  onReorderRoutines: (routineIds: string[]) => Promise<void>;
  onResetPresets: () => Promise<void>;
  soundEnabled: boolean;
}

export const RoutinesPage: React.FC<RoutinesPageProps> = ({
  routines,
  onOpenAddModal,
  onEditRoutine,
  onDeleteRoutine,
  onReorderRoutines,
  onResetPresets,
  soundEnabled,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const categories: string[] = ['All', 'Exercise', 'Study', 'Work', 'Health', 'Personal Growth', 'Other'];

  const categoryThemes: Record<RoutineCategory, { border: string; bg: string; text: string }> = {
    Exercise: { border: 'border-emerald-500/40', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
    Study: { border: 'border-purple-500/40', bg: 'bg-purple-500/10', text: 'text-purple-400' },
    Work: { border: 'border-blue-500/40', bg: 'bg-blue-500/10', text: 'text-blue-400' },
    Health: { border: 'border-cyan-500/40', bg: 'bg-cyan-500/10', text: 'text-cyan-400' },
    'Personal Growth': { border: 'border-amber-500/40', bg: 'bg-amber-500/10', text: 'text-amber-400' },
    Other: { border: 'border-neutral-500/40', bg: 'bg-neutral-500/10', text: 'text-neutral-400' },
  };

  const filteredRoutines = routines.filter(r => {
    const matchesCat = selectedCategory === 'All' || r.category === selectedCategory;
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= routines.length) return;

    const list = [...routines];
    const temp = list[index];
    list[index] = list[newIndex];
    list[newIndex] = temp;

    if (soundEnabled) soundEngine.playTacticalChime();
    await onReorderRoutines(list.map(r => r.id));
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this routine protocol? Associated completions will also be removed.')) {
      setDeletingId(id);
      try {
        await onDeleteRoutine(id);
        if (soundEnabled) soundEngine.playRadarPing();
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleRestorePresets = async () => {
    if (window.confirm('Reset routines to the high-performance DISCIPLINE OS default presets?')) {
      setIsResetting(true);
      try {
        await onResetPresets();
        if (soundEnabled) soundEngine.playTacticalChime();
      } finally {
        setIsResetting(false);
      }
    }
  };

  const formatSchedule = (routine: Routine) => {
    if (routine.repeat_type === 'daily') return 'Every single day';
    if (routine.repeat_type === 'weekdays') {
      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const days = (routine.repeat_days || []).map(d => dayNames[d - 1]).join(', ');
      return days || 'Weekdays';
    }
    if (routine.repeat_type === 'specific_dates') {
      return `Specific date: ${(routine.specific_dates || []).join(', ')}`;
    }
    return 'Custom';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-neutral-800">
        <div>
          <span className="text-xs font-mono tracking-widest text-emerald-400 uppercase">
            PROTOCOL DIRECTORY
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-0.5">
            Routine Management
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
            Architect, calibrate, and sequence your daily habits
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRestorePresets}
            disabled={isResetting}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700/80 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-neutral-800 transition disabled:opacity-50"
            title="Restore sample presets"
          >
            <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
            <span>Presets</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition shadow-[0_0_15px_rgba(16,185,129,0.25)] active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>New Routine</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search routines by title or directives..."
            className="w-full pl-9 pr-4 py-2 bg-neutral-900/90 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition border ${
                selectedCategory === cat
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                  : 'bg-neutral-900/60 text-neutral-400 border-neutral-800 hover:text-neutral-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Routines List */}
      {filteredRoutines.length === 0 ? (
        <div className="text-center py-16 px-4 bg-[#0e1017] border border-neutral-800 rounded-2xl">
          <Sparkles className="w-10 h-10 mx-auto text-neutral-600 mb-2" />
          <h3 className="text-sm font-bold text-neutral-300">No matching routines</h3>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
            {searchQuery || selectedCategory !== 'All'
              ? 'Try adjusting your search criteria or category filter.'
              : 'Add your first routine protocol to initiate tracking.'}
          </p>
          <button
            onClick={onOpenAddModal}
            className="mt-4 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Routine</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRoutines.map((routine, idx) => {
            const theme = categoryThemes[routine.category] || categoryThemes.Other;
            const originalIndex = routines.findIndex(r => r.id === routine.id);

            return (
              <div
                key={routine.id}
                className="p-5 rounded-2xl bg-[#0e1017] border border-neutral-800/90 hover:border-neutral-700 transition flex flex-col justify-between group shadow-sm"
              >
                <div>
                  
                  {/* Top Row: Time, Category & Reorder arrows */}
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-800/80 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-white px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800">
                        {routine.scheduled_time}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${theme.border} ${theme.bg} ${theme.text}`}>
                        {routine.category}
                      </span>
                    </div>

                    {/* Move Up / Down Buttons */}
                    <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition">
                      <button
                        onClick={() => handleMove(originalIndex, 'up')}
                        disabled={originalIndex === 0}
                        className="p-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white disabled:opacity-20 text-xs"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMove(originalIndex, 'down')}
                        disabled={originalIndex === routines.length - 1}
                        className="p-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white disabled:opacity-20 text-xs"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Routine Name & Description */}
                  <h3 className="text-base font-bold text-white tracking-tight">
                    {routine.name}
                  </h3>

                  {routine.description && (
                    <p className="text-xs text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                      {routine.description}
                    </p>
                  )}

                  {/* Schedule Repeat Tag */}
                  <div className="flex items-center gap-1.5 mt-3 text-[11px] font-mono text-neutral-400">
                    <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                    <span>{formatSchedule(routine)}</span>
                  </div>

                </div>

                {/* Bottom Row: Streak & Actions */}
                <div className="pt-4 mt-4 border-t border-neutral-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold font-mono">
                    <Flame className="w-3.5 h-3.5 fill-orange-400" />
                    <span>{routine.current_streak}d streak</span>
                    <span className="text-[10px] text-neutral-500 ml-1">
                      (best {routine.longest_streak}d)
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditRoutine(routine)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
                      title="Edit routine"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(routine.id)}
                      disabled={deletingId === routine.id}
                      className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      title="Delete routine"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
