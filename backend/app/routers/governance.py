from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.models import User, PrivacyRequest, DataAccessLog, FairnessAudit
from backend.app.security import get_current_user_optional
from backend.app.services.governance_service import GovernanceService
from backend.app.services.privacy_retention_service import PrivacyRetentionService
from backend.app.services.fairness_service import FairnessService
from backend.app.services.explanation_service import ExplanationService
from backend.app.services.audit_service import AuditService

router = APIRouter(prefix="/governance", tags=["Trust, Privacy, Fairness & Governance"])


class ConsentUpdatePayload(BaseModel):
    student_id: str
    purpose: str
    granted: bool
    policy_version: str = "v2.0"


class PrivacyRequestCreatePayload(BaseModel):
    student_id: str
    request_type: str  # data_export, deletion_erasure, correction, grievance
    reason: str


class PrivacyRequestProcessPayload(BaseModel):
    college_id: str = "COLLEGE-A"
    action: str  # approved, rejected, restricted_retained
    reviewer_notes: str = ""


class FairnessReviewPayload(BaseModel):
    college_id: str = "COLLEGE-A"
    review_outcome: str  # resolved, escalated
    reviewer_name: str = "T&P Officer"


# --- Consent Endpoints ---
@router.get("/consent/{student_id}")
def get_student_consents(
    student_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    if current_user:
        try:
            GovernanceService.authorize_and_log_access(
                db=db,
                actor_id=current_user.id,
                actor_role=current_user.role,
                actor_college_id=current_user.college_id,
                student_id=student_id,
                resource_type="consent_records",
                resource_id=student_id,
                purpose="view_consent_settings",
            )
        except PermissionError as ex:
            raise HTTPException(status_code=403, detail=str(ex))
    try:
        return GovernanceService.get_student_consents(db, student_id)
    except ValueError as ex:
        raise HTTPException(status_code=404, detail=str(ex))


@router.post("/consent")
def update_student_consent(
    payload: ConsentUpdatePayload,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    if current_user:
        try:
            GovernanceService.authorize_and_log_access(
                db=db,
                actor_id=current_user.id,
                actor_role=current_user.role,
                actor_college_id=current_user.college_id,
                student_id=payload.student_id,
                resource_type="consent_records",
                resource_id=payload.purpose,
                purpose="update_consent",
            )
        except PermissionError as ex:
            raise HTTPException(status_code=403, detail=str(ex))
    try:
        return GovernanceService.set_consent(
            db=db,
            student_id=payload.student_id,
            purpose=payload.purpose,
            granted=payload.granted,
            policy_version=payload.policy_version,
        )
    except ValueError as ex:
        raise HTTPException(status_code=400, detail=str(ex))


# --- Privacy Notice, Retention & Privacy Requests ---
@router.get("/privacy-notice")
def get_active_privacy_notice(db: Session = Depends(get_db)):
    return PrivacyRetentionService.get_active_privacy_notice(db)


@router.get("/retention-policies")
def get_retention_policies(college_id: str = "COLLEGE-A", db: Session = Depends(get_db)):
    return PrivacyRetentionService.get_retention_policies(db, college_id)


@router.post("/privacy-requests")
def submit_privacy_request(payload: PrivacyRequestCreatePayload, db: Session = Depends(get_db)):
    try:
        req = PrivacyRetentionService.submit_privacy_request(
            db=db, student_id=payload.student_id, request_type=payload.request_type, reason=payload.reason
        )
        return {"id": req.id, "request_type": req.request_type, "status": req.status, "created_at": req.created_at.isoformat()}
    except ValueError as ex:
        raise HTTPException(status_code=400, detail=str(ex))


@router.get("/privacy-requests/{student_id}")
def list_student_privacy_requests(student_id: str, db: Session = Depends(get_db)):
    rows = (
        db.query(PrivacyRequest)
        .filter(PrivacyRequest.student_id == student_id)
        .order_by(PrivacyRequest.created_at.desc())
        .all()
    )
    return [
        {
            "id": r.id,
            "request_type": r.request_type,
            "reason": r.reason,
            "status": r.status,
            "retention_exception_applied": r.retention_exception_applied,
            "reviewer_notes": r.reviewer_notes,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in rows
    ]


@router.post("/privacy-requests/{request_id}/process")
def process_privacy_request(
    request_id: str,
    payload: PrivacyRequestProcessPayload,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    role = current_user.role if current_user else "officer"
    name = current_user.full_name if current_user else "T&P Officer"
    try:
        return PrivacyRetentionService.process_privacy_request(
            db=db,
            request_id=request_id,
            college_id=payload.college_id,
            reviewer_name=name,
            reviewer_role=role,
            action=payload.action,
            reviewer_notes=payload.reviewer_notes,
        )
    except PermissionError as ex:
        raise HTTPException(status_code=403, detail=str(ex))
    except ValueError as ex:
        raise HTTPException(status_code=400, detail=str(ex))


@router.get("/access-logs/{student_id}")
def get_student_data_access_logs(student_id: str, db: Session = Depends(get_db)):
    rows = (
        db.query(DataAccessLog)
        .filter(DataAccessLog.student_id == student_id)
        .order_by(DataAccessLog.created_at.desc())
        .limit(20)
        .all()
    )
    return [
        {
            "id": r.id,
            "actor_role": r.actor_role,
            "resource_type": r.resource_type,
            "purpose": r.purpose,
            "allowed": r.allowed,
            "denial_reason": r.denial_reason,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in rows
    ]


# --- Fairness Auditing ---
@router.post("/fairness/audit")
def run_fairness_audit(
    college_id: str = "COLLEGE-A",
    analysis_period: str = "2025-2026",
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    if current_user and current_user.role not in ["officer", "university_admin"]:
        raise HTTPException(status_code=403, detail="Unauthorized to run fairness audits.")
    if current_user and current_user.role == "officer" and current_user.college_id != college_id:
        raise HTTPException(status_code=403, detail="Tenant isolation violation.")
    return FairnessService.run_comprehensive_fairness_audit(
        db=db,
        college_id=college_id,
        analysis_period=analysis_period,
        reviewer_name=current_user.full_name if current_user else "T&P Officer",
    )


@router.get("/fairness/reports")
def list_fairness_reports(college_id: str = "COLLEGE-A", db: Session = Depends(get_db)):
    rows = (
        db.query(FairnessAudit)
        .filter(FairnessAudit.college_id == college_id)
        .order_by(FairnessAudit.created_at.desc())
        .all()
    )
    return [
        {
            "id": r.id,
            "analysis_period": r.analysis_period,
            "population_size": r.population_size,
            "anomalies_detected": r.anomalies_detected,
            "disparity_indicators": r.disparity_indicators,
            "limitations": r.limitations,
            "review_outcome": r.review_outcome,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in rows
    ]


# --- Explainable AI ---
@router.get("/explanations/{student_id}")
def get_student_explanations(student_id: str, college_id: str = "COLLEGE-A", db: Session = Depends(get_db)):
    return ExplanationService.get_explanations_for_student(db, college_id, student_id)


# --- Audit Verification & Checkpoints ---
@router.post("/audit/{college_id}/verify")
def verify_audit_chain_detailed(college_id: str, db: Session = Depends(get_db)):
    return AuditService.verify_chain_detailed(db, college_id)


@router.post("/audit/{college_id}/checkpoint")
def create_audit_checkpoint(college_id: str, db: Session = Depends(get_db)):
    return AuditService.create_signed_checkpoint(db, college_id)
