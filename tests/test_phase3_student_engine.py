import unittest
import asyncio
from datetime import datetime, timedelta
from backend.app.database import SessionLocal
from backend.app.models.models import Student, Competency, Evidence, Consent, MentorVerificationRequest
from backend.app.services.competency_service import CompetencyService
from backend.app.services.github_service import GitHubService

class TestPhase3StudentEngine(unittest.TestCase):
    def setUp(self):
        self.db = SessionLocal()
        self.student_a = self.db.query(Student).filter(Student.id == "student-rahul-01").first()
        if not self.student_a:
            self.student_a = Student(
                id="student-rahul-01",
                college_id="COLLEGE-A",
                name="Rahul K.",
                branch="CSE",
                cgpa=7.8,
                backlogs=1
            )
            self.db.add(self.student_a)
            self.db.commit()
            self.db.refresh(self.student_a)

    def tearDown(self):
        self.db.close()

    def test_add_claimed_skill_never_verified(self):
        """Rule: Self-declared / claimed skills must always be in 'claimed' state, never 'verified'."""
        comp = CompetencyService.claim_skill(
            db=self.db,
            student_id=self.student_a.id,
            skill_name="Rust",
            category="languages",
            proficiency="Beginner"
        )
        self.assertEqual(comp.state, "claimed")
        self.assertIsNone(comp.verified_by)
        self.assertLessEqual(comp.confidence, 0.50)

    def test_evidence_submission_transitions_to_evidence_linked(self):
        """Rule: Attaching repo/hackathon/lab evidence produces 'evidence_linked', not 'verified'."""
        comp = CompetencyService.add_evidence(
            db=self.db,
            student_id=self.student_a.id,
            skill_name="Golang",
            kind="repo",
            title="Go Microservice Repo",
            ref_url="https://github.com/rahulk-dev/go-service",
            confidence=0.70
        )
        self.assertEqual(comp.state, "evidence_linked")
        self.assertNotEqual(comp.state, "verified")

    def test_github_scanning_never_produces_verified(self):
        """Critical Rule: GitHub repository activity alone must NEVER produce 'verified' status."""
        test_student_id = "student-gh-fresh"
        st = self.db.query(Student).filter(Student.id == test_student_id).first()
        if not st:
            st = Student(
                id=test_student_id,
                college_id="COLLEGE-A",
                name="Fresh Student",
                branch="CSE",
                cgpa=8.0,
                backlogs=0
            )
            self.db.add(st)
            self.db.commit()
            self.db.refresh(st)

        st.github_consent_revoked = False
        self.db.commit()

        res = asyncio.run(GitHubService.scan_and_link(self.db, test_student_id, "fresh-student"))
        self.assertTrue(res["connected"])
        for item in res["linked_skills"]:
            self.assertIn(item["state"], ["evidence_linked", "observed", "assessed", "claimed"])
            self.assertNotEqual(item["state"], "verified", "GitHub alone must never produce verified status!")

    def test_consent_enforcement_before_scanning(self):
        """Rule: Check student consent before scanning. If consent is revoked, reject scan."""
        GitHubService.revoke_access(self.db, self.student_a.id)

        with self.assertRaises(ValueError) as ctx:
            asyncio.run(GitHubService.scan_and_link(self.db, self.student_a.id, "rahulk-dev"))
        self.assertIn("consent is revoked", str(ctx.exception).lower())

        # Restore consent
        self.student_a.github_consent_revoked = False
        self.student_a.github_connected = True
        self.db.commit()

    def test_invalid_skill_transition(self):
        """Rule: Cannot verify skill without preceding assessment or authorized evidence."""
        comp = CompetencyService.claim_skill(
            db=self.db,
            student_id=self.student_a.id,
            skill_name="Kubernetes",
            category="tools"
        )
        with self.assertRaises(ValueError) as ctx:
            CompetencyService.sign_off_mentor(
                db=self.db,
                student_id=self.student_a.id,
                skill_name="Kubernetes",
                mentor_name="Dr. Raman"
            )
        self.assertIn("must complete assessment or link evidence first", str(ctx.exception))

    def test_mentor_verification_request_and_adjudication(self):
        """Rule: Mentor receives request, reviews submitted evidence, approves and sets verified with expiry."""
        CompetencyService.add_evidence(
            db=self.db,
            student_id=self.student_a.id,
            skill_name="Docker",
            kind="lab",
            title="Docker Swarm Container Lab",
            ref_url="https://proofhire.internal/lab/docker",
            confidence=0.80
        )

        req = CompetencyService.create_mentor_request(
            db=self.db,
            student_id=self.student_a.id,
            skill_name="Docker",
            mentor_name="Prof. Sharma (Cloud Lab)",
            evidence_summary="Containerized 3-tier microservice architecture with Dockerfile and compose",
            walkthrough_notes="Demonstrated live container spin-up and healthcheck"
        )
        self.assertEqual(req.status, "pending")

        adjudicated = CompetencyService.adjudicate_mentor_request(
            db=self.db,
            request_id=req.id,
            mentor_name="Prof. Sharma (Cloud Lab)",
            approved=True,
            notes="Excellent architectural command and clean multi-stage Docker build"
        )
        self.assertEqual(adjudicated.status, "approved")

        comp = self.db.query(Competency).filter(Competency.id == req.competency_id).first()
        self.assertEqual(comp.state, "verified")
        self.assertEqual(comp.verified_by, "Prof. Sharma (Cloud Lab)")
        self.assertIsNotNone(comp.expires_at)
        self.assertGreater(comp.expires_at, datetime.utcnow())

    def test_evidence_deletion_recalculates_state(self):
        """Rule: Deleting evidence recalculates competency state appropriately."""
        comp = CompetencyService.add_evidence(
            db=self.db,
            student_id=self.student_a.id,
            skill_name="TypeScript",
            kind="commit",
            title="TypeScript Frontend PRs",
            ref_url="https://github.com/rahulk-dev/ui-app",
            confidence=0.75
        )
        self.assertEqual(comp.state, "evidence_linked")

        evidence = self.db.query(Evidence).filter(Evidence.competency_id == comp.id, Evidence.title == "TypeScript Frontend PRs").first()
        self.assertIsNotNone(evidence)

        updated_comp = CompetencyService.delete_evidence(self.db, evidence.id, self.student_a.id)
        self.assertEqual(updated_comp.state, "claimed")

    def test_evidence_expiry_policy(self):
        """Rule: Verification expires after validity period."""
        self.assertEqual(CompetencyService.evaluate_state("verified", ["mentor"], is_expired=True), "expired")

if __name__ == "__main__":
    unittest.main()
