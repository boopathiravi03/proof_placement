# Innovation Evaluation — ProofHire 2.0

## Evaluation of 10 Core Differentiators

1. **Evidence-Based Competency Lifecycle:** Solves unverified resume claims via a 6-state machine (`CompetencyService.evaluate_state`). Genuinely different from traditional portals and technically credible, demonstrable live. *Weakness:* Mentor verification still depends on manual faculty throughput.
2. **GitHub Evidence Without Auto-Verification:** Solves repo-stuffing/forking by capping GitHub at `evidence_linked`. Strong, defensible rule demonstrable live. *Weakness:* Live OAuth requires external GitHub app credentials (`GITHUB_CLIENT_ID`/`SECRET`).
3. **Adaptive Competency Assessment:** Adjusts difficulty across Levels 1–3 in 10 categories while hiding answers server-side. Credible and demonstrable. *Weakness:* Coding/debugging items use AST + simulated test execution instead of an isolated Docker sandbox.
4. **Transparent Placement Readiness Index (PRI):** Weighted formula separating missing data from low scores with explicit non-guarantee labeling. High clarity. *Weakness:* Weights are fixed heuristics rather than empirically calibrated on multi-year placement outcomes.
5. **Personalized Skill-Gap Closure:** Topological prerequisite paths (`LearningPathService`) linking gaps -> tasks -> `evidence_linked` -> reassessment. Credible and deterministic. *Weakness:* Resource catalog is seeded/curated rather than dynamically crawled.
6. **Explainable Placement Matching:** Separates deterministic eligibility from compatibility scoring. Valuable for student trust. *Weakness:* Optional auth on some endpoints weakens production trust until JWT is mandatory.
7. **Versioned Eligibility Rules:** Tracks `rule_version` snapshots, appeals, and justified overrides. Strong operational control. *Weakness:* Complex multi-clause boolean expressions beyond standard thresholds require manual review.
8. **Institutional Placement Intelligence:** Branch heatmaps, interventions, `k < 3` suppression, and `>=30` predictive data gate. Credible and responsible. *Weakness:* New colleges with `<30` historical placements see "insufficient data" instead of predictions.
9. **Multi-Tenant Governance:** `college_id` scoping across tables + `GovernanceService` + PostgreSQL RLS in `db/schema.sql`. Valuable for universities. *Weakness:* FastAPI `get_db()` does not yet inject `SET LOCAL app.current_college_id` into Postgres sessions.
10. **Tamper-Evident Audit:** `_AUDIT_LOCK` serialized SHA-256 chain + HMAC-SHA256 `AuditCheckpoint` + `verify_chain_detailed()`. Demonstrable via `Simulate Tamper`. *Weakness:* Checkpoints are stored in the same DB rather than an external WORM anchor, and `/audit/{college_id}/tamper` lacks an `ENVIRONMENT != "production"` guard.

## Top 3 Strongest vs. Top 3 Weakest Differentiators
- **Strongest 3:** (1) 6-state Competency Lifecycle where GitHub never auto-verifies, (2) Separated Deterministic Eligibility vs. Match Compatibility with appeals/overrides, (3) DPDP-aligned Governance + Concurrency-Safe SHA-256 Audit Ledger.
- **Weakest 3:** (1) Simulated/AST code-execution sandbox (no Docker isolation yet), (2) Optional auth (`get_current_user_optional`) on several endpoints for demo convenience, (3) Fixed heuristic PRI weights pending multi-year empirical calibration.
