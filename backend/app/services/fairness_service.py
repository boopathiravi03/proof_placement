from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from backend.app.models.models import (
    EligibilityDecision,
    EligibilityRule,
    Student,
    FairnessAudit,
)
from backend.app.services.audit_service import AuditService


class FairnessService:
    @staticmethod
    def calculate_disparate_impact(selection_rates: Dict[str, float]) -> Dict[str, Any]:
        """
        Calculates the four-fifths (80%) rule impact ratio across demographic or branch cohorts.
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
                ),
            }

        return {
            "highest_rate": max_rate,
            "groups": results,
            "total_groups_reviewed": len(selection_rates),
            "flagged_groups_count": flags_count,
            "disclaimer": "Four-fifths compliance analysis is an early-warning diagnostic tool to prevent systemic placement disparity.",
        }

    @staticmethod
    def run_comprehensive_fairness_audit(
        db: Session,
        college_id: str,
        analysis_period: str = "2025-2026",
        reviewer_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        decisions = db.query(EligibilityDecision).filter(EligibilityDecision.college_id == college_id).all()
        rules = db.query(EligibilityRule).filter(EligibilityRule.college_id == college_id).all()
        students = db.query(Student).filter(Student.college_id == college_id).all()

        anomalies: List[str] = []

        # 1. Check inconsistent rule versions applied in the same college
        versions_used = {d.rule_version for d in decisions}
        if len(versions_used) > 1:
            anomalies.append(f"Multiple eligibility rule versions ({sorted(versions_used)}) active across historical evaluations.")

        # 2. Check overrides without documented reasons
        unjustified_overrides = sum(1 for d in decisions if d.override_by and not (d.override_reason or "").strip())
        if unjustified_overrides:
            anomalies.append(f"{unjustified_overrides} eligibility override(s) lack a documented reason.")

        # 3. Branch-level selection/eligibility rates with small-group suppression (k < 3)
        by_branch: Dict[str, Dict[str, int]] = {}
        student_branch = {s.id: s.branch for s in students}
        for d in decisions:
            br = student_branch.get(d.student_id, "Unknown")
            by_branch.setdefault(br, {"total": 0, "eligible": 0})
            by_branch[br]["total"] += 1
            if d.eligible:
                by_branch[br]["eligible"] += 1

        rates_for_disparity = {}
        suppressed_groups = []
        for br, stats in by_branch.items():
            if stats["total"] < 3:
                suppressed_groups.append(br)
                continue
            rates_for_disparity[br] = round((stats["eligible"] / stats["total"]) * 100.0, 1)

        disparity = FairnessService.calculate_disparate_impact(rates_for_disparity) if rates_for_disparity else {}

        audit_rec = FairnessAudit(
            college_id=college_id,
            analysis_period=analysis_period,
            population_size=len(students),
            rules_examined=[f"{r.rule_name} (v{r.version})" for r in rules] or ["Default Role Rules"],
            data_coverage_pct=round((len({d.student_id for d in decisions}) / max(len(students), 1)) * 100.0, 1),
            anomalies_detected=anomalies,
            disparity_indicators={**disparity, "suppressed_small_groups": suppressed_groups},
            limitations="Absence of detected anomalies does not guarantee absence of bias. Groups with < 3 evaluations are suppressed for privacy.",
            recommended_investigation="Review any flagged disparity ratios or multiple rule versions with the T&P Governance Committee.",
            human_reviewer=reviewer_name,
            review_outcome="pending_review",
        )
        db.add(audit_rec)
        db.commit()
        db.refresh(audit_rec)

        AuditService.log_event(
            db=db,
            college_id=college_id,
            actor=reviewer_name or "Fairness Auditor",
            action=f"Executed fairness audit {audit_rec.id} ({len(anomalies)} anomalies detected)",
        )

        return {
            "audit_id": audit_rec.id,
            "college_id": college_id,
            "analysis_period": analysis_period,
            "population_size": audit_rec.population_size,
            "data_coverage_pct": audit_rec.data_coverage_pct,
            "anomalies_detected": anomalies,
            "disparity_indicators": audit_rec.disparity_indicators,
            "limitations": audit_rec.limitations,
            "recommended_investigation": audit_rec.recommended_investigation,
            "review_outcome": audit_rec.review_outcome,
        }
