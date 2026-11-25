from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from backend.app.models.models import (
    Student,
    Competency,
    Evidence,
    AssessmentAttempt,
    SkillGap,
    SkillPrerequisite,
)

PROFICIENCY_RANK = {
    "Unknown": 0,
    "Unassessed": 1,
    "Beginner": 1,
    "Intermediate": 2,
    "Advanced": 3,
}

# Structured, configurable role competency requirements
ROLE_COMPETENCY_REQUIREMENTS: Dict[str, List[Dict[str, Any]]] = {
    "Backend Developer": [
        {"skill": "SQL", "min_proficiency": "Intermediate", "required_evidence_level": "verified", "importance": 1.0, "mandatory": True, "prerequisites": []},
        {"skill": "Python", "min_proficiency": "Intermediate", "required_evidence_level": "verified", "importance": 0.95, "mandatory": True, "prerequisites": []},
        {"skill": "REST APIs", "min_proficiency": "Intermediate", "required_evidence_level": "assessed", "importance": 0.9, "mandatory": True, "prerequisites": ["Python"]},
        {"skill": "Database Design", "min_proficiency": "Intermediate", "required_evidence_level": "evidence_linked", "importance": 0.85, "mandatory": True, "prerequisites": ["SQL"]},
        {"skill": "Git", "min_proficiency": "Beginner", "required_evidence_level": "evidence_linked", "importance": 0.8, "mandatory": True, "prerequisites": []},
        {"skill": "Docker", "min_proficiency": "Beginner", "required_evidence_level": "assessed", "importance": 0.75, "mandatory": False, "prerequisites": ["Git"]},
        {"skill": "Authentication", "min_proficiency": "Beginner", "required_evidence_level": "evidence_linked", "importance": 0.7, "mandatory": False, "prerequisites": ["REST APIs"]},
        {"skill": "Testing", "min_proficiency": "Beginner", "required_evidence_level": "evidence_linked", "importance": 0.65, "mandatory": False, "prerequisites": ["Python"]},
    ],
    "Frontend Developer": [
        {"skill": "JavaScript", "min_proficiency": "Intermediate", "required_evidence_level": "verified", "importance": 1.0, "mandatory": True, "prerequisites": []},
        {"skill": "TypeScript", "min_proficiency": "Intermediate", "required_evidence_level": "assessed", "importance": 0.9, "mandatory": True, "prerequisites": ["JavaScript"]},
        {"skill": "React", "min_proficiency": "Intermediate", "required_evidence_level": "verified", "importance": 0.95, "mandatory": True, "prerequisites": ["JavaScript"]},
        {"skill": "Web Development", "min_proficiency": "Intermediate", "required_evidence_level": "assessed", "importance": 0.85, "mandatory": True, "prerequisites": []},
        {"skill": "Git", "min_proficiency": "Beginner", "required_evidence_level": "evidence_linked", "importance": 0.8, "mandatory": True, "prerequisites": []},
        {"skill": "Testing", "min_proficiency": "Beginner", "required_evidence_level": "evidence_linked", "importance": 0.65, "mandatory": False, "prerequisites": ["React"]},
    ],
    "Full Stack Developer": [
        {"skill": "Python", "min_proficiency": "Intermediate", "required_evidence_level": "verified", "importance": 0.95, "mandatory": True, "prerequisites": []},
        {"skill": "JavaScript", "min_proficiency": "Intermediate", "required_evidence_level": "assessed", "importance": 0.95, "mandatory": True, "prerequisites": []},
        {"skill": "React", "min_proficiency": "Intermediate", "required_evidence_level": "assessed", "importance": 0.9, "mandatory": True, "prerequisites": ["JavaScript"]},
        {"skill": "SQL", "min_proficiency": "Intermediate", "required_evidence_level": "verified", "importance": 0.9, "mandatory": True, "prerequisites": []},
        {"skill": "REST APIs", "min_proficiency": "Intermediate", "required_evidence_level": "assessed", "importance": 0.85, "mandatory": True, "prerequisites": ["Python"]},
        {"skill": "Git", "min_proficiency": "Beginner", "required_evidence_level": "evidence_linked", "importance": 0.8, "mandatory": True, "prerequisites": []},
        {"skill": "Docker", "min_proficiency": "Beginner", "required_evidence_level": "evidence_linked", "importance": 0.7, "mandatory": False, "prerequisites": ["Git"]},
    ],
    "Python Developer": [
        {"skill": "Python", "min_proficiency": "Advanced", "required_evidence_level": "verified", "importance": 1.0, "mandatory": True, "prerequisites": []},
        {"skill": "DSA", "min_proficiency": "Intermediate", "required_evidence_level": "assessed", "importance": 0.9, "mandatory": True, "prerequisites": ["Python"]},
        {"skill": "SQL", "min_proficiency": "Intermediate", "required_evidence_level": "assessed", "importance": 0.85, "mandatory": True, "prerequisites": []},
        {"skill": "REST APIs", "min_proficiency": "Intermediate", "required_evidence_level": "evidence_linked", "importance": 0.8, "mandatory": True, "prerequisites": ["Python"]},
        {"skill": "Testing", "min_proficiency": "Intermediate", "required_evidence_level": "evidence_linked", "importance": 0.75, "mandatory": False, "prerequisites": ["Python"]},
        {"skill": "Git", "min_proficiency": "Beginner", "required_evidence_level": "evidence_linked", "importance": 0.75, "mandatory": True, "prerequisites": []},
    ],
    "Java Developer": [
        {"skill": "Java", "min_proficiency": "Advanced", "required_evidence_level": "verified", "importance": 1.0, "mandatory": True, "prerequisites": []},
        {"skill": "DSA", "min_proficiency": "Intermediate", "required_evidence_level": "assessed", "importance": 0.9, "mandatory": True, "prerequisites": ["Java"]},
        {"skill": "SQL", "min_proficiency": "Intermediate", "required_evidence_level": "assessed", "importance": 0.85, "mandatory": True, "prerequisites": []},
        {"skill": "Git", "min_proficiency": "Beginner", "required_evidence_level": "evidence_linked", "importance": 0.8, "mandatory": True, "prerequisites": []},
        {"skill": "Docker", "min_proficiency": "Beginner", "required_evidence_level": "evidence_linked", "importance": 0.7, "mandatory": False, "prerequisites": ["Git"]},
    ],
    "Data Analyst": [
        {"skill": "SQL", "min_proficiency": "Advanced", "required_evidence_level": "verified", "importance": 1.0, "mandatory": True, "prerequisites": []},
        {"skill": "Python", "min_proficiency": "Intermediate", "required_evidence_level": "verified", "importance": 0.9, "mandatory": True, "prerequisites": []},
        {"skill": "Aptitude", "min_proficiency": "Intermediate", "required_evidence_level": "assessed", "importance": 0.85, "mandatory": True, "prerequisites": []},
        {"skill": "Database Design", "min_proficiency": "Beginner", "required_evidence_level": "evidence_linked", "importance": 0.75, "mandatory": False, "prerequisites": ["SQL"]},
        {"skill": "Git", "min_proficiency": "Beginner", "required_evidence_level": "evidence_linked", "importance": 0.65, "mandatory": False, "prerequisites": []},
    ],
    "Software Engineer": [
        {"skill": "DSA", "min_proficiency": "Intermediate", "required_evidence_level": "verified", "importance": 1.0, "mandatory": True, "prerequisites": []},
        {"skill": "Python", "min_proficiency": "Intermediate", "required_evidence_level": "assessed", "importance": 0.9, "mandatory": True, "prerequisites": []},
        {"skill": "SQL", "min_proficiency": "Intermediate", "required_evidence_level": "assessed", "importance": 0.85, "mandatory": True, "prerequisites": []},
        {"skill": "Operating Systems", "min_proficiency": "Intermediate", "required_evidence_level": "assessed", "importance": 0.8, "mandatory": True, "prerequisites": []},
        {"skill": "Computer Networks", "min_proficiency": "Beginner", "required_evidence_level": "assessed", "importance": 0.75, "mandatory": False, "prerequisites": []},
        {"skill": "Git", "min_proficiency": "Beginner", "required_evidence_level": "evidence_linked", "importance": 0.8, "mandatory": True, "prerequisites": []},
    ],
}

STATE_RANK = {
    "unknown": 0,
    "unassessed": 1,
    "claimed": 1,
    "observed": 2,
    "evidence_linked": 3,
    "assessed": 4,
    "verified": 5,
    "expired": 2,  # Expired retains evidence history but needs reassessment
}

ROLE_ALIASES = {
    "backend": "Backend Developer",
    "frontend": "Frontend Developer",
    "full-stack": "Full Stack Developer",
    "fullstack": "Full Stack Developer",
    "data analyst": "Data Analyst",
    "python": "Python Developer",
    "java": "Java Developer",
    "software engineer": "Software Engineer",
}


class SkillGapService:
    @staticmethod
    def get_available_roles() -> List[Dict[str, Any]]:
        return [
            {
                "role_name": role,
                "required_skill_count": len(reqs),
                "mandatory_skills": [r["skill"] for r in reqs if r["mandatory"]],
                "requirements": reqs,
            }
            for role, reqs in ROLE_COMPETENCY_REQUIREMENTS.items()
        ]

    @staticmethod
    def normalize_role(target_role: str) -> str:
        clean = (target_role or "Backend Developer").strip()
        if clean.lower() in ROLE_ALIASES:
            return ROLE_ALIASES[clean.lower()]
        for k in ROLE_COMPETENCY_REQUIREMENTS:
            if k.lower() == clean.lower():
                return k
        return "Backend Developer"

    @staticmethod
    def get_role_requirements(target_role: str) -> List[Dict[str, Any]]:
        norm = SkillGapService.normalize_role(target_role)
        return ROLE_COMPETENCY_REQUIREMENTS.get(norm, ROLE_COMPETENCY_REQUIREMENTS["Backend Developer"])

    @staticmethod
    def _compute_priority(
        importance: float,
        mandatory: bool,
        gap_status: str,
        proficiency_delta: int,
        is_prerequisite_for_others: bool,
        has_assessment_weakness: bool,
        has_existing_evidence: bool,
    ) -> tuple[str, float, str]:
        if gap_status == "meets_requirement":
            return "Low", 0.0, "Competency already meets target role requirements."

        score = importance * 40.0
        reasons = [f"Role importance weight ({int(importance * 100)}%)"]

        if mandatory:
            score += 25.0
            reasons.append("mandatory role prerequisite")
        if proficiency_delta > 0:
            score += proficiency_delta * 10.0
            reasons.append(f"proficiency gap of {proficiency_delta} tier(s)")
        if is_prerequisite_for_others:
            score += 15.0
            reasons.append("blocks downstream role skills")
        if has_assessment_weakness:
            score += 20.0
            reasons.append("recent assessment score below 60% or weak topic flagged")
        if has_existing_evidence:
            score -= 10.0
            reasons.append("existing evidence reduces remediation effort")

        if score >= 80.0:
            priority = "Critical"
        elif score >= 60.0:
            priority = "High"
        elif score >= 35.0:
            priority = "Medium"
        else:
            priority = "Low"

        return priority, round(score, 1), f"Assigned {priority} priority ({round(score, 1)} pts): " + ", ".join(reasons) + "."

    @staticmethod
    def analyze_skill_gaps(
        db: Session,
        student_id: str,
        target_role: str = "Backend Developer",
        persist: bool = True,
    ) -> Dict[str, Any]:
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise ValueError(f"Student {student_id} not found")

        role_name = SkillGapService.normalize_role(target_role)
        requirements = SkillGapService.get_role_requirements(role_name)

        competencies = db.query(Competency).filter(Competency.student_id == student_id).all()
        comp_by_skill = {c.skill_name.lower(): c for c in competencies}

        evidences = db.query(Evidence).filter(Evidence.student_id == student_id).all()
        ev_count_by_comp: Dict[str, int] = {}
        for ev in evidences:
            ev_count_by_comp[ev.competency_id] = ev_count_by_comp.get(ev.competency_id, 0) + 1

        attempts = (
            db.query(AssessmentAttempt)
            .filter(AssessmentAttempt.student_id == student_id)
            .order_by(AssessmentAttempt.created_at.desc())
            .all()
        )
        # Map skill/category to latest attempt
        latest_attempt_by_skill: Dict[str, AssessmentAttempt] = {}
        for att in attempts:
            key = (att.category or "").lower()
            if key not in latest_attempt_by_skill:
                latest_attempt_by_skill[key] = att
            # Also map DBMS -> SQL for assessment alignment
            if key == "dbms" and "sql" not in latest_attempt_by_skill:
                latest_attempt_by_skill["sql"] = att

        # Identify which skills act as prerequisites for other required skills
        prereq_skills_set = set()
        for req in requirements:
            for p in req.get("prerequisites", []):
                prereq_skills_set.add(p.lower())

        now = datetime.utcnow()
        gaps_output: List[Dict[str, Any]] = []

        if persist:
            db.query(SkillGap).filter(
                SkillGap.student_id == student_id,
                SkillGap.target_role == role_name,
            ).delete()

        for req in requirements:
            skill_name = req["skill"]
            skill_key = skill_name.lower()
            min_prof = req["min_proficiency"]
            req_ev_level = req["required_evidence_level"]
            importance = req["importance"]
            mandatory = req["mandatory"]

            comp = comp_by_skill.get(skill_key)
            attempt = latest_attempt_by_skill.get(skill_key)
            ev_count = ev_count_by_comp.get(comp.id, 0) if comp else 0

            # Determine current state and proficiency without treating missing data as zero ability
            is_expired = False
            if comp and comp.expires_at and comp.expires_at < now:
                is_expired = True
            if comp and comp.state == "expired":
                is_expired = True

            has_assessment_weakness = False
            attempt_pct = None
            if attempt and attempt.total_questions > 0:
                attempt_pct = (attempt.score / attempt.total_questions) * 100.0
                if attempt_pct < 60.0:
                    has_assessment_weakness = True

            if not comp:
                current_state = "unknown"
                current_prof = "Unknown"
                gap_status = "missing_skill"
                explanation = (
                    f"No competency record or assessment history exists for {skill_name}. "
                    f"Classified as 'unknown' (not zero ability); submit existing evidence or take a baseline assessment."
                )
            elif is_expired:
                current_state = "expired"
                current_prof = comp.proficiency or "Intermediate"
                gap_status = "reassessment_recommended"
                explanation = (
                    f"{skill_name} verification expired on {comp.expires_at.date() if comp.expires_at else 'record'}. "
                    f"Reassessment is recommended to restore active verified standing."
                )
            else:
                current_state = comp.state
                current_prof = comp.proficiency or "Beginner"
                curr_state_rank = STATE_RANK.get(current_state, 0)
                req_state_rank = STATE_RANK.get(req_ev_level, 3)

                if has_assessment_weakness:
                    gap_status = "needs_improvement"
                    explanation = (
                        f"Latest {skill_name} assessment scored {round(attempt_pct or 0, 1)}% (below 60% mastery threshold). "
                        f"Weak topics: {', '.join(attempt.weak_topics or ['Core fundamentals'])}."
                    )
                elif curr_state_rank < 3:
                    # claimed or observed without evidence or assessment
                    if not attempt:
                        current_state = "unassessed" if current_state == "claimed" else current_state
                        current_prof = "Unassessed"
                    gap_status = "evidence_required"
                    explanation = (
                        f"{skill_name} is currently '{comp.state}' with {ev_count} evidence item(s). "
                        f"Target role requires '{req_ev_level}' status at {min_prof} proficiency."
                    )
                elif curr_state_rank == 3 and req_state_rank >= 4:
                    gap_status = "assessment_required"
                    explanation = (
                        f"{skill_name} has linked evidence ({ev_count} artifact(s)), but no validated assessment yet. "
                        f"Complete an adaptive {skill_name} assessment to advance toward '{req_ev_level}'."
                    )
                elif curr_state_rank < req_state_rank:
                    gap_status = "evidence_required"
                    explanation = (
                        f"{skill_name} is '{comp.state}', whereas {role_name} requires '{req_ev_level}' "
                        f"(mentor sign-off or practical walkthrough needed)."
                    )
                elif PROFICIENCY_RANK.get(current_prof, 1) < PROFICIENCY_RANK.get(min_prof, 2):
                    gap_status = "needs_improvement"
                    explanation = (
                        f"Current proficiency ({current_prof}) is below target role expectation ({min_prof})."
                    )
                else:
                    gap_status = "meets_requirement"
                    explanation = (
                        f"{skill_name} meets {role_name} requirements (state: '{comp.state}', proficiency: {current_prof})."
                    )

            prof_delta = max(0, PROFICIENCY_RANK.get(min_prof, 2) - PROFICIENCY_RANK.get(current_prof, 0))
            priority, priority_score, priority_reason = SkillGapService._compute_priority(
                importance=importance,
                mandatory=mandatory,
                gap_status=gap_status,
                proficiency_delta=prof_delta,
                is_prerequisite_for_others=(skill_key in prereq_skills_set),
                has_assessment_weakness=has_assessment_weakness,
                has_existing_evidence=(ev_count > 0),
            )

            gap_dict = {
                "skill_name": skill_name,
                "required_proficiency": min_prof,
                "required_evidence_level": req_ev_level,
                "current_proficiency": current_prof,
                "current_state": current_state,
                "gap_status": gap_status,
                "priority": priority,
                "priority_score": priority_score,
                "mandatory": mandatory,
                "importance": importance,
                "prerequisites": req.get("prerequisites", []),
                "evidence_count": ev_count,
                "explanation": explanation,
                "priority_reason": priority_reason,
            }
            gaps_output.append(gap_dict)

            if persist:
                db.add(
                    SkillGap(
                        student_id=student_id,
                        college_id=student.college_id,
                        target_role=role_name,
                        skill_name=skill_name,
                        required_proficiency=min_prof,
                        current_proficiency=current_prof,
                        current_state=current_state,
                        gap_status=gap_status,
                        priority=priority,
                        priority_score=priority_score,
                        mandatory=mandatory,
                        importance=importance,
                        explanation=explanation,
                        priority_reason=priority_reason,
                    )
                )

        if persist:
            db.commit()

        # Sort gaps by priority_score descending
        gaps_output.sort(key=lambda g: g["priority_score"], reverse=True)

        summary = {
            "total_required_skills": len(gaps_output),
            "meets_requirement": sum(1 for g in gaps_output if g["gap_status"] == "meets_requirement"),
            "critical_gaps": sum(1 for g in gaps_output if g["priority"] == "Critical" and g["gap_status"] != "meets_requirement"),
            "high_priority_gaps": sum(1 for g in gaps_output if g["priority"] == "High" and g["gap_status"] != "meets_requirement"),
            "evidence_required": sum(1 for g in gaps_output if g["gap_status"] in ["evidence_required", "missing_skill"]),
            "assessment_required": sum(1 for g in gaps_output if g["gap_status"] in ["assessment_required", "reassessment_recommended", "needs_improvement"]),
        }

        return {
            "student_id": student_id,
            "college_id": student.college_id,
            "target_role": role_name,
            "summary": summary,
            "gaps": gaps_output,
        }
