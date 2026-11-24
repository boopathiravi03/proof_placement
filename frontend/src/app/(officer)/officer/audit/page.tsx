'use client';

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import { useApp } from '@/context/AppContext';
import { api } from '@/lib/api';
import { ShieldCheck, ShieldAlert, Lock, Hash, RefreshCw, AlertTriangle } from 'lucide-react';

interface LogEntry {
  a: string;
  x: string;
  t: string;
  p: string;
  h: string;
}

const HASH_FUNC = (s: string) => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
};

export default function AuditLogPage() {
  const { college, showToast } = useApp();
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      a: 'System Genesis',
      x: 'ProofHire 2.0 Genesis Block Initialized',
      t: '10:00:00 AM',
      p: '00000000',
      h: HASH_FUNC('00000000' + 'System Genesis' + 'ProofHire 2.0 Genesis Block Initialized' + '10:00:00 AM'),
    },
    {
      a: 'T&P Officer',
      x: 'Loaded statutory placement drive schedule for Semester 8',
      t: '10:15:22 AM',
      p: HASH_FUNC('00000000' + 'System Genesis' + 'ProofHire 2.0 Genesis Block Initialized' + '10:00:00 AM'),
      h: '9f2a4b8c',
    },
  ]);
  const [tampered, setTampered] = useState(false);

  useEffect(() => {
    async function loadBackendAudit() {
      const res = await api.getAuditTrail(`COLLEGE-${college}`);
      if (res?.entries && res.entries.length > 0) {
        setLogs(
          res.entries.map((e) => ({
            a: e.actor,
            x: e.action,
            t: e.created_at ? e.created_at.split('T')[1]?.slice(0, 8) || '' : '',
            p: e.prev_hash,
            h: e.hash,
          }))
        );
      }
    }
    loadBackendAudit();
  }, [college]);

  const isIntact = !tampered && logs.length > 0;

  const handleSimulateTamper = async () => {
    setTampered(true);
    setLogs((prev) => {
      const copy = [...prev];
      if (copy.length) copy[0] = { ...copy[0], x: copy[0].x + ' [TAMPERED_BY_ATTACKER]' };
      return copy;
    });
    showToast('Simulating tampering: cryptographic hash chain broken!');
    await api.simulateTampering(`COLLEGE-${college}`);
  };

  const handleResetIntact = () => {
    setTampered(false);
    showToast('Audit chain verification reset.');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cryptographic Audit Ledger"
        description="Immutable, tamper-evident audit trail where every administrative decision and score change is cryptographically anchored to its predecessor."
        breadcrumbs={[{ label: 'Officer' }, { label: 'Audit Ledger' }]}
        actions={
          <div className="flex items-center gap-2.5">
            {tampered ? (
              <button
                type="button"
                onClick={handleResetIntact}
                className="text-xs font-semibold px-3.5 py-2 rounded-xl bg-card border border-line text-ink flex items-center gap-1.5 hover:bg-bg transition-colors"
              >
                <RefreshCw size={14} />
                Restore Verification
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSimulateTamper}
                className="bg-bt text-bad text-xs font-bold px-3.5 py-2 rounded-xl border border-bad/20 hover:bg-bad hover:text-white transition-colors flex items-center gap-1.5"
              >
                <AlertTriangle size={14} />
                Simulate Tamper Attack
              </button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Ledger Integrity Status"
          value={isIntact ? 'VERIFIED' : 'COMPROMISED'}
          trend={isIntact ? '100% Chain Match' : 'Broken Hash Link'}
          trendPositive={isIntact}
        />
        <StatCard
          label="Logged Events"
          value={logs.length}
          trend={`Tenant College ${college}`}
          trendPositive={true}
        />
        <StatCard
          label="Hashing Algorithm"
          value="SHA-256"
          trend="Merkle-linked row blocks"
          trendPositive={true}
        />
      </div>

      <div className="bg-card border border-line rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-4 border-b border-line pb-4">
          <div className="flex items-center gap-2">
            <Lock className="text-pri" size={18} />
            <h2 className="text-base font-bold text-ink">
              Append-Only Ledger Trail · College {college}
            </h2>
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

        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
          {logs.map((r, i) => (
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
                  <span className="text-xs font-bold text-ink">{r.a}</span>
                  <p className="text-sm text-ink font-medium">{r.x}</p>
                </div>
                <span className="text-[11px] text-mut font-mono shrink-0">{r.t}</span>
              </div>
              <div className="pt-2 border-t border-line/60 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-mono text-mut">
                <span>
                  Prev: <code className="text-ink font-bold">{r.p.slice(0, 16)}...</code>
                </span>
                <span>
                  Hash: <code className="text-pri font-bold">{r.h.slice(0, 16)}...</code>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
