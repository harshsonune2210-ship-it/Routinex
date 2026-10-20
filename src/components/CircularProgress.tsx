import React from 'react';

interface CircularProgressProps {
  percentage: number;
  completed: number;
  total: number;
  size?: number;
  strokeWidth?: number;
  disciplineScore?: number;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  percentage,
  completed,
  total,
  size = 180,
  strokeWidth = 14,
  disciplineScore,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPct = Math.min(100, Math.max(0, percentage));
  const strokeDashoffset = circumference - (clampedPct / 100) * circumference;

  // Dynamic color based on completion
  const getGlowColor = () => {
    if (clampedPct >= 80) return '#10b981'; // emerald
    if (clampedPct >= 50) return '#3b82f6'; // blue
    return '#f59e0b'; // amber
  };

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="50%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <filter id="progressGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#1b1f2b"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray="4 6"
        />

        {/* Progress Ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
          style={{
            filter: clampedPct > 0 ? 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.4))' : 'none',
          }}
        />
      </svg>

      {/* Center Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-3xl font-black tracking-tight text-white font-mono">
          {clampedPct}%
        </span>
        <span className="text-[11px] font-mono tracking-wider text-neutral-400 uppercase mt-0.5">
          {completed}/{total} ROUTINES
        </span>
        {disciplineScore !== undefined && (
          <div className="mt-1 flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono text-emerald-400">
            <span>SCORE:</span>
            <span className="font-bold text-white">{disciplineScore}</span>
          </div>
        )}
      </div>
    </div>
  );
};
