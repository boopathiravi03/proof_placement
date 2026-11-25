from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.models import Student, User
from backend.app.security import get_current_user_optional
from backend.app.schemas.schemas import (
    TaskCompleteRequest,
    TaskProgressUpdateRequest,
    TaskEvidenceSubmitRequest,
    TaskSubmissionReviewRequest,
    ReassessmentRequest,
    LearningResourceCreateRequest,
)
from backend.app.services.skill_gap_service import SkillGapService
from backend.app.services.learning_path_service import LearningPathService
from backend.app.services.assessment_service import AssessmentService

router = APIRouter(prefix="/learning", tags=["Personalized Learning Paths & Skill Gaps"])


def _enforce_student_access(current_user: Optional[User], student_id: str, db: Session) -> Student:
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    if current_user:
        if current_user.role == "recruiter":
            raise HTTPException(status_code=403, detail="Recruiters cannot access private student learning activity.")
        if current_user.role == "student":
            linked_student = db.query(Student).filter(Student.user_id == current_user.id).first()
            if linked_student and linked_student.id != student_id:
                raise HTTPException(status_code=403, detail="Students cannot view another student's learning path.")
        if current_user.role in ["officer", "student"] and current_user.college_id != student.college_id:
            raise HTTPException(status_code=403, detail="Tenant isolation violation: cross-college access denied.")
    return student


@router.get("/roles")
def get_available_target_roles():
    return SkillGapService.get_available_roles()


@router.get("/roles/{role_name}/requirements")
def get_role_competency_requirements(role_name: str):
    norm = SkillGapService.normalize_role(role_name)
    return {
        "target_role": norm,
        "requirements": SkillGapService.get_role_requirements(norm),
    }


@router.get("/gaps/{student_id}")
def get_student_skill_gaps(
    student_id: str,
    target_role: str = Query("Backend Developer"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    _enforce_student_access(current_user, student_id, db)
    try:
        return SkillGapService.analyze_skill_gaps(db, student_id, target_role=target_role, persist=True)
    except ValueError as ex:
        raise HTTPException(status_code=400, detail=str(ex))


@router.get("/path/{student_id}")
def get_or_create_learning_path(
    student_id: str,
    target_role: str = Query("Backend Developer"),
    force_regenerate: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    _enforce_student_access(current_user, student_id, db)
    try:
        return LearningPathService.generate_or_get_learning_path(
            db=db,
            student_id=student_id,
            target_role=target_role,
            force_regenerate=force_regenerate,
        )
    except ValueError as ex:
        raise HTTPException(status_code=400, detail=str(ex))


@router.post("/task/progress")
def update_task_progress(
    payload: TaskProgressUpdateRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    _enforce_student_access(current_user, payload.student_id, db)
    try:
        return LearningPathService.update_task_progress(
            db=db,
            task_id=payload.task_id,
            student_id=payload.student_id,
            status=payload.status,
            time_spent_minutes=payload.time_spent_minutes,
        )
    except PermissionError as ex:
        raise HTTPException(status_code=403, detail=str(ex))
    except ValueError as ex:
        raise HTTPException(status_code=400, detail=str(ex))


@router.post("/task/submit-evidence")
def submit_task_evidence(
    payload: TaskEvidenceSubmitRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    _enforce_student_access(current_user, payload.student_id, db)
    try:
        return LearningPathService.submit_task_evidence(
            db=db,
            task_id=payload.task_id,
            student_id=payload.student_id,
            artifact_type=payload.artifact_type,
            artifact_url=payload.artifact_url,
            notes=payload.notes,
        )
    except PermissionError as ex:
        raise HTTPException(status_code=403, detail=str(ex))
    except ValueError as ex:
        raise HTTPException(status_code=400, detail=str(ex))


@router.post("/task/complete")
def complete_task_legacy_compatible(
    payload: TaskCompleteRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    _enforce_student_access(current_user, payload.student_id, db)
    try:
        return LearningPathService.submit_task_evidence(
            db=db,
            task_id=payload.task_id,
            student_id=payload.student_id,
            artifact_type="project_url",
            artifact_url=f"https://proofhire.internal/tasks/{payload.task_id}",
            notes="Task completion artifact submitted",
        )
    except PermissionError as ex:
        raise HTTPException(status_code=403, detail=str(ex))
    except ValueError as ex:
        raise HTTPException(status_code=404, detail=str(ex))


@router.post("/submission/review")
def review_task_submission(
    payload: TaskSubmissionReviewRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    role = current_user.role if current_user else payload.reviewer_role
    college_id = current_user.college_id if current_user else None
    try:
        return LearningPathService.review_task_submission(
            db=db,
            submission_id=payload.submission_id,
            reviewer_name=current_user.full_name if current_user else payload.reviewer_name,
            reviewer_role=role,
            reviewer_college_id=college_id,
            approved=payload.approved,
            review_notes=payload.review_notes or "",
        )
    except PermissionError as ex:
        raise HTTPException(status_code=403, detail=str(ex))
    except ValueError as ex:
        raise HTTPException(status_code=400, detail=str(ex))


@router.get("/projects")
def get_recommended_projects(target_role: str = Query("Backend Developer")):
    return {
        "target_role": SkillGapService.normalize_role(target_role),
        "projects": LearningPathService.get_recommended_projects(target_role),
    }


@router.get("/progress/{student_id}")
def get_learning_progress(
    student_id: str,
    target_role: str = Query("Backend Developer"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    _enforce_student_access(current_user, student_id, db)
    try:
        return LearningPathService.get_learning_progress(db, student_id, target_role=target_role)
    except ValueError as ex:
        raise HTTPException(status_code=400, detail=str(ex))


@router.post("/reassessment")
def request_reassessment(
    payload: ReassessmentRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    _enforce_student_access(current_user, payload.student_id, db)
    category_map = {
        "sql": "DBMS",
        "database design": "DBMS",
        "python": "Programming",
        "rest apis": "Web Development",
        "authentication": "Web Development",
        "testing": "Debugging",
        "docker": "Frameworks & Tools",
        "git": "Frameworks & Tools",
        "javascript": "Web Development",
        "typescript": "Web Development",
        "react": "Web Development",
    }
    cat = category_map.get(payload.skill_name.lower(), payload.skill_name)
    try:
        return AssessmentService.start_attempt(
            db=db,
            student_id=payload.student_id,
            category=cat,
            assessment_type="mcq",
            target_role=payload.target_role,
            time_limit_minutes=15,
            total_questions=5,
        )
    except ValueError as ex:
        raise HTTPException(status_code=400, detail=str(ex))


@router.get("/resources")
def list_learning_resources(skill_name: Optional[str] = None, db: Session = Depends(get_db)):
    return LearningPathService.list_resources(db, skill_name=skill_name)


@router.post("/resources")
def add_learning_resource(
    payload: LearningResourceCreateRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    role = current_user.role if current_user else "officer"
    name = current_user.full_name if current_user else "T&P Officer"
    try:
        res = LearningPathService.add_resource(
            db=db,
            title=payload.title,
            provider=payload.provider,
            url=payload.url,
            resource_type=payload.resource_type,
            skill_name=payload.skill_name,
            actor_role=role,
            actor_name=name,
        )
        return {"id": res.id, "title": res.title, "url": res.url, "is_verified": res.is_verified}
    except PermissionError as ex:
        raise HTTPException(status_code=403, detail=str(ex))
    except ValueError as ex:
        raise HTTPException(status_code=400, detail=str(ex))


@router.delete("/resources/{resource_id}")
def remove_learning_resource(
    resource_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    role = current_user.role if current_user else "officer"
    try:
        return LearningPathService.remove_resource(db, resource_id, actor_role=role)
    except PermissionError as ex:
        raise HTTPException(status_code=403, detail=str(ex))
    except ValueError as ex:
        raise HTTPException(status_code=404, detail=str(ex))
