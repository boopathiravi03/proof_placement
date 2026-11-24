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
| Role-Based Skill Gap Analysis | Simulated | **Working** | Compare verified & evidence-linked profile against target role requirements (Backend, Data Analyst, Frontend). |
| Actionable Learning Tasks | Simulated | **Working** | Step-by-step personalized remediation roadmap with dynamic progress bars. |
| Evidence Generation on Task Completion | Simulated | **Working** | Completing remediation tasks automatically issues fresh project/practice evidence into student profile. |

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
| Company & Job Management | Simulated | **Working** | CRUD for company profiles, job roles, required competencies, and drive metadata. |
| Versioned Rule Eligibility Engine | Partially working | **Needs security correction** | Snapshot rules version, student inputs, failed conditions, and decision timestamp. Persist in database. |
| Student Eligibility Appeals | Simulated | **Working** | Allow students to submit formal appeals against automated decisions for human T&P review. |
| Recruiter Verified Talent Search | Simulated | **Needs security correction** | Filter candidates by verified skills; ensure recruiters only see authorized student data. |
| Hiring Pipeline Management | Simulated | **Needs security correction** | Multi-stage pipeline (Shortlisted → Interview → Offer → Accepted) with officer approval gate on offers. |
| Drive Calendar & Conflict Management | Simulated | **Working** | Clash detection algorithm for multi-company campus visits and auto-allocation resolution. |

---

## 6. Institutional Intelligence & Governance

| Feature | Current Prototype Status | Upgrade Classification | Action Required |
|---|---|---|---|
| Cohort Skill Heatmaps | Simulated | **Working** | Departmental skill distribution (CSE, IT, ECE, MECH) highlighting at-risk batches. |
| Four-Fifths Fairness Monitoring | Partially working | **Working** | Calculate group selection rates and flag demographic impact ratios below 0.8 for human review. |
| Multi-College University View | Simulated | **Needs security correction** | Institutional benchmark dashboard with strict cross-college tenant data isolation. |
| SHA-256 Hash-Chained Audit Log | Partially working | **Needs security correction** | Enforce cryptographic hash chaining `SHA-256(prev_hash + actor + action + timestamp)` with tamper detection and immutable persistence. |
| DPDP Consent Management | Simulated | **Working** | Granular data consent toggles with instant revocation and audit logging. |
| Accreditation Reporting | Simulated | **Working** | Generate NAAC and NIRF formatted placement summary reports. |

---

## 7. Frontend-Backend Integration

| Feature | Current Prototype Status | Upgrade Classification | Action Required |
|---|---|---|---|
| Live API Connectivity | Missing | **Working** | Connect frontend views to live FastAPI endpoints while maintaining zero-breakage offline fallback. |
| Multi-Role View Switching | Working (UI-level) | **Working** | Seamless switching between Student, T&P Officer, Recruiter, and University Administrator views. |
| Interactive Prototype Preservation | Working | **Working** | Ensure all 16 views and their interactive actions remain fully functional. |
