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
    question: str
    options: List[str]
    difficulty_level: int
    explanation: Optional[str] = None

class AnswerSubmission(BaseModel):
    student_id: str
    category: str
    question_id: str
    selected_option_index: int
    current_difficulty: int

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
