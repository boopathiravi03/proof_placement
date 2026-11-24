import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number; // 0 to 100
  max?: number;
  label?: string;
  showPercentage?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function ProgressBar({
  value,
  max = 100,
  label,
  showPercentage = true,
  color = 'primary',
  size = 'md',
  className,
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  const colorStyles = {
    primary: 'bg-pri',
    success: 'bg-ok',
    warning: 'bg-warn',
    danger: 'bg-bad',
  }[color];

  const sizeStyles = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-3.5',
  }[size];

  return (
    <div className={cn('w-full space-y-1.5', className)}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center text-xs">
          {label && <span className="font-semibold text-ink">{label}</span>}
          {showPercentage && <span className="font-bold text-mut ml-auto">{percentage}%</span>}
        </div>
      )}
      <div className={cn('w-full bg-line rounded-full overflow-hidden flex', sizeStyles)}>
        <div
          className={cn('h-full rounded-full transition-all duration-500', colorStyles)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
