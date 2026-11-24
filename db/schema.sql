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

-- 15. Row Level Security Policies
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'students', 'competencies', 'evidence', 'consents', 
    'placement_drives', 'eligibility_rules', 'eligibility_decisions', 
    'eligibility_appeals', 'assessment_attempts', 'learning_paths', 
    'applications', 'approvals', 'audit_log'
  ] loop
    execute format('alter table %I enable row level security', tbl);
    execute format('drop policy if exists tenant_isolation on %I', tbl);
    execute format($pol$create policy tenant_isolation on %I using (college_id = (auth.jwt() ->> 'college_id')::uuid)$pol$, tbl);
  end loop;
end $$;
