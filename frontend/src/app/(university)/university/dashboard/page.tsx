'use client';

import React from 'react';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import SkillBadge from '@/components/ui/SkillBadge';
import { Building2, ShieldCheck, Download, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';

const COLLEGES = [
  { name: 'College A (Apex Institute of Technology)', code: 'COLLEGE-A', placement: 68, coverage: 41, gapClosure: 33, students: 480, flags: 1 },
  { name: 'College B (Beacon College of Engineering)', code: 'COLLEGE-B', placement: 74, coverage: 57, gapClosure: 46, students: 520, flags: 0 },
  { name: 'College C (Crestline Engineering Institute)', code: 'COLLEGE-C', placement: 61, coverage: 35, gapClosure: 28, students: 390, flags: 2 },
];

export default function UniversityDashboardPage() {
  const { showToast } = useApp();

  const handleExportMacro = () => {
    showToast('Multi-college macro benchmarking report exported');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Institutional Multi-College Benchmark"
        description="University governance cockpit. Compare macro-level indicators across constituent colleges while strict Row-Level Security quarantines private student data."
        breadcrumbs={[{ label: 'University' }, { label: 'Institutional Overview' }]}
        actions={
          <button
            type="button"
            onClick={handleExportMacro}
            className="bg-pri text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm hover:opacity-95 transition-opacity flex items-center gap-1.5"
          >
            <Download size={14} />
            Export Macro Analytics
          </button>
        }
      />

      {/* University-Level KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Constituent Colleges" value="3 Campuses" trend="Affiliated Institutions" trendPositive={true} />
        <StatCard label="Total Eligible Students" value="1,390" trend="2026 Graduating Batch" trendPositive={true} />
        <StatCard label="Avg Placement Rate" value="67.7%" trend="+5.2% over last cycle" trendPositive={true} />
        <StatCard label="Total Active Drives" value="18 Companies" trend="Campus Drives Live" trendPositive={true} />
      </div>

      {/* Institutional Table */}
      <div className="bg-card border border-line rounded-2xl p-6 shadow-sm space-y-6">
        <div className="border-b border-line pb-4 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-base font-bold text-ink">Constituent College Comparative Matrix</h2>
            <p className="text-xs text-mut mt-0.5">
              Audited performance metrics across university-affiliated technical institutions
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-okt text-ok flex items-center gap-1">
            <ShieldCheck size={14} /> RLS Tenant Boundary Active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-mut text-xs uppercase tracking-wider">
                <th className="py-3 px-3 text-left font-bold">College Tenant</th>
                <th className="py-3 px-3 text-left font-bold">Students</th>
                <th className="py-3 px-3 text-left font-bold">Placement Rate</th>
                <th className="py-3 px-3 text-left font-bold">Verified Skill Coverage</th>
                <th className="py-3 px-3 text-left font-bold">Skill Gap Closure</th>
                <th className="py-3 px-3 text-left font-bold">Fairness Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {COLLEGES.map((c) => (
                <tr key={c.name} className="hover:bg-bg/60 transition-colors">
                  <td className="py-3.5 px-3">
                    <b className="text-ink block">{c.name}</b>
                    <span className="text-[11px] text-mut font-mono">{c.code}</span>
                  </td>
                  <td className="py-3.5 px-3 text-ink font-semibold">{c.students}</td>
                  <td className="py-3.5 px-3">
                    <span className="font-extrabold text-ink">{c.placement}%</span>
                  </td>
                  <td className="py-3.5 px-3 font-semibold text-ink">{c.coverage}%</td>
                  <td className="py-3.5 px-3 font-semibold text-ink">{c.gapClosure}%</td>
                  <td className="py-3.5 px-3">
                    <SkillBadge state={c.flags ? 'miss' : 'have'}>
                      {c.flags ? `${c.flags} Anomaly Flagged` : 'Audited & Fair'}
                    </SkillBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* RLS Boundary Notice */}
      <div className="p-4 rounded-xl bg-bg border border-line text-xs text-mut leading-relaxed space-y-1">
        <p className="font-bold text-ink flex items-center gap-1.5">
          <ShieldCheck size={16} className="text-pri" />
          Zero Cross-Tenant Leakage Guarantee
        </p>
        <p>
          University administrators view macro-level comparative indicators only. Student identity records, personal evidence links, and internal evaluation notes remain strictly quarantined within each college tenant database boundary enforced via PostgreSQL Row-Level Security.
        </p>
      </div>
    </div>
  );
}
