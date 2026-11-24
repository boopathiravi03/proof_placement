import React from 'react';
import SkillBadge from './SkillBadge';
import { ShieldCheck, GitBranch, Award, CheckCircle2, AlertTriangle, FileCode } from 'lucide-react';

interface SkillCardProps {
  name: string;
  stateIndex: number; // 0: Claimed, 1: Observed, 2: Evidence-linked, 3: Assessed, 4: Verified, 5: Expired
  evidenceText?: string;
  onActionClick?: () => void;
  actionLabel?: string;
}

const LIFECYCLE_STEPS = [
  { label: 'Claimed', short: 'Claim' },
  { label: 'Observed', short: 'Obs' },
  { label: 'Evidence-linked', short: 'Proof' },
  { label: 'Assessed', short: 'Test' },
  { label: 'Verified', short: 'Verif' },
];

export default function SkillCard({
  name,
  stateIndex,
  evidenceText,
  onActionClick,
  actionLabel,
}: SkillCardProps) {
  const isVerified = stateIndex === 4;
  const isExpired = stateIndex === 5;
  const isEvidenceLinked = stateIndex === 2;

  const currentLabel = isExpired
    ? 'Expired'
    : LIFECYCLE_STEPS[stateIndex]?.label || 'Claimed';

  return (
    <div className="group bg-card border border-line/80 hover:border-line rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4">
      <div className="space-y-3">
        {/* Header: Skill Name & Badge */}
        <div className="flex justify-between items-start gap-2">
          <div className="flex items-center gap-2">
            {isVerified ? (
              <span className="p-1 rounded-lg bg-okt text-ok border border-ok/20">
                <ShieldCheck size={16} />
              </span>
            ) : isEvidenceLinked ? (
              <span className="p-1 rounded-lg bg-pri/10 text-pri border border-pri/20">
                <GitBranch size={16} />
              </span>
            ) : (
              <span className="p-1 rounded-lg bg-bg text-mut border border-line">
                <FileCode size={16} />
              </span>
            )}
            <h3 className="font-bold text-base text-ink tracking-tight group-hover:text-pri transition-colors">
              {name}
            </h3>
          </div>
          <SkillBadge state={currentLabel} />
        </div>

        {/* 5-Step Stepper Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex gap-1.5">
            {LIFECYCLE_STEPS.map((step, idx) => {
              const isPassed = !isExpired && idx <= stateIndex;
              const isCurrent = !isExpired && idx === stateIndex;

              return (
                <div key={step.label} className="flex-1 flex flex-col gap-1">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      isPassed
                        ? isVerified
                          ? 'bg-ok'
                          : 'bg-pri'
                        : isExpired
                        ? 'bg-bad/40'
                        : 'bg-line'
                    }`}
                  />
                </div>
              );
            })}
          </div>

          <div className="flex justify-between text-[10px] font-semibold text-mut tracking-tight">
            {LIFECYCLE_STEPS.map((step, idx) => {
              const isCurrent = !isExpired && idx === stateIndex;
              return (
                <span
                  key={step.label}
                  className={`transition-colors ${
                    isCurrent ? (isVerified ? 'text-ok font-bold' : 'text-pri font-bold') : ''
                  }`}
                >
                  {step.short}
                </span>
              );
            })}
          </div>
        </div>

        {/* Evidence Description */}
        <p className="text-xs text-mut leading-relaxed m-0 min-h-[34px]">
          {evidenceText || 'No evidence attached yet. Connect GitHub repository, submit a proctored assessment, or request authorized mentor sign-off.'}
        </p>
      </div>

      {/* Action footer if available */}
      {actionLabel && onActionClick && (
        <div className="pt-2 border-t border-line/60">
          <button
            type="button"
            onClick={onActionClick}
            className="w-full text-xs font-bold py-2 rounded-xl bg-bg border border-line hover:bg-pri hover:text-white hover:border-pri text-ink transition-colors flex items-center justify-center gap-1.5"
          >
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  );
}
