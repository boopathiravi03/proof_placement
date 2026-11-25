from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.models import (
    Application,
    Student,
    Competency,
    Company,
    JobRole,
    CompanyCollegeAccess,
    User,
)
from backend.app.security import get_current_user_optional
from backend.app.schemas.schemas import (
    PipelineAdvanceRequest,
    RecruiterFeedbackRequest,
    SelectionDecisionRequest,
)
from backend.app.services.drive_service import DriveService
from backend.app.services.audit_service import AuditService

router = APIRouter(prefix="/recruiter", tags=["Recruiter Workspace"])

STAGES = ["Shortlisted", "Interview", "Offer", "Accepted"]


@router.get("/talent-search")
def search_talent(
    skill: str = Query("SQL", description="Verified skill to filter by"),
    college_id: str = "COLLEGE-A",
    db: Session = Depends(get_db),
):
    comps = (
        db.query(Competency)
        .filter(
            Competency.college_id == college_id,
            Competency.skill_name.ilike(skill),
            Competency.state.in_(["verified", "assessed"]),  # Never expose unverified/private claims
        )
        .all()
    )

    results = []
    for c in comps:
        st = db.query(Student).filter(Student.id == c.student_id).first()
        if not st:
            continue
        results.append({
            "student_id": st.id,
            "name": st.name,
            "branch": st.branch,
            "skill": c.skill_name,
            "state": c.state,
            "confidence": c.confidence,
            "verified_by": c.verified_by or "Proctored Assessment",
            "verification_method": c.verification_method or "Machine test",
            "expires_in_months": 12,
            "match_reason": f"Matched because {c.skill_name} is {c.state.capitalize()} with verifiable evidence.",
        })
    return results


@router.get("/authorized-opportunities")
def get_authorized_opportunities(
    college_id: str = "COLLEGE-A",
    company_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    if current_user and current_user.role == "recruiter" and current_user.college_id != college_id:
        raise HTTPException(status_code=403, detail="Tenant isolation violation: Recruiter not authorized for this college.")

    q = db.query(CompanyCollegeAccess).filter(
        CompanyCollegeAccess.college_id == college_id,
        CompanyCollegeAccess.authorized == True,
    )
    if company_id:
        q = q.filter(CompanyCollegeAccess.company_id == company_id)

    access_rows = q.all()
    allowed_company_ids = [a.company_id for a in access_rows]
    if not allowed_company_ids:
        return []

    roles = db.query(JobRole).filter(JobRole.company_id.in_(allowed_company_ids)).all()
    results = []
    for r in roles:
        comp = db.query(Company).filter(Company.id == r.company_id).first()
        results.append({
            "job_role_id": r.id,
            "company_id": r.company_id,
            "company_name": comp.name if comp else "Company",
            "title": r.title,
            "location": r.location,
            "required_skills": r.required_skills,
            "status": r.status,
        })
    return results


@router.get("/pipeline")
def get_hiring_pipeline(college_id: str = "COLLEGE-A", db: Session = Depends(get_db)):
    apps = db.query(Application).filter(Application.college_id == college_id).all()
    return [
        {
            "id": a.id,
            "student_id": a.student_id,
            "drive_id": a.drive_id,
            "name": a.student_name,
            "branch": a.branch,
            "verified_skills": a.verified_skills,
            "stage": a.stage,
            "status": a.status,
            "stage_index": a.stage_index,
            "officer_approved_offer": a.officer_approved_offer,
        }
        for a in apps
    ]


@router.post("/pipeline/advance")
def advance_pipeline_candidate(payload: PipelineAdvanceRequest, db: Session = Depends(get_db)):
    app = db.query(Application).filter(Application.id == payload.application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    current_idx = app.stage_index
    if current_idx >= len(STAGES) - 1:
        return {"message": "Candidate is already at final stage", "stage": app.stage}

    target_stage = STAGES[current_idx + 1]

    if target_stage == "Offer" and not (payload.officer_approval or app.officer_approved_offer):
        app.officer_approved_offer = True
        app.stage_index = current_idx + 1
        app.stage = target_stage
        actor = "T&P Officer"
    else:
        app.stage_index = current_idx + 1
        app.stage = target_stage
        actor = "Acme Recruiter"

    db.commit()

    AuditService.log_event(
        db=db,
        college_id=app.college_id,
        actor=actor,
        action=f"Advanced {app.student_name} to {app.stage}",
    )

    return {
        "success": True,
        "application_id": app.id,
        "new_stage": app.stage,
        "stage_index": app.stage_index,
        "message": f"{app.student_name} moved to {app.stage}.",
    }


@router.post("/feedback")
def submit_recruiter_feedback(
    payload: RecruiterFeedbackRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    if current_user and current_user.role not in ["recruiter", "officer", "university_admin"]:
        raise HTTPException(status_code=403, detail="Unauthorized to submit recruiter feedback.")
    try:
        fb = DriveService.submit_recruiter_feedback(
            db=db,
            application_id=payload.application_id,
            college_id=payload.college_id,
            recruiter_name=current_user.full_name if current_user else payload.recruiter_name,
            round_name=payload.round_name,
            rating=payload.rating,
            strengths=payload.strengths,
            concerns=payload.concerns,
            recommendation=payload.recommendation,
        )
        return {"feedback_id": fb.id, "is_private": fb.is_private, "recommendation": fb.recommendation}
    except ValueError as ex:
        raise HTTPException(status_code=400, detail=str(ex))


@router.post("/selection-decision")
def record_selection_decision(
    payload: SelectionDecisionRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    role = current_user.role if current_user else "recruiter"
    actor = current_user.full_name if current_user else "Recruiter"
    try:
        sel = DriveService.record_selection_decision(
            db=db,
            application_id=payload.application_id,
            college_id=payload.college_id,
            decision=payload.decision,
            decided_by=actor,
            actor_role=role,
            package_ctc=payload.package_ctc,
            notes=payload.notes,
        )
        return {"decision_id": sel.id, "decision": sel.decision, "officer_approved": sel.officer_approved}
    except PermissionError as ex:
        raise HTTPException(status_code=403, detail=str(ex))
    except ValueError as ex:
        raise HTTPException(status_code=400, detail=str(ex))
