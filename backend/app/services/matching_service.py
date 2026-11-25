from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from backend.app.models.models import (
    Student,
    Competency,
    AssessmentAttempt,
    JobRole,
    Company,
    PlacementDrive,
)
from backend.app.services.eligibility_service import EligibilityService

STATE_COMPAT_WEIGHT = {
    "verified": 1.0,
    "assessed": 0.85,
    "evidence_linked": 0.65,
    "observed": 0.40,
    "claimed": 0.20,
    "expired": 0.35,  # Penalized for expired evidence
}


class MatchingService:
    @staticmethod
    def calculate_student_job_match(
        db: Session,
        student_id: str,
        job_role_id: str,
        drive_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise ValueError(f"Student {student_id} not found")

        job = db.query(JobRole).filter(JobRole.id == job_role_id).first()
        if not job:
            raise ValueError(f"Job role {job_role_id} not found")

        eligibility = EligibilityService.evaluate_student_for_job(
            db, student_id, job_role_id, drive_id=drive_id
        )

        competencies = db.query(Competency).filter(Competency.student_id == student_id).all()
        comp_map = {c.skill_name.lower(): c for c in competencies}
        attempts = db.query(AssessmentAttempt).filter(AssessmentAttempt.student_id == student_id).all()

        req_skills: List[str] = job.required_skills or []
        pref_skills: List[str] = job.preferred_skills or []

        now = datetime.utcnow()
        req_satisfied: List[str] = []
        pref_satisfied: List[str] = []
        missing_competencies: List[str] = []
        missing_evidence: List[str] = []
        expired_skills: List[str] = []
        assessment_gaps: List[str] = []

        req_points = 0.0
        for sk in req_skills:
            comp = comp_map.get(sk.lower())
            if not comp:
                missing_competencies.append(sk)
                missing_evidence.append(sk)
                assessment_gaps.append(sk)
                continue

            is_exp = comp.state == "expired" or (comp.expires_at and comp.expires_at < now)
            eff_state = "expired" if is_exp else comp.state
            req_points += STATE_COMPAT_WEIGHT.get(eff_state, 0.2)

            if is_exp:
                expired_skills.append(sk)
                assessment_gaps.append(sk)
            elif comp.state in ["verified", "assessed"]:
                req_satisfied.append(sk)
            elif comp.state == "evidence_linked":
                assessment_gaps.append(sk)
            else:
                missing_evidence.append(sk)
                assessment_gaps.append(sk)

        pref_points = 0.0
        for psk in pref_skills:
            comp = comp_map.get(psk.lower())
            if comp and comp.state in ["verified", "assessed", "evidence_linked"]:
                pref_points += 1.0
                pref_satisfied.append(psk)

        req_pct = (req_points / len(req_skills)) * 100.0 if req_skills else 100.0
        pref_pct = (pref_points / len(pref_skills)) * 100.0 if pref_skills else 100.0

        has_assessment_data = len(attempts) > 0
        avg_asm_pct = (
            sum((a.score / max(a.total_questions, 1)) * 100.0 for a in attempts) / len(attempts)
            if has_assessment_data
            else None
        )

        # Transparent deterministic weighting:
        # 70% Required Competency & Evidence Freshness + 15% Assessment Results + 15% Preferred Skills
        asm_component = avg_asm_pct if avg_asm_pct is not None else req_pct
        compatibility_score = int(round(0.70 * req_pct + 0.15 * asm_component + 0.15 * pref_pct))
        compatibility_score = min(100, max(0, compatibility_score))

        data_sufficiency = "sufficient" if (has_assessment_data and len(competencies) > 0) else "insufficient_assessment_data"

        explanation_parts = [
            f"Satisfied {len(req_satisfied)}/{len(req_skills)} required skills ({', '.join(req_satisfied) if req_satisfied else 'none'})."
        ]
        if missing_competencies:
            explanation_parts.append(f"Missing competencies: {', '.join(missing_competencies)}.")
        if expired_skills:
            explanation_parts.append(f"Expired evidence requiring renewal: {', '.join(expired_skills)}.")
        if not has_assessment_data:
            explanation_parts.append("Assessment history incomplete; score uses competency evidence baseline.")

        return {
            "student_id": student_id,
            "job_role_id": job_role_id,
            "job_title": job.title,
            "compatibility_score": compatibility_score,
            "data_sufficiency": data_sufficiency,
            "eligibility_status": eligibility["status"],
            "eligible": eligibility["eligible"],
            "eligibility_decision_id": eligibility["decision_id"],
            "rule_items": eligibility["rule_items"],
            "required_skills_satisfied": req_satisfied,
            "preferred_skills_satisfied": pref_satisfied,
            "missing_competencies": missing_competencies,
            "missing_evidence": missing_evidence,
            "expired_skills": expired_skills,
            "assessment_gaps": assessment_gaps,
            "explanation": " ".join(explanation_parts),
            "disclaimer": "Compatibility score measures verifiable skill alignment and is not a probability of selection or employment.",
        }

    @staticmethod
    def get_matching_students_for_job(
        db: Session,
        college_id: str,
        job_role_id: str,
        drive_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Evaluates all students in the college for the job opportunity.
        Rule: Eligible students are never hidden even if compatibility_score is lower.
        """
        students = db.query(Student).filter(Student.college_id == college_id).all()
        matches = []
        for st in students:
            m = MatchingService.calculate_student_job_match(db, st.id, job_role_id, drive_id=drive_id)
            matches.append({
                "student_name": st.name,
                "branch": st.branch,
                "cgpa": st.cgpa,
                "backlogs": st.backlogs,
                **m,
            })

        # Sort eligible first, then compatibility_score descending — never hide eligible candidates
        matches.sort(key=lambda x: (1 if x["eligible"] else 0, x["compatibility_score"]), reverse=True)
        return {
            "college_id": college_id,
            "job_role_id": job_role_id,
            "total_students_evaluated": len(matches),
            "matches": matches,
        }

    @staticmethod
    def get_matching_opportunities_for_student(db: Session, student_id: str) -> List[Dict[str, Any]]:
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise ValueError(f"Student {student_id} not found")

        drives = (
            db.query(PlacementDrive)
            .filter(PlacementDrive.college_id == student.college_id, PlacementDrive.published == True)
            .all()
        )
        results = []
        for d in drives:
            job = db.query(JobRole).filter(JobRole.id == d.job_role_id).first()
            company = db.query(Company).filter(Company.id == d.company_id).first()
            if not job:
                continue
            match = MatchingService.calculate_student_job_match(db, student_id, job.id, drive_id=d.id)
            results.append({
                "drive_id": d.id,
                "drive_title": d.title,
                "company_name": company.name if company else "Partner Company",
                "location": job.location,
                "employment_type": job.employment_type,
                "salary_range": job.salary_range,
                "application_deadline": d.application_deadline.isoformat() if d.application_deadline else None,
                "selection_stages": d.selection_stages or job.selection_stages or [],
                **match,
            })
        return results
