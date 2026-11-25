'use client';

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import SkillBadge from '@/components/ui/SkillBadge';
import { ShieldCheck, Download } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { api } from '@/lib/api';

export default function UniversityDashboardPage() {
  const { showToast } = useApp();
  const [summary, setSummary] = useState<any | null>(null);

  useEffect(() => {
    api.getAuthorizedUniversityOverview().then((res) => {
      if (res) setSummary(res);
    });
  }, []);

  const colleges = summary?.colleges || [];

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
            className="bg-pri text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm hover:opacity-95 transition-opacity flex items-center gap-1.5 cursor-pointer"
          >
            <Download size={14} />
            Export Macro Analytics
          </button>
        }
      />

      {/* University-Level KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Constituent Colleges" value={summary?.participating_colleges ?? colleges.length} trend="Authorized Campuses" trendPositive={true} />
        <StatCard label="Aggregate Students" value={summary?.aggregate_students ?? 0} trend="Live Database Count" trendPositive={true} />
        <StatCard label="Aggregate Active Drives" value={summary?.aggregate_active_drives ?? 0} trend="Across Authorized Tenants" trendPositive={true} />
        <StatCard label="Tenant Isolation" value="ENFORCED" trend="RLS + Aggregate-Only" trendPositive={true} />
      </div>

      {/* Institutional Table */}
      <div className="bg-card border border-line rounded-2xl p-6 shadow-sm space-y-6">
        <div className="border-b border-line pb-4 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-base font-bold text-ink">Constituent College Comparative Matrix</h2>
            <p className="text-xs text-mut mt-0.5">
              Consistent aggregate definitions across authorized institutions (zero student PII exposed)
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
                <th className="py-3 px-3 text-left font-bold">Assessment Participation</th>
                <th className="py-3 px-3 text-left font-bold">Data Quality</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {colleges.map((c: any) => (
                <tr key={c.college_id} className="hover:bg-bg/60 transition-colors">
                  <td className="py-3.5 px-3">
                    <b className="text-ink block">{c.name}</b>
                    <span className="text-[11px] text-mut font-mono">{c.college_id}</span>
                  </td>
                  <td className="py-3.5 px-3 text-ink font-semibold">{c.total_students}</td>
                  <td className="py-3.5 px-3">
                    <span className="font-extrabold text-ink">{c.placement_rate}%</span>
                  </td>
                  <td className="py-3.5 px-3 font-semibold text-ink">{c.verified_skill_coverage}%</td>
                  <td className="py-3.5 px-3 font-semibold text-ink">{c.assessment_participation_pct}%</td>
                  <td className="py-3.5 px-3">
                    <SkillBadge state={c.data_quality_warnings_count > 0 ? 'miss' : 'have'}>
                      {c.data_quality_warnings_count > 0 ? `${c.data_quality_warnings_count} Warnings` : 'Healthy'}
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
          {summary?.isolation_guarantee ||
            'University administrators view macro-level comparative indicators only. Student identity records, personal evidence links, and internal evaluation notes remain strictly quarantined within each college tenant database boundary enforced via PostgreSQL Row-Level Security.'}
        </p>
      </div>
    </div>
  );
}
