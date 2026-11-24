import unittest
from backend.app.services.competency_service import CompetencyService

class TestCompetencyLifecycle(unittest.TestCase):
    def test_default_state_is_claimed(self):
        state = CompetencyService.evaluate_state("claimed", [])
        self.assertEqual(state, "claimed")

    def test_github_commits_produce_evidence_linked_never_verified(self):
        # Rule: GitHub code alone must NEVER produce Verified status
        state = CompetencyService.evaluate_state("claimed", ["commit", "repo"])
        self.assertEqual(state, "evidence_linked")
        self.assertNotEqual(state, "verified")

    def test_assessment_produces_assessed(self):
        state = CompetencyService.evaluate_state("evidence_linked", ["commit", "test"])
        self.assertEqual(state, "assessed")

    def test_mentor_signoff_produces_verified(self):
        # Mentor sign-off on top of assessment/evidence produces verified
        state = CompetencyService.evaluate_state("assessed", ["commit", "test"], has_mentor_signoff=True)
        self.assertEqual(state, "verified")

    def test_expired_state(self):
        state = CompetencyService.evaluate_state("verified", ["test"], has_mentor_signoff=True, is_expired=True)
        self.assertEqual(state, "expired")

if __name__ == "__main__":
    unittest.main()
