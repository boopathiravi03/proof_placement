from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.models import LearningPath, LearningTask, Student, Competency
from backend.app.schemas.schemas import TaskCompleteRequest
from backend.app.services.competency_service import CompetencyService
from backend.app.services.audit_service import AuditService

router = APIRouter(prefix="/learning", tags=["Personalized Learning Paths"])

@router.get("/path/{student_id}")
def get_or_create_learning_path(
    student_id: str,
    target_role: str = Query("Backend"),
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    lp = (
        db.query(LearningPath)
        .filter(LearningPath.student_id == student_id, LearningPath.target_role == target_role)
        .first()
    )
    if not lp:
        lp = LearningPath(
            student_id=student_id,
            college_id=student.college_id,
            target_role=target_role,
            missing_skills=["SQL", "Docker"]
        )
        db.add(lp)
        db.flush()

        # Seed default actionable tasks
        tasks = [
            LearningTask(
                learning_path_id=lp.id,
                title="Complete 2 SQL practice sets",
                description="Joins, aggregations, window functions. Adds practice evidence.",
                skill="SQL",
                task_order=1
            ),
            LearningTask(
                learning_path_id=lp.id,
                title="Build a library database mini-project",
                description="Design schema with foreign keys and push to GitHub. Adds code evidence.",
                skill="SQL",
                task_order=2
            ),
            LearningTask(
                learning_path_id=lp.id,
                title="Retake the SQL machine test",
                description="Target score >= 80%. Promotes to verified status upon mentor sign-off.",
                skill="SQL",
                task_order=3
            )
        ]
        db.add_all(tasks)
        db.commit()
        db.refresh(lp)

    tasks_dto = [
        {
            "id": t.id,
            "title": t.title,
            "description": t.description,
            "skill": t.skill,
            "task_order": t.task_order,
            "completed": t.completed,
            "completed_at": t.completed_at.isoformat() if t.completed_at else None
        }
        for t in sorted(lp.tasks, key=lambda x: x.task_order)
    ]

    return {
        "learning_path_id": lp.id,
        "target_role": lp.target_role,
        "missing_skills": lp.missing_skills,
        "tasks": tasks_dto
    }

@router.post("/task/complete")
def complete_task(payload: TaskCompleteRequest, db: Session = Depends(get_db)):
    task = db.query(LearningTask).filter(LearningTask.id == payload.task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Learning task not found")

    task.completed = True
    task.completed_at = datetime.utcnow()

    # Rule: Every completed task generates new evidence
    ev_title = f"Remediation Project: {task.title}"
    CompetencyService.add_evidence(
        db=db,
        student_id=payload.student_id,
        skill_name=task.skill,
        kind="repo" if "project" in task.title.lower() else "cert",
        title=ev_title,
        ref_url=f"/evidence/tasks/{task.id}",
        confidence=0.80,
        extra_metadata={"task_id": task.id, "title": task.title}
    )

    db.commit()

    return {
        "success": True,
        "task_id": task.id,
        "completed": True,
        "message": f"Task completed. New evidence added for {task.skill}."
    }
