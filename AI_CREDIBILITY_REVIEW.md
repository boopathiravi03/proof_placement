# AI Credibility Review — ProofHire 2.0

## Skeptical AI Judge Q&A
1. **Why does ProofHire need AI?** To assist with unstructured job-description skill extraction, learning recommendation phrasing, and cohort gap summarization—while keeping deterministic rules in charge of eligibility, scoring, and verification.
2. **Which features genuinely use AI vs. deterministic logic?**
   - **Rule-Based / Deterministic (NOT AI):** 6-state competency lifecycle, adaptive difficulty step-up/down (`AssessmentService`), weighted Placement Readiness Index (`ReadinessService`), topological prerequisite ordering (`LearningPathService`), versioned eligibility (`EligibilityService`), and four-fifths fairness math (`FairnessService`).
   - **AI-Assisted (with Human Gates & Deterministic Fallback):** JD skill extraction (`company_job_service.py` requires officer approval before skills enter `approved` demand), learning recommendations (validated by `validate_recommendations()`), and institutional insight summaries.
3. **How are hallucinations controlled?** `LearningPathService.validate_recommendations()` rejects unknown skills or broken prerequisite chains and falls back to `_build_deterministic_tasks()`. JD-extracted skills are isolated as `ai_pending` until human approval.
4. **What happens when the LLM API is unavailable?** All workflows run 100% deterministically with zero external LLM key required.
5. **Can AI verify skills or reject students?** **No.** GitHub/AI signals never yield `verified`, and early-warning indicators never auto-reject candidates.
6. **Is predictive analytics supported by sufficient historical data?** `InstitutionalIntelligenceService` enforces a `>=30` historical label gate and returns `insufficient_data` when a college lacks history instead of fabricating predictions.
7. **How is recommendation quality measured?** Via pre/post reassessment score deltas (`learning_path_service.py`) and pre/post intervention effectiveness (`intervention_service.py`).
