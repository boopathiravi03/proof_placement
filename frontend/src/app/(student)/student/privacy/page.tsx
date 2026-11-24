'use client';

import React from 'react';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import ProgressBar from '@/components/ui/ProgressBar';
import { useApp } from '@/context/AppContext';
import { api } from '@/lib/api';
import { ShieldCheck, Lock, Eye, GitBranch, CheckCircle2, AlertTriangle, FileText, Key } from 'lucide-react';

export default function PrivacyPage() {
  const { privacy, setPrivacy, githubConnected, setGithubConnected, showToast } = useApp();

  const toggleOption = (key: 'lc' | 'rec') => {
    const updated = { ...privacy, [key]: !privacy[key] };
    setPrivacy(updated);
    showToast(`Consent directive updated: ${key.toUpperCase()} = ${updated[key] ? 'Active' : 'Disabled'}`);
  };

  const handleRevokeGitHub = async () => {
    setGithubConnected(false);
    showToast('GitHub OAuth tokens revoked pursuant to Digital Personal Data Protection (DPDP) Act.');
    await api.revokeGitHub('student-rahul-01');
  };

  const explainabilityFactors = [
    { label: 'Adaptive SQL Machine Assessment (17/20)', pct: 60, desc: 'Proctored algorithmic diagnostic score' },
    { label: 'Python Backend Repositories (41 Commits)', pct: 25, desc: 'Public commit frequency & consistency' },
    { label: 'DBMS Laboratory Evaluation (9/10)', pct: 15, desc: 'Institutional coursework benchmark' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Privacy & DPDP Governance Console"
        description="Granular student consent controls compliant with the Indian Digital Personal Data Protection (DPDP) Act 2023. Revoke access or withdraw permissions anytime."
        breadcrumbs={[{ label: 'Student', href: '/student/dashboard' }, { label: 'Privacy & DPDP' }]}
      />

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="DPDP Statutory Compliance"
          value="ENFORCED"
          icon={<ShieldCheck size={18} />}
          trend="Indian DPDP 2023"
          trendPositive={true}
          subtitle="Consent-Gated Platform"
        />
        <StatCard
          label="Active Consent Directives"
          value={(privacy.lc ? 1 : 0) + (privacy.rec ? 1 : 0) + (githubConnected ? 1 : 0)}
          icon={<Key size={18} />}
          trend="Revocable Anytime"
          trendPositive={true}
          subtitle="Student-Controlled"
        />
        <StatCard
          label="GitHub OAuth Scope"
          value={githubConnected ? 'Read-Only' : 'Disconnected'}
          icon={<GitBranch size={18} />}
          trend={githubConnected ? 'Public Activity' : 'Zero Access'}
          trendPositive={true}
          subtitle="Zero Write Access"
        />
        <StatCard
          label="Explainable AI Audited"
          value="100%"
          icon={<Eye size={18} />}
          trend="Zero Black Box"
          trendPositive={true}
          subtitle="Deterministic Factors"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Consent Controls */}
        <div className="bg-card border border-line rounded-2xl p-6 shadow-sm space-y-5">
          <div className="border-b border-line pb-4">
            <h2 className="text-base font-bold text-ink">Student Consent Directives</h2>
            <p className="text-xs text-mut mt-0.5">
              Granular access controls governing what data is surfaced to algorithms and corporate recruiters
            </p>
          </div>

          <div className="space-y-3.5">
            <div className="flex items-center justify-between p-4 rounded-xl bg-bg border border-line">
              <div className="space-y-0.5 max-w-sm">
                <b className="text-xs font-bold text-ink block">LeetCode Problem-Solving Telemetry</b>
                <p className="text-[11px] text-mut">Import and verify public algorithmic submission counts (read-only)</p>
              </div>
              <button
                type="button"
                onClick={() => toggleOption('lc')}
                className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                  privacy.lc ? 'bg-pri' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    privacy.lc ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-bg border border-line">
              <div className="space-y-0.5 max-w-sm">
                <b className="text-xs font-bold text-ink block">Approved Recruiter Portal Visibility</b>
                <p className="text-[11px] text-mut">Only verified and evidence-linked competencies are exposed to recruiters</p>
              </div>
              <button
                type="button"
                onClick={() => toggleOption('rec')}
                className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                  privacy.rec ? 'bg-pri' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    privacy.rec ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-bg border border-line">
              <div className="space-y-0.5 max-w-sm">
                <b className="text-xs font-bold text-ink block">GitHub Read-Only OAuth Integration</b>
                <p className="text-[11px] text-mut">
                  {githubConnected
                    ? 'Connected (@rahulk-dev) · Public repo commits and PR analysis'
                    : 'Disconnected · No GitHub access active'}
                </p>
              </div>
              {githubConnected ? (
                <button
                  type="button"
                  onClick={handleRevokeGitHub}
                  className="text-xs font-bold px-3.5 py-1.5 rounded-xl bg-bt text-bad hover:bg-bad hover:text-white transition-colors shrink-0"
                >
                  Revoke Tokens
                </button>
              ) : (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-line text-mut shrink-0">
                  Inactive
                </span>
              )}
            </div>
          </div>

          <div className="p-3.5 bg-bg rounded-xl border border-line text-xs text-mut leading-relaxed">
            <b className="text-ink block mb-0.5">Statutory Right to Withdraw:</b>
            Under Section 6 of the DPDP Act 2023, withdrawing consent will immediately delete synchronized cached tokens without impacting your institutional academic standing.
          </div>
        </div>

        {/* Explainability Breakdown */}
        <div className="bg-card border border-line rounded-2xl p-6 shadow-sm space-y-5">
          <div className="border-b border-line pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-ink">Explainable Placement Decisions</h2>
              <p className="text-xs text-mut mt-0.5">
                Exact algorithmic weights governing your candidate placement rank
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-okt text-ok flex items-center gap-1">
              <CheckCircle2 size={13} /> Transparent Factors
            </span>
          </div>

          <div className="space-y-4 pt-1">
            {explainabilityFactors.map((f) => (
              <div key={f.label} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <div>
                    <span className="font-bold text-ink">{f.label}</span>
                    <span className="text-mut text-[11px] block mt-0.5">{f.desc}</span>
                  </div>
                  <b className="font-mono text-xs text-pri">{f.pct}%</b>
                </div>
                <div className="h-2 w-full bg-bg border border-line rounded-full overflow-hidden flex">
                  <div className="h-full bg-pri rounded-full transition-all duration-500" style={{ width: `${f.pct}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="p-3.5 bg-bg rounded-xl border border-line text-xs text-mut leading-relaxed space-y-1">
            <b className="text-ink block">Right to Explanation:</b>
            <p>
              Students have the irrevocable statutory right to receive human-readable explanations for all algorithmic ranking outcomes. Zero black-box neural scoring is used in placement recommendations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
