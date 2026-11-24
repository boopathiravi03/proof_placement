from typing import Dict, Any, List
from sqlalchemy.orm import Session
from backend.app.models.models import EligibilityRule, EligibilityDecision, EligibilityAppeal, Student, Competency
from backend.app.services.audit_service import AuditService

class EligibilityService:
    @staticmethod
    def evaluate_eligibility(
        db: Session,
        rules: Dict[str, Any],
        student_data: Dict[str, Any],
        student_id: str,
        college_id: str
    ) -> Dict[str, Any]:
        min_cgpa = float(rules.get("min_cgpa", 6.5))
        max_backlogs = int(rules.get("max_backlogs", 0))
        required_skills = rules.get("required_skills", [])
        version = int(rules.get("version", 1))

        actual_cgpa = float(student_data.get("cgpa", 0.0))
        actual_backlogs = int(student_data.get("backlogs", 0))
        verified_skills = set(student_data.get("verified_skills", []))

        failed_rules: List[str] = []
        if actual_cgpa < min_cgpa:
            failed_rules.append(f"Minimum CGPA requirement: needed {min_cgpa}, student has {actual_cgpa}")
        if actual_backlogs > max_backlogs:
            failed_rules.append(f"Maximum active backlogs: allowed {max_backlogs}, student has {actual_backlogs}")
        for skill in required_skills:
            if skill not in verified_skills:
                failed_rules.append(f"Required verified skill '{skill}' missing from verified profile")

        is_eligible = len(failed_rules) == 0

        # Persist decision in database
        decision = EligibilityDecision(
            college_id=college_id,
            student_id=student_id,
            rule_id=str(rules.get("rule_id", "rule-v" + str(version))),
            rule_version=version,
            eligible=is_eligible,
            student_inputs=student_data,
            failed_conditions=failed_rules
        )
        db.add(decision)
        db.commit()
        db.refresh(decision)

        AuditService.log_event(
            db=db,
            college_id=college_id,
            actor="System Eligibility Engine",
            action=f"Evaluated student {student_id} for rule v{version}: {'ELIGIBLE' if is_eligible else 'INELIGIBLE'} ({len(failed_rules)} failed conditions)"
        )

        return {
            "eligible": is_eligible,
            "failed_rules": failed_rules,
            "rule_version": version,
            "inputs": student_data,
            "decision_id": decision.id
        }

    @staticmethod
    def submit_appeal(
        db: Session,
        decision_id: str,
        student_id: str,
        reason: str
    ) -> EligibilityAppeal:
        decision = db.query(EligibilityDecision).filter(EligibilityDecision.id == decision_id).first()
        if not decision:
            raise ValueError(f"Decision {decision_id} not found")

        decision.appealed = True
        appeal = EligibilityAppeal(
            decision_id=decision_id,
            student_id=student_id,
            college_id=decision.college_id,
            reason=reason,
            status="pending"
        )
        db.add(appeal)
        db.commit()
        db.refresh(appeal)

        AuditService.log_event(
            db=db,
            college_id=decision.college_id,
            actor=f"Student {student_id}",
            action=f"Appealed ineligibility decision {decision_id}: '{reason[:60]}...'"
        )
        return appeal
