import unittest
from datetime import datetime, timedelta
from fastapi import HTTPException
from backend.app.database import SessionLocal
from backend.app.models.models import (
    College,
    Student,
    User,
    Competency,
    AssessmentAttempt,
    Company,
    JobRole,
    PlacementDrive,
    EligibilityRule,
    EligibilityDecision,
    Application,
    CompanyCollegeAccess,
    InterviewSchedule,
)
from backend.app.services.company_job_service import CompanyJobService
from backend.app.services.eligibility_service import EligibilityService
from backend.app.services.matching_service import MatchingService
from backend.app.services.drive_service import DriveService
from backend.app.services.communication_service import CommunicationService
from backend.app.routers.eligibility import evaluate_cohort_for_drive
from backend.app.routers.recruiter import get_authorized_opportunities


class TestPhase6PlacementMatching(unittest.TestCase):
    def setUp(self):
        self.db = SessionLocal()
        for cid, code, name in [("COLLEGE-A", "COL-A", "College A"), ("COLLEGE-B", "COL-B", "College B")]:
            if not self.db.query(College).filter(College.id == cid).first():
                self.db.add(College(id=cid, code=code, name=name, city="City", state="State"))
        self.db.commit()

        self.sid = "student-p6-test"
        st = self.db.query(Student).filter(Student.id == self.sid).first()
        if st:
            self.db.query(Competency).filter(Competency.student_id == self.sid).delete()
            self.db.query(Application).filter(Application.student_id == self.sid).delete()
            self.db.query(InterviewSchedule).filter(InterviewSchedule.student_id == self.sid).delete()
            self.db.commit()
            st.cgpa = 8.2
            st.backlogs = 0
            st.branch = "CSE"
            self.db.commit()
        else:
            st = Student(
                id=self.sid,
                college_id="COLLEGE-A",
                name="Phase6 Student",
                branch="CSE",
                cgpa=8.2,
                backlogs=0,
            )
            self.db.add(st)
            self.db.commit()
        self.student = st

        self.company = CompanyJobService.create_company(
            self.db, name="Phase6 Cloud Corp", industry="Cloud", college_id="COLLEGE-A"
        )
        self.job = CompanyJobService.create_job_opportunity(
            self.db,
            company_id=self.company.id,
            title="Backend Systems Engineer",
            description="Looking for Python and SQL with Docker experience.",
            min_cgpa=7.5,
            max_backlogs=0,
            required_skills=["Python", "SQL"],
            preferred_skills=["Docker"],
            eligible_departments=["CSE", "IT"],
            eligible_grad_years=[2026],
            min_assessment_score=0.0,
            college_id="COLLEGE-A",
        )

    def tearDown(self):
        self.db.close()

    # --- 1. Eligibility Tests ---
    def test_eligibility_pass_fail_missing_pending_and_versioning(self):
        # Pending verification when competencies not verified yet
        ev_pending = EligibilityService.evaluate_student_for_job(self.db, self.sid, self.job.id)
        self.assertEqual(ev_pending["status"], "pending_verification")
        self.assertFalse(ev_pending["eligible"])

        # Add verified competencies -> Passes all rules
        for sk in ["Python", "SQL"]:
            self.db.add(
                Competency(
                    student_id=self.sid,
                    college_id="COLLEGE-A",
                    skill_name=sk,
                    state="verified",
                    verified_by="Prof. Test",
                    expires_at=datetime.utcnow() + timedelta(days=180),
                )
            )
        self.db.commit()

        ev_pass = EligibilityService.evaluate_student_for_job(self.db, self.sid, self.job.id)
        self.assertTrue(ev_pass["eligible"])
        self.assertEqual(ev_pass["status"], "eligible")
        v1_decision_id = ev_pass["decision_id"]

        # Create versioned rule v2 with min_cgpa = 8.5 -> student fails mandatory rule, but v1 decision keeps rule_version=1
        rule_v1 = EligibilityService.create_versioned_rule(
            self.db, "COLLEGE-A", "Rule v1", min_cgpa=7.5, max_backlogs=0, required_skills=["Python", "SQL"], job_role_id=self.job.id
        )
        rule_v2 = EligibilityService.create_versioned_rule(
            self.db, "COLLEGE-A", "Rule v2", min_cgpa=8.5, max_backlogs=0, required_skills=["Python", "SQL"], job_role_id=self.job.id
        )
        self.assertGreater(rule_v2.version, rule_v1.version)

        ev_fail = EligibilityService.evaluate_student_for_job(self.db, self.sid, self.job.id)
        self.assertFalse(ev_fail["eligible"])
        self.assertEqual(ev_fail["status"], "not_eligible")
        self.assertEqual(ev_fail["rule_version"], rule_v2.version)

        # Historical evaluation preserves original rule version
        old_dec = self.db.query(EligibilityDecision).filter(EligibilityDecision.id == v1_decision_id).first()
        self.assertEqual(old_dec.rule_version, 1)

        # Missing academic info -> needs_manual_review (not silently failed)
        self.student.cgpa = 0.0
        self.db.commit()
        ev_missing = EligibilityService.evaluate_student_for_job(self.db, self.sid, self.job.id)
        self.assertEqual(ev_missing["status"], "needs_manual_review")

        # Appeal + officer correction -> student meets rule after authorized correction
        appeal = EligibilityService.submit_appeal(self.db, ev_missing["decision_id"], self.sid, "CGPA updated in university portal")
        rev = EligibilityService.review_appeal(
            self.db,
            appeal.id,
            "COLLEGE-A",
            "T&P Officer",
            action="approved",
            reviewer_notes="Verified against registrar transcript",
            corrected_data={"cgpa": 8.7},
        )
        self.assertTrue(rev["recalculated_eligibility"]["eligible"])

        # Invalid rule configuration rejected
        with self.assertRaises(ValueError):
            EligibilityService.create_versioned_rule(self.db, "COLLEGE-A", "Bad Rule", min_cgpa=12.0)

    # --- 2. Matching Tests ---
    def test_matching_alignment_expired_insufficient_data_and_disclaimer(self):
        self.db.add(Competency(student_id=self.sid, college_id="COLLEGE-A", skill_name="Python", state="verified", verified_by="Prof", expires_at=datetime.utcnow() + timedelta(days=90)))
        self.db.add(Competency(student_id=self.sid, college_id="COLLEGE-A", skill_name="SQL", state="verified", verified_by="Prof", expires_at=datetime.utcnow() - timedelta(days=2)))  # Expired
        self.db.add(Competency(student_id=self.sid, college_id="COLLEGE-A", skill_name="Docker", state="evidence_linked"))
        self.db.commit()

        match = MatchingService.calculate_student_job_match(self.db, self.sid, self.job.id)
        self.assertIn("SQL", match["expired_skills"])
        self.assertIn("Docker", match["preferred_skills_satisfied"])
        self.assertEqual(match["data_sufficiency"], "insufficient_assessment_data")
        self.assertIn("not a probability of selection", match["disclaimer"].lower())

        # Eligible students are never hidden in job matching
        cohort_match = MatchingService.get_matching_students_for_job(self.db, "COLLEGE-A", self.job.id)
        self.assertGreater(cohort_match["total_students_evaluated"], 0)

    # --- 3. Campus Drives, Deadlines, Withdrawals & Stage Transitions ---
    def test_drive_lifecycle_deadlines_transitions_and_conflicts(self):
        # Unauthorized user cannot publish drive
        with self.assertRaises(PermissionError):
            DriveService.create_drive(
                self.db, "COLLEGE-A", self.company.id, self.job.id, "Unauthorized Drive",
                publish_immediately=True, actor="Student", actor_role="student"
            )

        # Create published drive with active deadline
        drive = DriveService.create_drive(
            self.db,
            college_id="COLLEGE-A",
            company_id=self.company.id,
            job_role_id=self.job.id,
            title="Phase6 Cloud Drive",
            day_of_week="Fri",
            drive_date="2026-12-20",
            time_slot="10:00 AM",
            room="Hall-1",
            application_deadline=datetime.utcnow() + timedelta(days=5),
            publish_immediately=True,
            actor="T&P Officer",
            actor_role="officer",
        )

        # Make student eligible
        for sk in ["Python", "SQL"]:
            self.db.add(Competency(student_id=self.sid, college_id="COLLEGE-A", skill_name=sk, state="verified", verified_by="Prof", expires_at=datetime.utcnow() + timedelta(days=90)))
        self.db.commit()

        app = DriveService.apply_to_drive(self.db, drive.id, self.sid)
        self.assertEqual(app.status, "applied")

        # Duplicate application prevented
        with self.assertRaises(ValueError):
            DriveService.apply_to_drive(self.db, drive.id, self.sid)

        # Valid stage transition: applied -> shortlisted -> interview_scheduled
        app = DriveService.advance_selection_stage(self.db, app.id, "shortlisted", "T&P Officer", "officer", "COLLEGE-A")
        self.assertEqual(app.status, "shortlisted")

        # Invalid stage transition: shortlisted -> selected (skipping interview)
        with self.assertRaises(ValueError):
            DriveService.advance_selection_stage(self.db, app.id, "selected", "T&P Officer", "officer", "COLLEGE-A")

        # Schedule interview + conflict detection
        sched = DriveService.schedule_interview(
            self.db, drive.id, app.id, "COLLEGE-A", "Technical Round 1", "Lead Eng", "2026-12-22", "11:00 AM", "Room 101"
        )
        self.assertEqual(sched.status, "scheduled")
        with self.assertRaises(ValueError):
            DriveService.schedule_interview(
                self.db, drive.id, app.id, "COLLEGE-A", "Technical Round 2", "Manager", "2026-12-22", "11:00 AM", "Room 101"
            )

        # Withdraw application
        withdrawn = DriveService.withdraw_application(self.db, app.id, self.sid)
        self.assertEqual(withdrawn.status, "withdrawn")

        # Expired deadline enforcement
        drive.application_deadline = datetime.utcnow() - timedelta(hours=1)
        self.db.commit()
        with self.assertRaises(ValueError):
            DriveService.apply_to_drive(self.db, drive.id, self.sid)

    # --- 4. Permissions, Overrides & Multi-Tenancy ---
    def test_permissions_overrides_and_tenant_isolation(self):
        dec = EligibilityService.evaluate_student_for_job(self.db, self.sid, self.job.id)
        # Officer override requires a reason
        with self.assertRaises(ValueError):
            EligibilityService.officer_override_decision(self.db, dec["decision_id"], "COLLEGE-A", "Officer", True, "")

        overridden = EligibilityService.officer_override_decision(self.db, dec["decision_id"], "COLLEGE-A", "Officer", True, "Approved exceptional case")
        self.assertTrue(overridden.eligible)

        # Cross-college isolation for officer & recruiter
        officer_b = User(id="off-b-p6", email="off@b.edu", full_name="Officer B", role="officer", college_id="COLLEGE-B")
        recruiter_b = User(id="rec-b-p6", email="rec@b.com", full_name="Recruiter B", role="recruiter", college_id="COLLEGE-B")

        drive = DriveService.create_drive(
            self.db, "COLLEGE-A", self.company.id, self.job.id, "Tenant Test Drive", publish_immediately=True
        )
        with self.assertRaises(HTTPException) as ctx1:
            evaluate_cohort_for_drive(drive_id=drive.id, college_id="COLLEGE-A", db=self.db, current_user=officer_b)
        self.assertEqual(ctx1.exception.status_code, 403)

        with self.assertRaises(HTTPException) as ctx2:
            get_authorized_opportunities(college_id="COLLEGE-A", db=self.db, current_user=recruiter_b)
        self.assertEqual(ctx2.exception.status_code, 403)

        # Recruiter sees authorized opportunities for College A
        auth_opps = get_authorized_opportunities(college_id="COLLEGE-A", db=self.db, current_user=None)
        self.assertGreater(len(auth_opps), 0)

    # --- 5. Bulk Communication Tests ---
    def test_bulk_communication_preview_simulated_failure_and_logs(self):
        preview = CommunicationService.preview_bulk_email(
            self.db, college_id="COLLEGE-A", audience_filter="cohort", template_type="drive_announcement", drive_title="Acme Drive"
        )
        self.assertEqual(preview["provider_mode"], "simulated_preview")
        self.assertGreater(preview["recipient_count"], 0)
        # No duplicate recipient emails
        emails = [r["email"].lower() for r in preview["recipients"]]
        self.assertEqual(len(emails), len(set(emails)))

        # Send without SMTP configured -> recorded as preview_simulated (never claims sent)
        sent_res = CommunicationService.send_bulk_communication(
            self.db, college_id="COLLEGE-A", sender="T&P Officer", sender_role="officer", audience_filter="cohort", drive_title="Acme Drive"
        )
        self.assertEqual(sent_res["status"], "preview_simulated")

        # Delivery failure handling
        fail_res = CommunicationService.send_bulk_communication(
            self.db, college_id="COLLEGE-A", sender="T&P Officer", sender_role="officer", audience_filter="cohort", simulate_delivery_failure=True
        )
        self.assertEqual(fail_res["status"], "failed")


if __name__ == "__main__":
    unittest.main()
