# ProofHire 2.0 – Predictive Analytics & Early-Warning Methodology

## Governance & Data Sufficiency Gate
- Predictive ML models are **disabled** (`predictive_model_enabled: false`) when fewer than `30` confirmed `SelectionDecision` records exist for a college tenant.
- ProofHire never fabricates synthetic accuracy metrics or predicted placement probabilities.

## Rule-Based Early-Warning Indicators
When historical outcome labels are insufficient, ProofHire computes explainable, rule-based indicators using neutral language:
- `Assessment pending`: No diagnostic assessments completed yet.
- `Additional practice suggested`: 2+ assessment attempts below 60% mastery threshold.
- `Evidence incomplete`: Zero verified competencies recorded.
- `Support recommended`: 3+ pending tasks in an active learning path.

**Non-Punitive Rule:** Early-warning indicators never determine eligibility, shortlisting, or rejection.
