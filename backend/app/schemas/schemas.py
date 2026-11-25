from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# --- Auth & User ---
class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: str
    role: str
    college_id: Optional[str] = None
    name: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserCreate(BaseModel):
    email: str
    full_name: str
    role: str
    college_id: Optional[str] = None
    password: str

# --- Competency & Evidence ---
class EvidenceCreate(BaseModel):
    student_id: str
    skill_name: str
    kind: str  # commit | repo | cert | hackathon | lab | test | mentor | walkthrough
    title: str
    ref_url: str
    confidence: Optional[float] = 0.70
    metadata: Optional[Dict[str, Any]] = None

class MentorSignOffRequest(BaseModel):
    student_id: str
    skill_name: str
    mentor_name: str
    notes: Optional[str] = None

class CompetencyResponse(BaseModel):
    id: str
    skill_name: str
    state: str
    confidence: float
    verified_by: Optional[str] = None
    verification_method: Optional[str] = None
    expires_at: Optional[datetime] = None
    evidence_count: int = 0

class StudentProfileResponse(BaseModel):
    id: str
    name: str
    roll_number: Optional[str] = None
    branch: str
    college_id: str
    cgpa: float
    backlogs: int
    github_username: Optional[str] = None
    github_connected: bool
    competencies: List[CompetencyResponse]

# --- Assessments ---
class QuestionDTO(BaseModel):
    id: str
    category: str
    topic: Optional[str] = "General"
    question_type: Optional[str] = "mcq"
    question: str
    options: List[str]
    difficulty_level: int
    difficulty_str: Optional[str] = "Intermediate"
    starter_code: Optional[str] = None
    test_cases: Optional[List[Dict[str, Any]]] = None
    marks: Optional[int] = 1
    time_limit_sec: Optional[int] = 120
    explanation: Optional[str] = None

class AnswerSubmission(BaseModel):
    student_id: str
    category: str
    question_id: str
    selected_option_index: int
    current_difficulty: int

class StartAssessmentRequest(BaseModel):
    student_id: str
    category: str = "DBMS"
    assessment_type: str = "mcq"  # aptitude, programming, sql, mcq, debugging, interview
    target_role: Optional[str] = "Backend Developer"
    time_limit_minutes: int = 20
    total_questions: int = 5

class SubmitAnswerRequest(BaseModel):
    attempt_id: str
    student_id: str
    question_id: str
    selected_option_index: Optional[int] = None
    code_submission: Optional[str] = None
    sql_query: Optional[str] = None
    explanation: Optional[str] = None
    time_spent_seconds: int = 30

class CompleteAssessmentRequest(BaseModel):
    attempt_id: str
    student_id: str

class ExecuteCodeRequest(BaseModel):
    language: str = "python"
    code: str
    test_cases: List[Dict[str, Any]] = []

class ExecuteSqlRequest(BaseModel):
    query: str
    expected_output: Optional[str] = None

class AssessmentResultResponse(BaseModel):
    passed: bool
    score: int
    total_questions: int
    next_difficulty: int
    is_correct: bool
    completed: bool
    competency_state: Optional[str] = None
    feedback: str

# --- Learning Path ---
class TaskCompleteRequest(BaseModel):
    task_id: str
    student_id: str

class LearningTaskDTO(BaseModel):
    id: str
    title: str
    description: str
    skill: str
    task_order: int
    completed: bool

class LearningPathResponse(BaseModel):
    id: str
    target_role: str
    missing_skills: List[str]
    tasks: List[LearningTaskDTO]

# --- Placement Readiness ---
class ReadinessCalculationResponse(BaseModel):
    student_id: str
    target_role: str
    overall_score: int
    confidence_level: str
    breakdown: Dict[str, Dict[str, Any]]
    required_skills: List[str]
    verified_skills: List[str]
    missing_skills: List[str]

# --- Eligibility & Appeals ---
class EligibilityCheckRequest(BaseModel):
    rules: Dict[str, Any]
    student: Dict[str, Any]

class EligibilityDecisionResponse(BaseModel):
    eligible: bool
    failed_rules: List[str]
    rule_version: int
    inputs: Dict[str, Any]
    decision_id: Optional[str] = None

class AppealRequest(BaseModel):
    decision_id: str
    student_id: str
    reason: str

# --- Approvals & Pipeline ---
class ApprovalActionRequest(BaseModel):
    approval_id: str
    officer_name: str
    action: str  # approved | rejected

class PipelineAdvanceRequest(BaseModel):
    application_id: str
    officer_approval: Optional[bool] = False

# --- Audit & Integrity ---
class AuditEntryDTO(BaseModel):
    id: int
    college_id: str
    actor: str
    action: str
    prev_hash: str
    hash: str
    created_at: datetime

class AuditVerificationResponse(BaseModel):
    intact: bool
    college_id: str
    total_entries: int
    entries: List[AuditEntryDTO]

# --- Phase 3 Student Dashboard & Evidence Intelligence Schemas ---
class ClaimSkillRequest(BaseModel):
    student_id: str
    skill_name: str
    category: str = "languages"  # languages, frameworks, databases, fundamentals, tools, soft_skills
    proficiency: Optional[str] = "Intermediate"

class MentorVerificationRequestCreate(BaseModel):
    student_id: str
    skill_name: str
    mentor_name: str
    mentor_email: Optional[str] = None
    evidence_summary: str
    walkthrough_notes: Optional[str] = None

class MentorVerificationAdjudicate(BaseModel):
    request_id: str
    mentor_name: str
    approved: bool
    rejection_reason: Optional[str] = None
    notes: Optional[str] = None

class ConsentUpdate(BaseModel):
    student_id: str
    purpose: str  # github_sync, leetcode_sync, recruiter_sharing
    granted: bool

class ResumeSaveRequest(BaseModel):
    student_id: str
    template_name: str = "modern_enterprise"
    title: Optional[str] = "Evidence-Backed Placement CV"

class DriveApplyRequest(BaseModel):
    drive_id: str
    student_id: str

class DriveAppealSubmit(BaseModel):
    drive_id: str
    student_id: str
    reason: str

# --- Phase 5: Personalized Learning Path, Skill-Gap & Intervention Schemas ---
class TaskProgressUpdateRequest(BaseModel):
    task_id: str
    student_id: str
    status: str  # not_started, in_progress, submitted, awaiting_review, completed, reassessment_required
    time_spent_minutes: Optional[int] = None

class TaskEvidenceSubmitRequest(BaseModel):
    task_id: str
    student_id: str
    artifact_type: str = "project_url"  # repo, document, project_url, screenshot
    artifact_url: str
    notes: Optional[str] = None

class TaskSubmissionReviewRequest(BaseModel):
    submission_id: str
    reviewer_name: str
    reviewer_role: str = "officer"
    approved: bool
    review_notes: Optional[str] = ""

class ReassessmentRequest(BaseModel):
    student_id: str
    skill_name: str
    target_role: Optional[str] = "Backend Developer"

class LearningResourceCreateRequest(BaseModel):
    title: str
    provider: str
    url: str
    resource_type: str = "documentation"
    skill_name: str

class TrainingInterventionCreateRequest(BaseModel):
    college_id: str = "COLLEGE-A"
    created_by: str = "T&P Officer"
    title: str
    description: Optional[str] = ""
    target_role: str = "Backend Developer"
    target_skills: List[str] = []

class InterventionAssignRequest(BaseModel):
    college_id: str = "COLLEGE-A"
    student_ids: List[str]
    actor: str = "T&P Officer"

# --- Phase 6: Intelligent Placement Matching, Eligibility & Campus Drive Schemas ---
class CompanyCreateRequest(BaseModel):
    name: str
    industry: str
    description: Optional[str] = None
    website: Optional[str] = None
    recruiter_contact: Optional[str] = None
    college_id: str = "COLLEGE-A"

class JobOpportunityCreateRequest(BaseModel):
    company_id: str
    title: str
    description: Optional[str] = None
    category: str = "Engineering"
    location: str = "Bengaluru / Hybrid"
    employment_type: str = "Full-Time"
    salary_range: Optional[str] = None
    min_cgpa: float = 6.5
    max_backlogs: int = 0
    required_skills: Optional[List[str]] = None
    preferred_skills: Optional[List[str]] = None
    min_assessment_score: float = 60.0
    eligible_departments: Optional[List[str]] = None
    eligible_grad_years: Optional[List[int]] = None
    college_id: str = "COLLEGE-A"

class ApproveExtractedSkillsRequest(BaseModel):
    approved_skills: List[str]
    preferred_skills: Optional[List[str]] = None
    college_id: str = "COLLEGE-A"

class EligibilityRuleCreateRequest(BaseModel):
    college_id: str = "COLLEGE-A"
    rule_name: str
    description: Optional[str] = None
    min_cgpa: float = 6.5
    max_backlogs: int = 0
    required_skills: List[str] = []
    eligible_departments: List[str] = []
    eligible_grad_years: List[int] = []
    min_assessment_score: float = 0.0
    standing_arrears_allowed: bool = False
    job_role_id: Optional[str] = None
    drive_id: Optional[str] = None

class EligibilityOverrideRequest(BaseModel):
    decision_id: str
    college_id: str = "COLLEGE-A"
    officer_name: str = "T&P Officer"
    new_eligible: bool
    reason: str

class AppealReviewRequest(BaseModel):
    college_id: str = "COLLEGE-A"
    officer_name: str = "T&P Officer"
    action: str  # approved, rejected, clarification_requested
    reviewer_notes: str = ""
    corrected_data: Optional[Dict[str, Any]] = None

class DriveCreateRequest(BaseModel):
    college_id: str = "COLLEGE-A"
    company_id: str
    job_role_id: str
    title: str
    day_of_week: str = "Wed"
    activity: str = "Campus Drive"
    description: Optional[str] = None
    drive_date: Optional[str] = None
    time_slot: Optional[str] = "10:00 AM - 01:00 PM"
    room: Optional[str] = "Auditorium A"
    application_deadline: Optional[datetime] = None
    selection_stages: Optional[List[str]] = None
    publish_immediately: bool = False

class StageTransitionRequest(BaseModel):
    new_status: str
    college_id: str = "COLLEGE-A"
    actor: str = "T&P Officer"
    actor_role: str = "officer"
    reason: Optional[str] = None

class InterviewScheduleRequest(BaseModel):
    drive_id: str
    application_id: str
    college_id: str = "COLLEGE-A"
    round_name: str
    interviewer: str
    scheduled_date: str
    time_slot: str
    room: str

class RecruiterFeedbackRequest(BaseModel):
    application_id: str
    college_id: str = "COLLEGE-A"
    recruiter_name: str = "Recruiter"
    round_name: str
    rating: int = 4
    strengths: str = ""
    concerns: str = ""
    recommendation: str = "advance"

class SelectionDecisionRequest(BaseModel):
    application_id: str
    college_id: str = "COLLEGE-A"
    decision: str  # selected, not_selected, waitlisted
    package_ctc: Optional[str] = None
    notes: Optional[str] = None

class BulkCommPreviewRequest(BaseModel):
    college_id: str = "COLLEGE-A"
    drive_id: Optional[str] = None
    audience_filter: str = "eligible"
    template_type: str = "drive_announcement"
    department: Optional[str] = None
    drive_title: str = "Campus Placement Drive"
    custom_subject: Optional[str] = None
    custom_body: Optional[str] = None
