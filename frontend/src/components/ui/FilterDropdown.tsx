'use client';

import React from 'react';
import { Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FilterOption {
  label: string;
  value: string;
}

interface FilterDropdownProps {
  label: string;
  options: FilterOption[];
  selectedValue: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function FilterDropdown({
  label,
  options,
  selectedValue,
  onChange,
  className,
}: FilterDropdownProps) {
  return (
    <div className={cn('relative inline-flex items-center', className)}>
      <div className="flex items-center gap-1.5 bg-card border border-line rounded-xl px-3 py-1.5 shadow-sm text-xs font-semibold text-ink">
        <Filter size={13} className="text-mut" />
        <span className="text-mut">{label}:</span>
        <select
          value={selectedValue}
          onChange={(e) => onChange(e.target.value)}
          className="bg-transparent text-ink font-bold outline-none cursor-pointer pr-1"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-card text-ink">
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
