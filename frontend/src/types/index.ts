export type Role = 'student' | 'officer' | 'recruiter' | 'university';

export type CompetencyState = 'Claimed' | 'Observed' | 'Evidence-linked' | 'Assessed' | 'Verified' | 'Expired';

export interface Competency {
  id?: string;
  skill_name: string;
  state: CompetencyState;
  confidence: number;
  verified_by?: string | null;
  verification_method?: string | null;
  expires_at?: string | null;
  evidence_count?: number;
}

export interface StudentProfile {
  id: string;
  name: string;
  roll_number?: string;
  branch: string;
  college_id: string;
  cgpa: number;
  backlogs: number;
  github_username?: string;
  github_connected: boolean;
  competencies: Competency[];
}

export interface EvidenceItem {
  id: string;
  competency_id?: string;
  kind: 'commit' | 'repo' | 'cert' | 'hackathon' | 'lab' | 'test' | 'mentor' | 'walkthrough';
  title: string;
  ref_url: string;
  confidence: number;
  metadata?: Record<string, unknown>;
  created_at?: string;
}

export interface ReadinessBreakdown {
  percentage: number;
  weight: number;
  weighted_score: number;
  description: string;
}

export interface ReadinessScore {
  student_id: string;
  target_role: string;
  overall_score: number;
  confidence_level: 'low' | 'medium' | 'high';
  breakdown: {
    verified_competencies: ReadinessBreakdown;
    evidence_coverage: ReadinessBreakdown;
    practical_assessment: ReadinessBreakdown;
    aptitude: ReadinessBreakdown;
    interview_readiness: ReadinessBreakdown;
  };
  required_skills: string[];
  verified_skills: string[];
  missing_skills: string[];
  disclaimer: string;
}

export interface Question {
  id: string;
  category: string;
  question: string;
  options: string[];
  correct_option_index: number;
  difficulty_level: number;
  explanation?: string;
}

export interface AssessmentHistoryItem {
  question: string;
  is_correct: boolean;
  difficulty: number;
}

export interface AssessmentState {
  index: number;
  level: number;
  score: number;
  used: string[];
  history: AssessmentHistoryItem[];
  done: boolean;
  currentQuestion: Question | null;
}

export interface LearningTask {
  id: string;
  title: string;
  description: string;
  skill: string;
  task_order: number;
  completed: boolean;
  completed_at?: string;
}

export interface LearningPath {
  learning_path_id: string;
  target_role: string;
  missing_skills: string[];
  tasks: LearningTask[];
}

export interface EligibilityResult {
  eligible: boolean;
  failed_rules: string[];
  rule_version: number;
  inputs: Record<string, unknown>;
  decision_id?: string;
}

export interface DriveItem {
  id: string;
  title: string;
  day_of_week: string;
  activity: string;
  has_clash: boolean;
  status: string;
}

export interface CalendarResponse {
  calendar: DriveItem[];
  clash_detected: boolean;
  recommendation: string;
}

export interface RecruiterCandidate {
  student_id: string;
  name: string;
  branch: string;
  skill: string;
  state: string;
  confidence: number;
  verified_by: string;
  verification_method: string;
  expires_in_months: number;
  match_reason: string;
}

export interface PipelineCandidate {
  id: string;
  student_id: string;
  name: string;
  branch: string;
  verified_skills: string;
  stage: 'Shortlisted' | 'Interview' | 'Offer' | 'Accepted';
  stage_index: number;
  officer_approved_offer: boolean;
}

export interface ApprovalItem {
  id: string | number;
  title: string;
  description: string;
  proposed_by: string;
  status: string;
  payload?: Record<string, unknown>;
  created_at?: string;
}

export interface CohortInsights {
  college_id: string;
  kpis: {
    predicted_placement_rate: number;
    placement_change: string;
    verified_skill_coverage: number;
    coverage_change: string;
    gap_closure_rate: number;
    gap_closure_status: string;
  };
  skills: string[];
  heatmap: Record<string, number[]>;
  industry_alert: string;
  fairness_analysis: {
    highest_rate: number;
    groups: Record<string, {
      selection_rate: number;
      impact_ratio: number;
      review_required: boolean;
      status: string;
      explanation: string;
    }>;
  };
}

export interface UniversityCollege {
  college_id: string;
  name: string;
  placement_rate: number;
  verified_skill_coverage: number;
  gap_closure_rate: number;
  fairness_flags: number;
  status: string;
}

export interface AuditLogEntry {
  id: number;
  actor: string;
  action: string;
  prev_hash: string;
  hash: string;
  created_at: string;
}

export interface AuditResponse {
  college_id: string;
  chain_intact: boolean;
  total_records: number;
  entries: AuditLogEntry[];
}

// Phase 3 Student Engine Types
export type SkillCategory = 'languages' | 'frameworks' | 'databases' | 'fundamentals' | 'tools' | 'soft_skills';

export interface CategorizedSkill {
  id: string;
  skill_name: string;
  category: string;
  proficiency: string;
  state: CompetencyState | string;
  confidence: number;
  verified_by?: string | null;
  verification_method?: string | null;
  last_assessed_at?: string | null;
  verified_at?: string | null;
  expires_at?: string | null;
  evidence_count: number;
}

export interface MentorVerificationRequestItem {
  id: string;
  student_id: string;
  competency_id: string;
  skill_name: string;
  mentor_name: string;
  evidence_summary: string;
  walkthrough_notes?: string | null;
  status: 'pending' | 'approved' | 'rejected' | string;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  notes?: string | null;
  expires_at?: string | null;
  created_at: string;
}

export interface GitHubRepoItem {
  id: string;
  name: string;
  url: string;
  description?: string;
  primary_language?: string;
  languages?: Record<string, number>;
  commits: number;
  stars: number;
  is_authorized: boolean;
  last_scanned_at?: string;
}

export interface StudentDashboardSummary {
  student: {
    id: string;
    name: string;
    roll_number: string;
    branch: string;
    college_id: string;
    cgpa: number;
    backlogs: number;
    github_username?: string;
    github_connected: boolean;
    profile_completion_percentage: number;
  };
  metrics: {
    overall_readiness: number;
    verified_skill_count: number;
    evidence_linked_count: number;
    skills_needing_assessment: number;
    active_learning_tasks: number;
    upcoming_placement_drives: number;
    recent_assessments_count: number;
  };
  readiness_breakdown: {
    technical_competency: { score: number; explanation: string };
    aptitude_performance: { score: number; explanation: string };
    coding_performance: { score: number; explanation: string };
    interview_readiness: { score: number; explanation: string };
    evidence_coverage: { score: number; explanation: string };
  };
  active_tasks: Array<{
    id: string;
    title: string;
    skill: string;
    description: string;
    completed: boolean;
  }>;
  upcoming_drives: Array<{
    id: string;
    company_name: string;
    role: string;
    package_ctc: string;
    drive_date: string;
    required_skills: string[];
    is_eligible: boolean;
  }>;
  recent_assessments: Array<{
    id: string;
    category: string;
    score: number;
    total: number;
    percentage: number;
    date: string;
  }>;
  recommended_actions: string[];
}

export interface PrivacyConsentItem {
  purpose: string;
  title: string;
  description: string;
  legal_basis: string;
  granted: boolean;
  granted_at?: string;
  revoked_at?: string | null;
}

export interface StudentPrivacyResponse {
  student_id: string;
  dpdp_compliance_notice: string;
  consents: PrivacyConsentItem[];
  github_consent_revoked: boolean;
  data_protection_rights: {
    right_to_access: boolean;
    right_to_correction: boolean;
    right_to_erasure: boolean;
    right_to_grievance_redressal: boolean;
  };
}

export interface StudentDriveItem {
  id: string;
  company_name: string;
  role: string;
  package_ctc: string;
  drive_date: string;
  location: string;
  min_cgpa: number;
  max_backlogs: number;
  required_skills: string[];
  eligible: boolean;
  eligibility_reasons: {
    passed_criteria: string[];
    failed_criteria: string[];
  };
  can_appeal: boolean;
  applied: boolean;
  appeal_status?: string | null;
}

export interface ResumeDataResponse {
  student: {
    name: string;
    roll_number: string;
    branch: string;
    college_id: string;
    cgpa: number;
    github_username?: string;
  };
  competencies: {
    verified: Array<{ skill_name: string; proficiency: string; verification_method: string; verified_by?: string; verified_at?: string }>;
    assessed: Array<{ skill_name: string; proficiency: string }>;
    evidence_linked: Array<{ skill_name: string; proficiency: string; evidence_count: number }>;
    claimed: Array<{ skill_name: string; proficiency: string }>;
  };
  projects: Array<{ title: string; repo_url: string; tech: string; description: string }>;
  certifications: Array<{ title: string; issuer: string; date: string }>;
  education: Array<{ degree: string; institution: string; score: string; year: string }>;
}
