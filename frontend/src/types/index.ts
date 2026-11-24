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
