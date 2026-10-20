import React, { useState, useEffect } from 'react';
import { X, Clock, Tag, Calendar, AlignLeft, Check, Sparkles } from 'lucide-react';
import { Routine, RoutineCategory } from '../types';

interface AddRoutineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (routineData: Partial<Routine>) => Promise<void>;
  initialData?: Routine | null;
}

export const AddRoutineModal: React.FC<AddRoutineModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [name, setName] = useState('');
  const [scheduledTime, setScheduledTime] = useState('07:00');
  const [category, setCategory] = useState<RoutineCategory>('Health');
  const [description, setDescription] = useState('');
  const [repeatType, setRepeatType] = useState<'daily' | 'weekdays' | 'specific_dates'>('daily');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 7]);
  const [specificDate, setSpecificDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setScheduledTime(initialData.scheduled_time);
      setCategory(initialData.category);
      setDescription(initialData.description || '');
      setRepeatType(initialData.repeat_type);
      setSelectedDays(initialData.repeat_days || [1, 2, 3, 4, 5, 6, 7]);
      setSpecificDate(initialData.specific_dates?.[0] || '');
    } else {
      setName('');
      setScheduledTime('07:30');
      setCategory('Health');
      setDescription('');
      setRepeatType('daily');
      setSelectedDays([1, 2, 3, 4, 5, 6, 7]);
      setSpecificDate('');
    }
    setError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const categories: { label: RoutineCategory; color: string }[] = [
    { label: 'Exercise', color: 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10' },
    { label: 'Study', color: 'border-purple-500/50 text-purple-400 bg-purple-500/10' },
    { label: 'Work', color: 'border-blue-500/50 text-blue-400 bg-blue-500/10' },
    { label: 'Health', color: 'border-cyan-500/50 text-cyan-400 bg-cyan-500/10' },
    { label: 'Personal Growth', color: 'border-amber-500/50 text-amber-400 bg-amber-500/10' },
    { label: 'Other', color: 'border-neutral-500/50 text-neutral-400 bg-neutral-500/10' },
  ];

  const daysList = [
    { id: 1, label: 'Mon' },
    { id: 2, label: 'Tue' },
    { id: 3, label: 'Wed' },
    { id: 4, label: 'Thu' },
    { id: 5, label: 'Fri' },
    { id: 6, label: 'Sat' },
    { id: 7, label: 'Sun' },
  ];

  const toggleDay = (dayId: number) => {
    if (selectedDays.includes(dayId)) {
      if (selectedDays.length === 1) return; // Keep at least 1 day
      setSelectedDays(selectedDays.filter(d => d !== dayId));
    } else {
      setSelectedDays([...selectedDays, dayId].sort());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Routine name is required');
      return;
    }
    if (!scheduledTime) {
      setError('Scheduled time is required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onSave({
        name: name.trim(),
        scheduled_time: scheduledTime,
        category,
        description: description.trim(),
        repeat_type: repeatType,
        repeat_days: repeatType === 'daily' ? [1, 2, 3, 4, 5, 6, 7] : selectedDays,
        specific_dates: repeatType === 'specific_dates' && specificDate ? [specificDate] : [],
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save routine');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#0e1017] border border-neutral-800 p-6 shadow-2xl text-white my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                {initialData ? 'Edit Routine Protocol' : 'Deploy New Routine'}
              </h2>
              <p className="text-xs text-neutral-400">Lock in your daily non-negotiable standards</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          
          {/* Routine Name */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
              Routine Title *
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. 5KM Tempo Run, Cold Shower, Deep Work Sprint"
              className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-700/80 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              required
            />
          </div>

          {/* Time & Category Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                Scheduled Time (24h) *
              </label>
              <input
                type="time"
                value={scheduledTime}
                onChange={e => setScheduledTime(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-400" />
                Category
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as RoutineCategory)}
                className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                {categories.map(c => (
                  <option key={c.label} value={c.label}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category Quick Tags */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {categories.map(c => (
              <button
                key={c.label}
                type="button"
                onClick={() => setCategory(c.label)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                  category === c.label
                    ? c.color + ' ring-1 ring-white/20'
                    : 'border-neutral-800 text-neutral-400 hover:text-white bg-neutral-900/60'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Repeat Schedule */}
          <div className="pt-2">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              Repeat Frequency
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'daily', label: 'Every Day' },
                { id: 'weekdays', label: 'Selected Days' },
                { id: 'specific_dates', label: 'Specific Date' },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setRepeatType(tab.id as any)}
                  className={`py-2 px-3 rounded-xl text-xs font-medium border transition text-center ${
                    repeatType === tab.id
                      ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 font-bold'
                      : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Selected Days selector */}
            {repeatType === 'weekdays' && (
              <div className="mt-3 p-3 bg-neutral-950/60 rounded-xl border border-neutral-800/80">
                <span className="text-[11px] text-neutral-400 block mb-2 font-mono">
                  ACTIVE ON DAYS:
                </span>
                <div className="grid grid-cols-7 gap-1.5">
                  {daysList.map(d => {
                    const active = selectedDays.includes(d.id);
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => toggleDay(d.id)}
                        className={`h-9 rounded-lg text-xs font-bold transition flex items-center justify-center ${
                          active
                            ? 'bg-emerald-500 text-black shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                            : 'bg-neutral-900 text-neutral-500 border border-neutral-800 hover:text-neutral-300'
                        }`}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Specific Date picker */}
            {repeatType === 'specific_dates' && (
              <div className="mt-3">
                <input
                  type="date"
                  value={specificDate}
                  onChange={e => setSpecificDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
              <AlignLeft className="w-3.5 h-3.5 text-emerald-400" />
              Directives / Instructions (Optional)
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Key guidelines, target metrics, or why this routine cannot be compromised."
              rows={2}
              className="w-full px-3.5 py-2 bg-neutral-900 border border-neutral-700/80 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Submit Actions */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-neutral-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-neutral-700 text-xs font-medium text-neutral-300 hover:bg-neutral-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition shadow-[0_0_15px_rgba(16,185,129,0.25)] active:scale-95 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : initialData ? 'Update Routine' : 'Activate Routine'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
