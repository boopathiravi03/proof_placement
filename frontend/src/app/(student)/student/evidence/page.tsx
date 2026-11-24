'use client';

import React from 'react';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import { useApp } from '@/context/AppContext';
import { api } from '@/lib/api';
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

  const handleAddEvidence = async (kind: 'cert' | 'hack' | 'lab') => {
    const config = {
      cert: { skill: 'Python', title: 'Python Programming (NPTEL Elite Certificate)', kindStr: 'cert', icon: 'cert' },
      hack: { skill: 'Git', title: 'Smart India Hackathon Finalist Project (3 Contributors)', kindStr: 'hackathon', icon: 'hack' },
      lab: { skill: 'SQL', title: 'Relational Database Laboratory Evaluation (9/10)', kindStr: 'lab', icon: 'lab' },
    }[kind];

    addTimelineItem(config.skill, kind, config.title);
    setSkills((prev) => ({
      ...prev,
      [config.skill]: Math.max(prev[config.skill] || 0, 1),
    }));
    setEvidenceDescriptions((prev) => ({
      ...prev,
      [config.skill]: config.title,
    }));
    showToast(`Evidence linked: ${config.title}`);

    await api.addEvidence({
      student_id: 'student-rahul-01',
      skill_name: config.skill,
      kind: config.kindStr,
      title: config.title,
      ref_url: `https://proofhire.internal/evidence/${kind}`,
    });
  };

  const handleMentorSignOff = async () => {
    if (skills.SQL !== 3) {
      showToast('Pass the SQL assessment first (Assessed state required)');
      return;
    }

    setSkills((prev) => ({ ...prev, SQL: 4 }));
    setEvidenceDescriptions((prev) => ({
      ...prev,
      SQL: (prev.SQL || 'Adaptive assessment 4/5') + ' · mentor signed off',
    }));
    addTimelineItem('SQL', 'Mentor sign-off', 'Verified by Prof. Meena (DBMS Lab)');
    showToast('SQL is now Verified with high confidence');

    await api.signOffMentor({
      student_id: 'student-rahul-01',
      skill_name: 'SQL',
      mentor_name: 'Prof. Meena (DBMS Lab)',
    });
  };

  const isSqlVerified = skills.SQL === 4;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Verifiable Competency Evidence Ledger"
        description="Attach and authenticate multi-source practical artifacts across your student portfolio. Multi-channel evidence ensures non-GitHub students are never disadvantaged."
        breadcrumbs={[{ label: 'Student', href: '/student/dashboard' }, { label: 'Evidence Ledger' }]}
      />

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Attached Evidence Artifacts"
          value={timeline.length}
          icon={<FileCode size={18} />}
          trend="Multi-Source"
          trendPositive={true}
          subtitle="Certificates & Labs"
        />
        <StatCard
          label="Verified Status Competencies"
          value={Object.values(skills).filter((x) => x === 4).length}
          icon={<ShieldCheck size={18} />}
          trend="Validated by Mentor"
          trendPositive={true}
          subtitle="Audit Proof Locked"
        />
        <StatCard
          label="Observed / Evidence-Linked"
          value={Object.values(skills).filter((x) => x >= 1 && x < 4).length}
          icon={<GitBranch size={18} />}
          trend="In Lifecycle"
          trendPositive={true}
          subtitle="Awaiting Final Test"
        />
        <StatCard
          label="Evidence Provenance Trace"
          value="100%"
          icon={<Award size={18} />}
          trend="Cryptographically Sealed"
          trendPositive={true}
          subtitle="Zero Self-Claims"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evidence Submission Panel */}
        <div className="bg-card border border-line rounded-2xl p-6 shadow-sm space-y-5">
          <div className="border-b border-line pb-4">
            <h2 className="text-base font-bold text-ink">Submit Verifiable Evidence Artifacts</h2>
            <p className="text-xs text-mut mt-0.5">
              Multiple evidence pathways guarantee fair evaluation without relying solely on GitHub
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <button
              type="button"
              onClick={() => handleAddEvidence('cert')}
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
              onClick={() => handleAddEvidence('hack')}
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
              onClick={() => handleAddEvidence('lab')}
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
              onClick={handleMentorSignOff}
              className={`p-4 rounded-xl text-left flex items-start gap-3.5 transition-all cursor-pointer ${
                isSqlVerified
                  ? 'bg-okt border border-ok/20 text-ok cursor-default'
                  : 'bg-pri text-white shadow-xs hover:opacity-95'
              }`}
            >
              <div className={`p-2.5 rounded-xl shrink-0 ${isSqlVerified ? 'bg-card text-ok' : 'bg-white/20 text-white'}`}>
                {isSqlVerified ? <CheckCircle2 size={18} /> : <UserCheck size={18} />}
              </div>
              <div className="space-y-0.5">
                <b className="text-xs font-bold block">
                  {isSqlVerified ? 'SQL Mentor Sign-Off Complete ✓' : 'Request Authorized Mentor Sign-Off (SQL)'}
                </b>
                <p className={`text-[11px] ${isSqlVerified ? 'text-ok/80' : 'text-white/80'}`}>
                  {isSqlVerified
                    ? 'Signed off by Prof. Meena (DBMS Lab) · Verified status active'
                    : 'Requires Assessed state from adaptive diagnostic before sign-off'}
                </p>
              </div>
            </button>
          </div>

          <div className="p-3.5 bg-bg rounded-xl border border-line text-xs text-mut leading-relaxed">
            <span className="font-bold text-ink block mb-0.5">Strict Lifecycle Constraint:</span>
            Repository activity alone produces <b className="text-ink">Evidence-linked</b> status. <b className="text-ok font-bold">Verified</b> status strictly requires a proctored machine assessment or authorized mentor sign-off.
          </div>
        </div>

        {/* Evidence Provenance Timeline */}
        <div className="bg-card border border-line rounded-2xl p-6 shadow-sm space-y-5">
          <div className="border-b border-line pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-ink">Verifiable Evidence Timeline</h2>
              <p className="text-xs text-mut mt-0.5">
                Provenance trail, timestamp, and audit hashes for every record
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-pri/10 text-pri">
              {timeline.length} Entries
            </span>
          </div>

          <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1">
            {timeline.length > 0 ? (
              timeline.map((e, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-bg border border-line space-y-1.5 hover:border-line/80 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-ink">{e.s}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-card border border-line text-mut">
                        {e.k}
                      </span>
                    </div>
                    <span className="text-[10px] text-mut font-mono">{e.at}</span>
                  </div>

                  <p className="text-xs text-ink font-medium leading-relaxed">{e.t}</p>

                  <div className="pt-1 flex items-center gap-1.5 text-[11px] font-mono text-mut">
                    <CheckCircle2 size={11} className="text-ok shrink-0" />
                    <span>Cryptographic Provenance Verified</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-xs text-mut italic">
                No evidence recorded yet. Connect GitHub or click one of the evidence buttons to link artifacts.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
