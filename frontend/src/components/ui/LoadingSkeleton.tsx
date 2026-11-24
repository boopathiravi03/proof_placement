import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  count?: number;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse bg-line/60 rounded-xl', className)} />;
}

export default function LoadingSkeleton({ className, count = 1 }: SkeletonProps) {
  return (
    <div className="space-y-3 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={cn('h-16 w-full', className)} />
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-card border border-line rounded-2xl p-5 shadow-sm space-y-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}
