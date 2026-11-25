'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Award,
  Users,
  Briefcase,
  Building2,
  GitBranch,
  ArrowRight,
  Lock,
  Sparkles,
  CheckCircle2,
  FileText,
  BarChart3,
  Calendar,
  Layers,
  Code,
  Scale,
} from 'lucide-react';

const WORKSPACES = [
  {
    role: 'Student Workspace',
    title: 'Evidence Competency Dossier',
    desc: 'Connect GitHub repositories, complete proctored adaptive assessments, build dynamic resumes, and withdraw DPDP consent anytime.',
    href: '/student/dashboard',
    icon: <Award size={22} className="text-pri" />,
    badge: 'Student Portal',
    badgeColor: 'bg-pri/10 text-pri border-pri/20',
    highlights: ['Adaptive Assessments', 'GitHub Read-Only Sync', 'Dynamic Resume', 'DPDP Consent'],
  },
  {
    role: 'T&P Officer Console',
    title: 'Placement Intelligence Hub',
    desc: 'Cohort skill deficiency heatmaps, human-in-the-loop approval queues, automated drive calendar conflict resolution, and NAAC/NIRF reporting.',
    href: '/officer/cohort-insights',
    icon: <Users size={22} className="text-emerald-500" />,
    badge: 'Officer Command',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    highlights: ['Cohort Heatmap', 'Intervention Queue', 'Drive Calendar', 'SHA-256 Ledger'],
  },
  {
    role: 'Recruiter Hub',
    title: 'Verified Talent Sourcing',
    desc: 'Discover candidates backed by cryptographic proof. Advance hiring pipelines from shortlist to offer with institutional placement sign-off.',
    href: '/recruiter/dashboard',
    icon: <Briefcase size={22} className="text-amber-500" />,
    badge: 'Corporate Partner',
    badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    highlights: ['Evidence Candidate Search', 'Dual Sign-Off Pipeline', 'Job Requisitions', 'Panels'],
  },
  {
    role: 'University Governance',
    title: 'Institutional Macro Analytics',
    desc: 'Compare macro placement indicators across constituent colleges while PostgreSQL Row-Level Security quarantines private student data.',
    href: '/university/dashboard',
    icon: <Building2 size={22} className="text-purple-500" />,
    badge: 'University Admin',
    badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    highlights: ['Multi-College Matrix', 'Row-Level Security (RLS)', 'Four-Fifths Equity', 'Campuses'],
  },
];

const PLATFORM_ENGINES = [
  {
    title: 'Evidence Intelligence Engine',
    desc: 'Strict Claimed → Observed → Evidence-linked → Assessed → Verified → Expired lifecycle. GitHub alone never yields verified status.',
    icon: <GitBranch size={20} className="text-pri" />,
  },
  {
    title: 'Adaptive Assessment Engine',
    desc: 'Dynamic difficulty scaling with code simulation, randomized parameter variations, and proctored technical evaluations.',
    icon: <Award size={20} className="text-emerald-500" />,
  },
  {
    title: 'Career Development Engine',
    desc: 'Automated skill gap detection comparing student proofs against live recruiter requisitions, with step-by-step remediation roadmaps.',
    icon: <Sparkles size={20} className="text-amber-500" />,
  },
  {
    title: 'Intelligent Placement Matching',
    desc: 'Explainable candidate matching providing transparent reasons for every recommendation, audited under EEOC Four-Fifths fairness rules.',
    icon: <Scale size={20} className="text-sky-500" />,
  },
  {
    title: 'Institutional Placement Engine',
    desc: 'Immutable append-only cryptographic SHA-256 audit ledger where every administrative change is tamper-evident.',
    icon: <Lock size={20} className="text-purple-500" />,
  },
];

export default function RootHomePage() {
  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col">
      {/* Top Navigation */}
      <header className="h-16 bg-card border-b border-line sticky top-0 z-50 px-6 sm:px-12 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 font-extrabold text-xl text-ink">
          <span className="w-9 h-9 rounded-xl bg-pri text-white flex items-center justify-center font-black text-base shadow-sm">
            P
          </span>
          <span className="tracking-tight">
            ProofHire <span className="text-xs px-2 py-0.5 rounded-md bg-pri/10 text-pri font-bold ml-1">2.0</span>
          </span>
        </Link>

        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/login"
            className="text-xs font-semibold px-4 py-2 rounded-xl text-mut hover:text-ink transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/student/dashboard"
            className="bg-pri text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm hover:opacity-95 transition-opacity flex items-center gap-1.5"
          >
            Enter Platform
            <ArrowRight size={14} />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 px-6 sm:px-12 max-w-7xl mx-auto w-full text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-pri/10 text-pri border border-pri/20">
          <ShieldCheck size={14} />
          Enterprise Placement & Evidence Intelligence Platform
        </div>

        <h1 className="text-4xl sm:text-5xl font-black text-ink tracking-tight max-w-4xl mx-auto leading-tight">
          Transform student potential into{' '}
          <span className="text-pri">verifiable competency.</span>
        </h1>

        <p className="text-base sm:text-lg text-mut max-w-3xl mx-auto leading-relaxed">
          ProofHire does not simply rank students by CGPA or trust resume claims. It builds an evidence-backed picture of student capabilities, identifies skill gaps, helps students improve, and connects demonstrated competencies with placement opportunities.
        </p>

        {/* Honest Architecture & Governance Bar */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-mut font-semibold">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-ok" />
            6-State Evidence Lifecycle
          </span>
          <span className="text-line hidden sm:inline">•</span>
          <span className="flex items-center gap-1.5">
            <Lock size={13} className="text-pri" />
            Tenant Isolation &amp; RLS
          </span>
          <span className="text-line hidden sm:inline">•</span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-ok" />
            SHA-256 Tamper-Evident Audit
          </span>
          <span className="text-line hidden sm:inline">•</span>
          <span className="flex items-center gap-1.5">
            <Scale size={13} className="text-amber-600" />
            Four-Fifths Fairness Diagnostics
          </span>
        </div>
      </section>

      {/* Workspace Persona Cards */}
      <section className="py-8 px-6 sm:px-12 max-w-7xl mx-auto w-full space-y-8">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-extrabold text-ink tracking-tight">Dedicated User Workspaces</h2>
          <p className="text-sm text-mut">Select a role gateway to explore live interactive capabilities</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {WORKSPACES.map((ws) => (
            <Link
              key={ws.role}
              href={ws.href}
              className="group bg-card border border-line hover:border-pri/40 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-2xl bg-bg border border-line group-hover:scale-105 transition-transform">
                    {ws.icon}
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${ws.badgeColor}`}>
                    {ws.badge}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-mut block">{ws.role}</span>
                  <h3 className="text-lg font-bold text-ink group-hover:text-pri transition-colors leading-snug">
                    {ws.title}
                  </h3>
                  <p className="text-xs text-mut leading-relaxed">{ws.desc}</p>
                </div>

                <div className="pt-2 border-t border-line/60 space-y-1.5">
                  {ws.highlights.map((h) => (
                    <div key={h} className="text-[11px] text-ink font-medium flex items-center gap-1.5">
                      <CheckCircle2 size={12} className="text-ok shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-line flex items-center justify-between text-xs font-bold text-pri group-hover:translate-x-1 transition-transform">
                <span>Launch Console</span>
                <ArrowRight size={15} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 5 Connected Engines Architecture */}
      <section className="py-16 px-6 sm:px-12 max-w-7xl mx-auto w-full space-y-8">
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-okt text-ok border border-ok/20">
            Modular Enterprise Architecture
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
            The Five Connected Placement Engines
          </h2>
          <p className="text-sm text-mut max-w-2xl mx-auto">
            A cohesive pipeline connecting student code repositories with institutional hiring decisions
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {PLATFORM_ENGINES.map((eng, idx) => (
            <div
              key={eng.title}
              className="bg-card border border-line rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-3"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-bg border border-line">
                    {eng.icon}
                  </div>
                  <span className="text-xs font-extrabold text-mut/50 font-mono">0{idx + 1}</span>
                </div>
                <h3 className="text-sm font-bold text-ink leading-snug">{eng.title}</h3>
                <p className="text-xs text-mut leading-relaxed">{eng.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-line bg-card py-8 px-6 sm:px-12 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-mut max-w-7xl mx-auto w-full">
        <div>
          <b className="text-ink">ProofHire 2.0</b> · Evidence-Based Talent Intelligence and Placement Ecosystem
        </div>
        <div className="flex gap-4">
          <Link href="/student/privacy" className="hover:text-ink transition-colors">DPDP Compliance</Link>
          <Link href="/officer/audit" className="hover:text-ink transition-colors">SHA-256 Ledger</Link>
          <Link href="/university/admin" className="hover:text-ink transition-colors">RLS Governance</Link>
        </div>
      </footer>
    </div>
  );
}
