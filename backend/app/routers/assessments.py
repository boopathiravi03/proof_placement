from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.models import QuestionBank, AssessmentAttempt
from backend.app.schemas.schemas import (
    QuestionDTO,
    AnswerSubmission,
    StartAssessmentRequest,
    SubmitAnswerRequest,
    CompleteAssessmentRequest,
    ExecuteCodeRequest,
    ExecuteSqlRequest
)
from backend.app.services.assessment_service import AssessmentService
from backend.app.services.code_execution_service import CodeExecutionService

router = APIRouter(prefix="/assessments", tags=["Adaptive Assessments"])

@router.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    return AssessmentService.get_categories(db)

@router.post("/start")
def start_assessment(payload: StartAssessmentRequest, db: Session = Depends(get_db)):
    try:
        return AssessmentService.start_attempt(
            db=db,
            student_id=payload.student_id,
            category=payload.category,
            assessment_type=payload.assessment_type,
            target_role=payload.target_role,
            time_limit_minutes=payload.time_limit_minutes,
            total_questions=payload.total_questions
        )
    except Exception as ex:
        raise HTTPException(status_code=400, detail=str(ex))

@router.get("/adaptive-question")
def get_next_adaptive_question(
    category: str = "DBMS",
    level: int = 2,
    exclude: Optional[str] = Query(None, description="Comma-separated IDs of answered questions"),
    db: Session = Depends(get_db)
):
    exclude_ids = [s.strip() for s in exclude.split(",") if s.strip()] if exclude else []
    q = AssessmentService.get_adaptive_question(
        db=db,
        category=category,
        target_level=level,
        exclude_question_ids=exclude_ids
    )
    if not q:
        return None
    return q

@router.post("/submit-answer")
def submit_answer(payload: SubmitAnswerRequest, db: Session = Depends(get_db)):
    try:
        return AssessmentService.submit_answer(
            db=db,
            attempt_id=payload.attempt_id,
            student_id=payload.student_id,
            question_id=payload.question_id,
            selected_option_index=payload.selected_option_index,
            code_submission=payload.code_submission,
            sql_query=payload.sql_query,
            explanation=payload.explanation,
            time_spent_seconds=payload.time_spent_seconds
        )
    except Exception as ex:
        raise HTTPException(status_code=400, detail=str(ex))

@router.post("/complete")
def complete_assessment(payload: CompleteAssessmentRequest, db: Session = Depends(get_db)):
    try:
        return AssessmentService.complete_assessment(
            db=db,
            attempt_id=payload.attempt_id,
            student_id=payload.student_id
        )
    except Exception as ex:
        raise HTTPException(status_code=400, detail=str(ex))

@router.get("/report/{attempt_id}")
def get_attempt_report(
    attempt_id: str,
    student_id: str = Query("student-rahul-01"),
    db: Session = Depends(get_db)
):
    try:
        return AssessmentService.get_attempt_report(db, attempt_id, student_id)
    except Exception as ex:
        raise HTTPException(status_code=400, detail=str(ex))

@router.get("/intelligence/{student_id}")
def get_multi_attempt_intelligence(
    student_id: str,
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    try:
        return AssessmentService.get_multi_attempt_intelligence(db, student_id, category)
    except Exception as ex:
        raise HTTPException(status_code=400, detail=str(ex))

@router.get("/history/{student_id}")
def get_assessment_history(student_id: str, db: Session = Depends(get_db)):
    attempts = (
        db.query(AssessmentAttempt)
        .filter(AssessmentAttempt.student_id == student_id)
        .order_by(AssessmentAttempt.created_at.desc())
        .all()
    )
    return [
        {
            "id": a.id,
            "category": a.category,
            "assessment_type": a.assessment_type,
            "score": a.score,
            "total_questions": a.total_questions,
            "passed": a.passed,
            "time_spent_seconds": a.time_spent_seconds,
            "weak_topics": a.weak_topics or [],
            "strong_topics": a.strong_topics or [],
            "created_at": a.created_at.isoformat() if a.created_at else None
        }
        for a in attempts
    ]

@router.post("/execute-code")
def execute_code(payload: ExecuteCodeRequest):
    return CodeExecutionService.execute_code(payload.language, payload.code, payload.test_cases)

@router.post("/execute-sql")
def execute_sql(payload: ExecuteSqlRequest):
    return CodeExecutionService.execute_sql(payload.query, payload.expected_output)
