import os
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session
from backend.app.models.models import Student, Consent, DataAccessLog, SecurityEvent
from backend.app.services.audit_service import AuditService

BLOCKED_FILE_EXTENSIONS = {".exe", ".sh", ".bat", ".cmd", ".js", ".php", ".vbs", ".ps1"}
MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB

CONSENT_CATEGORIES = {
    "github_sync": {
        "category": "github_integration",
        "title": "GitHub Integration (Read-Only Public Repositories)",
        "purpose": "Analyze public commit frequency, languages, and repository metadata to link skills.",
        "data_categories": ["github_username", "public_repo_metadata", "language_distribution"],
        "default_granted": True,
    },
    "evidence_sharing_recruiters": {
        "category": "evidence_sharing",
        "title": "Evidence Metadata Sharing with Authorized Recruiters",
        "purpose": "Permit authorized recruiters to view verified competency summaries and evidence metadata.",
        "data_categories": ["verified_competencies", "evidence_metadata"],
        "default_granted": True,
    },
    "assessment_evaluation": {
        "category": "assessment_data",
        "title": "Assessment Data for Readiness & Eligibility",
        "purpose": "Use diagnostic assessment scores for skill-gap analysis, readiness, and eligibility checks.",
        "data_categories": ["assessment_scores", "topic_accuracy"],
        "default_granted": True,
    },
    "learning_activity_analytics": {
        "category": "learning_activity",
        "title": "Learning Progress & Task Activity",
        "purpose": "Track personalized learning roadmap completion and skill-gap closure progress.",
        "data_categories": ["learning_task_status", "submission_timestamps"],
        "default_granted": True,
    },
    "recruiter_sharing": {
        "category": "placement_participation",
        "title": "Placement Participation & Profile Discovery",
        "purpose": "Include student dossier in authorized campus drive matching and recruiter search.",
        "data_categories": ["academic_profile", "verified_skills", "readiness_summary"],
        "default_granted": True,
    },
    "institutional_analytics": {
        "category": "institutional_analytics",
        "title": "Aggregate Institutional & Accreditation Reporting",
        "purpose": "Include anonymized/aggregated metrics in NAAC/NIRF and cohort analytics.",
        "data_categories": ["aggregated_cohort_metrics"],
        "default_granted": True,
    },
}


class GovernanceService:
    @staticmethod
    def get_student_consents(db: Session, student_id: str) -> List[Dict[str, Any]]:
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise ValueError(f"Student {student_id} not found")

        existing = {
            c.purpose: c
            for c in db.query(Consent).filter(Consent.student_id == student_id).all()
        }

        results = []
        for purpose, meta in CONSENT_CATEGORIES.items():
            rec = existing.get(purpose)
            if not rec:
                granted = False if (purpose == "github_sync" and student.github_consent_revoked) else meta["default_granted"]
                results.append({
                    "purpose": purpose,
                    "category": meta["category"],
                    "title": meta["title"],
                    "description": meta["purpose"],
                    "data_categories": meta["data_categories"],
                    "policy_version": "v2.0",
                    "collection_method": "explicit_opt_in",
                    "granted": granted,
                    "granted_at": None,
                    "revoked_at": None,
                })
            else:
                results.append({
                    "purpose": purpose,
                    "category": rec.category or meta["category"],
                    "title": meta["title"],
                    "description": meta["purpose"],
                    "data_categories": rec.data_categories or meta["data_categories"],
                    "policy_version": rec.policy_version or "v2.0",
                    "collection_method": rec.collection_method or "explicit_opt_in",
                    "granted": rec.granted,
                    "granted_at": rec.granted_at.isoformat() if rec.granted_at else None,
                    "revoked_at": rec.revoked_at.isoformat() if rec.revoked_at else None,
                })
        return results

    @staticmethod
    def set_consent(
        db: Session,
        student_id: str,
        purpose: str,
        granted: bool,
        policy_version: str = "v2.0",
        collection_method: str = "explicit_opt_in",
    ) -> Dict[str, Any]:
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise ValueError(f"Student {student_id} not found")

        meta = CONSENT_CATEGORIES.get(purpose, {
            "category": "placement_participation",
            "data_categories": [],
        })

        rec = (
            db.query(Consent)
            .filter(Consent.student_id == student_id, Consent.purpose == purpose)
            .first()
        )
        now = datetime.utcnow()
        if not rec:
            rec = Consent(
                college_id=student.college_id,
                student_id=student_id,
                category=meta["category"],
                purpose=purpose,
                policy_version=policy_version,
                collection_method=collection_method,
                data_categories=meta.get("data_categories", []),
                granted=granted,
                granted_at=now if granted else None,
                revoked_at=None if granted else now,
            )
            db.add(rec)
        else:
            rec.granted = granted
            rec.policy_version = policy_version
            if granted:
                rec.granted_at = now
                rec.revoked_at = None
            else:
                rec.revoked_at = now

        if purpose == "github_sync":
            student.github_consent_revoked = not granted
            if not granted:
                student.github_connected = False

        db.commit()
        db.refresh(rec)

        AuditService.log_event(
            db=db,
            college_id=student.college_id,
            actor=student.name,
            action=f"{'Granted' if granted else 'Revoked'} consent for '{purpose}' (category: {meta['category']}, policy: {policy_version})",
        )
        return {
            "student_id": student_id,
            "purpose": purpose,
            "category": rec.category,
            "granted": rec.granted,
            "policy_version": rec.policy_version,
            "granted_at": rec.granted_at.isoformat() if rec.granted_at else None,
            "revoked_at": rec.revoked_at.isoformat() if rec.revoked_at else None,
        }

    @staticmethod
    def check_consent(db: Session, student_id: str, purpose: str) -> Tuple[bool, str]:
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            return False, f"Student {student_id} not found"

        if purpose == "github_sync" and student.github_consent_revoked:
            return False, "Consent for 'github_sync' is revoked."

        rec = (
            db.query(Consent)
            .filter(Consent.student_id == student_id, Consent.purpose == purpose)
            .first()
        )
        if rec:
            if not rec.granted:
                return False, f"Consent for '{purpose}' was revoked at {rec.revoked_at}."
            return True, "Active explicit consent verified."

        # If no explicit record exists yet, check default policy (github_sync & sensitive sharing require explicit or active non-revoked consent)
        if purpose in CONSENT_CATEGORIES:
            return True, "Default institutional consent active (revocable anytime)."
        return False, f"Unknown consent purpose '{purpose}'."

    @staticmethod
    def authorize_and_log_access(
        db: Session,
        actor_id: str,
        actor_role: str,
        actor_college_id: str,
        student_id: str,
        resource_type: str,
        resource_id: Optional[str],
        purpose: str,
        require_consent_purpose: Optional[str] = None,
    ) -> bool:
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise ValueError(f"Student {student_id} not found")

        allowed = True
        denial_reason = None

        # 1. Tenant isolation check (never trust frontend-supplied tenant without matching identity)
        if actor_role in ["student", "officer"] and actor_college_id != student.college_id:
            allowed = False
            denial_reason = "Cross-tenant access denied: Actor college does not match student college."
        elif actor_role == "student" and actor_id != student.id and actor_id != student.user_id:
            allowed = False
            denial_reason = "Ownership check failed: Students can only access their own records."
        elif actor_role == "recruiter":
            if resource_type in ["learning_activity", "private_repo", "recruiter_feedback", "academic_transcript_raw"]:
                allowed = False
                denial_reason = f"Least-privilege restriction: Recruiters cannot access '{resource_type}'."

        # 2. Consent enforcement check
        if allowed and require_consent_purpose:
            consented, c_reason = GovernanceService.check_consent(db, student_id, require_consent_purpose)
            if not consented:
                allowed = False
                denial_reason = c_reason

        # 3. Record DataAccessLog
        db.add(
            DataAccessLog(
                college_id=student.college_id,
                actor_id=actor_id,
                actor_role=actor_role,
                student_id=student_id,
                resource_type=resource_type,
                resource_id=resource_id,
                purpose=purpose,
                allowed=allowed,
                denial_reason=denial_reason,
            )
        )
        if not allowed:
            db.add(
                SecurityEvent(
                    college_id=student.college_id,
                    event_type="unauthorized_access_attempt",
                    severity="high",
                    actor_id=actor_id,
                    details=f"Denied {actor_role} access to {resource_type} for student {student_id}: {denial_reason}",
                )
            )
        db.commit()

        if not allowed:
            raise PermissionError(denial_reason or "Access denied by governance policy.")
        return True

    @staticmethod
    def validate_file_upload(filename: str, size_bytes: int) -> None:
        _, ext = os.path.splitext((filename or "").lower())
        if ext in BLOCKED_FILE_EXTENSIONS or not ext:
            raise ValueError(f"Blocked file type '{ext}'. Upload rejected for security.")
        if size_bytes > MAX_UPLOAD_BYTES:
            raise ValueError(f"File size ({size_bytes} bytes) exceeds 10 MB limit.")

    @staticmethod
    def redact_sensitive_fields(payload: Dict[str, Any]) -> Dict[str, Any]:
        sensitive_keys = {"password", "password_hash", "secret", "token", "access_token", "github_token", "private_notes"}
        redacted = {}
        for k, v in payload.items():
            if k.lower() in sensitive_keys:
                redacted[k] = "[REDACTED]"
            elif isinstance(v, dict):
                redacted[k] = GovernanceService.redact_sensitive_fields(v)
            else:
                redacted[k] = v
        return redacted
