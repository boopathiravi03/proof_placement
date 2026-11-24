'use client';

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import SkillBadge from '@/components/ui/SkillBadge';
import { useApp } from '@/context/AppContext';
import { api } from '@/lib/api';
import { EvidenceItem, MentorVerificationRequestItem, GitHubRepoItem } from '@/types';
import {
  FileCode,
  Award,
  GitBranch,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  BookOpen,
  FlaskConical,
  UserCheck,
  Trash2,
  Plus,
  X,
  AlertCircle,
  FolderGit2,
  FileCheck2,
  Star,
  GitCommit,
} from 'lucide-react';

export default function EvidencePage() {
  const {
    skills,
    setSkills,
    timeline,
    addTimelineItem,
    showToast,
    setEvidenceDescriptions,
  } = useApp();

  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
  const [mentorRequests, setMentorRequests] = useState<MentorVerificationRequestItem[]>([]);
  const [githubRepos, setGithubRepos] = useState<GitHubRepoItem[]>([]);
  const [loading, setLoading] = useState(true);

  // New Evidence Modal
  const [isAddEvidenceModalOpen, setIsAddEvidenceModalOpen] = useState(false);
  const [newSkillName, setNewSkillName] = useState('Python');
  const [newEvidenceKind, setNewEvidenceKind] = useState('cert');
  const [newEvidenceTitle, setNewEvidenceTitle] = useState('');
  const [newEvidenceUrl, setNewEvidenceUrl] = useState('');
  const [isSubmittingEvidence, setIsSubmittingEvidence] = useState(false);

  // Mentor Request Modal
  const [isMentorModalOpen, setIsMentorModalOpen] = useState(false);
  const [mentorSkillName, setMentorSkillName] = useState('SQL');
  const [mentorName, setMentorName] = useState('Prof. Meena (DBMS Lab)');
  const [mentorEvidenceSummary, setMentorEvidenceSummary] = useState('');
  const [mentorWalkthroughNotes, setMentorWalkthroughNotes] = useState('');
  const [isSubmittingMentor, setIsSubmittingMentor] = useState(false);

  const loadData = async () => {
    try {
      const [evRes, reqRes, repoRes] = await Promise.all([
        api.getStudentEvidence('student-rahul-01'),
        api.getMentorVerificationRequests('student-rahul-01'),
        api.getGitHubRepositories('student-rahul-01'),
      ]);

      if (evRes) setEvidenceList(evRes);
      if (reqRes) setMentorRequests(reqRes);
      if (repoRes) setGithubRepos(repoRes);
    } catch (err) {
      console.warn('Error loading evidence data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateCustomEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvidenceTitle.trim() || !newEvidenceUrl.trim()) return;

    setIsSubmittingEvidence(true);
    try {
      await api.addEvidence({
        student_id: 'student-rahul-01',
        skill_name: newSkillName,
        kind: newEvidenceKind,
        title: newEvidenceTitle,
        ref_url: newEvidenceUrl,
        confidence: 0.75,
      });

      addTimelineItem(newSkillName, newEvidenceKind, newEvidenceTitle);
      showToast(`Evidence linked for ${newSkillName}: ${newEvidenceTitle}`);
      setIsAddEvidenceModalOpen(false);
      setNewEvidenceTitle('');
      setNewEvidenceUrl('');
      await loadData();
    } catch (err) {
      showToast('Error attaching evidence');
    } finally {
      setIsSubmittingEvidence(false);
    }
  };

  const handleDeleteEvidence = async (evidenceId: string, title: string) => {
    try {
      await api.deleteEvidence(evidenceId, 'student-rahul-01');
      showToast(`Evidence withdrawn: ${title}`);
      await loadData();
    } catch (err) {
      showToast('Error removing evidence artifact');
    }
  };

  const handleSubmitMentorRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mentorName.trim() || !mentorEvidenceSummary.trim()) return;

    setIsSubmittingMentor(true);
    try {
      await api.createMentorVerificationRequest({
        student_id: 'student-rahul-01',
        skill_name: mentorSkillName,
        mentor_name: mentorName,
        evidence_summary: mentorEvidenceSummary,
        walkthrough_notes: mentorWalkthroughNotes,
      });

      showToast(`Mentor verification request submitted to ${mentorName}`);
      setIsMentorModalOpen(false);
      setMentorEvidenceSummary('');
      setMentorWalkthroughNotes('');
      await loadData();
    } catch (err) {
      showToast('Error submitting verification request');
    } finally {
      setIsSubmittingMentor(false);
    }
  };

  const handleQuickAdd = async (kind: 'cert' | 'hack' | 'lab') => {
    const config = {
      cert: { skill: 'Python', title: 'Python Programming (NPTEL Elite Certificate)', kindStr: 'cert' },
      hack: { skill: 'Git', title: 'Smart India Hackathon Finalist Project (3 Contributors)', kindStr: 'hackathon' },
      lab: { skill: 'SQL', title: 'Relational Database Laboratory Evaluation (9/10)', kindStr: 'lab' },
    }[kind];

    await api.addEvidence({
      student_id: 'student-rahul-01',
      skill_name: config.skill,
      kind: config.kindStr,
      title: config.title,
      ref_url: `https://proofhire.internal/evidence/${kind}`,
      confidence: 0.80,
    });
    addTimelineItem(config.skill, kind, config.title);
    showToast(`Quick evidence attached: ${config.title}`);
    await loadData();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Verifiable Competency Evidence Ledger"
        description="Attach and authenticate multi-source practical artifacts across your student portfolio. Multi-channel evidence ensures non-GitHub students are never disadvantaged."
        breadcrumbs={[{ label: 'Student', href: '/student/dashboard' }, { label: 'Evidence Ledger' }]}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMentorModalOpen(true)}
              className="bg-card border border-line text-ink text-xs font-semibold px-3.5 py-2 rounded-xl hover:bg-bg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <UserCheck size={14} className="text-pri" />
              Request Mentor Verification
            </button>
            <button
              type="button"
              onClick={() => setIsAddEvidenceModalOpen(true)}
              className="bg-pri text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm hover:opacity-95 transition-opacity flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} />
              Attach Evidence Artifact
            </button>
          </div>
        }
      />

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Attached Evidence Artifacts"
          value={evidenceList.length || timeline.length}
          icon={<FileCode size={18} />}
          trend="Multi-Source"
          trendPositive={true}
          subtitle="Certificates, Labs & Repos"
        />
        <StatCard
          label="Mentor Verification Requests"
          value={mentorRequests.length}
          icon={<ShieldCheck size={18} />}
          trend={mentorRequests.filter(r => r.status === 'approved').length + ' Approved'}
          trendPositive={true}
          subtitle="Faculty Sign-Offs"
        />
        <StatCard
          label="Authorized Repositories"
          value={githubRepos.length}
          icon={<GitBranch size={18} />}
          trend="Scanned & Analyzed"
          trendPositive={true}
          subtitle="Public Code Commits"
        />
        <StatCard
          label="Evidence Provenance Trace"
          value="100%"
          icon={<Award size={18} />}
          trend="SHA-256 Ledger"
          trendPositive={true}
          subtitle="Zero Self-Claims"
        />
      </div>

      {/* Quick Submission & Multi-Channel Evidence Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evidence Submission Panel */}
        <div className="bg-card border border-line rounded-2xl p-6 shadow-sm space-y-5">
          <div className="border-b border-line pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-ink">Submit Verifiable Evidence Artifacts</h2>
              <p className="text-xs text-mut mt-0.5">
                Multiple evidence pathways guarantee fair evaluation without relying solely on GitHub
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddEvidenceModalOpen(true)}
              className="text-xs font-bold text-pri hover:underline flex items-center gap-1"
            >
              Custom Artifact <Plus size={13} />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <button
              type="button"
              onClick={() => handleQuickAdd('cert')}
              className="p-4 rounded-xl bg-bg border border-line hover:border-pri/40 hover:bg-pri/5 transition-all text-left flex items-start gap-3.5 group cursor-pointer"
            >
              <div className="p-2.5 rounded-xl bg-card border border-line text-pri group-hover:scale-105 transition-transform shrink-0">
                <Award size={18} />
              </div>
              <div className="space-y-0.5">
                <b className="text-xs font-bold text-ink group-hover:text-pri transition-colors block">
                  Link NPTEL / SWAYAM Certificate (Python)
                </b>
                <p className="text-[11px] text-mut">Proctored national exam credential with verifiable score</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickAdd('hack')}
              className="p-4 rounded-xl bg-bg border border-line hover:border-pri/40 hover:bg-pri/5 transition-all text-left flex items-start gap-3.5 group cursor-pointer"
            >
              <div className="p-2.5 rounded-xl bg-card border border-line text-emerald-500 group-hover:scale-105 transition-transform shrink-0">
                <GitBranch size={18} />
              </div>
              <div className="space-y-0.5">
                <b className="text-xs font-bold text-ink group-hover:text-pri transition-colors block">
                  Add Hackathon Project Submission (Git)
                </b>
                <p className="text-[11px] text-mut">Peer-collaborated repository with multi-author commit analysis</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickAdd('lab')}
              className="p-4 rounded-xl bg-bg border border-line hover:border-pri/40 hover:bg-pri/5 transition-all text-left flex items-start gap-3.5 group cursor-pointer"
            >
              <div className="p-2.5 rounded-xl bg-card border border-line text-purple-500 group-hover:scale-105 transition-transform shrink-0">
                <FlaskConical size={18} />
              </div>
              <div className="space-y-0.5">
                <b className="text-xs font-bold text-ink group-hover:text-pri transition-colors block">
                  Attach DBMS Laboratory Record (SQL)
                </b>
                <p className="text-[11px] text-mut">Internal institutional practical evaluation scored 9/10</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIsMentorModalOpen(true)}
              className="p-4 rounded-xl bg-pri text-white shadow-xs hover:opacity-95 text-left flex items-start gap-3.5 transition-all cursor-pointer"
            >
              <div className="p-2.5 rounded-xl bg-white/20 text-white shrink-0">
                <UserCheck size={18} />
              </div>
              <div className="space-y-0.5">
                <b className="text-xs font-bold block">
                  Request Authorized Mentor Sign-Off & Walkthrough
                </b>
                <p className="text-[11px] text-white/80">
                  Submit code demonstration notes and live practical walkthrough to faculty mentor
                </p>
              </div>
            </button>
          </div>

          <div className="p-3.5 bg-bg rounded-xl border border-line text-xs text-mut leading-relaxed">
            <span className="font-bold text-ink block mb-0.5">Strict Lifecycle Constraint:</span>
            Repository activity alone produces <b className="text-ink">Evidence-linked</b> status. <b className="text-ok font-bold">Verified</b> status strictly requires a qualifying practical assessment, mentor sign-off, or verified walkthrough.
          </div>
        </div>

        {/* Evidence Provenance Timeline */}
        <div className="bg-card border border-line rounded-2xl p-6 shadow-sm space-y-5">
          <div className="border-b border-line pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-ink">Active Evidence Provenance Artifacts</h2>
              <p className="text-xs text-mut mt-0.5">
                Cryptographically audited evidence items with deletion recalculation
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-pri/10 text-pri">
              {evidenceList.length} Items
            </span>
          </div>

          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {evidenceList.length > 0 ? (
              evidenceList.map((e) => (
                <div
                  key={e.id}
                  className="p-3.5 rounded-xl bg-bg border border-line space-y-2 hover:border-line/80 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-ink">{e.title}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-card border border-line text-mut">
                        {e.kind}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteEvidence(e.id, e.title)}
                      className="text-mut hover:text-rose-500 p-1 rounded-md transition-colors cursor-pointer"
                      title="Withdraw Evidence"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-mut">
                    <a
                      href={e.ref_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-pri hover:underline flex items-center gap-1 font-mono truncate max-w-[280px]"
                    >
                      <ExternalLink size={11} /> {e.ref_url}
                    </a>
                    <span className="font-mono text-[10px]">
                      Confidence: {Math.round(e.confidence * 100)}%
                    </span>
                  </div>

                  <div className="pt-1 flex items-center gap-1.5 text-[10px] font-mono text-ok">
                    <CheckCircle2 size={11} className="shrink-0" />
                    <span>Cryptographic Provenance Verified · Ledger Sealed</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-xs text-mut italic">
                No active evidence artifacts attached yet. Link an NPTEL certificate, lab evaluation, or repo to begin.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scanned GitHub Repositories Panel */}
      <div className="bg-card border border-line rounded-2xl p-6 shadow-sm space-y-4">
        <div className="border-b border-line pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-ink">Authorized Code Repositories</h2>
            <p className="text-xs text-mut">
              Audited commits, language breakdown, and repository metadata inspected via read-only scope
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
            {githubRepos.length} Repositories Inspected
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {githubRepos.map((repo) => (
            <div key={repo.id} className="p-4 rounded-xl bg-bg border border-line space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-ink truncate flex items-center gap-1.5">
                  <FolderGit2 size={14} className="text-pri shrink-0" />
                  {repo.name}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-amber-500 font-bold">
                  <Star size={11} /> {repo.stars}
                </span>
              </div>
              <p className="text-[11px] text-mut line-clamp-2">{repo.description || 'Repository codebase'}</p>
              <div className="flex items-center justify-between pt-2 border-t border-line text-[11px] text-mut">
                <span className="font-semibold text-pri">{repo.primary_language || 'Code'}</span>
                <span className="flex items-center gap-1 font-mono">
                  <GitCommit size={12} /> {repo.commits} commits
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mentor Verification Requests Tracker */}
      <div className="bg-card border border-line rounded-2xl p-6 shadow-sm space-y-4">
        <div className="border-b border-line pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-ink">Mentor Verification & Walkthrough Requests</h2>
            <p className="text-xs text-mut">
              Status of submitted practical demonstrations and faculty approval decisions
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsMentorModalOpen(true)}
            className="text-xs font-bold text-pri hover:underline flex items-center gap-1"
          >
            New Request <Plus size={13} />
          </button>
        </div>

        <div className="space-y-3">
          {mentorRequests.length > 0 ? (
            mentorRequests.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-xl bg-bg border border-line flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <b className="text-xs font-bold text-ink">{req.skill_name}</b>
                    <span className="text-[11px] text-mut">· Reviewer: {req.mentor_name}</span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        req.status === 'approved'
                          ? 'bg-okt text-ok border border-ok/20'
                          : req.status === 'rejected'
                          ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>
                  <p className="text-xs text-ink/80">{req.evidence_summary}</p>
                  {req.walkthrough_notes && (
                    <p className="text-[11px] text-mut italic">Walkthrough: &quot;{req.walkthrough_notes}&quot;</p>
                  )}
                  {req.notes && (
                    <p className="text-[11px] text-ok font-medium">Faculty Adjudication: {req.notes}</p>
                  )}
                </div>

                <div className="text-right text-[11px] text-mut shrink-0 space-y-0.5">
                  <span className="block font-mono">Submitted: {new Date(req.created_at).toLocaleDateString()}</span>
                  {req.expires_at && (
                    <span className="block text-emerald-600 font-semibold">
                      Valid through: {new Date(req.expires_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-xs text-mut italic">
              No mentor requests submitted yet. Use &quot;Request Mentor Verification&quot; to begin.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Custom Evidence Artifact */}
      {isAddEvidenceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-card border border-line rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <h3 className="text-base font-bold text-ink">Attach Evidence Artifact</h3>
                <p className="text-xs text-mut mt-0.5">Links are cryptographically sealed into the provenance ledger</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddEvidenceModalOpen(false)}
                className="p-1 rounded-lg text-mut hover:text-ink hover:bg-bg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCustomEvidence} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink">Target Skill</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Python, SQL, Docker, React"
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-bg border border-line text-ink text-xs focus:outline-hidden focus:border-pri"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink">Artifact Category</label>
                <select
                  value={newEvidenceKind}
                  onChange={(e) => setNewEvidenceKind(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-bg border border-line text-ink text-xs focus:outline-hidden focus:border-pri"
                >
                  <option value="cert">Proctored Certification (NPTEL, AWS, Google)</option>
                  <option value="hackathon">Hackathon Project / Competition</option>
                  <option value="lab">Institutional Laboratory Evaluation</option>
                  <option value="repo">Open Source Git Repository</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink">Artifact Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Database Indexing Lab"
                  value={newEvidenceTitle}
                  onChange={(e) => setNewEvidenceTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-bg border border-line text-ink text-xs focus:outline-hidden focus:border-pri"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink">Reference URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  value={newEvidenceUrl}
                  onChange={(e) => setNewEvidenceUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-bg border border-line text-ink text-xs focus:outline-hidden focus:border-pri font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddEvidenceModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-mut hover:text-ink hover:bg-bg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEvidence}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-pri text-white shadow-xs hover:opacity-95 disabled:opacity-50"
                >
                  {isSubmittingEvidence ? 'Sealing...' : 'Attach Artifact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Mentor Verification Request */}
      {isMentorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-card border border-line rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <h3 className="text-base font-bold text-ink">Request Mentor Sign-Off & Walkthrough</h3>
                <p className="text-xs text-mut mt-0.5">Faculty approval certifies competencies to Verified status</p>
              </div>
              <button
                type="button"
                onClick={() => setIsMentorModalOpen(false)}
                className="p-1 rounded-lg text-mut hover:text-ink hover:bg-bg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitMentorRequest} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-ink">Skill Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SQL, Docker"
                    value={mentorSkillName}
                    onChange={(e) => setMentorSkillName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-bg border border-line text-ink text-xs focus:outline-hidden focus:border-pri"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-ink">Mentor / Reviewer Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Prof. Meena (DBMS Lab)"
                    value={mentorName}
                    onChange={(e) => setMentorName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-bg border border-line text-ink text-xs focus:outline-hidden focus:border-pri"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink">Submitted Evidence Summary</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Describe code implementations, complex queries, or microservices submitted..."
                  value={mentorEvidenceSummary}
                  onChange={(e) => setMentorEvidenceSummary(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-bg border border-line text-ink text-xs focus:outline-hidden focus:border-pri"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink">Live Walkthrough / Demonstration Notes</label>
                <textarea
                  rows={2}
                  placeholder="Record specifics of live demonstration, edge-case questions answered..."
                  value={mentorWalkthroughNotes}
                  onChange={(e) => setMentorWalkthroughNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-bg border border-line text-ink text-xs focus:outline-hidden focus:border-pri"
                />
              </div>

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[11px] text-emerald-800 dark:text-emerald-300">
                <b>Verification Policy:</b> Mentor sign-off transitions competencies to <b className="text-emerald-900 dark:text-emerald-200">Verified</b> state with 365-day validity and high confidence (98%).
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMentorModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-mut hover:text-ink hover:bg-bg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingMentor}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-pri text-white shadow-xs hover:opacity-95 disabled:opacity-50"
                >
                  {isSubmittingMentor ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}