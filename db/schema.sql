-- ProofHire 2.0 Complete Schema (Postgres / Supabase)
create extension if not exists pgcrypto;

-- 1. Colleges & Multi-Tenant Hierarchy
create table if not exists colleges (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,              -- e.g. 'COL-A', 'COL-B'
  name text not null,
  city text,
  state text,
  created_at timestamptz default now()
);

create table if not exists departments (
  id uuid primary key default gen_random_uuid(),
  college_id uuid not null references colleges(id) on delete cascade,
  name text not null,                     -- CSE, IT, ECE, MECH
  code text not null,
  unique(college_id, code)
);

-- 2. Users & Role-Based Access Control
create type user_role as enum ('student', 'tp_officer', 'recruiter', 'university_admin');

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  college_id uuid references colleges(id) on delete set null,
  email text unique not null,
  full_name text not null,
  role user_role not null default 'student',
  password_hash text,
  created_at timestamptz default now()
);

-- 3. Student Profiles
create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references users(id) on delete cascade,
  college_id uuid not null references colleges(id) on delete cascade,
  department_id uuid references departments(id),
  roll_number text,
  name text not null,
  branch text not null default 'CSE',
  gender text,
  category text default 'General',
  cgpa numeric(3,1) not null default 0.0,
  backlogs int not null default 0,
  github_username text,
  github_connected boolean default false,
  github_consent_revoked boolean default false,
  created_at timestamptz default now()
);

-- 4. Competency Lifecycle
-- Claimed -> Observed -> Evidence-linked -> Assessed -> Verified -> Expired
create type competency_state as enum ('claimed', 'observed', 'evidence_linked', 'assessed', 'verified', 'expired');

create table if not exists competencies (
  id uuid primary key default gen_random_uuid(),
  college_id uuid not null references colleges(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  taxonomy_code text,                     -- ESCO / O*NET code
  skill_name text not null,
  state competency_state not null default 'claimed',
  confidence numeric(3,2) default 0.50,
  verified_by text,                       -- mentor name or test id
  verification_method text,               -- test, mentor, walkthrough
  expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(student_id, skill_name)
);

-- 5. Verifiable Evidence
create type evidence_kind as enum ('commit', 'repo', 'cert', 'hackathon', 'lab', 'test', 'mentor', 'walkthrough');

create table if not exists evidence (
  id uuid primary key default gen_random_uuid(),
  college_id uuid not null references colleges(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  competency_id uuid not null references competencies(id) on delete cascade,
  kind evidence_kind not null,
  title text not null,
  ref_url text not null,
  confidence numeric(3,2) default 0.70,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- 6. DPDP Consent Records
create table if not exists consents (
  id uuid primary key default gen_random_uuid(),
  college_id uuid not null references colleges(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  purpose text not null,                  -- 'github_sync', 'leetcode_sync', 'recruiter_sharing'
  granted boolean not null default true,
  granted_at timestamptz default now(),
  revoked_at timestamptz
);

-- 7. Companies & Job Roles
create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  industry text not null,
  website text,
  created_at timestamptz default now()
);

create table if not exists recruiters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references users(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  title text
);

create table if not exists job_roles (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  title text not null,                    -- e.g. 'Backend Developer'
  description text,
  min_cgpa numeric(3,1) default 6.0,
  max_backlogs int default 0,
  required_skills jsonb not null default '[]'::jsonb, -- e.g. ["Python", "SQL", "Git", "Docker"]
  created_at timestamptz default now()
);

-- 8. Placement Drives & Conflict Management
create table if not exists placement_drives (
  id uuid primary key default gen_random_uuid(),
  college_id uuid not null references colleges(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  job_role_id uuid not null references job_roles(id) on delete cascade,
  title text not null,
  day_of_week text not null,              -- 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'
  activity text not null,                 -- 'Visit', 'Test', 'Interviews', 'Offers'
  status text not null default 'scheduled',
  has_clash boolean default false,
  created_at timestamptz default now()
);

-- 9. Versioned Eligibility Rules & Decisions
create table if not exists eligibility_rules (
  id uuid primary key default gen_random_uuid(),
  college_id uuid not null references colleges(id) on delete cascade,
  drive_id uuid references placement_drives(id) on delete cascade,
  job_role_id uuid references job_roles(id) on delete cascade,
  version int not null default 1,
  min_cgpa numeric(3,1) not null default 6.5,
  max_backlogs int not null default 0,
  required_skills jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamptz default now()
);

create table if not exists eligibility_decisions (
  id uuid primary key default gen_random_uuid(),
  college_id uuid not null references colleges(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  rule_id uuid not null references eligibility_rules(id),
  rule_version int not null,
  eligible boolean not null,
  student_inputs jsonb not null,
  failed_conditions jsonb default '[]'::jsonb,
  decision_timestamp timestamptz default now(),
  appealed boolean default false
);

create table if not exists eligibility_appeals (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid not null references eligibility_decisions(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  college_id uuid not null references colleges(id) on delete cascade,
  reason text not null,
  status text not null default 'pending', -- 'pending', 'approved', 'rejected'
  reviewer_notes text,
  decided_by text,
  created_at timestamptz default now()
);

-- 10. Adaptive Assessments & Question Bank
create table if not exists question_bank (
  id uuid primary key default gen_random_uuid(),
  category text not null,                 -- 'SQL', 'Python', 'Git', 'DSA', 'Aptitude'
  question text not null,
  options jsonb not null,                 -- Array of options
  correct_option_index int not null,
  difficulty_level int not null default 1, -- 1 (Easy), 2 (Medium), 3 (Hard)
  explanation text,
  created_at timestamptz default now()
);

create table if not exists assessment_attempts (
  id uuid primary key default gen_random_uuid(),
  college_id uuid not null references colleges(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  category text not null,
  score int not null default 0,
  total_questions int not null default 5,
  passed boolean not null default false,
  history jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

-- 11. Personalized Learning Paths & Tasks
create table if not exists learning_paths (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  college_id uuid not null references colleges(id) on delete cascade,
  target_role text not null,
  missing_skills jsonb not null default '[]'::jsonb,
  created_at timestamptz default now()
);

create table if not exists learning_tasks (
  id uuid primary key default gen_random_uuid(),
  learning_path_id uuid not null references learning_paths(id) on delete cascade,
  title text not null,
  description text not null,
  skill text not null,
  task_order int not null default 1,
  completed boolean not null default false,
  completed_at timestamptz
);

-- 12. Candidate Applications & Hiring Pipeline
create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  college_id uuid not null references colleges(id) on delete cascade,
  drive_id uuid not null references placement_drives(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  stage text not null default 'Shortlisted', -- 'Shortlisted', 'Interview', 'Offer', 'Accepted'
  stage_index int not null default 0,
  officer_approved_offer boolean default false,
  updated_at timestamptz default now()
);

-- 13. Human-in-the-Loop Officer Approvals
create table if not exists approvals (
  id uuid primary key default gen_random_uuid(),
  college_id uuid not null references colleges(id) on delete cascade,
  proposed_by text not null,              -- e.g. 'Predictive Agent', 'Skill-gap Agent'
  title text not null,
  description text not null,
  payload jsonb default '{}'::jsonb,
  status text not null default 'pending', -- 'pending', 'approved', 'rejected'
  decided_by text,
  decided_at timestamptz,
  created_at timestamptz default now()
);

-- 14. Immutable SHA-256 Hash-Chained Audit Log
create table if not exists audit_log (
  id bigserial primary key,
  college_id uuid not null references colleges(id) on delete cascade,
  actor text not null,
  action text not null,
  prev_hash text not null,
  hash text not null,
  created_at timestamptz default now()
);

-- Hash chain trigger function (Postgres)
create or replace function audit_chain() returns trigger as $$
declare
  last_hash text;
begin
  select hash into last_hash from audit_log where college_id = new.college_id order by id desc limit 1;
  new.prev_hash := coalesce(last_hash, 'GENESIS');
  new.hash := encode(digest(new.prev_hash || new.actor || new.action || new.created_at::text, 'sha256'), 'hex');
  return new;
end $$ language plpgsql;

drop trigger if exists audit_chain_t on audit_log;
create trigger audit_chain_t before insert on audit_log for each row execute function audit_chain();

-- Immutable audit log trigger
create or replace function audit_immutable() returns trigger as $$
begin
  raise exception 'audit_log is append-only and cannot be modified or deleted.';
end $$ language plpgsql;

drop trigger if exists audit_no_change on audit_log;
create trigger audit_no_change before update or delete on audit_log for each row execute function audit_immutable();

-- 15. Phase 5: Personalized Learning Path, Skill Gaps & Training Interventions
create table if not exists skill_prerequisites (
  id uuid primary key default gen_random_uuid(),
  skill_name text not null,
  prerequisite_skill text not null,
  created_at timestamptz default now()
);

create table if not exists learning_resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  provider text not null,
  url text not null,
  resource_type text not null,
  skill_name text not null,
  is_verified boolean default true,
  is_external boolean default true,
  approved_by text,
  soft_deleted boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists skill_gaps (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  college_id uuid not null references colleges(id) on delete cascade,
  target_role text not null,
  skill_name text not null,
  required_proficiency text default 'Intermediate',
  current_proficiency text default 'Unknown',
  current_state text default 'unknown',
  gap_status text not null,
  priority text default 'Medium',
  priority_score numeric(5,2) default 0,
  mandatory boolean default true,
  importance numeric(3,2) default 1.0,
  explanation text not null,
  priority_reason text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists task_submissions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references learning_tasks(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  college_id uuid not null references colleges(id) on delete cascade,
  artifact_type text default 'project_url',
  artifact_url text not null,
  notes text,
  evidence_id uuid,
  status text default 'awaiting_review',
  reviewed_by text,
  review_notes text,
  reviewed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists learning_events (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null,
  college_id uuid not null references colleges(id) on delete cascade,
  learning_path_id uuid,
  task_id uuid,
  event_type text not null,
  details jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists recommendation_logs (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null,
  college_id uuid not null references colleges(id) on delete cascade,
  target_role text not null,
  version text default 'v2.0',
  source text default 'deterministic_template',
  input_references jsonb default '{}'::jsonb,
  validation_passed boolean default true,
  validation_notes text,
  generated_at timestamptz default now()
);

create table if not exists training_interventions (
  id uuid primary key default gen_random_uuid(),
  college_id uuid not null references colleges(id) on delete cascade,
  created_by text not null,
  title text not null,
  description text,
  target_role text not null,
  target_skills jsonb default '[]'::jsonb,
  status text default 'active',
  soft_deleted boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists intervention_students (
  id uuid primary key default gen_random_uuid(),
  intervention_id uuid not null references training_interventions(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  college_id uuid not null references colleges(id) on delete cascade,
  assigned_task_ids jsonb default '[]'::jsonb,
  participation_status text default 'assigned',
  pre_avg_score numeric(5,2),
  post_avg_score numeric(5,2),
  assigned_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 16. Phase 6: Intelligent Placement Matching, Campus Drives & Bulk Communications
create table if not exists company_college_access (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  college_id uuid not null references colleges(id) on delete cascade,
  recruiter_user_id uuid,
  authorized boolean default true,
  created_at timestamptz default now()
);

create table if not exists drive_rounds (
  id uuid primary key default gen_random_uuid(),
  drive_id uuid not null references placement_drives(id) on delete cascade,
  college_id uuid not null references colleges(id) on delete cascade,
  round_order int default 1,
  name text not null,
  round_type text default 'interview',
  room text,
  time_slot text,
  scheduled_date text,
  created_at timestamptz default now()
);

create table if not exists application_stage_history (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id) on delete cascade,
  college_id uuid not null references colleges(id) on delete cascade,
  previous_status text not null,
  new_status text not null,
  actor text not null,
  reason text,
  created_at timestamptz default now()
);

create table if not exists interview_schedules (
  id uuid primary key default gen_random_uuid(),
  drive_id uuid not null,
  application_id uuid not null,
  student_id uuid not null,
  college_id uuid not null references colleges(id) on delete cascade,
  round_name text not null,
  interviewer text not null,
  scheduled_date text not null,
  time_slot text not null,
  room text not null,
  status text default 'scheduled',
  created_at timestamptz default now()
);

create table if not exists recruiter_feedback (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null,
  drive_id uuid not null,
  college_id uuid not null references colleges(id) on delete cascade,
  recruiter_name text not null,
  round_name text not null,
  rating int default 4,
  strengths text,
  concerns text,
  recommendation text default 'advance',
  is_private boolean default true,
  created_at timestamptz default now()
);

create table if not exists selection_decisions (
  id uuid primary key default gen_random_uuid(),
  application_id uuid unique not null,
  drive_id uuid not null,
  college_id uuid not null references colleges(id) on delete cascade,
  decision text not null,
  package_ctc text,
  decided_by text not null,
  officer_approved boolean default false,
  notes text,
  created_at timestamptz default now()
);

create table if not exists communication_templates (
  id uuid primary key default gen_random_uuid(),
  college_id uuid not null references colleges(id) on delete cascade,
  name text not null,
  template_type text not null,
  subject text not null,
  body text not null,
  created_at timestamptz default now()
);

create table if not exists communication_logs (
  id uuid primary key default gen_random_uuid(),
  college_id uuid not null references colleges(id) on delete cascade,
  drive_id uuid,
  sender text not null,
  template_type text not null,
  subject text not null,
  recipient_count int default 0,
  recipient_emails jsonb default '[]'::jsonb,
  status text default 'preview_simulated',
  provider_mode text default 'simulated_preview',
  error_message text,
  created_at timestamptz default now()
);

-- 17. Phase 7: Institutional Intelligence, Data Quality & Accreditation Reporting
create table if not exists metric_definitions (
  id uuid primary key default gen_random_uuid(),
  metric_key text unique not null,
  metric_name text not null,
  definition text not null,
  calculation_formula text not null,
  data_source text not null,
  reporting_period text default 'Current Academic Cycle',
  inclusion_criteria text not null,
  exclusion_criteria text not null,
  missing_data_handling text not null,
  data_owner text default 'Training & Placement Office',
  created_at timestamptz default now()
);

create table if not exists analytics_snapshots (
  id uuid primary key default gen_random_uuid(),
  college_id uuid not null references colleges(id) on delete cascade,
  snapshot_type text not null,
  reporting_period text default '2025-2026',
  filters_json jsonb default '{}'::jsonb,
  payload_json jsonb default '{}'::jsonb,
  computed_at timestamptz default now()
);

create table if not exists data_quality_issues (
  id uuid primary key default gen_random_uuid(),
  college_id uuid not null references colleges(id) on delete cascade,
  check_name text not null,
  severity text default 'warning',
  entity_type text not null,
  affected_count int default 0,
  description text not null,
  resolved boolean default false,
  detected_at timestamptz default now()
);

create table if not exists institutional_reports (
  id uuid primary key default gen_random_uuid(),
  college_id uuid not null references colleges(id) on delete cascade,
  report_type text not null,
  reporting_period text default '2025-2026',
  generated_by text not null,
  metrics_json jsonb default '{}'::jsonb,
  missing_data_warnings jsonb default '[]'::jsonb,
  evidence_references jsonb default '[]'::jsonb,
  disclaimer text not null,
  created_at timestamptz default now()
);

create table if not exists university_college_access (
  id uuid primary key default gen_random_uuid(),
  university_user_id uuid not null,
  college_id uuid not null references colleges(id) on delete cascade,
  authorized boolean default true,
  created_at timestamptz default now()
);

-- 18. Phase 8: Trust, Governance, DPDP Privacy, Fairness & Tamper-Evident Audit
create table if not exists privacy_notice_versions (
  id uuid primary key default gen_random_uuid(),
  version text unique not null,
  title text not null,
  data_categories jsonb default '[]'::jsonb,
  purposes jsonb default '[]'::jsonb,
  sharing_recipients jsonb default '[]'::jsonb,
  retention_info text not null,
  user_controls text not null,
  grievance_contact text not null,
  effective_date timestamptz default now(),
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists retention_policies (
  id uuid primary key default gen_random_uuid(),
  college_id uuid not null references colleges(id) on delete cascade,
  entity_type text not null,
  retention_days int default 365,
  legal_exception_note text,
  auto_anonymize boolean default true,
  updated_by text default 'Data Protection Officer',
  updated_at timestamptz default now()
);

create table if not exists privacy_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null,
  college_id uuid not null references colleges(id) on delete cascade,
  request_type text not null,
  reason text not null,
  status text default 'pending',
  reviewer_name text,
  reviewer_notes text,
  retention_exception_applied boolean default false,
  resolved_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists data_access_logs (
  id uuid primary key default gen_random_uuid(),
  college_id uuid not null references colleges(id) on delete cascade,
  actor_id text not null,
  actor_role text not null,
  student_id uuid,
  resource_type text not null,
  resource_id text,
  purpose text not null,
  allowed boolean default true,
  denial_reason text,
  created_at timestamptz default now()
);

create table if not exists fairness_audits (
  id uuid primary key default gen_random_uuid(),
  college_id uuid not null references colleges(id) on delete cascade,
  analysis_period text default '2025-2026',
  population_size int default 0,
  rules_examined jsonb default '[]'::jsonb,
  data_coverage_pct numeric(5,2) default 100.0,
  anomalies_detected jsonb default '[]'::jsonb,
  disparity_indicators jsonb default '{}'::jsonb,
  limitations text not null,
  recommended_investigation text not null,
  human_reviewer text,
  review_outcome text default 'pending_review',
  created_at timestamptz default now()
);

create table if not exists explanation_records (
  id uuid primary key default gen_random_uuid(),
  college_id uuid not null references colleges(id) on delete cascade,
  student_id uuid,
  module text not null,
  decision_output jsonb default '{}'::jsonb,
  inputs_used jsonb default '{}'::jsonb,
  rule_or_model_version text default 'v2.0',
  supporting_evidence jsonb default '[]'::jsonb,
  missing_data jsonb default '[]'::jsonb,
  ai_contributed boolean default false,
  human_reviewed boolean default false,
  created_at timestamptz default now()
);

create table if not exists audit_checkpoints (
  id uuid primary key default gen_random_uuid(),
  college_id uuid not null references colleges(id) on delete cascade,
  event_count int default 0,
  head_hash text not null,
  hmac_signature text not null,
  verified_intact boolean default true,
  created_at timestamptz default now()
);

-- 19. Row Level Security Policies (USING and WITH CHECK for tenant isolation)
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'students', 'competencies', 'evidence', 'consents', 
    'placement_drives', 'eligibility_rules', 'eligibility_decisions', 
    'eligibility_appeals', 'assessment_attempts', 'learning_paths', 
    'applications', 'approvals', 'audit_log',
    'skill_gaps', 'task_submissions', 'learning_events',
    'recommendation_logs', 'training_interventions', 'intervention_students',
    'company_college_access', 'drive_rounds', 'application_stage_history',
    'interview_schedules', 'recruiter_feedback', 'selection_decisions',
    'communication_templates', 'communication_logs',
    'analytics_snapshots', 'data_quality_issues', 'institutional_reports',
    'retention_policies', 'privacy_requests', 'data_access_logs',
    'fairness_audits', 'explanation_records', 'audit_checkpoints'
  ] loop
    execute format('alter table %I enable row level security', tbl);
    execute format('drop policy if exists tenant_isolation on %I', tbl);
    execute format($pol$create policy tenant_isolation on %I using (college_id = (auth.jwt() ->> 'college_id')::uuid) with check (college_id = (auth.jwt() ->> 'college_id')::uuid)$pol$, tbl);
  end loop;
end $$;
