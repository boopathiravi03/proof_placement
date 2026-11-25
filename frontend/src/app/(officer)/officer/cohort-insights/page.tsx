'use client';

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import SkillBadge from '@/components/ui/SkillBadge';
import SkillHeatmap from '@/components/ui/SkillHeatmap';
import ProgressBar from '@/components/ui/ProgressBar';
import { useApp } from '@/context/AppContext';
import { api } from '@/lib/api';
import { CohortSkillGapsResponse, TrainingInterventionItem } from '@/types';
import { Users, ShieldCheck, TrendingUp, Scale, Download, AlertTriangle, CheckCircle2, Plus, BookOpen, X, UserPlus } from 'lucide-react';

const B0_DATA: Record<string, number[]> = {
  CSE: [62, 48, 18, 12, 40],
  IT: [55, 52, 22, 15, 44],
  ECE: [70, 66, 35, 30, 58],
  MECH: [80, 78, 60, 52, 70],
};
const SKILLS = ['SQL', 'Docker', 'Python', 'Git', 'DSA'];

export default function CohortInsightsPage() {
  const { college, showToast } = useApp();
  const isCollegeA = college === 'A';
  const collegeId = isCollegeA ? 'COLLEGE-A' : 'COLLEGE-B';

  const [targetRole, setTargetRole] = useState<string>('Backend Developer');
  const [cohortGaps, setCohortGaps] = useState<CohortSkillGapsResponse | null>(null);
  const [interventions, setInterventions] = useState<TrainingInterventionItem[]>([]);
  const [isInterventionModalOpen, setIsInterventionModalOpen] = useState(false);
  const [ivTitle, setIvTitle] = useState('');
  const [ivDesc, setIvDesc] = useState('');
  const [ivSkills, setIvSkills] = useState('SQL, REST APIs');

  const loadInterventionData = async () => {
    const [gapsRes, ivRes] = await Promise.all([
      api.getCohortSkillGaps(collegeId, targetRole),
      api.getInterventions(collegeId),
    ]);
    if (gapsRes) setCohortGaps(gapsRes);
    if (ivRes) setInterventions(ivRes);
  };

  useEffect(() => {
    loadInterventionData();
  }, [collegeId, targetRole]);

  const handleCreateIntervention = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ivTitle.trim()) return;
    const skillsArr = ivSkills.split(',').map((s) => s.trim()).filter(Boolean);
    const created = await api.createIntervention({
      college_id: collegeId,
      created_by: 'T&P Officer',
      title: ivTitle.trim(),
      description: ivDesc.trim(),
      target_role: targetRole,
      target_skills: skillsArr,
    });
    if (created) {
      showToast(`Training intervention '${ivTitle}' created for ${targetRole}`);
      setIsInterventionModalOpen(false);
      setIvTitle('');
      setIvDesc('');
      await loadInterventionData();
    }
  };

  const handleAssignSupportStudents = async (interventionId: string) => {
    const studentIds = (cohortGaps?.students_requiring_support || []).map((s) => s.student_id);
    if (studentIds.length === 0) {
      showToast('No students currently flagged for support in this cohort.');
      return;
    }
    const res = await api.assignInterventionStudents(interventionId, {
      college_id: collegeId,
      student_ids: studentIds,
      actor: 'T&P Officer',
    });
    if (res) {
      showToast(`Assigned ${res.assigned_students?.length || studentIds.length} student(s) to intervention`);
      await loadInterventionData();
    }
  };

  const groups = isCollegeA
    ? [
        { name: 'Male', rate: 42 },
        { name: 'Female', rate: 31 },
        { name: 'General', rate: 44 },
        { name: 'Reserved', rate: 29 },
      ]
    : [
        { name: 'Male', rate: 38 },
        { name: 'Female', rate: 37 },
        { name: 'General', rate: 40 },
        { name: 'Reserved', rate: 36 },
      ];

  const maxRate = Math.max(...groups.map((g) => g.rate));

  const handleExportFairness = () => {
    showToast('Four-Fifths demographic fairness certificate exported');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cohort Intelligence & Heatmap"
        description="Batch-wide verified competency distributions, skill deficiency telemetry, and EEOC Four-Fifths algorithmic fairness monitoring."
        breadcrumbs={[{ label: 'Officer' }, { label: 'Cohort Insights' }]}
        actions={
          <button
            type="button"
            onClick={handleExportFairness}
            className="bg-card border border-line text-ink text-xs font-semibold px-4 py-2 rounded-xl hover:bg-bg transition-colors flex items-center gap-1.5"
          >
            <Download size={14} />
            Export Fairness Audit
          </button>
        }
      />

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Predicted Placement Rate"
          value={isCollegeA ? '68%' : '74%'}
          icon={<TrendingUp size={18} />}
          change="+4% vs last cycle"
          isPositive={true}
          subtitle={`College ${college}`}
        />
        <StatCard
          label="Verified Skill Coverage"
          value={isCollegeA ? '41%' : '57%'}
          icon={<ShieldCheck size={18} />}
          change="+9% over baseline"
          isPositive={true}
          subtitle="Evidence-Backed"
        />
        <StatCard
          label="Skill Gap Velocity"
          value={isCollegeA ? '33%' : '46%'}
          icon={<Users size={18} />}
          change={isCollegeA ? 'Needs Intervention' : 'Healthy Velocity'}
          isPositive={!isCollegeA}
          subtitle="Post-Workshop"
        />
        <StatCard
          label="Disparate Impact Ratio"
          value={isCollegeA ? '0.66' : '0.90'}
          icon={<Scale size={18} />}
          change={isCollegeA ? 'Adverse Flag' : 'Compliant'}
          isPositive={!isCollegeA}
          subtitle="Four-Fifths Rule"
        />
      </div>

      {/* Branch-Wise Deficiency Heatmap */}
      <div className="bg-card border border-line rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-line pb-4 flex-wrap gap-2">
          <div>
            <h2 className="text-base font-bold text-ink">Branch-Wise Skill Deficiency Heatmap</h2>
            <p className="text-xs text-mut mt-0.5">
              Percentage of students in each branch lacking verified proficiency (darker hue indicates urgent intervention need)
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-pri/10 text-pri">
            Tenant College {college}
          </span>
        </div>

        <SkillHeatmap
          skills={SKILLS}
          data={
            isCollegeA
              ? B0_DATA
              : Object.fromEntries(
                  Object.entries(B0_DATA).map(([k, v]) => [
                    k,
                    v.map((val) => Math.max(5, Math.round(val * 0.55))),
                  ])
                )
          }
        />
      </div>

      {/* Industry Trend Alert */}
      <div className="bg-amber-500/10 text-amber-800 dark:text-amber-400 text-xs font-semibold rounded-2xl p-4.5 border border-amber-500/20 flex items-start gap-3">
        <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">Autonomous Market Intelligence Alert:</p>
          <p className="font-normal opacity-90 leading-relaxed">
            40% of newly registered enterprise requisitions explicitly mandate Docker & Linux containerization, yet only{' '}
            <b className="font-bold">{isCollegeA ? '10%' : '22%'}</b> of the graduating cohort currently holds verified evidence. The Placement Agent has submitted an intervention proposal to the Approvals Queue.
          </p>
        </div>
      </div>

      {/* Four-Fifths Fairness Monitoring Table */}
      <div className="bg-card border border-line rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-line pb-4 flex-wrap gap-2">
          <div>
            <h2 className="text-base font-bold text-ink">EEOC Four-Fifths Rule Fairness Monitoring</h2>
            <p className="text-xs text-mut mt-0.5">
              Selection ratio of any group relative to highest-performing group must remain above 80% (0.80) to prevent algorithmic adverse impact.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-okt text-ok flex items-center gap-1">
            <CheckCircle2 size={13} /> Algorithmic Sentinel Active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-line text-mut uppercase tracking-wider text-left">
                <th className="py-3 px-3 font-bold">Demographic Group</th>
                <th className="py-3 px-3 font-bold">Selection Rate</th>
                <th className="py-3 px-3 font-bold">Impact Ratio</th>
                <th className="py-3 px-3 font-bold">Visual Equity Meter</th>
                <th className="py-3 px-3 font-bold">Compliance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {groups.map((g) => {
                const ratio = g.rate / maxRate;
                const flagged = ratio < 0.8;
                return (
                  <tr key={g.name} className="hover:bg-bg/60 transition-colors">
                    <td className="py-3.5 px-3 font-bold text-ink">{g.name}</td>
                    <td className="py-3.5 px-3 font-bold text-ink">{g.rate}%</td>
                    <td className="py-3.5 px-3 font-mono font-bold text-xs">{ratio.toFixed(2)}</td>
                    <td className="py-3.5 px-3 min-w-[140px]">
                      <div className="h-2 w-full bg-bg border border-line rounded-full overflow-hidden flex">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            flagged ? 'bg-bad' : 'bg-ok'
                          }`}
                          style={{ width: `${Math.min(100, ratio * 100)}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <SkillBadge state={flagged ? 'miss' : 'have'}>
                        {flagged ? 'Review Flagged' : 'Compliant (>= 0.80)'}
                      </SkillBadge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Phase 5: Cohort Skill-Gap & Training Intervention Dashboard */}
      <div className="bg-card border border-line rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-4">
          <div>
            <h2 className="text-base font-bold text-ink">Cohort Skill-Gap & Training Intervention Engine</h2>
            <p className="text-xs text-mut mt-0.5">
              Aggregate cohort gap diagnostics by target role, student support assignments, and before/after training effectiveness
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-bg border border-line text-xs font-bold text-ink"
            >
              <option value="Backend Developer">Backend Developer</option>
              <option value="Frontend Developer">Frontend Developer</option>
              <option value="Full Stack Developer">Full Stack Developer</option>
              <option value="Data Analyst">Data Analyst</option>
              <option value="Software Engineer">Software Engineer</option>
            </select>
            <button
              type="button"
              onClick={() => setIsInterventionModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-pri text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:opacity-95"
            >
              <Plus size={14} /> Create Training Intervention
            </button>
          </div>
        </div>

        {cohortGaps && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Common Skill Gaps */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-ink uppercase tracking-wider">
                  Most Common Cohort Gaps ({cohortGaps.cohort_size} Students)
                </h3>
                <span className="text-[11px] text-mut">
                  Ready: {cohortGaps.role_competency_distribution.ready} · Developing: {cohortGaps.role_competency_distribution.developing} · Early: {cohortGaps.role_competency_distribution.early_stage}
                </span>
              </div>
              <div className="space-y-2.5">
                {cohortGaps.most_common_gaps.slice(0, 6).map((g) => (
                  <div key={g.skill} className="p-3 rounded-xl bg-bg border border-line space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <b className="text-ink">{g.skill}</b>
                      <span className="font-mono text-mut">
                        {g.students_with_gap} student(s) ({g.gap_percentage}%)
                      </span>
                    </div>
                    <ProgressBar value={g.gap_percentage} color={g.gap_percentage >= 60 ? 'danger' : 'primary'} />
                  </div>
                ))}
              </div>
            </div>

            {/* Students Requiring Additional Support & Recommendations */}
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-ink uppercase tracking-wider">
                  Recommended Cohort Training Actions
                </h3>
                {cohortGaps.training_recommendations.length > 0 ? (
                  <ul className="space-y-1.5 text-xs text-mut">
                    {cohortGaps.training_recommendations.map((rec, i) => (
                      <li key={i} className="p-2.5 rounded-xl bg-bg border border-line flex items-start gap-2">
                        <BookOpen size={14} className="text-pri shrink-0 mt-0.5" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-mut italic">No urgent training gaps detected.</p>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-bold text-ink uppercase tracking-wider">
                  Students Requiring Additional Support ({cohortGaps.students_requiring_support.length})
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {cohortGaps.students_requiring_support.map((st) => (
                    <div key={st.student_id} className="p-3 rounded-xl bg-bg border border-line flex items-center justify-between text-xs">
                      <div>
                        <b className="text-ink block">{st.name} ({st.branch})</b>
                        <span className="text-[11px] text-mut">
                          Focus: {st.focus_skills.join(', ')}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-pri/10 text-pri">
                        {st.skills_meeting_requirement}/{st.total_required} Met
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active Training Interventions & Effectiveness */}
        <div className="space-y-3 pt-2 border-t border-line">
          <h3 className="text-xs font-bold text-ink uppercase tracking-wider">
            Active Training Interventions & Effectiveness
          </h3>
          {interventions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {interventions.map((iv) => (
                <div key={iv.id} className="p-4 rounded-xl bg-bg border border-line space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <b className="text-sm font-bold text-ink block">{iv.title}</b>
                      <span className="text-[11px] text-mut">
                        Role: {iv.target_role} · Skills: {iv.target_skills.join(', ')}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAssignSupportStudents(iv.id)}
                      className="px-2.5 py-1 rounded-lg bg-pri/10 text-pri text-[11px] font-bold hover:bg-pri/20 flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <UserPlus size={12} /> Assign Support Cohort
                    </button>
                  </div>

                  {iv.effectiveness && (
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-line text-[11px] text-mut">
                      <div>
                        <span className="block">Enrolled</span>
                        <b className="text-ink">{iv.effectiveness.enrolled_count} ({iv.effectiveness.completed_count} done)</b>
                      </div>
                      <div>
                        <span className="block">Pre-Training Avg</span>
                        <b className="text-ink">{iv.effectiveness.pre_training_avg_score != null ? `${iv.effectiveness.pre_training_avg_score}%` : 'N/A'}</b>
                      </div>
                      <div>
                        <span className="block">Post-Training Avg</span>
                        <b className="text-pri">{iv.effectiveness.post_training_avg_score != null ? `${iv.effectiveness.post_training_avg_score}%` : 'N/A'}</b>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-mut italic">
              No training interventions created yet for {collegeId}. Click &quot;Create Training Intervention&quot; to launch one.
            </p>
          )}
        </div>
      </div>

      {/* Create Training Intervention Modal */}
      {isInterventionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-card border border-line rounded-3xl p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-base font-bold text-ink">Create Cohort Training Intervention</h3>
              <button
                type="button"
                onClick={() => setIsInterventionModalOpen(false)}
                className="p-1 rounded-lg text-mut hover:text-ink cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateIntervention} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-ink block">Intervention Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SQL & FastAPI Placement Readiness Bootcamp"
                  value={ivTitle}
                  onChange={(e) => setIvTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-bg border border-line text-ink"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-ink block">Target Skills (comma-separated)</label>
                <input
                  type="text"
                  required
                  value={ivSkills}
                  onChange={(e) => setIvSkills(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-bg border border-line text-ink"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-ink block">Description</label>
                <textarea
                  rows={2}
                  value={ivDesc}
                  onChange={(e) => setIvDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-bg border border-line text-ink"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInterventionModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-mut hover:text-ink cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-pri text-white font-bold cursor-pointer"
                >
                  Create Intervention
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
