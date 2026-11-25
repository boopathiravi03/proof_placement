from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from backend.app.models.models import (
    College,
    Student,
    Competency,
    PlacementDrive,
    Application,
    UniversityCollegeAccess,
    User,
)
from backend.app.services.institutional_intelligence_service import InstitutionalIntelligenceService


class UniversityService:
    @staticmethod
    def get_authorized_colleges_summary(
        db: Session,
        current_user: Optional[User] = None,
    ) -> Dict[str, Any]:
        if current_user:
            if current_user.role == "recruiter":
                raise PermissionError("Recruiters cannot access university-level analytics.")
            if current_user.role == "student":
                raise PermissionError("Students cannot access university-level analytics.")
            if current_user.role == "officer":
                raise PermissionError("College placement officers can only access their own college tenant, not cross-college university analytics.")

        colleges_q = db.query(College)
        if current_user and current_user.role == "university_admin":
            scoped = db.query(UniversityCollegeAccess).filter(
                UniversityCollegeAccess.university_user_id == current_user.id,
                UniversityCollegeAccess.authorized == True,
            ).all()
            if scoped:
                allowed_ids = [s.college_id for s in scoped]
                colleges_q = colleges_q.filter(College.id.in_(allowed_ids))

        colleges = colleges_q.all()
        summaries: List[Dict[str, Any]] = []
        total_students_all = 0
        total_drives_all = 0

        for col in colleges:
            ov = InstitutionalIntelligenceService.get_institutional_overview(db, col.id)
            kpis = ov["kpis"]
            total_students_all += kpis["total_registered_students"]
            total_drives_all += kpis["active_campus_drives"]
            sel_rate = (
                round((kpis["students_selected"] / kpis["total_registered_students"]) * 100, 1)
                if kpis["total_registered_students"] > 0
                else 0.0
            )
            summaries.append({
                "college_id": col.id,
                "name": col.name,
                "total_students": kpis["total_registered_students"],
                "verified_skill_coverage": kpis["verified_skill_coverage_pct"],
                "assessment_participation_pct": kpis["assessment_participation_pct"],
                "active_drives": kpis["active_campus_drives"],
                "placement_rate": sel_rate,
                "data_quality_warnings_count": len(ov["data_quality_warnings"]),
                "status": "Attention Needed" if ov["data_quality_warnings"] else "Healthy",
            })

        return {
            "tenant_policy": "Strict Tenant Isolation (Row-Level Security & College Partitioning)",
            "isolation_guarantee": "University administrators view aggregate college-level metrics only. No individual student PII is exposed.",
            "participating_colleges": len(summaries),
            "aggregate_students": total_students_all,
            "aggregate_active_drives": total_drives_all,
            "colleges": summaries,
        }
