import React from 'react';

interface ReadinessRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  variant?: 'light' | 'primary';
  showLabel?: boolean;
}

export default function ReadinessRing({
  score,
  size = 120,
  strokeWidth = 3.5,
  variant = 'light',
  showLabel = true,
}: ReadinessRingProps) {
  const radius = 16;
  const circumference = 2 * Math.PI * radius; // ~100.53
  const strokeDash = (Math.min(100, Math.max(0, score)) / 100) * circumference;

  const isLight = variant === 'light';

  return (
    <div
      className="relative inline-flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 40 40"
        width={size}
        height={size}
        className="transform -rotate-90 drop-shadow-sm"
      >
        <defs>
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isLight ? '#ffffff' : '#3b82f6'} />
            <stop offset="100%" stopColor={isLight ? '#e0f2fe' : '#10b981'} />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow
              dx="0"
              dy="0"
              stdDeviation="1.5"
              floodColor={isLight ? '#ffffff' : '#3b82f6'}
              floodOpacity="0.4"
            />
          </filter>
        </defs>

        {/* Track Circle */}
        <circle
          cx="20"
          cy="20"
          r={radius}
          fill="none"
          stroke={isLight ? 'rgba(255, 255, 255, 0.22)' : 'var(--line)'}
          strokeWidth={strokeWidth}
        />

        {/* Value Circle */}
        <circle
          cx="20"
          cy="20"
          r={radius}
          fill="none"
          stroke="url(#ringGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${strokeDash} ${circumference}`}
          style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
          filter="url(#glow)"
        />
      </svg>

      {/* Center Score */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
        <span
          className={`font-black tracking-tight leading-none ${
            isLight ? 'text-white text-3xl' : 'text-ink text-2xl'
          }`}
        >
          {score}
        </span>
        {showLabel && (
          <span
            className={`text-[9px] font-extrabold uppercase tracking-widest mt-0.5 ${
              isLight ? 'text-white/80' : 'text-mut'
            }`}
          >
            INDEX
          </span>
        )}
      </div>
    </div>
  );
}
