# ProofHire 2.0 – Comprehensive Project & Architectural Audit

**Date:** 2026-11-24  
**Project:** ProofHire (Evidence-Based Talent Intelligence and Placement Ecosystem)  
**Auditor:** Senior Full-Stack Engineer, Software Architect, AI & Database Engineer  

---

## 1. Executive Summary

ProofHire aims to transform student potential into verifiable competency through evidence-linked talent intelligence and explainable placement decisions across five interconnected engines:
1. **Evidence Intelligence Engine** (Competency lifecycle: Claimed → Observed → Evidence-linked → Assessed → Verified → Expired)
2. **Adaptive Competency Assessment Engine** (Dynamic multi-domain testing with difficulty adaptation)
3. **Personalized Career Development Engine** (Target role gap closure & evidence-generating tasks)
4. **Intelligent Placement Matching Engine** (Versioned rules, explainable eligibility, clash-free drive calendar, hiring pipeline)
5. **Institutional Placement Intelligence Engine** (Cohort heatmaps, fairness impact ratio, cross-college benchmarking, tamper-evident audit logs)

The existing codebase consists of an attractive, highly-responsive single-page prototype (`frontend/index.html`), a starter FastAPI backend with in-memory mock data (`backend/main.py`), and an initial PostgreSQL schema (`db/schema.sql`). 

While the conceptual foundations (state machine, audit hashing, fairness impact ratio, versioned eligibility) are well thought out, **the frontend and backend are currently disconnected**, with the frontend relying on ephemeral JavaScript state and the backend lacking full database integration, enterprise authentication, and critical business modules.

---

## 2. Codebase Inventory & Component Analysis

### A. Frontend (`frontend/index.html`)
- **Structure:** Single self-contained HTML5 file (31.3 KB, 127 lines) built with CSS variables (light & dark mode support), responsive flex/grid layouts, SVG progress indicators, and vanilla JavaScript.
- **Identified Views & Pages (16 Views):**
  1. `dash` – **Student Dashboard:** Readiness score gauge, KPI summary cards, skill status cards, Acme Tech skill gap alert, quick action buttons.
  2. `rdy` – **Placement Readiness Index:** Explainable weighted index (Verified Competencies 35%, Evidence Coverage 20%, Practical Assessment 25%, Aptitude 10%, Interview Readiness 10%) across roles (Backend, Data Analyst, Frontend).
  3. `evd` – **Evidence Management:** Submission actions for certificates, hackathon contributions, lab records, mentor sign-offs, and an evidence timeline.
  4. `asm` – **Adaptive Assessment:** 5-question SQL adaptive assessment engine adjusting difficulty between levels 1, 2, and 3 based on answer correctness.
  5. `path` – **Personalized Learning Path:** Task list for skill gap remediation with progress bars where completed tasks generate new evidence.
  6. `res` – **One-Click Verified Resume:** Dynamically generated resume showcasing only evidence-backed skills (omits unverified claims).
  7. `priv` – **Privacy & Consent Management:** Toggles for LeetCode profile sharing, recruiter visibility, read-only GitHub OAuth revocation, and transparent verification factor explanations.
  8. `drives` – **Student Drives & Explainable Eligibility:** Visual breakdown of versioned rules check (CGPA, backlogs, verified skills) and student appeal trigger.
  9. `off` – **Cohort Intelligence (T&P Officer):** Placement prediction KPIs, verified skill coverage, 4-branch (CSE, IT, ECE, MECH) skill heatmaps, industry demand warnings, and four-fifths rule fairness check table.
  10. `appr` – **Officer Approval Queue:** Human-in-the-loop review for AI agent proposals (risk flags, workshop suggestions, scheduling changes).
  11. `rec` – **Talent Search (Recruiter):** Skill-based candidate filtering showing transparent match reasoning and verification expiry.
  12. `cal` – **Drive Calendar & Operations:** 5-day multi-company schedule, automated clash detection (e.g. Wednesday overlap), and slot auto-reallocation.
  13. `rep` – **Reports & Interventions:** Before-and-after skill gap closure metrics and NAAC/NIRF accreditation export triggers.
  14. `pipe` – **Hiring Pipeline:** 4-stage pipeline (Shortlisted → Interview → Offer → Accepted) requiring officer approval for offer releases.
  15. `uni` – **University Administration:** Cross-college comparative benchmark table (placement rate, coverage, gap closure, fairness alerts) preserving tenant isolation.
  16. `aud` – **Audit Log:** SHA-256 hash-chained immutable audit trail with interactive tamper simulation.

### B. Backend (`backend/main.py`)
- **Structure:** 86-line FastAPI application.
- **Endpoints:**
  - `POST /evidence`: Simulates state transition (Claimed → Evidence-linked / Verified) in global memory dictionary `SKILLS`.
  - `GET /github/{username}/scan`: Reads public GitHub repositories using `httpx` to count language usage.
  - `POST /eligibility`: Checks CGPA, backlogs, and verified skills against provided rules; returns failed rules and version.
  - `POST /fairness`: Computes 4/5ths impact ratio (`r / max_rate < 0.8`) for group placement rates.
  - `GET /audit`: Verifies SHA-256 chain continuity for an in-memory list `AUDIT`.

### C. Database (`db/schema.sql`)
- **Structure:** PostgreSQL script with `pgcrypto` extension.
- **Tables Defined:** `tenants`, `students`, `skills`, `evidence`, `consents`, `eligibility_rules`, `decisions`, `approvals`, `audit_log`.
- **Integrity & Security Features:**
  - `skill_state` ENUM (`claimed`, `observed`, `evidence_linked`, `verified`, `expired`).
  - `audit_chain()` PL/pgSQL trigger computing SHA-256 `new.prev_hash || new.actor || new.action || new.created_at`.
  - `audit_immutable()` trigger preventing `UPDATE` or `DELETE` on `audit_log`.
  - Row-Level Security (RLS) template referencing `auth.jwt() ->> 'college_id'`.

---

## 3. Critical Findings, Bugs & Security Deficiencies

| Category | Finding / Bug | Severity | Impact |
|---|---|---|---|
| **Architecture** | Frontend runs 100% on local JavaScript memory; no calls are made to FastAPI backend. | **Critical** | Data is lost on refresh; no persistence or real multi-user workflows. |
| **Persistence** | Backend uses in-memory dicts (`SKILLS`, `AUDIT`) instead of PostgreSQL / SQLite. | **Critical** | All backend state resets on restart; DB schema is unutilized. |
| **Authentication & RBAC** | No token verification or role checks on backend endpoints. Any caller can mutate state or read logs. | **Critical** | Complete lack of access control; zero tenant isolation in API layer. |
| **Competency Lifecycle** | Lifecycle skips `Assessed` and `Observed` states in backend transition logic (`next_state` only produces `claimed`, `evidence_linked`, or `verified`). | **High** | Violates core rule: practical assessments must produce `Assessed` before mentor or walkthrough produces `Verified`. |
| **Evidence Validation** | Client directly submits `kind` and `ref` without server-side verification of validity or ownership. | **High** | Spoofed evidence could elevate skill states without genuine validation. |
| **Assessment System** | Adaptive testing exists only as 7 static questions in `index.html`; no question bank, no attempt tracking, no multi-skill coverage. | **High** | Cannot assess Aptitude, DSA, SQL, Web, or Interview topics comprehensively. |
| **GitHub Integration** | Scans public repos anonymously; no OAuth flow, no consent revocation backend sync, no token encryption, rate limited to 60 req/hr. | **High** | Fails security requirement for read-only OAuth, consent withdrawal, and private token safety. |
| **Tenant Isolation** | College switching in UI is merely a variable `S.c = 'A'`; backend lacks college scoping on queries. | **Critical** | Cross-college data leakage risk. |
| **Audit Verification** | In-memory audit trail hashes a naive string with client timestamp; no database hash chain enforcement in backend. | **Medium** | Fails tamper resistance guarantees outside of PostgreSQL triggers. |
| **Explainable Matching** | Company jobs, applications, and recruiter candidate searches are hardcoded arrays. | **Medium** | Recruiters cannot post real jobs or search actual students. |

---

## 4. Requirement Gap Analysis

1. **Evidence Intelligence:** Needs full support for all 7 evidence sources (GitHub, projects, certificates, hackathons, lab records, assessments, mentor sign-offs), full lifecycle enforcement (`Claimed → Observed → Evidence-linked → Assessed → Verified → Expired`), and non-GitHub student support.
2. **Adaptive Assessment:** Needs comprehensive dynamic assessment engine with question bank management, difficulty adjustment, timer, multi-category evaluation (Aptitude, SQL, DSA, Web/Backend, Debugging), and report generation.
3. **Personalized Career Development:** Needs database-backed learning paths, task progress tracking, and automated evidence creation upon task completion.
4. **Placement Readiness Index:** Needs transparent formula calculation combining Verified coverage, practical tests, aptitude, and interview scores with explainable component weights.
5. **Intelligent Placement & Recruiter Workspace:** Needs company management, job postings, eligibility evaluation with rule versioning, appeal submission, clash detection, and candidate pipeline.
6. **Institutional Intelligence:** Needs cohort skill heatmaps, industry gap alerts, intervention queue, and 4/5ths fairness impact analysis.
7. **Trust, Governance & DPDP Compliance:** Needs audit hash chain verification, consent logging, consent withdrawal, and college tenant isolation.

---

## 5. Upgrade Strategy & Recommendations

1. **Preserve Prototype Visual Identity:** Keep the sleek, responsive UI design, navigation, and color palette from `frontend/index.html`. Upgrade it to connect seamlessly to the live FastAPI REST API with real-time UI state sync and offline fallback demo mode.
2. **Modular Backend Architecture:** Refactor `backend/main.py` into clean modular packages:
   - `core/` (config, database, security, audit engine)
   - `models/` (SQLAlchemy ORM models mirroring upgraded schema)
   - `schemas/` (Pydantic models for validation)
   - `routers/` (auth, evidence, assessments, learning, readiness, companies, eligibility, recruiter, officer, admin, audit)
   - `services/` (adaptive testing, placement matching, fairness calculator, GitHub client)
3. **Comprehensive Database Engine:** Deliver upgraded `schema.sql` supporting PostgreSQL and SQLite (with automatic fallback so the application runs seamlessly both locally and on Supabase/PostgreSQL).
4. **Automated Verification & Tests:** Write comprehensive unit and integration tests covering the competency state machine, rule-versioned eligibility, fairness ratio calculations, and SHA-256 audit chain integrity.
