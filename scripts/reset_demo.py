"""
Repeatable Hackathon Demo Reset Script for ProofHire 2.0.
Refuses to run when ENVIRONMENT=production to protect production data.
"""
import os
import sys

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.app.config import settings
from backend.app.database import Base, engine, SessionLocal
from backend.app.seed import seed_database
from backend.app.seed_questions import seed_comprehensive_questions
from backend.app.models.models import Student, Competency
from backend.app.services.privacy_retention_service import PrivacyRetentionService
from backend.app.services.audit_service import AuditService


def reset_demo_database() -> None:
    env = (settings.ENVIRONMENT or os.getenv("ENVIRONMENT", "development")).lower()
    if env == "production":
        raise RuntimeError(
            "ABORTED: scripts/reset_demo.py cannot be executed when ENVIRONMENT=production."
        )

    print(f"[Demo Reset] Resetting demo database in '{env}' mode...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    seed_database()
    seed_comprehensive_questions()

    db = SessionLocal()
    try:
        # Ensure College B also has contrasting demo students (fictional demo records only)
        if not db.query(Student).filter(Student.college_id == "COLLEGE-B").first():
            b1 = Student(
                id="demo-b-student-01",
                college_id="COLLEGE-B",
                name="Neha V. (Demo)",
                roll_number="BC2101",
                branch="CSE",
                cgpa=8.6,
                backlogs=0,
            )
            b2 = Student(
                id="demo-b-student-02",
                college_id="COLLEGE-B",
                name="Rohan T. (Demo)",
                roll_number="BC2102",
                branch="ECE",
                cgpa=7.5,
                backlogs=0,
            )
            db.add_all([b1, b2])
            db.flush()
            db.add_all([
                Competency(
                    student_id=b1.id,
                    college_id="COLLEGE-B",
                    skill_name="Python",
                    category="languages",
                    proficiency="Advanced",
                    state="verified",
                    confidence=0.92,
                    verified_by="Prof. Kulkarni (Demo)",
                    verification_method="mentor_signoff",
                ),
                Competency(
                    student_id=b2.id,
                    college_id="COLLEGE-B",
                    skill_name="SQL",
                    category="databases",
                    proficiency="Beginner",
                    state="evidence_linked",
                    confidence=0.55,
                ),
            ])
            db.commit()

        PrivacyRetentionService.seed_defaults(db, "COLLEGE-A")
        PrivacyRetentionService.seed_defaults(db, "COLLEGE-B")
        AuditService.log_event(db, "COLLEGE-A", "Demo Reset Script", "Reset College A demo environment")
        AuditService.log_event(db, "COLLEGE-B", "Demo Reset Script", "Reset College B demo environment")
        print("[Demo Reset] Complete! Fictional College A & College B demo data seeded.")
    finally:
        db.close()


if __name__ == "__main__":
    reset_demo_database()
