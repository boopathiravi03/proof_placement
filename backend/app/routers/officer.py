from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.models import Approval, User, CommunicationLog
from backend.app.security import get_current_user_optional
from backend.app.schemas.schemas import (
    ApprovalActionRequest,
    TrainingInterventionCreateRequest,
    InterventionAssignRequest,
    BulkCommPreviewRequest,
)
from backend.app.services.fairness_service import FairnessService
from backend.app.services.audit_service import AuditService
from backend.app.services.intervention_service import InterventionService
from backend.app.services.drive_service import DriveService
from backend.app.services.communication_service import CommunicationService

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

# --- Phase 5: Cohort Skill-Gap & Training Intervention Endpoints ---

def _enforce_officer_tenant(current_user: Optional[User], college_id: str):
    if current_user:
        if current_user.role not in ["officer", "university_admin"]:
            raise HTTPException(status_code=403, detail="Unauthorized: Officer or University Admin role required.")
        if current_user.role == "officer" and current_user.college_id != college_id:
            raise HTTPException(status_code=403, detail="Tenant isolation violation: Cannot access another college's cohort.")

@router.get("/cohort-skill-gaps")
def get_cohort_skill_gaps(
    college_id: str = "COLLEGE-A",
    target_role: str = "Backend Developer",
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    _enforce_officer_tenant(current_user, college_id)
    return InterventionService.get_cohort_skill_gaps(db, college_id, target_role=target_role)

@router.get("/interventions")
def list_interventions(
    college_id: str = "COLLEGE-A",
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    _enforce_officer_tenant(current_user, college_id)
    return InterventionService.list_interventions(db, college_id)

@router.post("/interventions")
def create_intervention(
    payload: TrainingInterventionCreateRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    _enforce_officer_tenant(current_user, payload.college_id)
    iv = InterventionService.create_intervention(
        db=db,
        college_id=payload.college_id,
        created_by=current_user.full_name if current_user else payload.created_by,
        title=payload.title,
        description=payload.description or "",
        target_role=payload.target_role,
        target_skills=payload.target_skills,
    )
    return {"id": iv.id, "title": iv.title, "target_role": iv.target_role, "status": iv.status}

@router.post("/interventions/{intervention_id}/assign")
def assign_students_to_intervention(
    intervention_id: str,
    payload: InterventionAssignRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    _enforce_officer_tenant(current_user, payload.college_id)
    try:
        return InterventionService.assign_students(
            db=db,
            intervention_id=intervention_id,
            college_id=payload.college_id,
            student_ids=payload.student_ids,
            actor=current_user.full_name if current_user else payload.actor,
        )
    except ValueError as ex:
        raise HTTPException(status_code=400, detail=str(ex))

@router.get("/interventions/{intervention_id}/effectiveness")
def get_intervention_effectiveness(
    intervention_id: str,
    college_id: str = "COLLEGE-A",
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    _enforce_officer_tenant(current_user, college_id)
    try:
        return InterventionService.get_intervention_effectiveness(db, intervention_id, college_id)
    except ValueError as ex:
        raise HTTPException(status_code=404, detail=str(ex))

# --- Phase 6: Placement Analytics, CSV Export & Bulk Communications ---

@router.get("/placement-analytics")
def get_placement_analytics(
    college_id: str = "COLLEGE-A",
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    _enforce_officer_tenant(current_user, college_id)
    return DriveService.get_placement_analytics(db, college_id)

@router.get("/placement-analytics/export-csv")
def export_placement_analytics_csv(
    college_id: str = "COLLEGE-A",
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    _enforce_officer_tenant(current_user, college_id)
    csv_data = DriveService.export_analytics_csv(db, college_id)
    AuditService.log_event(
        db=db,
        college_id=college_id,
        actor=current_user.full_name if current_user else "T&P Officer",
        action="Exported placement analytics CSV report",
    )
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=placement_analytics_{college_id}.csv"},
    )

@router.post("/communications/preview")
def preview_bulk_communication(
    payload: BulkCommPreviewRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    _enforce_officer_tenant(current_user, payload.college_id)
    return CommunicationService.preview_bulk_email(
        db=db,
        college_id=payload.college_id,
        audience_filter=payload.audience_filter,
        template_type=payload.template_type,
        drive_id=payload.drive_id,
        department=payload.department,
        drive_title=payload.drive_title,
        custom_subject=payload.custom_subject,
        custom_body=payload.custom_body,
    )

@router.post("/communications/send")
def send_bulk_communication(
    payload: BulkCommPreviewRequest,
    simulate_failure: bool = False,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    _enforce_officer_tenant(current_user, payload.college_id)
    role = current_user.role if current_user else "officer"
    sender = current_user.full_name if current_user else "T&P Officer"
    try:
        return CommunicationService.send_bulk_communication(
            db=db,
            college_id=payload.college_id,
            sender=sender,
            sender_role=role,
            audience_filter=payload.audience_filter,
            template_type=payload.template_type,
            drive_id=payload.drive_id,
            department=payload.department,
            drive_title=payload.drive_title,
            custom_subject=payload.custom_subject,
            custom_body=payload.custom_body,
            simulate_delivery_failure=simulate_failure,
        )
    except PermissionError as ex:
        raise HTTPException(status_code=403, detail=str(ex))

@router.get("/communications/logs")
def get_communication_logs(
    college_id: str = "COLLEGE-A",
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    _enforce_officer_tenant(current_user, college_id)
    logs = (
        db.query(CommunicationLog)
        .filter(CommunicationLog.college_id == college_id)
        .order_by(CommunicationLog.created_at.desc())
        .all()
    )
    return [
        {
            "id": l.id,
            "sender": l.sender,
            "template_type": l.template_type,
            "subject": l.subject,
            "recipient_count": l.recipient_count,
            "status": l.status,
            "provider_mode": l.provider_mode,
            "error_message": l.error_message,
            "created_at": l.created_at.isoformat() if l.created_at else None,
        }
        for l in logs
    ]
