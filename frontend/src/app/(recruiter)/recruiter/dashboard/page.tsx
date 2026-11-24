'use client';

import React from 'react';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import { Briefcase, Users, CalendarCheck, CheckCircle2, ArrowRight, ShieldCheck, Search } from 'lucide-react';

const RECENT_CAMPAIGNS = [
  {
    id: 'job-1',
    title: 'Software Development Engineer I',
    department: 'Platform Core',
    openings: 8,
    applicants: 42,
    shortlisted: 14,
    interviews: 6,
    status: 'Active',
  },
  {
    id: 'job-2',
    title: 'Data & Database Systems Engineer',
    department: 'Data Infrastructure',
    openings: 4,
    applicants: 28,
    shortlisted: 9,
    interviews: 3,
    status: 'Active',
  },
  {
    id: 'job-3',
    title: 'Cloud & DevOps Associate',
    department: 'SRE / Infrastructure',
    openings: 3,
    applicants: 19,
    shortlisted: 5,
    interviews: 2,
    status: 'Reviewing',
  },
];

export default function RecruiterDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Recruiter Placement Hub"
        description="Source verified campus talent, review evidence-backed student competency dossiers, and track interview pipelines."
        breadcrumbs={[{ label: 'Recruiter' }, { label: 'Dashboard Overview' }]}
        actions={
          <div className="flex gap-2.5">
            <Link
              href="/recruiter/discovery"
              className="bg-card border border-line text-ink text-xs font-semibold px-3.5 py-2 rounded-xl hover:bg-bg transition-colors flex items-center gap-1.5"
            >
              <Search size={14} />
              Discover Talent
            </Link>
            <Link
              href="/recruiter/hiring-pipeline"
              className="bg-pri text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm hover:opacity-95 transition-opacity flex items-center gap-1.5"
            >
              Hiring Pipeline
              <ArrowRight size={14} />
            </Link>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Job Roles"
          value="3 Positions"
          trend="15 Total Openings"
          trendPositive={true}
        />
        <StatCard
          label="Verified Candidates"
          value="89 Profiles"
          trend="Evidence-Linked"
          trendPositive={true}
        />
        <StatCard
          label="Interviews Scheduled"
          value="11 Slots"
          trend="This Week"
          trendPositive={true}
        />
        <StatCard
          label="Offers Finalized"
          value="4 Placed"
          trend="Dual Sign-Off Done"
          trendPositive={true}
        />
      </div>

      {/* Active Campaigns */}
      <div className="bg-card border border-line rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-line pb-4 flex-wrap gap-2">
          <div>
            <h2 className="text-base font-bold text-ink">Active Campus Hiring Drives</h2>
            <p className="text-xs text-mut mt-0.5">
              Live recruitment positions and applicant processing status
            </p>
          </div>
          <Link
            href="/recruiter/jobs"
            className="text-xs font-semibold text-pri hover:underline"
          >
            Manage All Jobs →
          </Link>
        </div>

        <div className="divide-y divide-line">
          {RECENT_CAMPAIGNS.map((job) => (
            <div
              key={job.id}
              className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <b className="text-sm font-bold text-ink">{job.title}</b>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-okt text-ok">
                    {job.status}
                  </span>
                </div>
                <p className="text-xs text-mut">
                  {job.department} · {job.openings} Openings
                </p>
              </div>

              <div className="flex items-center gap-6 text-xs">
                <div>
                  <span className="text-mut block text-[10px] uppercase font-bold">Applicants</span>
                  <span className="font-extrabold text-ink">{job.applicants}</span>
                </div>
                <div>
                  <span className="text-mut block text-[10px] uppercase font-bold">Shortlisted</span>
                  <span className="font-extrabold text-pri">{job.shortlisted}</span>
                </div>
                <div>
                  <span className="text-mut block text-[10px] uppercase font-bold">Interviews</span>
                  <span className="font-extrabold text-amber-600 dark:text-amber-400">{job.interviews}</span>
                </div>
                <Link
                  href="/recruiter/hiring-pipeline"
                  className="bg-bg hover:bg-line/40 text-ink border border-line text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ml-2"
                >
                  View Pipeline
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recruiter Guarantee Banner */}
      <div className="p-4 rounded-xl bg-pri/5 border border-pri/20 flex items-start gap-3">
        <ShieldCheck className="text-pri shrink-0 mt-0.5" size={20} />
        <div className="text-xs text-ink space-y-1">
          <p className="font-bold">ProofHire Evidence Guarantee</p>
          <p className="text-mut leading-relaxed">
            All candidate skills displayed to recruiters have undergone automated code verification, proctored assessments, or authorized mentor evaluation. Self-reported claims are explicitly isolated.
          </p>
        </div>
      </div>
    </div>
  );
}
