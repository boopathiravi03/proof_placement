# ProofHire 2.0 – Versioned Eligibility Rules Engine

## 1. Supported Rule Criteria
- Minimum CGPA (`0.0 – 10.0`), Maximum active backlogs (`>= 0`), Standing arrears policy.
- Eligible departments / branches and graduation years.
- Required verified/assessed competencies and minimum assessment score (`0 – 100`).

## 2. Rule Versioning & Audit Preservation
- Creating or updating a rule via `EligibilityService.create_versioned_rule` increments `version` and marks older versions inactive without overwriting historical `eligibility_decisions`.
- Every `EligibilityDecision` stores `rule_id`, `rule_version`, `student_inputs`, `rule_items` (`criterion`, `result`, `explanation`), and `status` (`eligible`, `not_eligible`, `pending_verification`, `needs_manual_review`).
- Missing academic records yield `needs_manual_review` rather than silent failure.

## 3. Appeals & Human Overrides
- Students can submit `EligibilityAppeal` requests for incorrect academic data or evaluations; students cannot directly edit institution-controlled academic records.
- Officers can approve appeals with authorized corrections (`review_appeal`) and override decisions (`officer_override_decision` — requires a non-empty recorded reason and writes to the SHA-256 `audit_log`).
