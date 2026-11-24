import unittest
from backend.app.database import SessionLocal
from backend.app.models.models import AuditLogEntry
from backend.app.services.audit_service import AuditService

class TestAuditChain(unittest.TestCase):
    def setUp(self):
        self.db = SessionLocal()
        self.college_id = "TEST-COLLEGE-AUDIT"
        # Clean any old test records
        self.db.query(AuditLogEntry).filter(AuditLogEntry.college_id == self.college_id).delete()
        self.db.commit()

    def tearDown(self):
        self.db.query(AuditLogEntry).filter(AuditLogEntry.college_id == self.college_id).delete()
        self.db.commit()
        self.db.close()

    def test_hash_chain_creation_and_tamper_detection(self):
        # 1. Log sequential events
        e1 = AuditService.log_event(self.db, self.college_id, "System", "Genesis initial event")
        self.assertEqual(e1.prev_hash, "GENESIS")
        self.assertIsNotNone(e1.hash)

        e2 = AuditService.log_event(self.db, self.college_id, "Officer", "Drive scheduled")
        self.assertEqual(e2.prev_hash, e1.hash)

        e3 = AuditService.log_event(self.db, self.college_id, "Student", "Evidence uploaded")
        self.assertEqual(e3.prev_hash, e2.hash)

        # 2. Verify intact chain
        is_intact, entries = AuditService.verify_chain(self.db, self.college_id)
        self.assertTrue(is_intact)
        self.assertEqual(len(entries), 3)

        # 3. Simulate tampering with the middle entry
        e2.action = "Tampered action by an attacker"
        self.db.commit()

        # 4. Re-verify - must detect tampering!
        is_intact_after_tampering, _ = AuditService.verify_chain(self.db, self.college_id)
        self.assertFalse(is_intact_after_tampering)

if __name__ == "__main__":
    unittest.main()
