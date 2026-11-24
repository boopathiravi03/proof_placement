import unittest
from backend.app.database import SessionLocal
from backend.app.services.eligibility_service import EligibilityService

class TestEligibilityEngine(unittest.TestCase):
    def setUp(self):
        self.db = SessionLocal()

    def tearDown(self):
        self.db.close()

    def test_ineligible_due_to_backlogs_and_skills(self):
        rules = {
            "version": 3,
            "min_cgpa": 7.0,
            "max_backlogs": 0,
            "required_skills": ["SQL", "Docker"]
        }
        student_data = {
            "cgpa": 7.8,
            "backlogs": 1,
            "verified_skills": ["Python"]
        }
        res = EligibilityService.evaluate_eligibility(
            db=self.db,
            rules=rules,
            student_data=student_data,
            student_id="test-student-1",
            college_id="COLLEGE-A"
        )
        self.assertFalse(res["eligible"])
        self.assertEqual(res["rule_version"], 3)
        self.assertIn("Maximum active backlogs: allowed 0, student has 1", res["failed_rules"])
        self.assertTrue(any("SQL" in r for r in res["failed_rules"]))
        self.assertTrue(any("Docker" in r for r in res["failed_rules"]))
        self.assertIsNotNone(res["decision_id"])

    def test_eligible_candidate(self):
        rules = {
            "version": 3,
            "min_cgpa": 7.0,
            "max_backlogs": 0,
            "required_skills": ["Python", "SQL"]
        }
        student_data = {
            "cgpa": 8.5,
            "backlogs": 0,
            "verified_skills": ["Python", "SQL", "Git"]
        }
        res = EligibilityService.evaluate_eligibility(
            db=self.db,
            rules=rules,
            student_data=student_data,
            student_id="test-student-2",
            college_id="COLLEGE-A"
        )
        self.assertTrue(res["eligible"])
        self.assertEqual(len(res["failed_rules"]), 0)

if __name__ == "__main__":
    unittest.main()
