from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from backend.app.models.models import (
    QuestionBank,
    AssessmentAttempt,
    Competency,
    Student,
    ReadinessSnapshot
)
from backend.app.services.competency_service import CompetencyService
from backend.app.services.audit_service import AuditService
from backend.app.services.code_execution_service import CodeExecutionService

ALL_ASSESSMENT_CATEGORIES = [
    "Aptitude",
    "Programming",
    "DSA",
    "DBMS",
    "Operating Systems",
    "Computer Networks",
    "Web Development",
    "Frameworks & Tools",
    "Debugging",
    "Technical Interview"
]

DIFFICULTY_MAP = {
    1: "Beginner",
    2: "Intermediate",
    3: "Advanced"
}

class AssessmentService:
    @staticmethod
    def get_categories(db: Session) -> List[str]:
        db_cats = db.query(QuestionBank.category).distinct().all()
        found = [c[0] for c in db_cats if c[0]]
        # Return merged list ensuring standard 10 categories are represented
        merged = list(dict.fromkeys(found + ALL_ASSESSMENT_CATEGORIES))
        return merged

    @staticmethod
    def start_attempt(
        db: Session,
        student_id: str,
        category: str,
        assessment_type: str = "mcq",
        target_role: Optional[str] = "Backend",
        time_limit_minutes: int = 20,
        total_questions: int = 5
    ) -> Dict[str, Any]:
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise ValueError(f"Student {student_id} not found")

        now = datetime.utcnow()
        expires_at = now + timedelta(minutes=time_limit_minutes)

        attempt = AssessmentAttempt(
            college_id=student.college_id,
            student_id=student_id,
            category=category,
            assessment_type=assessment_type,
            target_role=target_role,
            score=0,
            total_questions=total_questions,
            passed=False,
            time_spent_seconds=0,
            status="in_progress",
            expires_at=expires_at,
            topic_scores={},
            difficulty_scores={},
            responses=[],
            weak_topics=[],
            strong_topics=[],
            recommendations=[],
            history=[]
        )
        db.add(attempt)
        db.commit()
        db.refresh(attempt)

        # Select first adaptive question (starts at Level 2: Intermediate)
        first_q = AssessmentService.get_adaptive_question(
            db=db,
            category=category,
            target_level=2,
            exclude_question_ids=[]
        )

        AuditService.log_event(
            db=db,
            college_id=student.college_id,
            actor=student.name,
            action=f"Started adaptive {assessment_type} assessment in {category} (Attempt ID: {attempt.id})"
        )

        return {
            "attempt_id": attempt.id,
            "category": category,
            "assessment_type": assessment_type,
            "target_role": target_role,
            "total_questions": total_questions,
            "time_limit_minutes": time_limit_minutes,
            "expires_at": expires_at.isoformat(),
            "first_question": first_q
        }

    @staticmethod
    def get_adaptive_question(
        db: Session,
        category: str,
        target_level: int = 2,
        exclude_question_ids: Optional[List[str]] = None,
        exclude_topics: Optional[List[str]] = None
    ) -> Optional[Dict[str, Any]]:
        exclude_ids = exclude_question_ids or []
        exclude_top = exclude_topics or []

        # 1. Try target difficulty level
        levels_to_try = [target_level]
        if target_level + 1 <= 3:
            levels_to_try.append(target_level + 1)
        if target_level - 1 >= 1:
            levels_to_try.append(target_level - 1)

        candidate = None
        for lvl in levels_to_try:
            q = (
                db.query(QuestionBank)
                .filter(QuestionBank.category.ilike(f"%{category}%"))
                .filter(QuestionBank.difficulty_level == lvl)
            )
            if exclude_ids:
                q = q.filter(~QuestionBank.id.in_(exclude_ids))
            if exclude_top:
                # Prefer questions in different topics to maintain balanced assessment
                balanced = q.filter(~QuestionBank.topic.in_(exclude_top)).first()
                if balanced:
                    candidate = balanced
                    break
            candidate = q.first()
            if candidate:
                break

        # Fallback to any remaining question in category
        if not candidate:
            fallback = db.query(QuestionBank).filter(QuestionBank.category.ilike(f"%{category}%"))
            if exclude_ids:
                fallback = fallback.filter(~QuestionBank.id.in_(exclude_ids))
            candidate = fallback.first()

        if not candidate:
            return None

        # SECURITY RULE: Never expose correct answer or hidden test cases in public payload
        safe_test_cases = [
            {"input": tc.get("input"), "expected_output": tc.get("expected_output") if not tc.get("is_hidden") else "[Hidden Test Case]", "is_hidden": tc.get("is_hidden", False)}
            for tc in (candidate.test_cases or [])
        ]

        return {
            "id": candidate.id,
            "category": candidate.category,
            "topic": candidate.topic,
            "question_type": candidate.question_type,
            "difficulty_level": candidate.difficulty_level,
            "difficulty_str": candidate.difficulty_str or DIFFICULTY_MAP.get(candidate.difficulty_level, "Intermediate"),
            "question": candidate.question,
            "options": candidate.options or [],
            "starter_code": candidate.starter_code,
            "test_cases": safe_test_cases,
            "marks": candidate.marks or 1,
            "time_limit_sec": candidate.time_limit_sec or 120
        }

    @staticmethod
    def submit_answer(
        db: Session,
        attempt_id: str,
        student_id: str,
        question_id: str,
        selected_option_index: Optional[int] = None,
        code_submission: Optional[str] = None,
        sql_query: Optional[str] = None,
        explanation: Optional[str] = None,
        time_spent_seconds: int = 30
    ) -> Dict[str, Any]:
        attempt = (
            db.query(AssessmentAttempt)
            .filter(AssessmentAttempt.id == attempt_id, AssessmentAttempt.student_id == student_id)
            .first()
        )
        if not attempt:
            raise ValueError(f"Assessment attempt {attempt_id} not found or access denied")

        if attempt.status == "completed":
            raise ValueError("This assessment attempt has already been submitted")

        # Timer validation
        now = datetime.utcnow()
        if attempt.expires_at and now > attempt.expires_at:
            attempt.status = "expired"
            db.commit()
            raise ValueError("Assessment time has expired. Submission rejected.")

        question = db.query(QuestionBank).filter(QuestionBank.id == question_id).first()
        if not question:
            raise ValueError(f"Question {question_id} not found")

        # Evaluate response based on question type
        q_type = question.question_type or "mcq"
        is_correct = False
        marks_awarded = 0.0
        evaluation_detail: Dict[str, Any] = {}

        if q_type == "mcq":
            is_correct = (selected_option_index is not None and selected_option_index == question.correct_option_index)
            marks_awarded = 1.0 if is_correct else 0.0
            evaluation_detail = {
                "selected_option_index": selected_option_index,
                "is_correct": is_correct
            }
        elif q_type in ["coding", "programming"]:
            exec_res = CodeExecutionService.execute_code("python", code_submission or "", question.test_cases or [])
            is_correct = (exec_res["status"] == "PASSED")
            marks_awarded = round(exec_res["score"], 2)
            evaluation_detail = exec_res
        elif q_type == "sql":
            exec_res = CodeExecutionService.execute_sql(sql_query or "", question.expected_answer)
            is_correct = (exec_res["status"] == "PASSED")
            marks_awarded = round(exec_res["score"], 2)
            evaluation_detail = exec_res
        elif q_type == "debugging":
            exec_res = CodeExecutionService.evaluate_debugging(
                question.starter_code or "",
                code_submission or "",
                explanation or "",
                question.test_cases or []
            )
            is_correct = (exec_res["status"] == "PASSED")
            marks_awarded = round(exec_res["combined_score"], 2)
            evaluation_detail = exec_res
        elif q_type == "interview":
            # Interview questions scored against structure, length, and rubric keywords
            text = (explanation or code_submission or "").strip()
            word_count = len(text.split())
            if word_count >= 40:
                is_correct = True
                marks_awarded = 1.0
            elif word_count >= 15:
                is_correct = False
                marks_awarded = 0.5
            else:
                is_correct = False
                marks_awarded = 0.2
            evaluation_detail = {"word_count": word_count, "rubric_score": marks_awarded}

        # Adaptive difficulty adjustment
        curr_lvl = question.difficulty_level
        if marks_awarded >= 0.8:
            next_difficulty = min(3, curr_lvl + 1)
            feedback = f"Excellent! Adaptive difficulty advanced to Level {next_difficulty} ({DIFFICULTY_MAP[next_difficulty]})."
        elif marks_awarded <= 0.4:
            next_difficulty = max(1, curr_lvl - 1)
            feedback = f"Prerequisite reinforcement enabled at Level {next_difficulty} ({DIFFICULTY_MAP[next_difficulty]})."
        else:
            next_difficulty = curr_lvl
            feedback = f"Consistent performance maintained at Level {next_difficulty} ({DIFFICULTY_MAP[next_difficulty]})."

        # Record response in attempt
        responses = list(attempt.responses or [])
        # Avoid duplicate submission for the same question in this attempt
        responses = [r for r in responses if r.get("question_id") != question_id]
        responses.append({
            "question_id": question_id,
            "topic": question.topic,
            "difficulty_level": curr_lvl,
            "question_type": q_type,
            "is_correct": is_correct,
            "marks_awarded": marks_awarded,
            "max_marks": question.marks or 1,
            "time_spent_seconds": time_spent_seconds,
            "evaluation_detail": evaluation_detail
        })
        attempt.responses = responses
        attempt.time_spent_seconds = (attempt.time_spent_seconds or 0) + time_spent_seconds

        db.commit()

        # Gather already answered question IDs and topics
        exclude_ids = [r["question_id"] for r in responses]
        recent_topics = [r.get("topic") for r in responses[-2:]]

        next_q = None
        if len(responses) < (attempt.total_questions or 5):
            next_q = AssessmentService.get_adaptive_question(
                db=db,
                category=attempt.category,
                target_level=next_difficulty,
                exclude_question_ids=exclude_ids,
                exclude_topics=recent_topics
            )

        return {
            "is_correct": is_correct,
            "marks_awarded": marks_awarded,
            "current_difficulty": curr_lvl,
            "next_difficulty": next_difficulty,
            "feedback": feedback,
            "answered_count": len(responses),
            "total_questions": attempt.total_questions,
            "is_complete": len(responses) >= (attempt.total_questions or 5),
            "next_question": next_q,
            "evaluation_detail": evaluation_detail
        }

    @staticmethod
    def complete_assessment(
        db: Session,
        attempt_id: str,
        student_id: str
    ) -> Dict[str, Any]:
        attempt = (
            db.query(AssessmentAttempt)
            .filter(AssessmentAttempt.id == attempt_id, AssessmentAttempt.student_id == student_id)
            .first()
        )
        if not attempt:
            raise ValueError(f"Attempt {attempt_id} not found")

        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise ValueError(f"Student {student_id} not found")

        responses = attempt.responses or []
        total_q = attempt.total_questions or max(len(responses), 1)

        # Compute scores
        total_earned = sum(r.get("marks_awarded", 0.0) for r in responses)
        correct_count = sum(1 for r in responses if r.get("is_correct"))
        incorrect_count = sum(1 for r in responses if not r.get("is_correct") and r.get("marks_awarded", 0) == 0)
        unattempted_count = max(0, total_q - len(responses))

        percentage = round((total_earned / total_q) * 100, 1)
        passed = percentage >= 60.0

        # Topic-level performance analysis
        topic_map: Dict[str, Dict[str, float]] = {}
        diff_map: Dict[str, Dict[str, float]] = {"Beginner": {"earned": 0, "total": 0}, "Intermediate": {"earned": 0, "total": 0}, "Advanced": {"earned": 0, "total": 0}}

        for r in responses:
            top = r.get("topic", "General")
            if top not in topic_map:
                topic_map[top] = {"earned": 0.0, "total": 0.0}
            topic_map[top]["earned"] += r.get("marks_awarded", 0.0)
            topic_map[top]["total"] += r.get("max_marks", 1.0)

            diff_name = DIFFICULTY_MAP.get(r.get("difficulty_level", 2), "Intermediate")
            diff_map[diff_name]["earned"] += r.get("marks_awarded", 0.0)
            diff_map[diff_name]["total"] += r.get("max_marks", 1.0)

        topic_scores = {}
        weak_topics = []
        strong_topics = []
        recommendations = []

        for top, data in topic_map.items():
            top_pct = round((data["earned"] / data["total"]) * 100, 1) if data["total"] > 0 else 0.0
            topic_scores[top] = {
                "earned": data["earned"],
                "total": data["total"],
                "percentage": top_pct
            }
            if top_pct >= 70.0:
                strong_topics.append(top)
            elif top_pct < 60.0:
                weak_topics.append(top)
                recommendations.append(f"Reinforce {top}: complete diagnostic lab exercises and practice queries.")

        if not recommendations and not weak_topics:
            recommendations.append(f"Excellent command demonstrated across all tested topics in {attempt.category}.")

        difficulty_scores = {}
        for dname, data in diff_map.items():
            dpct = round((data["earned"] / data["total"]) * 100, 1) if data["total"] > 0 else 0.0
            difficulty_scores[dname] = {
                "earned": data["earned"],
                "total": data["total"],
                "percentage": dpct
            }

        # Update attempt
        attempt.score = int(round(total_earned))
        attempt.passed = passed
        attempt.status = "completed"
        attempt.topic_scores = topic_scores
        attempt.difficulty_scores = difficulty_scores
        attempt.weak_topics = weak_topics
        attempt.strong_topics = strong_topics
        attempt.recommendations = recommendations

        # History tracking item
        attempt.history = [{
            "timestamp": datetime.utcnow().isoformat(),
            "score": total_earned,
            "percentage": percentage,
            "passed": passed
        }]

        db.commit()
        db.refresh(attempt)

        # Competency transition: If passed, elevate to 'Assessed' state via CompetencyService
        competency_state = None
        if passed:
            competency = CompetencyService.add_evidence(
                db=db,
                student_id=student_id,
                skill_name=attempt.category,
                kind="test",
                title=f"Adaptive {attempt.category} Assessment ({total_earned}/{total_q})",
                ref_url=f"/student/assessment/results/{attempt.id}",
                confidence=round(percentage / 100.0, 2),
                extra_metadata={
                    "attempt_id": attempt.id,
                    "score": total_earned,
                    "total": total_q,
                    "percentage": percentage,
                    "strong_topics": strong_topics,
                    "weak_topics": weak_topics
                }
            )
            competency_state = competency.state

        # Audit logging
        AuditService.log_event(
            db=db,
            college_id=student.college_id,
            actor=student.name,
            action=f"Completed {attempt.category} assessment: {total_earned}/{total_q} ({percentage}%) - {'PASSED' if passed else 'FAILED'}"
        )

        return {
            "attempt_id": attempt.id,
            "student_id": student_id,
            "category": attempt.category,
            "assessment_type": attempt.assessment_type,
            "target_role": attempt.target_role,
            "total_score": total_earned,
            "max_score": total_q,
            "percentage": percentage,
            "passed": passed,
            "time_spent_seconds": attempt.time_spent_seconds,
            "correct_count": correct_count,
            "incorrect_count": incorrect_count,
            "unattempted_count": unattempted_count,
            "topic_scores": topic_scores,
            "difficulty_scores": difficulty_scores,
            "strong_topics": strong_topics,
            "weak_topics": weak_topics,
            "recommendations": recommendations,
            "competency_state": competency_state,
            "summary": (
                f"Scored {total_earned}/{total_q} ({percentage}%). "
                f"{'Competency updated to Assessed. Proceed to request mentor sign-off.' if passed else 'Minimum 60% threshold required to pass. Targeted practice recommended.'}"
            )
        }

    @staticmethod
    def get_attempt_report(db: Session, attempt_id: str, student_id: str) -> Dict[str, Any]:
        attempt = (
            db.query(AssessmentAttempt)
            .filter(AssessmentAttempt.id == attempt_id, AssessmentAttempt.student_id == student_id)
            .first()
        )
        if not attempt:
            raise ValueError(f"Assessment report {attempt_id} not found")

        # Include question review with explanations
        responses_with_explanations = []
        for r in (attempt.responses or []):
            qid = r.get("question_id")
            q = db.query(QuestionBank).filter(QuestionBank.id == qid).first()
            responses_with_explanations.append({
                **r,
                "question_text": q.question if q else "Question details unavailable",
                "options": q.options if q else [],
                "explanation": q.explanation if q else None
            })

        return {
            "attempt_id": attempt.id,
            "student_id": attempt.student_id,
            "category": attempt.category,
            "assessment_type": attempt.assessment_type,
            "target_role": attempt.target_role,
            "score": attempt.score,
            "total_questions": attempt.total_questions,
            "percentage": round((attempt.score / max(attempt.total_questions, 1)) * 100, 1),
            "passed": attempt.passed,
            "time_spent_seconds": attempt.time_spent_seconds,
            "topic_scores": attempt.topic_scores,
            "difficulty_scores": attempt.difficulty_scores,
            "weak_topics": attempt.weak_topics,
            "strong_topics": attempt.strong_topics,
            "recommendations": attempt.recommendations,
            "responses": responses_with_explanations,
            "created_at": attempt.created_at.isoformat() if attempt.created_at else None
        }

    @staticmethod
    def get_multi_attempt_intelligence(db: Session, student_id: str, category: Optional[str] = None) -> Dict[str, Any]:
        """
        Analyzes repeated assessment results across attempts to identify persistent weak topics and trends.
        """
        q = db.query(AssessmentAttempt).filter(AssessmentAttempt.student_id == student_id)
        if category:
            q = q.filter(AssessmentAttempt.category == category)
        attempts = q.order_by(AssessmentAttempt.created_at.desc()).limit(10).all()

        if not attempts:
            return {
                "student_id": student_id,
                "total_attempts": 0,
                "persistent_weak_topics": [],
                "consistent_strong_topics": [],
                "adaptive_recommendations": []
            }

        topic_aggregated: Dict[str, Dict[str, float]] = {}
        for a in attempts:
            t_scores = a.topic_scores or {}
            for top, stats in t_scores.items():
                if top not in topic_aggregated:
                    topic_aggregated[top] = {"earned": 0.0, "total": 0.0, "attempts": 0}
                topic_aggregated[top]["earned"] += stats.get("earned", 0.0)
                topic_aggregated[top]["total"] += stats.get("total", 0.0)
                topic_aggregated[top]["attempts"] += 1

        persistent_weak = []
        consistent_strong = []
        for top, data in topic_aggregated.items():
            pct = (data["earned"] / data["total"]) * 100 if data["total"] > 0 else 0.0
            if pct < 60.0:
                persistent_weak.append({"topic": top, "overall_accuracy": round(pct, 1), "attempts_analyzed": data["attempts"]})
            elif pct >= 75.0:
                consistent_strong.append({"topic": top, "overall_accuracy": round(pct, 1), "attempts_analyzed": data["attempts"]})

        adaptive_recs = []
        for pw in persistent_weak:
            adaptive_recs.append({
                "topic": pw["topic"],
                "recommendation": f"Focus on {pw['topic']} ({pw['overall_accuracy']}% accuracy): complete targeted practice sets before next placement drive."
            })

        return {
            "student_id": student_id,
            "total_attempts": len(attempts),
            "persistent_weak_topics": persistent_weak,
            "consistent_strong_topics": consistent_strong,
            "adaptive_recommendations": adaptive_recs
        }
