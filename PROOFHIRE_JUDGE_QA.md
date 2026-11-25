# ProofHire 2.0 — Judge Q&A (32 Questions)

## Problem & Innovation
1. **What problem does ProofHire solve?**  
   Traditional campus placement portals filter by CGPA and static resume claims without verifying what students can actually demonstrate or helping them close skill gaps before drives arrive.
2. **Why is a traditional placement portal insufficient?**  
   Traditional portals track drive logistics and applications, but lack competency verification lifecycles, adaptive diagnostics, skill-gap remediation, and explainable fairness/audit controls.
3. **What makes ProofHire different?**  
   It unifies a strict 6-state competency lifecycle, adaptive assessments, deterministic prerequisite learning paths, versioned eligibility + separate compatibility scoring, institutional analytics, and tamper-evident auditing in one multi-tenant platform.
4. **Why is evidence-based verification important?**  
   It protects recruiters from inflated resumes and protects students from arbitrary filtering by tying every skill claim to inspectable artifacts, assessment scores, and human sign-off.
5. **Who benefits from this platform?**  
   Students (clear preparation roadmap + privacy control), T&P Officers (cohort heatmaps, interventions, compliance), Recruiters (verified talent discovery), and University Admins (aggregate cross-college benchmarking).

## AI & Technical Architecture
6. **Where exactly is AI used?**  
   AI-assisted workflows are used for job-description skill extraction (`company_job_service.py` with human approval gates), learning path/project recommendations, and institutional insight summaries—all paired with deterministic fallbacks and `ExplanationRecord` logging.
7. **Why not use AI to verify GitHub skills directly?**  
   Public repositories can be forked, copied, or AI-generated. Therefore `CompetencyService.evaluate_state()` enforces that GitHub/repo evidence only reaches `evidence_linked`, never `verified`.
8. **How does adaptive assessment work?**  
   `AssessmentService` spans 10 categories and 3 difficulty tiers (Levels 1–3). Correct answers scale difficulty up; incorrect answers scale down; `correct_option_index` is stripped before serving questions; passing (`>=60%`) transitions the skill to `assessed`.
9. **How is the Placement Readiness Index calculated?**  
   `ReadinessService` uses a documented weighted formula combining verified competencies, evidence coverage, practical assessment performance, aptitude, and interview readiness, explicitly separating missing data from low scores.
10. **How do you prevent hallucinated recommendations?**  
    `LearningPathService.validate_recommendations()` validates task dependencies against the canonical skill taxonomy and verified resource catalog, falling back to deterministic topological paths if invalid.
11. **What happens when the LLM API is unavailable?**  
    Every AI-assisted module has a deterministic rule-based/topological fallback so the entire application remains 100% functional without any external LLM API key.
12. **Why did you choose your technology stack?**  
    Next.js 14 App Router + TypeScript + Tailwind CSS provide a fast, typed enterprise UI; FastAPI + SQLAlchemy + Pydantic provide high-speed OpenAPI-typed APIs and dual SQLite (zero-config demo) / PostgreSQL+Supabase (production RLS) support.

## Data & Security
13. **How do you protect student data?**  
    `GovernanceService.authorize_and_log_access()` enforces role ownership, tenant matching, recruiter least-privilege, sensitive field redaction, upload extension/size blocking, HTTP security headers, and rate limiting.
14. **How do you isolate different colleges?**  
    Every student, competency, drive, report, and audit row carries `college_id`. Service queries filter by `college_id`, `GovernanceService` rejects cross-tenant access (`SecurityEvent` logged), and `db/schema.sql` defines PostgreSQL RLS `tenant_isolation` policies.
15. **How does GitHub OAuth work?**  
    Implemented with public GitHub API inspection + demo fallback (`github_service.py`), strictly gated by `github_sync` consent. Full live OAuth exchange activates when `GITHUB_CLIENT_ID`/`SECRET` are configured.
16. **How do you handle revoked consent?**  
    Students toggle 6 independent consents in `GovernanceService`. Revoking `github_sync` immediately clears sync flags (`github_consent_revoked = True`) and blocks future scans via `check_consent()`.
17. **How do you prevent unauthorized recruiters from accessing evidence?**  
    `GovernanceService.authorize_and_log_access()` restricts `recruiter` actors from `learning_activity`, `private_repo`, `recruiter_feedback`, and `academic_transcript_raw`, logging every attempt to `DataAccessLog`.
18. **How does the audit hash chain work?**  
    `AuditService.log_event()` serializes writes via `_AUDIT_LOCK`, computes `SHA-256(prev_hash + actor + action + timestamp)`, updates `AuditChainHead`, and supports full-chain verification (`verify_chain_detailed`) plus HMAC-SHA256 `AuditCheckpoint` signing.

## Fairness & Transparency
19. **Can AI reject a student?**  
    **No.** Early-warning indicators require `>=30` historical labels, use neutral support framing, and never auto-reject candidates. Eligibility and hiring decisions require deterministic rules or human review.
20. **How do you prevent unfair eligibility decisions?**  
    `EligibilityService` evaluates versioned rules with full input snapshots, while `FairnessService.run_comprehensive_fairness_audit()` checks rule drift, unjustified overrides, and four-fifths (`80%`) disparate impact with `k < 3` small-group suppression.
21. **Can students challenge incorrect eligibility results?**  
    Yes. Students submit eligibility appeals, which enter the officer review queue for academic correction or documented override (`override_reason` required).
22. **How do you explain matching scores?**  
    `MatchingService` separates deterministic eligibility from compatibility scoring, returning skill-by-skill alignment, expired-evidence penalties, and missing-data warnings.
23. **Does a high readiness score guarantee placement?**  
    **No.** Both the UI and documentation explicitly label Readiness Index as a preparation indicator, not a probability or guarantee of employment.

## Scalability & Business
24. **How would ProofHire scale to hundreds of colleges?**  
    Multi-tenant `college_id` indexing + PostgreSQL RLS, stateless FastAPI workers behind a load balancer, Redis-backed rate limiting, and Next.js static/CDN delivery via Vercel.
25. **What are the infrastructure requirements?**  
    A managed PostgreSQL instance (e.g., Supabase), a Python ASGI host (Render), and a Next.js host (Vercel), plus optional SMTP and GitHub OAuth credentials.
26. **How could colleges adopt the platform?**  
    Zero-disruption pilot on one graduating cohort using CSV/API onboarding, connecting existing campus drives and mentor sign-offs while preserving institutional data ownership.
27. **What are the operational costs?**  
    Core platform runs without mandatory LLM API calls due to deterministic fallbacks, keeping per-student compute costs low (database + ASGI + static hosting).
28. **How would you measure real-world success?**  
    By tracking skill-gap closure rates (pre/post reassessment improvement), percentage of competencies backed by verified evidence, reduction in drive eligibility disputes, and placement conversion rates across cohorts.

## Limitations & Future Scope
29. **What is currently incomplete?**  
    Live SMTP dispatch and full GitHub OAuth token exchange require external provider keys (simulated/fallback modes are active and labeled); code execution uses AST + simulated test running rather than a Docker container jail; automated Playwright UI tests are not yet added.
30. **What would you build next?**  
    Containerized code execution sandboxing, Redis-backed distributed rate limiting, external WORM anchoring for `AuditCheckpoint` hashes, and automated Playwright browser E2E tests.
31. **What happens if a college has insufficient historical data?**  
    `InstitutionalIntelligenceService` enforces a `>=30` historical record gate before surfacing predictive early-warning indicators and flags data-quality gaps explicitly instead of fabricating trends.
32. **How would you validate the effectiveness of the platform?**  
    Through controlled cohort pilots comparing pre-intervention vs post-intervention reassessment scores, recruiter shortlist-to-offer ratios, and officer audit/compliance turnaround time.
