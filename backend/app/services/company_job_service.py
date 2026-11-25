from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from backend.app.models.models import (
    Company,
    JobRole,
    CompanyCollegeAccess,
)
from backend.app.services.audit_service import AuditService

KNOWN_SKILLS_TAXONOMY = [
    "Python", "SQL", "Java", "JavaScript", "TypeScript", "React", "FastAPI",
    "Docker", "Kubernetes", "Git", "DSA", "REST APIs", "Database Design",
    "Authentication", "Testing", "Operating Systems", "Computer Networks",
    "Web Development", "Aptitude", "C++", "Golang", "Rust"
]


class CompanyJobService:
    @staticmethod
    def create_company(
        db: Session,
        name: str,
        industry: str,
        description: Optional[str] = None,
        website: Optional[str] = None,
        recruiter_contact: Optional[str] = None,
        college_id: str = "COLLEGE-A",
        actor: str = "T&P Officer",
    ) -> Company:
        company = Company(
            name=name,
            industry=industry,
            description=description,
            website=website,
            recruiter_contact=recruiter_contact,
            verification_status="verified",
        )
        db.add(company)
        db.flush()

        db.add(
            CompanyCollegeAccess(
                company_id=company.id,
                college_id=college_id,
                authorized=True,
            )
        )
        db.commit()
        db.refresh(company)

        AuditService.log_event(
            db=db,
            college_id=college_id,
            actor=actor,
            action=f"Registered company '{name}' ({industry})",
        )
        return company

    @staticmethod
    def update_company(
        db: Session,
        company_id: str,
        updates: Dict[str, Any],
        college_id: str = "COLLEGE-A",
        actor: str = "T&P Officer",
    ) -> Company:
        company = db.query(Company).filter(Company.id == company_id).first()
        if not company:
            raise ValueError("Company not found")
        for field in ["name", "industry", "description", "website", "recruiter_contact", "verification_status"]:
            if field in updates and updates[field] is not None:
                setattr(company, field, updates[field])
        company.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(company)

        AuditService.log_event(
            db=db,
            college_id=college_id,
            actor=actor,
            action=f"Updated company profile '{company.name}'",
        )
        return company

    @staticmethod
    def authorize_college_access(
        db: Session,
        company_id: str,
        college_id: str,
        recruiter_user_id: Optional[str] = None,
    ) -> CompanyCollegeAccess:
        existing = (
            db.query(CompanyCollegeAccess)
            .filter(
                CompanyCollegeAccess.company_id == company_id,
                CompanyCollegeAccess.college_id == college_id,
            )
            .first()
        )
        if existing:
            existing.authorized = True
            if recruiter_user_id:
                existing.recruiter_user_id = recruiter_user_id
            db.commit()
            return existing

        acc = CompanyCollegeAccess(
            company_id=company_id,
            college_id=college_id,
            recruiter_user_id=recruiter_user_id,
            authorized=True,
        )
        db.add(acc)
        db.commit()
        db.refresh(acc)
        return acc

    @staticmethod
    def extract_skills_from_jd(description: str) -> List[str]:
        """
        Extracts candidate skills from a job description.
        Extracted requirements are flagged for human review before becoming active.
        """
        if not description:
            return []
        lower_desc = description.lower()
        found = []
        for sk in KNOWN_SKILLS_TAXONOMY:
            if sk.lower() in lower_desc:
                found.append(sk)
        return found

    @staticmethod
    def create_job_opportunity(
        db: Session,
        company_id: str,
        title: str,
        description: Optional[str] = None,
        category: str = "Engineering",
        location: str = "Bengaluru / Hybrid",
        employment_type: str = "Full-Time",
        salary_range: Optional[str] = None,
        min_cgpa: float = 6.5,
        max_backlogs: int = 0,
        required_skills: Optional[List[str]] = None,
        preferred_skills: Optional[List[str]] = None,
        skill_requirements: Optional[List[Dict[str, Any]]] = None,
        min_assessment_score: float = 60.0,
        eligible_departments: Optional[List[str]] = None,
        eligible_branches: Optional[List[str]] = None,
        eligible_grad_years: Optional[List[int]] = None,
        application_deadline: Optional[datetime] = None,
        selection_stages: Optional[List[str]] = None,
        college_id: str = "COLLEGE-A",
        actor: str = "Recruiter",
    ) -> JobRole:
        company = db.query(Company).filter(Company.id == company_id).first()
        if not company:
            raise ValueError("Company not found")

        extracted = CompanyJobService.extract_skills_from_jd(description or "") if not required_skills else []
        status = "pending_review" if extracted and not required_skills else "published"

        job = JobRole(
            company_id=company_id,
            title=title,
            description=description,
            category=category,
            location=location,
            employment_type=employment_type,
            salary_range=salary_range,
            min_cgpa=min_cgpa,
            max_backlogs=max_backlogs,
            required_skills=required_skills or [],
            preferred_skills=preferred_skills or [],
            skill_requirements=skill_requirements or [],
            min_assessment_score=min_assessment_score,
            eligible_departments=eligible_departments or [],
            eligible_branches=eligible_branches or [],
            eligible_grad_years=eligible_grad_years or [],
            application_deadline=application_deadline,
            selection_stages=selection_stages or [
                "Application Received",
                "Eligibility Confirmed",
                "Resume Review",
                "Aptitude Test",
                "Technical Interview",
                "HR Interview",
                "Final Decision",
            ],
            status=status,
            ai_extracted_skills=extracted,
            extracted_approved=(len(extracted) == 0),
        )
        db.add(job)
        db.commit()
        db.refresh(job)

        AuditService.log_event(
            db=db,
            college_id=college_id,
            actor=actor,
            action=f"Created job opportunity '{title}' for {company.name} (status: {status})",
        )
        return job

    @staticmethod
    def approve_extracted_requirements(
        db: Session,
        job_role_id: str,
        approved_skills: List[str],
        preferred_skills: Optional[List[str]] = None,
        college_id: str = "COLLEGE-A",
        actor: str = "T&P Officer",
    ) -> JobRole:
        job = db.query(JobRole).filter(JobRole.id == job_role_id).first()
        if not job:
            raise ValueError("Job opportunity not found")

        job.required_skills = approved_skills
        if preferred_skills is not None:
            job.preferred_skills = preferred_skills
        job.extracted_approved = True
        job.status = "published"
        job.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(job)

        AuditService.log_event(
            db=db,
            college_id=college_id,
            actor=actor,
            action=f"Approved extracted requirements for '{job.title}': {', '.join(approved_skills)}",
        )
        return job
