# ProofHire 2.0: Evidence-Based Talent Intelligence & Placement Ecosystem

[![Tests: 19 Passed](https://img.shields.io/badge/Tests-19%20Passed-0f9d73?style=flat-square)]()
[![Frontend: Next.js 14 App Router](https://img.shields.io/badge/Frontend-Next.js%2014%20App%20Router-black?style=flat-square)]()
[![Backend: FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square)]()
[![Database: Postgres%20%7C%20SQLite](https://img.shields.io/badge/Database-Postgres%20%7C%20SQLite-336791?style=flat-square)]()
[![Security: SHA--256%20Chain](https://img.shields.io/badge/Audit-SHA--256%20Chain-6c4cf0?style=flat-square)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=flat-square)]()

ProofHire 2.0 transforms student potential into verifiable competency through evidence-linked talent intelligence and transparent placement decisions across five interconnected engines.

---

## 🏛️ The Five Core Engines

1. **Evidence Intelligence Engine**:
   - Implements the strict 6-stage competency lifecycle:  
     $$\text{Claimed} \longrightarrow \text{Observed} \longrightarrow \text{Evidence-linked} \longrightarrow \text{Assessed} \longrightarrow \text{Verified} \longrightarrow \text{Expired}$$
   - **Strict Verification Guarantee:** GitHub commits or repository activity alone **NEVER** verify a skill. They yield `Evidence-linked` status. `Verified` status strictly requires a validated assessment ($\ge 60\%$) + an authorized mentor sign-off or live walkthrough.
   - Granular Indian DPDP consent controls with instant revocation.

2. **Adaptive Competency Assessment Engine**:
   - Multi-tier dynamic question bank covering SQL, Python, DSA, Git, and Aptitude.
   - Real-time difficulty adaptation (Levels 1 to 3) reacting to student responses.
   - Scoring, test history, weak-topic diagnostics, and automated transition to `Assessed` upon scoring $\ge 60\%$.

3. **Personalized Career Development Engine**:
   - Role-specific skill gap analysis (Backend, Data Analyst, Frontend, Full-Stack).
   - Milestone learning roadmaps where every completed task automatically generates fresh verifiable evidence into the candidate profile.

4. **Intelligent Placement & Recruiter Matching Engine**:
   - Versioned eligibility evaluation (`min_cgpa`, `max_backlogs`, `required_skills`).
   - Immutable decision snapshots preventing black-box AI rejections.
   - Formal student appeal workflows for human placement officer adjudication.
   - Verified candidate discovery with transparent match reasoning and verification expirations.
   - Multi-company campus drive calendar with automated conflict detection and slot reallocation.

5. **Institutional Placement Intelligence Engine**:
   - Departmental skill deficiency heatmaps across cohorts (CSE, IT, ECE, MECH).
   - Four-fifths rule (80%) disparate impact fairness monitoring.
   - Cross-college benchmarking preserving strict tenant isolation via Row-Level Security (RLS).
   - Cryptographic append-only SHA-256 hash-chained audit ledger with interactive tamper detection.

---

## 💻 Modern Next.js Frontend (App Router)

The platform frontend is built with **Next.js 14 App Router**, **TypeScript**, and **Tailwind CSS**, preserving the signature ProofHire design identity (`--side: #18123f`, `--pri: #6c4cf0`, Plus Jakarta Sans typography).

### Complete 16-View Directory

| # | Domain | View Title | Route | Description |
|:---:|:---:|---|---|---|
| **1** | **Student** | **Dashboard** | [`/student/dashboard`](http://localhost:3000/student/dashboard) | Placement readiness ring, GitHub connect/revoke, 4 skill cards, Acme Tech gap alert, mock drive report |
| **2** | **Student** | **Readiness** | [`/student/readiness`](http://localhost:3000/student/readiness) | Target role selector, 5-factor weighted breakdown (35% verified, 20% evidence, 25% test, 10% apt, 10% iv) |
| **3** | **Student** | **Evidence** | [`/student/evidence`](http://localhost:3000/student/evidence) | Proof submission (NPTEL, Hackathon, Lab record) and mentor sign-off workflow |
| **4** | **Student** | **Assessment** | [`/student/assessment`](http://localhost:3000/student/assessment) | Adaptive 5-question technical exam with real-time level scaling and diagnostic history |
| **5** | **Student** | **Learning Path** | [`/student/learning`](http://localhost:3000/student/learning) | Remediation milestones where completed tasks emit verifiable code/practice proof |
| **6** | **Student** | **Resume** | [`/student/resume`](http://localhost:3000/student/resume) | On-demand resume compiler featuring evidence-backed skills only (omits claimed skills) |
| **7** | **Student** | **Privacy & Consent** | [`/student/privacy`](http://localhost:3000/student/privacy) | DPDP consent toggles (LeetCode, Recruiter sharing, GitHub revocation) & explainability |
| **8** | **Student** | **My Drives** | [`/student/drives`](http://localhost:3000/student/drives) | Acme Tech drive rules v3 check with pass/fail breakdown and human appeal trigger |
| **9** | **Officer** | **Cohort Insights** | [`/officer/cohort-insights`](http://localhost:3000/officer/cohort-insights) | Branch deficiency heatmap across CSE/IT/ECE/MECH, Docker alert, four-fifths fairness table |
| **10** | **Officer** | **Approvals Queue** | [`/officer/approvals`](http://localhost:3000/officer/approvals) | Human-in-the-loop review for predictive agent alerts and skill workshops |
| **11** | **Officer** | **Talent Search** | [`/officer/talent-search`](http://localhost:3000/officer/talent-search) | Candidate discovery filtered by verified skills with transparent match reasons |
| **12** | **Officer** | **Drive Calendar** | [`/officer/calendar`](http://localhost:3000/officer/calendar) | 5-day placement drive calendar with automated clash detection and slot reallocation |
| **13** | **Officer** | **Reports & Export** | [`/officer/reports`](http://localhost:3000/officer/reports) | Before vs after intervention gap closure comparison & statutory NAAC/NIRF export |
| **14** | **Officer** | **Audit Log** | [`/officer/audit`](http://localhost:3000/officer/audit) | SHA-256 hash-chained ledger with interactive tamper simulation |
| **15** | **Recruiter** | **Hiring Pipeline** | [`/recruiter/hiring-pipeline`](http://localhost:3000/recruiter/hiring-pipeline) | Candidate pipeline (Shortlisted → Interview → Offer → Accepted) with officer approval gate |
| **16** | **University** | **University View** | [`/university/dashboard`](http://localhost:3000/university/dashboard) | Cross-college comparative benchmark (College A, B, C) with strict tenant isolation |

---

## 🚀 Quickstart & Setup

### 1. Prerequisites
- **Node.js**: v18.0.0+ (Tested on v24.18.0)
- **Python**: 3.10+ (Tested on 3.11.9)
- **Git** (optional)

---

### 2. Backend Setup (FastAPI)
The backend provides 11 REST API modules, automatic SQLite database initialization, pre-seeded data, and dual PostgreSQL support:

```bash
# Clone the repository and enter workspace
cd proof_placement

# Install Python backend dependencies
pip install -r backend/requirements.txt

# Start the FastAPI backend
python -m uvicorn backend.main:app --reload --port 8000
```

- **Interactive API Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **API Health Check**: [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

### 3. Frontend Setup (Next.js 14)

```bash
# From the project root, enter the frontend directory
cd frontend

# Install Node dependencies
npm install

# Start the Next.js development server
npm run dev
```

Visit **[http://localhost:3000](http://localhost:3000)** in your browser.

To generate an optimized production build:
```bash
npm run build
npm run start
```

---

### 4. Original HTML Prototype Backup
The original standalone single-page prototype is preserved in:
- `frontend-prototype/index.html` (can be opened directly in any browser with zero dependencies)

---

## 🧪 Automated Test Suite

Run the full automated test suite covering state transitions, rule versioning, fairness impact ratios, cryptographic audit integrity, and tenant isolation:

```bash
python -m unittest discover -s tests -v
```

```
test_adaptive_question_router (test_api_endpoints) .................... ok
test_add_evidence_router (test_api_endpoints) ......................... ok
test_audit_trail_router (test_api_endpoints) .......................... ok
test_competency_router (test_api_endpoints) ........................... ok
test_eligibility_router (test_api_endpoints) .......................... ok
test_officer_cohort_insights_router (test_api_endpoints) .............. ok
test_readiness_router (test_api_endpoints) ............................ ok
test_university_summary_router (test_api_endpoints) ................... ok
test_hash_chain_creation_and_tamper_detection (test_audit_chain) ...... ok
test_assessment_produces_assessed (test_competency) ................... ok
test_default_state_is_claimed (test_competency) ....................... ok
test_expired_state (test_competency) .................................. ok
test_github_commits_produce_evidence_linked_never_verified (test_comp)  ok
test_mentor_signoff_produces_verified (test_competency) ............... ok
test_eligible_candidate (test_eligibility) ............................ ok
test_ineligible_due_to_backlogs_and_skills (test_eligibility) .......... ok
test_four_fifths_disparate_impact_detection (test_fairness) ........... ok
test_cross_college_audit_isolation (test_tenant_isolation) ............ ok
test_cross_college_student_isolation (test_tenant_isolation) .......... ok

----------------------------------------------------------------------
Ran 19 tests in 0.101s — OK (100% Passing)
```

---

## 🎯 Hackathon Demonstration Script (Step-by-Step)

Follow this walkthrough to showcase the platform's capabilities during evaluations:

### Step 1: Student Talent Profile (`Dashboard`)
1. Open [http://localhost:3000/student/dashboard](http://localhost:3000/student/dashboard).
2. Observe **Rahul K.'s** Placement Readiness score gauge (64/100).
3. Notice **SQL** is in `Claimed` state with a red alert indicating Acme Tech demands it.
4. Click **"Connect GitHub"**:
   - Explain read-only consent under DPDP principles.
   - Notice **Python** and **Git** transition to `Evidence-linked` (never `Verified`).
   - The readiness index updates dynamically.

### Step 2: Adaptive Technical Assessment (`Assessment`)
1. Navigate to **Assessment** via sidebar or the card button.
2. Answer the questions:
   - Notice the complexity level adjusts between Level 1, 2, and 3 depending on whether your answer is correct.
3. Complete all 5 questions:
   - Score $\ge 3/5$ promotes SQL to `Assessed` status.
   - Point out: *"Assessment alone does not verify a skill; it requires an authorized mentor sign-off."*

### Step 3: Verifiable Evidence & Mentor Sign-Off (`Evidence`)
1. Navigate to **Evidence**.
2. Click **"Add DBMS Lab Record (SQL)"** to attach practical laboratory proof.
3. Click **"Request Mentor Sign-Off (SQL)"**:
   - Prof. Meena verifies the candidate.
   - SQL transitions to `Verified` (State 4) with high confidence (0.98) and a 12-month expiration timestamp.

### Step 4: Transparent Placement Readiness (`Readiness`)
1. Navigate to **Readiness**.
2. Walk through the explainable breakdown:
   - 35% Verified Competencies + 20% Evidence Coverage + 25% Practical Assessment + 10% Aptitude + 10% Interview.
3. Switch target roles between **Backend**, **Data Analyst**, and **Frontend** to demonstrate dynamic recalculation and gap identification.

### Step 5: Explainable Eligibility & Appeals (`My Drives`)
1. Navigate to **My Drives** (Acme Tech Backend Requisition).
2. Inspect the automated rule check (Rules v3):
   - CGPA passes ($\ge 7.0$), SQL Verified passes, active backlogs fails ($1 > 0$).
   - Candidate status: **Not Eligible**.
3. Click **"Submit Human Appeal"**:
   - Emphasize: *AI never makes final rejections; students have a statutory right of review.*

### Step 6: Recruiter Talent Discovery & Hiring Pipeline (`Talent Search` & `Hiring Pipeline`)
1. Navigate to **Talent Search**:
   - Filter candidates by verified skill (**SQL**, **Docker**, **Python**).
   - Point out transparent match reasons and verification expiration dates.
2. Navigate to **Hiring Pipeline**:
   - Advance candidate from **Shortlisted** → **Interview** → **Offer**.
   - Note the institutional approval gate: issuing an official offer requires placement officer confirmation.

### Step 7: Drive Operations & Calendar Clash Management (`Drive Calendar`)
1. Navigate to **Drive Calendar**:
   - Notice the system flags an automated conflict: **1 Slot Clash on Wednesday** (Gamma Labs & Beta Soft).
2. Click **"Confirm Slot Reallocation"**:
   - Reallocates Beta Soft to Thursday, optimizing company schedules without student clashes.

### Step 8: T&P Officer Intelligence & Fairness (`Cohort Insights` & `Approvals Queue`)
1. Navigate to **Cohort Insights**:
   - View the branch deficiency heatmap across **CSE**, **IT**, **ECE**, and **MECH**.
   - Highlight the **Four-Fifths Rule Fairness Monitoring Table**: demographic cohorts with impact ratios below 0.80 are flagged for human review.
2. Navigate to **Approvals Queue**:
   - Review agent recommendations (at-risk alerts and skill gap workshops).
   - Click **"Approve Proposal"** to log the intervention.

### Step 9: Multi-College Benchmark & Tamper-Evident Audit (`University View` & `Audit Log`)
1. Navigate to **University View**:
   - Show cross-college benchmarking (College A vs College B vs College C) with strict tenant data isolation.
2. Switch tenant in the sidebar between **College A** and **College B**:
   - Watch the data dynamically update to reflect the selected college.
3. Navigate to **Audit Log**:
   - Observe the SHA-256 hash-chained immutable ledger.
   - Click **"Simulate Tampering"**:
     - The entry is modified, the cryptographic chain breaks, and the status badge immediately flags **"Integrity Broken!"**.

---

## 📂 Codebase Directory Layout

```
proof_placement/
├── backend/
│   ├── app/
│   │   ├── config.py           # Dual DB configuration & environment settings
│   │   ├── database.py         # SQLAlchemy engine & session factory
│   │   ├── security.py         # JWT tokens & bcrypt password hashing
│   │   ├── seed.py             # Automatic database seeding & genesis blocks
│   │   ├── models/             # Normalized schema (20+ entities)
│   │   ├── schemas/            # Pydantic request & response DTOs
│   │   ├── services/           # Business engines (Competency, Assessment, Audit, etc.)
│   │   └── routers/            # 11 REST API modules (/api/*)
│   ├── main.py                 # FastAPI application entrypoint
│   └── requirements.txt        # Production backend dependencies
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/         # Login and Register routes
│   │   │   ├── (student)/      # 8 Student routes (dashboard, readiness, etc.)
│   │   │   ├── (officer)/      # 6 Officer routes (cohort-insights, approvals, etc.)
│   │   │   ├── (recruiter)/    # Recruiter routes (hiring-pipeline)
│   │   │   ├── (university)/   # University routes (dashboard)
│   │   │   ├── layout.tsx      # App shell with QueryProvider & theme
│   │   │   ├── page.tsx        # Root redirect
│   │   │   └── globals.css     # Tailwind custom properties & typography
│   │   ├── components/
│   │   │   ├── layouts/        # Sidebar, Header, DashboardLayout
│   │   │   ├── ui/             # ReadinessRing, SkillCard, StatCard, SkillBadge
│   │   │   └── providers/      # TanStack Query & AppContext provider
│   │   ├── context/            # React AppContext global client state
│   │   ├── lib/                # API client (FastAPI wrapper) & utils (clsx, twMerge)
│   │   └── types/              # Full TypeScript definitions
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── next.config.mjs
├── frontend-prototype/
│   └── index.html              # Preserved original HTML5/CSS3 prototype
├── db/
│   └── schema.sql              # Supabase/PostgreSQL schema with PL/pgSQL triggers & RLS
├── tests/                      # 19 automated tests
├── PROJECT_AUDIT.md            # Comprehensive architectural audit
├── IMPLEMENTATION_ROADMAP.md   # Phased implementation plan
├── FEATURE_STATUS.md           # Feature status matrix
├── .env.example                # Example environment configuration
└── README.md                   # Full runbook & setup instructions
```

---

## 📜 License
Educational and Hackathon Project – MIT License.
