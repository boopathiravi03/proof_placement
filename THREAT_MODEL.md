# Threat Model — ProofHire 2.0

| Threat | Vector | Mitigation Implemented | Residual Risk / Next Step |
|---|---|---|---|
| Cross-tenant data exposure | Forged `college_id` query param or IDOR on `student_id` | `GovernanceService.authorize_and_log_access()` + PostgreSQL `tenant_isolation` RLS policies in `db/schema.sql` | Enforce `SET LOCAL app.current_college_id` per DB transaction in Postgres |
| Unauthorized recruiter snooping | Recruiter requesting raw learning logs or private notes | Least-privilege block in `authorize_and_log_access()` + `SecurityEvent` alert | Add automated alerting webhook on repeated `SecurityEvent` spikes |
| Consent bypass | Background sync or sharing after student revokes consent | `GovernanceService.check_consent()` gate + immediate `github_consent_revoked` flag | Audit all legacy sync jobs to ensure they route through `check_consent()` |
| Audit log tampering | Direct SQL UPDATE on `audit_logs` | `verify_chain_detailed()` recomputes all SHA-256 links; `AuditCheckpoint` HMAC signature | Anchor `AuditCheckpoint` externally (WORM/S3 Object Lock) |
| Malicious file upload | Uploading `.exe`, `.ps1`, `.sh`, or oversized payloads | `GovernanceService.validate_file_upload()` blocks dangerous extensions and `>10 MB` | Add AV/clamd scanning in production object storage pipeline |
| Credential/token leakage | Secret fields serialized into API responses/logs | `GovernanceService.redact_sensitive_fields()` | Add automated secret-scanning in CI |
