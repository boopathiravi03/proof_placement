# ProofHire 2.0 – Personalized Learning Path Engine

## 1. Architecture & Workflow
ProofHire's Personalized Learning Path Engine follows a strict, deterministic, evidence-backed pipeline:

```
Select Target Role → Analyse Competencies → Identify Skill Gaps → Prioritize Gaps →
Validation Layer → Personalized Learning Path → Complete Tasks & Submit Evidence →
Mentor/Officer Review → Adaptive Reassessment → Update Placement Readiness Index
```

## 2. AI Recommendation Boundaries & Validation Layer
AI acts strictly as a **recommendation assistant**, never as the authority for student competency:
- **Deterministic Core:** Gap identification, priority scoring, and prerequisite ordering are computed deterministically (`SkillGapService` & `LearningPathService`).
- **Validation Layer (`RecommendationValidationLayer`):**
  1. Verifies every recommended skill exists in the target role taxonomy.
  2. Ensures tasks address actual identified gaps (`meets_requirement` skills are excluded).
  3. Enforces prerequisite ordering via `skill_prerequisites` (e.g., `Python` before `REST APIs`, `SQL` before `Database Design`).
  4. Deduplicates `(skill, title)` pairs.
  5. Strips any unsafe claims (e.g., "auto-verified" or "instant certificate").
- **Offline / LLM-Unavailable Resilience:** If no LLM API is configured or an AI recommendation fails validation, the engine seamlessly falls back to verified deterministic templates and logs the decision in `recommendation_logs`.

## 3. Evidence & Reassessment Integration
- Completing a learning task or submitting a deliverable (`repo`, `project_url`, `document`, `screenshot`) creates a `TaskSubmission` and calls `CompetencyService.add_evidence(...)`, setting the competency to **`evidence_linked`** (never `verified`).
- Verification requires passing an authorized adaptive reassessment (`>= 60%`) or receiving mentor/officer approval via `review_task_submission`.
- `Placement Readiness Index` updates only from validated competency, assessment, and evidence records.
