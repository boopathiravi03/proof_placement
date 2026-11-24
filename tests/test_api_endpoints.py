import unittest
from backend.app.database import SessionLocal
from backend.app.routers.competencies import get_student_competency_profile, add_evidence
from backend.app.routers.readiness import get_student_readiness
from backend.app.routers.assessments import get_next_adaptive_question
from backend.app.routers.eligibility import check_eligibility
from backend.app.routers.officer import get_cohort_insights
from backend.app.routers.university import get_colleges_summary
from backend.app.routers.audit import get_audit_trail
from backend.app.schemas.schemas import EvidenceCreate, EligibilityCheckRequest

class TestAPIRoutersDirect(unittest.TestCase):
    def setUp(self):
        self.db = SessionLocal()

    def tearDown(self):
        self.db.close()

    def test_competency_router(self):
        res = get_student_competency_profile("student-rahul-01", db=self.db)
        self.assertEqual(res["student"]["name"], "Rahul K.")
        self.assertTrue(len(res["competencies"]) >= 4)

    def test_add_evidence_router(self):
        payload = EvidenceCreate(
            student_id="student-rahul-01",
            skill_name="SQL",
            kind="lab",
            title="DBMS Lab Work",
            ref_url="https://proofhire.internal/lab/sql"
        )
        res = add_evidence(payload, db=self.db)
        self.assertTrue(res["success"])
        self.assertEqual(res["skill_name"], "SQL")

    def test_adaptive_question_router(self):
        q = get_next_adaptive_question(category="SQL", level=2, exclude=None, db=self.db)
        self.assertIsNotNone(q)
        self.assertEqual(q.category, "SQL")

    def test_readiness_router(self):
        res = get_student_readiness("student-rahul-01", role="Backend", db=self.db)
        self.assertIn("overall_score", res)
        self.assertIn("breakdown", res)
        self.assertIn("verified_competencies", res["breakdown"])

    def test_eligibility_router(self):
        payload = EligibilityCheckRequest(
            rules={"version": 3, "min_cgpa": 7.0, "max_backlogs": 0, "required_skills": ["SQL"]},
            student={"cgpa": 7.8, "backlogs": 1, "verified_skills": ["Python"]}
        )
        res = check_eligibility(payload, student_id="student-rahul-01", college_id="COLLEGE-A", db=self.db)
        self.assertFalse(res["eligible"])
        self.assertEqual(res["rule_version"], 3)

    def test_officer_cohort_insights_router(self):
        res = get_cohort_insights("COLLEGE-A")
        self.assertIn("kpis", res)
        self.assertIn("heatmap", res)
        self.assertIn("CSE", res["heatmap"])

    def test_university_summary_router(self):
        res = get_colleges_summary()
        self.assertEqual(len(res["colleges"]), 3)
        self.assertIn("Strict Tenant Isolation", res["tenant_policy"])

    def test_audit_trail_router(self):
        res = get_audit_trail("COLLEGE-A", db=self.db)
        self.assertTrue(res["chain_intact"])
        self.assertTrue(res["total_records"] > 0)

if __name__ == "__main__":
    unittest.main()
