'use client';

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import { useApp } from '@/context/AppContext';
import { api } from '@/lib/api';
import { StudentDriveItem } from '@/types';
import {
  Briefcase,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  HelpCircle,
  Send,
  Calendar,
  Building2,
  MapPin,
  X,
  FileText,
  AlertTriangle,
} from 'lucide-react';

export default function StudentDrivesPage() {
  const { showToast, addTimelineItem } = useApp();
  const [drives, setDrives] = useState<StudentDriveItem[]>([]);
  const [selectedDriveId, setSelectedDriveId] = useState<string>('drive-acme');
  const [loading, setLoading] = useState(true);

  // Appeal Modal
  const [isAppealModalOpen, setIsAppealModalOpen] = useState(false);
  const [appealReason, setAppealReason] = useState('');
  const [isSubmittingAppeal, setIsSubmittingAppeal] = useState(false);

  const loadDrives = async () => {
    try {
      const data = await api.getStudentDrives('student-rahul-01');
      if (data && data.length > 0) {
        setDrives(data);
        if (!selectedDriveId || !data.some((d) => d.id === selectedDriveId)) {
          setSelectedDriveId(data[0].id);
        }
      }
    } catch (err) {
      console.warn('Error loading drives:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrives();
  }, []);

  const currentDrive = drives.find((d) => d.id === selectedDriveId) || drives[0];

  const handleApply = async (driveId: string, company: string) => {
    try {
      await api.applyToDrive('student-rahul-01', driveId);
      showToast(`Application successfully submitted to ${company}!`);
      await loadDrives();
    } catch {
      showToast('Error applying to placement drive');
    }
  };

  const handleAppealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appealReason.trim() || !currentDrive) return;

    setIsSubmittingAppeal(true);
    try {
      await api.appealDriveDecision('student-rahul-01', currentDrive.id, appealReason.trim());
      addTimelineItem('Operations', 'Appeal Lodged', `Human appeal filed for ${currentDrive.company_name}`);
      showToast(`Appeal registered with T&P Placement Officer for ${currentDrive.company_name}`);
      setIsAppealModalOpen(false);
      setAppealReason('');
      await loadDrives();
    } catch {
      showToast('Error submitting appeal');
    } finally {
      setIsSubmittingAppeal(false);
    }
  };

  const eligibleCount = drives.filter((d) => d.eligible).length;
  const appliedCount = drives.filter((d) => d.applied).length;

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
          value={drives.length}
          icon={<Briefcase size={18} />}
          trend="Currently Scheduled"
          trendPositive={true}
          subtitle="Recruitment Season"
        />
        <StatCard
          label="Eligible Positions"
          value={eligibleCount}
          icon={<ShieldCheck size={18} />}
          trend={`${eligibleCount}/${drives.length} Qualified`}
          trendPositive={eligibleCount > 0}
          subtitle="Criteria Verified"
        />
        <StatCard
          label="Applications Submitted"
          value={appliedCount}
          icon={<FileCheck size={18} />}
          trend={appliedCount > 0 ? 'Active in Pipeline' : 'Pending Action'}
          trendPositive={appliedCount > 0}
          subtitle="Drive Submissions"
        />
        <StatCard
          label="Human Appeal Right"
          value="GUARANTEED"
          icon={<HelpCircle size={18} />}
          trend="DPDP Compliant"
          trendPositive={true}
          subtitle="Zero Auto-Rejections"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Drive Selection List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-ink uppercase tracking-wider">Scheduled Drives</h2>
            <span className="text-[11px] text-mut">{drives.length} Companies</span>
          </div>

          <div className="space-y-2.5">
            {drives.map((d) => {
              const isSelected = d.id === selectedDriveId;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setSelectedDriveId(d.id)}
                  className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-card border-pri shadow-sm'
                      : 'bg-card border-line hover:border-line/80'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="space-y-0.5">
                      <b className="text-sm font-bold text-ink block">{d.company_name}</b>
                      <p className="text-xs text-mut">{d.role}</p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        d.eligible
                          ? 'bg-okt text-ok border border-ok/20'
                          : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {d.eligible ? 'Eligible' : 'Prereq Gap'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-line mt-3 text-xs text-mut">
                    <span className="font-bold text-ink">{d.package_ctc}</span>
                    <span className="flex items-center gap-1 font-mono text-[11px]">
                      <Calendar size={12} /> {d.drive_date}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Drive Detail & Adjudication Panel */}
        <div className="lg:col-span-2 space-y-6">
          {currentDrive ? (
            <div className="bg-card border border-line rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              {/* Drive Details Header */}
              <div className="border-b border-line pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-ink">{currentDrive.company_name}</h2>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        currentDrive.eligible
                          ? 'bg-okt text-ok border border-ok/20'
                          : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {currentDrive.eligible ? 'Eligible for Drive' : 'Criteria Gap Detected'}
                    </span>
                  </div>
                  <p className="text-xs text-mut font-medium">{currentDrive.role} · {currentDrive.location}</p>
                  <div className="flex items-center gap-4 text-xs font-semibold text-ink pt-1">
                    <span>Package: <b className="text-pri">{currentDrive.package_ctc}</b></span>
                    <span>•</span>
                    <span>Date: <b className="font-mono">{currentDrive.drive_date}</b></span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {currentDrive.eligible ? (
                    <button
                      type="button"
                      disabled={currentDrive.applied}
                      onClick={() => handleApply(currentDrive.id, currentDrive.company_name)}
                      className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        currentDrive.applied
                          ? 'bg-okt text-ok border border-ok/20 cursor-default'
                          : 'bg-pri text-white shadow-xs hover:opacity-95 cursor-pointer'
                      }`}
                    >
                      {currentDrive.applied ? 'Application Submitted ✓' : 'Submit Application'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsAppealModalOpen(true)}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500 text-white shadow-xs hover:opacity-95 transition-opacity flex items-center gap-1.5 cursor-pointer"
                    >
                      <HelpCircle size={14} />
                      {currentDrive.appeal_status ? 'Appeal Pending Review' : 'Lodge Human Appeal'}
                    </button>
                  )}
                </div>
              </div>

              {/* Required Skills Matrix */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold text-ink uppercase tracking-wider">
                  Mandatory Competency Prerequisites
                </h3>
                <div className="flex flex-wrap gap-2">
                  {currentDrive.required_skills.map((sk) => (
                    <span
                      key={sk}
                      className="px-3 py-1.5 rounded-xl bg-bg border border-line text-xs font-semibold text-ink"
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              </div>

              {/* Transparent Eligibility Audit Criteria */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-ink uppercase tracking-wider">
                  Deterministic Eligibility Audit Results
                </h3>

                <div className="space-y-2">
                  {currentDrive.eligibility_reasons.passed_criteria.map((crit, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-bg border border-ok/20 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-ok shrink-0" />
                        <span className="font-semibold text-ink">{crit}</span>
                      </div>
                      <span className="text-[10px] font-bold text-ok uppercase">Passed</span>
                    </div>
                  ))}

                  {currentDrive.eligibility_reasons.failed_criteria.map((crit, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-bg border border-rose-500/20 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <AlertCircle size={16} className="text-rose-500 shrink-0" />
                        <span className="font-semibold text-ink">{crit}</span>
                      </div>
                      <span className="text-[10px] font-bold text-rose-600 uppercase">Failed Criteria</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Human Appeal Rights Assurance */}
              <div className="p-4 rounded-xl bg-bg border border-line text-xs text-mut space-y-1">
                <b className="text-ink flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-ok" />
                  Statutory Right to Human Adjudication
                </b>
                <p className="leading-relaxed">
                  Students disqualified by automated rules can file an appeal with the institutional Training & Placement Officer. ProofHire strictly prohibits irreversible black-box exclusions.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-xs text-mut italic bg-card border border-line rounded-3xl">
              Select a campus placement drive to review requirements and eligibility.
            </div>
          )}
        </div>
      </div>

      {/* Appeal Submission Modal */}
      {isAppealModalOpen && currentDrive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-card border border-line rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <h3 className="text-base font-bold text-ink">Lodge Placement Appeal</h3>
                <p className="text-xs text-mut mt-0.5">Appealing eligibility for {currentDrive.company_name}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAppealModalOpen(false)}
                className="p-1 rounded-lg text-mut hover:text-ink hover:bg-bg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAppealSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink">Appeal Ground / Rectification Details</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Explain cleared academic backlogs, newly verified competencies, or documentation errors for the Placement Officer to review..."
                  value={appealReason}
                  onChange={(e) => setAppealReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-bg border border-line text-ink text-xs focus:outline-hidden focus:border-pri"
                />
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-800 dark:text-amber-300">
                <b>Institutional Protocol:</b> Your appeal will be routed to the T&P Placement Officer for review. A formal determination will be logged in the immutable audit ledger.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAppealModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-mut hover:text-ink hover:bg-bg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAppeal || !appealReason.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-pri text-white shadow-xs hover:opacity-95 disabled:opacity-50"
                >
                  {isSubmittingAppeal ? 'Filing Appeal...' : 'Submit Appeal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}