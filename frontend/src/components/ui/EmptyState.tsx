import React from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export default function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center bg-card border border-line rounded-2xl space-y-3',
        className
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-pt text-pri grid place-items-center shadow-sm">
        {icon || <Inbox size={22} />}
      </div>
      <div className="space-y-1 max-w-sm">
        <h4 className="font-bold text-sm text-ink">{title}</h4>
        <p className="text-xs text-mut leading-relaxed">{description}</p>
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
