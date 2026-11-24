import unittest
from backend.app.services.fairness_service import FairnessService

class TestFairnessService(unittest.TestCase):
    def test_four_fifths_disparate_impact_detection(self):
        # General has 44% (highest), Reserved has 29% -> 29/44 = 0.66 (< 0.8) -> should flag
        rates = {
            "Male": 42.0,
            "Female": 31.0,
            "General": 44.0,
            "Reserved": 29.0
        }
        res = FairnessService.calculate_disparate_impact(rates)
        groups = res["groups"]

        self.assertEqual(res["highest_rate"], 44.0)
        self.assertFalse(groups["General"]["review_required"])
        self.assertEqual(groups["General"]["impact_ratio"], 1.0)

        # Reserved ratio: 29/44 = 0.66
        self.assertTrue(groups["Reserved"]["review_required"])
        self.assertEqual(groups["Reserved"]["impact_ratio"], 0.66)

        # Female ratio: 31/44 = 0.70 (< 0.8)
        self.assertTrue(groups["Female"]["review_required"])
        self.assertEqual(groups["Female"]["impact_ratio"], 0.70)

        # Male ratio: 42/44 = 0.95 (>= 0.8)
        self.assertFalse(groups["Male"]["review_required"])
        self.assertEqual(groups["Male"]["impact_ratio"], 0.95)

if __name__ == "__main__":
    unittest.main()
