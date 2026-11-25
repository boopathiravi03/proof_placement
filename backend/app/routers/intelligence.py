from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.models import User
from backend.app.security import get_current_user_optional
from backend.app.services.institutional_intelligence_service import InstitutionalIntelligenceService
from backend.app.services.accreditation_report_service import AccreditationReportService

router = APIRouter(prefix="/intelligence", tags=["Institutional Intelligence & Accreditation"])


def _enforce_intelligence_access(current_user: Optional[User], college_id: str):
    if current_user:
        if current_user.role in ["student", "recruiter"]:
            raise HTTPException(status_code=403, detail="Unauthorized: Officer or University Admin role required.")
        if current_user.role == "officer" and current_user.college_id != college_id:
            raise HTTPException(status_code=403, detail="Tenant isolation violation: Cannot access another college's institutional intelligence.")


class GenerateReportRequest(BaseModel):
    college_id: str = "COLLEGE-A"
    report_type: str = "NAAC_NIRF_PLACEMENT"
    reporting_period: str = "2025-2026"
    generated_by: str = "T&P Officer"


@router.get("/overview")
def get_institutional_overview(
    college_id: str = "COLLEGE-A",
    branch: Optional[str] = None,
    target_role: Optional[str] = None,
    company_id: Optional[str] = None,
    drive_id: Optional[str] = None,
    reporting_period: str = "2025-2026",
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    _enforce_intelligence_access(current_user, college_id)
    return InstitutionalIntelligenceService.get_institutional_overview(
        db=db,
        college_id=college_id,
        branch=branch,
        target_role=target_role,
        company_id=company_id,
        drive_id=drive_id,
        reporting_period=reporting_period,
    )


@router.get("/metric-definitions")
def get_metric_definitions(db: Session = Depends(get_db)):
    return InstitutionalIntelligenceService.get_metric_definitions(db)


@router.get("/data-quality")
def get_data_quality_issues(
    college_id: str = "COLLEGE-A",
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    _enforce_intelligence_access(current_user, college_id)
    return {
        "college_id": college_id,
        "issues": InstitutionalIntelligenceService.run_data_quality_checks(db, college_id),
    }


@router.get("/industry-demand")
def get_industry_skill_demand(
    college_id: str = "COLLEGE-A",
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    _enforce_intelligence_access(current_user, college_id)
    return InstitutionalIntelligenceService.get_industry_skill_demand(db, college_id)


@router.get("/predictive-insights")
def get_predictive_insights(
    college_id: str = "COLLEGE-A",
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    _enforce_intelligence_access(current_user, college_id)
    return InstitutionalIntelligenceService.get_predictive_and_early_warning_insights(db, college_id)


@router.get("/placement-performance")
def get_placement_performance(
    college_id: str = "COLLEGE-A",
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    _enforce_intelligence_access(current_user, college_id)
    return InstitutionalIntelligenceService.get_placement_performance_analytics(db, college_id)


@router.post("/reports/generate")
def generate_accreditation_report(
    payload: GenerateReportRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    _enforce_intelligence_access(current_user, payload.college_id)
    role = current_user.role if current_user else "officer"
    actor = current_user.full_name if current_user else payload.generated_by
    try:
        rep = AccreditationReportService.generate_report(
            db=db,
            college_id=payload.college_id,
            report_type=payload.report_type,
            reporting_period=payload.reporting_period,
            generated_by=actor,
            actor_role=role,
        )
        return {
            "id": rep.id,
            "college_id": rep.college_id,
            "report_type": rep.report_type,
            "reporting_period": rep.reporting_period,
            "generated_by": rep.generated_by,
            "metrics": rep.metrics_json,
            "missing_data_warnings": rep.missing_data_warnings,
            "evidence_references": rep.evidence_references,
            "disclaimer": rep.disclaimer,
            "created_at": rep.created_at.isoformat() if rep.created_at else None,
        }
    except PermissionError as ex:
        raise HTTPException(status_code=403, detail=str(ex))


@router.get("/reports")
def list_accreditation_reports(
    college_id: str = "COLLEGE-A",
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    _enforce_intelligence_access(current_user, college_id)
    return AccreditationReportService.list_reports(db, college_id)


@router.get("/reports/{report_id}/export-csv")
def export_accreditation_report_csv(
    report_id: str,
    college_id: str = "COLLEGE-A",
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    _enforce_intelligence_access(current_user, college_id)
    try:
        csv_data = AccreditationReportService.export_report_csv(db, report_id, college_id)
        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=institutional_report_{report_id}.csv"},
        )
    except ValueError as ex:
        raise HTTPException(status_code=404, detail=str(ex))


@router.get("/reports/{report_id}/export-pdf")
def export_accreditation_report_pdf(
    report_id: str,
    college_id: str = "COLLEGE-A",
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    _enforce_intelligence_access(current_user, college_id)
    try:
        pdf_bytes = AccreditationReportService.export_report_pdf_bytes(db, report_id, college_id)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=institutional_report_{report_id}.pdf"},
        )
    except ValueError as ex:
        raise HTTPException(status_code=404, detail=str(ex))
