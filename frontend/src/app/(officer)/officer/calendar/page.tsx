'use client';

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import { useApp } from '@/context/AppContext';
import { api } from '@/lib/api';
import { Calendar as CalendarIcon, AlertCircle, CheckCircle2, Clock, Plus, Mail, Send, X } from 'lucide-react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

export default function CalendarPage() {
  const { calendarClash, setCalendarClash, showToast, addTimelineItem, college } = useApp();
  const collegeId = `COLLEGE-${college}`;

  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('Software & Cloud');
  const [jobTitle, setJobTitle] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [minCgpa, setMinCgpa] = useState('7.0');
  const [driveDay, setDriveDay] = useState('Thu');
  const [driveRoom, setDriveRoom] = useState('Auditorium B');

  const [audienceFilter, setAudienceFilter] = useState('cohort');
  const [templateType, setTemplateType] = useState('drive_announcement');
  const [commDriveTitle, setCommDriveTitle] = useState('Acme Tech Backend Drive');
  const [commPreview, setCommPreview] = useState<{ recipient_count: number; subject: string; body: string; provider_mode: string } | null>(null);
  const [commLogs, setCommLogs] = useState<any[]>([]);

  useEffect(() => {
    api.getCommunicationLogs(collegeId).then((logs) => {
      if (logs) setCommLogs(logs);
    });
  }, [collegeId]);

  const handleCreateDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !jobTitle.trim()) return;
    const comp = await api.createCompany({ name: companyName.trim(), industry, college_id: collegeId });
    if (!comp) return;
    const job = await api.createJobOpportunity({
      company_id: comp.id,
      title: jobTitle.trim(),
      description: jobDesc.trim() || 'Python, SQL, and Git required.',
      min_cgpa: Number(minCgpa) || 7.0,
      college_id: collegeId,
    });
    if (!job) return;
    const drv = await api.createCampusDrive({
      college_id: collegeId,
      company_id: comp.id,
      job_role_id: job.id,
      title: `${comp.name} — ${job.title}`,
      day_of_week: driveDay,
      room: driveRoom,
      publish_immediately: true,
    });
    if (drv) {
      showToast(`Published drive: ${drv.title} (${driveDay})`);
      setIsDriveModalOpen(false);
      setCompanyName('');
      setJobTitle('');
      setJobDesc('');
    }
  };

  const handlePreviewComm = async () => {
    const res = await api.previewBulkEmail({
      college_id: collegeId,
      audience_filter: audienceFilter,
      template_type: templateType,
      drive_title: commDriveTitle,
    });
    if (res) setCommPreview(res);
  };

  const handleSendComm = async () => {
    const res = await api.sendBulkCommunication({
      college_id: collegeId,
      audience_filter: audienceFilter,
      template_type: templateType,
      drive_title: commDriveTitle,
    });
    if (res) {
      showToast(`${res.status}: ${res.recipient_count} recipient(s) (${res.provider_mode})`);
      const logs = await api.getCommunicationLogs(collegeId);
      if (logs) setCommLogs(logs);
    }
  };

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

      {/* Phase 6: Campus Drive Creation & Bulk Communication Workspace */}
      <div className="bg-card border border-line rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-4">
          <div>
            <h2 className="text-base font-bold text-ink flex items-center gap-2">
              <Mail size={18} className="text-pri" />
              Drive Publishing & Bulk Communications
            </h2>
            <p className="text-xs text-mut mt-0.5">
              Create & publish campus drives, preview eligible recipients, and dispatch templates (SMTP or clearly labelled simulated preview).
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsDriveModalOpen(true)}
            className="bg-pri text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs hover:opacity-95 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <Plus size={14} /> Create & Publish Drive
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-ink block">Audience Segment</label>
            <select
              value={audienceFilter}
              onChange={(e) => setAudienceFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-bg border border-line text-ink"
            >
              <option value="cohort">Entire College Cohort</option>
              <option value="eligible">Eligible Students Only</option>
              <option value="applicants">Drive Applicants</option>
              <option value="shortlisted">Shortlisted Candidates</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="font-bold text-ink block">Email Template</label>
            <select
              value={templateType}
              onChange={(e) => setTemplateType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-bg border border-line text-ink"
            >
              <option value="drive_announcement">New Drive Announcement</option>
              <option value="deadline_reminder">Deadline Reminder</option>
              <option value="assessment_schedule">Assessment Schedule</option>
              <option value="interview_schedule">Interview Schedule</option>
              <option value="selection_update">Selection Update</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="font-bold text-ink block">Drive Title</label>
            <input
              type="text"
              value={commDriveTitle}
              onChange={(e) => setCommDriveTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-bg border border-line text-ink"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handlePreviewComm}
            className="px-4 py-2 rounded-xl bg-bg border border-line text-ink text-xs font-bold hover:border-pri/40 cursor-pointer"
          >
            Preview Recipients & Message
          </button>
          <button
            type="button"
            onClick={handleSendComm}
            className="px-4 py-2 rounded-xl bg-pri text-white text-xs font-bold hover:opacity-95 flex items-center gap-1.5 cursor-pointer"
          >
            <Send size={13} /> Send / Log Communication
          </button>
        </div>

        {commPreview && (
          <div className="p-4 rounded-xl bg-bg border border-line space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <b className="text-ink">Preview: {commPreview.subject}</b>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-pri/10 text-pri font-mono">
                {commPreview.recipient_count} recipient(s) · {commPreview.provider_mode}
              </span>
            </div>
            <p className="text-mut">{commPreview.body}</p>
          </div>
        )}

        {commLogs.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-line">
            <h3 className="text-xs font-bold text-ink uppercase tracking-wider">Recent Delivery Logs</h3>
            <div className="space-y-1.5">
              {commLogs.slice(0, 4).map((l) => (
                <div key={l.id} className="p-2.5 rounded-xl bg-bg border border-line flex justify-between items-center text-xs">
                  <span className="font-semibold text-ink">{l.subject}</span>
                  <span className="text-[11px] font-mono text-mut">
                    {l.recipient_count} recipients · {l.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create & Publish Drive Modal */}
      {isDriveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-card border border-line rounded-3xl p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-base font-bold text-ink">Create & Publish Campus Drive</h3>
              <button type="button" onClick={() => setIsDriveModalOpen(false)} className="p-1 text-mut hover:text-ink cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateDrive} className="space-y-3 text-xs">
              <input
                type="text"
                required
                placeholder="Company Name (e.g. Delta Systems)"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-bg border border-line text-ink"
              />
              <input
                type="text"
                required
                placeholder="Job Title (e.g. Full Stack Engineer)"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-bg border border-line text-ink"
              />
              <textarea
                rows={2}
                placeholder="Job Description (skills auto-extracted for review)"
                value={jobDesc}
                onChange={(e) => setJobDesc(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-bg border border-line text-ink"
              />
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={minCgpa}
                  onChange={(e) => setMinCgpa(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-bg border border-line text-ink"
                  placeholder="Min CGPA"
                />
                <select value={driveDay} onChange={(e) => setDriveDay(e.target.value)} className="px-3 py-2 rounded-xl bg-bg border border-line text-ink">
                  {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                <input
                  type="text"
                  value={driveRoom}
                  onChange={(e) => setDriveRoom(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-bg border border-line text-ink"
                  placeholder="Room"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsDriveModalOpen(false)} className="px-4 py-2 rounded-xl text-mut cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-pri text-white font-bold cursor-pointer">Publish Drive</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
