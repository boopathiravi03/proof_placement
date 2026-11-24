from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.models import Student, Competency, Evidence
from backend.app.schemas.schemas import EvidenceCreate, MentorSignOffRequest, CompetencyResponse, StudentProfileResponse
from backend.app.services.competency_service import CompetencyService
from backend.app.services.github_service import GitHubService

router = APIRouter(prefix="/competencies", tags=["Competencies & Evidence"])

@router.get("/student/{student_id}")
def get_student_competency_profile(student_id: str, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    comps = db.query(Competency).filter(Competency.student_id == student_id).all()
    results = []
    for c in comps:
        ev_count = db.query(Evidence).filter(Evidence.competency_id == c.id).count()
        results.append({
            "id": c.id,
            "skill_name": c.skill_name,
            "state": c.state,
            "confidence": c.confidence,
            "verified_by": c.verified_by,
            "verification_method": c.verification_method,
            "expires_at": c.expires_at.isoformat() if c.expires_at else None,
            "evidence_count": ev_count
        })

    return {
        "student": {
            "id": student.id,
            "name": student.name,
            "branch": student.branch,
            "cgpa": student.cgpa,
            "backlogs": student.backlogs,
            "college_id": student.college_id,
            "github_connected": student.github_connected,
            "github_username": student.github_username
        },
        "competencies": results
    }

@router.get("/student/{student_id}/evidence")
def get_student_evidence_trail(student_id: str, db: Session = Depends(get_db)):
    items = (
        db.query(Evidence)
        .filter(Evidence.student_id == student_id)
        .order_by(Evidence.created_at.desc())
        .all()
    )
    return [
        {
            "id": e.id,
            "competency_id": e.competency_id,
            "kind": e.kind,
            "title": e.title,
            "ref_url": e.ref_url,
            "confidence": e.confidence,
            "metadata": e.extra_metadata,
            "created_at": e.created_at.isoformat() if e.created_at else None
        }
        for e in items
    ]

@router.post("/evidence")
def add_evidence(payload: EvidenceCreate, db: Session = Depends(get_db)):
    try:
        competency = CompetencyService.add_evidence(
            db=db,
            student_id=payload.student_id,
            skill_name=payload.skill_name,
            kind=payload.kind,
            title=payload.title,
            ref_url=payload.ref_url,
            confidence=payload.confidence or 0.70,
            extra_metadata=payload.metadata
        )
        return {
            "success": True,
            "competency_id": competency.id,
            "skill_name": competency.skill_name,
            "state": competency.state,
            "confidence": competency.confidence,
            "message": f"Evidence recorded. {competency.skill_name} is now '{competency.state}'."
        }
    except Exception as ex:
        raise HTTPException(status_code=400, detail=str(ex))

@router.post("/mentor-signoff")
def mentor_signoff(payload: MentorSignOffRequest, db: Session = Depends(get_db)):
    try:
        competency = CompetencyService.sign_off_mentor(
            db=db,
            student_id=payload.student_id,
            skill_name=payload.skill_name,
            mentor_name=payload.mentor_name,
            notes=payload.notes
        )
        return {
            "success": True,
            "skill_name": competency.skill_name,
            "state": competency.state,
            "verified_by": competency.verified_by,
            "expires_at": competency.expires_at.isoformat() if competency.expires_at else None,
            "message": f"Skill {competency.skill_name} successfully verified by {competency.verified_by}."
        }
    except Exception as ex:
        raise HTTPException(status_code=400, detail=str(ex))

@router.post("/github/scan")
async def scan_github(student_id: str, username: str, db: Session = Depends(get_db)):
    try:
        result = await GitHubService.scan_and_link(db, student_id, username)
        return result
    except Exception as ex:
        raise HTTPException(status_code=400, detail=str(ex))

@router.post("/github/revoke")
def revoke_github(student_id: str, db: Session = Depends(get_db)):
    try:
        return GitHubService.revoke_access(db, student_id)
    except Exception as ex:
        raise HTTPException(status_code=400, detail=str(ex))
