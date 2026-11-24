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
    state = Column(String(30), nullable=False, default="claimed")  # claimed, observed, evidence_linked, assessed, verified, expired
    confidence = Column(Float, default=0.50)
    verified_by = Column(String(150), nullable=True)
    verification_method = Column(String(100), nullable=True)
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
    purpose = Column(String(100), nullable=False)  # github_sync, leetcode_sync, recruiter_sharing
    granted = Column(Boolean, default=True)
    granted_at = Column(DateTime, default=datetime.utcnow)
    revoked_at = Column(DateTime, nullable=True)
    
    student = relationship("Student", back_populates="consents")

class Company(Base):
    __tablename__ = "companies"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(150), nullable=False)
    industry = Column(String(100), nullable=False)
    website = Column(String(200))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    roles = relationship("JobRole", back_populates="company", cascade="all, delete-orphan")

class JobRole(Base):
    __tablename__ = "job_roles"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    min_cgpa = Column(Float, default=6.0)
    max_backlogs = Column(Integer, default=0)
    required_skills = Column(JSON, default=list)  # ["Python", "SQL", "Git", "Docker"]
    created_at = Column(DateTime, default=datetime.utcnow)
    
    company = relationship("Company", back_populates="roles")

class PlacementDrive(Base):
    __tablename__ = "placement_drives"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    college_id = Column(String(36), ForeignKey("colleges.id", ondelete="CASCADE"), nullable=False)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    job_role_id = Column(String(36), ForeignKey("job_roles.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    day_of_week = Column(String(20), nullable=False)  # Mon, Tue, Wed, Thu, Fri
    activity = Column(String(100), nullable=False)   # Visit, Test, Interviews, Offers
    status = Column(String(50), default="scheduled")
    has_clash = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    college = relationship("College", back_populates="drives")

class EligibilityRule(Base):
    __tablename__ = "eligibility_rules"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    college_id = Column(String(36), nullable=False)
    drive_id = Column(String(36), nullable=True)
    job_role_id = Column(String(36), nullable=True)
    version = Column(Integer, nullable=False, default=1)
    min_cgpa = Column(Float, nullable=False, default=7.0)
    max_backlogs = Column(Integer, nullable=False, default=0)
    required_skills = Column(JSON, default=list)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class EligibilityDecision(Base):
    __tablename__ = "eligibility_decisions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    college_id = Column(String(36), nullable=False)
    student_id = Column(String(36), nullable=False)
    rule_id = Column(String(36), nullable=False)
    rule_version = Column(Integer, nullable=False)
    eligible = Column(Boolean, nullable=False)
    student_inputs = Column(JSON, nullable=False)
    failed_conditions = Column(JSON, default=list)
    decision_timestamp = Column(DateTime, default=datetime.utcnow)
    appealed = Column(Boolean, default=False)

class EligibilityAppeal(Base):
    __tablename__ = "eligibility_appeals"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    decision_id = Column(String(36), nullable=False)
    student_id = Column(String(36), nullable=False)
    college_id = Column(String(36), nullable=False)
    reason = Column(Text, nullable=False)
    status = Column(String(30), default="pending")  # pending, approved, rejected
    reviewer_notes = Column(Text, nullable=True)
    decided_by = Column(String(150), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class QuestionBank(Base):
    __tablename__ = "question_bank"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    category = Column(String(50), nullable=False)  # SQL, Python, Git, DSA, Aptitude
    question = Column(Text, nullable=False)
    options = Column(JSON, nullable=False)
    correct_option_index = Column(Integer, nullable=False)
    difficulty_level = Column(Integer, nullable=False, default=1)  # 1, 2, 3
    explanation = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class AssessmentAttempt(Base):
    __tablename__ = "assessment_attempts"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    college_id = Column(String(36), nullable=False)
    student_id = Column(String(36), nullable=False)
    category = Column(String(50), nullable=False)
    score = Column(Integer, default=0)
    total_questions = Column(Integer, default=5)
    passed = Column(Boolean, default=False)
    history = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

class LearningPath(Base):
    __tablename__ = "learning_paths"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), nullable=False)
    college_id = Column(String(36), nullable=False)
    target_role = Column(String(100), nullable=False)
    missing_skills = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    tasks = relationship("LearningTask", back_populates="learning_path", cascade="all, delete-orphan")

class LearningTask(Base):
    __tablename__ = "learning_tasks"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    learning_path_id = Column(String(36), ForeignKey("learning_paths.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    skill = Column(String(50), nullable=False)
    task_order = Column(Integer, default=1)
    completed = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)
    
    learning_path = relationship("LearningPath", back_populates="tasks")

class Application(Base):
    __tablename__ = "applications"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    college_id = Column(String(36), nullable=False)
    drive_id = Column(String(36), nullable=False)
    student_id = Column(String(36), nullable=False)
    student_name = Column(String(150), nullable=False)
    branch = Column(String(50), default="CSE")
    verified_skills = Column(String(255), default="")
    stage = Column(String(50), default="Shortlisted")  # Shortlisted, Interview, Offer, Accepted
    stage_index = Column(Integer, default=0)
    officer_approved_offer = Column(Boolean, default=False)
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
