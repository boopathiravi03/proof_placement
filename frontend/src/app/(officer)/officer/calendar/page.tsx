'use client';

import React from 'react';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import { useApp } from '@/context/AppContext';
import { api } from '@/lib/api';
import { Calendar as CalendarIcon, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

export default function CalendarPage() {
  const { calendarClash, setCalendarClash, showToast, addTimelineItem, college } = useApp();

  const events = [
    { day: 0, company: 'Acme Tech', activity: 'Campus Presentation & PPT', time: '10:00 AM' },
    { day: 1, company: 'Acme Tech', activity: 'Proctored Assessment', time: '02:00 PM' },
    { day: 2, company: 'Gamma Labs', activity: 'Technical Interviews Round 1', time: '11:00 AM' },
    { day: calendarClash ? 2 : 3, company: 'Beta Soft', activity: 'Pre-Placement Talk', time: '11:30 AM' },
    { day: 4, company: 'Gamma Labs', activity: 'Executive HR Discussions', time: '03:00 PM' },
  ];

  const handleResolveClash = async () => {
    setCalendarClash(false);
    addTimelineItem('Operations', 'Conflict Resolved', 'Reallocated Beta Soft slot to Thursday');
    showToast('Clash resolved and logged to audit chain');
    await api.resolveClash('Beta Soft', 'Thu', `COLLEGE-${college}`);
  };

  const handleTriggerClash = () => {
    setCalendarClash(true);
    showToast('Simulated slot clash inserted.');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campus Placement Drive Calendar"
        description="Multi-company scheduling engine with automated conflict detection, room allocation, and audit-logged rescheduling."
        breadcrumbs={[{ label: 'Officer' }, { label: 'Drive Calendar' }]}
        actions={
          calendarClash ? (
            <button
              type="button"
              onClick={handleResolveClash}
              className="bg-pri text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm hover:opacity-95 transition-opacity"
            >
              Auto-Resolve Clash
            </button>
          ) : (
            <button
              type="button"
              onClick={handleTriggerClash}
              className="bg-card border border-line text-ink text-xs font-semibold px-3.5 py-2 rounded-xl hover:bg-bg transition-colors"
            >
              Simulate Drive Clash
            </button>
          )
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Active Drives This Week"
          value="3 Companies"
          trend="Acme, Gamma, Beta"
          trendPositive={true}
        />
        <StatCard
          label="Schedule Integrity"
          value={calendarClash ? '1 Clash' : 'Optimized'}
          trend={calendarClash ? 'Wednesday Overlap' : 'Zero Conflicts'}
          trendPositive={!calendarClash}
        />
        <StatCard
          label="Auditorium Utilization"
          value="78%"
          trend="Capacity Healthy"
          trendPositive={true}
        />
      </div>

      <div className="bg-card border border-line rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-4 border-b border-line pb-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="text-pri" size={18} />
            <h2 className="text-base font-bold text-ink">Drive Schedule Timeline</h2>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
              calendarClash ? 'bg-bt text-bad' : 'bg-okt text-ok'
            }`}
          >
            {calendarClash ? (
              <>
                <AlertCircle size={14} /> 1 Conflict Detected (Wednesday)
              </>
            ) : (
              <>
                <CheckCircle2 size={14} /> Schedule Conflict-Free
              </>
            )}
          </span>
        </div>

        {/* 5-Day Grid */}
        <div className="overflow-x-auto">
          <div className="min-w-[640px] grid grid-cols-5 gap-3.5">
            {DAYS.map((d, i) => {
              const dayEvents = events.filter((e) => e.day === i);
              return (
                <div key={d} className="bg-bg border border-line rounded-xl p-3.5 space-y-3 min-h-[220px]">
                  <div className="flex items-center justify-between border-b border-line pb-2">
                    <span className="text-xs font-bold text-ink">{d}</span>
                    <span className="text-[10px] text-mut font-semibold">
                      {dayEvents.length} Event{dayEvents.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  {dayEvents.map((e, idx) => {
                    const isClashItem = calendarClash && i === 2;
                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg text-xs space-y-1 border transition-all ${
                          isClashItem
                            ? 'bg-red-500/10 text-bad border-red-500/30 shadow-xs'
                            : 'bg-card text-ink border-line shadow-xs'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <b className="font-bold text-ink truncate">{e.company}</b>
                          <span className="text-[10px] text-mut flex items-center gap-0.5 font-mono">
                            <Clock size={10} />
                            {e.time}
                          </span>
                        </div>
                        <span className="text-[11px] text-mut block leading-tight">{e.activity}</span>
                      </div>
                    );
                  })}
                  {dayEvents.length === 0 && (
                    <div className="text-center py-8 text-[11px] text-mut/60 italic">
                      No slots booked
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Clash Alert & Resolution Action */}
        {calendarClash && (
          <div className="bg-amber-500/10 text-amber-700 dark:text-amber-400 text-sm font-semibold rounded-xl p-4 border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="font-bold">Autonomous Agent Suggestion:</p>
              <p className="text-xs font-normal opacity-90">
                Reschedule Beta Soft presentation from Wednesday to Thursday morning. Auditorium A is vacant and conflict will be resolved with zero overlap.
              </p>
            </div>
            <button
              type="button"
              onClick={handleResolveClash}
              className="bg-pri text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm hover:opacity-95 transition-opacity shrink-0"
            >
              Accept Reallocation
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
