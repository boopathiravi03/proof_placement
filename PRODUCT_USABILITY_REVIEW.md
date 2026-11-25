# Product Usability Review — ProofHire 2.0

## Evaluation Across Four Roles
1. **Student (`/student/*`):** Clear progression across Dashboard, Evidence, Assessment, Learning Path, Readiness, Drives, Resume, and Privacy. `CompetencyBadge` separates all 6 states with icon + label. *Minor friction:* 8 nav items can feel dense on first visit; landing directly on `/student/dashboard` helps orient the user.
2. **Placement Officer (`/officer/*`):** Cohort Insights, Approvals, Talent Search, Drive Calendar, Reports, and Audit Log cover daily operations cleanly. *Minor friction:* Officer Approvals & Eligibility overrides are spread across `/officer/approvals` and `/officer/audit` fairness checks.
3. **Recruiter (`/recruiter/*`):** Discovery, Jobs, Hiring Pipeline, Interviews, and Dashboard keep candidate cards focused on verified skills and permitted summaries. *Minor friction:* Recruiter login/demo switcher uses shared demo tenant context rather than per-company OAuth onboarding.
4. **University Administrator (`/university/*`):** Dashboard, Colleges, Analytics, and Admin cleanly separate aggregate metrics from student PII.

## Overall Usability Verdict
Cohesive enterprise navy-and-blue UI with strong accessibility landmarks (`RoleLayout.tsx`, `Modal.tsx`, `globals.css`). Main UX gap is lack of automated Playwright verification of mobile viewports.
