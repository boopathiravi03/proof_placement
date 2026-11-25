import React from 'react';
import { DetailedLearningTask } from '@/types';
import SkillGapBadge from './SkillGapBadge';
import { Clock, CheckCircle2, ArrowUpRight, Layers, ShieldAlert } from 'lucide-react';

interface LearningTaskCardProps {
  task: DetailedLearningTask;
  index: number;
  onOpenDetails: (task: DetailedLearningTask) => void;
  onStartTask: (task: DetailedLearningTask) => void;
}

const TASK_STATUS_STYLE: Record<string, { label: string; cls: string }> = {
  not_started: { label: 'Not Started', cls: 'bg-bg text-mut border-line' },
  in_progress: { label: 'In Progress', cls: 'bg-pri/10 text-pri border-pri/20' },
  submitted: { label: 'Submitted', cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30' },
  awaiting_review: { label: 'Awaiting Review', cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30' },
  completed: { label: 'Completed', cls: 'bg-okt text-ok border-ok/20' },
  reassessment_required: { label: 'Reassessment Required', cls: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30' },
};

export default function LearningTaskCard({
  task,
  index,
  onOpenDetails,
  onStartTask,
}: LearningTaskCardProps) {
  const statusInfo = TASK_STATUS_STYLE[task.status] || TASK_STATUS_STYLE.not_started;
  const isDone = task.completed || task.status === 'completed' || task.status === 'awaiting_review';

  return (
    <div
      className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isDone ? 'bg-okt/20 border-ok/25' : 'bg-card border-line hover:border-pri/40 shadow-xs'
      }`}
    >
      <div className="flex items-start gap-4">
        <span
          className={`w-10 h-10 rounded-2xl font-black text-sm grid place-items-center shrink-0 border ${
            isDone ? 'bg-ok text-white border-ok' : 'bg-bg text-mut border-line'
          }`}
        >
          {isDone ? '✓' : String(index + 1).padStart(2, '0')}
        </span>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-sm text-ink">{task.title}</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-bg border border-line text-ink">
              {task.skill}
            </span>
            <SkillGapBadge priority={task.priority} />
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusInfo.cls}`}>
              {statusInfo.label}
            </span>
          </div>

          <p className="text-xs text-mut max-w-2xl leading-relaxed">{task.description}</p>

          <div className="flex items-center gap-3 flex-wrap text-[11px] text-mut pt-1">
            <span className="flex items-center gap-1 font-mono">
              <Clock size={12} /> Est. {task.estimated_minutes} mins
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Layers size={12} /> {task.difficulty}
            </span>
            {task.prerequisites && task.prerequisites.length > 0 && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <ShieldAlert size={12} className="text-amber-500" />
                  Prerequisites: <b className="text-ink">{task.prerequisites.join(', ')}</b>
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="shrink-0 flex items-center gap-2 justify-end">
        {task.status === 'not_started' && (
          <button
            type="button"
            onClick={() => onStartTask(task)}
            className="text-xs font-semibold px-3.5 py-2 rounded-xl bg-bg border border-line text-ink hover:border-pri/40 transition-colors cursor-pointer"
          >
            Start Task
          </button>
        )}
        <button
          type="button"
          onClick={() => onOpenDetails(task)}
          className="text-xs font-bold px-4 py-2 rounded-xl bg-pri text-white hover:opacity-95 transition-opacity flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          {isDone ? (
            <>
              <CheckCircle2 size={14} /> View Details
            </>
          ) : (
            <>
              Open & Submit <ArrowUpRight size={14} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
