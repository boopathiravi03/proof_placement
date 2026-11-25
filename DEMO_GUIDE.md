# Hackathon Demo Guide (5-Minute Script) — ProofHire 2.0

## Pre-Demo Reset
```powershell
$env:PYTHONPATH="."; python scripts/reset_demo.py
```
Start backend (`uvicorn backend.app.main:app --port 8000`) and frontend (`cd frontend; npm run dev`).

## 5-Minute Walkthrough
1. **The Problem (30s):** Explain why static resumes and raw CGPA cutoffs hide real capability and create opaque hiring.
2. **Evidence Intelligence (60s):** Open `/student/dashboard` & `/student/evidence` as **Rahul K.** (`student-rahul-01`). Link a GitHub repository -> show competency moves to **`evidence_linked`**, *never* `verified`. Complete an adaptive assessment on `/student/assessment` (`assessed`), then show authorized mentor verification (`/officer/approvals` -> `verified`).
3. **Personalized Development & Readiness (60s):** Open `/student/readiness` and `/student/learning`. Select **Backend Developer**, inspect deterministic skill gaps and prerequisite-ordered learning tasks, and show how missing data is distinguished from low performance.
4. **Intelligent Placement & Eligibility (60s):** Open `/student/drives` and `/officer/approvals` / `/recruiter/discovery`. Show versioned eligibility rule explanations (`min_cgpa`, `max_backlogs`, required verified skills) separate from compatibility scoring.
5. **Institutional Intelligence (45s):** Open `/officer/cohort-insights` and `/officer/reports`. Show College A branch skill-gap heatmaps, training interventions, and NAAC/NIRF export snapshots.
6. **Trust, DPDP Privacy & Tamper-Evident Audit (45s):** Open `/student/privacy` (6 independent consent toggles, versioned DPDP notice, access logs) and `/officer/audit` (SHA-256 chain verification, HMAC checkpoint signing, `Simulate Tamper` detection, and College A vs College B isolation on `/university/colleges`).
