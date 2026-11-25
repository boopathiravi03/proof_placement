# ProofHire 2.0 – Recruiter Access & Least-Privilege Model

## 1. Tenant & Company Authorization
- Recruiters are scoped via `company_college_access` (`company_id`, `college_id`, `authorized`).
- `GET /api/recruiter/authorized-opportunities` enforces college-level tenant isolation (`403 Forbidden` on cross-college access) and returns only opportunities for authorized companies.

## 2. Student Privacy Boundaries
- `GET /api/recruiter/talent-search` surfaces only `verified` and `assessed` competencies — never unverified self-claims or private learning-path activity.
- `RecruiterFeedback` records are stored with `is_private=True` and are never exposed on student endpoints.
- AI never issues final hiring or rejection decisions; human recruiters and placement officers record decisions through auditable endpoints.
