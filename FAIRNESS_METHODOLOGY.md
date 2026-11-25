# Fairness Methodology — ProofHire 2.0

## Diagnostic Approach
ProofHire implements `FairnessService` (`backend/app/services/fairness_service.py`) to detect procedural inconsistencies and selection disparities **without claiming absence of bias**.

## Checks Performed (`run_comprehensive_fairness_audit`)
1. **Rule Version Consistency:** Flags when multiple `EligibilityRule` versions are active across historical decisions in the same college.
2. **Override Justification Audit:** Flags any manual `EligibilityDecision` override missing a documented `override_reason`.
3. **Branch Disparate Impact (Four-Fifths Rule):** Calculates selection/eligibility rates per branch and flags any cohort whose ratio to the highest-performing group falls below `0.80`.
4. **Small-Group Suppression (`k < 3`):** Cohorts with fewer than 3 evaluated students are suppressed from comparative disparate-impact ratios and listed under `suppressed_small_groups` to avoid noisy or re-identifying statistics.
5. **Human Review Persistence:** Results are stored in `FairnessAudit` (`status`, `reviewer_name`, `anomalies_detected`, `suppressed_small_groups`, `disparate_impact`) and logged to the audit chain.
