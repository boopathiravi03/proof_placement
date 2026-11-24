'use client';

import React from 'react';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import SkillBadge from '@/components/ui/SkillBadge';
import SkillHeatmap from '@/components/ui/SkillHeatmap';
import { useApp } from '@/context/AppContext';
import { Users, ShieldCheck, TrendingUp, Scale, Download, AlertTriangle, CheckCircle2 } from 'lucide-react';

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
    </div>
  );
}
