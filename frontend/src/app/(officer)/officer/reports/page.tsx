'use client';

import React from 'react';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import { useApp } from '@/context/AppContext';
import { api } from '@/lib/api';
import { FileBarChart, Download, CheckCircle2, TrendingUp, ShieldCheck } from 'lucide-react';

export default function ReportsPage() {
  const { showToast, college } = useApp();

  const handleExport = async () => {
    showToast('NAAC & NIRF statutory compliance report compiled and exported');
    await api.exportReport(`COLLEGE-${college}`);
  };

  const beforeAfter = [
    { label: 'Baseline Deficiency (Pre-Intervention)', pct: 60, isWeak: true },
    { label: 'Residual Skill Gap (Post-Intervention)', pct: 25, isWeak: false },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Statutory Reports & Accreditation Export"
        description="NAAC, NIRF, and NBA-compliant placement analytics with evidence-linked skill gap closure metrics."
        breadcrumbs={[{ label: 'Officer' }, { label: 'Reports & Export' }]}
        actions={
          <button
            type="button"
            onClick={handleExport}
            className="bg-pri text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm hover:opacity-95 transition-opacity flex items-center gap-1.5"
          >
            <Download size={14} />
            Export Statutory Package
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="NIRF 5.2.1 Placement Rate"
          value="74.2%"
          trend="+8.4% YoY"
          trendPositive={true}
        />
        <StatCard
          label="Median CTC Package"
          value="₹8.5 LPA"
          trend="Audited Offer Slips"
          trendPositive={true}
        />
        <StatCard
          label="Evidence Traceability"
          value="100%"
          trend="Zero Unverified Claims"
          trendPositive={true}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Intervention Effectiveness */}
        <div className="bg-card border border-line rounded-2xl p-6 shadow-sm space-y-5">
          <div className="border-b border-line pb-4">
            <h2 className="text-base font-bold text-ink">Intervention Effectiveness: SQL Gap Closure</h2>
            <p className="text-xs text-mut mt-1">
              CSE batch cohort deficiency before vs. after targeted faculty workshop
            </p>
          </div>

          <div className="space-y-5 pt-1">
            {beforeAfter.map((b) => (
              <div key={b.label} className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-ink">{b.label}</span>
                  <b className={`font-bold ${b.isWeak ? 'text-bad' : 'text-ok'}`}>{b.pct}%</b>
                </div>
                <div className="h-2.5 w-full bg-bg border border-line rounded-full overflow-hidden flex">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      b.isWeak ? 'bg-bad' : 'bg-ok'
                    }`}
                    style={{ width: `${b.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="p-3.5 bg-bg rounded-xl border border-line text-xs text-mut leading-relaxed">
            <p className="font-semibold text-ink mb-1">Pedagogical Outcome:</p>
            Autonomous placement intelligence detected 60% cohort SQL deficiency early in Semester 7. T&P sanctioned an intensive 2-week workshop, resulting in a 35-percentage-point deficiency reduction.
          </div>
        </div>

        {/* Accreditation Export */}
        <div className="bg-card border border-line rounded-2xl p-6 shadow-sm space-y-5 flex flex-col justify-between">
          <div>
            <div className="border-b border-line pb-4">
              <h2 className="text-base font-bold text-ink">Accreditation Data Packages</h2>
              <p className="text-xs text-mut mt-1">
                Standardized exports matching national quality framework parameters
              </p>
            </div>

            <ul className="text-xs text-mut space-y-3 pt-4">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-ok shrink-0 mt-0.5" />
                <div>
                  <b className="text-ink font-semibold">NIRF Criteria 5.2 (Placement & Higher Ed):</b>
                  <p className="text-[11px] mt-0.5">Audited placement counts, median salary calculation, and higher education institution matriculation.</p>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-ok shrink-0 mt-0.5" />
                <div>
                  <b className="text-ink font-semibold">NAAC Criteria 5.2.1:</b>
                  <p className="text-[11px] mt-0.5">Program-wise placement statistics with verifiable employer acceptance letters.</p>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-ok shrink-0 mt-0.5" />
                <div>
                  <b className="text-ink font-semibold">Four-Fifths Rule Equality Audit:</b>
                  <p className="text-[11px] mt-0.5">Algorithmic fairness evaluation report across gender and demographic categories.</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="pt-4 border-t border-line">
            <button
              type="button"
              onClick={handleExport}
              className="w-full bg-pri text-white font-bold text-xs py-3 rounded-xl shadow-sm hover:opacity-95 transition-opacity flex items-center justify-center gap-2"
            >
              <Download size={15} />
              Generate Official Statutory Export (PDF / Excel)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
