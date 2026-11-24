import unittest
from backend.app.database import SessionLocal
from backend.app.models.models import Student, PlacementDrive, AuditLogEntry

class TestTenantIsolation(unittest.TestCase):
    def setUp(self):
        self.db = SessionLocal()

    def tearDown(self):
        self.db.close()

    def test_cross_college_student_isolation(self):
        # Query students for College A
        col_a_students = self.db.query(Student).filter(Student.college_id == "COLLEGE-A").all()
        # Query students for College B
        col_b_students = self.db.query(Student).filter(Student.college_id == "COLLEGE-B").all()

        col_a_ids = {s.id for s in col_a_students}
        col_b_ids = {s.id for s in col_b_students}

        # Sets must not intersect
        self.assertEqual(len(col_a_ids.intersection(col_b_ids)), 0)
        self.assertTrue(len(col_a_students) > 0)

    def test_cross_college_audit_isolation(self):
        col_a_audits = self.db.query(AuditLogEntry).filter(AuditLogEntry.college_id == "COLLEGE-A").all()
        col_b_audits = self.db.query(AuditLogEntry).filter(AuditLogEntry.college_id == "COLLEGE-B").all()

        for a in col_a_audits:
            self.assertEqual(a.college_id, "COLLEGE-A")
        for b in col_b_audits:
            self.assertEqual(b.college_id, "COLLEGE-B")

if __name__ == "__main__":
    unittest.main()
