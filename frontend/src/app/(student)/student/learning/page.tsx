'use client';

import React from 'react';
import PageHeader from '@/components/ui/PageHeader';
import ProgressBar from '@/components/ui/ProgressBar';
import StatCard from '@/components/ui/StatCard';
import { useApp } from '@/context/AppContext';
import { api } from '@/lib/api';
import { BookOpen, CheckCircle2, Sparkles, TrendingUp, ArrowRight, Clock, Target, Layers } from 'lucide-react';

const TASKS = [
  {
    title: 'Complete 2 Advanced SQL Practice Sets',
    desc: 'Joins, group-by aggregations, and window functions (ROW_NUMBER, RANK). Attaches practice verification evidence.',
    skill: 'SQL',
    estTime: '45 mins',
    impact: '+12% Readiness',
  },
  {
    title: 'Build a Relational Library Database Mini-Project',
    desc: 'Design 3NF schema with foreign key referential integrity constraints. Push to GitHub to create verifiable commit evidence.',
    skill: 'SQL',
    estTime: '2 hours',
    impact: '+18% Readiness',
  },
  {
    title: 'Retake the SQL Proctored Adaptive Machine Assessment',
    desc: 'Score >= 80% to validate mastery. A verified diagnostic score unlocks authorized faculty mentor sign-off.',
    skill: 'SQL',
    estTime: '20 mins',
    impact: 'Final Verification',
  },
];

export default function LearningPathPage() {
  const { tasks, setTasks, showToast, addTimelineItem } = useApp();
  const completedCount = tasks.filter(Boolean).length;
  const progressPct = Math.round((completedCount / TASKS.length) * 100);

  const handleCompleteTask = async (index: number) => {
    const updated = [...tasks];
    updated[index] = 1;
    setTasks(updated);

    const task = TASKS[index];
    addTimelineItem(task.skill, 'Remediation Task', `Completed: ${task.title}`);
    showToast(`Milestone completed: ${task.title}. Evidence updated.`);

    await api.completeTask(`task-remediation-${index + 1}`, 'student-rahul-01');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Personalized Career Learning Path"
        description="Autonomous skill gap remediation plan dynamically calibrated against Acme Tech prerequisites. Every finished milestone yields auditable evidence."
        breadcrumbs={[{ label: 'Student', href: '/student/dashboard' }, { label: 'Learning Path' }]}
      />

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Remediation Goal"
          value="SQL Gap Closure"
          icon={<Target size={18} />}
          trend="Target: Acme Tech"
          trendPositive={true}
          subtitle="Identified from Requisition"
        />
        <StatCard
          label="Track Milestones"
          value={`${completedCount} of 3`}
          icon={<CheckCircle2 size={18} />}
          trend={`${progressPct}% Complete`}
          trendPositive={completedCount > 0}
          subtitle="Evidence-Generating"
        />
        <StatCard
          label="Projected Score Impact"
          value="+30 Pts"
          icon={<TrendingUp size={18} />}
          trend="Reaches 88% Index"
          trendPositive={true}
          subtitle="Target Role Ready"
        />
        <StatCard
          label="Autonomous AI Mentor"
          value="Active"
          icon={<Sparkles size={18} />}
          trend="Real-Time Feedback"
          trendPositive={true}
          subtitle="Adaptive Curriculum"
        />
      </div>

      {/* Progress Header */}
      <div className="bg-card border border-line rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
          <div>
            <h2 className="text-base font-bold text-ink">Remediation Track: SQL Relational Systems</h2>
            <p className="text-xs text-mut mt-0.5">
              Personalized based on 38 of 40 active recruiter openings requiring verified query proficiency
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-okt text-ok border border-ok/20 self-start sm:self-auto">
            {completedCount} / 3 Finished
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="font-semibold text-ink">Remediation Completion</span>
            <span className="font-extrabold text-pri">{progressPct}%</span>
          </div>
          <div className="h-2.5 w-full bg-bg border border-line rounded-full overflow-hidden flex">
            <div
              className="h-full bg-gradient-to-r from-pri to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Task Cards */}
      <div className="space-y-4">
        {TASKS.map((t, i) => {
          const isDone = Boolean(tasks[i]);
          return (
            <div
              key={i}
              className={`p-6 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                isDone
                  ? 'bg-okt/30 border-ok/30'
                  : 'bg-card border-line hover:border-line/80 shadow-xs'
              }`}
            >
              <div className="flex items-start gap-4">
                <span
                  className={`w-10 h-10 rounded-2xl font-black text-sm grid place-items-center shrink-0 border ${
                    isDone
                      ? 'bg-ok text-white border-ok'
                      : 'bg-bg text-mut border-line'
                  }`}
                >
                  {isDone ? '✓' : `0${i + 1}`}
                </span>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-sm text-ink">{t.title}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-bg border border-line text-mut flex items-center gap-1 font-mono">
                      <Clock size={10} />
                      {t.estTime}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-pri/10 text-pri">
                      {t.impact}
                    </span>
                  </div>
                  <p className="text-xs text-mut max-w-2xl leading-relaxed">{t.desc}</p>
                </div>
              </div>

              <div className="shrink-0 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleCompleteTask(i)}
                  disabled={isDone}
                  className={`text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5 ${
                    isDone
                      ? 'bg-okt text-ok border border-ok/20 cursor-default'
                      : 'bg-pri text-white hover:opacity-95 cursor-pointer'
                  }`}
                >
                  {isDone ? (
                    <>
                      <CheckCircle2 size={14} />
                      Milestone Verified
                    </>
                  ) : (
                    'Mark as Completed'
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
