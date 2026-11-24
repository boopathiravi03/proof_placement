from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.models import QuestionBank, AssessmentAttempt
from backend.app.schemas.schemas import QuestionDTO, AnswerSubmission, AssessmentResultResponse
from backend.app.services.assessment_service import AssessmentService

router = APIRouter(prefix="/assessments", tags=["Adaptive Assessments"])

@router.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    cats = db.query(QuestionBank.category).distinct().all()
    return [c[0] for c in cats]

@router.get("/adaptive-question", response_model=Optional[QuestionDTO])
def get_next_adaptive_question(
    category: str = "SQL",
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
    return QuestionDTO(
        id=q.id,
        category=q.category,
        question=q.question,
        options=q.options,
        difficulty_level=q.difficulty_level,
        explanation=q.explanation
    )

@router.post("/submit-answer")
def submit_answer(payload: AnswerSubmission, db: Session = Depends(get_db)):
    try:
        return AssessmentService.submit_answer(
            db=db,
            student_id=payload.student_id,
            category=payload.category,
            question_id=payload.question_id,
            selected_option_index=payload.selected_option_index,
            current_difficulty=payload.current_difficulty
        )
    except Exception as ex:
        raise HTTPException(status_code=400, detail=str(ex))

@router.post("/complete")
def complete_assessment(
    student_id: str,
    category: str,
    score: int,
    total: int = 5,
    db: Session = Depends(get_db)
):
    try:
        return AssessmentService.complete_assessment(
            db=db,
            student_id=student_id,
            category=category,
            score=score,
            total_questions=total,
            history=[]
        )
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
            "score": a.score,
            "total_questions": a.total_questions,
            "passed": a.passed,
            "created_at": a.created_at.isoformat() if a.created_at else None
        }
        for a in attempts
    ]
