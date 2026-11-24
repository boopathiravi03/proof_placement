'use client';

import React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  className,
}: SearchBarProps) {
  return (
    <div className={cn('relative flex items-center w-full max-w-sm', className)}>
      <Search size={16} className="absolute left-3.5 text-mut pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-card border border-line rounded-xl pl-9 pr-9 py-2 text-sm text-ink placeholder:text-mut focus:outline-none focus:border-pri shadow-sm transition-colors"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-3 text-mut hover:text-ink transition-colors"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
