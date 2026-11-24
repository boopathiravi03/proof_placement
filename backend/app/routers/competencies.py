from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.models import Student, Competency, Evidence, MentorVerificationRequest
from backend.app.schemas.schemas import (
    EvidenceCreate,
    MentorSignOffRequest,
    CompetencyResponse,
    StudentProfileResponse,
    ClaimSkillRequest,
    MentorVerificationRequestCreate,
    MentorVerificationAdjudicate,
)
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

@router.get("/github/repositories/{student_id}")
def get_github_repositories(student_id: str, db: Session = Depends(get_db)):
    return GitHubService.get_repositories(db, student_id)

@router.post("/claim")
def claim_skill(payload: ClaimSkillRequest, db: Session = Depends(get_db)):
    try:
        competency = CompetencyService.claim_skill(
            db=db,
            student_id=payload.student_id,
            skill_name=payload.skill_name,
            category=payload.category,
            proficiency=payload.proficiency or "Intermediate"
        )
        return {
            "success": True,
            "id": competency.id,
            "skill_name": competency.skill_name,
            "category": competency.category,
            "proficiency": competency.proficiency,
            "state": competency.state,
            "confidence": competency.confidence,
            "message": f"Skill '{competency.skill_name}' successfully added in 'claimed' state."
        }
    except Exception as ex:
        raise HTTPException(status_code=400, detail=str(ex))

@router.delete("/evidence/{evidence_id}")
def delete_evidence(evidence_id: str, student_id: str = Query(...), db: Session = Depends(get_db)):
    try:
        competency = CompetencyService.delete_evidence(db, evidence_id, student_id)
        return {
            "success": True,
            "skill_name": competency.skill_name,
            "state": competency.state,
            "message": f"Evidence removed. {competency.skill_name} state updated to '{competency.state}'."
        }
    except Exception as ex:
        raise HTTPException(status_code=400, detail=str(ex))

@router.get("/student/{student_id}/categories")
def get_student_competency_categories(student_id: str, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    comps = db.query(Competency).filter(Competency.student_id == student_id).all()
    
    CATEGORY_LABELS = {
        "languages": "Programming Languages",
        "frameworks": "Frameworks",
        "databases": "Databases",
        "fundamentals": "Computer Science Fundamentals",
        "tools": "Development Tools",
        "soft_skills": "Soft Skills"
    }

    # Normalize categories
    categorized: dict = {k: [] for k in CATEGORY_LABELS.keys()}

    for c in comps:
        ev_count = db.query(Evidence).filter(Evidence.competency_id == c.id).count()
        cat = c.category or "languages"
        if cat not in categorized:
            cat = "languages"
        
        confidence_label = "High" if c.confidence >= 0.85 else ("Medium" if c.confidence >= 0.60 else "Low")

        categorized[cat].append({
            "id": c.id,
            "skill_name": c.skill_name,
            "category": cat,
            "category_label": CATEGORY_LABELS.get(cat, cat),
            "proficiency": c.proficiency or "Intermediate",
            "state": c.state,
            "confidence": c.confidence,
            "confidence_label": confidence_label,
            "verified_by": c.verified_by,
            "verification_method": c.verification_method,
            "last_assessed_at": c.last_assessed_at.isoformat() if c.last_assessed_at else None,
            "verified_at": c.verified_at.isoformat() if c.verified_at else None,
            "expires_at": c.expires_at.isoformat() if c.expires_at else None,
            "evidence_count": ev_count
        })

    return {
        "student_id": student.id,
        "categories": [
            {
                "id": cat_key,
                "label": CATEGORY_LABELS[cat_key],
                "skills": categorized[cat_key]
            }
            for cat_key in CATEGORY_LABELS.keys()
        ]
    }

@router.post("/mentor/request")
def create_mentor_verification_request(payload: MentorVerificationRequestCreate, db: Session = Depends(get_db)):
    try:
        req = CompetencyService.create_mentor_request(
            db=db,
            student_id=payload.student_id,
            skill_name=payload.skill_name,
            mentor_name=payload.mentor_name,
            mentor_email=payload.mentor_email,
            evidence_summary=payload.evidence_summary,
            walkthrough_notes=payload.walkthrough_notes
        )
        return {
            "success": True,
            "request_id": req.id,
            "skill_name": req.skill_name,
            "mentor_name": req.mentor_name,
            "status": req.status,
            "message": f"Verification request submitted to {req.mentor_name}."
        }
    except Exception as ex:
        raise HTTPException(status_code=400, detail=str(ex))

@router.get("/mentor/requests/{student_id}")
def get_mentor_verification_requests(student_id: str, db: Session = Depends(get_db)):
    requests = (
        db.query(MentorVerificationRequest)
        .filter(MentorVerificationRequest.student_id == student_id)
        .order_by(MentorVerificationRequest.created_at.desc())
        .all()
    )
    return [
        {
            "id": r.id,
            "skill_name": r.skill_name,
            "mentor_name": r.mentor_name,
            "mentor_email": r.mentor_email,
            "evidence_summary": r.evidence_summary,
            "walkthrough_notes": r.walkthrough_notes,
            "status": r.status,
            "rejection_reason": r.rejection_reason,
            "reviewed_by": r.reviewed_by,
            "reviewed_at": r.reviewed_at.isoformat() if r.reviewed_at else None,
            "created_at": r.created_at.isoformat() if r.created_at else None
        }
        for r in requests
    ]

@router.post("/mentor/adjudicate")
def adjudicate_mentor_verification_request(payload: MentorVerificationAdjudicate, db: Session = Depends(get_db)):
    try:
        req = CompetencyService.adjudicate_mentor_request(
            db=db,
            request_id=payload.request_id,
            mentor_name=payload.mentor_name,
            approved=payload.approved,
            rejection_reason=payload.rejection_reason,
            notes=payload.notes
        )
        return {
            "success": True,
            "request_id": req.id,
            "skill_name": req.skill_name,
            "status": req.status,
            "reviewed_by": req.reviewed_by,
            "message": f"Verification request marked as '{req.status}' by {req.reviewed_by}."
        }
    except Exception as ex:
        raise HTTPException(status_code=400, detail=str(ex))
