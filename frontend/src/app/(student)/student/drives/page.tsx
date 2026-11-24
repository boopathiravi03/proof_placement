'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import { useApp } from '@/context/AppContext';
import { api } from '@/lib/api';
import { Briefcase, ShieldCheck, CheckCircle2, AlertCircle, FileCheck, HelpCircle, Send } from 'lucide-react';

const STATES = ['Claimed', 'Observed', 'Evidence-linked', 'Assessed', 'Verified'];

interface DriveInfo {
  id: string;
  company: string;
  role: string;
  ctc: string;
  deadline: string;
  status: 'Not Eligible' | 'Eligible';
  rules: { label: string; value: string; pass: boolean }[];
}

export default function StudentDrivesPage() {
  const { skills, appealed, setAppealed, showToast, addTimelineItem } = useApp();
  const isSqlVerified = skills.SQL === 4;

  const [selectedDriveId, setSelectedDriveId] = useState('drive-acme');

  const DRIVES: DriveInfo[] = [
    {
      id: 'drive-acme',
      company: 'Acme Tech',
      role: 'Backend Systems Developer',
      ctc: '₹14 LPA',
      deadline: '2026-12-15',
      status: 'Not Eligible',
      rules: [
        { label: 'CGPA ≥ 7.0', value: 'Student Value: 7.8', pass: true },
        { label: 'Active Academic Backlogs = 0', value: 'Student Value: 1 Active Backlog (Maths III)', pass: false },
        {
          label: 'SQL Verified Competency',
          value: `Student Value: ${STATES[skills.SQL || 0]}`,
          pass: isSqlVerified,
        },
      ],
    },
    {
      id: 'drive-gamma',
      company: 'Gamma Labs',
      role: 'Associate Software Engineer',
      ctc: '₹11 LPA',
      deadline: '2026-12-22',
      status: 'Eligible',
      rules: [
        { label: 'CGPA ≥ 6.5', value: 'Student Value: 7.8', pass: true },
        { label: 'Python or Git Evidence-Linked', value: `Student Value: Python (${STATES[skills.Python || 0]})`, pass: true },
        { label: 'No Disciplinary Records', value: 'Clean Student Record', pass: true },
      ],
    },
    {
      id: 'drive-beta',
      company: 'Beta Soft',
      role: 'Cloud Operations Trainee',
      ctc: '₹9.5 LPA',
      deadline: '2026-12-28',
      status: 'Eligible',
      rules: [
        { label: 'CGPA ≥ 6.0', value: 'Student Value: 7.8', pass: true },
        { label: 'Git Competency Observed', value: `Student Value: Git (${STATES[skills.Git || 0]})`, pass: true },
      ],
    },
  ];

  const currentDrive = DRIVES.find((d) => d.id === selectedDriveId) || DRIVES[0];

  const handleAppeal = async () => {
    setAppealed(true);
    addTimelineItem('Operations', 'Appeal Lodged', `Human appeal filed for ${currentDrive.company}`);
    showToast(`Appeal registered with T&P Placement Officer for ${currentDrive.company}`);
    await api.submitAppeal(
      'decision-rahul-01',
      'student-rahul-01',
      'Backlog cleared in special exam; database credentials submitted for review.'
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Placement Drive Eligibility & Adjudication"
        description="Versioned criteria analysis and non-discriminatory human appeal adjudication. AI never issues irreversible automated rejections."
        breadcrumbs={[{ label: 'Student', href: '/student/dashboard' }, { label: 'Campus Drives' }]}
      />

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Campus Drives"
          value={DRIVES.length}
          icon={<Briefcase size={18} />}
          trend="Currently Scheduled"
          trendPositive={true}
          subtitle="Tier-1 & Tier-2"
        />
        <StatCard
          label="Eligible Positions"
          value={DRIVES.filter((d) => d.status === 'Eligible').length}
          icon={<CheckCircle2 size={18} />}
          trend="Direct Applications"
          trendPositive={true}
          subtitle="Criteria Fully Met"
        />
        <StatCard
          label="Deterministic Auditing"
          value="v3.2 Rules"
          icon={<ShieldCheck size={18} />}
          trend="Versioned Engine"
          trendPositive={true}
          subtitle="Snapshot Enforced"
        />
        <StatCard
          label="Human Appeals Queue"
          value={appealed ? '1 Under Review' : '0 Pending'}
          icon={<HelpCircle size={18} />}
          trend={appealed ? 'T&P Officer Reviewing' : 'No Active Disputes'}
          trendPositive={!appealed}
          subtitle="Non-Automated"
        />
      </div>

      {/* Drive Selectors */}
      <div className="flex gap-2 border-b border-line pb-3 overflow-x-auto">
        {DRIVES.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => setSelectedDriveId(d.id)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              selectedDriveId === d.id
                ? 'bg-pri text-white shadow-sm'
                : 'bg-card border border-line text-mut hover:text-ink'
            }`}
          >
            {d.company} · {d.role}
          </button>
        ))}
      </div>

      {/* Drive Details Card */}
      <div className="bg-card border border-line rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 max-w-3xl">
        <div className="flex justify-between items-start flex-wrap gap-4 border-b border-line pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-ink">{currentDrive.company}</h2>
              <span className="text-xs font-bold text-pri bg-pri/10 px-2 py-0.5 rounded-md">
                {currentDrive.ctc}
              </span>
            </div>
            <p className="text-xs text-mut font-medium">
              Role: {currentDrive.role} · Application Deadline: {currentDrive.deadline}
            </p>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              currentDrive.status === 'Eligible'
                ? 'bg-okt text-ok border border-ok/20'
                : 'bg-bt text-bad border border-bad/20'
            }`}
          >
            {currentDrive.status}
          </span>
        </div>

        {/* Evaluation Criteria Checklist */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-ink uppercase tracking-wider block">
            Eligibility Evaluation Parameters (Versioned Rules v3):
          </span>
          {currentDrive.rules.map((r, i) => (
            <div
              key={i}
              className="flex gap-3.5 items-center p-4 rounded-xl bg-bg border border-line"
            >
              <span
                className={`w-7 h-7 rounded-full grid place-items-center text-xs font-bold shrink-0 ${
                  r.pass ? 'bg-okt text-ok border border-ok/20' : 'bg-bt text-bad border border-bad/20'
                }`}
              >
                {r.pass ? '✓' : '✕'}
              </span>
              <div className="space-y-0.5">
                <b className="text-xs font-bold text-ink block">{r.label}</b>
                <span className="text-[11px] text-mut">{r.value}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Appeal or Apply Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t border-line">
          <p className="text-xs text-mut max-w-md leading-relaxed">
            AI never issues automated rejections. Input values and rule versions are permanently snapshotted for human-in-the-loop audit.
          </p>

          {currentDrive.status === 'Eligible' ? (
            <button
              type="button"
              onClick={() => showToast(`Application submitted for ${currentDrive.company}`)}
              className="bg-pri text-white font-bold text-xs px-5 py-3 rounded-xl shadow-sm hover:opacity-95 transition-opacity shrink-0 cursor-pointer"
            >
              Submit Application Dossier
            </button>
          ) : (
            <button
              type="button"
              onClick={handleAppeal}
              disabled={appealed}
              className={`text-xs font-bold px-5 py-3 rounded-xl transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                appealed
                  ? 'bg-line text-mut cursor-default'
                  : 'bg-pri text-white shadow-sm hover:opacity-95'
              }`}
            >
              {appealed ? (
                <>
                  <CheckCircle2 size={14} className="text-ok" />
                  Appeal Lodged with Placement Officer
                </>
              ) : (
                <>
                  <Send size={13} />
                  Submit Human Appeal to T&P Officer
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
