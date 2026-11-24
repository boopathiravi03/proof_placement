'use client';

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import ProgressBar from '@/components/ui/ProgressBar';
import { useApp } from '@/context/AppContext';
import { api } from '@/lib/api';
import { StudentPrivacyResponse, PrivacyConsentItem } from '@/types';
import {
  ShieldCheck,
  Lock,
  Eye,
  GitBranch,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Key,
  Scale,
  UserX,
  FileSpreadsheet,
  HelpCircle,
} from 'lucide-react';

export default function PrivacyPage() {
  const { githubConnected, setGithubConnected, showToast } = useApp();
  const [privacyData, setPrivacyData] = useState<StudentPrivacyResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPrivacy = async () => {
    try {
      const data = await api.getStudentPrivacy('student-rahul-01');
      if (data) setPrivacyData(data);
    } catch (err) {
      console.warn('Error loading privacy data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrivacy();
  }, []);

  const handleToggleConsent = async (purpose: string, currentGranted: boolean) => {
    try {
      const nextGranted = !currentGranted;
      await api.updateStudentConsent('student-rahul-01', purpose, nextGranted);
      showToast(`Consent directive updated for '${purpose}': ${nextGranted ? 'Granted' : 'Revoked'}`);
      await loadPrivacy();
    } catch {
      showToast('Error updating consent directive');
    }
  };

  const handleRevokeGitHub = async () => {
    try {
      await api.revokeGitHub('student-rahul-01');
      setGithubConnected(false);
      showToast('GitHub OAuth tokens revoked pursuant to Digital Personal Data Protection (DPDP) Act.');
      await loadPrivacy();
    } catch {
      showToast('Error revoking GitHub access');
    }
  };

  const activeConsentCount = (privacyData?.consents || []).filter((c) => c.granted).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Privacy & DPDP Statutory Governance Console"
        description="Granular student consent controls compliant with the Indian Digital Personal Data Protection (DPDP) Act 2023. Revoke access or withdraw permissions anytime."
        breadcrumbs={[{ label: 'Student', href: '/student/dashboard' }, { label: 'Privacy & DPDP' }]}
      />

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="DPDP Statutory Compliance"
          value="ENFORCED"
          icon={<ShieldCheck size={18} />}
          trend="Indian DPDP Act 2023"
          trendPositive={true}
          subtitle="Consent-Gated Platform"
        />
        <StatCard
          label="Active Consent Directives"
          value={activeConsentCount}
          icon={<Key size={18} />}
          trend="Revocable Anytime"
          trendPositive={true}
          subtitle="Student-Controlled"
        />
        <StatCard
          label="GitHub OAuth Scope"
          value={privacyData?.github_consent_revoked ? 'Revoked' : 'Read-Only'}
          icon={<GitBranch size={18} />}
          trend={privacyData?.github_consent_revoked ? 'Zero Access' : 'Public Repos'}
          trendPositive={!privacyData?.github_consent_revoked}
          subtitle="Zero Write Access"
        />
        <StatCard
          label="Explainable AI Telemetry"
          value="100%"
          icon={<Eye size={18} />}
          trend="Zero Black Box"
          trendPositive={true}
          subtitle="Auditable Calculations"
        />
      </div>

      {/* DPDP Act 2023 Statutory Compliance Notice */}
      <div className="bg-card border border-line rounded-2xl p-6 shadow-sm space-y-3">
        <div className="flex items-center gap-2.5 text-pri font-bold text-sm">
          <Scale size={18} />
          <span>Digital Personal Data Protection (DPDP) Act 2023 Notice</span>
        </div>
        <p className="text-xs text-mut leading-relaxed">
          {privacyData?.dpdp_compliance_notice ||
            'ProofHire processes student information strictly as a Data Fiduciary pursuant to the Digital Personal Data Protection Act 2023. Data collection is purpose-limited to placement readiness analysis, competency verification, and recruiter discovery.'}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-line text-xs font-semibold">
          <div className="flex items-center gap-1.5 text-ok">
            <CheckCircle2 size={14} /> Right to Access
          </div>
          <div className="flex items-center gap-1.5 text-ok">
            <CheckCircle2 size={14} /> Right to Correction
          </div>
          <div className="flex items-center gap-1.5 text-ok">
            <CheckCircle2 size={14} /> Right to Erasure
          </div>
          <div className="flex items-center gap-1.5 text-ok">
            <CheckCircle2 size={14} /> Grievance Redressal
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Consent Controls */}
        <div className="bg-card border border-line rounded-2xl p-6 shadow-sm space-y-5">
          <div className="border-b border-line pb-4">
            <h2 className="text-base font-bold text-ink">Granular Student Consent Directives</h2>
            <p className="text-xs text-mut mt-0.5">
              Governs what telemetry is surfaced to matching engines and corporate recruitment partners
            </p>
          </div>

          <div className="space-y-3.5">
            {(privacyData?.consents || [
              { purpose: 'github_sync', title: 'GitHub Repository & Commit Synchronization', description: 'Read-only inspection of public commit frequency, languages, and repo statistics.', legal_basis: 'DPDP Section 6 (Explicit Consent)', granted: true },
              { purpose: 'placement_matching', title: 'Recruiter Discovery & Placement Matching', description: 'Permits verified competency sharing with verified corporate recruitment partners.', legal_basis: 'DPDP Section 6 (Explicit Consent)', granted: true },
              { purpose: 'ai_learning_path', title: 'Personalized AI Skill Remediation', description: 'Processes diagnostic assessment results to generate customized learning roadmaps.', legal_basis: 'Legitimate Use (Placement Support)', granted: true },
            ]).map((consent) => (
              <div key={consent.purpose} className="flex items-center justify-between p-4 rounded-xl bg-bg border border-line gap-4">
                <div className="space-y-1">
                  <b className="text-xs font-bold text-ink block">{consent.title}</b>
                  <p className="text-[11px] text-mut leading-tight">{consent.description}</p>
                  <span className="text-[10px] text-pri font-mono block">Basis: {consent.legal_basis}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleConsent(consent.purpose, consent.granted)}
                  className={`w-11 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer ${
                    consent.granted ? 'bg-pri' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      consent.granted ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleRevokeGitHub}
              className="w-full py-2.5 rounded-xl border border-rose-500/30 text-rose-600 hover:bg-rose-500/10 text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserX size={15} />
              Revoke All GitHub Access & Erase Tokens
            </button>
          </div>
        </div>

        {/* Explainability & Audit Log */}
        <div className="bg-card border border-line rounded-2xl p-6 shadow-sm space-y-5">
          <div className="border-b border-line pb-4">
            <h2 className="text-base font-bold text-ink">Explainability & Non-Discrimination Audit</h2>
            <p className="text-xs text-mut mt-0.5">
              Deterministic factor weights guaranteeing auditability and zero black-box scoring
            </p>
          </div>

          <div className="space-y-4">
            {[
              { label: 'Adaptive SQL Machine Assessment (17/20)', pct: 60, desc: 'Proctored algorithmic diagnostic score' },
              { label: 'Python Backend Repositories (41 Commits)', pct: 25, desc: 'Public commit frequency & consistency' },
              { label: 'DBMS Laboratory Evaluation (9/10)', pct: 15, desc: 'Institutional coursework benchmark' },
            ].map((factor) => (
              <div key={factor.label} className="p-3.5 rounded-xl bg-bg border border-line space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <b className="text-ink">{factor.label}</b>
                  <span className="text-pri font-bold font-mono">{factor.pct}%</span>
                </div>
                <ProgressBar value={factor.pct} color="primary" />
                <p className="text-[11px] text-mut">{factor.desc}</p>
              </div>
            ))}

            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
              <b className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 size={14} /> Statutory Non-Discrimination Guarantee
              </b>
              <p className="leading-relaxed">
                ProofHire algorithms operate under strict four-fifths disparate impact monitoring. No student is excluded based on protected demographic attributes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}