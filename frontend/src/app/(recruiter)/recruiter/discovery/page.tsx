'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import SearchBar from '@/components/ui/SearchBar';
import StatCard from '@/components/ui/StatCard';
import SkillBadge from '@/components/ui/SkillBadge';
import { useApp } from '@/context/AppContext';
import { Compass, CheckCircle2, ShieldCheck, UserPlus, Filter } from 'lucide-react';

interface CandidateProfile {
  id: string;
  name: string;
  branch: string;
  cgpa: number;
  readinessScore: number;
  verifiedSkills: string[];
  topEvidence: string;
  matchScore: number;
}

const TALENT_POOL: CandidateProfile[] = [
  {
    id: 'c-1',
    name: 'Anita S.',
    branch: 'Computer Science',
    cgpa: 8.9,
    readinessScore: 88,
    verifiedSkills: ['SQL', 'Python', 'Docker', 'FastAPI'],
    topEvidence: 'Proctored Adaptive DB Exam (88%) + GitHub Microservice PR',
    matchScore: 94,
  },
  {
    id: 'c-2',
    name: 'Divya R.',
    branch: 'Information Technology',
    cgpa: 9.1,
    readinessScore: 92,
    verifiedSkills: ['SQL', 'Docker', 'Git', 'Kubernetes'],
    topEvidence: 'Authorized Mentor Sign-Off + Containerization Lab Walkthrough',
    matchScore: 96,
  },
  {
    id: 'c-3',
    name: 'Karthik M.',
    branch: 'Information Technology',
    cgpa: 8.2,
    readinessScore: 74,
    verifiedSkills: ['Python', 'Git', 'Django'],
    topEvidence: 'Automated Algorithm Challenge + Verified Repo',
    matchScore: 82,
  },
  {
    id: 'c-4',
    name: 'Imran A.',
    branch: 'Electronics & Communication',
    cgpa: 7.9,
    readinessScore: 71,
    verifiedSkills: ['Python', 'SQL', 'Embedded C'],
    topEvidence: 'SQL Benchmark Exam + Systems Engineering Portfolio',
    matchScore: 78,
  },
  {
    id: 'c-5',
    name: 'Arjun K.',
    branch: 'Computer Science',
    cgpa: 8.4,
    readinessScore: 83,
    verifiedSkills: ['Python', 'Docker', 'Git', 'React'],
    topEvidence: 'Full-Stack Practical Walkthrough + Peer Code Audit',
    matchScore: 89,
  },
];

export default function CandidateDiscoveryPage() {
  const { showToast, addTimelineItem } = useApp();
  const [query, setQuery] = useState('');
  const [skillFilter, setSkillFilter] = useState('ALL');
  const [shortlistedIds, setShortlistedIds] = useState<string[]>([]);

  const filtered = TALENT_POOL.filter((c) => {
    const matchesSkill = skillFilter === 'ALL' || c.verifiedSkills.includes(skillFilter);
    const matchesQuery =
      query === '' ||
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.branch.toLowerCase().includes(query.toLowerCase()) ||
      c.verifiedSkills.some((s) => s.toLowerCase().includes(query.toLowerCase()));
    return matchesSkill && matchesQuery;
  });

  const handleShortlist = (candidate: CandidateProfile) => {
    if (shortlistedIds.includes(candidate.id)) return;
    setShortlistedIds([...shortlistedIds, candidate.id]);
    addTimelineItem('Recruiter', 'Candidate Shortlisted', `${candidate.name} added to Acme Tech drive pipeline`);
    showToast(`${candidate.name} added to pipeline`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Candidate Discovery & Sourcing"
        description="Source verified engineering students with cryptographic skill proofs, objective competency ratings, and granular evidence links."
        breadcrumbs={[{ label: 'Recruiter' }, { label: 'Candidate Discovery' }]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Available Talent" value={TALENT_POOL.length} trend="Active Campus Pool" trendPositive={true} />
        <StatCard label="Shortlisted Profiles" value={shortlistedIds.length} trend="In Current Session" trendPositive={true} />
        <StatCard label="Top Match Fit" value="96%" trend="Divya R. (IT)" trendPositive={true} />
      </div>

      <div className="bg-card border border-line rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="w-full md:w-80">
            <SearchBar value={query} onChange={setQuery} placeholder="Search candidate, branch or skill..." />
          </div>

          <div className="flex gap-2 flex-wrap items-center">
            <span className="text-xs font-semibold text-mut mr-1">Required Skill:</span>
            {['ALL', 'SQL', 'Python', 'Docker', 'Git', 'FastAPI'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSkillFilter(s)}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                  skillFilter === s
                    ? 'bg-pri text-white shadow-sm'
                    : 'bg-bg text-mut border border-line hover:text-ink'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Candidate Cards */}
        <div className="space-y-4 pt-2">
          {filtered.map((c) => {
            const isShortlisted = shortlistedIds.includes(c.id);
            return (
              <div
                key={c.id}
                className="p-5 rounded-xl bg-bg border border-line flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:border-line/80 transition-colors"
              >
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-full bg-pri/10 text-pri font-bold grid place-items-center text-sm shrink-0 border border-pri/20">
                      {c.name[0]}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <b className="text-sm font-bold text-ink">{c.name}</b>
                        <span className="text-xs text-mut font-medium">· {c.branch}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-card border border-line text-mut">
                          CGPA {c.cgpa}
                        </span>
                      </div>
                      <p className="text-xs text-mut mt-0.5">
                        <span className="text-ink font-semibold">Evidence Proof:</span> {c.topEvidence}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pl-13 pt-1">
                    {c.verifiedSkills.map((sk) => (
                      <span key={sk} className="text-[10px] font-semibold px-2 py-0.5 rounded bg-card border border-line text-ink flex items-center gap-1">
                        <CheckCircle2 size={10} className="text-ok" />
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between lg:justify-end gap-6 border-t lg:border-t-0 pt-3 lg:pt-0 border-line">
                  <div className="text-right">
                    <span className="text-[10px] uppercase tracking-wider text-mut font-bold block">Role Match</span>
                    <span className="text-base font-extrabold text-ok">{c.matchScore}%</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleShortlist(c)}
                    disabled={isShortlisted}
                    className={`text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5 ${
                      isShortlisted
                        ? 'bg-okt text-ok cursor-default'
                        : 'bg-pri text-white hover:opacity-95'
                    }`}
                  >
                    {isShortlisted ? (
                      <>
                        <CheckCircle2 size={14} />
                        Shortlisted
                      </>
                    ) : (
                      <>
                        <UserPlus size={14} />
                        Shortlist Candidate
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-12 text-sm text-mut">
              No candidates found matching the selected search criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
