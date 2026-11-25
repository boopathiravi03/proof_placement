'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { AuditLogEntry } from '@/types';
import { useAuth } from '@/context/AuthContext';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  AlertTriangle,
  RefreshCw,
  Search,
  KeyRound,
  Scale,
  CheckCircle2,
} from 'lucide-react';

export default function OfficerAuditPage() {
  const { user } = useAuth();
  const college = user?.collegeId || 'COLLEGE-A';

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [integrityStatus, setIntegrityStatus] = useState<string>('VERIFIED');
  const [loading, setLoading] = useState(true);
  const [tampered, setTampered] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [verifResult, setVerifResult] = useState<any | null>(null);
  const [checkpointResult, setCheckpointResult] = useState<any | null>(null);
  const [fairnessResult, setFairnessResult] = useState<any | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const fetchAudit = async () => {
    setLoading(true);
    try {
      const res = await api.getAuditTrail(college);
      if (res) {
        setLogs(res.entries || []);
        setIntegrityStatus(res.chain_intact ? 'VERIFIED' : 'COMPROMISED');
        setTampered(!res.chain_intact);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [college]);

  const handleTamperSimulation = async () => {
    await api.simulateTampering(college);
    await fetchAudit();
  };

  const handleVerifyDetailed = async () => {
    setBusyAction('verify');
    try {
      const res = await api.verifyAuditChainDetailed(college);
      setVerifResult(res);
      if (res) {
        setIntegrityStatus(res.chain_intact ? 'VERIFIED' : 'COMPROMISED');
        setTampered(!res.chain_intact);
      }
    } finally {
      setBusyAction(null);
    }
  };

  const handleCreateCheckpoint = async () => {
    setBusyAction('checkpoint');
    try {
      const res = await api.createAuditCheckpoint(college);
      setCheckpointResult(res);
    } finally {
      setBusyAction(null);
    }
  };

  const handleRunFairness = async () => {
    setBusyAction('fairness');
    try {
      const res = await api.runFairnessAudit(college, user?.name || 'Placement Officer');
      setFairnessResult(res);
    } finally {
      setBusyAction(null);
    }
  };

  const isIntact = integrityStatus === 'VERIFIED';

  const filteredLogs = logs.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.actor.toLowerCase().includes(q) ||
      r.action.toLowerCase().includes(q) ||
      r.hash.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <PageHeader
          title="Tamper-Evident Audit & Fairness Governance"
          description="SHA-256 hash-chained ledger verification, HMAC-signed checkpoints, and four-fifths fairness diagnostics."
        />

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={fetchAudit}
            className="px-3.5 py-2 rounded-xl border border-line bg-card text-ink font-semibold text-xs flex items-center gap-2 hover:bg-bg transition-colors cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>

          <button
            type="button"
            onClick={handleVerifyDetailed}
            disabled={busyAction === 'verify'}
            className="px-3.5 py-2 rounded-xl bg-pri text-white font-semibold text-xs flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer"
          >
            <ShieldCheck size={14} />
            Verify Chain
          </button>

          <button
            type="button"
            onClick={handleCreateCheckpoint}
            disabled={busyAction === 'checkpoint'}
            className="px-3.5 py-2 rounded-xl border border-line bg-card text-ink font-semibold text-xs flex items-center gap-2 hover:bg-bg transition-colors cursor-pointer"
          >
            <KeyRound size={14} />
            Sign Checkpoint
          </button>

          <button
            type="button"
            onClick={handleRunFairness}
            disabled={busyAction === 'fairness'}
            className="px-3.5 py-2 rounded-xl border border-line bg-card text-ink font-semibold text-xs flex items-center gap-2 hover:bg-bg transition-colors cursor-pointer"
          >
            <Scale size={14} />
            Run Fairness Audit
          </button>

          <button
            type="button"
            onClick={handleTamperSimulation}
            className="px-3.5 py-2 rounded-xl bg-red-600/10 border border-red-500/30 text-red-600 font-bold text-xs flex items-center gap-2 hover:bg-red-600/20 transition-colors cursor-pointer"
          >
            <AlertTriangle size={14} />
            Simulate Tamper
          </button>
        </div>
      </div>

      {!isIntact && (
        <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center gap-4 text-red-700 dark:text-red-400">
          <ShieldAlert size={28} className="shrink-0" />
          <div className="text-xs leading-relaxed">
            <b className="text-sm block mb-0.5">CRITICAL SECURITY ALERT: AUDIT CHAIN TAMPERED</b>
            One or more ledger blocks failed cryptographic hash recomputation. Verify broken event ID below.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="Chain Integrity"
          value={isIntact ? '100% Intact' : 'Broken'}
          icon={isIntact ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}
          trend={isIntact ? 'All blocks verified' : 'Tamper detected'}
          trendPositive={isIntact}
        />
        <StatCard
          label="Logged Events"
          value={logs.length}
          trend={`Tenant College ${college}`}
          trendPositive={true}
        />
        <StatCard
          label="Integrity Model"
          value="SHA-256 + HMAC"
          trend="Tamper-evident hash chain"
          trendPositive={true}
        />
      </div>

      {/* Verification, Checkpoint & Fairness Output Panels */}
      {(verifResult || checkpointResult || fairnessResult) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {verifResult && (
            <div className="bg-card border border-line rounded-2xl p-4 text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-ink">
                <CheckCircle2 size={15} className={verifResult.chain_intact ? 'text-ok' : 'text-bad'} />
                <span>Verification Run #{verifResult.verification_run_id?.slice(0, 8)}</span>
              </div>
              <p className="text-mut">{verifResult.details}</p>
              <p className="font-mono text-[11px] text-pri">
                Checked: {verifResult.total_checked} events
                {verifResult.broken_event_id ? ` · Broken ID: ${verifResult.broken_event_id}` : ''}
              </p>
            </div>
          )}

          {checkpointResult && (
            <div className="bg-card border border-line rounded-2xl p-4 text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-ink">
                <KeyRound size={15} className="text-pri" />
                <span>HMAC Checkpoint Signed</span>
              </div>
              <p className="text-mut">Events covered: {checkpointResult.event_count}</p>
              <p className="font-mono text-[10px] text-pri break-all">
                HMAC: {checkpointResult.hmac_signature?.slice(0, 32)}...
              </p>
            </div>
          )}

          {fairnessResult && (
            <div className="bg-card border border-line rounded-2xl p-4 text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-ink">
                <Scale size={15} className="text-pri" />
                <span>Fairness Audit ({fairnessResult.analysis_period})</span>
              </div>
              <p className="text-mut">
                Status: <b className="text-ink uppercase">{fairnessResult.review_outcome}</b> · Anomalies:{' '}
                {fairnessResult.anomalies_detected?.length || 0}
              </p>
              {fairnessResult.disparity_indicators?.suppressed_small_groups?.length > 0 && (
                <p className="text-[11px] text-amber-600">
                  Small-group suppression (k &lt; 3): {fairnessResult.disparity_indicators.suppressed_small_groups.join(', ')}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="bg-card border border-line rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex justify-between items-center flex-wrap gap-4 border-b border-line pb-4">
          <div className="flex items-center gap-2">
            <Lock className="text-pri" size={18} />
            <h2 className="text-base font-bold text-ink">
              Hash-Chained Audit Ledger · College {college}
            </h2>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-mut" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter actor, action, hash..."
                className="pl-8 pr-3 py-1.5 rounded-xl border border-line bg-bg text-xs text-ink w-56"
              />
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                isIntact ? 'bg-okt text-ok' : 'bg-bt text-bad'
              }`}
            >
              {isIntact ? (
                <>
                  <ShieldCheck size={14} /> Cryptographic Chain Intact
                </>
              ) : (
                <>
                  <ShieldAlert size={14} /> Chain Integrity Broken!
                </>
              )}
            </span>
          </div>
        </div>

        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
          {filteredLogs.map((r, i) => (
            <div
              key={i}
              className={`p-4 rounded-xl border transition-all ${
                tampered && i === 0
                  ? 'bg-red-500/5 border-red-500/30'
                  : 'bg-bg border-line hover:border-line/80'
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-ink">{r.actor}</span>
                  <p className="text-sm text-ink font-medium">{r.action}</p>
                </div>
                <span className="text-[11px] text-mut font-mono shrink-0">{r.created_at}</span>
              </div>
              <div className="pt-2 border-t border-line/60 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-mono text-mut">
                <span>
                  Prev: <code className="text-ink font-bold">{r.prev_hash.slice(0, 16)}...</code>
                </span>
                <span>
                  Hash: <code className="text-pri font-bold">{r.hash.slice(0, 16)}...</code>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
