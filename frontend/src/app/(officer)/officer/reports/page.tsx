'use client';

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import ProgressBar from '@/components/ui/ProgressBar';
import { useApp } from '@/context/AppContext';
import { api } from '@/lib/api';
import {
  FileBarChart,
  Download,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Database,
  TrendingUp,
  Users,
  BookOpen,
  Info,
} from 'lucide-react';

export default function ReportsPage() {
  const { showToast, college } = useApp();
  const collegeId = `COLLEGE-${college}`;

  const [branchFilter, setBranchFilter] = useState('ALL');
  const [reportType, setReportType] = useState('NAAC_NIRF_PLACEMENT');
  const [reportingPeriod, setReportingPeriod] = useState('2025-2026');

  const [overview, setOverview] = useState<any | null>(null);
  const [demand, setDemand] = useState<any | null>(null);
  const [predictive, setPredictive] = useState<any | null>(null);
  const [performance, setPerformance] = useState<any | null>(null);
  const [metricDefs, setMetricDefs] = useState<any[]>([]);
  const [reportsHistory, setReportsHistory] = useState<any[]>([]);
  const [showMetricDefs, setShowMetricDefs] = useState(false);

  const loadData = async () => {
    const [ov, dem, pred, perf, defs, reps] = await Promise.all([
      api.getInstitutionalOverview(collegeId, branchFilter, reportingPeriod),
      api.getIndustrySkillDemand(collegeId),
      api.getPredictiveInsights(collegeId),
      api.getPlacementPerformance(collegeId),
      api.getMetricDefinitions(),
      api.listInstitutionalReports(collegeId),
    ]);
    if (ov) setOverview(ov);
    if (dem) setDemand(dem);
    if (pred) setPredictive(pred);
    if (perf) setPerformance(perf);
    if (defs) setMetricDefs(defs);
    if (reps) setReportsHistory(reps);
  };

  useEffect(() => {
    loadData();
  }, [collegeId, branchFilter, reportingPeriod]);

  const handleGenerateReport = async () => {
    const rep = await api.generateInstitutionalReport({
      college_id: collegeId,
      report_type: reportType,
      reporting_period: reportingPeriod,
      generated_by: 'T&P Officer',
    });
    if (rep) {
      showToast(`Generated ${rep.report_type} report (${rep.reporting_period})`);
      await loadData();
    }
  };

  const kpis = overview?.kpis;
  const dqWarnings = overview?.data_quality_warnings || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Institutional Placement Intelligence & Accreditation Reporting"
        description="Audited cohort analytics, industry skill-demand matching, data-quality checks, early-warning indicators, and traceable NAAC/NIRF report generation."
        breadcrumbs={[{ label: 'Officer' }, { label: 'Intelligence & Reports' }]}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="bg-card border border-line text-ink text-xs font-bold px-3 py-2 rounded-xl"
            >
              <option value="ALL">All Branches</option>
              <option value="CSE">CSE</option>
              <option value="IT">IT</option>
              <option value="ECE">ECE</option>
              <option value="MECH">MECH</option>
            </select>
            <button
              type="button"
              onClick={() => setShowMetricDefs(!showMetricDefs)}
              className="bg-card border border-line text-ink text-xs font-semibold px-3.5 py-2 rounded-xl hover:bg-bg flex items-center gap-1.5 cursor-pointer"
            >
              <Info size={14} className="text-pri" />
              Metric Definitions
            </button>
            <button
              type="button"
              onClick={handleGenerateReport}
              className="bg-pri text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm hover:opacity-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Download size={14} />
              Generate Report
            </button>
          </div>
        }
      />

      {/* Institutional Overview KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Registered Students"
          value={kpis?.total_registered_students ?? 0}
          icon={<Users size={18} />}
          trend={`Period: ${reportingPeriod}`}
          trendPositive={true}
          subtitle={`Branch: ${branchFilter}`}
        />
        <StatCard
          label="Verified Skill Coverage"
          value={`${kpis?.verified_skill_coverage_pct ?? 0}%`}
          icon={<ShieldCheck size={18} />}
          trend={`${kpis?.students_with_verified_skills ?? 0} / ${kpis?.total_registered_students ?? 0} Students`}
          trendPositive={(kpis?.verified_skill_coverage_pct ?? 0) > 0}
          subtitle="Active Non-Expired Proofs"
        />
        <StatCard
          label="Assessment Participation"
          value={`${kpis?.assessment_participation_pct ?? 0}%`}
          icon={<TrendingUp size={18} />}
          trend={`${kpis?.students_completed_assessments ?? 0} Assessed`}
          trendPositive={true}
          subtitle="Adaptive Diagnostic"
        />
        <StatCard
          label="Applications / Selected"
          value={`${kpis?.applications_submitted ?? 0} / ${kpis?.students_selected ?? 0}`}
          icon={<FileBarChart size={18} />}
          trend={`${kpis?.active_campus_drives ?? 0} Active Drives`}
          trendPositive={true}
          subtitle="Observed Drive Outcomes"
        />
      </div>

      {/* Data Quality Warnings */}
      {dqWarnings.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-5 space-y-2.5">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs uppercase tracking-wider">
            <AlertTriangle size={16} />
            Data-Quality Warnings ({dqWarnings.length})
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
            {dqWarnings.map((w: any, idx: number) => (
              <div key={idx} className="p-3 rounded-xl bg-card border border-line flex justify-between items-start gap-2">
                <div>
                  <b className="text-ink block">{w.check_name}</b>
                  <span className="text-[11px] text-mut">{w.description}</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                  w.severity === 'critical' ? 'bg-bt text-bad' : 'bg-amber-500/15 text-amber-600'
                }`}>
                  {w.severity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metric Definitions Drawer */}
      {showMetricDefs && metricDefs.length > 0 && (
        <div className="bg-card border border-line rounded-2xl p-6 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-ink flex items-center gap-2">
            <Database size={16} className="text-pri" />
            Centralized Metric Definition Layer
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {metricDefs.map((m) => (
              <div key={m.metric_key} className="p-3.5 rounded-xl bg-bg border border-line space-y-1">
                <b className="text-ink block">{m.metric_name}</b>
                <p className="text-mut">{m.definition}</p>
                <p className="font-mono text-[10px] text-pri">Formula: {m.calculation_formula}</p>
                <p className="text-[10px] text-mut">Source: {m.data_source} · Owner: {m.data_owner}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Industry Skill-Demand Profiler */}
        <div className="bg-card border border-line rounded-2xl p-6 shadow-sm space-y-4">
          <div className="border-b border-line pb-3">
            <h2 className="text-base font-bold text-ink">Industry Skill-Demand vs Cohort Coverage</h2>
            <p className="text-xs text-mut mt-0.5">
              {demand?.scope_disclaimer || 'Internal authorized job opportunities compared against cohort verified skills.'}
            </p>
          </div>
          <div className="space-y-3">
            {(demand?.approved_skill_demand || []).slice(0, 5).map((d: any) => (
              <div key={d.skill} className="p-3 rounded-xl bg-bg border border-line space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <b className="text-ink">{d.skill}</b>
                  <span className="text-mut font-mono">
                    {d.opportunities_demanding} role(s) · Coverage: {d.cohort_coverage_pct}%
                  </span>
                </div>
                <ProgressBar value={d.cohort_coverage_pct} color={d.cohort_coverage_pct >= 60 ? 'success' : 'primary'} />
              </div>
            ))}
            {demand?.ai_extracted_pending_review?.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300">
                <b>AI-Extracted Suggestions Awaiting Review:</b>{' '}
                {demand.ai_extracted_pending_review.map((p: any) => p.skill).join(', ')}
              </div>
            )}
          </div>
        </div>

        {/* Predictive Insights & Early-Warning Indicators */}
        <div className="bg-card border border-line rounded-2xl p-6 shadow-sm space-y-4">
          <div className="border-b border-line pb-3">
            <h2 className="text-base font-bold text-ink">Governed Early-Warning & Predictive Status</h2>
            <p className="text-xs text-mut mt-0.5">
              {predictive?.model_status_explanation || 'Rule-based support indicators using neutral language.'}
            </p>
          </div>

          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
            {(predictive?.early_warning_indicators || []).slice(0, 6).map((ind: any) => (
              <div key={ind.student_id} className="p-3 rounded-xl bg-bg border border-line flex justify-between items-start gap-2 text-xs">
                <div>
                  <b className="text-ink block">{ind.student_name} ({ind.branch})</b>
                  <span className="text-[11px] text-mut">{ind.explainable_reasons.join(' ')}</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-pri/10 text-pri shrink-0">
                  {ind.status_label}
                </span>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-bg border border-line text-[11px] text-mut">
            <b>Governance Rule:</b> Early-warning indicators guide faculty support and never determine eligibility or rejection.
          </div>
        </div>
      </div>

      {/* Placement Funnel & Accreditation Report Generator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-line rounded-2xl p-6 shadow-sm space-y-4">
          <div className="border-b border-line pb-3">
            <h2 className="text-base font-bold text-ink">Placement Conversion Funnel (Observed)</h2>
            <p className="text-xs text-mut mt-0.5">Explicit denominators displayed for every conversion metric</p>
          </div>
          {performance && (
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-bg border border-line">
                <span className="text-mut block">App → Shortlist Rate</span>
                <b className="text-lg font-black text-ink">{performance.conversions.application_to_shortlist_pct}%</b>
                <span className="text-[11px] text-mut block">
                  ({performance.funnel.shortlisted} / {performance.conversions.application_to_shortlist_denominator})
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-bg border border-line">
                <span className="text-mut block">Shortlist → Selection</span>
                <b className="text-lg font-black text-pri">{performance.conversions.shortlist_to_selection_pct}%</b>
                <span className="text-[11px] text-mut block">
                  ({performance.funnel.selected} / {performance.conversions.shortlist_to_selection_denominator})
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Configurable Accreditation Reports */}
        <div className="bg-card border border-line rounded-2xl p-6 shadow-sm space-y-4">
          <div className="border-b border-line pb-3 flex justify-between items-center gap-2">
            <div>
              <h2 className="text-base font-bold text-ink">NAAC / NIRF Institutional Reports</h2>
              <p className="text-xs text-mut mt-0.5">Traceable reports derived from audited institutional records</p>
            </div>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-bg border border-line text-xs font-bold text-ink"
            >
              <option value="NAAC_NIRF_PLACEMENT">NAAC / NIRF Placement</option>
              <option value="INSTITUTIONAL_SUMMARY">Institutional Summary</option>
              <option value="INTERVENTION_AUDIT">Intervention Audit</option>
            </select>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {reportsHistory.length > 0 ? (
              reportsHistory.map((r) => (
                <div key={r.id} className="p-3 rounded-xl bg-bg border border-line flex items-center justify-between text-xs gap-2">
                  <div>
                    <b className="text-ink block">{r.report_type} ({r.reporting_period})</b>
                    <span className="text-[10px] text-mut">By {r.generated_by} · {r.created_at?.slice(0, 10)}</span>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <a
                      href={`http://localhost:8000/api/intelligence/reports/${r.id}/export-csv?college_id=${collegeId}`}
                      className="px-2.5 py-1 rounded-lg bg-card border border-line text-ink font-bold hover:border-pri/40"
                    >
                      CSV
                    </a>
                    <a
                      href={`http://localhost:8000/api/intelligence/reports/${r.id}/export-pdf?college_id=${collegeId}`}
                      className="px-2.5 py-1 rounded-lg bg-pri text-white font-bold"
                    >
                      PDF
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-mut italic">No reports generated yet. Click &quot;Generate Report&quot; above.</p>
            )}
          </div>

          <p className="text-[11px] text-mut border-t border-line pt-2">
            ProofHire is not officially certified or endorsed by NAAC or NIRF. No synthetic scores or rankings are generated.
          </p>
        </div>
      </div>
    </div>
  );
}
