# ProofHire 2.0 – Intelligent Placement Matching Engine

## 1. Transparent Matching Formula
`MatchingService.calculate_student_job_match` evaluates compatibility using only verifiable, non-discriminatory competency signals:
- **70% Required Competencies & Evidence Freshness**:
  - `verified`: `1.0`
  - `assessed`: `0.85`
  - `evidence_linked`: `0.65`
  - `observed`: `0.40`
  - `claimed`: `0.20`
  - `expired`: `0.35` (penalized until renewed)
- **15% Assessment Performance**: Average validated assessment percentage (or competency baseline if unassessed, flagged as `insufficient_assessment_data`).
- **15% Preferred Skills Alignment**: Proportion of preferred skills backed by `evidence_linked`, `assessed`, or `verified` status.

## 2. Fairness & Governance Guarantees
- **Protected Attributes Excluded**: Caste, religion, gender, disability, and political affiliation are never used in matching or eligibility.
- **No Hidden Eligible Candidates**: `get_matching_students_for_job` never suppresses eligible students regardless of compatibility score.
- **No Selection Probability Claims**: Every match result carries an explicit disclaimer that compatibility reflects skill alignment, not probability of selection.
