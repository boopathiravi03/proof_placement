# ProofHire 2.0 — Product Walkthrough & Recovery Runbook

## 1. Pre-Demo Setup & Reset
```powershell
# Terminal 1 (Backend)
$env:PYTHONPATH="."; python scripts/reset_demo.py
$env:PYTHONPATH="."; uvicorn backend.app.main:app --port 8000

# Terminal 2 (Frontend)
cd frontend; npm run dev
```
Verify `http://localhost:8000/api/health` returns `{"status": "healthy"}` and `http://localhost:3000` loads cleanly.

## 2. Seeded Demo Personas (Fictional Data Only)
- **Student (College A):** Rahul K. (`student-rahul-01`)
- **Student (College A, Verified):** Anita S. (`student-anita-02`)
- **Student (College B):** Neha V. (`demo-b-student-01`)
- **T&P Officer (College A):** `officer@apex.edu`
- **Recruiter:** `recruiter@acme.tech`
- **University Admin:** `admin@university.edu`

## 3. Exact Navigation & Expected Outcomes
1. `/student/dashboard` -> Shows Rahul's readiness, verified vs evidence-linked counts, and next recommended actions.
2. `/student/evidence` -> Adding repo/project evidence transitions skill to `evidence_linked` (never `verified`).
3. `/student/assessment` -> Starting SQL assessment serves questions without exposing `correct_option_index`; passing (`>=60%`) promotes skill to `assessed`.
4. `/student/learning` -> Selecting `Backend Developer` generates topological prerequisite tasks; submitting task evidence creates `evidence_linked` artifact.
5. `/student/readiness` -> Displays weighted PRI breakdown and missing-data indicators.
6. `/student/drives` -> Displays versioned eligibility decision separate from compatibility score.
7. `/student/privacy` -> Displays 6 independent consent toggles, DPDP v2.0 notice, rights request form, and `DataAccessLog` table.
8. `/officer/cohort-insights` & `/officer/reports` -> Displays College A branch gap heatmap and accreditation export snapshots.
9. `/officer/audit` -> Click **Verify Chain** (`100% Intact`), **Sign Checkpoint** (HMAC-SHA256), then **Simulate Tamper** (`Chain Integrity Broken!`).
10. `/recruiter/discovery` & `/recruiter/hiring-pipeline` -> Shows verified candidates and dual-approval pipeline.
11. `/university/colleges` -> Shows aggregate College A vs College B comparison without exposing individual student PII.

## 4. Recovery Steps
If demo data becomes modified (e.g., after clicking **Simulate Tamper** or revoking consents), run:
```powershell
$env:PYTHONPATH="."; python scripts/reset_demo.py
```
Then refresh the browser.
