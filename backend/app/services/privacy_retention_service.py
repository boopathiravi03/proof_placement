from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from backend.app.models.models import (
    PrivacyNoticeVersion,
    RetentionPolicy,
    PrivacyRequest,
    Student,
    Competency,
    Evidence,
    AssessmentAttempt,
)
from backend.app.services.audit_service import AuditService

DEFAULT_PRIVACY_NOTICE = {
    "version": "v2.0",
    "title": "ProofHire Institutional Talent Intelligence Privacy Notice",
    "data_categories": [
        "Academic profile (roll number, branch, CGPA, active backlogs)",
        "Competency claims, evidence links, and assessment outcomes",
        "Public GitHub repository metadata (only when explicitly authorized)",
        "Campus drive applications and selection status",
    ],
    "purposes": [
        "Verifying competencies and calculating explainable placement readiness",
        "Generating personalized skill-gap learning paths",
        "Evaluating campus drive eligibility and matching authorized job opportunities",
        "Aggregate institutional reporting and NAAC/NIRF preparation",
    ],
    "sharing_recipients": [
        "Authorized College Training & Placement Officers",
        "Assigned Faculty Mentors (for requested skill verifications)",
        "Authorized Corporate Recruiters (only for verified skills and permitted drives)",
    ],
    "retention_info": "Operational placement records are retained per institutional retention policy (default 365 days post-graduation). Audit logs are retained for institutional integrity.",
    "user_controls": "Students may independently grant or revoke consent per purpose, request data export, request correction of inaccurate records, or submit erasure/grievance requests.",
    "grievance_contact": "dpo-grievance@proofhire.edu (Institutional Data Protection & Grievance Officer)",
}

DEFAULT_RETENTION_POLICIES = [
    ("github_sync", 180, "Revoking consent immediately clears sync tokens; metadata purged after 180 days."),
    ("evidence", 730, "Verified competency evidence retained 2 years for placement audit traceability."),
    ("assessment_attempts", 730, "Proctored assessment records retained 2 years."),
    ("learning_activity", 365, "Learning path tasks retained 1 year."),
    ("applications", 1095, "Campus drive applications retained 3 years for institutional placement records."),
    ("recruiter_feedback", 365, "Private recruiter feedback retained 1 year."),
    ("audit_log", 2555, "Tamper-evident audit logs retained 7 years under statutory/institutional integrity exception."),
    ("institutional_reports", 1825, "Accreditation report snapshots retained 5 years."),
]


class PrivacyRetentionService:
    @staticmethod
    def seed_defaults(db: Session, college_id: str = "COLLEGE-A") -> None:
        if not db.query(PrivacyNoticeVersion).first():
            db.add(PrivacyNoticeVersion(**DEFAULT_PRIVACY_NOTICE, active=True))
        if not db.query(RetentionPolicy).filter(RetentionPolicy.college_id == college_id).first():
            for ent, days, note in DEFAULT_RETENTION_POLICIES:
                db.add(
                    RetentionPolicy(
                        college_id=college_id,
                        entity_type=ent,
                        retention_days=days,
                        legal_exception_note=note,
                        auto_anonymize=(ent != "audit_log"),
                    )
                )
        db.commit()

    @staticmethod
    def get_active_privacy_notice(db: Session) -> Dict[str, Any]:
        PrivacyRetentionService.seed_defaults(db)
        notice = db.query(PrivacyNoticeVersion).filter(PrivacyNoticeVersion.active == True).order_by(PrivacyNoticeVersion.created_at.desc()).first()
        return {
            "version": notice.version,
            "title": notice.title,
            "data_categories": notice.data_categories,
            "purposes": notice.purposes,
            "sharing_recipients": notice.sharing_recipients,
            "retention_info": notice.retention_info,
            "user_controls": notice.user_controls,
            "grievance_contact": notice.grievance_contact,
            "effective_date": notice.effective_date.isoformat() if notice.effective_date else None,
            "legal_disclaimer": "Configured with reference to India's DPDP Act, 2023. Institutional legal review is required before production deployment; ProofHire does not claim formal legal certification.",
        }

    @staticmethod
    def get_retention_policies(db: Session, college_id: str) -> List[Dict[str, Any]]:
        PrivacyRetentionService.seed_defaults(db, college_id)
        rows = db.query(RetentionPolicy).filter(RetentionPolicy.college_id == college_id).all()
        return [
            {
                "id": r.id,
                "entity_type": r.entity_type,
                "retention_days": r.retention_days,
                "legal_exception_note": r.legal_exception_note,
                "auto_anonymize": r.auto_anonymize,
                "updated_by": r.updated_by,
            }
            for r in rows
        ]

    @staticmethod
    def submit_privacy_request(
        db: Session,
        student_id: str,
        request_type: str,
        reason: str,
    ) -> PrivacyRequest:
        if request_type not in ["data_export", "deletion_erasure", "correction", "grievance"]:
            raise ValueError(f"Unsupported privacy request type '{request_type}'")

        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise ValueError("Student not found")

        req = PrivacyRequest(
            student_id=student_id,
            college_id=student.college_id,
            request_type=request_type,
            reason=reason,
            status="pending",
        )
        db.add(req)
        db.commit()
        db.refresh(req)

        AuditService.log_event(
            db=db,
            college_id=student.college_id,
            actor=student.name,
            action=f"Submitted privacy request ({request_type}): '{reason[:60]}'",
        )
        return req

    @staticmethod
    def process_privacy_request(
        db: Session,
        request_id: str,
        college_id: str,
        reviewer_name: str,
        reviewer_role: str,
        action: str,  # approved | rejected | restricted_retained
        reviewer_notes: str = "",
    ) -> Dict[str, Any]:
        if reviewer_role not in ["officer", "university_admin"]:
            raise PermissionError("Only authorized placement officers or admins can process privacy requests.")

        req = db.query(PrivacyRequest).filter(
            PrivacyRequest.id == request_id,
            PrivacyRequest.college_id == college_id,
        ).first()
        if not req:
            raise ValueError("Privacy request not found in college")

        req.status = action
        req.reviewer_name = reviewer_name
        req.reviewer_notes = reviewer_notes
        req.resolved_at = datetime.utcnow()

        export_bundle = None
        student = db.query(Student).filter(Student.id == req.student_id).first()

        if action == "approved" and req.request_type == "data_export" and student:
            comps = db.query(Competency).filter(Competency.student_id == student.id).all()
            attempts = db.query(AssessmentAttempt).filter(AssessmentAttempt.student_id == student.id).all()
            export_bundle = {
                "student": {"id": student.id, "name": student.name, "branch": student.branch, "cgpa": student.cgpa},
                "competencies": [{"skill": c.skill_name, "state": c.state} for c in comps],
                "assessments_count": len(attempts),
            }
            req.status = "completed"
        elif req.request_type == "deletion_erasure":
            if action == "restricted_retained":
                req.retention_exception_applied = True
            elif action == "approved" and student:
                # Anonymize student PII while preserving institutional audit log chain integrity
                student.name = f"Anonymized-{student.id[:6]}"
                student.github_username = None
                student.github_connected = False
                student.github_consent_revoked = True
                req.status = "completed"

        db.commit()
        db.refresh(req)

        AuditService.log_event(
            db=db,
            college_id=college_id,
            actor=reviewer_name,
            action=f"Processed privacy request {req.id} ({req.request_type}) -> {req.status}",
        )
        return {
            "request_id": req.id,
            "status": req.status,
            "retention_exception_applied": req.retention_exception_applied,
            "export_bundle": export_bundle,
        }
