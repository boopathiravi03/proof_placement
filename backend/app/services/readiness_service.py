from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from backend.app.models.models import (
    Student,
    Competency,
    AssessmentAttempt,
    ReadinessSnapshot,
    RoleRequirementConfig
)

ROLE_DEFINITIONS: Dict[str, Dict[str, Any]] = {
    "Backend Developer": {
        "required_skills": ["Python", "SQL", "Git", "Docker"],
        "coding_categories": ["Programming", "DSA", "DBMS"],
        "min_cgpa": 7.0,
        "description": "API architectures, distributed data stores, transaction integrity, containerization."
    },
    "Frontend Developer": {
        "required_skills": ["TypeScript", "React", "Git"],
        "coding_categories": ["Web Development", "Programming"],
        "min_cgpa": 6.5,
        "description": "Component lifecycles, state management, reactive DOM rendering, UI engineering."
    },
    "Full Stack Developer": {
        "required_skills": ["Python", "React", "SQL", "Git", "Docker"],
        "coding_categories": ["Programming", "Web Development", "DBMS"],
        "min_cgpa": 7.0,
        "description": "End-to-end full stack architecture, REST APIs, state stores, and DevOps deployments."
    },
    "Data Analyst": {
        "required_skills": ["Python", "SQL", "Git"],
        "coding_categories": ["DBMS", "Programming", "Aptitude"],
        "min_cgpa": 6.5,
        "description": "Relational query optimization, statistical inference, metric modeling, and analytics pipelines."
    },
    "Java Developer": {
        "required_skills": ["Java", "SQL", "Git", "Docker"],
        "coding_categories": ["Programming", "DSA", "DBMS"],
        "min_cgpa": 7.0,
        "description": "Enterprise Java systems, JVM concurrency, Spring architectures, microservices."
    },
    "Python Developer": {
        "required_skills": ["Python", "SQL", "Git"],
        "coding_categories": ["Programming", "DSA", "DBMS"],
        "min_cgpa": 6.8,
        "description": "Python asynchronous microservices, data scripting, automated CI/CD tooling."
    },
    "AI/ML Engineer": {
        "required_skills": ["Python", "DSA", "SQL"],
        "coding_categories": ["Programming", "DSA", "Aptitude"],
        "min_cgpa": 7.5,
        "description": "Mathematical modeling, algorithmic complexity, neural pipelines, feature engineering."
    }
}

# Alias map for standard queries
ROLE_ALIASES: Dict[str, str] = {
    "backend": "Backend Developer",
    "frontend": "Frontend Developer",
    "full-stack": "Full Stack Developer",
    "fullstack": "Full Stack Developer",
    "data analyst": "Data Analyst",
    "data-analyst": "Data Analyst",
    "java": "Java Developer",
    "python": "Python Developer",
    "ai/ml": "AI/ML Engineer",
    "ai-ml": "AI/ML Engineer"
}

class ReadinessService:
    @staticmethod
    def normalize_role_name(role: str) -> str:
        clean = (role or "Backend Developer").strip()
        lower = clean.lower()
        if lower in ROLE_ALIASES:
            return ROLE_ALIASES[lower]
        for standard_name in ROLE_DEFINITIONS.keys():
            if standard_name.lower() == lower:
                return standard_name
        return clean

    @staticmethod
    def calculate_readiness(
        db: Session,
        student_id: str,
        target_role: str = "Backend Developer"
    ) -> Dict[str, Any]:
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise ValueError(f"Student {student_id} not found")

        role_name = ReadinessService.normalize_role_name(target_role)
        role_info = ROLE_DEFINITIONS.get(role_name, ROLE_DEFINITIONS["Backend Developer"])
        required_skills: List[str] = role_info["required_skills"]

        # Fetch competencies
        competencies = db.query(Competency).filter(Competency.student_id == student_id).all()
        comp_map = {c.skill_name.lower(): c.state for c in competencies}

        # 1. Verified Technical Competency (Weight: 35%)
        verified_count = sum(1 for s in required_skills if comp_map.get(s.lower()) == "verified")
        verified_pct = (verified_count / len(required_skills)) * 100 if required_skills else 0.0
        verified_weighted = (verified_pct * 35) / 100.0

        # 2. Coding Assessment Performance (Weight: 25%)
        # Fetch coding-oriented assessments
        coding_attempts = (
            db.query(AssessmentAttempt)
            .filter(AssessmentAttempt.student_id == student_id)
            .filter(AssessmentAttempt.category.in_(["Programming", "DSA", "DBMS", "Web Development", "Python", "SQL"]))
            .order_by(AssessmentAttempt.created_at.desc())
            .all()
        )
        has_coding_data = len(coding_attempts) > 0
        if has_coding_data:
            coding_pct = (sum((a.score / max(a.total_questions, 1)) * 100 for a in coding_attempts[:3]) / min(len(coding_attempts), 3))
        else:
            coding_pct = 65.0  # Default baseline estimate if unassessed
        coding_weighted = (coding_pct * 25) / 100.0

        # 3. Aptitude Performance (Weight: 15%)
        aptitude_attempts = (
            db.query(AssessmentAttempt)
            .filter(AssessmentAttempt.student_id == student_id, AssessmentAttempt.category == "Aptitude")
            .order_by(AssessmentAttempt.created_at.desc())
            .all()
        )
        has_aptitude_data = len(aptitude_attempts) > 0
        if has_aptitude_data:
            aptitude_pct = (sum((a.score / max(a.total_questions, 1)) * 100 for a in aptitude_attempts[:2]) / min(len(aptitude_attempts), 2))
        else:
            aptitude_pct = 70.0  # Baseline aptitude estimate
        aptitude_weighted = (aptitude_pct * 15) / 100.0

        # 4. Interview Readiness (Weight: 15%)
        interview_attempts = (
            db.query(AssessmentAttempt)
            .filter(AssessmentAttempt.student_id == student_id, AssessmentAttempt.category == "Technical Interview")
            .order_by(AssessmentAttempt.created_at.desc())
            .all()
        )
        has_interview_data = len(interview_attempts) > 0
        if has_interview_data:
            interview_pct = (sum((a.score / max(a.total_questions, 1)) * 100 for a in interview_attempts[:2]) / min(len(interview_attempts), 2))
        else:
            interview_pct = 60.0  # Baseline interview estimate
        interview_weighted = (interview_pct * 15) / 100.0

        # 5. Role-Specific Skill Coverage (Weight: 10%)
        # Includes observed, evidence-linked, assessed, and verified
        active_skills_count = sum(1 for s in required_skills if comp_map.get(s.lower()) in ["observed", "evidence_linked", "assessed", "verified"])
        coverage_pct = (active_skills_count / len(required_skills)) * 100 if required_skills else 0.0
        coverage_weighted = (coverage_pct * 10) / 100.0

        overall_score = int(round(
            verified_weighted + coding_weighted + aptitude_weighted + interview_weighted + coverage_weighted
        ))
        overall_score = min(100, max(0, overall_score))

        # Data coverage metric (e.g. out of 5 dimensions, how many have empirical assessment/evidence data)
        data_points_present = sum([
            1 if verified_count > 0 else 0,
            1 if has_coding_data else 0,
            1 if has_aptitude_data else 0,
            1 if has_interview_data else 0,
            1 if active_skills_count > 0 else 0
        ])
        data_coverage_pct = round((data_points_present / 5) * 100, 1)

        confidence_level = "high" if data_coverage_pct >= 80 and verified_pct >= 40 else "medium" if data_coverage_pct >= 40 else "low"

        verified_skills = [s for s in required_skills if comp_map.get(s.lower()) == "verified"]
        partially_demonstrated = [s for s in required_skills if comp_map.get(s.lower()) in ["observed", "evidence_linked", "assessed"]]
        missing_skills = [s for s in required_skills if comp_map.get(s.lower()) not in ["observed", "evidence_linked", "assessed", "verified"]]

        breakdown = {
            "verified_competencies": {
                "percentage": round(verified_pct, 1),
                "weight": 35,
                "weighted_score": round(verified_weighted, 1),
                "description": f"Verified competencies backed by faculty sign-offs or proctored assessments ({verified_count}/{len(required_skills)} required skills verified)."
            },
            "coding_assessment": {
                "percentage": round(coding_pct, 1),
                "weight": 25,
                "weighted_score": round(coding_weighted, 1),
                "description": "Validated machine-scored performance across programming, algorithms, and database queries."
            },
            "aptitude": {
                "percentage": round(aptitude_pct, 1),
                "weight": 15,
                "weighted_score": round(aptitude_weighted, 1),
                "description": "Quantitative analysis, logical reasoning, and verbal comprehension benchmarks."
            },
            "interview_readiness": {
                "percentage": round(interview_pct, 1),
                "weight": 15,
                "weighted_score": round(interview_weighted, 1),
                "description": "System design defense, problem explanation clarity, and architectural communication score."
            },
            "role_skill_coverage": {
                "percentage": round(coverage_pct, 1),
                "weight": 10,
                "weighted_score": round(coverage_weighted, 1),
                "description": f"Overall demonstrated skill footprint across {len(required_skills)} role prerequisites ({active_skills_count}/{len(required_skills)} active)."
            }
        }

        # Persist snapshot
        snapshot = ReadinessSnapshot(
            student_id=student_id,
            college_id=student.college_id,
            target_role=role_name,
            overall_score=overall_score,
            confidence_level=confidence_level,
            technical_score=verified_pct,
            coding_score=coding_pct,
            aptitude_score=aptitude_pct,
            interview_score=interview_pct,
            skill_coverage_score=coverage_pct,
            breakdown_json=breakdown,
            missing_skills=missing_skills,
            verified_skills=verified_skills
        )
        db.add(snapshot)
        db.commit()

        return {
            "student_id": student_id,
            "target_role": role_name,
            "overall_score": overall_score,
            "confidence_level": confidence_level,
            "data_coverage_percentage": data_coverage_pct,
            "breakdown": breakdown,
            "required_skills": required_skills,
            "verified_skills": verified_skills,
            "partially_demonstrated": partially_demonstrated,
            "missing_skills": missing_skills,
            "role_description": role_info["description"],
            "disclaimer": "The Placement Readiness Index evaluates verifiable competency readiness and preparation telemetry. It does not guarantee or predict actual employment selection."
        }

    @staticmethod
    def compare_roles(db: Session, student_id: str) -> Dict[str, Any]:
        """
        Calculates and compares Placement Readiness across all 7 supported target roles.
        Identifies strongest matching role, missing skills, and required improvements.
        """
        roles_comparison = []
        highest_score = -1
        strongest_role = None

        for role_name in ROLE_DEFINITIONS.keys():
            readiness = ReadinessService.calculate_readiness(db, student_id, target_role=role_name)
            score = readiness["overall_score"]
            if score > highest_score:
                highest_score = score
                strongest_role = role_name

            roles_comparison.append({
                "role_name": role_name,
                "overall_score": score,
                "confidence_level": readiness["confidence_level"],
                "data_coverage_percentage": readiness["data_coverage_percentage"],
                "required_skills": readiness["required_skills"],
                "verified_skills": readiness["verified_skills"],
                "partially_demonstrated": readiness["partially_demonstrated"],
                "missing_skills": readiness["missing_skills"],
                "description": readiness["role_description"]
            })

        # Sort descending by overall_score
        roles_comparison.sort(key=lambda r: r["overall_score"], reverse=True)

        return {
            "student_id": student_id,
            "strongest_role": strongest_role,
            "strongest_score": highest_score,
            "roles_comparison": roles_comparison,
            "recommended_focus": (
                f"Your strongest placement readiness is in '{strongest_role}' ({highest_score}/100). "
                f"To maximize multi-role eligibility, prioritize verifying missing competencies."
            )
        }
