import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from backend.app.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

class College(Base):
    __tablename__ = "colleges"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    code = Column(String(20), unique=True, nullable=False)
    name = Column(String(150), nullable=False)
    city = Column(String(100))
    state = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    students = relationship("Student", back_populates="college", cascade="all, delete-orphan")
    drives = relationship("PlacementDrive", back_populates="college", cascade="all, delete-orphan")

class Department(Base):
    __tablename__ = "departments"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    college_id = Column(String(36), ForeignKey("colleges.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    code = Column(String(20), nullable=False)

class User(Base):
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    college_id = Column(String(36), ForeignKey("colleges.id", ondelete="SET NULL"), nullable=True)
    email = Column(String(150), unique=True, nullable=False)
    full_name = Column(String(150), nullable=False)
    role = Column(String(30), nullable=False, default="student")  # student, tp_officer, recruiter, university_admin
    password_hash = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Student(Base):
    __tablename__ = "students"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=True)
    college_id = Column(String(36), ForeignKey("colleges.id", ondelete="CASCADE"), nullable=False)
    roll_number = Column(String(50))
    name = Column(String(150), nullable=False)
    branch = Column(String(50), nullable=False, default="CSE")
    gender = Column(String(20), default="Male")
    category = Column(String(50), default="General")
    cgpa = Column(Float, nullable=False, default=7.5)
    backlogs = Column(Integer, nullable=False, default=0)
    github_username = Column(String(100), nullable=True)
    github_connected = Column(Boolean, default=False)
    github_consent_revoked = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    college = relationship("College", back_populates="students")
    competencies = relationship("Competency", back_populates="student", cascade="all, delete-orphan")
    evidence = relationship("Evidence", back_populates="student", cascade="all, delete-orphan")
    consents = relationship("Consent", back_populates="student", cascade="all, delete-orphan")

class Competency(Base):
    __tablename__ = "competencies"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    college_id = Column(String(36), nullable=False)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    taxonomy_code = Column(String(50), nullable=True)
    skill_name = Column(String(100), nullable=False)
    category = Column(String(50), default="languages")  # languages, frameworks, databases, fundamentals, tools, soft_skills
    proficiency = Column(String(30), default="Intermediate")  # Beginner, Intermediate, Advanced, Expert
    state = Column(String(30), nullable=False, default="claimed")  # claimed, observed, evidence_linked, assessed, verified, expired
    confidence = Column(Float, default=0.50)
    verified_by = Column(String(150), nullable=True)
    verification_method = Column(String(100), nullable=True)
    last_assessed_at = Column(DateTime, nullable=True)
    verified_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    student = relationship("Student", back_populates="competencies")
    evidence_items = relationship("Evidence", back_populates="competency", cascade="all, delete-orphan")

class Evidence(Base):
    __tablename__ = "evidence"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    college_id = Column(String(36), nullable=False)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    competency_id = Column(String(36), ForeignKey("competencies.id", ondelete="CASCADE"), nullable=False)
    kind = Column(String(50), nullable=False)  # commit, repo, cert, hackathon, lab, test, mentor, walkthrough
    title = Column(String(200), nullable=False)
    ref_url = Column(String(500), nullable=False)
    confidence = Column(Float, default=0.70)
    extra_metadata = Column("metadata", JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    student = relationship("Student", back_populates="evidence")
    competency = relationship("Competency", back_populates="evidence_items")

class Consent(Base):
    __tablename__ = "consents"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    college_id = Column(String(36), nullable=False)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    category = Column(String(80), default="placement_participation")
    purpose = Column(String(100), nullable=False)
    policy_version = Column(String(30), default="v2.0")
    collection_method = Column(String(50), default="explicit_opt_in")
    data_categories = Column(JSON, default=list)
    granted = Column(Boolean, default=True)
    granted_at = Column(DateTime, default=datetime.utcnow)
    revoked_at = Column(DateTime, nullable=True)
    
    student = relationship("Student", back_populates="consents")

class Company(Base):
    __tablename__ = "companies"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(150), nullable=False)
    industry = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    website = Column(String(200))
    recruiter_contact = Column(String(150), nullable=True)
    verification_status = Column(String(30), default="verified")  # verified, pending, unverified
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    roles = relationship("JobRole", back_populates="company", cascade="all, delete-orphan")

class JobRole(Base):
    __tablename__ = "job_roles"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), default="Engineering")
    location = Column(String(100), default="Bengaluru / Hybrid")
    employment_type = Column(String(50), default="Full-Time")  # Full-Time, Internship
    salary_range = Column(String(100), nullable=True)
    min_cgpa = Column(Float, default=6.0)
    max_backlogs = Column(Integer, default=0)
    required_skills = Column(JSON, default=list)  # ["Python", "SQL", "Git", "Docker"]
    preferred_skills = Column(JSON, default=list)
    skill_requirements = Column(JSON, default=list)  # [{skill, min_proficiency, required_evidence_level}]
    min_assessment_score = Column(Float, default=60.0)
    eligible_departments = Column(JSON, default=list)
    eligible_branches = Column(JSON, default=list)
    eligible_grad_years = Column(JSON, default=list)
    application_deadline = Column(DateTime, nullable=True)
    selection_stages = Column(JSON, default=list)
    status = Column(String(30), default="published")  # draft, pending_review, published, closed
    ai_extracted_skills = Column(JSON, default=list)
    extracted_approved = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    company = relationship("Company", back_populates="roles")

class PlacementDrive(Base):
    __tablename__ = "placement_drives"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    college_id = Column(String(36), ForeignKey("colleges.id", ondelete="CASCADE"), nullable=False)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    job_role_id = Column(String(36), ForeignKey("job_roles.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    day_of_week = Column(String(20), nullable=False)  # Mon, Tue, Wed, Thu, Fri
    activity = Column(String(100), nullable=False)   # Visit, Test, Interviews, Offers
    drive_date = Column(String(30), nullable=True)
    time_slot = Column(String(50), nullable=True)
    room = Column(String(100), nullable=True)
    application_deadline = Column(DateTime, nullable=True)
    selection_stages = Column(JSON, default=list)
    status = Column(String(50), default="scheduled")  # draft, pending_approval, scheduled, published, completed
    published = Column(Boolean, default=True)
    published_at = Column(DateTime, nullable=True)
    has_clash = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    college = relationship("College", back_populates="drives")

class EligibilityRule(Base):
    __tablename__ = "eligibility_rules"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    college_id = Column(String(36), nullable=False)
    drive_id = Column(String(36), nullable=True)
    job_role_id = Column(String(36), nullable=True)
    rule_name = Column(String(150), default="Standard Placement Eligibility")
    description = Column(Text, nullable=True)
    rule_type = Column(String(50), default="composite")  # academic, competency, assessment, certification, composite
    operator = Column(String(20), default=">=")
    expected_value = Column(JSON, default=dict)
    mandatory = Column(Boolean, default=True)
    version = Column(Integer, nullable=False, default=1)
    min_cgpa = Column(Float, nullable=False, default=7.0)
    max_backlogs = Column(Integer, nullable=False, default=0)
    standing_arrears_allowed = Column(Boolean, default=False)
    eligible_departments = Column(JSON, default=list)
    eligible_grad_years = Column(JSON, default=list)
    required_skills = Column(JSON, default=list)
    min_assessment_score = Column(Float, default=0.0)
    required_certifications = Column(JSON, default=list)
    effective_date = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String(150), default="T&P Officer")
    approval_status = Column(String(30), default="approved")  # approved, pending, rejected
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class EligibilityDecision(Base):
    __tablename__ = "eligibility_decisions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    college_id = Column(String(36), nullable=False)
    student_id = Column(String(36), nullable=False)
    drive_id = Column(String(36), nullable=True)
    job_role_id = Column(String(36), nullable=True)
    rule_id = Column(String(36), nullable=False)
    rule_version = Column(Integer, nullable=False)
    eligible = Column(Boolean, nullable=False)
    status = Column(String(40), default="eligible")  # eligible, not_eligible, pending_verification, needs_manual_review
    student_inputs = Column(JSON, nullable=False)
    failed_conditions = Column(JSON, default=list)
    rule_items = Column(JSON, default=list)  # [{criterion, result, explanation}]
    decision_timestamp = Column(DateTime, default=datetime.utcnow)
    appealed = Column(Boolean, default=False)
    override_by = Column(String(150), nullable=True)
    override_reason = Column(Text, nullable=True)
    override_at = Column(DateTime, nullable=True)

class EligibilityAppeal(Base):
    __tablename__ = "eligibility_appeals"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    decision_id = Column(String(36), nullable=False)
    student_id = Column(String(36), nullable=False)
    college_id = Column(String(36), nullable=False)
    appeal_type = Column(String(50), default="incorrect_evaluation")
    reason = Column(Text, nullable=False)
    requested_correction = Column(JSON, default=dict)
    status = Column(String(30), default="pending")  # pending, clarification_requested, approved, rejected
    reviewer_notes = Column(Text, nullable=True)
    decided_by = Column(String(150), nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class QuestionBank(Base):
    __tablename__ = "question_bank"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    category = Column(String(50), nullable=False)  # Aptitude, Programming, DSA, DBMS, OS, Networks, Web, Tools, Debugging, Interview
    topic = Column(String(100), default="General", nullable=False)
    question_type = Column(String(50), default="mcq", nullable=False)  # mcq, coding, sql, debugging, interview
    difficulty_str = Column(String(50), default="Intermediate", nullable=False)  # Beginner, Intermediate, Advanced
    question = Column(Text, nullable=False)
    options = Column(JSON, nullable=False)
    correct_option_index = Column(Integer, nullable=False)
    difficulty_level = Column(Integer, nullable=False, default=1)  # 1, 2, 3
    expected_answer = Column(Text, nullable=True)
    test_cases = Column(JSON, default=list)
    starter_code = Column(Text, nullable=True)
    evaluation_criteria = Column(JSON, default=dict)
    marks = Column(Integer, default=1)
    time_limit_sec = Column(Integer, default=120)
    explanation = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class AssessmentAttempt(Base):
    __tablename__ = "assessment_attempts"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    college_id = Column(String(36), nullable=False)
    student_id = Column(String(36), nullable=False)
    category = Column(String(50), nullable=False)
    assessment_type = Column(String(50), default="mcq")  # aptitude, programming, sql, mcq, debugging, interview, comprehensive
    target_role = Column(String(100), nullable=True)
    score = Column(Integer, default=0)
    total_questions = Column(Integer, default=5)
    passed = Column(Boolean, default=False)
    time_spent_seconds = Column(Integer, default=0)
    status = Column(String(50), default="completed")  # in_progress, completed, expired
    expires_at = Column(DateTime, nullable=True)
    topic_scores = Column(JSON, default=dict)
    difficulty_scores = Column(JSON, default=dict)
    responses = Column(JSON, default=list)
    weak_topics = Column(JSON, default=list)
    strong_topics = Column(JSON, default=list)
    recommendations = Column(JSON, default=list)
    history = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

class LearningPath(Base):
    __tablename__ = "learning_paths"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), nullable=False, index=True)
    college_id = Column(String(36), nullable=False, index=True)
    target_role = Column(String(100), nullable=False)
    missing_skills = Column(JSON, default=list)
    recommendation_version = Column(String(30), default="v2.0-deterministic")
    readiness_before = Column(Integer, nullable=True)
    readiness_after = Column(Integer, nullable=True)
    soft_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    tasks = relationship("LearningTask", back_populates="learning_path", cascade="all, delete-orphan")

class LearningTask(Base):
    __tablename__ = "learning_tasks"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    learning_path_id = Column(String(36), ForeignKey("learning_paths.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    skill = Column(String(50), nullable=False)
    learning_objective = Column(Text, nullable=True)
    priority = Column(String(20), default="Medium")  # Critical, High, Medium, Low
    estimated_minutes = Column(Integer, default=45)
    difficulty = Column(String(30), default="Intermediate")  # Beginner, Intermediate, Advanced
    task_type = Column(String(50), default="concept_learning")  # concept_learning, coding_practice, sql_exercises, debugging, mini_project, full_project, documentation, mock_interview, aptitude_practice, skill_assessment
    prerequisites = Column(JSON, default=list)
    practical_activity = Column(Text, nullable=True)
    expected_deliverable = Column(Text, nullable=True)
    completion_criteria = Column(Text, nullable=True)
    recommended_reassessment = Column(String(100), nullable=True)
    resource_ids = Column(JSON, default=list)
    status = Column(String(30), default="not_started")  # not_started, in_progress, submitted, awaiting_review, completed, reassessment_required
    time_spent_minutes = Column(Integer, nullable=True)  # Only set when reliably tracked
    task_order = Column(Integer, default=1)
    completed = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    soft_deleted = Column(Boolean, default=False)
    
    learning_path = relationship("LearningPath", back_populates="tasks")

class Application(Base):
    __tablename__ = "applications"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    college_id = Column(String(36), nullable=False)
    drive_id = Column(String(36), nullable=False)
    job_role_id = Column(String(36), nullable=True)
    student_id = Column(String(36), nullable=False)
    student_name = Column(String(150), nullable=False)
    branch = Column(String(50), default="CSE")
    verified_skills = Column(String(255), default="")
    stage = Column(String(50), default="Shortlisted")  # Shortlisted, Interview, Offer, Accepted
    status = Column(String(40), default="applied")  # not_applied, applied, under_review, shortlisted, assessment_scheduled, interview_scheduled, selected, not_selected, withdrawn
    stage_index = Column(Integer, default=0)
    officer_approved_offer = Column(Boolean, default=False)
    withdrawn_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Approval(Base):
    __tablename__ = "approvals"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    college_id = Column(String(36), nullable=False)
    proposed_by = Column(String(100), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    payload = Column(JSON, default=dict)
    status = Column(String(30), default="pending")  # pending, approved, rejected
    decided_by = Column(String(150), nullable=True)
    decided_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class AuditLogEntry(Base):
    __tablename__ = "audit_log"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    college_id = Column(String(36), nullable=False)
    actor = Column(String(100), nullable=False)
    action = Column(String(255), nullable=False)
    prev_hash = Column(String(64), nullable=False)
    hash = Column(String(64), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class MentorVerificationRequest(Base):
    __tablename__ = "mentor_verification_requests"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    college_id = Column(String(36), nullable=False)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    competency_id = Column(String(36), ForeignKey("competencies.id", ondelete="CASCADE"), nullable=False)
    skill_name = Column(String(100), nullable=False)
    mentor_name = Column(String(150), nullable=False)
    mentor_email = Column(String(150), nullable=True)
    evidence_summary = Column(Text, nullable=False)
    walkthrough_notes = Column(Text, nullable=True)
    status = Column(String(30), default="pending")  # pending, approved, rejected
    rejection_reason = Column(Text, nullable=True)
    reviewed_by = Column(String(150), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class ResumeRecord(Base):
    __tablename__ = "resume_records"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    college_id = Column(String(36), nullable=False)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    template_name = Column(String(50), default="modern_enterprise")
    title = Column(String(150), default="Evidence-Backed Placement CV")
    verified_skills = Column(JSON, default=list)
    projects = Column(JSON, default=list)
    certifications = Column(JSON, default=list)
    education = Column(JSON, default=dict)
    generated_at = Column(DateTime, default=datetime.utcnow)

class GitHubRepository(Base):
    __tablename__ = "github_repositories"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    repo_name = Column(String(150), nullable=False)
    repo_url = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    primary_language = Column(String(50), nullable=True)
    languages = Column(JSON, default=dict)
    commit_count = Column(Integer, default=0)
    stars = Column(Integer, default=0)
    is_authorized = Column(Boolean, default=True)
    last_scanned_at = Column(DateTime, default=datetime.utcnow)

class ReadinessSnapshot(Base):
    __tablename__ = "readiness_snapshots"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    college_id = Column(String(36), nullable=False)
    target_role = Column(String(100), nullable=False)
    overall_score = Column(Integer, nullable=False)
    confidence_level = Column(String(50), default="medium")
    technical_score = Column(Float, default=0.0)
    coding_score = Column(Float, default=0.0)
    aptitude_score = Column(Float, default=0.0)
    interview_score = Column(Float, default=0.0)
    skill_coverage_score = Column(Float, default=0.0)
    breakdown_json = Column(JSON, default=dict)
    missing_skills = Column(JSON, default=list)
    verified_skills = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

class RoleRequirementConfig(Base):
    __tablename__ = "role_requirements"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    role_name = Column(String(100), unique=True, nullable=False)
    required_skills = Column(JSON, default=list)
    min_cgpa = Column(Float, default=6.5)
    max_backlogs = Column(Integer, default=0)
    assessment_weights = Column(JSON, default=dict)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

# --- Phase 5: Personalized Learning Path & Skill-Gap Closure Models ---

class SkillPrerequisite(Base):
    __tablename__ = "skill_prerequisites"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    skill_name = Column(String(100), nullable=False, index=True)
    prerequisite_skill = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class LearningResource(Base):
    __tablename__ = "learning_resources"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(200), nullable=False)
    provider = Column(String(100), nullable=False)
    url = Column(String(500), nullable=False)
    resource_type = Column(String(50), nullable=False)  # documentation, tutorial, video, practice, exercise, project_reference
    skill_name = Column(String(100), nullable=False, index=True)
    is_verified = Column(Boolean, default=True)
    is_external = Column(Boolean, default=True)
    approved_by = Column(String(150), nullable=True)
    soft_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class SkillGap(Base):
    __tablename__ = "skill_gaps"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    college_id = Column(String(36), nullable=False, index=True)
    target_role = Column(String(100), nullable=False)
    skill_name = Column(String(100), nullable=False)
    required_proficiency = Column(String(30), default="Intermediate")
    current_proficiency = Column(String(30), default="Unknown")  # Unknown, Unassessed, Beginner, Intermediate, Advanced
    current_state = Column(String(30), default="unknown")  # unknown, unassessed, claimed, observed, evidence_linked, assessed, verified, expired
    gap_status = Column(String(40), nullable=False)  # meets_requirement, needs_improvement, missing_skill, evidence_required, assessment_required, reassessment_recommended
    priority = Column(String(20), default="Medium")  # Critical, High, Medium, Low
    priority_score = Column(Float, default=0.0)
    mandatory = Column(Boolean, default=True)
    importance = Column(Float, default=1.0)
    explanation = Column(Text, nullable=False)
    priority_reason = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class TaskSubmission(Base):
    __tablename__ = "task_submissions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    task_id = Column(String(36), ForeignKey("learning_tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    college_id = Column(String(36), nullable=False, index=True)
    artifact_type = Column(String(50), default="project_url")  # repo, document, project_url, screenshot
    artifact_url = Column(String(500), nullable=False)
    notes = Column(Text, nullable=True)
    evidence_id = Column(String(36), nullable=True)
    status = Column(String(30), default="awaiting_review")  # submitted, awaiting_review, approved, rejected
    reviewed_by = Column(String(150), nullable=True)
    review_notes = Column(Text, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class LearningEvent(Base):
    __tablename__ = "learning_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), nullable=False, index=True)
    college_id = Column(String(36), nullable=False, index=True)
    learning_path_id = Column(String(36), nullable=True)
    task_id = Column(String(36), nullable=True)
    event_type = Column(String(50), nullable=False)
    details = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

class RecommendationLog(Base):
    __tablename__ = "recommendation_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), nullable=False, index=True)
    college_id = Column(String(36), nullable=False, index=True)
    target_role = Column(String(100), nullable=False)
    version = Column(String(50), default="v2.0")
    source = Column(String(50), default="deterministic_template")  # deterministic_template, ai_assisted
    input_references = Column(JSON, default=dict)
    validation_passed = Column(Boolean, default=True)
    validation_notes = Column(Text, nullable=True)
    generated_at = Column(DateTime, default=datetime.utcnow)

class TrainingIntervention(Base):
    __tablename__ = "training_interventions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    college_id = Column(String(36), nullable=False, index=True)
    created_by = Column(String(150), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    target_role = Column(String(100), nullable=False)
    target_skills = Column(JSON, default=list)
    status = Column(String(30), default="active")  # active, completed, archived
    soft_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class InterventionStudent(Base):
    __tablename__ = "intervention_students"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    intervention_id = Column(String(36), ForeignKey("training_interventions.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    college_id = Column(String(36), nullable=False, index=True)
    assigned_task_ids = Column(JSON, default=list)
    participation_status = Column(String(30), default="assigned")  # assigned, in_progress, completed
    pre_avg_score = Column(Float, nullable=True)
    post_avg_score = Column(Float, nullable=True)
    assigned_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# --- Phase 6: Intelligent Placement Matching & Campus Drive Management Models ---

class CompanyCollegeAccess(Base):
    __tablename__ = "company_college_access"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    college_id = Column(String(36), nullable=False, index=True)
    recruiter_user_id = Column(String(36), nullable=True)
    authorized = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class DriveRound(Base):
    __tablename__ = "drive_rounds"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    drive_id = Column(String(36), ForeignKey("placement_drives.id", ondelete="CASCADE"), nullable=False, index=True)
    college_id = Column(String(36), nullable=False, index=True)
    round_order = Column(Integer, default=1)
    name = Column(String(120), nullable=False)
    round_type = Column(String(50), default="interview")  # ppt, aptitude, coding, technical_interview, hr_interview, final
    room = Column(String(100), nullable=True)
    time_slot = Column(String(50), nullable=True)
    scheduled_date = Column(String(30), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class ApplicationStageHistory(Base):
    __tablename__ = "application_stage_history"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    application_id = Column(String(36), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True)
    college_id = Column(String(36), nullable=False, index=True)
    previous_status = Column(String(50), nullable=False)
    new_status = Column(String(50), nullable=False)
    actor = Column(String(150), nullable=False)
    reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class InterviewSchedule(Base):
    __tablename__ = "interview_schedules"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    drive_id = Column(String(36), nullable=False, index=True)
    application_id = Column(String(36), nullable=False, index=True)
    student_id = Column(String(36), nullable=False, index=True)
    college_id = Column(String(36), nullable=False, index=True)
    round_name = Column(String(120), nullable=False)
    interviewer = Column(String(150), nullable=False)
    scheduled_date = Column(String(30), nullable=False)
    time_slot = Column(String(50), nullable=False)
    room = Column(String(100), nullable=False)
    status = Column(String(30), default="scheduled")  # scheduled, completed, cancelled
    created_at = Column(DateTime, default=datetime.utcnow)

class RecruiterFeedback(Base):
    __tablename__ = "recruiter_feedback"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    application_id = Column(String(36), nullable=False, index=True)
    drive_id = Column(String(36), nullable=False)
    college_id = Column(String(36), nullable=False, index=True)
    recruiter_name = Column(String(150), nullable=False)
    round_name = Column(String(120), nullable=False)
    rating = Column(Integer, default=4)
    strengths = Column(Text, nullable=True)
    concerns = Column(Text, nullable=True)
    recommendation = Column(String(50), default="advance")  # advance, hold, reject
    is_private = Column(Boolean, default=True)  # Never disclosed to students
    created_at = Column(DateTime, default=datetime.utcnow)

class SelectionDecision(Base):
    __tablename__ = "selection_decisions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    application_id = Column(String(36), unique=True, nullable=False, index=True)
    drive_id = Column(String(36), nullable=False)
    college_id = Column(String(36), nullable=False, index=True)
    decision = Column(String(30), nullable=False)  # selected, not_selected, waitlisted
    package_ctc = Column(String(50), nullable=True)
    decided_by = Column(String(150), nullable=False)
    officer_approved = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class CommunicationTemplate(Base):
    __tablename__ = "communication_templates"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    college_id = Column(String(36), nullable=False, index=True)
    name = Column(String(150), nullable=False)
    template_type = Column(String(50), nullable=False)  # drive_announcement, deadline_reminder, assessment_schedule, interview_schedule, selection_update
    subject = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class CommunicationLog(Base):
    __tablename__ = "communication_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    college_id = Column(String(36), nullable=False, index=True)
    drive_id = Column(String(36), nullable=True)
    sender = Column(String(150), nullable=False)
    template_type = Column(String(50), nullable=False)
    subject = Column(String(255), nullable=False)
    recipient_count = Column(Integer, default=0)
    recipient_emails = Column(JSON, default=list)
    status = Column(String(30), default="preview_simulated")  # sent, preview_simulated, failed
    provider_mode = Column(String(50), default="simulated_preview")  # smtp_configured, simulated_preview
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

# --- Phase 7: Institutional Placement Intelligence & Accreditation Reporting Models ---

class MetricDefinition(Base):
    __tablename__ = "metric_definitions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    metric_key = Column(String(100), unique=True, nullable=False, index=True)
    metric_name = Column(String(150), nullable=False)
    definition = Column(Text, nullable=False)
    calculation_formula = Column(Text, nullable=False)
    data_source = Column(String(200), nullable=False)
    reporting_period = Column(String(100), default="Current Academic Cycle")
    inclusion_criteria = Column(Text, nullable=False)
    exclusion_criteria = Column(Text, nullable=False)
    missing_data_handling = Column(Text, nullable=False)
    data_owner = Column(String(150), default="Training & Placement Office")
    created_at = Column(DateTime, default=datetime.utcnow)

class AnalyticsSnapshot(Base):
    __tablename__ = "analytics_snapshots"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    college_id = Column(String(36), nullable=False, index=True)
    snapshot_type = Column(String(80), nullable=False)
    reporting_period = Column(String(100), default="2025-2026")
    filters_json = Column(JSON, default=dict)
    payload_json = Column(JSON, default=dict)
    computed_at = Column(DateTime, default=datetime.utcnow)

class DataQualityIssue(Base):
    __tablename__ = "data_quality_issues"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    college_id = Column(String(36), nullable=False, index=True)
    check_name = Column(String(120), nullable=False)
    severity = Column(String(30), default="warning")  # warning, critical
    entity_type = Column(String(80), nullable=False)
    affected_count = Column(Integer, default=0)
    description = Column(Text, nullable=False)
    resolved = Column(Boolean, default=False)
    detected_at = Column(DateTime, default=datetime.utcnow)

class InstitutionalReport(Base):
    __tablename__ = "institutional_reports"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    college_id = Column(String(36), nullable=False, index=True)
    report_type = Column(String(80), nullable=False)  # NAAC_5_2, NIRF_PLACEMENT, INSTITUTIONAL_SUMMARY, INTERVENTION_AUDIT
    reporting_period = Column(String(100), default="2025-2026")
    generated_by = Column(String(150), nullable=False)
    metrics_json = Column(JSON, default=dict)
    missing_data_warnings = Column(JSON, default=list)
    evidence_references = Column(JSON, default=list)
    disclaimer = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class UniversityCollegeAccess(Base):
    __tablename__ = "university_college_access"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    university_user_id = Column(String(36), nullable=False, index=True)
    college_id = Column(String(36), nullable=False, index=True)
    authorized = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

# --- Phase 8: Trust, Governance, DPDP Privacy, Fairness & Tamper-Evident Audit Models ---

class PrivacyNoticeVersion(Base):
    __tablename__ = "privacy_notice_versions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    version = Column(String(30), unique=True, nullable=False)
    title = Column(String(200), nullable=False)
    data_categories = Column(JSON, default=list)
    purposes = Column(JSON, default=list)
    sharing_recipients = Column(JSON, default=list)
    retention_info = Column(Text, nullable=False)
    user_controls = Column(Text, nullable=False)
    grievance_contact = Column(String(200), nullable=False)
    effective_date = Column(DateTime, default=datetime.utcnow)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class RetentionPolicy(Base):
    __tablename__ = "retention_policies"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    college_id = Column(String(36), nullable=False, index=True)
    entity_type = Column(String(80), nullable=False)
    retention_days = Column(Integer, default=365)
    legal_exception_note = Column(Text, nullable=True)
    auto_anonymize = Column(Boolean, default=True)
    updated_by = Column(String(150), default="Data Protection Officer")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class PrivacyRequest(Base):
    __tablename__ = "privacy_requests"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), nullable=False, index=True)
    college_id = Column(String(36), nullable=False, index=True)
    request_type = Column(String(50), nullable=False)  # data_export, deletion_erasure, correction, grievance
    reason = Column(Text, nullable=False)
    status = Column(String(40), default="pending")  # pending, approved, rejected, restricted_retained, completed
    reviewer_name = Column(String(150), nullable=True)
    reviewer_notes = Column(Text, nullable=True)
    retention_exception_applied = Column(Boolean, default=False)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class DataAccessLog(Base):
    __tablename__ = "data_access_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    college_id = Column(String(36), nullable=False, index=True)
    actor_id = Column(String(100), nullable=False)
    actor_role = Column(String(50), nullable=False)
    student_id = Column(String(36), nullable=True, index=True)
    resource_type = Column(String(80), nullable=False)
    resource_id = Column(String(100), nullable=True)
    purpose = Column(String(100), nullable=False)
    allowed = Column(Boolean, default=True)
    denial_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class FairnessAudit(Base):
    __tablename__ = "fairness_audits"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    college_id = Column(String(36), nullable=False, index=True)
    analysis_period = Column(String(100), default="2025-2026")
    population_size = Column(Integer, default=0)
    rules_examined = Column(JSON, default=list)
    data_coverage_pct = Column(Float, default=100.0)
    anomalies_detected = Column(JSON, default=list)
    disparity_indicators = Column(JSON, default=dict)
    limitations = Column(Text, nullable=False)
    recommended_investigation = Column(Text, nullable=False)
    human_reviewer = Column(String(150), nullable=True)
    review_outcome = Column(String(40), default="pending_review")  # pending_review, resolved, escalated
    created_at = Column(DateTime, default=datetime.utcnow)

class ExplanationRecord(Base):
    __tablename__ = "explanation_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    college_id = Column(String(36), nullable=False, index=True)
    student_id = Column(String(36), nullable=True, index=True)
    module = Column(String(80), nullable=False)
    decision_output = Column(JSON, default=dict)
    inputs_used = Column(JSON, default=dict)
    rule_or_model_version = Column(String(80), default="v2.0")
    supporting_evidence = Column(JSON, default=list)
    missing_data = Column(JSON, default=list)
    ai_contributed = Column(Boolean, default=False)
    human_reviewed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class AuditChainHead(Base):
    __tablename__ = "audit_chain_heads"

    college_id = Column(String(36), primary_key=True)
    last_event_id = Column(Integer, default=0)
    last_hash = Column(String(64), default="GENESIS")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class AuditCheckpoint(Base):
    __tablename__ = "audit_checkpoints"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    college_id = Column(String(36), nullable=False, index=True)
    event_count = Column(Integer, default=0)
    head_hash = Column(String(64), nullable=False)
    hmac_signature = Column(String(128), nullable=False)
    verified_intact = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class AuditVerificationRun(Base):
    __tablename__ = "audit_verification_runs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    college_id = Column(String(36), nullable=False, index=True)
    chain_intact = Column(Boolean, default=True)
    total_checked = Column(Integer, default=0)
    broken_event_id = Column(Integer, nullable=True)
    details = Column(Text, nullable=True)
    verified_by = Column(String(150), default="System Auditor")
    verified_at = Column(DateTime, default=datetime.utcnow)

class SecurityEvent(Base):
    __tablename__ = "security_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    college_id = Column(String(36), nullable=True, index=True)
    event_type = Column(String(80), nullable=False)
    severity = Column(String(30), default="medium")
    actor_id = Column(String(100), nullable=True)
    details = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
