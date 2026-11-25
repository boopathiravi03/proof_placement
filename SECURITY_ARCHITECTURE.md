# Security Architecture — ProofHire 2.0

## Defense-in-Depth Layers
1. **Transport & HTTP Middleware (`backend/app/main.py`):**
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - Sliding-window `check_rate_limit()` returning HTTP `429` on burst abuse.
2. **Tenant Isolation & RBAC:**
   - Multi-tenant partitioning by `college_id` across operational and governance tables.
   - PostgreSQL Row-Level Security (`tenant_isolation` policies in `db/schema.sql`) for `retention_policies`, `privacy_requests`, `data_access_logs`, `fairness_audits`, `explanation_records`, and `audit_checkpoints`.
   - Service-layer enforcement in `GovernanceService.authorize_and_log_access()` restricting students to own records, officers to own college, and recruiters to least-privilege verified summaries (blocking `learning_activity`, `private_repo`, `recruiter_feedback`, `academic_transcript_raw`).
3. **Upload & Secret Hygiene:**
   - `GovernanceService.validate_file_upload()` rejects executable/script extensions (`.exe`, `.sh`, `.bat`, `.cmd`, `.js`, `.php`, `.vbs`, `.ps1`) and payloads above 10 MB.
   - `GovernanceService.redact_sensitive_fields()` masks `password`, `password_hash`, `secret`, `token`, `access_token`, `github_token`, `private_notes`.
