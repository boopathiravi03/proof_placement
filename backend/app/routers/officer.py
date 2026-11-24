from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.models import Approval
from backend.app.schemas.schemas import ApprovalActionRequest
from backend.app.services.fairness_service import FairnessService
from backend.app.services.audit_service import AuditService

router = APIRouter(prefix="/officer", tags=["T&P Officer Intelligence"])

B0_HEATMAP = {
    "CSE": [62, 48, 18, 12, 40],
    "IT": [55, 52, 22, 15, 44],
    "ECE": [70, 66, 35, 30, 58],
    "MECH": [80, 78, 60, 52, 70]
}
SKILLS_5 = ["SQL", "Docker", "Python", "Git", "DSA"]

@router.get("/cohort-insights")
def get_cohort_insights(college_id: str = "COLLEGE-A"):
    # College-specific metrics
    is_a = (college_id == "COLLEGE-A" or "A" in college_id.upper())
    
    kpis = {
        "predicted_placement_rate": 68 if is_a else 74,
        "placement_change": "+4% vs last year",
        "verified_skill_coverage": 41 if is_a else 57,
        "coverage_change": "+9%",
        "gap_closure_rate": 33 if is_a else 46,
        "gap_closure_status": "Needs attention"
    }

    # Branch-wise heatmap
    heatmap_data = {}
    for branch, values in B0_HEATMAP.items():
        heatmap_data[branch] = values if is_a else [max(5, round(x * 0.55)) for x in values]

    # Demographic fairness calculation
    rates = {
        "Male": 42.0 if is_a else 38.0,
        "Female": 31.0 if is_a else 37.0,
        "General": 44.0 if is_a else 40.0,
        "Reserved": 29.0 if is_a else 36.0
    }
    fairness = FairnessService.calculate_disparate_impact(rates)

    return {
        "college_id": college_id,
        "kpis": kpis,
        "skills": SKILLS_5,
        "heatmap": heatmap_data,
        "industry_alert": "Industry alert: 40% of new enterprise job posts require Docker, but only " + ("10%" if is_a else "22%") + " of the current batch has verified proficiency.",
        "fairness_analysis": fairness
    }

@router.get("/approvals")
def list_approvals(college_id: str = "COLLEGE-A", db: Session = Depends(get_db)):
    approvals = (
        db.query(Approval)
        .filter(Approval.college_id == college_id, Approval.status == "pending")
        .order_by(Approval.created_at.desc())
        .all()
    )
    return [
        {
            "id": a.id,
            "title": a.title,
            "description": a.description,
            "proposed_by": a.proposed_by,
            "status": a.status,
            "payload": a.payload,
            "created_at": a.created_at.isoformat() if a.created_at else None
        }
        for a in approvals
    ]

@router.post("/approvals/action")
def act_on_approval(payload: ApprovalActionRequest, db: Session = Depends(get_db)):
    approval = db.query(Approval).filter(Approval.id == payload.approval_id).first()
    if not approval:
        raise HTTPException(status_code=404, detail="Approval request not found")

    approval.status = payload.action
    approval.decided_by = payload.officer_name
    from datetime import datetime
    approval.decided_at = datetime.utcnow()
    db.commit()

    AuditService.log_event(
        db=db,
        college_id=approval.college_id,
        actor=payload.officer_name,
        action=f"{payload.action.capitalize()} agent proposal: '{approval.title}'"
    )

    return {
        "success": True,
        "approval_id": approval.id,
        "status": approval.status,
        "message": f"Proposal '{approval.title}' {approval.status} by {payload.officer_name}."
    }

@router.get("/export-report")
def export_accreditation_report(college_id: str = "COLLEGE-A", db: Session = Depends(get_db)):
    AuditService.log_event(
        db=db,
        college_id=college_id,
        actor="T&P Officer",
        action="Exported statutory NAAC/NIRF Placement and Higher Studies Report"
    )
    return {
        "college_id": college_id,
        "report_type": "NAAC / NIRF Statutory Placement Compliance Summary",
        "generated_at": "2026-11-24T17:35:00Z",
        "sections": {
            "placement_records": {"total_placed": 412, "median_salary_lpa": 8.5, "highest_salary_lpa": 24.0},
            "higher_studies": {"students_enrolled": 48, "top_universities": ["IISc", "CMU", "IIT Bombay"]},
            "branch_wise_distribution": {"CSE": 92.4, "IT": 89.1, "ECE": 81.3, "MECH": 72.0}
        },
        "status": "Verified & Exported"
    }
