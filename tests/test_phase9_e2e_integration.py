import unittest
import os
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.main import app
from backend.app.database import Base, get_db
from backend.app.models.models import (
    College,
    Student,
    Competency,
    QuestionBank,
    AuditLogEntry,
)
from backend.app.services.competency_service import CompetencyService
from backend.app.services.learning_path_service import LearningPathService
from backend.app.services.communication_service import CommunicationService
from backend.app.services.audit_service import AuditService


class TestPhase9E2EIntegration(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        Base.metadata.create_all(bind=self.engine)
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)

        def override_get_db():
            db = self.SessionLocal()
            try:
                yield db
            finally:
                db.close()

        app.dependency_overrides[get_db] = override_get_db
        self.client = TestClient(app)

        # Seed isolated E2E test fixture
        db = self.SessionLocal()
        db.add(College(id="COLLEGE-A", code="COL-A", name="Apex Engineering (Test)"))
        db.add(College(id="COLLEGE-B", code="COL-B", name="Beacon Campus (Test)"))
        db.add(
            Student(
                id="E2E-STU-1",
                user_id="E2E-USR-1",
                college_id="COLLEGE-A",
                name="Test Student A",
                branch="CSE",
                cgpa=8.4,
                backlogs=0,
            )
        )
        db.add(
            Competency(
                student_id="E2E-STU-1",
                college_id="COLLEGE-A",
                skill_name="SQL",
                category="databases",
                proficiency="Intermediate",
                state="claimed",
                confidence=0.4,
            )
        )
        db.add(
            QuestionBank(
                category="SQL",
                question="Which SQL clause filters rows before GROUP BY?",
                options=["WHERE", "HAVING", "ORDER BY", "LIMIT"],
                correct_option_index=0,
                difficulty_level=1,
                explanation="WHERE filters rows prior to aggregation.",
            )
        )
        db.commit()
        db.close()

    def tearDown(self):
        app.dependency_overrides.clear()

    def test_health_and_openapi_contract(self):
        health = self.client.get("/api/health")
        self.assertEqual(health.status_code, 200)
        self.assertEqual(health.json()["status"], "healthy")
        self.assertIn("x-content-type-options", {k.lower(): v for k, v in health.headers.items()})

        spec = self.client.get("/openapi.json")
        self.assertEqual(spec.status_code, 200)
        self.assertGreaterEqual(len(spec.json().get("paths", {})), 120)

    def test_end_to_end_student_officer_university_and_audit_flow(self):
        # 1. Privacy notice & 6-category consent
        notice_res = self.client.get("/api/governance/privacy-notice")
        self.assertEqual(notice_res.status_code, 200)
        self.assertEqual(notice_res.json()["version"], "v2.0")

        consents_res = self.client.get("/api/governance/consent/E2E-STU-1")
        self.assertEqual(consents_res.status_code, 200)
        self.assertEqual(len(consents_res.json()), 6)

        # 2. Evidence link -> must become evidence_linked, NEVER verified
        ev_res = self.client.post(
            "/api/competencies/evidence",
            json={
                "student_id": "E2E-STU-1",
                "skill_name": "SQL",
                "kind": "repo",
                "title": "SQL Query Optimizer",
                "ref_url": "https://github.com/example/sql-opt",
            },
        )
        self.assertEqual(ev_res.status_code, 200)
        db = self.SessionLocal()
        comp = db.query(Competency).filter(Competency.student_id == "E2E-STU-1", Competency.skill_name == "SQL").first()
        self.assertEqual(comp.state, "evidence_linked")

        # 3. Mentor sign-off -> verified
        CompetencyService.sign_off_mentor(
            db=db,
            student_id="E2E-STU-1",
            skill_name="SQL",
            mentor_name="Prof. Meena",
            notes="Verified SQL optimizer repository in lab walkthrough.",
        )
        db.refresh(comp)
        self.assertEqual(comp.state, "verified")

        # 4. Readiness & Deterministic Learning Path fallback (no external LLM key required)
        readiness_res = self.client.get("/api/readiness/student/E2E-STU-1")
        self.assertEqual(readiness_res.status_code, 200)

        lp = LearningPathService.generate_or_get_learning_path(db, "E2E-STU-1", "Backend Developer")
        self.assertIsNotNone(lp)

        # 5. Simulated SMTP fallback honesty when SMTP_HOST is unset
        os.environ.pop("SMTP_HOST", None)
        comm = CommunicationService.send_bulk_communication(
            db=db,
            college_id="COLLEGE-A",
            sender="Officer Demo",
            sender_role="officer",
            audience_filter="cohort",
            template_type="drive_announcement",
        )
        self.assertEqual(comm["status"], "preview_simulated")
        self.assertEqual(comm["provider_mode"], "simulated_preview")

        # 6. Audit chain verification & controlled tampering detection
        AuditService.log_event(db, "COLLEGE-A", "E2E Runner", "Completed full placement workflow")
        verif_ok = self.client.post("/api/governance/audit/COLLEGE-A/verify")
        self.assertEqual(verif_ok.status_code, 200)
        self.assertTrue(verif_ok.json()["chain_intact"])

        cp_res = self.client.post("/api/governance/audit/COLLEGE-A/checkpoint")
        self.assertEqual(cp_res.status_code, 200)
        self.assertTrue(cp_res.json()["verified_intact"])

        # Controlled tamper in isolated test DB
        entry = db.query(AuditLogEntry).filter(AuditLogEntry.college_id == "COLLEGE-A").first()
        entry.action = "TAMPERED_IN_TEST"
        db.commit()

        verif_bad = self.client.post("/api/governance/audit/COLLEGE-A/verify")
        self.assertEqual(verif_bad.status_code, 200)
        self.assertFalse(verif_bad.json()["chain_intact"])
        self.assertEqual(verif_bad.json()["broken_event_id"], entry.id)

        # 7. University aggregate summary
        uni_res = self.client.get("/api/university/colleges-summary")
        self.assertEqual(uni_res.status_code, 200)
        self.assertGreaterEqual(len(uni_res.json().get("colleges", [])), 2)
        db.close()


if __name__ == "__main__":
    unittest.main()
