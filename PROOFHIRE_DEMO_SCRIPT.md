# ProofHire 2.0 — 5-Minute Live Demo Script

## Opening (0:00 – 0:30 | 30 seconds)
- **Screen:** `/` (`RootHomePage`)
- **Say:** "Traditional placement portals measure basic CGPA eligibility, but they fail to establish what students can actually demonstrate. Students submit unverified resumes, recruiters waste time screening, and colleges discover skill gaps too late. **ProofHire 2.0** is an evidence-based placement intelligence ecosystem connecting competency verification, adaptive assessments, personalized learning, explainable matching, and institutional governance."

## Part 1: Evidence Intelligence (0:30 – 1:30 | 60 seconds)
- **Screen:** `/student/dashboard` -> `/student/evidence` (Persona: **Rahul K.**, `student-rahul-01`)
- **Action:** Show Rahul's competency badges (`Claimed`, `Evidence-linked`, `Assessed`, `Verified`). Click GitHub sync / attach repository evidence.
- **Say:** "Notice our strict 6-state lifecycle: `Claimed -> Observed -> Evidence-linked -> Assessed -> Verified -> Expired`. Linking a GitHub repository moves a skill to **`Evidence-linked`**, *never* `Verified`. Why? Because repositories alone don't prove individual mastery under test conditions. Verification requires proctored assessment plus authorized mentor sign-off."

## Part 2: Student Development & Readiness (1:30 – 2:30 | 60 seconds)
- **Screen:** `/student/assessment` -> `/student/learning` -> `/student/readiness`
- **Action:** Show adaptive SQL assessment (difficulty Levels 1–3), then open `/student/learning` for **Backend Developer** and `/student/readiness`.
- **Say:** "When Rahul completes an adaptive assessment, topic-level accuracy updates his skill gaps and generates a prerequisite-ordered learning path. On the Readiness Index, we explicitly distinguish **missing data** from **low performance**—and we clearly label readiness as a preparation indicator, not a guarantee of employment."

## Part 3: Placement Workflow (2:30 – 3:30 | 60 seconds)
- **Screen:** `/student/drives` -> `/recruiter/discovery`
- **Action:** Show campus drive eligibility rules (`min_cgpa`, `max_backlogs`, required verified skills) separately from compatibility percentage.
- **Say:** "Eligibility is deterministic and versioned, while match compatibility is calculated separately with rule-by-rule explanations. Students can appeal eligibility decisions, and recruiters only see permitted, job-relevant verified evidence."

## Part 4: Institutional Intelligence (3:30 – 4:15 | 45 seconds)
- **Screen:** `/officer/cohort-insights` -> `/officer/reports`
- **Action:** Show branch skill-gap heatmap for College A and NAAC/NIRF export snapshot.
- **Say:** "For placement officers, ProofHire aggregates cohort gaps into branch heatmaps, tracks training interventions, suppresses cohorts under `k < 3` for privacy, and generates traceable NAAC/NIRF-oriented reports."

## Part 5: Trust & Governance (4:15 – 4:40 | 25 seconds)
- **Screen:** `/student/privacy` -> `/officer/audit` -> `/university/colleges`
- **Action:** Toggle one of the 6 independent consents, click **Verify Chain** and **Simulate Tamper** on `/officer/audit`, and show College A vs College B isolation.
- **Say:** "Students control 6 independent DPDP-aligned consents, every access is logged, College A and College B are tenant-isolated, and our SHA-256 hash-chained audit ledger immediately detects tampering."

## Closing (4:40 – 5:00 | 20 seconds)
- **Say:** "ProofHire moves campus placements beyond resume claims and basic eligibility filters toward evidence-backed talent development and transparent placement decisions. Thank you."
