from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from backend.app.models.models import QuestionBank, AssessmentAttempt, Competency, Student
from backend.app.services.competency_service import CompetencyService
from backend.app.services.audit_service import AuditService

class AssessmentService:
    @staticmethod
    def get_adaptive_question(
        db: Session,
        category: str,
        target_level: int,
        exclude_question_ids: List[str]
    ) -> Optional[QuestionBank]:
        # Search at target level first, fallback to adjacent levels (+/- 1)
        levels_to_try = [target_level]
        if target_level + 1 <= 3:
            levels_to_try.append(target_level + 1)
        if target_level - 1 >= 1:
            levels_to_try.append(target_level - 1)

        for lvl in levels_to_try:
            query = (
                db.query(QuestionBank)
                .filter(QuestionBank.category.ilike(category))
                .filter(QuestionBank.difficulty_level == lvl)
            )
            if exclude_question_ids:
                query = query.filter(~QuestionBank.id.in_(exclude_question_ids))
            q = query.first()
            if q:
                return q
        
        # Any remaining question in category
        fallback_query = db.query(QuestionBank).filter(QuestionBank.category.ilike(category))
        if exclude_question_ids:
            fallback_query = fallback_query.filter(~QuestionBank.id.in_(exclude_question_ids))
        return fallback_query.first()

    @staticmethod
    def submit_answer(
        db: Session,
        student_id: str,
        category: str,
        question_id: str,
        selected_option_index: int,
        current_difficulty: int
    ) -> Dict[str, Any]:
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise ValueError(f"Student {student_id} not found")

        question = db.query(QuestionBank).filter(QuestionBank.id == question_id).first()
        if not question:
            raise ValueError(f"Question {question_id} not found")

        is_correct = (selected_option_index == question.correct_option_index)
        
        # Adaptive difficulty adjustment
        if is_correct:
            next_difficulty = min(3, current_difficulty + 1)
            feedback = f"Correct! Complexity adapted upwards to Level {next_difficulty}."
        else:
            next_difficulty = max(1, current_difficulty - 1)
            feedback = f"Incorrect. Foundational support enabled at Level {next_difficulty}."

        return {
            "is_correct": is_correct,
            "next_difficulty": next_difficulty,
            "feedback": feedback,
            "explanation": question.explanation
        }

    @staticmethod
    def complete_assessment(
        db: Session,
        student_id: str,
        category: str,
        score: int,
        total_questions: int,
        history: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise ValueError(f"Student {student_id} not found")

        percentage = (score / total_questions) * 100 if total_questions > 0 else 0
        passed = percentage >= 60.0

        # Save attempt in DB
        attempt = AssessmentAttempt(
            college_id=student.college_id,
            student_id=student_id,
            category=category,
            score=score,
            total_questions=total_questions,
            passed=passed,
            history=history
        )
        db.add(attempt)
        db.commit()
        db.refresh(attempt)

        competency_state = None
        if passed:
            # Promote competency to 'assessed'
            competency = CompetencyService.add_evidence(
                db=db,
                student_id=student_id,
                skill_name=category,
                kind="test",
                title=f"Adaptive {category} Assessment ({score}/{total_questions})",
                ref_url=f"/assessments/attempts/{attempt.id}",
                confidence=round(percentage / 100.0, 2),
                extra_metadata={"score": score, "total": total_questions, "percentage": percentage}
            )
            competency_state = competency.state

        AuditService.log_event(
            db=db,
            college_id=student.college_id,
            actor=student.name,
            action=f"Completed {category} assessment: {score}/{total_questions} ({'PASSED' if passed else 'FAILED'})"
        )

        return {
            "attempt_id": attempt.id,
            "passed": passed,
            "score": score,
            "total_questions": total_questions,
            "percentage": percentage,
            "competency_state": competency_state,
            "summary": (
                f"Scored {score}/{total_questions}. "
                f"{'Skill is now Assessed. An authorized mentor sign-off will upgrade to Verified.' if passed else 'Score below 60% threshold. Practice exercises recommended.'}"
            )
        }
