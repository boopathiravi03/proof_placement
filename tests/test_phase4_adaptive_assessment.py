import unittest
from datetime import datetime, timedelta
from backend.app.database import SessionLocal
from backend.app.models.models import Student, QuestionBank, AssessmentAttempt, Competency
from backend.app.services.assessment_service import AssessmentService
from backend.app.services.readiness_service import ReadinessService
from backend.app.services.code_execution_service import CodeExecutionService

class TestPhase4AdaptiveAssessment(unittest.TestCase):
    def setUp(self):
        self.db = SessionLocal()
        self.student = self.db.query(Student).filter(Student.id == "student-rahul-01").first()
        if not self.student:
            self.student = Student(
                id="student-rahul-01",
                college_id="COLLEGE-A",
                name="Rahul K.",
                branch="CSE",
                cgpa=7.8,
                backlogs=1
            )
            self.db.add(self.student)
            self.db.commit()
            self.db.refresh(self.student)

    def tearDown(self):
        self.db.close()

    def test_categories_and_question_secrecy(self):
        """Rule: All 10 categories available, secret answers never exposed before submission."""
        cats = AssessmentService.get_categories(self.db)
        expected_cats = [
            "Aptitude", "Programming", "DSA", "DBMS", "Operating Systems",
            "Computer Networks", "Web Development", "Frameworks & Tools", "Debugging", "Technical Interview"
        ]
        for ec in expected_cats:
            self.assertIn(ec, cats)

        # Question secrecy: payload must NOT contain correct_option_index or expected_answer
        q = AssessmentService.get_adaptive_question(self.db, category="DBMS", target_level=2)
        self.assertIsNotNone(q)
        self.assertNotIn("correct_option_index", q)
        self.assertNotIn("expected_answer", q)

    def test_adaptive_difficulty_transitions(self):
        """Rule: Correct answers advance difficulty upwards; incorrect answers reduce difficulty."""
        attempt_res = AssessmentService.start_attempt(
            db=self.db,
            student_id=self.student.id,
            category="Aptitude",
            assessment_type="mcq",
            total_questions=3
        )
        attempt_id = attempt_res["attempt_id"]

        q1 = attempt_res["first_question"]
        self.assertIsNotNone(q1)

        # Look up correct option index on backend for test simulation
        q1_obj = self.db.query(QuestionBank).filter(QuestionBank.id == q1["id"]).first()
        correct_idx = q1_obj.correct_option_index

        # Submit correct answer: expect difficulty to increase or remain at max
        res1 = AssessmentService.submit_answer(
            db=self.db,
            attempt_id=attempt_id,
            student_id=self.student.id,
            question_id=q1["id"],
            selected_option_index=correct_idx,
            time_spent_seconds=20
        )
        self.assertTrue(res1["is_correct"])
        self.assertGreaterEqual(res1["next_difficulty"], q1["difficulty_level"])

        # Submit incorrect answer on question 2
        q2 = res1["next_question"]
        if q2:
            q2_obj = self.db.query(QuestionBank).filter(QuestionBank.id == q2["id"]).first()
            wrong_idx = (q2_obj.correct_option_index + 1) % max(len(q2_obj.options), 2)
            res2 = AssessmentService.submit_answer(
                db=self.db,
                attempt_id=attempt_id,
                student_id=self.student.id,
                question_id=q2["id"],
                selected_option_index=wrong_idx,
                time_spent_seconds=25
            )
            self.assertFalse(res2["is_correct"])
            self.assertLessEqual(res2["next_difficulty"], q2["difficulty_level"])

    def test_timer_expiration_enforcement(self):
        """Rule: Expired attempts must reject subsequent answer submissions."""
        attempt = AssessmentAttempt(
            college_id=self.student.college_id,
            student_id=self.student.id,
            category="DSA",
            assessment_type="mcq",
            score=0,
            total_questions=5,
            status="in_progress",
            expires_at=datetime.utcnow() - timedelta(minutes=5)  # Already expired 5 mins ago
        )
        self.db.add(attempt)
        self.db.commit()

        q = self.db.query(QuestionBank).filter(QuestionBank.category.ilike("%DSA%")).first()
        with self.assertRaises(ValueError) as ctx:
            AssessmentService.submit_answer(
                db=self.db,
                attempt_id=attempt.id,
                student_id=self.student.id,
                question_id=q.id,
                selected_option_index=0
            )
        self.assertIn("expired", str(ctx.exception).lower())

    def test_code_execution_sandbox_and_security(self):
        """Rule: Test execution with partial scoring; block dangerous os/sys calls."""
        # 1. Valid Python solution
        code = "def reverse_words(s):\n    return ' '.join(s.strip().split()[::-1])\n"
        test_cases = [
            {"input": "'the sky is blue'", "expected_output": "blue is sky the", "is_hidden": False},
            {"input": "'hello world'", "expected_output": "world hello", "is_hidden": False}
        ]
        res = CodeExecutionService.execute_code("python", code, test_cases)
        self.assertEqual(res["status"], "PASSED")
        self.assertEqual(res["passed_count"], 2)
        self.assertEqual(res["score"], 1.0)

        # 2. Block malicious system calls
        dangerous_code = "import os\nos.system('dir')"
        res_sec = CodeExecutionService.execute_code("python", dangerous_code, test_cases)
        self.assertEqual(res_sec["status"], "SECURITY_VIOLATION")

    def test_sql_execution_sandbox(self):
        """Rule: SQL execution against SQLite in-memory schema; block destructive DDL."""
        query = "SELECT name, salary FROM employees WHERE salary > 100000 ORDER BY salary DESC;"
        res = CodeExecutionService.execute_sql(query)
        self.assertIn("columns", res)
        self.assertGreater(len(res["rows"]), 0)
        self.assertEqual(res["columns"], ["name", "salary"])

        # Block drop table
        drop_query = "DROP TABLE employees;"
        drop_res = CodeExecutionService.execute_sql(drop_query)
        self.assertEqual(drop_res["status"], "SECURITY_VIOLATION")

    def test_assessment_completion_and_competency_promotion(self):
        """Rule: Passing assessment (>=60%) transitions competency state to 'assessed'."""
        attempt = AssessmentAttempt(
            college_id=self.student.college_id,
            student_id=self.student.id,
            category="Operating Systems",
            assessment_type="mcq",
            score=0,
            total_questions=3,
            status="in_progress",
            expires_at=datetime.utcnow() + timedelta(minutes=20),
            responses=[
                {"question_id": "q1", "topic": "Process Scheduling", "marks_awarded": 1.0, "max_marks": 1.0, "is_correct": True, "difficulty_level": 1},
                {"question_id": "q2", "topic": "Deadlocks", "marks_awarded": 1.0, "max_marks": 1.0, "is_correct": True, "difficulty_level": 2},
                {"question_id": "q3", "topic": "Paging", "marks_awarded": 0.0, "max_marks": 1.0, "is_correct": False, "difficulty_level": 3}
            ]
        )
        self.db.add(attempt)
        self.db.commit()

        result = AssessmentService.complete_assessment(self.db, attempt.id, self.student.id)
        self.assertTrue(result["passed"])
        self.assertEqual(result["percentage"], 66.7)
        self.assertIn("Process Scheduling", result["strong_topics"])
        self.assertIn("Paging", result["weak_topics"])
        self.assertEqual(result["competency_state"], "assessed")

        # Verify competency in DB is at least assessed
        comp = self.db.query(Competency).filter(Competency.student_id == self.student.id, Competency.skill_name == "Operating Systems").first()
        self.assertIsNotNone(comp)
        self.assertIn(comp.state, ["assessed", "verified"])

    def test_multi_attempt_intelligence(self):
        """Rule: Aggregating repeated attempts identifies persistent topic weaknesses."""
        attempt1 = AssessmentAttempt(
            college_id=self.student.college_id,
            student_id=self.student.id,
            category="DBMS",
            score=3,
            total_questions=5,
            passed=True,
            topic_scores={"Joins": {"earned": 0, "total": 2}, "SQL Basics": {"earned": 2, "total": 2}}
        )
        attempt2 = AssessmentAttempt(
            college_id=self.student.college_id,
            student_id=self.student.id,
            category="DBMS",
            score=2,
            total_questions=5,
            passed=False,
            topic_scores={"Joins": {"earned": 1, "total": 2}, "Indexing": {"earned": 0, "total": 2}}
        )
        self.db.add_all([attempt1, attempt2])
        self.db.commit()

        intel = AssessmentService.get_multi_attempt_intelligence(self.db, self.student.id, category="DBMS")
        self.assertGreater(intel["total_attempts"], 0)
        weak_topic_names = [w["topic"] for w in intel["persistent_weak_topics"]]
        self.assertIn("Joins", weak_topic_names)

    def test_readiness_calculation_and_missing_data(self):
        """Rule: Documented 5-factor model; unassessed dimensions must not be artificially zeroed."""
        res = ReadinessService.calculate_readiness(self.db, self.student.id, target_role="Backend Developer")
        self.assertIn("overall_score", res)
        self.assertGreaterEqual(res["overall_score"], 0)
        self.assertLessEqual(res["overall_score"], 100)
        self.assertIn("confidence_level", res)
        self.assertIn("data_coverage_percentage", res)

        breakdown = res["breakdown"]
        self.assertIn("verified_competencies", breakdown)
        self.assertIn("coding_assessment", breakdown)
        self.assertIn("aptitude", breakdown)
        self.assertIn("interview_readiness", breakdown)
        self.assertIn("role_skill_coverage", breakdown)

        # Check weights match requirement: 35% verified, 25% coding, 15% aptitude, 15% interview, 10% coverage
        self.assertEqual(breakdown["verified_competencies"]["weight"], 35)
        self.assertEqual(breakdown["coding_assessment"]["weight"], 25)
        self.assertEqual(breakdown["aptitude"]["weight"], 15)
        self.assertEqual(breakdown["interview_readiness"]["weight"], 15)
        self.assertEqual(breakdown["role_skill_coverage"]["weight"], 10)

    def test_multi_role_readiness_comparison(self):
        """Rule: Compare all 7 target roles side by side, identify strongest matching role."""
        comp = ReadinessService.compare_roles(self.db, self.student.id)
        self.assertIsNotNone(comp["strongest_role"])
        self.assertGreaterEqual(comp["strongest_score"], 0)
        self.assertEqual(len(comp["roles_comparison"]), 7)

        role_names = [r["role_name"] for r in comp["roles_comparison"]]
        expected_roles = [
            "Backend Developer", "Frontend Developer", "Full Stack Developer",
            "Data Analyst", "Java Developer", "Python Developer", "AI/ML Engineer"
        ]
        for er in expected_roles:
            self.assertIn(er, role_names)

if __name__ == "__main__":
    unittest.main()
