import React from 'react';
import { cn } from '@/lib/utils';

export type BadgeState = 'Claimed' | 'Observed' | 'Evidence-linked' | 'Assessed' | 'Verified' | 'Expired' | 'have' | 'miss';

interface SkillBadgeProps {
  state: string;
  className?: string;
  children?: React.ReactNode;
}

const BADGE_STYLES: Record<string, string> = {
  Claimed: 'bg-line text-mut',
  Observed: 'bg-line text-ink',
  'Evidence-linked': 'bg-blt text-blu',
  Assessed: 'bg-wt text-warn',
  Verified: 'bg-okt text-ok',
  Expired: 'bg-bt text-bad',
  have: 'bg-okt text-ok',
  miss: 'bg-bt text-bad',
};

export default function SkillBadge({ state, className, children }: SkillBadgeProps) {
  const style = BADGE_STYLES[state] || 'bg-line text-mut';

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold transition-colors',
        style,
        className
      )}
    >
      {children || state}
    </span>
  );
}
