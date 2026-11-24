'use client';

import React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DateSelectorProps {
  value: string;
  onChange: (val: string) => void;
  options?: { label: string; value: string }[];
  className?: string;
}

const DEFAULT_DATE_OPTIONS = [
  { label: 'Current Semester (2025–26)', value: 'current' },
  { label: 'Previous Semester (2024–25)', value: 'previous' },
  { label: 'Full Academic Year', value: 'full_year' },
  { label: 'All Historic Drives', value: 'all' },
];

export default function DateSelector({
  value,
  onChange,
  options = DEFAULT_DATE_OPTIONS,
  className,
}: DateSelectorProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 bg-card border border-line rounded-xl px-3 py-1.5 shadow-sm text-xs font-semibold text-ink',
        className
      )}
    >
      <CalendarIcon size={14} className="text-mut flex-shrink-0" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent font-bold text-ink outline-none cursor-pointer pr-1"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-card text-ink">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
