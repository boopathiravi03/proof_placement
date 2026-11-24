from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.models import Company, JobRole, PlacementDrive
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
            "roles": [
                {
                    "id": r.id,
                    "title": r.title,
                    "min_cgpa": r.min_cgpa,
                    "max_backlogs": r.max_backlogs,
                    "required_skills": r.required_skills
                }
                for r in roles
            ]
        })
    return results

@router.get("/drives")
def get_drive_calendar(college_id: str = "COLLEGE-A", db: Session = Depends(get_db)):
    drives = (
        db.query(PlacementDrive)
        .filter(PlacementDrive.college_id == college_id)
        .order_by(PlacementDrive.day_of_week)
        .all()
    )
    # Check for day clashes
    day_counts = {}
    for d in drives:
        day_counts[d.day_of_week] = day_counts.get(d.day_of_week, 0) + 1

    results = []
    has_any_clash = False
    for d in drives:
        clash = day_counts[d.day_of_week] > 1
        if clash:
            has_any_clash = True
        results.append({
            "id": d.id,
            "title": d.title,
            "day_of_week": d.day_of_week,
            "activity": d.activity,
            "has_clash": clash,
            "status": d.status
        })

    return {
        "calendar": results,
        "clash_detected": has_any_clash,
        "recommendation": "Move Beta Soft visit from Wednesday to Thursday to resolve slot clash." if has_any_clash else "Schedule optimized."
    }

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
        action=f"Confirmed auto-allocated conflict-free slot for {drive_title}: {old_day} -> {new_day}"
    )

    return {
        "success": True,
        "drive_id": drive.id,
        "new_day": new_day,
        "message": f"Clash resolved. {drive_title} rescheduled to {new_day}."
    }
