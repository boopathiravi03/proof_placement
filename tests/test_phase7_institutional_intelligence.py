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
    CompanyCollegeAccess,
    PlacementDrive,
    Application,
    SelectionDecision,
    UniversityCollegeAccess,
)
from backend.app.services.institutional_intelligence_service import InstitutionalIntelligenceService
from backend.app.services.accreditation_report_service import AccreditationReportService
from backend.app.services.university_service import UniversityService
from backend.app.routers.intelligence import get_institutional_overview, generate_accreditation_report, GenerateReportRequest
from backend.app.routers.university import get_authorized_university_overview


class TestPhase7InstitutionalIntelligence(unittest.TestCase):
    def setUp(self):
        self.db = SessionLocal()
        for cid, code, name in [("COLLEGE-A", "COL-A", "College A"), ("COLLEGE-B", "COL-B", "College B")]:
            if not self.db.query(College).filter(College.id == cid).first():
                self.db.add(College(id=cid, code=code, name=name, city="City", state="State"))
        self.db.commit()

        # Ensure deterministic test student with missing academic field & expired skill to test data-quality checks
        self.sid = "student-p7-dq"
        st = self.db.query(Student).filter(Student.id == self.sid).first()
        if not st:
            st = Student(
                id=self.sid,
                college_id="COLLEGE-A",
                roll_number="22CS999",
                name="Phase7 DQ Student",
                branch="CSE",
                cgpa=0.0,  # Missing academic record
                backlogs=0,
            )
            self.db.add(st)
            self.db.commit()

        # Expired competency
        if not self.db.query(Competency).filter(Competency.student_id == self.sid, Competency.skill_name == "SQL").first():
            self.db.add(
                Competency(
                    student_id=self.sid,
                    college_id="COLLEGE-A",
                    skill_name="SQL",
                    state="verified",
                    verified_by="Prof",
                    expires_at=datetime.utcnow() - timedelta(days=10),
                )
            )
            self.db.commit()

    def tearDown(self):
        self.db.close()

    def test_institutional_overview_filters_and_data_quality(self):
        ov = InstitutionalIntelligenceService.get_institutional_overview(
            self.db, "COLLEGE-A", branch="CSE", reporting_period="2025-2026"
        )
        self.assertEqual(ov["reporting_period"], "2025-2026")
        self.assertGreater(ov["kpis"]["total_registered_students"], 0)
        check_names = [w["check_name"] for w in ov["data_quality_warnings"]]
        self.assertIn("Missing Academic Records", check_names)
        self.assertIn("Expired Competency Evidence", check_names)

        # Metric definitions present
        defs = InstitutionalIntelligenceService.get_metric_definitions(self.db)
        self.assertGreaterEqual(len(defs), 4)

    def test_industry_skill_demand_separates_approved_vs_ai_pending(self):
        comp = Company(name="P7 Tech", industry="AI")
        self.db.add(comp)
        self.db.flush()
        self.db.add(CompanyCollegeAccess(company_id=comp.id, college_id="COLLEGE-A", authorized=True))
        job = JobRole(
            company_id=comp.id,
            title="AI Engineer",
            required_skills=["Python"],
            ai_extracted_skills=["Kubernetes"],
            extracted_approved=False,
        )
        self.db.add(job)
        self.db.commit()

        demand = InstitutionalIntelligenceService.get_industry_skill_demand(self.db, "COLLEGE-A")
        approved_skills = [d["skill"] for d in demand["approved_skill_demand"]]
        pending_skills = [p["skill"] for p in demand["ai_extracted_pending_review"]]
        self.assertIn("Python", approved_skills)
        self.assertIn("Kubernetes", pending_skills)

    def test_predictive_insights_insufficient_data_and_neutral_early_warnings(self):
        pred = InstitutionalIntelligenceService.get_predictive_and_early_warning_insights(self.db, "COLLEGE-A")
        self.assertFalse(pred["predictive_model_enabled"])
        self.assertIn("Insufficient historical placement outcome labels", pred["model_status_explanation"])
        for ind in pred["early_warning_indicators"]:
            self.assertNotIn("failure", ind["status_label"].lower())
            self.assertNotIn("unsuitable", ind["status_label"].lower())

    def test_placement_performance_denominators(self):
        perf = InstitutionalIntelligenceService.get_placement_performance_analytics(self.db, "COLLEGE-A")
        self.assertIn("application_to_shortlist_denominator", perf["conversions"])
        self.assertIn("shortlist_to_selection_denominator", perf["conversions"])
        self.assertIn("accepted_offers", perf["funnel"])

    def test_accreditation_report_generation_exports_and_disclaimer(self):
        rep = AccreditationReportService.generate_report(
            self.db, "COLLEGE-A", report_type="NAAC_NIRF_PLACEMENT", reporting_period="2025-2026", generated_by="T&P Officer", actor_role="officer"
        )
        self.assertIn("not officially certified or endorsed by NAAC or NIRF", rep.disclaimer)

        csv_out = AccreditationReportService.export_report_csv(self.db, rep.id, "COLLEGE-A")
        self.assertIn("NAAC_NIRF_PLACEMENT", csv_out)
        self.assertIn("2025-2026", csv_out)

        pdf_bytes = AccreditationReportService.export_report_pdf_bytes(self.db, rep.id, "COLLEGE-A")
        self.assertTrue(pdf_bytes.startswith(b"%PDF-1.4"))

        history = AccreditationReportService.list_reports(self.db, "COLLEGE-A")
        self.assertTrue(any(r["id"] == rep.id for r in history))

        # Unauthorized student cannot generate report
        with self.assertRaises(PermissionError):
            AccreditationReportService.generate_report(self.db, "COLLEGE-A", actor_role="student")

    def test_university_governance_and_tenant_isolation(self):
        officer_b = User(id="p7-off-b", email="off@b.edu", full_name="Officer B", role="officer", college_id="COLLEGE-B")
        recruiter = User(id="p7-rec", email="rec@a.com", full_name="Recruiter", role="recruiter", college_id="COLLEGE-A")
        uni_admin = User(id="p7-uni", email="uni@edu.org", full_name="Uni Admin", role="university_admin", college_id="COLLEGE-A")

        # Officer B cannot read College A overview
        with self.assertRaises(HTTPException) as ctx1:
            get_institutional_overview(college_id="COLLEGE-A", db=self.db, current_user=officer_b)
        self.assertEqual(ctx1.exception.status_code, 403)

        # Recruiter cannot access university overview
        with self.assertRaises(HTTPException) as ctx2:
            get_authorized_university_overview(db=self.db, current_user=recruiter)
        self.assertEqual(ctx2.exception.status_code, 403)

        # College officer cannot access cross-college university analytics
        with self.assertRaises(HTTPException) as ctx3:
            get_authorized_university_overview(db=self.db, current_user=officer_b)
        self.assertEqual(ctx3.exception.status_code, 403)

        # University admin scoped to COLLEGE-A only sees COLLEGE-A
        if not self.db.query(UniversityCollegeAccess).filter(UniversityCollegeAccess.university_user_id == uni_admin.id).first():
            self.db.add(UniversityCollegeAccess(university_user_id=uni_admin.id, college_id="COLLEGE-A", authorized=True))
            self.db.commit()

        uni_res = get_authorized_university_overview(db=self.db, current_user=uni_admin)
        col_ids = [c["college_id"] for c in uni_res["colleges"]]
        self.assertEqual(col_ids, ["COLLEGE-A"])


if __name__ == "__main__":
    unittest.main()
