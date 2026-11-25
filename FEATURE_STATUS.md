# ProofHire 2.0 – Feature Status Matrix

This matrix classifies every platform feature against the production requirements, tracking current state, target state, and security posture.

**Classifications:**
- **Working:** Operational, connected to real logic and persistent store.
- **Partially working:** Basic functional skeleton present, but incomplete or partially mocked.
- **Simulated:** Exists solely as client-side UI simulation with in-memory dummy variables.
- **Missing:** Not yet implemented in code.
- **Needs security correction:** Contains authorization gaps, potential data leakage, or unvalidated claims.

---

## 1. Evidence Intelligence Engine

| Feature | Current Prototype Status | Upgrade Classification | Action Required |
|---|---|---|---|
| Student Competency Lifecycle | Partially working | **Needs security correction** | Implement full 6-state machine: `Claimed → Observed → Evidence-linked → Assessed → Verified → Expired`. Ensure GitHub code alone never yields `Verified`. |
| GitHub Repository Ingestion | Partially working | **Needs security correction** | Add read-only token support, consent verification, revocation, and student repo parsing without leaking credentials. |
| Multi-Evidence Uploads (Certs, Hackathons, Lab work) | Simulated | **Partially working** | Create persistent evidence storage with verification metadata (source, ownership, timestamp, verification method). |
| Mentor Sign-Off Workflow | Simulated | **Partially working** | Implement authorized mentor verification transitions from `Assessed` to `Verified`. |
| Non-GitHub Student Support | Simulated | **Working** | Support alternative evidence pathways (lab work, certificates, direct tests) without prejudice. |

---

## 2. Adaptive Competency Assessment Engine

| Feature | Current Prototype Status | Upgrade Classification | Action Required |
|---|---|---|---|
| Dynamic Question Selection | Simulated | **Partially working** | Implement database-backed multi-tier question bank. |
| Real-time Difficulty Scaling | Simulated (7 SQL items) | **Partially working** | Dynamic level adjustment (Level 1, 2, 3) reacting to correct/incorrect responses. |
| Assessment Types (Aptitude, SQL, DSA, Web/System Design, Debugging) | Missing | **Working** | Expand question catalog across all technical and aptitude domains. |
| Assessment Scoring & History | Simulated | **Working** | Track attempts, duration, timestamps, response logs, and weak topic diagnostic. |
| Competency Lifecycle Hook | Simulated | **Needs security correction** | Validated test scores (>= 60%) must automatically transition competency to `Assessed`. |

---

## 3. Personalized Career Development Engine

| Feature | Current Prototype Status | Upgrade Classification | Action Required |
|---|---|---|---|
| Role-Based Skill Gap Analysis | Implemented (DB + API + UI) | **Working** | Deterministic gap analysis across 7 roles distinguishing `unknown`, `unassessed`, `expired`, and `low_proficiency`. |
| Deterministic Gap Prioritization | Implemented | **Working** | Configurable priority rules (`Critical`, `High`, `Medium`, `Low`) with transparent explanations. |
| Prerequisite-Ordered Learning Paths | Implemented | **Working** | Topological prerequisite ordering, validation layer, verified official resources, and `recommendation_logs`. |
| Evidence Generation on Task Submission | Implemented | **Working** | Submitting task deliverables creates `TaskSubmission` + `evidence_linked` record (never auto-verifies). |
| Reassessment & Before/After Progress | Implemented | **Working** | Links to Adaptive Assessment Engine, tracks before/after scores, and updates Readiness Index. |
| Officer Cohort Skill-Gap & Interventions | Implemented | **Working** | Cohort gap analytics, training intervention creation, student assignment, and pre/post effectiveness tracking. |

---

## 4. Placement Readiness Index (PRI)

| Feature | Current Prototype Status | Upgrade Classification | Action Required |
|---|---|---|---|
| Explainable Readiness Score | Partially working (client-side) | **Working** | Transparent formula: 35% Verified + 20% Evidence Coverage + 25% Practical Assessment + 10% Aptitude + 10% Interview. |
| Confidence & Weight Breakdown | Partially working | **Working** | Explain contributing factors clearly; zero unexplained "black-box" AI scores. |
| Role Switching & Re-indexing | Simulated | **Working** | Real-time recalculation of readiness score when targeting alternate industry roles. |

---

## 5. Intelligent Placement & Recruiter Workspace

| Feature | Current Prototype Status | Upgrade Classification | Action Required |
|---|---|---|---|
| Company & Job Management | Implemented (DB + API + UI) | **Working** | Company/job CRUD, college access control, JD skill extraction with human approval gate. |
| Versioned Rule Eligibility Engine | Implemented | **Working** | Versioned rules, rule-by-rule explanations, missing-data review, officer overrides with required reason. |
| Student Eligibility Appeals | Implemented | **Working** | Appeal submission, officer review queue, authorized academic correction, and recalculation. |
| Intelligent Placement Matching | Implemented | **Working** | Transparent compatibility scoring, expired evidence penalties, non-discriminatory guarantees. |
| Recruiter Workspace & Feedback | Implemented | **Working** | Authorized opportunities, private recruiter feedback, selection decisions, and verified talent search. |
| Drive Calendar & Conflict Management | Implemented | **Working** | Drive publishing, room/student interview conflict detection, and bulk communication preview/logs. |

---

## 6. Institutional Intelligence & Governance

| Feature | Current Prototype Status | Upgrade Classification | Action Required |
|---|---|---|---|
| Institutional Intelligence & Heatmaps | Implemented (DB + API + UI) | **Working** | Real-time cohort KPIs, branch filters, centralized metric definitions, and k-anonymity privacy checks. |
| Data Quality & Industry Demand Profiler | Implemented | **Working** | Automated data-quality scans + internal job demand vs cohort coverage (separating unapproved AI skills). |
| Governed Early-Warning Indicators | Implemented | **Working** | Historical data sufficiency gate (`>=30` labels); neutral rule-based support indicators with zero auto-rejection. |
| Multi-College University Governance | Implemented | **Working** | `university_college_access` scoping, aggregate-only comparisons, and `403` isolation for officers/recruiters. |
| SHA-256 Hash-Chained Audit Log | Implemented | **Working** | Cryptographic hash chaining `SHA-256(prev_hash + actor + action + timestamp)` with tamper detection. |
| Accreditation Reporting (NAAC / NIRF) | Implemented | **Working** | Traceable report snapshots, missing-data warnings, CSV & PDF exports, and non-endorsement disclaimers. |

---

## 7. Frontend-Backend Integration

| Feature | Current Prototype Status | Upgrade Classification | Action Required |
|---|---|---|---|
| Live API Connectivity | Missing | **Working** | Connect frontend views to live FastAPI endpoints while maintaining zero-breakage offline fallback. |
| Multi-Role View Switching | 
 (UI-level) | **Working** | Seamless switching between Student, T&P Officer, Recruiter, and University Administrator views. |
| Interactive Prototype Preservation | Working | **Working** | Ensure all 16 views and their interactive actions remain fully functional. |

---

## 8. Trust, Governance, DPDP Privacy, Fairness & Tamper-Evident Audit (Phase 8)

| Feature | Current Status | Upgrade Classification | Notes |
|---|---|---|---|
| Purpose-Specific Consent Center (6 categories) | Implemented (DB + API + UI) | **Working** | Independent toggle/revocation with `policy_version`, `category`, and backend `check_consent()` enforcement |
| Versioned Privacy Notice & Retention Policies | Implemented (DB + API + UI) | **Working** | `PrivacyNoticeVersion`, per-college `RetentionPolicy`, and non-certification DPDP disclaimer |
| DPDP Rights Requests (`data_export`, `deletion_erasure`, `correction`, `grievance`) | Implemented (DB + API + UI) | **Working** | Includes JSON export bundle, PII anonymization, and `restricted_retained` retention exceptions |
| Centralized `GovernanceService` & `DataAccessLog` | Implemented (Backend + UI) | **Working** | Cross-tenant & ownership checks, recruiter least-privilege, `SecurityEvent` logging, upload validation, secret redaction |
| Comprehensive Fairness Audit & `k < 3` Suppression | Implemented (Backend + UI) | **Working** | Rule-version drift, override justification, four-fifths ratio, and small-group suppression |
| Centralized `ExplanationService` | Implemented (Backend) | **Working** | Persists `ExplanationRecord` with inputs, evidence, missing data, and `ai_contributed` flag |
| Concurrency-Safe Hash Chain & HMAC Checkpoints | Implemented (Backend + UI) | **Working** | `_AUDIT_LOCK`, `AuditChainHead`, `AuditVerificationRun`, and HMAC-SHA256 `AuditCheckpoint` |
| HTTP Security Headers & Rate Limiting | Implemented (Middleware) | **Working** | `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and sliding-window `check_rate_limit()` |
