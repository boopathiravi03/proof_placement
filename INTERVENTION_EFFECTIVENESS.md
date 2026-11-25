# ProofHire 2.0 – Intervention Effectiveness Methodology

`InterventionService.get_intervention_effectiveness` tracks:
- Assigned vs. participating vs. completed student counts (`InterventionStudent` + `LearningTask` statuses).
- Pre-training average assessment score (`pre_avg_score` captured at enrollment) vs. post-training average assessment score (`post_avg_score` from attempts after `assigned_at`).

**Causal Interpretation Boundary:** Observed pre/post score deltas reflect correlation over the intervention window and do not claim standalone causal proof without controlled comparison cohorts.
