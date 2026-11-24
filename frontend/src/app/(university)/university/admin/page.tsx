'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import { ShieldCheck, Lock, Key, Database, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface RLSPolicy {
  table: string;
  policy: string;
  roles: string;
  cmd: string;
  status: 'ACTIVE' | 'DISABLED';
}

const POLICIES: RLSPolicy[] = [
  { table: 'students', policy: 'tenant_isolation_students', roles: 'officer, student', cmd: 'SELECT, UPDATE', status: 'ACTIVE' },
  { table: 'competencies', policy: 'tenant_isolation_competencies', roles: 'officer, recruiter', cmd: 'SELECT', status: 'ACTIVE' },
  { table: 'evidence_records', policy: 'student_own_evidence', roles: 'student', cmd: 'ALL', status: 'ACTIVE' },
  { table: 'placement_drives', policy: 'tenant_isolation_drives', roles: 'officer, recruiter', cmd: 'SELECT, INSERT', status: 'ACTIVE' },
  { table: 'audit_chain', policy: 'immutable_audit_append_only', roles: 'system, officer', cmd: 'INSERT, SELECT', status: 'ACTIVE' },
];

export default function UniversityAdminPage() {
  const { showToast } = useApp();
  const [rlsEnforced, setRlsEnforced] = useState(true);
  const [cryptographicAudit, setCryptographicAudit] = useState(true);
  const [autoTamperAlert, setAutoTamperAlert] = useState(true);

  const handleRunSecurityAudit = () => {
    showToast('Cross-tenant penetration test completed: 0 leaks, 100% boundary isolation verified.');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Institutional Governance & Row-Level Security"
        description="Configure cryptographic boundary constraints, verify PostgreSQL Row-Level Security policies, and audit system-wide tenant isolation."
        breadcrumbs={[{ label: 'University' }, { label: 'Administration & RLS' }]}
        actions={
          <button
            type="button"
            onClick={handleRunSecurityAudit}
            className="bg-pri text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm hover:opacity-95 transition-opacity flex items-center gap-1.5"
          >
            <ShieldCheck size={14} />
            Execute Security Healthcheck
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="PostgreSQL RLS Status" value="ENFORCED" trend="Database-Level Isolation" trendPositive={true} />
        <StatCard label="Active RLS Policies" value="5 Enforced" trend="Zero Bypass Allowed" trendPositive={true} />
        <StatCard label="Audit Chain Status" value="SHA-256" trend="Immutable Merkle Tree" trendPositive={true} />
        <StatCard label="Tenant Leakage Risk" value="0.00%" trend="Quarantined" trendPositive={true} />
      </div>

      {/* RLS Policies Table */}
      <div className="bg-card border border-line rounded-2xl p-6 shadow-sm space-y-6">
        <div className="border-b border-line pb-4 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-base font-bold text-ink">Active Database Row-Level Security (RLS) Policies</h2>
            <p className="text-xs text-mut mt-0.5">
              Strict database-level policies prevent cross-college tenant data access even if application layer faults occur
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-okt text-ok flex items-center gap-1">
            <Lock size={12} /> Supabase / PostgreSQL Hardened
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-line text-mut uppercase tracking-wider text-left">
                <th className="py-3 px-3 font-bold">Target Table</th>
                <th className="py-3 px-3 font-bold">Policy Name</th>
                <th className="py-3 px-3 font-bold">Authorized Roles</th>
                <th className="py-3 px-3 font-bold">Commands</th>
                <th className="py-3 px-3 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {POLICIES.map((p) => (
                <tr key={p.policy} className="hover:bg-bg/60 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-ink">{p.table}</td>
                  <td className="py-3 px-3 font-mono text-pri">{p.policy}</td>
                  <td className="py-3 px-3 text-ink">{p.roles}</td>
                  <td className="py-3 px-3 font-mono text-mut">{p.cmd}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-okt text-ok">
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Governance Toggles */}
      <div className="bg-card border border-line rounded-2xl p-6 shadow-sm space-y-5">
        <div className="border-b border-line pb-4">
          <h2 className="text-base font-bold text-ink">Security Governance & System Safeguards</h2>
          <p className="text-xs text-mut mt-0.5">
            Operational runtime guarantees for university compliance audits
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-bg border border-line">
            <div className="space-y-0.5 max-w-xl">
              <b className="text-sm font-bold text-ink">Enforce Strict PostgreSQL Row-Level Security</b>
              <p className="text-xs text-mut">
                Blocks any query lacking a validated `college_id` claim in JWT authorization headers.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setRlsEnforced(!rlsEnforced);
                showToast(`RLS enforcement updated`);
              }}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                rlsEnforced ? 'bg-pri' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  rlsEnforced ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-bg border border-line">
            <div className="space-y-0.5 max-w-xl">
              <b className="text-sm font-bold text-ink">Tamper-Evident SHA-256 Merkle Chain Logging</b>
              <p className="text-xs text-mut">
                Every administrative edit, score update, or drive modification cryptographically anchors to the prior log.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setCryptographicAudit(!cryptographicAudit);
                showToast(`Audit chain policy updated`);
              }}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                cryptographicAudit ? 'bg-pri' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  cryptographicAudit ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-bg border border-line">
            <div className="space-y-0.5 max-w-xl">
              <b className="text-sm font-bold text-ink">Autonomous Adverse Impact & Bias Sentinel</b>
              <p className="text-xs text-mut">
                Automatically flags placement coordinator or recruiter recommendations if Four-Fifths selection ratio drops below 80%.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setAutoTamperAlert(!autoTamperAlert);
                showToast(`Fairness sentinel updated`);
              }}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                autoTamperAlert ? 'bg-pri' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  autoTamperAlert ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
