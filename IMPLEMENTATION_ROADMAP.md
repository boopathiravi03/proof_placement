# ProofHire 2.0 – Implementation Roadmap

This document outlines the phased engineering roadmap to evolve ProofHire from a static prototype into a connected, secure, enterprise-grade placement intelligence platform.

---

## Phase 1: Core Foundation, Security & Database Modernization
- [x] Complete architectural code audit (`PROJECT_AUDIT.md`, `IMPLEMENTATION_ROADMAP.md`, `FEATURE_STATUS.md`).
- [ ] Upgrade SQL schema with normalized tables, foreign keys, constraints, and audit triggers.
- [ ] Implement SQLAlchemy ORM layer with dual SQLite/PostgreSQL support for local zero-dependency execution and production Supabase hosting.
- [ ] Establish Role-Based Access Control (RBAC: Student, T&P Officer, Recruiter, University Admin) and college tenant isolation.
- [ ] Build SHA-256 cryptographic hash-chained audit engine with tamper detection.
- [ ] Build the complete 6-state Competency Lifecycle state machine: `Claimed → Observed → Evidence-linked → Assessed → Verified → Expired`.

## Phase 2: Evidence Intelligence & Adaptive Assessment Engine
- [ ] Implement Evidence Service supporting GitHub ingestion, projects, certificates, hackathons, lab records, and mentor sign-offs.
- [ ] Guarantee: GitHub alone produces `Evidence-linked`; never `Verified`.
- [ ] Implement Adaptive Assessment Engine:
  - Multi-category question bank (SQL, Aptitude, Python/DSA, Web/System Design, Debugging).
  - Dynamic difficulty scaling (Levels 1 to 3) based on real-time question responses.
  - Test attempts, timers, result scoring, weak-topic identification, and assessment reports.
- [ ] Wire successful assessments to transition competency states to `Assessed`.

## Phase 3: Personalized Learning & Transparent Readiness Index
- [x] Implement Personalized Career Development Engine:
  - Role-based skill gap analyzer (Target roles: Backend Developer, Frontend Developer, Full Stack Developer, Python Developer, Java Developer, Data Analyst, Software Engineer).
  - Automated generation of prerequisite-ordered learning paths with step-by-step tasks and verified resources.
  - Task submission flow that emits `evidence_linked` artifacts (never auto-verified) and integrates with reassessment.
- [x] Implement Placement Readiness Index Engine:
  - Transparent formula: 35% Verified Competencies + 25% Coding + 15% Aptitude + 15% Interview + 10% Skill Coverage.
  - Confidence scoring, empirical data coverage, and explainable missing skill breakdown.

## Phase 4: Placement Engine, Recruiter Workspace & Governance
- [ ] Company and Job Role management (Acme Tech, Gamma Labs, Beta Soft).
- [ ] Versioned Eligibility Evaluation Engine (`min_cgpa`, `max_backlogs`, `required_skills`):
  - Immutable decision logging with input snapshots and failed conditions.
  - Student appeal submission and officer review workflow.
- [ ] Recruiter Workspace:
  - Verified talent search with explainable match reasons.
  - Hiring pipeline: Shortlisted → Interview → Offer → Accepted.
  - Officer approval barrier for offer dispatch.
- [ ] Drive Calendar & Clash Management:
  - Multi-company drive scheduling and automated conflict resolution.
- [ ] T&P Officer Cohort Intelligence & University Administration:
  - Branch-wise skill heatmaps (CSE, IT, ECE, MECH).
  - Four-fifths fairness impact ratio computation.
  - Multi-college comparative dashboard with strict data isolation.
  - Accreditation report export (NAAC / NIRF).
- [ ] DPDP Consent Management:
  - Granular sharing controls (LeetCode, Recruiter visibility, GitHub OAuth).
  - Instant consent withdrawal.

## Phase 5: Connected Frontend, Testing & Verification
- [ ] Connect the frontend UI (`index.html`) to the FastAPI REST API:
  - Automatic API health-check with real-time server connectivity indicator.
  - Dynamic data syncing across all 16 views.
  - Graceful fallback for offline demo mode preserving all interactive prototype actions.
- [ ] Comprehensive Automated Test Suite:
  - Unit tests for competency state transitions.
  - Unit tests for versioned eligibility and fairness ratios.
  - Cryptographic verification tests for SHA-256 audit chain and tamper resistance.
  - Cross-college tenant isolation security tests.
- [ ] Hackathon Demo Guide & Production Runbook (`README.md`).

## Phase 8: Trust, Governance, DPDP Privacy, Fairness & Tamper-Evident Audit
- [x] Centralized `GovernanceService` (`backend/app/services/governance_service.py`) enforcing tenant isolation, RBAC, 6-category consent, `DataAccessLog`, `SecurityEvent`, file upload validation, and sensitive field redaction.
- [x] `PrivacyRetentionService` (`backend/app/services/privacy_retention_service.py`) for versioned privacy notices, configurable retention policies, and DPDP rights workflows (`data_export`, `deletion_erasure`, `correction`, `grievance`).
- [x] Concurrency-safe `AuditService` (`_AUDIT_LOCK`, `AuditChainHead`, `AuditVerificationRun`, HMAC-SHA256 `AuditCheckpoint`), `FairnessService.run_comprehensive_fairness_audit()` (with `k < 3` suppression), and `ExplanationService`.
- [x] Security headers & rate limiting middleware (`backend/app/main.py`) and PostgreSQL RLS policies (`db/schema.sql`).
- [x] Upgraded `student/privacy/page.tsx` and `officer/audit/page.tsx` + automated Phase 8 test suite (`tests/test_phase8_governance_security.py`).
