from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from backend.app.models.models import (
    Student,
    Competency,
    AssessmentAttempt,
    TrainingIntervention,
    InterventionStudent,
    LearningTask,
)
from backend.app.services.skill_gap_service import SkillGapService
from backend.app.services.learning_path_service import LearningPathService
from backend.app.services.audit_service import AuditService


class InterventionService:
    @staticmethod
    def get_cohort_skill_gaps(
        db: Session,
        college_id: str,
        target_role: str = "Backend Developer",
    ) -> Dict[str, Any]:
        role_name = SkillGapService.normalize_role(target_role)
        students = db.query(Student).filter(Student.college_id == college_id).all()

        skill_gap_counts: Dict[str, Dict[str, int]] = {}
        students_needing_support: List[Dict[str, Any]] = []
        role_distribution: Dict[str, int] = {"ready": 0, "developing": 0, "early_stage": 0}

        for st in students:
            analysis = SkillGapService.analyze_skill_gaps(db, st.id, role_name, persist=False)
            summary = analysis["summary"]
            total_req = max(summary["total_required_skills"], 1)
            met = summary["meets_requirement"]
            ratio = met / total_req

            if ratio >= 0.75:
                role_distribution["ready"] += 1
            elif ratio >= 0.4:
                role_distribution["developing"] += 1
            else:
                role_distribution["early_stage"] += 1

            missing_or_weak = []
            for g in analysis["gaps"]:
                sk = g["skill_name"]
                if sk not in skill_gap_counts:
                    skill_gap_counts[sk] = {"total_students": len(students), "gap_count": 0, "critical_count": 0}
                if g["gap_status"] != "meets_requirement":
                    skill_gap_counts[sk]["gap_count"] += 1
                    missing_or_weak.append(sk)
                    if g["priority"] == "Critical":
                        skill_gap_counts[sk]["critical_count"] += 1

            if summary["critical_gaps"] > 0 or len(missing_or_weak) >= 2:
                students_needing_support.append({
                    "student_id": st.id,
                    "name": st.name,
                    "branch": st.branch,
                    "critical_gaps": summary["critical_gaps"],
                    "skills_meeting_requirement": met,
                    "total_required": total_req,
                    "focus_skills": missing_or_weak[:4],
                })

        common_gaps = []
        for sk, counts in skill_gap_counts.items():
            pct = round((counts["gap_count"] / max(counts["total_students"], 1)) * 100, 1)
            common_gaps.append({
                "skill": sk,
                "students_with_gap": counts["gap_count"],
                "critical_count": counts["critical_count"],
                "gap_percentage": pct,
            })
        common_gaps.sort(key=lambda x: x["gap_percentage"], reverse=True)

        training_recommendations = [
            f"Run a focused {g['skill']} practical workshop ({g['gap_percentage']}% of cohort needs support)."
            for g in common_gaps[:3]
            if g["gap_percentage"] > 0
        ]

        return {
            "college_id": college_id,
            "target_role": role_name,
            "cohort_size": len(students),
            "most_common_gaps": common_gaps,
            "critical_missing_skills": [g["skill"] for g in common_gaps if g["critical_count"] > 0],
            "role_competency_distribution": role_distribution,
            "students_requiring_support": students_needing_support,
            "training_recommendations": training_recommendations,
        }

    @staticmethod
    def create_intervention(
        db: Session,
        college_id: str,
        created_by: str,
        title: str,
        description: str,
        target_role: str,
        target_skills: List[str],
    ) -> TrainingIntervention:
        role_name = SkillGapService.normalize_role(target_role)
        intervention = TrainingIntervention(
            college_id=college_id,
            created_by=created_by,
            title=title,
            description=description,
            target_role=role_name,
            target_skills=target_skills,
            status="active",
        )
        db.add(intervention)
        db.commit()
        db.refresh(intervention)

        AuditService.log_event(
            db=db,
            college_id=college_id,
            actor=created_by,
            action=f"Created cohort training intervention '{title}' for {role_name} ({', '.join(target_skills)})",
        )
        return intervention

    @staticmethod
    def list_interventions(db: Session, college_id: str) -> List[Dict[str, Any]]:
        items = (
            db.query(TrainingIntervention)
            .filter(
                TrainingIntervention.college_id == college_id,
                TrainingIntervention.soft_deleted == False,
            )
            .order_by(TrainingIntervention.created_at.desc())
            .all()
        )
        result = []
        for iv in items:
            eff = InterventionService.get_intervention_effectiveness(db, iv.id, college_id)
            result.append({
                "id": iv.id,
                "title": iv.title,
                "description": iv.description,
                "target_role": iv.target_role,
                "target_skills": iv.target_skills,
                "status": iv.status,
                "created_by": iv.created_by,
                "created_at": iv.created_at.isoformat() if iv.created_at else None,
                "effectiveness": eff,
            })
        return result

    @staticmethod
    def assign_students(
        db: Session,
        intervention_id: str,
        college_id: str,
        student_ids: List[str],
        actor: str = "T&P Officer",
    ) -> Dict[str, Any]:
        intervention = (
            db.query(TrainingIntervention)
            .filter(
                TrainingIntervention.id == intervention_id,
                TrainingIntervention.college_id == college_id,
                TrainingIntervention.soft_deleted == False,
            )
            .first()
        )
        if not intervention:
            raise ValueError("Training intervention not found or access denied")

        assigned = []
        for sid in student_ids:
            # Strict tenant isolation: ensure student belongs to officer's college
            st = db.query(Student).filter(Student.id == sid, Student.college_id == college_id).first()
            if not st:
                raise ValueError(f"Student {sid} not found in college {college_id}")

            existing = (
                db.query(InterventionStudent)
                .filter(
                    InterventionStudent.intervention_id == intervention_id,
                    InterventionStudent.student_id == sid,
                )
                .first()
            )
            if existing:
                assigned.append(sid)
                continue

            # Ensure learning path exists and select matching tasks
            lp_data = LearningPathService.generate_or_get_learning_path(
                db=db,
                student_id=sid,
                target_role=intervention.target_role,
            )
            target_set = {s.lower() for s in (intervention.target_skills or [])}
            matching_task_ids = [
                t["id"]
                for t in lp_data["tasks"]
                if not target_set or t["skill"].lower() in target_set
            ]

            # Compute pre-training average assessment score
            attempts = db.query(AssessmentAttempt).filter(AssessmentAttempt.student_id == sid).all()
            pre_avg = None
            if attempts:
                pre_avg = round(
                    sum((a.score / max(a.total_questions, 1)) * 100.0 for a in attempts) / len(attempts),
                    1,
                )

            rec = InterventionStudent(
                intervention_id=intervention_id,
                student_id=sid,
                college_id=college_id,
                assigned_task_ids=matching_task_ids,
                participation_status="assigned",
                pre_avg_score=pre_avg,
                post_avg_score=pre_avg,
            )
            db.add(rec)
            assigned.append(sid)

        db.commit()

        AuditService.log_event(
            db=db,
            college_id=college_id,
            actor=actor,
            action=f"Assigned {len(assigned)} student(s) to intervention '{intervention.title}'",
        )
        return {"intervention_id": intervention_id, "assigned_students": assigned}

    @staticmethod
    def get_intervention_effectiveness(
        db: Session,
        intervention_id: str,
        college_id: str,
    ) -> Dict[str, Any]:
        intervention = (
            db.query(TrainingIntervention)
            .filter(
                TrainingIntervention.id == intervention_id,
                TrainingIntervention.college_id == college_id,
            )
            .first()
        )
        if not intervention:
            raise ValueError("Training intervention not found or access denied")

        enrollments = (
            db.query(InterventionStudent)
            .filter(
                InterventionStudent.intervention_id == intervention_id,
                InterventionStudent.college_id == college_id,
            )
            .all()
        )

        total_students = len(enrollments)
        completed_students = 0
        in_progress_students = 0
        pre_scores = []
        post_scores = []

        for enr in enrollments:
            task_ids = enr.assigned_task_ids or []
            if task_ids:
                tasks = db.query(LearningTask).filter(LearningTask.id.in_(task_ids)).all()
                done_cnt = sum(1 for t in tasks if t.completed or t.status in ["completed", "submitted", "awaiting_review"])
                if done_cnt == len(tasks) and len(tasks) > 0:
                    enr.participation_status = "completed"
                    completed_students += 1
                elif done_cnt > 0:
                    enr.participation_status = "in_progress"
                    in_progress_students += 1

            # Refresh post_avg_score from latest attempts after assignment
            latest_attempts = (
                db.query(AssessmentAttempt)
                .filter(
                    AssessmentAttempt.student_id == enr.student_id,
                    AssessmentAttempt.created_at >= enr.assigned_at,
                )
                .all()
            )
            if latest_attempts:
                enr.post_avg_score = round(
                    sum((a.score / max(a.total_questions, 1)) * 100.0 for a in latest_attempts) / len(latest_attempts),
                    1,
                )

            if enr.pre_avg_score is not None:
                pre_scores.append(enr.pre_avg_score)
            if enr.post_avg_score is not None:
                post_scores.append(enr.post_avg_score)

        db.commit()

        avg_pre = round(sum(pre_scores) / len(pre_scores), 1) if pre_scores else None
        avg_post = round(sum(post_scores) / len(post_scores), 1) if post_scores else None
        improvement = round(avg_post - avg_pre, 1) if (avg_pre is not None and avg_post is not None) else None

        return {
            "intervention_id": intervention_id,
            "enrolled_count": total_students,
            "completed_count": completed_students,
            "in_progress_count": in_progress_students,
            "pre_training_avg_score": avg_pre,
            "post_training_avg_score": avg_post,
            "score_improvement_pct": improvement,
        }
