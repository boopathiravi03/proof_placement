'use client';

import React from 'react';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import ReadinessRing from '@/components/ui/ReadinessRing';
import SkillCard from '@/components/ui/SkillCard';
import StatCard from '@/components/ui/StatCard';
import SkillBadge from '@/components/ui/SkillBadge';
import { useApp } from '@/context/AppContext';
import { api } from '@/lib/api';
import {
  ShieldCheck,
  GitBranch,
  Award,
  FileCheck,
  Briefcase,
  ChevronRight,
  ExternalLink,
  BookOpen,
  FileText,
  Lock,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

export default function StudentDashboardPage() {
  const {
    skills,
    setSkills,
    evidenceDescriptions,
    setEvidenceDescriptions,
    githubConnected,
    setGithubConnected,
    addTimelineItem,
    showToast,
    mockTestPassed,
  } = useApp();

  const calculateScore = () => {
    return Math.min(
      96,
      38 +
        (skills.Python || 0) * 5 +
        (skills.Git || 0) * 3 +
        (skills.SQL === 4 ? 22 : skills.SQL === 3 ? 12 : 0)
    );
  };

  const handleConnectGitHub = async () => {
    setGithubConnected(true);
    setSkills((prev) => ({ ...prev, Python: 2, Git: 2 }));
    setEvidenceDescriptions((prev) => ({
      ...prev,
      Python: '3 repositories · 41 commits in api-server',
      Git: 'Commit history and pull request audits across 5 repos',
    }));
    addTimelineItem('Python', 'Commits', '3 repositories · 41 commits in api-server');
    addTimelineItem('Git', 'Commits', 'Commit history and pull requests across 5 repos');
    showToast('GitHub connected! Python & Git transitioned to Evidence-linked state.');
    await api.scanGitHub('student-rahul-01', 'rahulk-dev');
  };

  const handleRevokeGitHub = async () => {
    setGithubConnected(false);
    setSkills((prev) => ({ ...prev, Python: 0, Git: 0 }));
    setEvidenceDescriptions((prev) => ({ ...prev, Python: '', Git: '' }));
    showToast('GitHub OAuth tokens revoked pursuant to DPDP compliance.');
    await api.revokeGitHub('student-rahul-01');
  };

  const isSqlVerified = skills.SQL === 4;
  const verifiedCount = Object.values(skills).filter((x) => x === 4).length;
  const evidenceCount = Object.values(skills).filter((x) => x === 2).length;
  const score = calculateScore();

  // 4 Core skills for Acme Tech
  const acmeRequired = ['Python', 'SQL', 'Git', 'Docker'];
  const acmeVerifiedCount = acmeRequired.filter((sk) => (skills[sk] || 0) >= 2).length;
  const acmeMatchPct = Math.round((acmeVerifiedCount / acmeRequired.length) * 100);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Talent & Competency Dossier"
        description="Tamper-evident placement intelligence ledger tracking evidence-linked competencies, adaptive assessments, and predictive readiness."
        breadcrumbs={[{ label: 'Student' }, { label: 'Dashboard Overview' }]}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/student/resume"
              className="bg-card border border-line text-ink text-xs font-semibold px-3.5 py-2 rounded-xl hover:bg-bg transition-colors flex items-center gap-1.5"
            >
              <FileText size={14} />
              Evidence Resume
            </Link>
            <Link
              href="/student/drives"
              className="bg-pri text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm hover:opacity-95 transition-opacity flex items-center gap-1.5"
            >
              <Briefcase size={14} />
              Campus Drives
            </Link>
          </div>
        }
      />

      {/* Hero Placement Readiness Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e3a8a] to-[#2563eb] text-white rounded-3xl p-6 sm:p-8 shadow-md border border-white/10">
        {/* Subtle geometric pattern overlay */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-stretch gap-6 md:gap-8 justify-between">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            <ReadinessRing score={score} size={120} variant="light" />

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/15 text-white backdrop-blur-xs border border-white/20">
                <Sparkles size={12} className="text-amber-300" />
                Adaptive Predictive Indicator
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Placement Readiness Index
              </h2>
              <p className="text-xs sm:text-sm text-white/80 max-w-lg font-medium leading-relaxed">
                Benchmark for <b className="text-white">Backend Systems Engineer</b> at Acme Tech & affiliated tier-1 recruitment partners.
              </p>

              {/* GitHub OAuth Connection Bar */}
              <div className="pt-2 flex flex-wrap items-center gap-3 justify-center sm:justify-start">
                {!githubConnected ? (
                  <button
                    type="button"
                    onClick={handleConnectGitHub}
                    className="bg-white text-slate-900 font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm hover:bg-slate-100 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <GitBranch size={15} className="text-pri" />
                    Connect GitHub (Read-Only)
                  </button>
                ) : (
                  <div className="flex items-center gap-2.5">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                      <CheckCircle2 size={14} />
                      GitHub Synced: @rahulk-dev
                    </span>
                    <button
                      type="button"
                      onClick={handleRevokeGitHub}
                      className="text-xs text-white/70 hover:text-white underline underline-offset-4 font-medium transition-colors"
                    >
                      Revoke Access
                    </button>
                  </div>
                )}
                <span className="text-[11px] text-white/70 flex items-center gap-1">
                  <Lock size={11} /> Read-only scope · Consent revocable anytime under DPDP
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics in Hero */}
          <div className="hidden lg:flex flex-col justify-center border-l border-white/15 pl-8 space-y-3 shrink-0 min-w-[200px]">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/70 block">Target Role Match</span>
              <span className="text-2xl font-black text-white">{acmeMatchPct}%</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/70 block">Verified Proofs</span>
              <span className="text-xl font-bold text-emerald-300">{verifiedCount} of 4 Skills</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/70 block">Verification Authority</span>
              <span className="text-xs font-semibold text-white/90">Autonomous + T&P Officer</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Verified Competencies"
          value={verifiedCount}
          icon={<ShieldCheck size={18} />}
          trend={`${verifiedCount}/4 Verified`}
          trendPositive={verifiedCount > 0}
          subtitle="Proctored / Mentor"
        />
        <StatCard
          label="Evidence-Linked Skills"
          value={evidenceCount}
          icon={<GitBranch size={18} />}
          trend={githubConnected ? 'GitHub Synced' : 'Action Required'}
          trendPositive={githubConnected}
          subtitle="Commits & PRs"
        />
        <StatCard
          label="Diagnostic Assessment"
          value={mockTestPassed || skills.SQL >= 3 ? 'Completed' : 'Pending'}
          icon={<Award size={18} />}
          trend={skills.SQL >= 4 ? 'Score: 88%' : 'SQL Incomplete'}
          trendPositive={skills.SQL >= 3}
          subtitle="Adaptive Engine"
        />
        <StatCard
          label="Placement Drive Eligibility"
          value={acmeMatchPct >= 50 ? 'Eligible' : 'Needs Prep'}
          icon={<Briefcase size={18} />}
          trend="Acme Tech Drive"
          trendPositive={acmeMatchPct >= 50}
          subtitle="Criteria Met"
        />
      </div>

      {/* Competencies Lifecycle Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-ink">Competency Lifecycle Ledger</h2>
            <p className="text-xs text-mut mt-0.5">
              Strict transition policy: Claimed → Observed → Evidence-linked → Assessed → Verified → Expired
            </p>
          </div>
          <Link
            href="/student/evidence"
            className="text-xs font-semibold text-pri hover:underline flex items-center gap-1"
          >
            Manage Evidence Sources →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {['Python', 'SQL', 'Git', 'Docker'].map((sk) => (
            <SkillCard
              key={sk}
              name={sk}
              stateIndex={skills[sk] || 0}
              evidenceText={evidenceDescriptions[sk]}
              actionLabel={
                (skills[sk] || 0) < 3
                  ? sk === 'SQL'
                    ? 'Take SQL Assessment'
                    : 'Attach Repository Evidence'
                  : 'View Verification Proof'
              }
              onActionClick={() => {
                if (sk === 'SQL' && (skills[sk] || 0) < 3) {
                  window.location.href = '/student/assessment';
                } else {
                  showToast(`Viewing evidence trail for ${sk}`);
                }
              }}
            />
          ))}
        </div>
      </div>

      {/* Acme Tech Skill Gap Analysis */}
      <div className="bg-card border border-line rounded-2xl p-6 shadow-sm space-y-5">
        <div className="border-b border-line pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-ink">Skill Gap Diagnostic: Acme Tech Placement Requisition</h2>
            <p className="text-xs text-mut mt-0.5">
              Requirements matching engine evaluates only evidence-linked and verified student competencies
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-pri/10 text-pri self-start sm:self-auto">
            {acmeVerifiedCount} of {acmeRequired.length} Prerequisites Satisfied
          </span>
        </div>

        <div className="space-y-4">
          {/* Progress Indicator */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-ink">Requisition Competency Fit</span>
              <span className="font-extrabold text-pri">{acmeMatchPct}%</span>
            </div>
            <div className="h-2.5 w-full bg-bg border border-line rounded-full overflow-hidden flex">
              <div
                className="h-full bg-gradient-to-r from-pri to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${acmeMatchPct}%` }}
              />
            </div>
          </div>

          <div className="flex gap-2.5 flex-wrap pt-1">
            {acmeRequired.map((sk) => {
              const hasProof = (skills[sk] || 0) >= 2;
              const isVerif = (skills[sk] || 0) === 4;
              return (
                <SkillBadge key={sk} state={isVerif ? 'have' : hasProof ? 'have' : 'miss'}>
                  {sk} {isVerif ? '✓ Verified' : hasProof ? '• Evidence-Linked' : '✕ Missing Proof'}
                </SkillBadge>
              );
            })}
          </div>

          {!isSqlVerified && (
            <div className="bg-amber-500/10 text-amber-800 dark:text-amber-400 text-xs font-semibold rounded-xl p-4 border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p className="font-bold">SQL Competency Gap Detected:</p>
                <p className="font-normal opacity-90">
                  SQL is currently in Claimed state. 38 of 40 active Acme Tech job positions mandate verified relational query proficiency.
                </p>
              </div>
              <Link
                href="/student/assessment"
                className="bg-pri text-white font-bold text-xs px-4 py-2 rounded-xl shadow-sm hover:opacity-95 transition-opacity shrink-0"
              >
                Launch SQL Assessment
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick Launchpad Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/student/assessment"
          className="group p-5 rounded-2xl bg-card border border-line hover:border-pri/40 shadow-xs hover:shadow-md transition-all flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-xs font-bold text-ink group-hover:text-pri transition-colors flex items-center gap-1.5">
              <Award size={15} className="text-pri" />
              Adaptive Assessment
            </span>
            <p className="text-[11px] text-mut">Proctored real-time diagnostic testing</p>
          </div>
          <ChevronRight size={16} className="text-mut group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          href="/student/learning"
          className="group p-5 rounded-2xl bg-card border border-line hover:border-pri/40 shadow-xs hover:shadow-md transition-all flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-xs font-bold text-ink group-hover:text-pri transition-colors flex items-center gap-1.5">
              <BookOpen size={15} className="text-ok" />
              Career Learning Path
            </span>
            <p className="text-[11px] text-mut">Curated remediation milestones</p>
          </div>
          <ChevronRight size={16} className="text-mut group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          href="/student/drives"
          className="group p-5 rounded-2xl bg-card border border-line hover:border-pri/40 shadow-xs hover:shadow-md transition-all flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-xs font-bold text-ink group-hover:text-pri transition-colors flex items-center gap-1.5">
              <Briefcase size={15} className="text-amber-500" />
              Campus Drives
            </span>
            <p className="text-[11px] text-mut">Review eligibility & application state</p>
          </div>
          <ChevronRight size={16} className="text-mut group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
