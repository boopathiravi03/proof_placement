# ProofHire 2.0 – Centralized Metric Definitions

All institutional metrics are registered in `metric_definitions` and exposed via `GET /api/intelligence/metric-definitions`:

1. **Verified Skill Coverage (%)**: `(students_with_verified_skill / total_registered_students) * 100`. Excludes expired verifications and unverified self-claims.
2. **Assessment Participation Rate (%)**: `(students_with_attempts / total_registered_students) * 100`. Unassessed students are marked pending, not zero ability.
3. **Application-to-Shortlist Conversion (%)**: `(shortlisted_or_beyond_count / non_withdrawn_applications_count) * 100`. Always displays the exact denominator.
4. **Shortlist-to-Selection Conversion (%)**: `(selected_count / shortlisted_or_beyond_count) * 100`. Distinguishes applicants, shortlisted, selected, confirmed placed, and accepted offers.
