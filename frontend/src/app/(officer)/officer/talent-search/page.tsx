'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import SkillBadge from '@/components/ui/SkillBadge';
import SearchBar from '@/components/ui/SearchBar';
import StatCard from '@/components/ui/StatCard';
import Modal from '@/components/ui/Modal';
import { useApp } from '@/context/AppContext';
import {
  Search,
  ShieldCheck,
  CheckCircle2,
  UserCheck,
  Award,
  GitBranch,
  ExternalLink,
  Download,
  Filter,
  Check,
} from 'lucide-react';

interface Candidate {
  id: string;
  name: string;
  branch: string;
  skills: string[];
  cgpa: number;
  readiness: number;
  evidenceSource: string;
  verificationMethod: string;
  expiresMonths: number;
  certHash: string;
}

const CANDIDATES: Candidate[] = [
  {
    id: 'c-1',
    name: 'Anita S.',
    branch: 'CSE',
    skills: ['SQL', 'Python', 'Docker'],
    cgpa: 8.9,
    readiness: 88,
    evidenceSource: 'GitHub @anita-dev/db-service (42 commits) + Proctored Exam',
    verificationMethod: 'Automated machine proctoring & test rubric',
    expiresMonths: 11,
    certHash: '8f4b29a1e0c3d5e7',
  },
  {
    id: 'c-2',
    name: 'Divya R.',
    branch: 'IT',
    skills: ['SQL', 'Docker', 'Git'],
    cgpa: 9.1,
    readiness: 92,
    evidenceSource: 'Authorized Mentor Sign-Off + Containerization Lab Walkthrough',
    verificationMethod: 'Authorized Faculty Mentor (Dr. Sen)',
    expiresMonths: 9,
    certHash: '4a1c9e8b7f0d3e21',
  },
  {
    id: 'c-3',
    name: 'Karthik M.',
    branch: 'IT',
    skills: ['Python', 'Git'],
    cgpa: 8.2,
    readiness: 74,
    evidenceSource: 'Automated algorithm diagnostic challenge + 3 public repos',
    verificationMethod: 'Proctored machine assessment',
    expiresMonths: 8,
    certHash: '3e7b2a9f1c0d4e56',
  },
  {
    id: 'c-4',
    name: 'Priya D.',
    branch: 'CSE',
    skills: ['SQL', 'Git'],
    cgpa: 8.5,
    readiness: 79,
    evidenceSource: 'Database query benchmark & peer code review',
    verificationMethod: 'Proctored diagnostic evaluation',
    expiresMonths: 7,
    certHash: '9d2f4a1b0e3c5a78',
  },
  {
    id: 'c-5',
    name: 'Imran A.',
    branch: 'ECE',
    skills: ['Python', 'SQL'],
    cgpa: 7.9,
    readiness: 71,
    evidenceSource: 'Systems engineering repo + SQL proficiency exam',
    verificationMethod: 'Faculty panel sign-off',
    expiresMonths: 6,
    certHash: '6b1e8f3a0d9c4e21',
  },
  {
    id: 'c-6',
    name: 'Arjun K.',
    branch: 'CSE',
    skills: ['Python', 'Docker', 'Git'],
    cgpa: 8.4,
    readiness: 83,
    evidenceSource: 'Full-stack microservices practical walkthrough',
    verificationMethod: 'Automated code execution harness',
    expiresMonths: 10,
    certHash: '5c0e2a8f9b1d3a47',
  },
];

export default function TalentSearchPage() {
  const { showToast, addTimelineItem } = useApp();
  const [filterSkill, setFilterSkill] = useState<string>('SQL');
  const [filterBranch, setFilterBranch] = useState<string>('ALL');
  const [query, setQuery] = useState<string>('');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [invitedList, setInvitedList] = useState<string[]>([]);

  const filtered = CANDIDATES.filter((c) => {
    const matchesSkill = filterSkill === 'ALL' || c.skills.includes(filterSkill);
    const matchesBranch = filterBranch === 'ALL' || c.branch === filterBranch;
    const matchesQuery =
      query === '' ||
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.branch.toLowerCase().includes(query.toLowerCase());
    return matchesSkill && matchesBranch && matchesQuery;
  });

  const handleInvite = (c: Candidate) => {
    if (invitedList.includes(c.id)) return;
    setInvitedList([...invitedList, c.id]);
    addTimelineItem('Officer', 'Candidate Invited', `${c.name} nominated for Acme Tech Drive`);
    showToast(`${c.name} nominated for upcoming campus drive`);
  };

  const handleExportCohort = () => {
    showToast(`Exported verified roster of ${filtered.length} candidates`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Verified Talent Discovery & Search"
        description="Query student talent pools with tamper-evident evidence dossiers, objective competency ratings, and granular verification certificates."
        breadcrumbs={[{ label: 'Officer' }, { label: 'Talent Search' }]}
        actions={
          <button
            type="button"
            onClick={handleExportCohort}
            className="bg-card border border-line text-ink text-xs font-semibold px-4 py-2 rounded-xl hover:bg-bg transition-colors flex items-center gap-1.5"
          >
            <Download size={14} />
            Export Verified Roster
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Cohort Pool"
          value={CANDIDATES.length}
          icon={<UserCheck size={18} />}
          trend="Audited Candidates"
          trendPositive={true}
        />
        <StatCard
          label="Matched Profiles"
          value={filtered.length}
          icon={<Search size={18} />}
          trend={`Skill: ${filterSkill}`}
          trendPositive={true}
        />
        <StatCard
          label="Average Readiness Score"
          value={
            filtered.length
              ? `${Math.round(filtered.reduce((a, b) => a + b.readiness, 0) / filtered.length)}%`
              : '0%'
          }
          icon={<Award size={18} />}
          trend="Evidence-Weighted"
          trendPositive={true}
        />
        <StatCard
          label="Nominated to Drives"
          value={invitedList.length}
          icon={<ShieldCheck size={18} />}
          trend="Session Total"
          trendPositive={true}
        />
      </div>

      <div className="bg-card border border-line rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="w-full md:w-80">
            <SearchBar
              value={query}
              onChange={setQuery}
              placeholder="Search by candidate name or branch..."
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Branch Filter */}
            <div className="flex items-center gap-1.5 bg-bg border border-line rounded-xl px-2.5 py-1 text-xs text-mut">
              <span className="font-semibold text-ink">Branch:</span>
              {['ALL', 'CSE', 'IT', 'ECE'].map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setFilterBranch(b)}
                  className={`px-2 py-0.5 rounded-lg font-bold transition-all ${
                    filterBranch === b ? 'bg-card text-pri shadow-xs' : 'text-mut hover:text-ink'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>

            {/* Skill Filter Pills */}
            <div className="flex gap-1.5 flex-wrap items-center">
              {['ALL', 'SQL', 'Python', 'Docker', 'Git'].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFilterSkill(s)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                    filterSkill === s
                      ? 'bg-pri text-white shadow-sm'
                      : 'bg-bg text-mut border border-line hover:text-ink'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Candidate List */}
        <div className="space-y-3 pt-2">
          {filtered.map((c) => {
            const initial = c.name[0];
            const isInvited = invitedList.includes(c.id);

            return (
              <div
                key={c.id}
                className="p-5 rounded-2xl bg-bg border border-line/80 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-line hover:shadow-xs transition-all"
              >
                <div className="flex items-start gap-4">
                  <span className="w-11 h-11 rounded-2xl bg-pri/10 text-pri font-bold grid place-items-center text-sm shrink-0 border border-pri/20">
                    {initial}
                  </span>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <b className="text-sm font-bold text-ink">{c.name}</b>
                      <span className="text-xs text-mut font-medium">· {c.branch}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-card border border-line text-mut">
                        CGPA {c.cgpa}
                      </span>
                      <span className="text-[10px] font-mono text-pri bg-pri/5 px-2 py-0.5 rounded border border-pri/20">
                        Cert: {c.certHash}
                      </span>
                    </div>

                    <p className="text-xs text-mut leading-relaxed">
                      <span className="text-ink font-medium">Evidence:</span> {c.evidenceSource}
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {c.skills.map((sk) => (
                        <span
                          key={sk}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded bg-card border border-line text-ink flex items-center gap-1"
                        >
                          <CheckCircle2 size={10} className="text-ok" />
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-5 border-t md:border-t-0 pt-3 md:pt-0 border-line">
                  <div className="text-right">
                    <span className="text-[10px] uppercase tracking-wider text-mut font-bold block">
                      Readiness Index
                    </span>
                    <span className="text-base font-extrabold text-pri">{c.readiness}%</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedCandidate(c)}
                      className="text-xs font-semibold px-3 py-2 rounded-xl bg-card border border-line text-ink hover:bg-line/40 transition-colors"
                    >
                      Inspect Evidence
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInvite(c)}
                      disabled={isInvited}
                      className={`text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 ${
                        isInvited
                          ? 'bg-okt text-ok border border-ok/20'
                          : 'bg-pri text-white hover:opacity-95'
                      }`}
                    >
                      {isInvited ? (
                        <>
                          <Check size={13} />
                          Nominated
                        </>
                      ) : (
                        'Nominate'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-12 text-sm text-mut">
              No candidates found matching the selected search parameters.
            </div>
          )}
        </div>
      </div>

      {/* Candidate Evidence Dossier Modal */}
      {selectedCandidate && (
        <Modal
          isOpen={!!selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
          title={`Evidence Dossier: ${selectedCandidate.name}`}
        >
          <div className="space-y-5 pt-2">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-bg border border-line">
              <div>
                <b className="text-sm font-bold text-ink">{selectedCandidate.name}</b>
                <p className="text-xs text-mut">{selectedCandidate.branch} · CGPA {selectedCandidate.cgpa}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase tracking-wider text-mut font-bold block">Readiness</span>
                <span className="text-lg font-black text-pri">{selectedCandidate.readiness}%</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <b className="text-ink block mb-1">Evidence Trail Details</b>
                <p className="text-mut bg-bg p-3 rounded-xl border border-line leading-relaxed">
                  {selectedCandidate.evidenceSource}
                </p>
              </div>

              <div>
                <b className="text-ink block mb-1">Verification Authority & Method</b>
                <p className="text-mut bg-bg p-3 rounded-xl border border-line leading-relaxed">
                  {selectedCandidate.verificationMethod} (Audit validity period: {selectedCandidate.expiresMonths} months remaining)
                </p>
              </div>

              <div>
                <b className="text-ink block mb-1">Cryptographic Ledger Signature</b>
                <code className="block bg-bg p-3 rounded-xl border border-line font-mono text-pri text-[11px] break-all">
                  SHA-256:{selectedCandidate.certHash}89e24f7a10cd29b
                </code>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-line">
              <button
                type="button"
                onClick={() => setSelectedCandidate(null)}
                className="px-4 py-2 rounded-xl bg-card border border-line text-xs font-semibold text-ink hover:bg-bg"
              >
                Close Dossier
              </button>
              <button
                type="button"
                onClick={() => {
                  handleInvite(selectedCandidate);
                  setSelectedCandidate(null);
                }}
                className="px-4 py-2 rounded-xl bg-pri text-white text-xs font-bold shadow-sm hover:opacity-95"
              >
                Nominate for Drive
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
