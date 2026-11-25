from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.models import EligibilityDecision, EligibilityAppeal, EligibilityRule, Student, User
from backend.app.security import get_current_user_optional
from backend.app.schemas.schemas import (
    EligibilityCheckRequest,
    AppealRequest,
    EligibilityRuleCreateRequest,
    EligibilityOverrideRequest,
    AppealReviewRequest,
)
from backend.app.services.eligibility_service import EligibilityService
from backend.app.services.matching_service import MatchingService

router = APIRouter(prefix="/eligibility", tags=["Eligibility & Matching Engine"])


@router.post("/check")
def check_eligibility(
    payload: EligibilityCheckRequest,
    student_id: Optional[str] = None,
    college_id: Optional[str] = "COLLEGE-A",
    db: Session = Depends(get_db),
):
    try:
        s_id = student_id or "demo-student-id"
        c_id = college_id or "COLLEGE-A"
        return EligibilityService.evaluate_eligibility(
            db=db,
            rules=payload.rules,
            student_data=payload.student,
            student_id=s_id,
            college_id=c_id,
        )
    except Exception as ex:
        raise HTTPException(status_code=400, detail=str(ex))


@router.post("/rules")
def create_eligibility_rule(
    payload: EligibilityRuleCreateRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    if current_user and current_user.role not in ["officer", "university_admin"]:
        raise HTTPException(status_code=403, detail="Only placement officers or admins can modify eligibility rules.")
    if current_user and current_user.role == "officer" and current_user.college_id != payload.college_id:
        raise HTTPException(status_code=403, detail="Tenant isolation violation.")
    try:
        rule = EligibilityService.create_versioned_rule(
            db=db,
            college_id=payload.college_id,
            rule_name=payload.rule_name,
            min_cgpa=payload.min_cgpa,
            max_backlogs=payload.max_backlogs,
            required_skills=payload.required_skills,
            eligible_departments=payload.eligible_departments,
            eligible_grad_years=payload.eligible_grad_years,
            min_assessment_score=payload.min_assessment_score,
            standing_arrears_allowed=payload.standing_arrears_allowed,
            job_role_id=payload.job_role_id,
            drive_id=payload.drive_id,
            created_by=current_user.full_name if current_user else "T&P Officer",
            description=payload.description,
        )
        return {"id": rule.id, "rule_name": rule.rule_name, "version": rule.version, "active": rule.active}
    except ValueError as ex:
        raise HTTPException(status_code=400, detail=str(ex))


@router.get("/rules")
def list_eligibility_rules(college_id: str = "COLLEGE-A", db: Session = Depends(get_db)):
    rules = (
        db.query(EligibilityRule)
        .filter(EligibilityRule.college_id == college_id)
        .order_by(EligibilityRule.created_at.desc())
        .all()
    )
    return [
        {
            "id": r.id,
            "rule_name": r.rule_name,
            "version": r.version,
            "min_cgpa": r.min_cgpa,
            "max_backlogs": r.max_backlogs,
            "required_skills": r.required_skills,
            "active": r.active,
            "created_by": r.created_by,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in rules
    ]


@router.post("/evaluate-student")
def evaluate_student_for_job(
    student_id: str = Query(...),
    job_role_id: str = Query(...),
    drive_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    try:
        return EligibilityService.evaluate_student_for_job(db, student_id, job_role_id, drive_id=drive_id)
    except ValueError as ex:
        raise HTTPException(status_code=400, detail=str(ex))


@router.get("/evaluate-cohort/{drive_id}")
def evaluate_cohort_for_drive(
    drive_id: str,
    college_id: str = "COLLEGE-A",
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    if current_user and current_user.role == "officer" and current_user.college_id != college_id:
        raise HTTPException(status_code=403, detail="Tenant isolation violation.")
    try:
        return EligibilityService.evaluate_cohort_for_drive(db, college_id, drive_id)
    except ValueError as ex:
        raise HTTPException(status_code=404, detail=str(ex))


@router.post("/override")
def override_eligibility_decision(
    payload: EligibilityOverrideRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    if current_user and current_user.role not in ["officer", "university_admin"]:
        raise HTTPException(status_code=403, detail="Unauthorized: Only officers can override eligibility decisions.")
    try:
        dec = EligibilityService.officer_override_decision(
            db=db,
            decision_id=payload.decision_id,
            college_id=payload.college_id,
            officer_name=current_user.full_name if current_user else payload.officer_name,
            new_eligible=payload.new_eligible,
            reason=payload.reason,
        )
        return {"decision_id": dec.id, "eligible": dec.eligible, "status": dec.status, "override_by": dec.override_by}
    except ValueError as ex:
        raise HTTPException(status_code=400, detail=str(ex))


@router.post("/appeal")
def submit_appeal(payload: AppealRequest, db: Session = Depends(get_db)):
    try:
        appeal = EligibilityService.submit_appeal(
            db=db,
            decision_id=payload.decision_id,
            student_id=payload.student_id,
            reason=payload.reason,
        )
        return {
            "success": True,
            "appeal_id": appeal.id,
            "status": appeal.status,
            "message": "Appeal successfully logged and forwarded to Placement Officer for human review.",
        }
    except Exception as ex:
        raise HTTPException(status_code=400, detail=str(ex))


@router.get("/appeals")
def list_appeals(college_id: str = "COLLEGE-A", db: Session = Depends(get_db)):
    appeals = (
        db.query(EligibilityAppeal)
        .filter(EligibilityAppeal.college_id == college_id)
        .order_by(EligibilityAppeal.created_at.desc())
        .all()
    )
    return [
        {
            "id": a.id,
            "decision_id": a.decision_id,
            "student_id": a.student_id,
            "appeal_type": a.appeal_type,
            "reason": a.reason,
            "status": a.status,
            "reviewer_notes": a.reviewer_notes,
            "decided_by": a.decided_by,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        }
        for a in appeals
    ]


@router.post("/appeals/{appeal_id}/review")
def review_appeal(
    appeal_id: str,
    payload: AppealReviewRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    if current_user and current_user.role not in ["officer", "university_admin"]:
        raise HTTPException(status_code=403, detail="Only officers can review eligibility appeals.")
    try:
        return EligibilityService.review_appeal(
            db=db,
            appeal_id=appeal_id,
            college_id=payload.college_id,
            officer_name=current_user.full_name if current_user else payload.officer_name,
            action=payload.action,
            reviewer_notes=payload.reviewer_notes,
            corrected_data=payload.corrected_data,
        )
    except ValueError as ex:
        raise HTTPException(status_code=400, detail=str(ex))


# --- Matching Endpoints ---
@router.get("/match/student/{student_id}")
def get_matching_opportunities_for_student(student_id: str, db: Session = Depends(get_db)):
    try:
        return MatchingService.get_matching_opportunities_for_student(db, student_id)
    except ValueError as ex:
        raise HTTPException(status_code=404, detail=str(ex))


@router.get("/match/job/{job_role_id}")
def get_matching_students_for_job(
    job_role_id: str,
    college_id: str = "COLLEGE-A",
    drive_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    try:
        return MatchingService.get_matching_students_for_job(db, college_id, job_role_id, drive_id=drive_id)
    except ValueError as ex:
        raise HTTPException(status_code=404, detail=str(ex))
