'use client';

import React from 'react';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import ProgressBar from '@/components/ui/ProgressBar';
import SkillBadge from '@/components/ui/SkillBadge';
import { BarChart3, TrendingUp, ShieldCheck, Download, Award, Scale } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function ComparativeAnalyticsPage() {
  const { showToast } = useApp();

  const handleExportNIRF = () => {
    showToast('University-wide comparative analytics report exported');
  };

  const BRANCH_COMPARISON = [
    { branch: 'Computer Science & Engineering', collegeA: 78, collegeB: 84, collegeC: 71 },
    { branch: 'Information Technology', collegeA: 72, collegeB: 79, collegeC: 66 },
    { branch: 'Electronics & Communication', collegeA: 59, collegeB: 65, collegeC: 54 },
    { branch: 'Mechanical Engineering', collegeA: 52, collegeB: 58, collegeC: 46 },
  ];

  const EQUITY_AUDIT = [
    { dimension: 'Gender Equality (F/M Selection Ratio)', ratio: 0.88, compliant: true, threshold: '>= 0.80' },
    { dimension: 'Demographic Equity (Reserved/General)', ratio: 0.84, compliant: true, threshold: '>= 0.80' },
    { dimension: 'Tier-2 School Intake Placement Velocity', ratio: 0.91, compliant: true, threshold: '>= 0.80' },
    { dimension: 'Assessment Score vs CTC Correlation', ratio: 0.86, compliant: true, threshold: '>= 0.75' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Comparative Analytics & NIRF Benchmarking"
        description="Cross-institutional placement telemetry, demographic parity verification, and evidence-weighted competency growth trajectories."
        breadcrumbs={[{ label: 'University' }, { label: 'Comparative Analytics' }]}
        actions={
          <button
            type="button"
            onClick={handleExportNIRF}
            className="bg-pri text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm hover:opacity-95 transition-opacity flex items-center gap-1.5"
          >
            <Download size={14} />
            Export Comparative Dossier
          </button>
        }
      />

      {/* High-Level Comparison KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Overall Placement" value="67.7%" trend="+5.4% YoY" trendPositive={true} />
        <StatCard label="Median CTC Spread" value="₹7.8 - ₹9.4 LPA" trend="Across Campuses" trendPositive={true} />
        <StatCard label="Fairness Compliance" value="100%" trend="Four-Fifths Rule Satisfied" trendPositive={true} />
        <StatCard label="Average Gap Closure" value="35.6%" trend="Post-Intervention Velocity" trendPositive={true} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Departmental Comparison */}
        <div className="bg-card border border-line rounded-2xl p-6 shadow-sm space-y-5">
          <div className="border-b border-line pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-ink">Placement Rate by Academic Discipline</h2>
              <p className="text-xs text-mut mt-0.5">
                Comparison between College A, College B, and College C
              </p>
            </div>
            <BarChart3 className="text-pri" size={20} />
          </div>

          <div className="space-y-5 pt-1">
            {BRANCH_COMPARISON.map((b) => (
              <div key={b.branch} className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-ink">{b.branch}</span>
                  <span className="font-mono text-[11px] text-mut">
                    A: <b className="text-ink">{b.collegeA}%</b> · B: <b className="text-pri">{b.collegeB}%</b> · C: <b className="text-ink">{b.collegeC}%</b>
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="h-2 w-full bg-bg rounded-full overflow-hidden flex">
                    <div className="h-full bg-slate-400" style={{ width: `${b.collegeA}%` }} />
                  </div>
                  <div className="h-2 w-full bg-bg rounded-full overflow-hidden flex">
                    <div className="h-full bg-pri" style={{ width: `${b.collegeB}%` }} />
                  </div>
                  <div className="h-2 w-full bg-bg rounded-full overflow-hidden flex">
                    <div className="h-full bg-slate-600 dark:bg-slate-500" style={{ width: `${b.collegeC}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 text-[11px] text-mut pt-2 border-t border-line">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> College A</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-pri" /> College B</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-600" /> College C</span>
          </div>
        </div>

        {/* Four-Fifths Fairness Verification */}
        <div className="bg-card border border-line rounded-2xl p-6 shadow-sm space-y-5 flex flex-col justify-between">
          <div>
            <div className="border-b border-line pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-ink">Four-Fifths Algorithmic Fairness Audit</h2>
                <p className="text-xs text-mut mt-0.5">
                  EEOC / AI Ethics fairness compliance (selection ratio must exceed 80%)
                </p>
              </div>
              <Scale className="text-ok" size={20} />
            </div>

            <div className="space-y-4 pt-4">
              {EQUITY_AUDIT.map((eq) => (
                <div key={eq.dimension} className="p-3.5 bg-bg rounded-xl border border-line space-y-1.5">
                  <div className="flex items-center justify-between">
                    <b className="text-xs font-bold text-ink">{eq.dimension}</b>
                    <span className="text-xs font-mono font-bold text-ok">{(eq.ratio * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-mut">
                    <span>Statutory Benchmark: {eq.threshold}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-okt text-ok">
                      Satisfied ✓
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-line text-xs text-mut flex items-start gap-2">
            <ShieldCheck size={16} className="text-ok shrink-0 mt-0.5" />
            <p>
              Independent verification certifies that ProofHire candidate ranking algorithms do not introduce adverse impact or systemic bias across demographic categories.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
