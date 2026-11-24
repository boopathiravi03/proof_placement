from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.services.readiness_service import ReadinessService

router = APIRouter(prefix="/readiness", tags=["Placement Readiness Index"])

@router.get("/student/{student_id}")
def get_student_readiness(
    student_id: str,
    role: str = Query("Backend Developer", description="Target job role"),
    db: Session = Depends(get_db)
):
    try:
        return ReadinessService.calculate_readiness(db, student_id, target_role=role)
    except Exception as ex:
        raise HTTPException(status_code=400, detail=str(ex))

@router.get("/student/{student_id}/compare")
def compare_target_roles(
    student_id: str,
    db: Session = Depends(get_db)
):
    try:
        return ReadinessService.compare_roles(db, student_id)
    except Exception as ex:
        raise HTTPException(status_code=400, detail=str(ex))
