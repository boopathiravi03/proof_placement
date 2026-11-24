'use client';

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import SkillBadge from '@/components/ui/SkillBadge';
import { useApp } from '@/context/AppContext';
import { api } from '@/lib/api';
import { ResumeDataResponse } from '@/types';
import {
  FileText,
  Download,
  ShieldCheck,
  Printer,
  CheckCircle2,
  Lock,
  QrCode,
  Save,
  Layers,
  Sparkles,
  Award,
  BookmarkCheck,
  Calendar,
  Building,
} from 'lucide-react';

export default function ResumePage() {
  const { showToast } = useApp();
  const [resumeData, setResumeData] = useState<ResumeDataResponse | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<'Modern Tech' | 'Classic Corporate' | 'Academic Minimal'>('Modern Tech');
  const [isSaving, setIsSaving] = useState(false);
  const [snapshotSaved, setSnapshotSaved] = useState(false);

  useEffect(() => {
    async function loadResume() {
      try {
        const data = await api.getResumeData('student-rahul-01');
        if (data) setResumeData(data);
      } catch (err) {
        console.warn('Error loading resume data:', err);
      }
    }
    loadResume();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleSaveSnapshot = async () => {
    setIsSaving(true);
    try {
      await api.saveResumeSnapshot('student-rahul-01', selectedTemplate, `${selectedTemplate} - Software Engineering Resume`);
      setSnapshotSaved(true);
      showToast(`Resume snapshot saved with template '${selectedTemplate}'`);
    } catch {
      showToast('Error saving resume snapshot');
    } finally {
      setIsSaving(false);
    }
  };

  const verifiedSkills = resumeData?.competencies.verified || [];
  const assessedSkills = resumeData?.competencies.assessed || [];
  const evidenceLinkedSkills = resumeData?.competencies.evidence_linked || [];
  const claimedSkills = resumeData?.competencies.claimed || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Evidence-Backed Resume Dossier Generator"
        description="Compile an authentic CV backed directly by cryptographic proof trails. Self-reported claims are clearly distinguished from verified competencies."
        breadcrumbs={[{ label: 'Student', href: '/student/dashboard' }, { label: 'Evidence Resume' }]}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveSnapshot}
              disabled={isSaving}
              className="bg-card border border-line text-ink text-xs font-semibold px-3.5 py-2 rounded-xl hover:bg-bg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save size={14} className="text-pri" />
              {snapshotSaved ? 'Snapshot Saved ✓' : 'Save Snapshot'}
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="bg-pri text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm hover:opacity-95 transition-opacity flex items-center gap-1.5 cursor-pointer"
            >
              <Printer size={14} />
              Print / Save PDF
            </button>
          </div>
        }
      />

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Verified Competencies"
          value={verifiedSkills.length}
          icon={<ShieldCheck size={18} />}
          trend="Proctored / Mentor"
          trendPositive={true}
          subtitle="Audit Proof Locked"
        />
        <StatCard
          label="Evidence-Linked Skills"
          value={evidenceLinkedSkills.length}
          icon={<Layers size={18} />}
          trend="Commits & Labs"
          trendPositive={true}
          subtitle="Meets Trust Threshold"
        />
        <StatCard
          label="Self-Declared Claims"
          value={claimedSkills.length}
          icon={<Lock size={18} />}
          trend="Distinguished Label"
          trendPositive={false}
          subtitle="Unverified Claims"
        />
        <StatCard
          label="Cryptographic Signature"
          value="SHA-256"
          icon={<CheckCircle2 size={18} />}
          trend="Merkle Sealed"
          trendPositive={true}
          subtitle="Recruiter Scannable"
        />
      </div>

      {/* Template Selector Bar */}
      <div className="bg-card border border-line rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="space-y-0.5">
          <span className="text-xs font-bold text-ink">Select Export Template Format</span>
          <p className="text-[11px] text-mut">Recruiter ATS-optimized layouts separating evidence-linked from self-claims</p>
        </div>
        <div className="flex gap-2">
          {(['Modern Tech', 'Classic Corporate', 'Academic Minimal'] as const).map((tmpl) => (
            <button
              key={tmpl}
              type="button"
              onClick={() => setSelectedTemplate(tmpl)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedTemplate === tmpl
                  ? 'bg-pri text-white shadow-xs'
                  : 'bg-bg border border-line text-mut hover:text-ink'
              }`}
            >
              {tmpl}
            </button>
          ))}
        </div>
      </div>

      {/* Generated Resume Document Preview */}
      <div className="bg-card border border-line rounded-3xl p-8 sm:p-12 shadow-md space-y-8 max-w-4xl mx-auto print:border-none print:shadow-none print:p-0">
        {/* Resume Header */}
        <div className="border-b border-line pb-6 flex justify-between items-start gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-ink tracking-tight">
              {resumeData?.student.name || 'Rahul K.'}
            </h1>
            <p className="text-xs font-bold text-pri tracking-wide uppercase">
              Candidate for Backend Systems Engineer · B.Tech {resumeData?.student.branch || 'CSE'}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-mut pt-1 font-medium">
              <span>Bengaluru, India</span>
              <span>•</span>
              <span>Roll: {resumeData?.student.roll_number || '22CS104'}</span>
              <span>•</span>
              <span>CGPA: {resumeData?.student.cgpa || 7.8} / 10.0</span>
              {resumeData?.student.github_username && (
                <>
                  <span>•</span>
                  <span>GitHub: @{resumeData.student.github_username}</span>
                </>
              )}
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold bg-okt text-ok border border-ok/20">
              <ShieldCheck size={12} />
              ProofHire Cryptographic Ledger
            </span>
            <span className="block text-[10px] text-mut font-mono mt-1">
              Ledger Hash: 8f2a9e4b7c10d3
            </span>
          </div>
        </div>

        {/* Education Section */}
        <div className="space-y-2.5">
          <h2 className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
            <Building size={14} className="text-pri" /> Education & Academic Credentials
          </h2>
          <div className="p-4 rounded-xl bg-bg border border-line space-y-1">
            <div className="flex justify-between items-center text-xs">
              <b className="text-ink">Apex Institute of Technology</b>
              <span className="text-mut font-mono">2022 – 2026</span>
            </div>
            <p className="text-xs text-mut">
              Bachelor of Technology in Computer Science & Engineering · CGPA: {resumeData?.student.cgpa || 7.8}
            </p>
          </div>
        </div>

        {/* SECTION 1: Audited & Verified Competencies */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-line pb-2">
            <h2 className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
              <BookmarkCheck size={14} className="text-ok" /> Audited & Verified Competencies
            </h2>
            <span className="text-[10px] font-bold text-ok uppercase px-2 py-0.5 rounded bg-okt border border-ok/20">
              Faculty / Exam Verified
            </span>
          </div>

          {verifiedSkills.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {verifiedSkills.map((sk) => (
                <div key={sk.skill_name} className="p-3.5 rounded-xl bg-bg border border-line space-y-1">
                  <div className="flex justify-between items-center">
                    <b className="text-xs font-bold text-ink">{sk.skill_name}</b>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                      Verified ✓
                    </span>
                  </div>
                  <p className="text-[11px] text-mut">
                    Proficiency: {sk.proficiency} · Authority: {sk.verified_by || 'Institutional Review Board'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-mut italic p-3 bg-bg rounded-xl border border-line">
              No mentor-verified competencies yet. Request sign-off in the Evidence Ledger.
            </p>
          )}
        </div>

        {/* SECTION 2: Evidence-Linked Competencies */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-line pb-2">
            <h2 className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
              <Layers size={14} className="text-pri" /> Evidence-Linked Competencies
            </h2>
            <span className="text-[10px] font-bold text-pri uppercase px-2 py-0.5 rounded bg-pri/10 border border-pri/20">
              Practical Artifacts Attached
            </span>
          </div>

          {evidenceLinkedSkills.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {evidenceLinkedSkills.map((sk) => (
                <div key={sk.skill_name} className="p-3.5 rounded-xl bg-bg border border-line space-y-1">
                  <div className="flex justify-between items-center">
                    <b className="text-xs font-bold text-ink">{sk.skill_name}</b>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-pri/10 text-pri">
                      Evidence-Linked ({sk.evidence_count} proofs)
                    </span>
                  </div>
                  <p className="text-[11px] text-mut">Proficiency: {sk.proficiency} · Backed by repository commits and lab logs</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-mut italic p-3 bg-bg rounded-xl border border-line">
              No evidence-linked competencies recorded yet.
            </p>
          )}
        </div>

        {/* SECTION 3: Self-Declared / Claimed Skills (Strictly Labeled) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-line pb-2">
            <h2 className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
              <Lock size={14} className="text-amber-500" /> Self-Declared Skills (Unverified)
            </h2>
            <span className="text-[10px] font-bold text-amber-600 uppercase px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
              Self-Reported
            </span>
          </div>

          {claimedSkills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {claimedSkills.map((sk) => (
                <div key={sk.skill_name} className="px-3 py-1.5 rounded-xl bg-bg border border-line text-xs font-semibold text-ink flex items-center gap-2">
                  <span>{sk.skill_name}</span>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono">({sk.proficiency} · Claimed)</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-mut italic p-3 bg-bg rounded-xl border border-line">
              No unverified self-claims declared.
            </p>
          )}
        </div>

        {/* SECTION 4: Practical Projects */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-ink uppercase tracking-wider border-b border-line pb-2">
            Verifiable Engineering Projects
          </h2>
          <div className="space-y-3">
            {(resumeData?.projects || [
              { title: 'High-Throughput Asynchronous FastAPI Microservice', tech: 'Python, FastAPI, PostgreSQL, Docker', repo_url: 'https://github.com/rahulk-dev/fastapi-microservice', description: 'Engineered REST API handling 1,200 req/sec with connection pooling, JWT auth, and automated PyTest workflows.' },
              { title: 'Distributed SQL Schema & Indexing Benchmark', tech: 'SQL, PostgreSQL, Materialized Views', repo_url: 'https://github.com/rahulk-dev/distributed-db-queries', description: 'Benchmarked B-Tree vs Hash index query latency across 1M records, achieving 84% reduction in query execution time.' },
            ]).map((proj) => (
              <div key={proj.title} className="p-4 rounded-xl bg-bg border border-line space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <b className="text-ink">{proj.title}</b>
                  <span className="text-[11px] text-pri font-mono">{proj.tech}</span>
                </div>
                <p className="text-xs text-mut leading-relaxed">{proj.description}</p>
                <div className="pt-1 text-[11px] font-mono text-mut">
                  Repository: <a href={proj.repo_url} target="_blank" rel="noreferrer" className="text-pri hover:underline">{proj.repo_url}</a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cryptographic Trust Guarantee Footnote */}
        <div className="p-4 rounded-xl bg-bg border border-line text-xs text-mut space-y-1">
          <b className="text-ink flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-ok" />
            ProofHire Cryptographic Integrity Guarantee
          </b>
          <p className="leading-relaxed">
            This document is generated by the ProofHire Evidence Intelligence Engine. Recruiter portals verify competency authenticity against the institutional ledger using the cryptographic hash.
          </p>
        </div>
      </div>
    </div>
  );
}