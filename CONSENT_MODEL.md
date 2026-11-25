# Consent Model — ProofHire 2.0

## Purpose-Specific Consent Categories
Implemented in `backend/app/services/governance_service.py` (`CONSENT_CATEGORIES`) and stored in `consents` (`category`, `purpose`, `policy_version`, `collection_method`, `data_categories`, `granted`, `granted_at`, `revoked_at`):

1. `github_sync` (`github_integration`): Public repository metadata & language analysis.
2. `evidence_sharing_recruiters` (`evidence_sharing`): Verified competency & evidence metadata visibility to authorized recruiters.
3. `assessment_evaluation` (`assessment_data`): Diagnostic assessment scores for readiness & eligibility.
4. `learning_activity_analytics` (`learning_activity`): Personalized learning roadmap & task tracking.
5. `recruiter_sharing` (`placement_participation`): Inclusion in authorized campus drive matching.
6. `institutional_analytics` (`institutional_analytics`): Aggregated/anonymized cohort metrics for NAAC/NIRF reporting.

## Independence & Auditability
- Revoking any single consent updates `revoked_at` and logs an event via `AuditService.log_event()`.
- Revoking `github_sync` immediately sets `Student.github_consent_revoked = True` and `Student.github_connected = False`.
- Unrelated workflows continue unaffected when an optional category is revoked.
