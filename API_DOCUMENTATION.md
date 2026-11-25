# ProofHire 2.0 – API Documentation (Learning Path & Interventions)

Base URL: `/api`

## Learning Path & Skill-Gap Endpoints (`/api/learning`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/learning/roles` | Retrieve available target job roles and structured requirements. |
| `GET` | `/learning/roles/{role_name}/requirements` | Retrieve competency requirements for a specific role. |
| `GET` | `/learning/gaps/{student_id}?target_role=...` | Analyze and return prioritized skill gaps with explanations. |
| `GET` | `/learning/path/{student_id}?target_role=...&force_regenerate=false` | Generate or retrieve prerequisite-ordered personalized learning path. |
| `POST` | `/learning/task/progress` | Update task status (`not_started`, `in_progress`, `submitted`, `awaiting_review`, `completed`, `reassessment_required`) and optional tracked time. |
| `POST` | `/learning/task/submit-evidence` | Submit deliverable URL/artifact; links into Evidence Engine as `evidence_linked` (never `verified`). |
| `POST` | `/learning/submission/review` | Mentor/Officer review of a task submission (`403` for unauthorized roles). |
| `GET` | `/learning/projects?target_role=...` | Retrieve recommended practical projects for target role. |
| `GET` | `/learning/progress/{student_id}?target_role=...` | Retrieve task completion, before/after assessment scores, and readiness delta. |
| `POST` | `/learning/reassessment` | Start a targeted adaptive reassessment for a skill. |
| `GET` | `/learning/resources` | List verified external and ProofHire learning resources. |
| `POST` | `/learning/resources` | Officer/Admin endpoint to add a verified learning resource. |
| `DELETE` | `/learning/resources/{resource_id}` | Officer/Admin endpoint to soft-delete a learning resource. |

## Officer Cohort Intervention Endpoints (`/api/officer`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/officer/cohort-skill-gaps?college_id=...&target_role=...` | Aggregate cohort skill gaps, role readiness distribution, and students needing support (tenant-isolated). |
| `GET` | `/officer/interventions?college_id=...` | List training interventions and effectiveness metrics for a college. |
| `POST` | `/officer/interventions` | Create a new cohort training intervention. |
| `POST` | `/officer/interventions/{intervention_id}/assign` | Assign selected students (same college only) to an intervention and generate matching tasks. |
| `GET` | `/officer/interventions/{intervention_id}/effectiveness?college_id=...` | Compare pre-training vs post-training assessment performance and participation. |
