# ProofHire 2.0 – Database Schema Reference

Refer to `db/schema.sql` (PostgreSQL + RLS) and `backend/app/models/models.py` (SQLAlchemy ORM).

## Phase 5 Entities & Relationships
- **`learning_paths`**: `(id, student_id, college_id, target_role, missing_skills, recommendation_version, readiness_before, readiness_after, soft_deleted, created_at, updated_at)`
- **`learning_tasks`**: `(id, learning_path_id -> learning_paths.id, title, description, skill, learning_objective, priority, estimated_minutes, difficulty, task_type, prerequisites, practical_activity, expected_deliverable, completion_criteria, recommended_reassessment, resource_ids, status, time_spent_minutes, task_order, completed, completed_at, updated_at, soft_deleted)`
- **`skill_gaps`**: `(id, student_id -> students.id, college_id, target_role, skill_name, required_proficiency, current_proficiency, current_state, gap_status, priority, priority_score, mandatory, importance, explanation, priority_reason, created_at, updated_at)`
- **`learning_resources`**: `(id, title, provider, url, resource_type, skill_name, is_verified, is_external, approved_by, soft_deleted, created_at, updated_at)`
- **`skill_prerequisites`**: `(id, skill_name, prerequisite_skill, created_at)`
- **`task_submissions`**: `(id, task_id -> learning_tasks.id, student_id -> students.id, college_id, artifact_type, artifact_url, notes, evidence_id, status, reviewed_by, review_notes, reviewed_at, created_at, updated_at)`
- **`learning_events`**: `(id, student_id, college_id, learning_path_id, task_id, event_type, details, created_at)`
- **`recommendation_logs`**: `(id, student_id, college_id, target_role, version, source, input_references, validation_passed, validation_notes, generated_at)`
- **`training_interventions`**: `(id, college_id, created_by, title, description, target_role, target_skills, status, soft_deleted, created_at, updated_at)`
- **`intervention_students`**: `(id, intervention_id -> training_interventions.id, student_id -> students.id, college_id, assigned_task_ids, participation_status, pre_avg_score, post_avg_score, assigned_at, updated_at)`

## Tenant Isolation & RLS
All tenant-scoped tables enforce PostgreSQL Row-Level Security with both `USING` and `WITH CHECK` policies bound to `college_id = (auth.jwt() ->> 'college_id')::uuid`.
