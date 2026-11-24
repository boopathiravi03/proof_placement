'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import ProgressBar from '@/components/ui/ProgressBar';
import StatCard from '@/components/ui/StatCard';
import ReadinessRing from '@/components/ui/ReadinessRing';
import { useApp } from '@/context/AppContext';
import { Award, ShieldCheck, CheckCircle2, TrendingUp, AlertCircle, FileCheck, Layers } from 'lucide-react';

const ROLE_REQUIREMENTS: Record<string, string[]> = {
  Backend: ['Python', 'SQL', 'Git', 'Docker'],
  'Data Analyst': ['Python', 'SQL'],
  Frontend: ['Git'],
};

export default function ReadinessPage() {
  const [selectedRole, setSelectedRole] = useState<'Backend' | 'Data Analyst' | 'Frontend'>('Backend');
  const { skills, mockTestPassed } = useApp();

  const req = ROLE_REQUIREMENTS[selectedRole] || ROLE_REQUIREMENTS.Backend;
  const cov = Math.round((100 * req.filter((n) => (skills[n] || 0) >= 2).length) / req.length);
  const ver = Math.round((100 * req.filter((n) => skills[n] === 4).length) / req.length);
  const pa = skills.SQL >= 3 || mockTestPassed ? (skills.SQL === 4 ? 80 : 60) : 0;
  const apt = skills.SQL >= 3 || mockTestPassed ? 70 : 0;
  const iv = skills.SQL >= 3 || mockTestPassed ? 55 : 0;

  const factors = [
    { label: 'Verified Competencies', score: ver, weight: 35, desc: 'Proctored exams and faculty sign-offs' },
    { label: 'Evidence Coverage', score: cov, weight: 20, desc: 'Code repositories and commits linked' },
    { label: 'Practical Machine Assessment', score: pa, weight: 25, desc: 'Live SQL query sandbox & algorithmic tests' },
    { label: 'Technical Aptitude Benchmark', score: apt, weight: 10, desc: 'Logic, data structures, and problem-solving' },
    { label: 'Interview Communication Readiness', score: iv, weight: 10, desc: 'Rubric score from mock evaluations' },
  ];

  const totalScore = Math.round(factors.reduce((acc, f) => acc + (f.score * f.weight) / 100, 0));
  const confidence =
    ver >= 50 && (skills.SQL >= 3 || mockTestPassed)
      ? 'High'
      : skills.SQL >= 3 || mockTestPassed
      ? 'Medium'
      : 'Low';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Explainable Placement Readiness Index"
        description="Transparent multi-factor preparation telemetry across target job profiles with deterministic weighting and zero black-box scoring."
        breadcrumbs={[{ label: 'Student', href: '/student/dashboard' }, { label: 'Readiness Index' }]}
      />

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Readiness Index"
          value={`${totalScore}/100`}
          icon={<Award size={18} />}
          trend={confidence === 'High' ? 'Target Reached' : 'In Progress'}
          trendPositive={totalScore >= 60}
          subtitle={`Profile: ${selectedRole}`}
        />
        <StatCard
          label="Confidence Level"
          value={confidence}
          icon={<ShieldCheck size={18} />}
          trend={skills.SQL >= 3 ? 'Practical Done' : 'Assessment Pending'}
          trendPositive={confidence !== 'Low'}
          subtitle="Audit Reliability"
        />
        <StatCard
          label="Prerequisite Coverage"
          value={`${cov}%`}
          icon={<Layers size={18} />}
          trend={`${req.filter((n) => (skills[n] || 0) >= 2).length}/${req.length} Skills`}
          trendPositive={cov >= 50}
          subtitle="Evidence Attached"
        />
        <StatCard
          label="Practical Machine Score"
          value={`${pa}%`}
          icon={<FileCheck size={18} />}
          trend={pa >= 70 ? 'Proficient' : 'Needs Practice'}
          trendPositive={pa >= 60}
          subtitle="Diagnostic Sandbox"
        />
      </div>

      {/* Header and Role Selector */}
      <div className="bg-card border border-line rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
          <div>
            <h2 className="text-base font-bold text-ink">Role Preparation Matrix</h2>
            <p className="text-xs text-mut mt-0.5">
              Select an employment profile to re-benchmark evidence weights in real-time
            </p>
          </div>
          <div className="flex gap-1.5 bg-bg p-1 rounded-xl border border-line self-start sm:self-auto">
            {(['Backend', 'Data Analyst', 'Frontend'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setSelectedRole(r)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  selectedRole === r ? 'bg-pri text-white shadow-xs' : 'text-mut hover:text-ink'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="flex items-center gap-5 p-4 rounded-xl bg-bg border border-line md:col-span-1">
            <ReadinessRing score={totalScore} size={90} variant="primary" />
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-mut block">Composite Score</span>
              <span className="text-3xl font-black text-ink">{totalScore}%</span>
              <span className="text-xs text-mut font-medium block">
                Confidence: <b className="text-ink">{confidence}</b>
              </span>
            </div>
          </div>

          <div className="md:col-span-2 text-xs text-mut space-y-2 leading-relaxed bg-bg p-4 rounded-xl border border-line">
            <p className="font-bold text-ink flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-ok" />
              Explainable Calculation Guarantee
            </p>
            <p>
              ProofHire computes student readiness via explicit deterministic factor weights: Verified Competencies (35%), Evidence Coverage (20%), Practical Assessment (25%), Aptitude (10%), and Interview Preparedness (10%).
            </p>
            <p className="pt-1 text-[11px] font-medium text-ink">
              Prerequisite Competencies for {selectedRole}: <b className="text-pri">{req.join(', ')}</b>
            </p>
          </div>
        </div>
      </div>

      {/* Contributing Factors Breakdown */}
      <div className="bg-card border border-line rounded-2xl p-6 shadow-sm space-y-5">
        <div className="border-b border-line pb-4">
          <h2 className="text-base font-bold text-ink">Transparent Component Breakdown</h2>
          <p className="text-xs text-mut mt-0.5">Component contributions to the final readiness aggregate</p>
        </div>

        <div className="space-y-5">
          {factors.map((f) => (
            <div key={f.label} className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <div>
                  <span className="font-bold text-ink">{f.label}</span>
                  <span className="text-mut text-[11px] ml-2">({f.desc})</span>
                </div>
                <div className="font-mono">
                  <span className="text-mut text-[11px] mr-2">Weight {f.weight}%</span>
                  <b className="font-bold text-ink">{f.score}%</b>
                </div>
              </div>
              <div className="h-2 w-full bg-bg border border-line rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-pri rounded-full transition-all duration-500"
                  style={{ width: `${f.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
