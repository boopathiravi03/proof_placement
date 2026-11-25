# Privacy Governance — ProofHire 2.0

## Governance Principles
ProofHire operates as an institutional placement intelligence platform where **colleges remain Data Fiduciaries** for their students and **students retain granular control** over optional telemetry and sharing.

## Governance Controls Implemented
1. **Centralized Enforcement (`backend/app/services/governance_service.py`):**
   - Purpose-specific consent verification (`check_consent`)
   - Role & tenant authorization (`authorize_and_log_access`)
   - Data access transparency logging (`DataAccessLog`)
   - Security anomaly tracking (`SecurityEvent`)
2. **Privacy Notices & Rights (`backend/app/services/privacy_retention_service.py`):**
   - Versioned `PrivacyNoticeVersion` (`v2.0`)
   - Configurable per-college `RetentionPolicy` records (`github_sync`, `evidence`, `assessment_attempts`, `learning_activity`, `applications`, `recruiter_feedback`, `audit_log`, `institutional_reports`)
   - Student rights workflow (`PrivacyRequest` for `data_export`, `deletion_erasure`, `correction`, `grievance`), including `restricted_retained` institutional retention exceptions.
3. **Important Legal Disclaimer:**
   ProofHire's privacy workflows are designed with reference to India's Digital Personal Data Protection (DPDP) Act, 2023. Institutional legal review is required before production deployment; ProofHire does not claim formal legal certification.
