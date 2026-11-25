import unittest
import threading
import uuid
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.database import Base
from backend.app.models.models import (
    College,
    Student,
    EligibilityRule,
    EligibilityDecision,
    AuditLogEntry,
    DataAccessLog,
    SecurityEvent,
)
from backend.app.services.governance_service import GovernanceService
from backend.app.services.privacy_retention_service import PrivacyRetentionService
from backend.app.services.audit_service import AuditService
from backend.app.services.fairness_service import FairnessService
from backend.app.services.explanation_service import ExplanationService
from backend.app.main import check_rate_limit, _RATE_LIMIT_STORE


class TestPhase8GovernanceSecurity(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        Base.metadata.create_all(bind=self.engine)
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        self.db = self.SessionLocal()

        # Seed two colleges & students for tenant isolation tests
        self.db.add(College(id="COLLEGE-A", code="ALPHA", name="Alpha Engineering College"))
        self.db.add(College(id="COLLEGE-B", code="BETA", name="Beta Institute"))
        self.db.add(
            Student(
                id="STU-A1",
                user_id="USR-A1",
                college_id="COLLEGE-A",
                name="Alice",
                branch="CSE",
                cgpa=8.5,
                backlogs=0,
            )
        )
        self.db.add(
            Student(
                id="STU-A2",
                user_id="USR-A2",
                college_id="COLLEGE-A",
                name="Aaron",
                branch="CSE",
                cgpa=7.8,
                backlogs=0,
            )
        )
        self.db.add(
            Student(
                id="STU-A3",
                user_id="USR-A3",
                college_id="COLLEGE-A",
                name="Aria",
                branch="CSE",
                cgpa=8.1,
                backlogs=0,
            )
        )
        self.db.add(
            Student(
                id="STU-A4",
                user_id="USR-A4",
                college_id="COLLEGE-A",
                name="Ben",
                branch="MECH",
                cgpa=7.4,
                backlogs=0,
            )
        )
        self.db.add(
            Student(
                id="STU-B1",
                user_id="USR-B1",
                college_id="COLLEGE-B",
                name="Bob",
                branch="ECE",
                cgpa=8.0,
                backlogs=0,
            )
        )
        self.db.commit()

    def tearDown(self):
        self.db.close()

    def test_consent_grant_revoke_and_enforcement(self):
        consents = GovernanceService.get_student_consents(self.db, "STU-A1")
        self.assertEqual(len(consents), 6)

        # Revoke github_sync
        res = GovernanceService.set_consent(self.db, "STU-A1", "github_sync", False, "v2.0")
        self.assertFalse(res["granted"])

        allowed, reason = GovernanceService.check_consent(self.db, "STU-A1", "github_sync")
        self.assertFalse(allowed)
        self.assertIn("revoked", reason.lower())

        # Enforced by authorize_and_log_access
        with self.assertRaises(PermissionError):
            GovernanceService.authorize_and_log_access(
                db=self.db,
                actor_id="OFF-A1",
                actor_role="officer",
                actor_college_id="COLLEGE-A",
                student_id="STU-A1",
                resource_type="github_profile",
                resource_id=None,
                purpose="sync_repos",
                require_consent_purpose="github_sync",
            )

        # Re-grant consent
        res2 = GovernanceService.set_consent(self.db, "STU-A1", "github_sync", True, "v2.0")
        self.assertTrue(res2["granted"])
        allowed2, _ = GovernanceService.check_consent(self.db, "STU-A1", "github_sync")
        self.assertTrue(allowed2)

    def test_rbac_and_cross_tenant_isolation(self):
        # Cross-tenant officer denied
        with self.assertRaises(PermissionError):
            GovernanceService.authorize_and_log_access(
                db=self.db,
                actor_id="OFF-B1",
                actor_role="officer",
                actor_college_id="COLLEGE-B",
                student_id="STU-A1",
                resource_type="student_profile",
                resource_id="STU-A1",
                purpose="view_dossier",
            )

        # Student accessing another student's record denied
        with self.assertRaises(PermissionError):
            GovernanceService.authorize_and_log_access(
                db=self.db,
                actor_id="STU-A2",
                actor_role="student",
                actor_college_id="COLLEGE-A",
                student_id="STU-A1",
                resource_type="student_profile",
                resource_id="STU-A1",
                purpose="view_dossier",
            )

        # Recruiter least-privilege restriction on learning_activity
        with self.assertRaises(PermissionError):
            GovernanceService.authorize_and_log_access(
                db=self.db,
                actor_id="REC-1",
                actor_role="recruiter",
                actor_college_id="RECRUITER",
                student_id="STU-A1",
                resource_type="learning_activity",
                resource_id=None,
                purpose="candidate_review",
            )

        # Verify DataAccessLog and SecurityEvent were recorded
        logs = self.db.query(DataAccessLog).filter(DataAccessLog.student_id == "STU-A1").all()
        self.assertEqual(len(logs), 3)
        self.assertTrue(all(not l.allowed for l in logs))
        sec_events = self.db.query(SecurityEvent).filter(SecurityEvent.college_id == "COLLEGE-A").all()
        self.assertEqual(len(sec_events), 3)

    def test_privacy_notice_retention_and_requests(self):
        notice = PrivacyRetentionService.get_active_privacy_notice(self.db)
        self.assertEqual(notice["version"], "v2.0")
        self.assertIn("does not claim formal legal certification", notice["legal_disclaimer"])

        policies = PrivacyRetentionService.get_retention_policies(self.db, "COLLEGE-A")
        self.assertGreaterEqual(len(policies), 6)

        # Data export workflow
        req_exp = PrivacyRetentionService.submit_privacy_request(
            self.db, "STU-A1", "data_export", "Need my DPDP export"
        )
        processed_exp = PrivacyRetentionService.process_privacy_request(
            self.db, req_exp.id, "COLLEGE-A", "Dr. Officer", "officer", "approved", "Export generated"
        )
        self.assertEqual(processed_exp["status"], "completed")
        self.assertEqual(processed_exp["export_bundle"]["student"]["id"], "STU-A1")

        # Retention exception on deletion request
        req_del = PrivacyRetentionService.submit_privacy_request(
            self.db, "STU-A2", "deletion_erasure", "Delete placement record"
        )
        processed_ret = PrivacyRetentionService.process_privacy_request(
            self.db, req_del.id, "COLLEGE-A", "Dr. Officer", "officer", "restricted_retained", "Active placement audit hold"
        )
        self.assertTrue(processed_ret["retention_exception_applied"])

        # Approved erasure anonymizes PII
        req_del2 = PrivacyRetentionService.submit_privacy_request(
            self.db, "STU-A1", "deletion_erasure", "Erase my PII"
        )
        processed_del = PrivacyRetentionService.process_privacy_request(
            self.db, req_del2.id, "COLLEGE-A", "Dr. Officer", "officer", "approved", "Anonymized"
        )
        self.assertEqual(processed_del["status"], "completed")
        stu = self.db.query(Student).filter(Student.id == "STU-A1").first()
        self.assertTrue(stu.name.startswith("Anonymized-"))
        self.assertTrue(stu.github_consent_revoked)

    def test_fairness_audit_and_small_group_suppression(self):
        rule = EligibilityRule(id="RULE-1", college_id="COLLEGE-A", rule_name="SDE", min_cgpa=7.0, max_backlogs=0)
        self.db.add(rule)
        # 3 CSE students (>= 3 -> included), 1 MECH student (< 3 -> suppressed)
        for sid, elig, override_by in [
            ("STU-A1", True, None),
            ("STU-A2", True, None),
            ("STU-A3", False, "Dr. Officer"),  # unjustified override (empty override_reason)
            ("STU-A4", True, None),
        ]:
            self.db.add(
                EligibilityDecision(
                    college_id="COLLEGE-A",
                    student_id=sid,
                    rule_id="RULE-1",
                    rule_version="v1",
                    student_inputs={"cgpa": 8.0, "backlogs": 0},
                    eligible=elig,
                    override_by=override_by,
                    override_reason="",
                )
            )
        self.db.commit()

        report = FairnessService.run_comprehensive_fairness_audit(self.db, "COLLEGE-A", reviewer_name="Dr. Officer")
        self.assertIn("MECH", report["disparity_indicators"]["suppressed_small_groups"])
        self.assertIn("CSE", report["disparity_indicators"]["groups"])
        self.assertTrue(any("lack a documented reason" in a for a in report["anomalies_detected"]))

    def test_explanation_service(self):
        rec = ExplanationService.record_explanation(
            db=self.db,
            college_id="COLLEGE-A",
            student_id="STU-A1",
            module="eligibility",
            decision_output={"eligible": True, "score": 88},
            inputs_used={"cgpa": 8.5, "backlogs": 0},
            supporting_evidence=["EV-101"],
            missing_data=[],
            ai_contributed=False,
        )
        self.assertIsNotNone(rec.id)
        fetched = ExplanationService.get_explanations_for_student(self.db, "COLLEGE-A", "STU-A1")
        self.assertEqual(len(fetched), 1)
        self.assertEqual(fetched[0]["module"], "eligibility")

    def test_audit_hash_chain_tamper_checkpoint_and_concurrency(self):
        # Concurrent writes across 6 threads
        errors = []

        def worker(idx: int):
            s = self.SessionLocal()
            try:
                AuditService.log_event(s, "COLLEGE-A", f"Actor-{idx}", f"Action-{idx}")
            except Exception as exc:
                errors.append(exc)
            finally:
                s.close()

        threads = [threading.Thread(target=worker, args=(i,)) for i in range(6)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        self.assertEqual(errors, [])

        verif = AuditService.verify_chain_detailed(self.db, "COLLEGE-A")
        self.assertTrue(verif["chain_intact"])
        self.assertEqual(verif["total_checked"], 6)

        cp = AuditService.create_signed_checkpoint(self.db, "COLLEGE-A")
        self.assertTrue(cp["verified_intact"])
        self.assertEqual(cp["event_count"], 6)
        self.assertEqual(len(cp["hmac_signature"]), 64)

        # Simulate tampering on an entry
        entry = self.db.query(AuditLogEntry).filter(AuditLogEntry.college_id == "COLLEGE-A").first()
        entry.action = "TAMPERED_ACTION"
        self.db.commit()

        verif_after = AuditService.verify_chain_detailed(self.db, "COLLEGE-A")
        self.assertFalse(verif_after["chain_intact"])
        self.assertEqual(verif_after["broken_event_id"], entry.id)

    def test_file_upload_redaction_and_rate_limit(self):
        # Blocked extension & oversized
        with self.assertRaises(ValueError):
            GovernanceService.validate_file_upload("malware.exe", 1024)
        with self.assertRaises(ValueError):
            GovernanceService.validate_file_upload("transcript.pdf", 20 * 1024 * 1024)
        GovernanceService.validate_file_upload("certificate.pdf", 1024)

        # Redaction
        redacted = GovernanceService.redact_sensitive_fields(
            {"name": "Alice", "github_token": "ghp_secret", "nested": {"password_hash": "abc"}}
        )
        self.assertEqual(redacted["name"], "Alice")
        self.assertEqual(redacted["github_token"], "[REDACTED]")
        self.assertEqual(redacted["nested"]["password_hash"], "[REDACTED]")

        # Rate limiter
        key = f"test-ip-{uuid.uuid4()}"
        _RATE_LIMIT_STORE.pop(key, None)
        for _ in range(3):
            self.assertTrue(check_rate_limit(key, max_requests=3, window_seconds=60))
        self.assertFalse(check_rate_limit(key, max_requests=3, window_seconds=60))


if __name__ == "__main__":
    unittest.main()
