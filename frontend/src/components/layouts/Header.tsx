'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';

const PAGE_TITLES: Record<string, { title: string; roleDesc: string; userInitial: string; userName: string }> = {
  '/student/dashboard': { title: 'Student Talent Profile', roleDesc: 'Student Interface', userInitial: 'R', userName: 'Rahul K.' },
  '/student/readiness': { title: 'Placement Readiness Index', roleDesc: 'Student Interface', userInitial: 'R', userName: 'Rahul K.' },
  '/student/evidence': { title: 'Verifiable Evidence Management', roleDesc: 'Student Interface', userInitial: 'R', userName: 'Rahul K.' },
  '/student/assessment': { title: 'Adaptive Technical Assessment', roleDesc: 'Student Interface', userInitial: 'R', userName: 'Rahul K.' },
  '/student/learning': { title: 'Personalized Remediation Path', roleDesc: 'Student Interface', userInitial: 'R', userName: 'Rahul K.' },
  '/student/resume': { title: 'One-Click Verifiable Resume', roleDesc: 'Student Interface', userInitial: 'R', userName: 'Rahul K.' },
  '/student/privacy': { title: 'Privacy & DPDP Governance', roleDesc: 'Student Interface', userInitial: 'R', userName: 'Rahul K.' },
  '/student/drives': { title: 'Drive Eligibility Evaluation', roleDesc: 'Student Interface', userInitial: 'R', userName: 'Rahul K.' },

  '/officer/cohort-insights': { title: 'Cohort Intelligence & Heatmap', roleDesc: 'T&P Officer Intelligence', userInitial: 'T', userName: 'T&P Officer' },
  '/officer/approvals': { title: 'Human-in-the-Loop Approvals', roleDesc: 'T&P Officer Intelligence', userInitial: 'T', userName: 'T&P Officer' },
  '/officer/talent-search': { title: 'Verified Talent Search', roleDesc: 'T&P Officer Intelligence', userInitial: 'T', userName: 'T&P Officer' },
  '/officer/calendar': { title: 'Drive Operations & Calendar', roleDesc: 'T&P Officer Intelligence', userInitial: 'T', userName: 'T&P Officer' },
  '/officer/reports': { title: 'Institutional Accreditation', roleDesc: 'T&P Officer Intelligence', userInitial: 'T', userName: 'T&P Officer' },
  '/officer/audit': { title: 'Cryptographic SHA-256 Audit Chain', roleDesc: 'T&P Officer Intelligence', userInitial: 'T', userName: 'T&P Officer' },

  '/recruiter/hiring-pipeline': { title: 'Candidate Hiring Pipeline', roleDesc: 'Recruiter Workspace', userInitial: 'A', userName: 'Acme Recruiter' },
  '/university/dashboard': { title: 'Multi-College University Benchmark', roleDesc: 'University Administration', userInitial: 'U', userName: 'University Admin' },
};

export default function Header() {
  const pathname = usePathname();
  const { college, apiConnected } = useApp();

  const meta = PAGE_TITLES[pathname] || {
    title: 'ProofHire Dashboard',
    roleDesc: 'Placement Intelligence',
    userInitial: 'P',
    userName: 'User',
  };

  return (
    <header className="flex justify-between items-center mb-6 gap-3 flex-wrap">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">{meta.title}</h1>
        <p className="text-sm text-mut mt-0.5">
          {meta.roleDesc} · College {college}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {apiConnected ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-okt text-ok border border-ok/20">
            <span className="w-2 h-2 rounded-full bg-ok animate-pulse" />
            Live API
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-pt text-pri border border-pri/20">
            <span className="w-2 h-2 rounded-full bg-pri" />
            Standalone Mode
          </span>
        )}

        <div className="flex items-center gap-2.5 bg-card border border-line pl-1.5 pr-3.5 py-1.5 rounded-full shadow-sm">
          <span className="w-8 h-8 rounded-full bg-gradient-to-br from-[#8a6cff] to-[#4cc3ff] text-white font-bold grid place-items-center text-sm">
            {meta.userInitial}
          </span>
          <span className="font-bold text-sm text-ink">{meta.userName}</span>
        </div>
      </div>
    </header>
  );
}
