from typing import Dict, Any

class FairnessService:
    @staticmethod
    def calculate_disparate_impact(selection_rates: Dict[str, float]) -> Dict[str, Any]:
        """
        Calculates the four-fifths (80%) rule impact ratio across demographic or branch cohorts.
        selection_rates example: {"Male": 42.0, "Female": 31.0, "General": 44.0, "Reserved": 29.0}
        """
        if not selection_rates:
            return {}

        max_rate = max(selection_rates.values()) if selection_rates else 1.0
        if max_rate <= 0:
            max_rate = 1.0

        results = {}
        flags_count = 0

        for group, rate in selection_rates.items():
            ratio = round(rate / max_rate, 2)
            is_flagged = ratio < 0.80
            if is_flagged:
                flags_count += 1
                
            results[group] = {
                "selection_rate": rate,
                "impact_ratio": ratio,
                "review_required": is_flagged,
                "status": "Review Flagged" if is_flagged else "Within Tolerance",
                "explanation": (
                    f"Selection rate of {rate}% yields a {int(ratio*100)}% ratio relative to the highest performing group ({max_rate}%). "
                    f"{'Falls below the 80% four-fifths guideline and is queued for T&P human review.' if is_flagged else 'Meets statutory equitable participation benchmarks.'}"
                )
            }

        return {
            "highest_rate": max_rate,
            "groups": results,
            "total_groups_reviewed": len(selection_rates),
            "flagged_groups_count": flags_count,
            "disclaimer": "Four-fifths compliance analysis is an early-warning diagnostic tool to prevent systemic placement disparity."
        }
