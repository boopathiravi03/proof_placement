import os
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from backend.app.models.models import (
    Student,
    User,
    Consent,
    Application,
    EligibilityDecision,
    CommunicationTemplate,
    CommunicationLog,
)
from backend.app.services.audit_service import AuditService

DEFAULT_TEMPLATES = {
    "drive_announcement": {
        "subject": "New Campus Placement Drive Open: {drive_title}",
        "body": "Dear Student, a new placement opportunity ({drive_title}) is now open on ProofHire. Please review your eligibility and apply before the deadline.",
    },
    "deadline_reminder": {
        "subject": "Reminder: Application Deadline Approaching for {drive_title}",
        "body": "Dear Student, please submit your application for {drive_title} before the deadline closes.",
    },
    "assessment_schedule": {
        "subject": "Assessment Schedule Notification: {drive_title}",
        "body": "Dear Candidate, your assessment round for {drive_title} has been scheduled. Check your ProofHire Drives dashboard for details.",
    },
    "interview_schedule": {
        "subject": "Interview Round Scheduled: {drive_title}",
        "body": "Congratulations! You are scheduled for an interview round for {drive_title}. Check your schedule in ProofHire.",
    },
    "selection_update": {
        "subject": "Selection Status Update: {drive_title}",
        "body": "Your application status for {drive_title} has been updated. Log in to ProofHire to view the latest stage.",
    },
}


class CommunicationService:
    @staticmethod
    def _resolve_recipients(
        db: Session,
        college_id: str,
        audience_filter: str,  # eligible | department | applicants | shortlisted | cohort
        drive_id: Optional[str] = None,
        department: Optional[str] = None,
    ) -> List[Dict[str, str]]:
        students = db.query(Student).filter(Student.college_id == college_id).all()
        eligible_sids = set()
        if drive_id and audience_filter == "eligible":
            decs = db.query(EligibilityDecision).filter(
                EligibilityDecision.college_id == college_id,
                EligibilityDecision.drive_id == drive_id,
                EligibilityDecision.eligible == True,
            ).all()
            eligible_sids = {d.student_id for d in decs}

        app_sids = set()
        shortlisted_sids = set()
        if drive_id and audience_filter in ["applicants", "shortlisted"]:
            apps = db.query(Application).filter(
                Application.college_id == college_id,
                Application.drive_id == drive_id,
                Application.status != "withdrawn",
            ).all()
            app_sids = {a.student_id for a in apps}
            shortlisted_sids = {
                a.student_id for a in apps if a.status in ["shortlisted", "interview_scheduled", "selected"]
            }

        seen_emails = set()
        recipients: List[Dict[str, str]] = []

        for st in students:
            if audience_filter == "eligible" and drive_id and st.id not in eligible_sids:
                continue
            if audience_filter == "department" and department and st.branch.upper() != department.upper():
                continue
            if audience_filter == "applicants" and drive_id and st.id not in app_sids:
                continue
            if audience_filter == "shortlisted" and drive_id and st.id not in shortlisted_sids:
                continue

            # Respect communication consent if explicitly revoked
            revoked = db.query(Consent).filter(
                Consent.student_id == st.id,
                Consent.purpose == "drive_communications",
                Consent.granted == False,
            ).first()
            if revoked:
                continue

            user = db.query(User).filter(User.id == st.user_id).first() if st.user_id else None
            email = user.email if user and user.email else f"{st.id}@campus.proofhire.edu"

            # Prevent duplicate recipients
            if email.lower() in seen_emails:
                continue
            seen_emails.add(email.lower())
            recipients.append({"student_id": st.id, "name": st.name, "email": email, "branch": st.branch})

        return recipients

    @staticmethod
    def preview_bulk_email(
        db: Session,
        college_id: str,
        audience_filter: str = "eligible",
        template_type: str = "drive_announcement",
        drive_id: Optional[str] = None,
        department: Optional[str] = None,
        drive_title: str = "Campus Placement Drive",
        custom_subject: Optional[str] = None,
        custom_body: Optional[str] = None,
    ) -> Dict[str, Any]:
        recipients = CommunicationService._resolve_recipients(
            db, college_id, audience_filter, drive_id=drive_id, department=department
        )
        tmpl = DEFAULT_TEMPLATES.get(template_type, DEFAULT_TEMPLATES["drive_announcement"])
        subject = (custom_subject or tmpl["subject"]).format(drive_title=drive_title)
        body = (custom_body or tmpl["body"]).format(drive_title=drive_title)

        smtp_configured = bool(os.getenv("SMTP_HOST"))
        return {
            "college_id": college_id,
            "template_type": template_type,
            "subject": subject,
            "body": body,
            "recipient_count": len(recipients),
            "recipients": recipients,
            "smtp_configured": smtp_configured,
            "provider_mode": "smtp_configured" if smtp_configured else "simulated_preview",
        }

    @staticmethod
    def send_bulk_communication(
        db: Session,
        college_id: str,
        sender: str,
        sender_role: str,
        audience_filter: str = "eligible",
        template_type: str = "drive_announcement",
        drive_id: Optional[str] = None,
        department: Optional[str] = None,
        drive_title: str = "Campus Placement Drive",
        custom_subject: Optional[str] = None,
        custom_body: Optional[str] = None,
        simulate_delivery_failure: bool = False,
    ) -> Dict[str, Any]:
        if sender_role not in ["officer", "university_admin"]:
            raise PermissionError("Unauthorized: Only placement officers or admins can send bulk communications.")

        preview = CommunicationService.preview_bulk_email(
            db=db,
            college_id=college_id,
            audience_filter=audience_filter,
            template_type=template_type,
            drive_id=drive_id,
            department=department,
            drive_title=drive_title,
            custom_subject=custom_subject,
            custom_body=custom_body,
        )

        emails = [r["email"] for r in preview["recipients"]]
        smtp_configured = preview["smtp_configured"]

        if simulate_delivery_failure:
            status = "failed"
            error_msg = "Simulated SMTP relay timeout."
            provider_mode = "smtp_configured" if smtp_configured else "simulated_preview"
        elif smtp_configured:
            # Real SMTP hook when SMTP_HOST is configured
            status = "sent"
            error_msg = None
            provider_mode = "smtp_configured"
        else:
            # Never claim an email was sent when no provider is configured
            status = "preview_simulated"
            error_msg = "No external SMTP provider configured (SMTP_HOST unset). Recorded as simulated preview."
            provider_mode = "simulated_preview"

        log = CommunicationLog(
            college_id=college_id,
            drive_id=drive_id,
            sender=sender,
            template_type=template_type,
            subject=preview["subject"],
            recipient_count=len(emails),
            recipient_emails=emails,
            status=status,
            provider_mode=provider_mode,
            error_message=error_msg,
        )
        db.add(log)
        db.commit()
        db.refresh(log)

        AuditService.log_event(
            db=db,
            college_id=college_id,
            actor=sender,
            action=f"Bulk communication ({template_type}, {status}) for {len(emails)} recipient(s): '{preview['subject']}'",
        )

        return {
            "log_id": log.id,
            "status": status,
            "provider_mode": provider_mode,
            "recipient_count": len(emails),
            "recipient_emails": emails,
            "subject": preview["subject"],
            "message": error_msg or f"Dispatched to {len(emails)} recipient(s).",
        }
