# DPDP Alignment — ProofHire 2.0

> **Notice:** Configured with reference to India's Digital Personal Data Protection (DPDP) Act, 2023. Institutional legal review is required before production deployment; ProofHire does not claim formal legal certification.

## Capability Mapping
- **Notice & Transparency:** `PrivacyNoticeVersion` served via `GET /api/governance/privacy-notice` and rendered in `frontend/src/app/(student)/student/privacy/page.tsx`.
- **Purpose-Specific Consent:** 6 independent consent toggles persisted with `policy_version` and timestamps (`GET/POST /api/governance/consent`).
- **Right to Access & Export:** `PrivacyRequest` (`data_export`) generates a structured JSON export bundle (`student`, `competencies`, `assessments_count`) upon officer approval.
- **Right to Correction & Grievance:** `PrivacyRequest` supports `correction` and `grievance` workflows with officer notes and audit trail.
- **Right to Erasure & Retention Exceptions:** `deletion_erasure` requests support either PII anonymization (`approved` -> `Anonymized-<id>`, clearing GitHub metadata) or documented institutional hold (`restricted_retained` -> `retention_exception_applied = True`), while preserving tamper-evident audit chain integrity.
