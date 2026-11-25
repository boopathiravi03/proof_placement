import csv
import io
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from backend.app.models.models import (
    PlacementDrive,
    DriveRound,
    Company,
    JobRole,
    Student,
    Competency,
    Application,
    ApplicationStageHistory,
    InterviewSchedule,
    RecruiterFeedback,
    SelectionDecision,
    EligibilityDecision,
)
from backend.app.services.eligibility_service import EligibilityService
from backend.app.services.audit_service import AuditService

VALID_APPLICATION_STATUSES = [
    "applied",
    "under_review",
    "shortlisted",
    "assessment_scheduled",
    "interview_scheduled",
    "selected",
    "not_selected",
    "withdrawn",
]

ALLOWED_TRANSITIONS = {
    "applied": {"under_review", "shortlisted", "not_selected", "withdrawn"},
    "under_review": {"shortlisted", "assessment_scheduled", "not_selected", "withdrawn"},
    "shortlisted": {"assessment_scheduled", "interview_scheduled", "not_selected", "withdrawn"},
    "assessment_scheduled": {"interview_scheduled", "shortlisted", "not_selected", "withdrawn"},
    "interview_scheduled": {"selected", "not_selected", "withdrawn"},
    "selected": set(),
    "not_selected": set(),
    "withdrawn": set(),
}


class DriveService:
    @staticmethod
    def create_drive(
        db: Session,
        college_id: str,
        company_id: str,
        job_role_id: str,
        title: str,
        day_of_week: str = "Wed",
        activity: str = "Campus Drive",
        description: Optional[str] = None,
        drive_date: Optional[str] = None,
        time_slot: Optional[str] = "10:00 AM - 01:00 PM",
        room: Optional[str] = "Auditorium A",
        application_deadline: Optional[datetime] = None,
        selection_stages: Optional[List[str]] = None,
        publish_immediately: bool = False,
        actor: str = "T&P Officer",
        actor_role: str = "officer",
    ) -> PlacementDrive:
        if publish_immediately and actor_role not in ["officer", "university_admin"]:
            raise PermissionError("Unauthorized: Only placement officers or university admins can publish a drive.")

        # Check for room/time-slot clash on same day/date
        existing_drives = db.query(PlacementDrive).filter(PlacementDrive.college_id == college_id).all()
        has_clash = any(
            (d.day_of_week == day_of_week and (not room or d.room == room) and (not time_slot or d.time_slot == time_slot))
            for d in existing_drives
        )

        drive = PlacementDrive(
            college_id=college_id,
            company_id=company_id,
            job_role_id=job_role_id,
            title=title,
            description=description,
            day_of_week=day_of_week,
            activity=activity,
            drive_date=drive_date,
            time_slot=time_slot,
            room=room,
            application_deadline=application_deadline,
            selection_stages=selection_stages or [
                "Application Received",
                "Eligibility Confirmed",
                "Resume Review",
                "Aptitude Test",
                "Coding Assessment",
                "Technical Interview",
                "HR Interview",
                "Final Decision",
            ],
            status="published" if publish_immediately else "draft",
            published=publish_immediately,
            published_at=datetime.utcnow() if publish_immediately else None,
            has_clash=has_clash,
        )
        db.add(drive)
        db.flush()

        for idx, stage_name in enumerate(drive.selection_stages or [], start=1):
            db.add(
                DriveRound(
                    drive_id=drive.id,
                    college_id=college_id,
                    round_order=idx,
                    name=stage_name,
                    round_type="interview" if "interview" in stage_name.lower() else "assessment",
                    room=room,
                    time_slot=time_slot,
                    scheduled_date=drive_date,
                )
            )

        db.commit()
        db.refresh(drive)

        AuditService.log_event(
            db=db,
            college_id=college_id,
            actor=actor,
            action=f"Created campus drive '{title}' (published={publish_immediately}, clash={has_clash})",
        )
        return drive

    @staticmethod
    def publish_drive(
        db: Session,
        drive_id: str,
        college_id: str,
        actor: str,
        actor_role: str,
    ) -> PlacementDrive:
        if actor_role not in ["officer", "university_admin"]:
            raise PermissionError("Unauthorized: Only placement officers or university admins can publish drives.")

        drive = db.query(PlacementDrive).filter(
            PlacementDrive.id == drive_id,
            PlacementDrive.college_id == college_id,
        ).first()
        if not drive:
            raise ValueError("Drive not found in college")

        drive.published = True
        drive.status = "published"
        drive.published_at = datetime.utcnow()
        db.commit()
        db.refresh(drive)

        AuditService.log_event(
            db=db,
            college_id=college_id,
            actor=actor,
            action=f"Published campus drive '{drive.title}'",
        )
        return drive

    @staticmethod
    def apply_to_drive(db: Session, drive_id: str, student_id: str) -> Application:
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise ValueError("Student not found")

        drive = db.query(PlacementDrive).filter(
            PlacementDrive.id == drive_id,
            PlacementDrive.college_id == student.college_id,
        ).first()
        if not drive:
            raise ValueError("Campus drive not found for student's college")

        if not drive.published:
            raise ValueError("Cannot apply: Drive is not published yet.")

        if drive.application_deadline and datetime.utcnow() > drive.application_deadline:
            raise ValueError("Application deadline has passed.")

        existing = db.query(Application).filter(
            Application.drive_id == drive_id,
            Application.student_id == student_id,
        ).first()
        if existing and existing.status != "withdrawn":
            raise ValueError("Duplicate application: Student has already applied to this drive.")

        eligibility = EligibilityService.evaluate_student_for_job(
            db, student_id, drive.job_role_id, drive_id=drive.id
        )
        if not eligibility["eligible"]:
            raise ValueError(f"Not eligible to apply (status: {eligibility['status']}). Submit an appeal if records need correction.")

        verified_comps = (
            db.query(Competency)
            .filter(Competency.student_id == student_id, Competency.state == "verified")
            .all()
        )
        verified_str = ", ".join(c.skill_name for c in verified_comps)

        if existing and existing.status == "withdrawn":
            existing.status = "applied"
            existing.stage = "Application Received"
            existing.withdrawn_at = None
            app = existing
        else:
            app = Application(
                college_id=student.college_id,
                drive_id=drive_id,
                job_role_id=drive.job_role_id,
                student_id=student_id,
                student_name=student.name,
                branch=student.branch,
                verified_skills=verified_str,
                stage="Application Received",
                status="applied",
                stage_index=0,
            )
            db.add(app)
            db.flush()

        db.add(
            ApplicationStageHistory(
                application_id=app.id,
                college_id=student.college_id,
                previous_status="not_applied",
                new_status="applied",
                actor=student.name,
                reason="Student submitted drive application",
            )
        )
        db.commit()
        db.refresh(app)

        AuditService.log_event(
            db=db,
            college_id=student.college_id,
            actor=student.name,
            action=f"Applied to campus drive '{drive.title}'",
        )
        return app

    @staticmethod
    def withdraw_application(db: Session, application_id: str, student_id: str) -> Application:
        app = db.query(Application).filter(Application.id == application_id).first()
        if not app:
            raise ValueError("Application not found")
        if app.student_id != student_id:
            raise PermissionError("Unauthorized: Cannot withdraw another student's application.")
        if app.status in ["selected", "withdrawn"]:
            raise ValueError(f"Cannot withdraw application in '{app.status}' state.")

        prev_status = app.status
        app.status = "withdrawn"
        app.withdrawn_at = datetime.utcnow()

        db.add(
            ApplicationStageHistory(
                application_id=app.id,
                college_id=app.college_id,
                previous_status=prev_status,
                new_status="withdrawn",
                actor=app.student_name,
                reason="Withdrawn by student",
            )
        )
        db.commit()
        db.refresh(app)
        return app

    @staticmethod
    def advance_selection_stage(
        db: Session,
        application_id: str,
        new_status: str,
        actor: str,
        actor_role: str,
        college_id: str,
        reason: Optional[str] = None,
    ) -> Application:
        if actor_role not in ["officer", "recruiter", "university_admin"]:
            raise PermissionError("Unauthorized role to update selection stage.")

        if new_status not in VALID_APPLICATION_STATUSES:
            raise ValueError(f"Invalid status '{new_status}'")

        app = db.query(Application).filter(
            Application.id == application_id,
            Application.college_id == college_id,
        ).first()
        if not app:
            raise ValueError("Application not found in college")

        prev_status = app.status or "applied"
        allowed = ALLOWED_TRANSITIONS.get(prev_status, set())
        if new_status not in allowed:
            raise ValueError(f"Invalid stage transition: '{prev_status}' -> '{new_status}' is not permitted.")

        app.status = new_status
        app.stage = new_status.replace("_", " ").title()
        if new_status == "shortlisted":
            app.stage_index = max(app.stage_index, 0)
        elif new_status == "interview_scheduled":
            app.stage_index = max(app.stage_index, 1)
        elif new_status == "selected":
            app.stage_index = 3
            app.officer_approved_offer = (actor_role in ["officer", "university_admin"])

        db.add(
            ApplicationStageHistory(
                application_id=app.id,
                college_id=college_id,
                previous_status=prev_status,
                new_status=new_status,
                actor=actor,
                reason=reason or f"Moved to {new_status}",
            )
        )
        db.commit()
        db.refresh(app)

        AuditService.log_event(
            db=db,
            college_id=college_id,
            actor=actor,
            action=f"Application {app.id} ({app.student_name}) transitioned: {prev_status} -> {new_status}",
        )
        return app

    @staticmethod
    def schedule_interview(
        db: Session,
        drive_id: str,
        application_id: str,
        college_id: str,
        round_name: str,
        interviewer: str,
        scheduled_date: str,
        time_slot: str,
        room: str,
        actor: str = "T&P Officer",
    ) -> InterviewSchedule:
        app = db.query(Application).filter(
            Application.id == application_id,
            Application.college_id == college_id,
        ).first()
        if not app:
            raise ValueError("Application not found in college")

        # Detect scheduling conflicts: room conflict or student conflict on same date+time_slot
        existing = db.query(InterviewSchedule).filter(
            InterviewSchedule.college_id == college_id,
            InterviewSchedule.scheduled_date == scheduled_date,
            InterviewSchedule.time_slot == time_slot,
            InterviewSchedule.status == "scheduled",
        ).all()

        for ex in existing:
            if ex.room.lower() == room.lower():
                raise ValueError(f"Scheduling conflict: Room '{room}' is already booked on {scheduled_date} at {time_slot}.")
            if ex.student_id == app.student_id:
                raise ValueError(f"Scheduling conflict: Student {app.student_name} already has an interview at {time_slot} on {scheduled_date}.")

        sched = InterviewSchedule(
            drive_id=drive_id,
            application_id=application_id,
            student_id=app.student_id,
            college_id=college_id,
            round_name=round_name,
            interviewer=interviewer,
            scheduled_date=scheduled_date,
            time_slot=time_slot,
            room=room,
            status="scheduled",
        )
        db.add(sched)
        db.commit()
        db.refresh(sched)

        AuditService.log_event(
            db=db,
            college_id=college_id,
            actor=actor,
            action=f"Scheduled {round_name} for {app.student_name} on {scheduled_date} ({time_slot}, {room})",
        )
        return sched

    @staticmethod
    def submit_recruiter_feedback(
        db: Session,
        application_id: str,
        college_id: str,
        recruiter_name: str,
        round_name: str,
        rating: int,
        strengths: str,
        concerns: str,
        recommendation: str = "advance",
    ) -> RecruiterFeedback:
        app = db.query(Application).filter(
            Application.id == application_id,
            Application.college_id == college_id,
        ).first()
        if not app:
            raise ValueError("Application not found in college")

        fb = RecruiterFeedback(
            application_id=application_id,
            drive_id=app.drive_id,
            college_id=college_id,
            recruiter_name=recruiter_name,
            round_name=round_name,
            rating=rating,
            strengths=strengths,
            concerns=concerns,
            recommendation=recommendation,
            is_private=True,
        )
        db.add(fb)
        db.commit()
        db.refresh(fb)
        return fb

    @staticmethod
    def record_selection_decision(
        db: Session,
        application_id: str,
        college_id: str,
        decision: str,  # selected, not_selected, waitlisted
        decided_by: str,
        actor_role: str,
        package_ctc: Optional[str] = None,
        notes: Optional[str] = None,
    ) -> SelectionDecision:
        if actor_role not in ["officer", "recruiter", "university_admin"]:
            raise PermissionError("Unauthorized role to record selection decisions.")

        existing = db.query(SelectionDecision).filter(SelectionDecision.application_id == application_id).first()
        if existing:
            raise ValueError("Duplicate decision: A final selection decision already exists for this application.")

        app = db.query(Application).filter(
            Application.id == application_id,
            Application.college_id == college_id,
        ).first()
        if not app:
            raise ValueError("Application not found in college")

        sel = SelectionDecision(
            application_id=application_id,
            drive_id=app.drive_id,
            college_id=college_id,
            decision=decision,
            package_ctc=package_ctc,
            decided_by=decided_by,
            officer_approved=(actor_role in ["officer", "university_admin"]),
            notes=notes,
        )
        db.add(sel)

        if decision in ["selected", "not_selected"]:
            prev = app.status or "interview_scheduled"
            app.status = decision
            app.stage = "Accepted" if decision == "selected" else "Not Selected"
            app.stage_index = 3 if decision == "selected" else app.stage_index
            db.add(
                ApplicationStageHistory(
                    application_id=app.id,
                    college_id=college_id,
                    previous_status=prev,
                    new_status=decision,
                    actor=decided_by,
                    reason=notes or f"Final selection decision: {decision}",
                )
            )

        db.commit()
        db.refresh(sel)

        AuditService.log_event(
            db=db,
            college_id=college_id,
            actor=decided_by,
            action=f"Recorded final decision '{decision}' for application {application_id}",
        )
        return sel

    @staticmethod
    def get_placement_analytics(db: Session, college_id: str) -> Dict[str, Any]:
        drives = db.query(PlacementDrive).filter(PlacementDrive.college_id == college_id).all()
        apps = db.query(Application).filter(Application.college_id == college_id).all()
        decisions = db.query(EligibilityDecision).filter(EligibilityDecision.college_id == college_id).all()

        drive_metrics = []
        for d in drives:
            d_apps = [a for a in apps if a.drive_id == d.id and a.status != "withdrawn"]
            d_decs = [dec for dec in decisions if dec.drive_id == d.id]
            eligible_cnt = sum(1 for dec in d_decs if dec.eligible)
            shortlisted_cnt = sum(1 for a in d_apps if a.status in ["shortlisted", "interview_scheduled", "selected"])
            selected_cnt = sum(1 for a in d_apps if a.status == "selected")
            drive_metrics.append({
                "drive_id": d.id,
                "title": d.title,
                "eligible_students": eligible_cnt,
                "applications_received": len(d_apps),
                "shortlisted": shortlisted_cnt,
                "selected": selected_cnt,
                "conversion_rate_pct": round((len(d_apps) / eligible_cnt) * 100, 1) if eligible_cnt > 0 else 0.0,
                "shortlist_rate_pct": round((shortlisted_cnt / len(d_apps)) * 100, 1) if d_apps else 0.0,
            })

        # Stage distribution
        stage_dist: Dict[str, int] = {}
        dept_dist: Dict[str, int] = {}
        for a in apps:
            stage_dist[a.status or "applied"] = stage_dist.get(a.status or "applied", 0) + 1
            dept_dist[a.branch or "CSE"] = dept_dist.get(a.branch or "CSE", 0) + 1

        # Common reasons for ineligibility
        reason_counts: Dict[str, int] = {}
        for dec in decisions:
            if not dec.eligible:
                for cond in (dec.failed_conditions or []):
                    reason_counts[cond] = reason_counts.get(cond, 0) + 1

        top_reasons = sorted(
            [{"reason": k, "count": v} for k, v in reason_counts.items()],
            key=lambda x: x["count"],
            reverse=True,
        )[:5]

        return {
            "college_id": college_id,
            "data_type": "Observed Historical Placement Outcomes",
            "total_drives": len(drives),
            "total_applications": len(apps),
            "drive_metrics": drive_metrics,
            "stage_distribution": stage_dist,
            "department_participation": dept_dist,
            "common_ineligibility_reasons": top_reasons,
        }

    @staticmethod
    def export_analytics_csv(db: Session, college_id: str) -> str:
        analytics = DriveService.get_placement_analytics(db, college_id)
        buf = io.StringIO()
        writer = csv.writer(buf)
        writer.writerow(["Drive ID", "Title", "Eligible Students", "Applications", "Shortlisted", "Selected", "Conversion %", "Shortlist %"])
        for m in analytics["drive_metrics"]:
            writer.writerow([
                m["drive_id"],
                m["title"],
                m["eligible_students"],
                m["applications_received"],
                m["shortlisted"],
                m["selected"],
                m["conversion_rate_pct"],
                m["shortlist_rate_pct"],
            ])
        return buf.getvalue()
