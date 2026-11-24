'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import { useApp } from '@/context/AppContext';
import { CalendarCheck, Clock, User, CheckCircle2, Video, MapPin } from 'lucide-react';

interface InterviewSlot {
  id: string;
  candidateName: string;
  role: string;
  time: string;
  round: string;
  room: string;
  panelist: string;
  status: 'Scheduled' | 'Completed' | 'In Progress';
}

const INITIAL_INTERVIEWS: InterviewSlot[] = [
  {
    id: 'int-1',
    candidateName: 'Divya R.',
    role: 'Data & Database Systems Engineer',
    time: '11:00 AM - 11:45 AM',
    round: 'Technical Round 1 (System Design & SQL)',
    room: 'Interview Room 3 / Virtual Bridge A',
    panelist: 'Venkatesh R. (Lead Architect)',
    status: 'In Progress',
  },
  {
    id: 'int-2',
    candidateName: 'Anita S.',
    role: 'Software Development Engineer I',
    time: '01:30 PM - 02:15 PM',
    round: 'Technical Round 2 (Algorithms & Architecture)',
    room: 'Interview Room 1 / Virtual Bridge B',
    panelist: 'Sarah Jenkins (Engineering Manager)',
    status: 'Scheduled',
  },
  {
    id: 'int-3',
    candidateName: 'Arjun K.',
    role: 'Cloud & DevOps Associate',
    time: '03:00 PM - 03:45 PM',
    round: 'Technical Deep-Dive (CI/CD & Containers)',
    room: 'Auditorium Lab 4',
    panelist: 'Michael Chang (DevOps Lead)',
    status: 'Scheduled',
  },
];

export default function InterviewSchedulePage() {
  const { showToast } = useApp();
  const [interviews, setInterviews] = useState<InterviewSlot[]>(INITIAL_INTERVIEWS);

  const handleMarkComplete = (id: string) => {
    setInterviews((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: 'Completed' } : i))
    );
    showToast('Interview marked as completed. Evaluation rubric opened.');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Interview Schedule & Assessment Panels"
        description="Coordinate real-time campus technical rounds, proctored evaluations, and panel debriefs."
        breadcrumbs={[{ label: 'Recruiter' }, { label: 'Interview Schedule' }]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Today's Interviews" value={interviews.length} trend="Active Schedule" trendPositive={true} />
        <StatCard
          label="In Progress"
          value={interviews.filter((i) => i.status === 'In Progress').length}
          trend="Panel Active"
          trendPositive={true}
        />
        <StatCard
          label="Completed Rounds"
          value={interviews.filter((i) => i.status === 'Completed').length}
          trend="Scores Recorded"
          trendPositive={true}
        />
      </div>

      <div className="bg-card border border-line rounded-2xl p-6 shadow-sm space-y-6">
        <div className="border-b border-line pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-ink">Scheduled Technical Panels · Today</h2>
            <p className="text-xs text-mut mt-0.5">
              Live interview sessions with synchronized candidate evidence dossier
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-pri/10 text-pri">
            Acme Tech Placement Drive
          </span>
        </div>

        <div className="space-y-4">
          {interviews.map((slot) => {
            const isCompleted = slot.status === 'Completed';
            const isInProgress = slot.status === 'In Progress';

            return (
              <div
                key={slot.id}
                className="p-5 rounded-xl bg-bg border border-line flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-line/80 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <b className="text-sm font-bold text-ink">{slot.candidateName}</b>
                    <span className="text-xs text-mut">· {slot.role}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isCompleted
                          ? 'bg-okt text-ok'
                          : isInProgress
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          : 'bg-card border border-line text-mut'
                      }`}
                    >
                      {slot.status}
                    </span>
                  </div>

                  <p className="text-xs text-ink font-medium">{slot.round}</p>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-mut pt-1">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock size={12} className="text-pri" />
                      {slot.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={12} className="text-mut" />
                      {slot.room}
                    </span>
                    <span className="flex items-center gap-1">
                      <User size={12} className="text-mut" />
                      Panel: {slot.panelist}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => showToast(`Launching proctored video bridge for ${slot.candidateName}`)}
                    className="text-xs font-semibold px-3.5 py-2 rounded-xl bg-card border border-line text-ink hover:bg-line/40 transition-colors flex items-center gap-1.5"
                  >
                    <Video size={14} />
                    Join Bridge
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMarkComplete(slot.id)}
                    disabled={isCompleted}
                    className={`text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm ${
                      isCompleted
                        ? 'bg-okt text-ok cursor-default'
                        : 'bg-pri text-white hover:opacity-95'
                    }`}
                  >
                    {isCompleted ? 'Finished ✓' : 'Complete Round'}
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
