'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import Modal from '@/components/ui/Modal';
import { Briefcase, Plus, CheckCircle2, Users, FileText, Calendar } from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface JobPosting {
  id: string;
  title: string;
  department: string;
  ctc: string;
  skills: string[];
  eligibility: string;
  openings: number;
  deadline: string;
  status: 'Open' | 'Closed';
}

const INITIAL_JOBS: JobPosting[] = [
  {
    id: 'job-1',
    title: 'Software Development Engineer I',
    department: 'Platform Core',
    ctc: '₹12 - ₹16 LPA',
    skills: ['Python', 'SQL', 'Git', 'Data Structures'],
    eligibility: 'B.Tech CSE/IT, CGPA >= 7.5',
    openings: 8,
    deadline: '2026-12-15',
    status: 'Open',
  },
  {
    id: 'job-2',
    title: 'Data & Database Systems Engineer',
    department: 'Data Infrastructure',
    ctc: '₹10 - ₹14 LPA',
    skills: ['SQL', 'PostgreSQL', 'Python', 'Docker'],
    eligibility: 'B.Tech CSE/IT/ECE, CGPA >= 7.0',
    openings: 4,
    deadline: '2026-12-18',
    status: 'Open',
  },
  {
    id: 'job-3',
    title: 'Cloud & DevOps Associate',
    department: 'SRE / Infrastructure',
    ctc: '₹11 - ₹15 LPA',
    skills: ['Docker', 'Linux', 'Git', 'CI/CD'],
    eligibility: 'All Engineering Branches, CGPA >= 7.0',
    openings: 3,
    deadline: '2026-12-20',
    status: 'Open',
  },
];

export default function JobRequirementsPage() {
  const { showToast } = useApp();
  const [jobs, setJobs] = useState<JobPosting[]>(INITIAL_JOBS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDept, setNewDept] = useState('');
  const [newCtc, setNewCtc] = useState('');

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    const newJob: JobPosting = {
      id: `job-${jobs.length + 1}`,
      title: newTitle,
      department: newDept || 'Engineering',
      ctc: newCtc || '₹10 - ₹14 LPA',
      skills: ['Python', 'SQL', 'Git'],
      eligibility: 'B.Tech All Branches, CGPA >= 7.0',
      openings: 5,
      deadline: '2026-12-30',
      status: 'Open',
    };

    setJobs([newJob, ...jobs]);
    setIsModalOpen(false);
    setNewTitle('');
    setNewDept('');
    setNewCtc('');
    showToast(`Job posting created: ${newTitle}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Job Requirements & Drive Postings"
        description="Publish placement requirements, define evidence-backed competency prerequisites, and set eligibility criteria for campus drives."
        breadcrumbs={[{ label: 'Recruiter' }, { label: 'Job Requirements' }]}
        actions={
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="bg-pri text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm hover:opacity-95 transition-opacity flex items-center gap-1.5"
          >
            <Plus size={14} />
            Post New Position
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Job Postings" value={jobs.length} trend="Active Drives" trendPositive={true} />
        <StatCard label="Total Openings" value={jobs.reduce((a, b) => a + b.openings, 0)} trend="Positions" trendPositive={true} />
        <StatCard label="Average Compensation" value="₹13.2 LPA" trend="Across Roles" trendPositive={true} />
      </div>

      <div className="bg-card border border-line rounded-2xl p-6 shadow-sm space-y-6">
        <div className="border-b border-line pb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-ink">Active Job Openings</h2>
          <span className="text-xs text-mut font-semibold">{jobs.length} positions posted</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((j) => (
            <div
              key={j.id}
              className="p-5 rounded-xl bg-bg border border-line flex flex-col justify-between space-y-4 hover:border-line/80 transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <b className="text-sm font-bold text-ink leading-snug">{j.title}</b>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-okt text-ok shrink-0">
                    {j.status}
                  </span>
                </div>
                <p className="text-xs text-mut">{j.department} · {j.openings} Openings</p>
                <div className="text-xs font-extrabold text-pri pt-1">{j.ctc}</div>

                <div className="pt-2 border-t border-line/60 space-y-1.5 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-mut block">Required Skills</span>
                  <div className="flex flex-wrap gap-1">
                    {j.skills.map((s) => (
                      <span key={s} className="text-[10px] font-semibold px-2 py-0.5 rounded bg-card border border-line text-ink">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 text-[11px] text-mut space-y-1">
                  <div><b>Eligibility:</b> {j.eligibility}</div>
                  <div><b>Deadline:</b> {j.deadline}</div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => showToast(`Opening candidate view for ${j.title}`)}
                  className="w-full text-center text-xs font-bold py-2 rounded-xl bg-card border border-line text-ink hover:bg-line/40 transition-colors"
                >
                  View Applicants
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* New Job Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Campus Job Requirement">
        <form onSubmit={handleCreateJob} className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-bold text-ink block mb-1">Job Role Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Associate Backend Engineer"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-bg border border-line text-ink focus:outline-none focus:border-pri"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-ink block mb-1">Department / Team</label>
            <input
              type="text"
              placeholder="e.g. Distributed Systems"
              value={newDept}
              onChange={(e) => setNewDept(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-bg border border-line text-ink focus:outline-none focus:border-pri"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-ink block mb-1">CTC Package Offer Range</label>
            <input
              type="text"
              placeholder="e.g. ₹12 - ₹15 LPA"
              value={newCtc}
              onChange={(e) => setNewCtc(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-bg border border-line text-ink focus:outline-none focus:border-pri"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-line">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-line text-xs font-semibold text-mut hover:text-ink"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-pri text-white text-xs font-bold shadow-sm hover:opacity-95"
            >
              Publish Job Drive
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
