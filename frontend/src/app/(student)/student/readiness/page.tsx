'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import ProgressBar from '@/components/ui/ProgressBar';
import StatCard from '@/components/ui/StatCard';
import ReadinessRing from '@/components/ui/ReadinessRing';
import SkillBadge from '@/components/ui/SkillBadge';
import { useApp } from '@/context/AppContext';
import { api } from '@/lib/api';
import { ReadinessScore, RoleComparisonResponse } from '@/types';
import {
  Award,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  FileCheck,
  Layers,
  Sparkles,
  BarChart3,
  Compass,
  ArrowRight,
  Code2,
  Cpu,
  Database,
  Users2,
  Lock,
  ChevronRight,
  BookOpen,
} from 'lucide-react';

const TARGET_ROLES = [
  'Backend Developer',
  'Frontend Developer',
  'Full Stack Developer',
  'Data Analyst',
  'Java Developer',
  'Python Developer',
  'AI/ML Engineer',
];

export default function ReadinessPage() {
  const [selectedRole, setSelectedRole] = useState<string>('Backend Developer');
  const [readiness, setReadiness] = useState<any | null>(null);
  const [roleComparison, setRoleComparison] = useState<RoleComparisonResponse | null>(null);
  const [viewTab, setViewTab] = useState<'detail' | 'comparison'>('detail');
  const [loading, setLoading] = useState(true);

  const { skills, mockTestPassed } = useApp();

  const loadData = async (role: string) => {
    try {
      const [readRes, compRes] = await Promise.all([
        api.getReadiness('student-rahul-01', role),
        api.compareTargetRoles('student-rahul-01'),
      ]);

      if (readRes) setReadiness(readRes);
      if (compRes) setRoleComparison(compRes);
    } catch (err) {
      console.warn('Error loading readiness data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedRole);
  }, [selectedRole]);

  const overallScore = readiness?.overall_score ?? 76;
  const confidence = readiness?.confidence_level ? readiness.confidence_level.toUpperCase() : 'MEDIUM';
  const dataCoverage = readiness?.data_coverage_percentage ?? 80;
  const verifiedSkills = readiness?.verified_skills || [];
  const partiallyDemonstrated = readiness?.partially_demonstrated || [];
  const missingSkills = readiness?.missing_skills || [];
  const requiredSkills = readiness?.required_skills || ['Python', 'SQL', 'Git', 'Docker'];

  const breakdown = readiness?.breakdown || {
    verified_competencies: { percentage: 75, weight: 35, weighted_score: 26.3, description: 'Verified skills with authorized mentor sign-off or proctored testing.' },
    coding_assessment: { percentage: 80, weight: 25, weighted_score: 20.0, description: 'Machine-scored performance on programming algorithms and queries.' },
    aptitude: { percentage: 70, weight: 15, weighted_score: 10.5, description: 'Quantitative analysis, logical reasoning, and verbal aptitude.' },
    interview_readiness: { percentage: 65, weight: 15, weighted_score: 9.8, description: 'System design defense and technical communication scores.' },
    role_skill_coverage: { percentage: 100, weight: 10, weighted_score: 10.0, description: 'Overall active footprint across role prerequisites.' },
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Explainable Placement Readiness Intelligence"
        description="Transparent multi-factor preparation telemetry across 7 target job profiles with deterministic weighting, missing data coverage metrics, and cross-role benchmarking."
        breadcrumbs={[{ label: 'Student', href: '/student/dashboard' }, { label: 'Readiness Index' }]}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewTab(viewTab === 'detail' ? 'comparison' : 'detail')}
              className="bg-card border border-line text-ink text-xs font-semibold px-3.5 py-2 rounded-xl hover:bg-bg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Compass size={14} className="text-pri" />
              {viewTab === 'detail' ? 'Compare 7 Roles' : 'Single Role Detail'}
            </button>
            <Link
              href="/student/assessment"
              className="bg-pri text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm hover:opacity-95 transition-opacity flex items-center gap-1.5"
            >
              <Sparkles size={14} />
              Diagnostic Test
            </Link>
          </div>
        }
      />

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Readiness Index"
          value={`${overallScore}/100`}
          icon={<Award size={18} />}
          trend={confidence === 'HIGH' ? 'High Quality Data' : 'Estimated Data'}
          trendPositive={overallScore >= 60}
          subtitle={`Target: ${selectedRole}`}
        />
        <StatCard
          label="Score Confidence Level"
          value={confidence}
          icon={<ShieldCheck size={18} />}
          trend={`${dataCoverage}% Empirical Coverage`}
          trendPositive={confidence !== 'LOW'}
          subtitle="Audit Reliability"
        />
        <StatCard
          label="Strongest Matched Role"
          value={roleComparison?.strongest_role || selectedRole}
          icon={<TrendingUp size={18} />}
          trend={`${roleComparison?.strongest_score || overallScore}/100 Index`}
          trendPositive={true}
          subtitle="Placement Alignment"
        />
        <StatCard
          label="Prerequisites Satisfied"
          value={`${verifiedSkills.length}/${requiredSkills.length}`}
          icon={<Layers size={18} />}
          trend={missingSkills.length === 0 ? 'All Prerequisites Met' : `${missingSkills.length} Skills Missing`}
          trendPositive={missingSkills.length === 0}
          subtitle="Role Compliance"
        />
      </div>

      {/* View Switcher: Single Role Detail vs 7-Role Comparison */}
      {viewTab === 'detail' ? (
        <div className="space-y-6">
          {/* Header and Role Selector */}
          <div className="bg-card border border-line rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-line pb-4">
              <div>
                <h2 className="text-base font-bold text-ink">Role Preparation Matrix</h2>
                <p className="text-xs text-mut mt-0.5">
                  Select a career role to re-benchmark deterministic weights and prerequisite coverage in real time
                </p>
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none self-start lg:self-auto">
                {TARGET_ROLES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSelectedRole(r)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 ${
                      selectedRole === r
                        ? 'bg-pri text-white shadow-xs'
                        : 'bg-bg border border-line text-mut hover:text-ink'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="flex items-center gap-5 p-5 rounded-2xl bg-bg border border-line md:col-span-1">
                <ReadinessRing score={overallScore} size={95} variant="primary" />
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-mut block">Composite Score</span>
                  <span className="text-3xl font-black text-ink">{overallScore}%</span>
                  <span className="text-xs text-mut font-medium block">
                    Confidence: <b className="text-pri">{confidence}</b>
                  </span>
                </div>
              </div>

              <div className="md:col-span-2 text-xs text-mut space-y-2 leading-relaxed bg-bg p-5 rounded-2xl border border-line">
                <p className="font-bold text-ink flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-ok" />
                  Deterministic 5-Factor Formulation
                </p>
                <p>
                  ProofHire computes candidate readiness via 5 explicit weights: Verified Competency (35%), Coding Assessment (25%), Aptitude (15%), Interview Readiness (15%), and Role Skill Coverage (10%).
                </p>
                <p className="text-[11px] font-medium text-ink pt-1">
                  Role Focus: <b className="text-pri">{readiness?.role_description || 'Engineering backend services and databases.'}</b>
                </p>
              </div>
            </div>
          </div>

          {/* 5-Factor Contributing Weights Breakdown */}
          <div className="bg-card border border-line rounded-2xl p-6 shadow-sm space-y-5">
            <div className="border-b border-line pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-ink">Transparent Contributing Factor Breakdown</h2>
                <p className="text-xs text-mut mt-0.5">Component contributions with available empirical data coverage</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-pri/10 text-pri font-mono">
                Model: 35/25/15/15/10
              </span>
            </div>

            <div className="space-y-4">
              {[
                { key: 'verified_competencies', label: 'Verified Technical Competencies', icon: <ShieldCheck size={16} className="text-ok" /> },
                { key: 'coding_assessment', label: 'Coding & Algorithmic Performance', icon: <Code2 size={16} className="text-pri" /> },
                { key: 'aptitude', label: 'Quantitative & Logical Aptitude', icon: <Award size={16} className="text-amber-500" /> },
                { key: 'interview_readiness', label: 'Technical Interview & Communication', icon: <Users2 size={16} className="text-teal-500" /> },
                { key: 'role_skill_coverage', label: 'Role-Specific Skill Footprint', icon: <Layers size={16} className="text-purple-500" /> },
              ].map(({ key, label, icon }) => {
                const item = breakdown[key] || { percentage: 70, weight: 20, weighted_score: 14, description: '' };
                return (
                  <div key={key} className="p-4 rounded-xl bg-bg border border-line space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        {icon}
                        <b className="text-ink">{label}</b>
                        <span className="text-mut text-[11px]">(Weight {item.weight}%)</span>
                      </div>
                      <div className="font-mono text-xs">
                        <span className="text-mut mr-2">Score: {item.percentage}%</span>
                        <b className="font-bold text-pri">+{item.weighted_score} pts</b>
                      </div>
                    </div>
                    <ProgressBar value={item.percentage} color="primary" />
                    <p className="text-[11px] text-mut">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Role Prerequisite Compatibility Cards */}
          <div className="bg-card border border-line rounded-2xl p-6 shadow-sm space-y-5">
            <div className="border-b border-line pb-4">
              <h2 className="text-base font-bold text-ink">Prerequisite Competency Audit for {selectedRole}</h2>
              <p className="text-xs text-mut mt-0.5">Categorized breakdown of required, verified, and missing skillsets</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Verified Skills */}
              <div className="p-4 rounded-xl bg-okt border border-ok/20 space-y-2">
                <span className="text-xs font-bold text-ok flex items-center gap-1.5 uppercase tracking-wider">
                  <CheckCircle2 size={14} /> Verified Prereqs ({verifiedSkills.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {verifiedSkills.length > 0 ? (
                    verifiedSkills.map((sk: string) => (
                      <span key={sk} className="px-2.5 py-1 rounded-lg bg-card text-xs font-bold text-ink border border-ok/30">
                        {sk} ✓
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-mut italic">No prerequisites verified yet.</p>
                  )}
                </div>
              </div>

              {/* Partially Demonstrated */}
              <div className="p-4 rounded-xl bg-pri/5 border border-pri/20 space-y-2">
                <span className="text-xs font-bold text-pri flex items-center gap-1.5 uppercase tracking-wider">
                  <Layers size={14} /> Evidence-Linked ({partiallyDemonstrated.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {partiallyDemonstrated.length > 0 ? (
                    partiallyDemonstrated.map((sk: string) => (
                      <span key={sk} className="px-2.5 py-1 rounded-lg bg-card text-xs font-semibold text-ink border border-pri/20">
                        {sk} •
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-mut italic">No partially demonstrated skills.</p>
                  )}
                </div>
              </div>

              {/* Missing Skills */}
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-2">
                <span className="text-xs font-bold text-rose-600 flex items-center gap-1.5 uppercase tracking-wider">
                  <AlertCircle size={14} /> Missing Prerequisites ({missingSkills.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {missingSkills.length > 0 ? (
                    missingSkills.map((sk: string) => (
                      <span key={sk} className="px-2.5 py-1 rounded-lg bg-card text-xs font-bold text-rose-600 border border-rose-500/30">
                        {sk} ✕
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-ok font-bold">All prerequisites satisfied!</p>
                  )}
                </div>
              </div>
            </div>

            {missingSkills.length > 0 && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <b className="text-amber-800 dark:text-amber-300 font-bold">Remediation Recommendation:</b>
                  <p className="text-mut">Launch targeted diagnostic tests or attach project evidence for missing skills: {missingSkills.join(', ')}.</p>
                </div>
                <Link
                  href="/student/assessment"
                  className="px-4 py-2 rounded-xl bg-pri text-white font-bold text-xs shadow-xs hover:opacity-95 shrink-0"
                >
                  Take Diagnostic Test
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* COMPARISON DASHBOARD: ALL 7 TARGET ROLES */
        <div className="space-y-6">
          <div className="bg-card border border-line rounded-2xl p-6 shadow-sm space-y-4">
            <div className="border-b border-line pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-ink">Multi-Role Placement Readiness Comparison</h2>
                <p className="text-xs text-mut mt-0.5">
                  Side-by-side benchmark across 7 standard placement requisitions derived from actual student competencies
                </p>
              </div>
              {roleComparison && (
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-okt text-ok border border-ok/20 self-start sm:self-auto">
                  Strongest Match: {roleComparison.strongest_role} ({roleComparison.strongest_score}%)
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(roleComparison?.roles_comparison || []).map((r) => {
                const isTop = r.role_name === roleComparison?.strongest_role;
                return (
                  <div
                    key={r.role_name}
                    className={`p-5 rounded-2xl border space-y-3.5 transition-all ${
                      isTop
                        ? 'bg-card border-pri shadow-md ring-2 ring-pri/20'
                        : 'bg-card border-line hover:border-pri/40'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-bold text-ink">{r.role_name}</h3>
                          {isTop && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-pri text-white">
                              Top Match
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-mut line-clamp-1">{r.description}</p>
                      </div>
                      <span className="text-xl font-black text-ink">{r.overall_score}%</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-mut">
                        <span>Readiness Index</span>
                        <span className="font-mono font-bold text-pri">{r.overall_score}/100</span>
                      </div>
                      <ProgressBar value={r.overall_score} color={r.overall_score >= 70 ? 'success' : 'primary'} />
                    </div>

                    <div className="space-y-1 pt-2 border-t border-line text-[11px] text-mut">
                      <div className="flex justify-between">
                        <span>Confidence:</span>
                        <b className="text-ink font-semibold">{r.confidence_level.toUpperCase()}</b>
                      </div>
                      <div className="flex justify-between">
                        <span>Prereqs Met:</span>
                        <b className="text-ink font-semibold">{r.verified_skills.length}/{r.required_skills.length} Skills</b>
                      </div>
                      {r.missing_skills.length > 0 && (
                        <div className="pt-1 text-[11px] text-rose-500 font-medium">
                          Missing: {r.missing_skills.join(', ')}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRole(r.role_name);
                        setViewTab('detail');
                      }}
                      className="w-full py-2 rounded-xl bg-bg border border-line hover:bg-pri/5 text-xs font-bold text-pri transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      Inspect Detailed Formulation <ChevronRight size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Statutory Disclaimer Footnote */}
      <div className="p-4 rounded-xl bg-bg border border-line text-xs text-mut space-y-1">
        <b className="text-ink flex items-center gap-1.5">
          <ShieldCheck size={14} className="text-ok" />
          Statutory Methodological Guarantee
        </b>
        <p className="leading-relaxed">
          The Placement Readiness Index evaluates verifiable competency readiness and preparation telemetry across transparent deterministic weights. It does not claim to predict actual interview selection or corporate hiring probabilities.
        </p>
      </div>
    </div>
  );
}
