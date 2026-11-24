from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.models import EligibilityDecision, EligibilityAppeal, Student
from backend.app.schemas.schemas import EligibilityCheckRequest, AppealRequest
from backend.app.services.eligibility_service import EligibilityService
from backend.app.services.audit_service import AuditService

router = APIRouter(prefix="/eligibility", tags=["Eligibility & Matching Engine"])

@router.post("/check")
def check_eligibility(
    payload: EligibilityCheckRequest,
    student_id: Optional[str] = None,
    college_id: Optional[str] = "COLLEGE-A",
    db: Session = Depends(get_db)
):
    try:
        s_id = student_id or "demo-student-id"
        c_id = college_id or "COLLEGE-A"
        return EligibilityService.evaluate_eligibility(
            db=db,
            rules=payload.rules,
            student_data=payload.student,
            student_id=s_id,
            college_id=c_id
        )
    except Exception as ex:
        raise HTTPException(status_code=400, detail=str(ex))

@router.post("/appeal")
def submit_appeal(payload: AppealRequest, db: Session = Depends(get_db)):
    try:
        appeal = EligibilityService.submit_appeal(
            db=db,
            decision_id=payload.decision_id,
            student_id=payload.student_id,
            reason=payload.reason
        )
        return {
            "success": True,
            "appeal_id": appeal.id,
            "status": appeal.status,
            "message": "Appeal successfully logged and forwarded to Placement Officer for human review."
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
            "reason": a.reason,
            "status": a.status,
            "created_at": a.created_at.isoformat() if a.created_at else None
        }
        for a in appeals
    ]
