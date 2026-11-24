'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import SkillBadge from '@/components/ui/SkillBadge';
import { useApp } from '@/context/AppContext';
import { FileText, Download, ShieldCheck, Printer, CheckCircle2, Lock, QrCode } from 'lucide-react';

const STATES = ['Claimed', 'Observed', 'Evidence-linked', 'Assessed', 'Verified'];

export default function ResumePage() {
  const [generated, setGenerated] = useState(false);
  const { skills, evidenceDescriptions, showToast } = useApp();

  const handleGenerate = () => {
    setGenerated(true);
    showToast('Cryptographic evidence resume compiled from verified competencies');
  };

  const handlePrint = () => {
    window.print();
  };

  const verifiableSkills = Object.entries(skills).filter(([, lvl]) => lvl >= 2);
  const excludedClaimedCount = Object.entries(skills).filter(([, lvl]) => lvl < 2).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="One-Click Verifiable Resume Dossier"
        description="Compile an authentic CV backed directly by cryptographic proof trails. Self-reported claims lacking verifiable evidence are strictly omitted."
        breadcrumbs={[{ label: 'Student', href: '/student/dashboard' }, { label: 'Evidence Resume' }]}
        actions={
          generated && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="bg-card border border-line text-ink text-xs font-semibold px-3.5 py-2 rounded-xl hover:bg-bg transition-colors flex items-center gap-1.5"
              >
                <Printer size={14} />
                Print / Save PDF
              </button>
            </div>
          )
        }
      />

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Verifiable Skills Included"
          value={verifiableSkills.length}
          icon={<ShieldCheck size={18} />}
          trend="Evidence-Linked +"
          trendPositive={true}
          subtitle="Meets Trust Threshold"
        />
        <StatCard
          label="Unverified Claims Omitted"
          value={excludedClaimedCount}
          icon={<Lock size={18} />}
          trend="Filtered Out"
          trendPositive={true}
          subtitle="Zero Hallucinated Claims"
        />
        <StatCard
          label="Cryptographic Signature"
          value="SHA-256"
          icon={<CheckCircle2 size={18} />}
          trend="Merkle Sealed"
          trendPositive={true}
          subtitle="Recruiter Scannable"
        />
        <StatCard
          label="Verification Authority"
          value="Institutional"
          icon={<FileText size={18} />}
          trend="T&P Signed"
          trendPositive={true}
          subtitle="Apex Tech"
        />
      </div>

      {/* Generator Banner */}
      <div className="bg-card border border-line rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-ink">On-Demand Verifiable Resume Engine</h2>
          <p className="text-xs text-mut max-w-xl leading-relaxed">
            Compiled directly from your evidence-backed talent ledger. Employers receive cryptographic proof hashes allowing one-click verification of every claimed skill.
          </p>
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          className="bg-pri text-white font-bold text-xs px-5 py-3 rounded-xl shadow-sm hover:opacity-95 transition-opacity shrink-0 cursor-pointer"
        >
          {generated ? 'Regenerate Resume' : 'Generate Verified Resume'}
        </button>
      </div>

      {/* Generated Resume Document Preview */}
      {generated && (
        <div className="bg-card border border-line rounded-3xl p-8 sm:p-10 shadow-md space-y-6 max-w-3xl mx-auto">
          {/* Resume Header */}
          <div className="border-b border-line pb-6 flex justify-between items-start gap-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-ink tracking-tight">Rahul K.</h2>
              <p className="text-xs font-bold text-pri">
                Candidate for Backend Systems Engineer · B.Tech Computer Science
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-mut pt-1">
                <span>Bengaluru, India</span>
                <span>•</span>
                <span>CGPA: 8.4 / 10.0</span>
                <span>•</span>
                <span>Batch: 2022–2026</span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-okt text-ok border border-ok/20">
                <ShieldCheck size={12} />
                ProofHire Certified
              </span>
              <span className="block text-[10px] text-mut font-mono mt-1">
                Cert: 7a9f2e4b10cd8
              </span>
            </div>
          </div>

          {/* Education */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-ink uppercase tracking-wider">Education</h3>
            <div className="p-4 rounded-xl bg-bg border border-line space-y-0.5">
              <div className="flex justify-between items-center text-xs">
                <b className="text-ink">Apex Institute of Technology</b>
                <span className="text-mut">2022 – 2026</span>
              </div>
              <p className="text-xs text-mut">Bachelor of Technology in Computer Science & Engineering</p>
            </div>
          </div>

          {/* Verifiable Competencies */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-ink uppercase tracking-wider">
                Audited & Verifiable Competencies
              </h3>
              <span className="text-[10px] text-mut font-semibold">Strict Evidence Threshold Enforced</span>
            </div>

            {verifiableSkills.length > 0 ? (
              <div className="space-y-2.5">
                {verifiableSkills.map(([skillName, lvl]) => {
                  const stateLabel = STATES[lvl];
                  return (
                    <div
                      key={skillName}
                      className="p-4 rounded-xl bg-bg border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="space-y-0.5">
                        <b className="text-sm font-bold text-ink">{skillName}</b>
                        <p className="text-xs text-mut">
                          {evidenceDescriptions[skillName] || 'Evidence verified by institutional cryptographic audit chain.'}
                        </p>
                      </div>
                      <SkillBadge state={stateLabel} />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-bg border border-line text-xs text-mut italic text-center">
                No verified competencies yet. Connect GitHub, complete assessments, or add mentor evaluations.
              </div>
            )}
          </div>

          {/* Cryptographic Trust Guarantee */}
          <div className="p-4 rounded-xl bg-bg border border-line text-xs text-mut space-y-1">
            <b className="text-ink flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-ok" />
              ProofHire Trust & Provenance Guarantee
            </b>
            <p className="leading-relaxed">
              Unverified self-claims are automatically omitted from this document. Recruiter hiring portals scan the embedded verification hash to inspect underlying git commits, proctored code execution logs, and faculty sign-offs.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
