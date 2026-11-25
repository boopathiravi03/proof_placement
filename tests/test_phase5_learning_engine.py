import unittest
from datetime import datetime, timedelta
from fastapi import HTTPException
from backend.app.database import SessionLocal
from backend.app.models.models import (
    College,
    Student,
    User,
    Competency,
    Evidence,
    AssessmentAttempt,
    LearningTask,
)
from backend.app.services.skill_gap_service import SkillGapService
from backend.app.services.learning_path_service import LearningPathService, RecommendationValidationLayer
from backend.app.services.intervention_service import InterventionService
from backend.app.services.readiness_service import ReadinessService
from backend.app.routers.learning import get_or_create_learning_path
from backend.app.routers.officer import get_cohort_skill_gaps


class TestPhase5LearningEngine(unittest.TestCase):
    def setUp(self):
        self.db = SessionLocal()
        # Ensure College A and College B exist
        for cid, code, name in [("COLLEGE-A", "COL-A", "College A"), ("COLLEGE-B", "COL-B", "College B")]:
            if not self.db.query(College).filter(College.id == cid).first():
                self.db.add(College(id=cid, code=code, name=name, city="Test", state="Test"))
        self.db.commit()

        # Isolated test student in College A
        self.test_sid = "student-p5-test-a"
        st = self.db.query(Student).filter(Student.id == self.test_sid).first()
        if st:
            self.db.query(Competency).filter(Competency.student_id == self.test_sid).delete()
            self.db.query(AssessmentAttempt).filter(AssessmentAttempt.student_id == self.test_sid).delete()
            self.db.commit()
        else:
            st = Student(
                id=self.test_sid,
                college_id="COLLEGE-A",
                name="Phase5 Student A",
                branch="CSE",
                cgpa=8.1,
                backlogs=0,
            )
            self.db.add(st)
            self.db.commit()
        self.student_a = st

        # Isolated test student in College B
        self.test_sid_b = "student-p5-test-b"
        if not self.db.query(Student).filter(Student.id == self.test_sid_b).first():
            self.db.add(
                Student(
                    id=self.test_sid_b,
                    college_id="COLLEGE-B",
                    name="Phase5 Student B",
                    branch="IT",
                    cgpa=7.5,
                    backlogs=0,
                )
            )
            self.db.commit()

    def tearDown(self):
        self.db.close()

    # --- 1. Skill-Gap Analysis Tests ---
    def test_student_meets_all_requirements(self):
        reqs = SkillGapService.get_role_requirements("Data Analyst")
        for r in reqs:
            self.db.add(
                Competency(
                    student_id=self.test_sid,
                    college_id="COLLEGE-A",
                    skill_name=r["skill"],
                    proficiency=r["min_proficiency"],
                    state="verified",
                    verified_by="Prof. Test",
                    confidence=0.95,
                    expires_at=datetime.utcnow() + timedelta(days=180),
                )
            )
        self.db.commit()

        res = SkillGapService.analyze_skill_gaps(self.db, self.test_sid, "Data Analyst")
        self.assertEqual(res["summary"]["meets_requirement"], len(reqs))
        self.assertEqual(res["summary"]["critical_gaps"], 0)

    def test_missing_unassessed_low_and_expired_gaps(self):
        # 1. SQL: low assessment performance (< 60%)
        self.db.add(
            Competency(
                student_id=self.test_sid,
                college_id="COLLEGE-A",
                skill_name="SQL",
                proficiency="Beginner",
                state="evidence_linked",
                confidence=0.6,
            )
        )
        self.db.add(
            AssessmentAttempt(
                college_id="COLLEGE-A",
                student_id=self.test_sid,
                category="DBMS",
                score=2,
                total_questions=5,
                passed=False,
                weak_topics=["Joins", "Indexing"],
            )
        )
        # 2. Python: claimed (unassessed)
        self.db.add(
            Competency(
                student_id=self.test_sid,
                college_id="COLLEGE-A",
                skill_name="Python",
                proficiency="Intermediate",
                state="claimed",
                confidence=0.4,
            )
        )
        # 3. Git: expired verification
        self.db.add(
            Competency(
                student_id=self.test_sid,
                college_id="COLLEGE-A",
                skill_name="Git",
                proficiency="Intermediate",
                state="verified",
                verified_by="Prof. Test",
                expires_at=datetime.utcnow() - timedelta(days=5),
            )
        )
        # 4. Docker: missing completely -> unknown
        self.db.commit()

        res = SkillGapService.analyze_skill_gaps(self.db, self.test_sid, "Backend Developer")
        by_skill = {g["skill_name"]: g for g in res["gaps"]}

        self.assertEqual(by_skill["SQL"]["gap_status"], "needs_improvement")
        self.assertEqual(by_skill["Python"]["current_state"], "unassessed")
        self.assertEqual(by_skill["Python"]["gap_status"], "evidence_required")
        self.assertEqual(by_skill["Git"]["gap_status"], "reassessment_recommended")
        self.assertEqual(by_skill["Docker"]["current_state"], "unknown")
        self.assertEqual(by_skill["Docker"]["gap_status"], "missing_skill")

    def test_target_role_change_recalculates_gaps(self):
        res_backend = SkillGapService.analyze_skill_gaps(self.db, self.test_sid, "Backend Developer")
        res_frontend = SkillGapService.analyze_skill_gaps(self.db, self.test_sid, "Frontend Developer")
        self.assertNotEqual(
            {g["skill_name"] for g in res_backend["gaps"]},
            {g["skill_name"] for g in res_frontend["gaps"]},
        )

    # --- 2. Learning Path & Validation Layer Tests ---
    def test_prerequisite_ordering_and_no_duplicates(self):
        lp = LearningPathService.generate_or_get_learning_path(
            self.db, self.test_sid, "Backend Developer", force_regenerate=True
        )
        skills_order = [t["skill"] for t in lp["tasks"]]
        # No duplicate (skill, title)
        keys = [(t["skill"], t["title"]) for t in lp["tasks"]]
        self.assertEqual(len(keys), len(set(keys)))
        # Prerequisites respected: Python before REST APIs, SQL before Database Design
        if "Python" in skills_order and "REST APIs" in skills_order:
            self.assertLess(skills_order.index("Python"), skills_order.index("REST APIs"))
        if "SQL" in skills_order and "Database Design" in skills_order:
            self.assertLess(skills_order.index("SQL"), skills_order.index("Database Design"))

    def test_invalid_ai_recommendation_rejected_and_fallback_works(self):
        fake_ai_candidates = [
            {
                "title": "Learn Fake Quantum Framework",
                "skill": "NonExistentSkill99",
                "description": "Invalid skill",
                "completion_criteria": "Instant certificate auto-verified",
            }
        ]
        lp = LearningPathService.generate_or_get_learning_path(
            self.db,
            self.test_sid,
            "Backend Developer",
            force_regenerate=True,
            ai_candidates=fake_ai_candidates,
        )
        task_skills = [t["skill"] for t in lp["tasks"]]
        self.assertNotIn("NonExistentSkill99", task_skills)
        self.assertGreater(len(task_skills), 0)

    def test_task_progress_and_evidence_never_auto_verifies(self):
        lp = LearningPathService.generate_or_get_learning_path(
            self.db, self.test_sid, "Backend Developer", force_regenerate=True
        )
        sql_task = next(t for t in lp["tasks"] if t["skill"] == "SQL")

        # Update progress
        before_time = sql_task.get("time_spent_minutes") or 0
        prog = LearningPathService.update_task_progress(
            self.db, sql_task["id"], self.test_sid, status="in_progress", time_spent_minutes=20
        )
        self.assertEqual(prog["task"]["status"], "in_progress")
        self.assertEqual(prog["task"]["time_spent_minutes"], before_time + 20)

        # Submit evidence -> must become evidence_linked, NEVER verified
        sub = LearningPathService.submit_task_evidence(
            self.db,
            sql_task["id"],
            self.test_sid,
            artifact_type="repo",
            artifact_url="https://github.com/rahulk-dev/sql-practice",
            notes="Solved 5 join queries",
        )
        self.assertEqual(sub["competency_state"], "evidence_linked")
        self.assertNotEqual(sub["competency_state"], "verified")

        comp = self.db.query(Competency).filter(
            Competency.student_id == self.test_sid, Competency.skill_name == "SQL"
        ).first()
        self.assertEqual(comp.state, "evidence_linked")

        # Unauthorized student/mentor cannot approve submission
        with self.assertRaises(PermissionError):
            LearningPathService.review_task_submission(
                self.db,
                submission_id=sub["submission_id"],
                reviewer_name="Random Student",
                reviewer_role="student",
                reviewer_college_id="COLLEGE-A",
                approved=True,
            )

        # Authorized officer can approve submission
        rev = LearningPathService.review_task_submission(
            self.db,
            submission_id=sub["submission_id"],
            reviewer_name="Dr. Placement Officer",
            reviewer_role="officer",
            reviewer_college_id="COLLEGE-A",
            approved=True,
            review_notes="Good SQL queries",
        )
        self.assertEqual(rev["status"], "approved")

    # --- 3. Multi-Tenancy & Role Permissions Tests ---
    def test_multi_tenancy_and_rbac_enforcement(self):
        other_student_user = User(
            id="user-p5-other",
            email="other@college-a.edu",
            full_name="Other Student",
            role="student",
            college_id="COLLEGE-A",
        )
        recruiter_user = User(
            id="user-p5-recruiter",
            email="rec@acme.com",
            full_name="Recruiter",
            role="recruiter",
            college_id="COLLEGE-A",
        )
        officer_b_user = User(
            id="user-p5-officer-b",
            email="officer@college-b.edu",
            full_name="Officer B",
            role="officer",
            college_id="COLLEGE-B",
        )

        # Recruiter cannot access private learning path
        with self.assertRaises(HTTPException) as ctx1:
            get_or_create_learning_path(
                student_id=self.test_sid, target_role="Backend Developer", db=self.db, current_user=recruiter_user
            )
        self.assertEqual(ctx1.exception.status_code, 403)

        # Officer from College B cannot access College A student learning path or cohort gaps
        with self.assertRaises(HTTPException) as ctx2:
            get_or_create_learning_path(
                student_id=self.test_sid, target_role="Backend Developer", db=self.db, current_user=officer_b_user
            )
        self.assertEqual(ctx2.exception.status_code, 403)

        with self.assertRaises(HTTPException) as ctx3:
            get_cohort_skill_gaps(college_id="COLLEGE-A", target_role="Backend Developer", db=self.db, current_user=officer_b_user)
        self.assertEqual(ctx3.exception.status_code, 403)

        # Student cannot view another student's learning path (when linked)
        other_student_rec = Student(
            id="student-p5-other-rec",
            user_id=other_student_user.id,
            college_id="COLLEGE-A",
            name="Other",
            branch="CSE",
        )
        if not self.db.query(User).filter(User.id == other_student_user.id).first():
            self.db.add(other_student_user)
        if not self.db.query(Student).filter(Student.id == other_student_rec.id).first():
            self.db.add(other_student_rec)
        self.db.commit()

        with self.assertRaises(HTTPException) as ctx4:
            get_or_create_learning_path(
                student_id=self.test_sid, target_role="Backend Developer", db=self.db, current_user=other_student_user
            )
        self.assertEqual(ctx4.exception.status_code, 403)

    # --- 4. Readiness & Officer Intervention Integration Tests ---
    def test_readiness_missing_data_not_zero_and_officer_intervention(self):
        readiness = ReadinessService.calculate_readiness(self.db, self.test_sid, "Backend Developer")
        # Missing assessment history uses baseline rather than zeroing out ability
        self.assertGreater(readiness["overall_score"], 0)

        cohort = InterventionService.get_cohort_skill_gaps(self.db, "COLLEGE-A", "Backend Developer")
        self.assertGreater(cohort["cohort_size"], 0)

        iv = InterventionService.create_intervention(
            self.db,
            college_id="COLLEGE-A",
            created_by="T&P Officer",
            title="SQL & REST API Bootcamp",
            description="Targeted gap closure",
            target_role="Backend Developer",
            target_skills=["SQL", "REST APIs"],
        )
        assign = InterventionService.assign_students(
            self.db, iv.id, "COLLEGE-A", [self.test_sid]
        )
        self.assertIn(self.test_sid, assign["assigned_students"])

        # Cross-college assignment must fail
        with self.assertRaises(ValueError):
            InterventionService.assign_students(self.db, iv.id, "COLLEGE-A", [self.test_sid_b])

        eff = InterventionService.get_intervention_effectiveness(self.db, iv.id, "COLLEGE-A")
        self.assertEqual(eff["enrolled_count"], 1)


if __name__ == "__main__":
    unittest.main()
