# End-to-End Test Plan — ProofHire 2.0

## 1. Automated Backend & Integration Test Suites
- **Phases 1–8 Unit & Service Suites (`tests/test_*.py`):** 62 unit/service tests covering competency lifecycle, GitHub consent, adaptive assessments, learning paths, skill gaps, placement matching, eligibility rules, institutional analytics, university governance, RBAC, DPDP privacy, fairness auditing, and SHA-256 audit chains.
- **Phase 9 End-to-End Integration Suite (`tests/test_phase9_e2e_integration.py`):**
  1. **Student Journey:** Onboarding -> Consent grant -> GitHub/evidence link (`evidence_linked`, never `verified`) -> Adaptive assessment (`assessed`) -> Mentor approval (`verified`) -> Readiness index -> Learning path generation & task submission -> Campus drive application.
  2. **Officer Journey:** Cohort gap inspection -> Training intervention -> Company/job/rule creation -> Drive publication -> Eligibility override with reason -> Accreditation report -> Audit chain verification & controlled tamper detection.
  3. **Recruiter Journey:** Authorized opportunity access -> Verified candidate discovery -> Shortlist -> Interview & structured feedback -> Final decision -> Cross-tenant/least-privilege rejection.
  4. **University Journey:** Authorized college aggregation -> Cross-college isolation check.
  5. **AI Fallback & Contract Verification:** OpenAPI schema generation check (`>=120` paths), deterministic fallback when external LLM keys are absent, and simulated email preview behavior when `SMTP_HOST` is unset.

## 2. Frontend Build & Manual Browser Walkthrough
- `npm run build` in `frontend/` verifying TypeScript types, ESLint rules, and all 30 App Router routes.
- Live Uvicorn + Next.js verification following `DEMO_GUIDE.md`.
