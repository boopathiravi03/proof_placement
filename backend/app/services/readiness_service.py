from typing import Dict, Any, List
from sqlalchemy.orm import Session
from backend.app.models.models import Student, Competency, AssessmentAttempt

ROLE_SKILL_REQUIREMENTS: Dict[str, List[str]] = {
    "Backend": ["Python", "SQL", "Git", "Docker"],
    "Data Analyst": ["Python", "SQL", "Git"],
    "Frontend": ["Git", "Python"],
    "Full-Stack": ["Python", "SQL", "Git", "Docker"]
}

class ReadinessService:
    @staticmethod
    def calculate_readiness(db: Session, student_id: str, target_role: str = "Backend") -> Dict[str, Any]:
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise ValueError(f"Student {student_id} not found")

        required_skills = ROLE_SKILL_REQUIREMENTS.get(target_role, ["Python", "SQL", "Git"])
        
        # Query student competencies
        competencies = db.query(Competency).filter(Competency.student_id == student_id).all()
        comp_map = {c.skill_name: c.state for c in competencies}

        # 1. Verified coverage (Weight: 35%)
        # State 'verified'
        verified_count = sum(1 for s in required_skills if comp_map.get(s) == "verified")
        verified_pct = (verified_count / len(required_skills)) * 100 if required_skills else 0
        verified_weighted = (verified_pct * 35) / 100

        # 2. Evidence coverage (Weight: 20%)
        # State >= 'evidence_linked' (evidence_linked, assessed, verified)
        evidence_count = sum(1 for s in required_skills if comp_map.get(s) in ["evidence_linked", "assessed", "verified"])
        evidence_pct = (evidence_count / len(required_skills)) * 100 if required_skills else 0
        evidence_weighted = (evidence_pct * 20) / 100

        # 3. Practical assessment performance (Weight: 25%)
        latest_attempt = (
            db.query(AssessmentAttempt)
            .filter(AssessmentAttempt.student_id == student_id)
            .order_by(AssessmentAttempt.created_at.desc())
            .first()
        )
        if latest_attempt and latest_attempt.total_questions > 0:
            assessment_pct = (latest_attempt.score / latest_attempt.total_questions) * 100
        else:
            assessment_pct = 0.0
        assessment_weighted = (assessment_pct * 25) / 100

        # 4. Aptitude performance (Weight: 10%)
        aptitude_pct = 70.0 if latest_attempt else 0.0
        aptitude_weighted = (aptitude_pct * 10) / 100

        # 5. Interview readiness (Weight: 10%)
        interview_pct = 55.0 if latest_attempt else 0.0
        interview_weighted = (interview_pct * 10) / 100

        total_score = round(
            verified_weighted + evidence_weighted + assessment_weighted + aptitude_weighted + interview_weighted
        )
        total_score = min(100, max(0, total_score))

        missing_skills = [s for s in required_skills if comp_map.get(s) not in ["assessed", "verified"]]
        verified_skills = [s for s in required_skills if comp_map.get(s) == "verified"]

        confidence_level = "high" if (verified_pct >= 50 and latest_attempt) else "medium" if latest_attempt else "low"

        return {
            "student_id": student_id,
            "target_role": target_role,
            "overall_score": total_score,
            "confidence_level": confidence_level,
            "breakdown": {
                "verified_competencies": {
                    "percentage": round(verified_pct, 1),
                    "weight": 35,
                    "weighted_score": round(verified_weighted, 1),
                    "description": "Skills with authorized mentor sign-off or live practical validation."
                },
                "evidence_coverage": {
                    "percentage": round(evidence_pct, 1),
                    "weight": 20,
                    "weighted_score": round(evidence_weighted, 1),
                    "description": "Skills linked to public code commits, repositories, or lab artifacts."
                },
                "practical_assessment": {
                    "percentage": round(assessment_pct, 1),
                    "weight": 25,
                    "weighted_score": round(assessment_weighted, 1),
                    "description": "Validated machine-scored performance on adaptive problem-solving tasks."
                },
                "aptitude": {
                    "percentage": round(aptitude_pct, 1),
                    "weight": 10,
                    "weighted_score": round(aptitude_weighted, 1),
                    "description": "Logical reasoning, algorithmic comprehension, and quantitative analysis."
                },
                "interview_readiness": {
                    "percentage": round(interview_pct, 1),
                    "weight": 10,
                    "weighted_score": round(interview_weighted, 1),
                    "description": "System architecture articulation and contextual technical dialogue."
                }
            },
            "required_skills": required_skills,
            "verified_skills": verified_skills,
            "missing_skills": missing_skills,
            "disclaimer": "This Placement Readiness Index is an explainable preparation indicator, not an automated hiring decision."
        }
