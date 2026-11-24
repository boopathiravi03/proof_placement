'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import { useApp } from '@/context/AppContext';
import { api } from '@/lib/api';
import { GitBranch, ShieldCheck, CheckCircle2, UserCheck, AlertCircle } from 'lucide-react';

const STAGES = ['Shortlisted', 'Interview', 'Offer', 'Accepted'] as const;

interface CandidatePipeline {
  id: string;
  name: string;
  skills: string;
  branch: string;
  stageIndex: number;
}

export default function HiringPipelinePage() {
  const { showToast, addTimelineItem } = useApp();

  const [candidates, setCandidates] = useState<CandidatePipeline[]>([
    { id: 'app-1', name: 'Anita S.', branch: 'CSE', skills: 'SQL, Python verified', stageIndex: 0 },
    { id: 'app-2', name: 'Divya R.', branch: 'IT', skills: 'SQL, Docker, Git verified', stageIndex: 1 },
    { id: 'app-3', name: 'Imran A.', branch: 'ECE', skills: 'Python, SQL verified', stageIndex: 0 },
  ]);

  const handleAdvance = async (idx: number) => {
    const candidate = candidates[idx];
    if (candidate.stageIndex >= 3) return;

    const nextIdx = candidate.stageIndex + 1;
    const nextStage = STAGES[nextIdx];

    setCandidates((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], stageIndex: nextIdx };
      return copy;
    });

    addTimelineItem('Recruiter', 'Pipeline Advance', `${candidate.name} advanced to ${nextStage}`);
    showToast(`${candidate.name} → ${nextStage}`);

    await api.advancePipeline(candidate.id, nextIdx === 2);
  };

  const counts = {
    shortlisted: candidates.filter((c) => c.stageIndex === 0).length,
    interview: candidates.filter((c) => c.stageIndex === 1).length,
    offer: candidates.filter((c) => c.stageIndex === 2).length,
    accepted: candidates.filter((c) => c.stageIndex === 3).length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Candidate Hiring Pipeline"
        description="Unified candidate lifecycle from verified shortlisting to institutional offer rollout. Dual sign-off protects student placement integrity."
        breadcrumbs={[{ label: 'Recruiter' }, { label: 'Hiring Pipeline' }]}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Shortlisted" value={counts.shortlisted} trend="Pre-Screened" trendPositive={true} />
        <StatCard label="Technical Interview" value={counts.interview} trend="In Progress" trendPositive={true} />
        <StatCard label="Offers Extended" value={counts.offer} trend="Awaiting T&P" trendPositive={true} />
        <StatCard label="Accepted Offers" value={counts.accepted} trend="Placed" trendPositive={true} />
      </div>

      <div className="bg-card border border-line rounded-2xl p-6 shadow-sm space-y-6">
        <div className="border-b border-line pb-4 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-base font-bold text-ink">Active Candidates · Acme Tech Drive</h2>
            <p className="text-xs text-mut mt-0.5">
              Candidate status updates sync with college placement officer oversight.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-pri/10 text-pri">
            {candidates.length} Total in Pipeline
          </span>
        </div>

        <div className="space-y-4">
          {candidates.map((c, i) => {
            const isCompleted = c.stageIndex === 3;
            const isOfferStage = c.stageIndex === 1; // advancing to Offer requires officer approval

            return (
              <div
                key={c.id}
                className="p-5 rounded-xl bg-bg border border-line flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-line/80 transition-colors"
              >
                <div className="flex items-center gap-3.5 flex-1 w-full md:w-auto">
                  <span className="w-11 h-11 rounded-full bg-pri/10 text-pri font-bold grid place-items-center text-sm shrink-0 border border-pri/20">
                    {c.name[0]}
                  </span>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <b className="text-sm font-bold text-ink">{c.name}</b>
                      <span className="text-xs text-mut font-medium">· {c.branch}</span>
                    </div>
                    <p className="text-xs text-mut">{c.skills}</p>

                    {/* 4-step pipeline bar */}
                    <div className="space-y-1 pt-1 max-w-md">
                      <div className="flex gap-1.5">
                        {[0, 1, 2, 3].map((step) => (
                          <div
                            key={step}
                            className={`flex-1 h-1.5 rounded-full transition-colors ${
                              step <= c.stageIndex ? 'bg-pri' : 'bg-line'
                            }`}
                          />
                        ))}
                      </div>
                      <div className="flex justify-between text-[10px] font-semibold text-mut">
                        <span className={c.stageIndex >= 0 ? 'text-pri font-bold' : ''}>Shortlist</span>
                        <span className={c.stageIndex >= 1 ? 'text-pri font-bold' : ''}>Interview</span>
                        <span className={c.stageIndex >= 2 ? 'text-pri font-bold' : ''}>Offer</span>
                        <span className={c.stageIndex >= 3 ? 'text-ok font-bold' : ''}>Accepted</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 w-full md:w-auto flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleAdvance(i)}
                    disabled={isCompleted}
                    className={`text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm ${
                      isCompleted
                        ? 'bg-okt text-ok cursor-default'
                        : isOfferStage
                        ? 'bg-amber-600 text-white hover:opacity-90'
                        : 'bg-pri text-white hover:opacity-90'
                    }`}
                  >
                    {isCompleted
                      ? 'Offer Accepted ✓'
                      : isOfferStage
                      ? 'Approve Offer (Officer Sign-Off)'
                      : `Advance to ${STAGES[c.stageIndex + 1]}`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
