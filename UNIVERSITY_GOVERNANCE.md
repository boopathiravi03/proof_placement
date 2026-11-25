# ProofHire 2.0 – University Multi-College Governance

`UniversityService.get_authorized_colleges_summary` enforces strict multi-tenant governance:
- **Authorized Scope:** University administrators only view colleges explicitly granted in `university_college_access` (or all constituent colleges when unscoped as a university-level admin).
- **Role Restrictions:** `student`, `recruiter`, and college-level `officer` accounts receive `403 Forbidden` on cross-college university analytics (`/api/university/authorized-overview`).
- **Zero PII Leakage:** Returns strictly aggregate college-level metrics, reporting completeness, and data-quality warning counts.
