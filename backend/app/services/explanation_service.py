from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from backend.app.models.models import ExplanationRecord


class ExplanationService:
    @staticmethod
    def record_explanation(
        db: Session,
        college_id: str,
        module: str,
        decision_output: Dict[str, Any],
        inputs_used: Dict[str, Any],
        rule_or_model_version: str = "v2.0",
        supporting_evidence: Optional[List[str]] = None,
        missing_data: Optional[List[str]] = None,
        ai_contributed: bool = False,
        human_reviewed: bool = False,
        student_id: Optional[str] = None,
    ) -> ExplanationRecord:
        rec = ExplanationRecord(
            college_id=college_id,
            student_id=student_id,
            module=module,
            decision_output=decision_output,
            inputs_used=inputs_used,
            rule_or_model_version=rule_or_model_version,
            supporting_evidence=supporting_evidence or [],
            missing_data=missing_data or [],
            ai_contributed=ai_contributed,
            human_reviewed=human_reviewed,
        )
        db.add(rec)
        db.commit()
        db.refresh(rec)
        return rec

    @staticmethod
    def get_explanations_for_student(db: Session, college_id: str, student_id: str) -> List[Dict[str, Any]]:
        rows = (
            db.query(ExplanationRecord)
            .filter(ExplanationRecord.college_id == college_id, ExplanationRecord.student_id == student_id)
            .order_by(ExplanationRecord.created_at.desc())
            .limit(20)
            .all()
        )
        return [
            {
                "id": r.id,
                "module": r.module,
                "decision_output": r.decision_output,
                "inputs_used": r.inputs_used,
                "rule_or_model_version": r.rule_or_model_version,
                "supporting_evidence": r.supporting_evidence,
                "missing_data": r.missing_data,
                "ai_contributed": r.ai_contributed,
                "human_reviewed": r.human_reviewed,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in rows
        ]
