# ProofHire 2.0 – Campus Drive & Bulk Communication Workflow

## 1. End-to-End Drive Lifecycle
`Create Company → Create Job Opportunity (with optional JD skill extraction + human approval) → Configure Eligibility Rules → Create & Publish Campus Drive (Officer/Admin only) → Evaluate Cohort → Student Applications (deadline & duplicate checks) → Selection Stage Transitions → Interview Scheduling (room/student conflict checks) → Final Selection Decision → Analytics & CSV Export`

## 2. Selection Stage Transitions
Allowed transitions enforced in `DriveService.advance_selection_stage`:
- `applied` → `under_review` | `shortlisted` | `not_selected` | `withdrawn`
- `under_review` → `shortlisted` | `assessment_scheduled` | `not_selected` | `withdrawn`
- `shortlisted` → `assessment_scheduled` | `interview_scheduled` | `not_selected` | `withdrawn`
- `assessment_scheduled` → `interview_scheduled` | `shortlisted` | `not_selected` | `withdrawn`
- `interview_scheduled` → `selected` | `not_selected` | `withdrawn`
- Terminal states (`selected`, `not_selected`, `withdrawn`) reject further mutations; `SelectionDecision` prevents duplicate final decisions.

## 3. Bulk Communications
`CommunicationService` supports `preview_bulk_email` and `send_bulk_communication` with recipient deduplication and DPDP `drive_communications` consent checks. When `SMTP_HOST` is not configured, dispatches run in clearly labelled `simulated_preview` mode and never claim an email was sent.
