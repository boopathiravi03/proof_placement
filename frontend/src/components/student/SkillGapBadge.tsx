import React from 'react';

interface SkillGapBadgeProps {
  priority?: string;
  gapStatus?: string;
}

const PRIORITY_STYLES: Record<string, string> = {
  Critical: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
  High: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
  Medium: 'bg-pri/10 text-pri border-pri/20',
  Low: 'bg-slate-500/10 text-mut border-line',
};

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  meets_requirement: { label: 'Meets Requirement', cls: 'bg-okt text-ok border-ok/20' },
  needs_improvement: { label: 'Needs Improvement', cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30' },
  missing_skill: { label: 'Missing Skill', cls: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30' },
  evidence_required: { label: 'Evidence Required', cls: 'bg-pri/10 text-pri border-pri/20' },
  assessment_required: { label: 'Assessment Required', cls: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30' },
  reassessment_recommended: { label: 'Reassessment Recommended', cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30' },
};

export default function SkillGapBadge({ priority, gapStatus }: SkillGapBadgeProps) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {priority && (
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            PRIORITY_STYLES[priority] || PRIORITY_STYLES.Medium
          }`}
        >
          {priority}
        </span>
      )}
      {gapStatus && (
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            (STATUS_LABELS[gapStatus] || { cls: 'bg-bg text-mut border-line' }).cls
          }`}
        >
          {(STATUS_LABELS[gapStatus] || { label: gapStatus }).label}
        </span>
      )}
    </div>
  );
}
