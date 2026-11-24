import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export default function ErrorState({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while loading this view.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center bg-card border border-bad/20 rounded-2xl space-y-3',
        className
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-bt text-bad grid place-items-center shadow-sm">
        <AlertCircle size={22} />
      </div>
      <div className="space-y-1 max-w-sm">
        <h4 className="font-bold text-sm text-ink">{title}</h4>
        <p className="text-xs text-mut leading-relaxed">{message}</p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-pt text-pri hover:bg-pri hover:text-white transition-colors"
        >
          <RefreshCw size={13} />
          Retry Request
        </button>
      )}
    </div>
  );
}
