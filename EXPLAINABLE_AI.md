# Explainable AI & Decision Transparency — ProofHire 2.0

## Centralized Explanation Persistence
`ExplanationService` (`backend/app/services/explanation_service.py`) stores structured `ExplanationRecord` entries for rule-based and AI-assisted decisions across modules (`eligibility`, `readiness`, `learning_path`, `matching`).

## Recorded Fields
- `module` and `rule_or_model_version`
- `inputs_used` (JSON snapshot of evaluated inputs)
- `decision_output` (JSON summary of score/eligibility/recommendation)
- `supporting_evidence` (list of verified evidence IDs or signals)
- `missing_data` (explicit gaps that affected confidence)
- `ai_contributed` (boolean distinguishing deterministic rules from AI-assisted outputs)
- `human_reviewed` (boolean indicating officer/mentor review)

Retrieved via `GET /api/governance/explanations/{student_id}?college_id=...`.
