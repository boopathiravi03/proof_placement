from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.models import Company, JobRole, PlacementDrive, User, Application
from backend.app.security import get_current_user_optional
from backend.app.schemas.schemas import (
    CompanyCreateRequest,
    JobOpportunityCreateRequest,
    ApproveExtractedSkillsRequest,
    DriveCreateRequest,
    DriveApplyRequest,
    StageTransitionRequest,
    InterviewScheduleRequest,
)
from backend.app.services.company_job_service import CompanyJobService
from backend.app.services.drive_service import DriveService
from backend.app.services.audit_service import AuditService

router = APIRouter(prefix="/companies", tags=["Companies & Drives Calendar"])


@router.get("/")
def list_companies(db: Session = Depends(get_db)):
    companies = db.query(Company).all()
    results = []
    for c in companies:
        roles = db.query(JobRole).filter(JobRole.company_id == c.id).all()
        results.append({
            "id": c.id,
            "name": c.name,
            "industry": c.industry,
            "description": c.description,
            "website": c.website,
            "recruiter_contact": c.recruiter_contact,
            "verification_status": c.verification_status,
            "roles": [
                {
                    "id": r.id,
                    "title": r.title,
                    "category": r.category,
                    "location": r.location,
                    "employment_type": r.employment_type,
                    "salary_range": r.salary_range,
                    "min_cgpa": r.min_cgpa,
                    "max_backlogs": r.max_backlogs,
                    "required_skills": r.required_skills,
                    "preferred_skills": r.preferred_skills,
                    "status": r.status,
                    "ai_extracted_skills": r.ai_extracted_skills,
                    "extracted_approved": r.extracted_approved,
                }
                for r in roles
            ],
        })
    return results


@router.post("/")
def create_company(
    payload: CompanyCreateRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    if current_user and current_user.role not in ["officer", "university_admin", "recruiter"]:
        raise HTTPException(status_code=403, detail="Unauthorized to create company records.")
    c = CompanyJobService.create_company(
        db=db,
        name=payload.name,
        industry=payload.industry,
        description=payload.description,
        website=payload.website,
        recruiter_contact=payload.recruiter_contact,
        college_id=payload.college_id,
        actor=current_user.full_name if current_user else "T&P Officer",
    )
    return {"id": c.id, "name": c.name, "industry": c.industry, "verification_status": c.verification_status}


@router.post("/jobs")
def create_job_opportunity(
    payload: JobOpportunityCreateRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    if current_user and current_user.role not in ["officer", "university_admin", "recruiter"]:
        raise HTTPException(status_code=403, detail="Unauthorized to create job opportunities.")
    try:
        job = CompanyJobService.create_job_opportunity(
            db=db,
            company_id=payload.company_id,
            title=payload.title,
            description=payload.description,
            category=payload.category,
            location=payload.location,
            employment_type=payload.employment_type,
            salary_range=payload.salary_range,
            min_cgpa=payload.min_cgpa,
            max_backlogs=payload.max_backlogs,
            required_skills=payload.required_skills,
            preferred_skills=payload.preferred_skills,
            min_assessment_score=payload.min_assessment_score,
            eligible_departments=payload.eligible_departments,
            eligible_grad_years=payload.eligible_grad_years,
            college_id=payload.college_id,
            actor=current_user.full_name if current_user else "T&P Officer",
        )
        return {
            "id": job.id,
            "title": job.title,
            "status": job.status,
            "required_skills": job.required_skills,
            "ai_extracted_skills": job.ai_extracted_skills,
            "extracted_approved": job.extracted_approved,
        }
    except ValueError as ex:
        raise HTTPException(status_code=400, detail=str(ex))


@router.post("/jobs/{job_role_id}/approve-skills")
def approve_extracted_skills(
    job_role_id: str,
    payload: ApproveExtractedSkillsRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    if current_user and current_user.role not in ["officer", "university_admin", "recruiter"]:
        raise HTTPException(status_code=403, detail="Unauthorized to approve job requirements.")
    try:
        job = CompanyJobService.approve_extracted_requirements(
            db=db,
            job_role_id=job_role_id,
            approved_skills=payload.approved_skills,
            preferred_skills=payload.preferred_skills,
            college_id=payload.college_id,
            actor=current_user.full_name if current_user else "T&P Officer",
        )
        return {"id": job.id, "status": job.status, "required_skills": job.required_skills, "extracted_approved": job.extracted_approved}
    except ValueError as ex:
        raise HTTPException(status_code=404, detail=str(ex))


@router.get("/drives")
def get_drive_calendar(college_id: str = "COLLEGE-A", db: Session = Depends(get_db)):
    drives = (
        db.query(PlacementDrive)
        .filter(PlacementDrive.college_id == college_id)
        .order_by(PlacementDrive.day_of_week)
        .all()
    )
    day_counts = {}
    for d in drives:
        day_counts[d.day_of_week] = day_counts.get(d.day_of_week, 0) + 1

    results = []
    has_any_clash = False
    for d in drives:
        clash = day_counts[d.day_of_week] > 1 or bool(d.has_clash)
        if clash:
            has_any_clash = True
        company = db.query(Company).filter(Company.id == d.company_id).first()
        job = db.query(JobRole).filter(JobRole.id == d.job_role_id).first()
        app_count = db.query(Application).filter(Application.drive_id == d.id, Application.status != "withdrawn").count()
        results.append({
            "id": d.id,
            "title": d.title,
            "company_name": company.name if company else "Partner",
            "job_role_id": d.job_role_id,
            "role_title": job.title if job else d.title,
            "day_of_week": d.day_of_week,
            "activity": d.activity,
            "drive_date": d.drive_date,
            "time_slot": d.time_slot,
            "room": d.room,
            "published": d.published,
            "has_clash": clash,
            "status": d.status,
            "applications_count": app_count,
            "selection_stages": d.selection_stages or [],
        })

    return {
        "calendar": results,
        "clash_detected": has_any_clash,
        "recommendation": "Move Beta Soft visit from Wednesday to Thursday to resolve slot clash." if has_any_clash else "Schedule optimized.",
    }


@router.post("/drives")
def create_campus_drive(
    payload: DriveCreateRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    role = current_user.role if current_user else "officer"
    actor = current_user.full_name if current_user else "T&P Officer"
    if current_user and current_user.role == "officer" and current_user.college_id != payload.college_id:
        raise HTTPException(status_code=403, detail="Tenant isolation violation.")
    try:
        drive = DriveService.create_drive(
            db=db,
            college_id=payload.college_id,
            company_id=payload.company_id,
            job_role_id=payload.job_role_id,
            title=payload.title,
            day_of_week=payload.day_of_week,
            activity=payload.activity,
            description=payload.description,
            drive_date=payload.drive_date,
            time_slot=payload.time_slot,
            room=payload.room,
            application_deadline=payload.application_deadline,
            selection_stages=payload.selection_stages,
            publish_immediately=payload.publish_immediately,
            actor=actor,
            actor_role=role,
        )
        return {"id": drive.id, "title": drive.title, "published": drive.published, "status": drive.status, "has_clash": drive.has_clash}
    except PermissionError as ex:
        raise HTTPException(status_code=403, detail=str(ex))
    except ValueError as ex:
        raise HTTPException(status_code=400, detail=str(ex))


@router.post("/drives/{drive_id}/publish")
def publish_campus_drive(
    drive_id: str,
    college_id: str = Query("COLLEGE-A"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    role = current_user.role if current_user else "officer"
    actor = current_user.full_name if current_user else "T&P Officer"
    try:
        drive = DriveService.publish_drive(db, drive_id, college_id, actor=actor, actor_role=role)
        return {"id": drive.id, "published": drive.published, "status": drive.status}
    except PermissionError as ex:
        raise HTTPException(status_code=403, detail=str(ex))
    except ValueError as ex:
        raise HTTPException(status_code=404, detail=str(ex))


@router.post("/drives/apply")
def apply_to_campus_drive(payload: DriveApplyRequest, db: Session = Depends(get_db)):
    try:
        app = DriveService.apply_to_drive(db, payload.drive_id, payload.student_id)
        return {"application_id": app.id, "status": app.status, "stage": app.stage}
    except ValueError as ex:
        raise HTTPException(status_code=400, detail=str(ex))


@router.post("/applications/{application_id}/withdraw")
def withdraw_drive_application(application_id: str, student_id: str = Query(...), db: Session = Depends(get_db)):
    try:
        app = DriveService.withdraw_application(db, application_id, student_id)
        return {"application_id": app.id, "status": app.status}
    except PermissionError as ex:
        raise HTTPException(status_code=403, detail=str(ex))
    except ValueError as ex:
        raise HTTPException(status_code=400, detail=str(ex))


@router.post("/applications/{application_id}/stage")
def update_application_stage(
    application_id: str,
    payload: StageTransitionRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    role = current_user.role if current_user else payload.actor_role
    actor = current_user.full_name if current_user else payload.actor
    try:
        app = DriveService.advance_selection_stage(
            db=db,
            application_id=application_id,
            new_status=payload.new_status,
            actor=actor,
            actor_role=role,
            college_id=payload.college_id,
            reason=payload.reason,
        )
        return {"application_id": app.id, "status": app.status, "stage": app.stage}
    except PermissionError as ex:
        raise HTTPException(status_code=403, detail=str(ex))
    except ValueError as ex:
        raise HTTPException(status_code=400, detail=str(ex))


@router.post("/interviews/schedule")
def schedule_interview(payload: InterviewScheduleRequest, db: Session = Depends(get_db)):
    try:
        sched = DriveService.schedule_interview(
            db=db,
            drive_id=payload.drive_id,
            application_id=payload.application_id,
            college_id=payload.college_id,
            round_name=payload.round_name,
            interviewer=payload.interviewer,
            scheduled_date=payload.scheduled_date,
            time_slot=payload.time_slot,
            room=payload.room,
        )
        return {"schedule_id": sched.id, "status": sched.status, "scheduled_date": sched.scheduled_date, "time_slot": sched.time_slot, "room": sched.room}
    except ValueError as ex:
        raise HTTPException(status_code=400, detail=str(ex))


@router.post("/drives/resolve-clash")
def resolve_clash(drive_title: str = "Beta Soft", new_day: str = "Thu", college_id: str = "COLLEGE-A", db: Session = Depends(get_db)):
    drive = (
        db.query(PlacementDrive)
        .filter(PlacementDrive.college_id == college_id, PlacementDrive.title.ilike(f"%{drive_title}%"))
        .first()
    )
    if not drive:
        raise HTTPException(status_code=404, detail="Drive not found")

    old_day = drive.day_of_week
    drive.day_of_week = new_day
    drive.has_clash = False
    db.commit()

    AuditService.log_event(
        db=db,
        college_id=college_id,
        actor="T&P Officer",
        action=f"Confirmed auto-allocated conflict-free slot for {drive_title}: {old_day} -> {new_day}",
    )

    return {
        "success": True,
        "drive_id": drive.id,
        "new_day": new_day,
        "message": f"Clash resolved. {drive_title} rescheduled to {new_day}.",
    }
