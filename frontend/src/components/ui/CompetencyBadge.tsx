import React from 'react';
import { cn } from '@/lib/utils';
import { CompetencyState } from '@/types';
import { CheckCircle2, ShieldAlert, Clock, Sparkles } from 'lucide-react';

interface CompetencyBadgeProps {
  state: CompetencyState | string;
  className?: string;
  showIcon?: boolean;
}

const BADGE_CONFIG: Record<
  string,
  { label: string; style: string; icon?: React.ReactNode }
> = {
  Claimed: {
    label: 'Claimed',
    style: 'bg-line text-mut border-line',
  },
  Observed: {
    label: 'Observed',
    style: 'bg-line text-ink border-line',
  },
  'Evidence-linked': {
    label: 'Evidence-linked',
    style: 'bg-blt text-blu border-blu/20',
    icon: <Sparkles size={11} className="mr-1" />,
  },
  Assessed: {
    label: 'Assessed',
    style: 'bg-wt text-warn border-warn/20',
    icon: <Clock size={11} className="mr-1" />,
  },
  Verified: {
    label: 'Verified',
    style: 'bg-okt text-ok border-ok/20',
    icon: <CheckCircle2 size={11} className="mr-1" />,
  },
  Expired: {
    label: 'Expired',
    style: 'bg-bt text-bad border-bad/20',
    icon: <ShieldAlert size={11} className="mr-1" />,
  },
};

export default function CompetencyBadge({
  state,
  className,
  showIcon = true,
}: CompetencyBadgeProps) {
  const normalized =
    state.charAt(0).toUpperCase() + state.slice(1).replace('_', '-');
  const conf = BADGE_CONFIG[normalized] || {
    label: state,
    style: 'bg-line text-mut border-line',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border transition-colors',
        conf.style,
        className
      )}
    >
      {showIcon && conf.icon}
      {conf.label}
    </span>
  );
}
