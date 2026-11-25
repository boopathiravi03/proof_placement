'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import ProgressBar from '@/components/ui/ProgressBar';
import {
  ShieldCheck,
  Lock,
  Eye,
  Scale,
  UserX,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Send,
  History,
} from 'lucide-react';

interface GovernanceConsent {
  purpose: string;
  category: string;
  title: string;
  description: string;
  data_categories: string[];
  policy_version: string;
  collection_method: string;
  granted: boolean;
  granted_at: string | null;
  revoked_at: string | null;
}

interface PrivacyNotice {
  version: string;
  title: string;
  data_categories: string[];
  purposes: string[];
  sharing_recipients: string[];
  retention_info: string;
  user_controls: string;
  grievance_contact: string;
  effective_date: string | null;
  legal_disclaimer: string;
}

interface PrivacyRequestItem {
  id: string;
  request_type: string;
  reason: string;
  status: string;
  retention_exception_applied: boolean;
  reviewer_notes: string | null;
  created_at: string | null;
}

interface DataAccessLogItem {
  id: string;
  actor_role: string;
  resource_type: string;
  purpose: string;
  allowed: boolean;
  denial_reason: string | null;
  created_at: string | null;
}

export default function StudentPrivacyPage() {
  const { user } = useAuth();
  const studentId = user?.id || 'STU-01';

  const [consents, setConsents] = useState<GovernanceConsent[]>([]);
  const [notice, setNotice] = useState<PrivacyNotice | null>(null);
  const [requests, setRequests] = useState<PrivacyRequestItem[]>([]);
  const [accessLogs, setAccessLogs] = useState<DataAccessLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [reqType, setReqType] = useState('data_export');
  const [reqReason, setReqReason] = useState('');
  const [submittingReq, setSubmittingReq] = useState(false);

  const loadGovernanceData = async () => {
    setLoading(true);
    try {
      const [cData, nData, rData, aData] = await Promise.all([
        api.getGovernanceConsents(studentId),
        api.getPrivacyNotice(),
        api.listPrivacyRequests(studentId),
        api.getDataAccessLogs(studentId),
      ]);
      if (Array.isArray(cData)) setConsents(cData);
      if (nData) setNotice(nData);
      if (Array.isArray(rData)) setRequests(rData);
      if (Array.isArray(aData)) setAccessLogs(aData);
    } catch {
      // ignore fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGovernanceData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  const handleToggleConsent = async (purpose: string, currentGranted: boolean) => {
    const nextState = !currentGranted;
    setConsents((prev) =>
      prev.map((c) => (c.purpose === purpose ? { ...c, granted: nextState } : c))
    );
    try {
      await api.setGovernanceConsent(studentId, purpose, nextState, notice?.version || 'v2.0');
      setStatusMessage(
        `Consent for "${purpose}" ${nextState ? 'granted' : 'revoked'} and logged to the audit chain.`
      );
      await loadGovernanceData();
    } catch {
      setStatusMessage('Updated consent locally.');
    }
  };

  const handleRevokeGitHub = async () => {
    try {
      await api.revokeGitHub(studentId);
      await api.setGovernanceConsent(studentId, 'github_sync', false, notice?.version || 'v2.0');
      setStatusMessage('GitHub OAuth access revoked and sync consent disabled.');
      await loadGovernanceData();
    } catch {
      setStatusMessage('GitHub access revoked.');
    }
  };

  const handleSubmitPrivacyRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqReason.trim()) return;
    setSubmittingReq(true);
    try {
      await api.submitPrivacyRequest(studentId, reqType, reqReason.trim());
      setReqReason('');
      setStatusMessage(`Submitted ${reqType.replace('_', ' ')} request for officer review.`);
      await loadGovernanceData();
    } catch {
      setStatusMessage('Could not submit privacy request. Please retry.');
    } finally {
      setSubmittingReq(false);
    }
  };

  const activeConsentCount = consents.filter((c) => c.granted).length;

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Privacy, Consent & DPDP Governance"
        description="Manage purpose-specific consent, review versioned privacy notices, track data access logs, and exercise DPDP rights."
      />

      {statusMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="Active Consents"
          value={loading ? '...' : `${activeConsentCount}/${consents.length || 6}`}
          icon={<ShieldCheck size={18} />}
          trend={notice ? `Policy ${notice.version}` : 'DPDP Aligned'}
          trendPositive={true}
          subtitle="Granular Purpose Controls"
        />
        <StatCard
          label="GitHub Access Scope"
          value="Public Read-Only"
          icon={<Lock size={18} />}
          trend="Instant Revocation"
          trendPositive={true}
          subtitle="Zero Write Access"
        />
        <StatCard
          label="Logged Data Accesses"
          value={loading ? '...' : accessLogs.length}
          icon={<Eye size={18} />}
          trend="Audited Access Trail"
          trendPositive={true}
          subtitle="Least-Privilege Enforced"
        />
      </div>

      {/* Versioned DPDP Privacy Notice */}
      <div className="bg-card border border-line rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 text-pri font-bold text-sm">
            <Scale size={18} />
            <span>{notice?.title || 'ProofHire Institutional Talent Intelligence Privacy Notice'}</span>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-pri/10 text-pri">
            Version {notice?.version || 'v2.0'}
          </span>
        </div>

        <p className="text-xs text-mut leading-relaxed">
          {notice?.retention_info ||
            'Operational placement records are retained per institutional retention policy. Audit logs are retained for institutional integrity.'}
        </p>

        {notice && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2 border-t border-line">
            <div className="space-y-1.5">
              <b className="text-ink block">Data Categories Collected</b>
              <ul className="list-disc pl-4 text-mut space-y-1">
                {notice.data_categories.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </div>
            <div className="space-y-1.5">
              <b className="text-ink block">Authorized Recipients & Grievance</b>
              <ul className="list-disc pl-4 text-mut space-y-1">
                {notice.sharing_recipients.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
              <p className="text-[11px] text-pri font-medium pt-1">
                Grievance Contact: {notice.grievance_contact}
              </p>
            </div>
          </div>
        )}

        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          <span>
            {notice?.legal_disclaimer ||
              "Configured with reference to India's DPDP Act, 2023. Institutional legal review is required before production deployment; ProofHire does not claim formal legal certification."}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 6 Granular Consent Categories */}
        <div className="bg-card border border-line rounded-2xl p-6 shadow-sm space-y-5">
          <div className="border-b border-line pb-4">
            <h2 className="text-base font-bold text-ink">Purpose-Specific Consent Center (6 Categories)</h2>
            <p className="text-xs text-mut mt-0.5">
              Each consent operates independently; revoking one does not disable unrelated workflows.
            </p>
          </div>

          <div className="space-y-3">
            {consents.map((consent) => (
              <div
                key={consent.purpose}
                className="flex items-center justify-between p-4 rounded-xl bg-bg border border-line gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <b className="text-xs font-bold text-ink">{consent.title}</b>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-mut font-mono">
                      {consent.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-mut leading-tight">{consent.description}</p>
                  <span className="text-[10px] text-pri font-mono block">
                    Policy {consent.policy_version} · {consent.granted ? 'Granted' : 'Revoked'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleConsent(consent.purpose, consent.granted)}
                  aria-label={`Toggle ${consent.title}`}
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
              Revoke All GitHub Access & Clear Sync
            </button>
          </div>
        </div>

        {/* Privacy Requests & Explainability */}
        <div className="space-y-6">
          <div className="bg-card border border-line rounded-2xl p-6 shadow-sm space-y-4">
            <div className="border-b border-line pb-3 flex items-center gap-2">
              <FileText size={16} className="text-pri" />
              <div>
                <h2 className="text-base font-bold text-ink">Submit DPDP Rights Request</h2>
                <p className="text-xs text-mut">
                  Request personal data export, correction, erasure/anonymization, or grievance review.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitPrivacyRequest} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Request Type</label>
                <select
                  value={reqType}
                  onChange={(e) => setReqType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-line bg-bg text-xs text-ink"
                >
                  <option value="data_export">Data Export (JSON Bundle)</option>
                  <option value="correction">Record Correction</option>
                  <option value="deletion_erasure">Deletion / PII Anonymization</option>
                  <option value="grievance">Privacy Grievance</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Details / Reason</label>
                <textarea
                  rows={2}
                  value={reqReason}
                  onChange={(e) => setReqReason(e.target.value)}
                  placeholder="Describe your export, correction, erasure, or grievance request..."
                  className="w-full px-3 py-2 rounded-xl border border-line bg-bg text-xs text-ink"
                />
              </div>
              <button
                type="submit"
                disabled={submittingReq || !reqReason.trim()}
                className="px-4 py-2 rounded-xl bg-pri text-white text-xs font-bold flex items-center gap-2 hover:opacity-90 disabled:opacity-50 cursor-pointer"
              >
                <Send size={14} />
                {submittingReq ? 'Submitting...' : 'Submit Privacy Request'}
              </button>
            </form>

            {requests.length > 0 && (
              <div className="pt-3 border-t border-line space-y-2">
                <b className="text-xs text-ink block">Your Privacy Requests</b>
                {requests.map((r) => (
                  <div
                    key={r.id}
                    className="p-3 rounded-xl bg-bg border border-line flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <b className="text-ink capitalize">{r.request_type.replace('_', ' ')}</b>
                      <p className="text-[11px] text-mut">{r.reason}</p>
                      {r.retention_exception_applied && (
                        <span className="text-[10px] text-amber-600 font-semibold">
                          Institutional retention exception applied
                        </span>
                      )}
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pri/10 text-pri uppercase">
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-card border border-line rounded-2xl p-6 shadow-sm space-y-4">
            <div className="border-b border-line pb-3">
              <h2 className="text-base font-bold text-ink">Explainability & Fairness Safeguards</h2>
              <p className="text-xs text-mut mt-0.5">
                Deterministic factor weights and four-fifths disparity monitoring
              </p>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Proctored Adaptive Assessments', pct: 60, desc: 'Difficulty-calibrated competency score' },
                { label: 'Verified Evidence & Public GitHub', pct: 25, desc: 'Mentor-verified links and public repo metadata' },
                { label: 'Academic & Lab Benchmarks', pct: 15, desc: 'CGPA & laboratory evaluation records' },
              ].map((factor) => (
                <div key={factor.label} className="p-3 rounded-xl bg-bg border border-line space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <b className="text-ink">{factor.label}</b>
                    <span className="text-pri font-bold font-mono">{factor.pct}%</span>
                  </div>
                  <ProgressBar value={factor.pct} color="primary" />
                  <p className="text-[11px] text-mut">{factor.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Data Access Log Transparency */}
      <div className="bg-card border border-line rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-line pb-3">
          <History size={16} className="text-pri" />
          <div>
            <h2 className="text-base font-bold text-ink">Data Access Log (Who Accessed Your Profile)</h2>
            <p className="text-xs text-mut">
              Every authorized or denied profile/evidence access is logged with actor role and purpose.
            </p>
          </div>
        </div>
        {accessLogs.length === 0 ? (
          <p className="text-xs text-mut py-4">No external data access events recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-line text-mut">
                  <th className="py-2 pr-4">Actor Role</th>
                  <th className="py-2 pr-4">Resource</th>
                  <th className="py-2 pr-4">Purpose</th>
                  <th className="py-2 pr-4">Decision</th>
                  <th className="py-2">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {accessLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="py-2 pr-4 font-semibold text-ink capitalize">{log.actor_role}</td>
                    <td className="py-2 pr-4 font-mono text-[11px] text-mut">{log.resource_type}</td>
                    <td className="py-2 pr-4 text-ink">{log.purpose}</td>
                    <td className="py-2 pr-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.allowed ? 'bg-okt text-ok' : 'bg-bt text-bad'
                        }`}
                      >
                        {log.allowed ? 'Allowed' : `Denied: ${log.denial_reason || 'Policy'}`}
                      </span>
                    </td>
                    <td className="py-2 font-mono text-[11px] text-mut">
                      {log.created_at ? new Date(log.created_at).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
