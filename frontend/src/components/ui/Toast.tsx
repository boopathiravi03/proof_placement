'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose?: () => void;
  className?: string;
}

export default function Toast({
  message,
  type = 'info',
  onClose,
  className,
}: ToastProps) {
  const icon = {
    success: <CheckCircle2 size={16} className="text-ok flex-shrink-0" />,
    error: <AlertCircle size={16} className="text-bad flex-shrink-0" />,
    info: <Info size={16} className="text-blu flex-shrink-0" />,
  }[type];

  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-ink text-bg px-4 py-3 rounded-xl shadow-xl border border-line/20 text-xs font-semibold animate-slideUp',
        className
      )}
    >
      {icon}
      <span>{message}</span>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="ml-2 text-mut hover:text-bg transition-colors"
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}
