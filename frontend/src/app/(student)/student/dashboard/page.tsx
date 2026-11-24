'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import ReadinessRing from '@/components/ui/ReadinessRing';
import StatCard from '@/components/ui/StatCard';
import SkillBadge from '@/components/ui/SkillBadge';
import { useApp } from '@/context/AppContext';
import { api } from '@/lib/api';
import { StudentDashboardSummary, CategorizedSkill, SkillCategory } from '@/types';
import {
  ShieldCheck,
  GitBranch,
  Award,
  Briefcase,
  ChevronRight,
  ExternalLink,
  BookOpen,
  FileText,
  Lock,
  Sparkles,
  CheckCircle2,
  Plus,
  Clock,
  Layers,
  ArrowRight,
  AlertTriangle,
  Code2,
  Database,
  Cpu,
  Wrench,
  Users2,
  Calendar,
  X,
} from 'lucide-react';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  languages: <Code2 size={16} className="text-blue-500" />,
  frameworks: <Layers size={16} className="text-purple-500" />,
  databases: <Database size={16} className="text-emerald-500" />,
  fundamentals: <Cpu size={16} className="text-amber-500" />,
  tools: <Wrench size={16} className="text-slate-500" />,
  soft_skills: <Users2 size={16} className="text-rose-500" />,
};

const CATEGORY_NAMES: Record<string, string> = {
  languages: 'Programming Languages',
  frameworks: 'Frameworks & Libraries',
  databases: 'Databases & Storage',
  fundamentals: 'CS Fundamentals',
  tools: 'Development Tools & DevOps',
  soft_skills: 'Professional & Soft Skills',
};

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

  const [summary, setSummary] = useState<StudentDashboardSummary | null>(null);
  const [categories, setCategories] = useState<Record<string, CategorizedSkill[]>>({});
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>('languages');
  const [loading, setLoading] = useState(true);

  // Claim Skill Modal state
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [claimSkillName, setClaimSkillName] = useState('');
  const [claimCategory, setClaimCategory] = useState<SkillCategory>('languages');
  const [claimProficiency, setClaimProficiency] = useState('Intermediate');
  const [isClaiming, setIsClaiming] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [dashRes, catRes] = await Promise.all([
          api.getStudentDashboardSummary('student-rahul-01'),
          api.getCompetencyCategories('student-rahul-01'),
        ]);

        if (dashRes) {
          setSummary(dashRes);
        }
        if (catRes && catRes.categories) {
          setCategories(catRes.categories);
        }
      } catch (err) {
        console.warn('Failed to load live student data, using local state.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

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
    showToast('GitHub connected! (Demo mode verified, read-only consent recorded)');
    const res = await api.scanGitHub('student-rahul-01', 'rahulk-dev');
    if (res) {
      // Refresh categories
      const catRes = await api.getCompetencyCategories('student-rahul-01');
      if (catRes?.categories) setCategories(catRes.categories);
    }
  };

  const handleRevokeGitHub = async () => {
    setGithubConnected(false);
    setSkills((prev) => ({ ...prev, Python: 0, Git: 0 }));
    setEvidenceDescriptions((prev) => ({ ...prev, Python: '', Git: '' }));
    showToast('GitHub OAuth tokens revoked pursuant to DPDP compliance.');
    await api.revokeGitHub('student-rahul-01');
    const catRes = await api.getCompetencyCategories('student-rahul-01');
    if (catRes?.categories) setCategories(catRes.categories);
  };

  const handleClaimSkillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimSkillName.trim()) return;

    setIsClaiming(true);
    try {
      await api.claimSkill({
        student_id: 'student-rahul-01',
        skill_name: claimSkillName.trim(),
        category: claimCategory,
        proficiency: claimProficiency,
      });

      showToast(`Skill '${claimSkillName}' added in CLAIMED state (Never auto-verified)`);
      setIsClaimModalOpen(false);
      setClaimSkillName('');

      // Refresh categories
      const catRes = await api.getCompetencyCategories('student-rahul-01');
      if (catRes?.categories) setCategories(catRes.categories);
    } catch (err) {
      showToast('Error claiming skill');
    } finally {
      setIsClaiming(false);
    }
  };

  // Readiness calculation
  const overallReadiness = summary?.metrics.overall_readiness ?? Math.min(
    96,
    38 +
      (skills.Python || 0) * 5 +
      (skills.Git || 0) * 3 +
      (skills.SQL === 4 ? 22 : skills.SQL === 3 ? 12 : 0)
  );

  const verifiedCount = summary?.metrics.verified_skill_count ?? Object.values(skills).filter((x) => x === 4).length;
  const evidenceCount = summary?.metrics.evidence_linked_count ?? Object.values(skills).filter((x) => x === 2).length;
  const skillsNeedingAssessment = summary?.metrics.skills_needing_assessment ?? 3;
  const activeLearningTasks = summary?.metrics.active_learning_tasks ?? 2;
  const upcomingPlacementDrives = summary?.metrics.upcoming_placement_drives ?? 3;
  const profileCompletion = summary?.student.profile_completion_percentage ?? 85;

  const currentCategorySkills = categories[activeCategoryTab] || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Talent & Competency Dossier"
        description="Tamper-evident placement intelligence ledger tracking evidence-linked competencies, adaptive assessments, and predictive readiness."
        breadcrumbs={[{ label: 'Student' }, { label: 'Dashboard Overview' }]}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsClaimModalOpen(true)}
              className="bg-card border border-line text-ink text-xs font-semibold px-3.5 py-2 rounded-xl hover:bg-bg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} className="text-pri" />
              Declare Skill
            </button>
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
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-stretch gap-6 md:gap-8 justify-between">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            <ReadinessRing score={overallReadiness} size={120} variant="light" />

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/15 text-white backdrop-blur-xs border border-white/20">
                <Sparkles size={12} className="text-amber-300" />
                Adaptive Predictive Indicator · Profile {profileCompletion}% Complete
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
                      className="text-xs text-white/70 hover:text-white underline underline-offset-4 font-medium transition-colors cursor-pointer"
                    >
                      Revoke Access
                    </button>
                  </div>
                )}
                <span className="text-[11px] text-white/70 flex items-center gap-1">
                  <Lock size={11} /> Read-only scope · Consent revocable anytime under DPDP 2023
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics in Hero */}
          <div className="hidden lg:flex flex-col justify-center border-l border-white/15 pl-8 space-y-3 shrink-0 min-w-[200px]">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/70 block">Target Role Match</span>
              <span className="text-2xl font-black text-white">{overallReadiness}%</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/70 block">Verified Proofs</span>
              <span className="text-xl font-bold text-emerald-300">{verifiedCount} Competencies</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/70 block">Verification Authority</span>
              <span className="text-xs font-semibold text-white/90">Autonomous + Faculty Mentor</span>
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
          trend={`${verifiedCount} Verified`}
          trendPositive={verifiedCount > 0}
          subtitle="Proctored / Mentor"
        />
        <StatCard
          label="Evidence-Linked Skills"
          value={evidenceCount}
          icon={<GitBranch size={18} />}
          trend={githubConnected ? 'GitHub Synced' : 'Action Required'}
          trendPositive={githubConnected}
          subtitle="Commits, Repos & Labs"
        />
        <StatCard
          label="Skills Needing Assessment"
          value={skillsNeedingAssessment}
          icon={<Award size={18} />}
          trend="Diagnostic Pending"
          trendPositive={false}
          subtitle="Adaptive Sandbox"
        />
        <StatCard
          label="Upcoming Drives"
          value={upcomingPlacementDrives}
          icon={<Briefcase size={18} />}
          trend="Acme Tech, Gamma Labs"
          trendPositive={true}
          subtitle="Criteria Checked"
        />
      </div>

      {/* 5-Factor Readiness Overview with Clear Explanations */}
      <div className="bg-card border border-line rounded-2xl p-6 shadow-sm space-y-5">
        <div className="border-b border-line pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-ink">Multi-Factor Placement Readiness Telemetry</h2>
            <p className="text-xs text-mut mt-0.5">
              Deterministic, explainable competency evaluation across 5 operational dimensions
            </p>
          </div>
          <Link
            href="/student/readiness"
            className="text-xs font-bold text-pri hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            Detailed Factor Weights <ChevronRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            {
              title: 'Technical Competency',
              score: summary?.readiness_breakdown.technical_competency.score ?? 78,
              desc: summary?.readiness_breakdown.technical_competency.explanation ?? 'Validated skills across core programming and CS fundamentals.',
            },
            {
              title: 'Aptitude Performance',
              score: summary?.readiness_breakdown.aptitude_performance.score ?? 82,
              desc: summary?.readiness_breakdown.aptitude_performance.explanation ?? 'Quantitative aptitude, logical reasoning, and pattern analysis.',
            },
            {
              title: 'Coding Performance',
              score: summary?.readiness_breakdown.coding_performance.score ?? 74,
              desc: summary?.readiness_breakdown.coding_performance.explanation ?? 'Algorithmic efficiency, time complexity, and edge-case handling.',
            },
            {
              title: 'Interview Readiness',
              score: summary?.readiness_breakdown.interview_readiness.score ?? 68,
              desc: summary?.readiness_breakdown.interview_readiness.explanation ?? 'System design defense and behavioral communication scores.',
            },
            {
              title: 'Evidence Coverage',
              score: summary?.readiness_breakdown.evidence_coverage.score ?? 85,
              desc: summary?.readiness_breakdown.evidence_coverage.explanation ?? 'Ratio of claimed capabilities backed by verifiable repositories or labs.',
            },
          ].map((factor) => (
            <div key={factor.title} className="p-4 rounded-xl bg-bg border border-line space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-ink truncate">{factor.title}</span>
                <span className="font-extrabold text-pri font-mono">{factor.score}%</span>
              </div>
              <div className="h-1.5 w-full bg-card rounded-full overflow-hidden border border-line">
                <div
                  className="h-full bg-pri rounded-full transition-all duration-500"
                  style={{ width: `${factor.score}%` }}
                />
              </div>
              <p className="text-[11px] text-mut leading-tight line-clamp-3">
                {factor.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Categorized Competency Profile (6 Categories) */}
      <div className="bg-card border border-line rounded-2xl p-6 shadow-sm space-y-5">
        <div className="border-b border-line pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-ink">Categorized Competency Profile</h2>
            <p className="text-xs text-mut mt-0.5">
              Verified skills, evidence counts, verification authority, and expiry dates across 6 categories
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsClaimModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pri text-white text-xs font-bold shadow-xs hover:opacity-95 transition-opacity cursor-pointer self-start sm:self-auto"
          >
            <Plus size={14} /> Add Claimed Skill
          </button>
        </div>

        {/* Category Navigation Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-line">
          {Object.entries(CATEGORY_NAMES).map(([key, name]) => {
            const count = (categories[key] || []).length;
            const isActive = activeCategoryTab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveCategoryTab(key)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-t-xl text-xs font-bold transition-all border-b-2 cursor-pointer shrink-0 ${
                  isActive
                    ? 'border-pri text-pri bg-pri/5'
                    : 'border-transparent text-mut hover:text-ink hover:bg-bg'
                }`}
              >
                {CATEGORY_ICONS[key]}
                <span>{name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-pri text-white' : 'bg-line text-mut'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Skills in Active Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {currentCategorySkills.length > 0 ? (
            currentCategorySkills.map((sk) => (
              <div
                key={sk.id || sk.skill_name}
                className="p-4 rounded-xl bg-bg border border-line hover:border-pri/40 transition-all space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-ink">{sk.skill_name}</h3>
                    <span className="text-[11px] text-mut font-medium">Proficiency: {sk.proficiency}</span>
                  </div>
                  <SkillBadge state={sk.state} />
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-[11px] text-mut pt-1 border-t border-line">
                  <div>
                    <span className="text-[10px] text-mut/80 block">Evidence Artifacts</span>
                    <b className="text-ink font-semibold">{sk.evidence_count} attached</b>
                  </div>
                  <div>
                    <span className="text-[10px] text-mut/80 block">Confidence Indicator</span>
                    <b className="text-ink font-semibold">{Math.round((sk.confidence || 0.4) * 100)}%</b>
                  </div>
                </div>

                {sk.verified_by && (
                  <div className="text-[11px] p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                    <span className="font-bold">Verified by:</span> {sk.verified_by}
                    {sk.expires_at && (
                      <span className="block text-[10px] text-emerald-700/80 dark:text-emerald-400">
                        Valid until: {new Date(sk.expires_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="col-span-full py-8 text-center text-xs text-mut italic">
              No skills registered in this category yet. Click &quot;Add Claimed Skill&quot; to declare competencies.
            </div>
          )}
        </div>
      </div>

      {/* Active Learning Tasks & Upcoming Placement Drives */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Learning Tasks */}
        <div className="bg-card border border-line rounded-2xl p-6 shadow-sm space-y-4">
          <div className="border-b border-line pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-ink">Active Career Remediation Tasks</h2>
              <p className="text-xs text-mut">Milestones aligned with upcoming campus placement requirements</p>
            </div>
            <Link href="/student/learning" className="text-xs font-semibold text-pri hover:underline">
              View All Tasks →
            </Link>
          </div>

          <div className="space-y-3">
            {(summary?.active_tasks || [
              { id: 'task-1', title: 'Complete SQL Window Functions Lab', skill: 'SQL', description: 'Practice RANK(), DENSE_RANK() and ROW_NUMBER() in the diagnostic sandbox', completed: false },
              { id: 'task-2', title: 'Containerize Python API with Dockerfile', skill: 'Docker', description: 'Write a multi-stage Docker build and attach repo link as evidence', completed: false },
            ]).map((task) => (
              <div key={task.id} className="p-3.5 rounded-xl bg-bg border border-line flex items-start gap-3">
                <div className="p-2 rounded-lg bg-pri/10 text-pri shrink-0 mt-0.5">
                  <BookOpen size={16} />
                </div>
                <div className="space-y-0.5 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-ink">{task.title}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-card border border-line text-pri">
                      {task.skill}
                    </span>
                  </div>
                  <p className="text-[11px] text-mut">{task.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Placement Drives */}
        <div className="bg-card border border-line rounded-2xl p-6 shadow-sm space-y-4">
          <div className="border-b border-line pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-ink">Upcoming Campus Placement Drives</h2>
              <p className="text-xs text-mut">Automated eligibility evaluation against drive requirements</p>
            </div>
            <Link href="/student/drives" className="text-xs font-semibold text-pri hover:underline">
              Drives Console →
            </Link>
          </div>

          <div className="space-y-3">
            {(summary?.upcoming_drives || [
              { id: 'drive-acme', company_name: 'Acme Tech', role: 'Backend Systems Developer', package_ctc: '₹14 LPA', drive_date: '2026-12-15', required_skills: ['Python', 'SQL', 'Git', 'Docker'], is_eligible: false },
              { id: 'drive-gamma', company_name: 'Gamma Labs', role: 'Associate Software Engineer', package_ctc: '₹11 LPA', drive_date: '2026-12-22', required_skills: ['Python', 'Git'], is_eligible: true },
            ]).map((drive) => (
              <div key={drive.id} className="p-3.5 rounded-xl bg-bg border border-line flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-ink">{drive.company_name}</h3>
                    <span className="text-[11px] font-semibold text-mut">· {drive.role}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-mut">
                    <span className="font-semibold text-ink">{drive.package_ctc}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-mono text-[10px]">
                      <Calendar size={11} /> {drive.drive_date}
                    </span>
                  </div>
                </div>

                <div>
                  {drive.is_eligible ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-okt text-ok border border-ok/20">
                      <CheckCircle2 size={11} /> Eligible
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                      <AlertTriangle size={11} /> Prereq Pending
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Declare Claimed Skill Modal */}
      {isClaimModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-card border border-line rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <h3 className="text-base font-bold text-ink">Declare Competency Skill</h3>
                <p className="text-xs text-mut mt-0.5">Self-claims are strictly recorded as &quot;Claimed&quot;</p>
              </div>
              <button
                type="button"
                onClick={() => setIsClaimModalOpen(false)}
                className="p-1 rounded-lg text-mut hover:text-ink hover:bg-bg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleClaimSkillSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink">Skill Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Redis, Kubernetes, React, GraphQL"
                  value={claimSkillName}
                  onChange={(e) => setClaimSkillName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-bg border border-line text-ink text-xs focus:outline-hidden focus:border-pri"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink">Category</label>
                <select
                  value={claimCategory}
                  onChange={(e) => setClaimCategory(e.target.value as SkillCategory)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-bg border border-line text-ink text-xs focus:outline-hidden focus:border-pri"
                >
                  <option value="languages">Programming Languages</option>
                  <option value="frameworks">Frameworks & Libraries</option>
                  <option value="databases">Databases & Storage</option>
                  <option value="fundamentals">CS Fundamentals</option>
                  <option value="tools">Development Tools & DevOps</option>
                  <option value="soft_skills">Professional & Soft Skills</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink">Self-Reported Proficiency</label>
                <select
                  value={claimProficiency}
                  onChange={(e) => setClaimProficiency(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-bg border border-line text-ink text-xs focus:outline-hidden focus:border-pri"
                >
                  <option value="Beginner">Beginner (Foundations & Syntax)</option>
                  <option value="Intermediate">Intermediate (Project Implementation)</option>
                  <option value="Advanced">Advanced (Production & Optimization)</option>
                </select>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-800 dark:text-amber-300">
                <b>ProofHire Policy:</b> Declared skills start in <b className="text-amber-900 dark:text-amber-200">Claimed</b> state. To reach Evidence-Linked or Verified, you must link practical artifacts, pass proctored assessments, or obtain authorized faculty sign-off.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsClaimModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-mut hover:text-ink hover:bg-bg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isClaiming || !claimSkillName.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-pri text-white shadow-xs hover:opacity-95 transition-opacity disabled:opacity-50"
                >
                  {isClaiming ? 'Saving...' : 'Declare Skill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}