'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import ProgressBar from '@/components/ui/ProgressBar';
import SkillGapBadge from '@/components/student/SkillGapBadge';
import LearningTaskCard from '@/components/student/LearningTaskCard';
import { useApp } from '@/context/AppContext';
import { api } from '@/lib/api';
import {
  DetailedLearningPathResponse,
  DetailedLearningTask,
  LearningProgressResponse,
  RecommendedProjectItem,
} from '@/types';
import {
  BookOpen,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Target,
  Layers,
  ExternalLink,
  AlertTriangle,
  RefreshCw,
  FolderGit2,
  X,
  Send,
  ShieldCheck,
  Award,
  Clock,
} from 'lucide-react';

const TARGET_ROLES = [
  'Backend Developer',
  'Frontend Developer',
  'Full Stack Developer',
  'Python Developer',
  'Java Developer',
  'Data Analyst',
  'Software Engineer',
];

export default function LearningPathPage() {
  const { showToast, addTimelineItem } = useApp();

  const [selectedRole, setSelectedRole] = useState<string>('Backend Developer');
  const [pathData, setPathData] = useState<DetailedLearningPathResponse | null>(null);
  const [progressData, setProgressData] = useState<LearningProgressResponse | null>(null);
  const [projects, setProjects] = useState<RecommendedProjectItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Task Detail & Evidence Submission Modal
  const [activeTask, setActiveTask] = useState<DetailedLearningTask | null>(null);
  const [artifactType, setArtifactType] = useState<string>('repo');
  const [artifactUrl, setArtifactUrl] = useState<string>('');
  const [submissionNotes, setSubmissionNotes] = useState<string>('');
  const [timeLoggedInput, setTimeLoggedInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const loadAll = async (role: string, forceRegen = false) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [lpRes, progRes, projRes] = await Promise.all([
        api.getLearningPath('student-rahul-01', role, forceRegen),
        api.getLearningProgress('student-rahul-01', role),
        api.getRecommendedProjects(role),
      ]);

      if (lpRes) {
        setPathData(lpRes);
      } else {
        setErrorMsg('Unable to reach learning intelligence engine. Please ensure backend is running.');
      }
      if (progRes) setProgressData(progRes);
      if (projRes?.projects) setProjects(projRes.projects);
    } catch {
      setErrorMsg('Failed to load personalized learning roadmap.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll(selectedRole);
  }, [selectedRole]);

  const handleStartTask = async (task: DetailedLearningTask) => {
    const res = await api.updateTaskProgress({
      task_id: task.id,
      student_id: 'student-rahul-01',
      status: 'in_progress',
    });
    if (res?.success) {
      showToast(`Started task: ${task.title}`);
      await loadAll(selectedRole);
    }
  };

  const handleSubmitEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTask || !artifactUrl.trim()) return;
    setIsSubmitting(true);
    try {
      if (timeLoggedInput && Number(timeLoggedInput) > 0) {
        await api.updateTaskProgress({
          task_id: activeTask.id,
          student_id: 'student-rahul-01',
          status: 'in_progress',
          time_spent_minutes: Number(timeLoggedInput),
        });
      }

      const res = await api.submitTaskEvidence({
        task_id: activeTask.id,
        student_id: 'student-rahul-01',
        artifact_type: artifactType,
        artifact_url: artifactUrl.trim(),
        notes: submissionNotes.trim(),
      });

      if (res?.success) {
        addTimelineItem(activeTask.skill, 'Task Evidence', `Submitted deliverable for ${activeTask.title}`);
        showToast(res.message || 'Evidence submitted and linked to competency profile!');
        setActiveTask(null);
        setArtifactUrl('');
        setSubmissionNotes('');
        setTimeLoggedInput('');
        await loadAll(selectedRole);
      } else {
        showToast('Failed to submit evidence.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const gapSummary = pathData?.gap_analysis?.summary;
  const gaps = pathData?.gap_analysis?.gaps || [];
  const tasks = pathData?.tasks || [];

  const completedCount = progressData?.completed_tasks_count ?? tasks.filter((t) => t.completed).length;
  const totalCount = progressData?.total_tasks_count ?? tasks.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Personalized AI Learning Path & Skill-Gap Closure"
        description="Deterministic skill-gap analysis, prerequisite-ordered learning roadmaps, verified resources, and evidence-linked reassessment."
        breadcrumbs={[{ label: 'Student', href: '/student/dashboard' }, { label: 'Learning Path' }]}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadAll(selectedRole, true)}
              className="bg-card border border-line text-ink text-xs font-semibold px-3.5 py-2 rounded-xl hover:bg-bg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw size={14} className="text-pri" />
              Recalculate Gaps
            </button>
            <Link
              href="/student/assessment"
              className="bg-pri text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm hover:opacity-95 transition-opacity flex items-center gap-1.5"
            >
              <Award size={14} />
              Take Reassessment
            </Link>
          </div>
        }
      />

      {/* A. Target Role Selector */}
      <div className="bg-card border border-line rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-ink">Target Job Role</h2>
            <p className="text-xs text-mut">
              Select a target role to analyze real competency, evidence, and assessment records against role requirements
            </p>
          </div>
          <span className="text-[11px] font-mono text-mut bg-bg px-2.5 py-1 rounded-lg border border-line self-start sm:self-auto">
            Engine: {pathData?.recommendation_version || 'v2.0-validated'}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {TARGET_ROLES.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setSelectedRole(role)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedRole === role
                  ? 'bg-pri text-white shadow-xs'
                  : 'bg-bg border border-line text-mut hover:text-ink'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 flex items-center gap-2">
          <AlertTriangle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* B. Skill-Gap Overview KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Role Skills Met"
          value={`${gapSummary?.meets_requirement ?? 0} / ${gapSummary?.total_required_skills ?? 0}`}
          icon={<Target size={18} />}
          trend={`${selectedRole}`}
          trendPositive={(gapSummary?.meets_requirement ?? 0) > 0}
          subtitle="Verified / Sufficient"
        />
        <StatCard
          label="Critical & High Gaps"
          value={(gapSummary?.critical_gaps ?? 0) + (gapSummary?.high_priority_gaps ?? 0)}
          icon={<AlertTriangle size={18} />}
          trend={`${gapSummary?.critical_gaps ?? 0} Critical · ${gapSummary?.high_priority_gaps ?? 0} High`}
          trendPositive={(gapSummary?.critical_gaps ?? 0) === 0}
          subtitle="Prioritized Remediation"
        />
        <StatCard
          label="Evidence / Assessment Needed"
          value={`${gapSummary?.evidence_required ?? 0} Ev · ${gapSummary?.assessment_required ?? 0} Test`}
          icon={<Layers size={18} />}
          trend="Actionable Pathways"
          trendPositive={true}
          subtitle="No Zero-Ability Assumptions"
        />
        <StatCard
          label="Roadmap Progress"
          value={`${progressPct}%`}
          icon={<TrendingUp size={18} />}
          trend={`${completedCount} of ${totalCount} Tasks`}
          trendPositive={completedCount > 0}
          subtitle={
            progressData?.tracked_time_minutes != null
              ? `${progressData.tracked_time_minutes} mins logged`
              : 'Time tracked on submission'
          }
        />
      </div>

      {/* Skill Gap Analysis Breakdown */}
      <div className="bg-card border border-line rounded-2xl p-6 shadow-sm space-y-4">
        <div className="border-b border-line pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-ink">Skill-Gap Diagnostic & Priority Rationale</h2>
            <p className="text-xs text-mut">
              Distinguishes unknown, unassessed, expired, and low-proficiency competencies with deterministic prioritization
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-pri/10 text-pri self-start sm:self-auto">
            {gaps.length} Role Competencies
          </span>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-mut">Analyzing competency records and assessment history...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {gaps.map((g) => (
              <div key={g.skill_name} className="p-4 rounded-xl bg-bg border border-line space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <b className="text-sm font-bold text-ink">{g.skill_name}</b>
                      {g.mandatory && (
                        <span className="text-[10px] font-semibold text-mut">(Mandatory)</span>
                      )}
                    </div>
                    <span className="text-[11px] text-mut block">
                      Current: <b className="text-ink">{g.current_state}</b> ({g.current_proficiency}) → Target:{' '}
                      <b className="text-ink">{g.required_evidence_level}</b> ({g.required_proficiency})
                    </span>
                  </div>
                  <SkillGapBadge priority={g.priority} gapStatus={g.gap_status} />
                </div>
                <p className="text-xs text-ink/90 leading-relaxed">{g.explanation}</p>
                <p className="text-[11px] text-mut font-mono">{g.priority_reason}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* C. Personalized Learning Roadmap */}
      <div className="space-y-4">
        <div className="bg-card border border-line rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-4">
            <div>
              <h2 className="text-base font-bold text-ink">Personalized Learning Roadmap ({selectedRole})</h2>
              <p className="text-xs text-mut">
                Prerequisite-ordered tasks. Completing tasks attaches evidence (Evidence-linked); verification requires assessment or mentor sign-off.
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-okt text-ok border border-ok/20 self-start sm:self-auto">
              {completedCount} / {totalCount} Submitted or Completed
            </span>
          </div>

          <ProgressBar value={progressPct} color="primary" />
        </div>

        {tasks.length > 0 ? (
          <div className="space-y-3">
            {tasks.map((t, idx) => (
              <LearningTaskCard
                key={t.id}
                task={t}
                index={idx}
                onStartTask={handleStartTask}
                onOpenDetails={(task) => setActiveTask(task)}
              />
            ))}
          </div>
        ) : (
          !loading && (
            <div className="p-8 rounded-2xl bg-okt/30 border border-ok/20 text-center space-y-2">
              <CheckCircle2 size={28} className="text-ok mx-auto" />
              <h3 className="text-sm font-bold text-ink">All {selectedRole} Requirements Satisfied!</h3>
              <p className="text-xs text-mut">
                Your verified competencies and assessments meet all requirements for this role. Explore another role or take an advanced assessment.
              </p>
            </div>
          )
        )}
      </div>

      {/* E. Learning Progress & Before/After Reassessment Comparison */}
      {progressData && (
        <div className="bg-card border border-line rounded-2xl p-6 shadow-sm space-y-5">
          <div className="border-b border-line pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-ink">Learning Progress & Readiness Impact</h2>
              <p className="text-xs text-mut">
                Before-and-after assessment trajectory and validated readiness change (no fabricated time metrics)
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="px-3 py-1 rounded-lg bg-bg border border-line text-mut">
                Initial Readiness: {progressData.readiness_before}/100
              </span>
              <span className="px-3 py-1 rounded-lg bg-pri/10 text-pri">
                Current Readiness: {progressData.readiness_current}/100
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-bg border border-line space-y-1.5">
              <b className="text-ok block">Skills Meeting Requirement</b>
              <p className="text-mut">
                {progressData.skills_meeting_requirement.length > 0
                  ? progressData.skills_meeting_requirement.join(', ')
                  : 'None yet — complete evidence & assessments below.'}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-bg border border-line space-y-1.5">
              <b className="text-amber-600 dark:text-amber-400 block">Needing Evidence / Verification</b>
              <p className="text-mut">
                {progressData.skills_needing_verification.length > 0
                  ? progressData.skills_needing_verification.join(', ')
                  : 'None pending.'}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-bg border border-line space-y-1.5">
              <b className="text-ink block">Remaining Gaps</b>
              <p className="text-mut">
                {progressData.remaining_gaps.length > 0
                  ? progressData.remaining_gaps.join(', ')
                  : 'Zero gaps remaining!'}
              </p>
            </div>
          </div>

          {progressData.before_after_assessments.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-ink uppercase tracking-wider">Assessment Performance Trajectory</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {progressData.before_after_assessments.map((a) => (
                  <div key={a.skill} className="p-3.5 rounded-xl bg-bg border border-line flex items-center justify-between">
                    <div>
                      <b className="text-xs font-bold text-ink block">{a.skill}</b>
                      <span className="text-[11px] text-mut">{a.attempts_count} attempt(s)</span>
                    </div>
                    <div className="text-right font-mono text-xs">
                      <span className="text-mut">{a.initial_score_pct}% → </span>
                      <b className="text-pri">{a.latest_score_pct}%</b>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* F. Recommended Practical Projects */}
      {projects.length > 0 && (
        <div className="bg-card border border-line rounded-2xl p-6 shadow-sm space-y-4">
          <div className="border-b border-line pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-ink">Recommended Role Capstone Projects</h2>
              <p className="text-xs text-mut">
                Demonstrates required competencies in practice. Project completion yields Evidence-linked status, not automatic verification.
              </p>
            </div>
            <FolderGit2 size={18} className="text-pri" />
          </div>

          <div className="grid grid-cols-1 gap-4">
            {projects.map((proj) => (
              <div key={proj.title} className="p-5 rounded-2xl bg-bg border border-line space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-ink">{proj.title}</h3>
                  <span className="text-[11px] font-mono text-pri font-semibold">{proj.suggested_technology}</span>
                </div>
                <p className="text-xs text-mut leading-relaxed">{proj.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {proj.skills_covered.map((sk) => (
                    <span key={sk} className="text-[10px] font-bold px-2 py-0.5 rounded bg-card border border-line text-ink">
                      {sk}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-line text-xs">
                  <div>
                    <b className="text-ink block mb-1">Expected Features:</b>
                    <ul className="list-disc list-inside text-mut space-y-0.5">
                      {proj.expected_features.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-1.5">
                    <div>
                      <b className="text-ink block">Deliverables:</b>
                      <p className="text-mut">{proj.deliverables}</p>
                    </div>
                    <div>
                      <b className="text-ink block">Evaluation Criteria:</b>
                      <p className="text-mut">{proj.evaluation_criteria}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* D. Task Detail & Evidence Submission Modal */}
      {activeTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-card border border-line rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-xl space-y-5 my-8">
            <div className="flex items-start justify-between border-b border-line pb-4 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-pri/10 text-pri">
                    {activeTask.skill}
                  </span>
                  <SkillGapBadge priority={activeTask.priority} />
                  <span className="text-[11px] text-mut font-mono flex items-center gap-1">
                    <Clock size={11} /> {activeTask.estimated_minutes} mins · {activeTask.difficulty}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-ink">{activeTask.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveTask(null)}
                className="p-1.5 rounded-lg text-mut hover:text-ink hover:bg-bg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-bg border border-line space-y-1">
                <b className="text-ink block">Learning Objective & Context</b>
                <p className="text-mut leading-relaxed">{activeTask.learning_objective || activeTask.description}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-bg border border-line space-y-1">
                  <b className="text-ink block">Practical Activity</b>
                  <p className="text-mut leading-relaxed">{activeTask.practical_activity}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-bg border border-line space-y-1">
                  <b className="text-ink block">Completion Criteria</b>
                  <p className="text-mut leading-relaxed">{activeTask.completion_criteria}</p>
                </div>
              </div>

              {/* Verified External Resources */}
              {activeTask.resources && activeTask.resources.length > 0 && (
                <div className="space-y-2">
                  <b className="text-ink block">Verified Learning Resources (External Documentation & Practice)</b>
                  <div className="space-y-2">
                    {activeTask.resources.map((res) => (
                      <a
                        key={res.id}
                        href={res.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-3 rounded-xl bg-bg border border-line hover:border-pri/40 flex items-center justify-between gap-2 transition-colors"
                      >
                        <div>
                          <b className="text-ink block">{res.title}</b>
                          <span className="text-[11px] text-mut">
                            {res.provider} · {res.resource_type} · {res.source_label || 'External Verified Resource'}
                          </span>
                        </div>
                        <ExternalLink size={14} className="text-pri shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Evidence Submission Form */}
              <form onSubmit={handleSubmitEvidence} className="pt-3 border-t border-line space-y-3">
                <b className="text-ink block text-sm">Submit Task Deliverable as Evidence</b>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-ink block">Artifact Type</label>
                    <select
                      value={artifactType}
                      onChange={(e) => setArtifactType(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-bg border border-line text-ink"
                    >
                      <option value="repo">GitHub Repository</option>
                      <option value="project_url">Live Project / Gist URL</option>
                      <option value="document">Technical Document / PDF</option>
                      <option value="screenshot">Execution Screenshot URL</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-ink block">Time Spent (Minutes, optional)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 45"
                      value={timeLoggedInput}
                      onChange={(e) => setTimeLoggedInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-bg border border-line text-ink"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-ink block">Artifact URL</label>
                  <input
                    type="url"
                    required
                    placeholder="https://github.com/username/project-repo"
                    value={artifactUrl}
                    onChange={(e) => setArtifactUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-bg border border-line text-ink font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-ink block">Implementation Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Summarize what you built or tested..."
                    value={submissionNotes}
                    onChange={(e) => setSubmissionNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-bg border border-line text-ink"
                  />
                </div>

                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                  <ShieldCheck size={15} className="shrink-0 mt-0.5" />
                  <span>
                    Submitting this deliverable transitions <b>{activeTask.skill}</b> to <b>Evidence-linked</b> and routes it for review. Final <b>Verified</b> status requires passing an authorized assessment or mentor sign-off.
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  {activeTask.recommended_reassessment && (
                    <Link
                      href="/student/assessment"
                      className="text-xs font-bold text-pri hover:underline"
                    >
                      Launch {activeTask.recommended_reassessment} Reassessment →
                    </Link>
                  )}
                  <div className="flex gap-2 ml-auto">
                    <button
                      type="button"
                      onClick={() => setActiveTask(null)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-mut hover:text-ink hover:bg-bg cursor-pointer"
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !artifactUrl.trim()}
                      className="px-5 py-2 rounded-xl text-xs font-bold bg-pri text-white shadow-xs hover:opacity-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Send size={13} />
                      {isSubmitting ? 'Submitting...' : 'Submit Evidence'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
