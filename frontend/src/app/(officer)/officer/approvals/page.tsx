'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import { useApp } from '@/context/AppContext';
import { api } from '@/lib/api';
import { CheckCircle2, ShieldCheck, AlertCircle, Clock } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';

interface Proposal {
  id: number;
  t: string;
  d: string;
  category: string;
  risk: 'low' | 'medium' | 'high';
}

const INITIAL_PROPOSALS: Record<'A' | 'B', Proposal[]> = {
  A: [
    {
      id: 1,
      t: 'Flag 12 students as at-risk for database tier placement',
      d: 'Predictive agent · weak SQL, sub-50% mock assessment scores in CSE batch',
      category: 'Predictive Intervention',
      risk: 'high',
    },
    {
      id: 2,
      t: 'Add Docker & CI/CD workshop for CSE batch',
      d: 'Skill-gap agent · 40% of active company job drives explicitly list containerization',
      category: 'Curriculum Adjustment',
      risk: 'medium',
    },
  ],
  B: [
    {
      id: 3,
      t: 'Flag 4 students as at-risk in Systems Engineering',
      d: 'Predictive agent · weak Docker and Linux practical walkthrough metrics',
      category: 'Predictive Intervention',
      risk: 'medium',
    },
  ],
};

export default function ApprovalsPage() {
  const { college, showToast, addTimelineItem } = useApp();
  const [proposals, setProposals] = useState<Record<'A' | 'B', Proposal[]>>(INITIAL_PROPOSALS);

  const currentList = proposals[college] || [];

  const handleApprove = async (id: number) => {
    const item = currentList.find((p) => p.id === id);
    if (!item) return;

    setProposals((prev) => ({
      ...prev,
      [college]: prev[college].filter((p) => p.id !== id),
    }));
    addTimelineItem('Officer', 'Proposal Approved', item.t);
    showToast(`Approved: ${item.t}`);
    await api.actOnApproval(String(id), 'approved');
  };

  const handleReject = async (id: number) => {
    const item = currentList.find((p) => p.id === id);
    if (!item) return;

    setProposals((prev) => ({
      ...prev,
      [college]: prev[college].filter((p) => p.id !== id),
    }));
    addTimelineItem('Officer', 'Proposal Dismissed', item.t);
    showToast(`Dismissed: ${item.t}`);
    await api.actOnApproval(String(id), 'rejected');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Human-in-the-Loop Approvals Queue"
        description="Autonomous AI agents formulate intervention proposals; no student record or drive state changes without authorized T&P officer sign-off."
        breadcrumbs={[{ label: 'Officer' }, { label: 'Approvals Queue' }]}
      />

      <div className="bg-card border border-line rounded-2xl p-6 shadow-sm space-y-6 max-w-4xl">
        <div className="flex items-center justify-between border-b border-line pb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-pri" size={20} />
            <h2 className="text-base font-bold text-ink">Pending AI Interventions</h2>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-pri/10 text-pri">
            {currentList.length} Proposal{currentList.length === 1 ? '' : 's'} Pending Review
          </span>
        </div>

        {currentList.length > 0 ? (
          <div className="space-y-4">
            {currentList.map((p) => (
              <div
                key={p.id}
                className="p-5 rounded-xl bg-bg border border-line flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-card border border-line text-mut">
                      {p.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        p.risk === 'high'
                          ? 'bg-bt text-bad'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {p.risk} priority
                    </span>
                  </div>
                  <b className="text-sm font-bold text-ink block">{p.t}</b>
                  <p className="text-xs text-mut leading-relaxed">{p.d}</p>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleReject(p.id)}
                    className="text-xs font-semibold px-3.5 py-2 rounded-xl border border-line bg-card hover:bg-line/40 text-mut hover:text-ink transition-colors"
                  >
                    Dismiss
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApprove(p.id)}
                    className="bg-pri text-white font-bold text-xs px-4 py-2 rounded-xl shadow-sm hover:opacity-95 transition-opacity"
                  >
                    Authorize Proposal
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="All proposals processed"
            description="The AI recommendation engine has no pending intervention proposals requiring human-in-the-loop review for this tenant."
          />
        )}
      </div>
    </div>
  );
}
