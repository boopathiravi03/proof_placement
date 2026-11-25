from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from backend.app.models.models import (
    Student,
    Competency,
    Evidence,
    AssessmentAttempt,
    LearningPath,
    LearningTask,
    InterventionStudent,
    PlacementDrive,
    JobRole,
    Company,
    CompanyCollegeAccess,
    Application,
    SelectionDecision,
    MetricDefinition,
    AnalyticsSnapshot,
    DataQualityIssue,
)

DEFAULT_METRIC_DEFINITIONS = [
    {
        "metric_key": "verified_skill_coverage_pct",
        "metric_name": "Verified Skill Coverage (%)",
        "definition": "Percentage of registered students in the cohort with at least one active, non-expired verified competency.",
        "calculation_formula": "(students_with_verified_skill / total_registered_students) * 100",
        "data_source": "students, competencies",
        "inclusion_criteria": "All active students in college_id with Competency.state == 'verified' and not expired.",
        "exclusion_criteria": "Expired verifications and unverified self-claims.",
        "missing_data_handling": "Students with zero competency records are counted in denominator and flagged in data quality.",
        "data_owner": "Training & Placement Office",
    },
    {
        "metric_key": "application_to_shortlist_pct",
        "metric_name": "Application-to-Shortlist Conversion (%)",
        "definition": "Proportion of submitted non-withdrawn drive applications that reached shortlisted or later selection stages.",
        "calculation_formula": "(shortlisted_or_beyond_count / non_withdrawn_applications_count) * 100",
        "data_source": "applications",
        "inclusion_criteria": "Applications with status != 'withdrawn' in the reporting period.",
        "exclusion_criteria": "Withdrawn applications.",
        "missing_data_handling": "Returns 0.0% when denominator is 0; denominator is always displayed.",
        "data_owner": "Campus Recruitment Cell",
    },
    {
        "metric_key": "shortlist_to_selection_pct",
        "metric_name": "Shortlist-to-Selection Conversion (%)",
        "definition": "Proportion of shortlisted candidates who received a confirmed 'selected' decision.",
        "calculation_formula": "(selected_count / shortlisted_or_beyond_count) * 100",
        "data_source": "applications, selection_decisions",
        "inclusion_criteria": "Confirmed selection decisions in college_id.",
        "exclusion_criteria": "Pending interviews without final decision.",
        "missing_data_handling": "Displays denominator explicitly; incomplete drive outcomes raise a data-quality warning.",
        "data_owner": "Campus Recruitment Cell",
    },
    {
        "metric_key": "assessment_participation_pct",
        "metric_name": "Assessment Participation Rate (%)",
        "definition": "Percentage of registered students who have completed at least one adaptive competency assessment.",
        "calculation_formula": "(students_with_attempts / total_registered_students) * 100",
        "data_source": "students, assessment_attempts",
        "inclusion_criteria": "Completed or recorded AssessmentAttempt rows.",
        "exclusion_criteria": "Aborted attempts with 0 responses.",
        "missing_data_handling": "Unassessed students are counted as pending, not zero ability.",
        "data_owner": "Assessment & Faculty Board",
    },
]


class InstitutionalIntelligenceService:
    @staticmethod
    def seed_metric_definitions(db: Session) -> None:
        if not db.query(MetricDefinition).first():
            for m in DEFAULT_METRIC_DEFINITIONS:
                db.add(MetricDefinition(**m))
            db.commit()

    @staticmethod
    def get_metric_definitions(db: Session) -> List[Dict[str, Any]]:
        InstitutionalIntelligenceService.seed_metric_definitions(db)
        rows = db.query(MetricDefinition).all()
        return [
            {
                "metric_key": r.metric_key,
                "metric_name": r.metric_name,
                "definition": r.definition,
                "calculation_formula": r.calculation_formula,
                "data_source": r.data_source,
                "reporting_period": r.reporting_period,
                "inclusion_criteria": r.inclusion_criteria,
                "exclusion_criteria": r.exclusion_criteria,
                "missing_data_handling": r.missing_data_handling,
                "data_owner": r.data_owner,
            }
            for r in rows
        ]

    @staticmethod
    def run_data_quality_checks(db: Session, college_id: str) -> List[Dict[str, Any]]:
        students = db.query(Student).filter(Student.college_id == college_id).all()
        sids = [s.id for s in students]
        now = datetime.utcnow()

        issues: List[Dict[str, Any]] = []

        # 1. Missing academic records (cgpa <= 0 or missing branch)
        missing_acad = [s for s in students if s.cgpa is None or s.cgpa <= 0 or not s.branch]
        if missing_acad:
            issues.append({
                "check_name": "Missing Academic Records",
                "severity": "warning",
                "entity_type": "students",
                "affected_count": len(missing_acad),
                "description": f"{len(missing_acad)} student(s) have missing CGPA or branch metadata.",
            })

        # 2. Duplicate roll numbers
        roll_counts: Dict[str, int] = {}
        for s in students:
            if s.roll_number:
                roll_counts[s.roll_number] = roll_counts.get(s.roll_number, 0) + 1
        dup_rolls = sum(1 for c in roll_counts.values() if c > 1)
        if dup_rolls:
            issues.append({
                "check_name": "Duplicate Student Roll Numbers",
                "severity": "critical",
                "entity_type": "students",
                "affected_count": dup_rolls,
                "description": f"{dup_rolls} duplicate roll number(s) detected in {college_id}.",
            })

        # 3. Missing assessment results
        assessed_sids = {
            a.student_id for a in db.query(AssessmentAttempt).filter(AssessmentAttempt.college_id == college_id).all()
        }
        unassessed_cnt = sum(1 for sid in sids if sid not in assessed_sids)
        if unassessed_cnt:
            issues.append({
                "check_name": "Pending Baseline Assessments",
                "severity": "warning",
                "entity_type": "assessment_attempts",
                "affected_count": unassessed_cnt,
                "description": f"{unassessed_cnt} of {len(students)} student(s) have no recorded assessment attempts.",
            })

        # 4. Expired competency evidence
        expired_comps = (
            db.query(Competency)
            .filter(Competency.college_id == college_id)
            .all()
        )
        expired_cnt = sum(
            1 for c in expired_comps if c.state == "expired" or (c.expires_at and c.expires_at < now)
        )
        if expired_cnt:
            issues.append({
                "check_name": "Expired Competency Evidence",
                "severity": "warning",
                "entity_type": "competencies",
                "affected_count": expired_cnt,
                "description": f"{expired_cnt} competency verification(s) have expired and require reassessment.",
            })

        # 5. Incomplete drive outcomes (published drives with 0 selection decisions)
        drives = db.query(PlacementDrive).filter(PlacementDrive.college_id == college_id, PlacementDrive.published == True).all()
        dec_drive_ids = {
            d.drive_id for d in db.query(SelectionDecision).filter(SelectionDecision.college_id == college_id).all()
        }
        incomplete_drives = sum(1 for d in drives if d.id not in dec_drive_ids)
        if incomplete_drives:
            issues.append({
                "check_name": "Incomplete Drive Selection Outcomes",
                "severity": "warning",
                "entity_type": "placement_drives",
                "affected_count": incomplete_drives,
                "description": f"{incomplete_drives} published drive(s) do not yet have confirmed selection decisions.",
            })

        # Persist latest scan in DataQualityIssue
        db.query(DataQualityIssue).filter(DataQualityIssue.college_id == college_id).delete()
        for iss in issues:
            db.add(DataQualityIssue(college_id=college_id, **iss))
        db.commit()

        return issues

    @staticmethod
    def get_institutional_overview(
        db: Session,
        college_id: str,
        branch: Optional[str] = None,
        target_role: Optional[str] = None,
        company_id: Optional[str] = None,
        drive_id: Optional[str] = None,
        reporting_period: str = "2025-2026",
    ) -> Dict[str, Any]:
        InstitutionalIntelligenceService.seed_metric_definitions(db)

        q = db.query(Student).filter(Student.college_id == college_id)
        if branch and branch.upper() != "ALL":
            q = q.filter(Student.branch.ilike(branch))
        students = q.all()
        sids = {s.id for s in students}
        total_students = len(students)

        # Privacy k-anonymity suppression check for small filtered cohorts (< 3)
        privacy_suppressed = 0 < total_students < 3

        comps = db.query(Competency).filter(Competency.college_id == college_id).all()
        comps = [c for c in comps if c.student_id in sids]

        now = datetime.utcnow()
        students_with_profile = len({c.student_id for c in comps})
        students_with_verified = len({
            c.student_id for c in comps
            if c.state == "verified" and (not c.expires_at or c.expires_at >= now)
        })

        attempts = [
            a for a in db.query(AssessmentAttempt).filter(AssessmentAttempt.college_id == college_id).all()
            if a.student_id in sids
        ]
        students_assessed = len({a.student_id for a in attempts})

        lps = [
            lp for lp in db.query(LearningPath).filter(LearningPath.college_id == college_id, LearningPath.soft_deleted == False).all()
            if lp.student_id in sids and (not target_role or lp.target_role == target_role)
        ]
        students_with_lp = len({lp.student_id for lp in lps})

        iv_enrollments = [
            e for e in db.query(InterventionStudent).filter(InterventionStudent.college_id == college_id).all()
            if e.student_id in sids
        ]
        students_in_interventions = len({e.student_id for e in iv_enrollments})

        drives_q = db.query(PlacementDrive).filter(PlacementDrive.college_id == college_id)
        if company_id:
            drives_q = drives_q.filter(PlacementDrive.company_id == company_id)
        if drive_id:
            drives_q = drives_q.filter(PlacementDrive.id == drive_id)
        drives = drives_q.all()
        drive_ids = {d.id for d in drives}

        apps = [
            a for a in db.query(Application).filter(Application.college_id == college_id).all()
            if a.student_id in sids and (not drive_id or a.drive_id in drive_ids) and a.status != "withdrawn"
        ]
        shortlisted_apps = [a for a in apps if a.status in ["shortlisted", "interview_scheduled", "selected"]]
        selected_apps = [a for a in apps if a.status == "selected"]

        sel_decisions = [
            sd for sd in db.query(SelectionDecision).filter(SelectionDecision.college_id == college_id).all()
            if (not drive_id or sd.drive_id in drive_ids) and sd.decision == "selected"
        ]
        confirmed_placed = len(sel_decisions)

        dq_issues = InstitutionalIntelligenceService.run_data_quality_checks(db, college_id)

        payload = {
            "college_id": college_id,
            "reporting_period": reporting_period,
            "filters": {"branch": branch or "ALL", "target_role": target_role, "company_id": company_id, "drive_id": drive_id},
            "privacy_suppressed": privacy_suppressed,
            "kpis": {
                "total_registered_students": total_students,
                "students_with_competency_profiles": students_with_profile,
                "students_with_verified_skills": students_with_verified,
                "verified_skill_coverage_pct": round((students_with_verified / total_students) * 100, 1) if total_students else 0.0,
                "students_completed_assessments": students_assessed,
                "assessment_participation_pct": round((students_assessed / total_students) * 100, 1) if total_students else 0.0,
                "students_with_active_learning_paths": students_with_lp,
                "students_in_interventions": students_in_interventions,
                "active_campus_drives": len(drives),
                "applications_submitted": len(apps),
                "students_shortlisted": len({a.student_id for a in shortlisted_apps}),
                "students_selected": len({a.student_id for a in selected_apps}),
                "confirmed_selection_decisions": confirmed_placed,
            },
            "data_quality_warnings": dq_issues,
            "computed_at": datetime.utcnow().isoformat(),
        }

        # Cache aggregate snapshot
        db.add(
            AnalyticsSnapshot(
                college_id=college_id,
                snapshot_type="institutional_overview",
                reporting_period=reporting_period,
                filters_json=payload["filters"],
                payload_json=payload["kpis"],
            )
        )
        db.commit()
        return payload

    @staticmethod
    def get_industry_skill_demand(db: Session, college_id: str) -> Dict[str, Any]:
        """
        Compares internal authorized job opportunities' skill demands against cohort competency coverage.
        Clearly distinguishes approved active requirements from AI-extracted suggestions awaiting review.
        """
        access = db.query(CompanyCollegeAccess).filter(
            CompanyCollegeAccess.college_id == college_id,
            CompanyCollegeAccess.authorized == True,
        ).all()
        comp_ids = [a.company_id for a in access]
        roles = db.query(JobRole).filter(JobRole.company_id.in_(comp_ids)).all() if comp_ids else db.query(JobRole).all()

        total_students = max(db.query(Student).filter(Student.college_id == college_id).count(), 1)
        comps = db.query(Competency).filter(Competency.college_id == college_id).all()

        approved_demand: Dict[str, int] = {}
        pending_ai_suggestions: Dict[str, int] = {}

        for r in roles:
            for sk in (r.required_skills or []):
                approved_demand[sk] = approved_demand.get(sk, 0) + 1
            if not r.extracted_approved:
                for ask in (r.ai_extracted_skills or []):
                    pending_ai_suggestions[ask] = pending_ai_suggestions.get(ask, 0) + 1

        demand_comparison = []
        for sk, cnt in sorted(approved_demand.items(), key=lambda x: x[1], reverse=True):
            verified_cnt = len({c.student_id for c in comps if c.skill_name.lower() == sk.lower() and c.state in ["verified", "assessed"]})
            coverage_pct = round((verified_cnt / total_students) * 100, 1)
            gap_pct = round(100.0 - coverage_pct, 1)
            demand_comparison.append({
                "skill": sk,
                "source": "Internal Authorized Job Opportunities",
                "opportunities_demanding": cnt,
                "cohort_verified_or_assessed": verified_cnt,
                "cohort_coverage_pct": coverage_pct,
                "institutional_gap_pct": gap_pct,
            })

        return {
            "college_id": college_id,
            "scope_disclaimer": "Reflects internal authorized job opportunities registered for this institution, not the entire external job market.",
            "approved_skill_demand": demand_comparison,
            "ai_extracted_pending_review": [
                {"skill": sk, "occurrences": cnt, "status": "awaiting_human_review"}
                for sk, cnt in pending_ai_suggestions.items()
            ],
            "recommended_interventions": [
                f"Prioritize {d['skill']} training ({d['opportunities_demanding']} opportunity demand, {d['cohort_coverage_pct']}% cohort coverage)."
                for d in demand_comparison[:3]
                if d["cohort_coverage_pct"] < 60.0
            ],
        }

    @staticmethod
    def get_predictive_and_early_warning_insights(db: Session, college_id: str) -> Dict[str, Any]:
        """
        Enables ML predictions only when >= 30 confirmed historical selection records exist.
        Otherwise provides transparent, rule-based early-warning indicators with neutral language.
        """
        selection_count = db.query(SelectionDecision).filter(SelectionDecision.college_id == college_id).count()
        sufficient_history = selection_count >= 30

        students = db.query(Student).filter(Student.college_id == college_id).all()
        support_indicators: List[Dict[str, Any]] = []

        for st in students:
            attempts = db.query(AssessmentAttempt).filter(AssessmentAttempt.student_id == st.id).all()
            comps = db.query(Competency).filter(Competency.student_id == st.id).all()
            lps = db.query(LearningPath).filter(LearningPath.student_id == st.id, LearningPath.soft_deleted == False).all()

            reasons = []
            indicator_label = None

            if not attempts:
                reasons.append("No diagnostic assessments completed yet.")
                indicator_label = "Assessment pending"
            else:
                low_attempts = [a for a in attempts if (a.score / max(a.total_questions, 1)) * 100.0 < 60.0]
                if len(low_attempts) >= 2:
                    reasons.append(f"{len(low_attempts)} assessment attempt(s) below 60% mastery threshold.")
                    indicator_label = "Additional practice suggested"

            verified_cnt = sum(1 for c in comps if c.state == "verified")
            if verified_cnt == 0:
                reasons.append("Zero verified competencies recorded.")
                indicator_label = indicator_label or "Evidence incomplete"

            for lp in lps:
                incomplete_tasks = sum(1 for t in lp.tasks if not t.soft_deleted and not t.completed)
                if incomplete_tasks >= 3:
                    reasons.append(f"{incomplete_tasks} pending tasks in {lp.target_role} learning path.")
                    indicator_label = indicator_label or "Support recommended"

            if reasons:
                support_indicators.append({
                    "student_id": st.id,
                    "student_name": st.name,
                    "branch": st.branch,
                    "status_label": indicator_label or "Support recommended",
                    "explainable_reasons": reasons,
                })

        return {
            "college_id": college_id,
            "predictive_model_enabled": sufficient_history,
            "historical_labeled_outcomes": selection_count,
            "minimum_required_for_ml": 30,
            "model_status_explanation": (
                "Validated baseline model active."
                if sufficient_history
                else f"Insufficient historical placement outcome labels ({selection_count}/30 required). Using transparent rule-based early-warning indicators instead of synthetic predictions."
            ),
            "governance_rule": "Early-warning indicators are strictly for student support and never determine eligibility or rejection.",
            "early_warning_indicators": support_indicators,
        }

    @staticmethod
    def get_placement_performance_analytics(db: Session, college_id: str) -> Dict[str, Any]:
        drives = db.query(PlacementDrive).filter(PlacementDrive.college_id == college_id).all()
        apps = db.query(Application).filter(Application.college_id == college_id, Application.status != "withdrawn").all()
        selections = db.query(SelectionDecision).filter(SelectionDecision.college_id == college_id).all()

        applicants_cnt = len(apps)
        shortlisted_cnt = sum(1 for a in apps if a.status in ["shortlisted", "interview_scheduled", "selected"])
        selected_cnt = sum(1 for a in apps if a.status == "selected")
        confirmed_offers = sum(1 for s in selections if s.decision == "selected")
        accepted_offers = sum(1 for a in apps if a.stage == "Accepted" or (s_match := next((s for s in selections if s.application_id == a.id), None)) and s_match.officer_approved and s_match.decision == "selected")

        app_to_shortlist_pct = round((shortlisted_cnt / applicants_cnt) * 100, 1) if applicants_cnt else 0.0
        shortlist_to_sel_pct = round((selected_cnt / shortlisted_cnt) * 100, 1) if shortlisted_cnt else 0.0

        dept_outcomes: Dict[str, Dict[str, int]] = {}
        for a in apps:
            b = a.branch or "CSE"
            dept_outcomes.setdefault(b, {"applicants": 0, "shortlisted": 0, "selected": 0})
            dept_outcomes[b]["applicants"] += 1
            if a.status in ["shortlisted", "interview_scheduled", "selected"]:
                dept_outcomes[b]["shortlisted"] += 1
            if a.status == "selected":
                dept_outcomes[b]["selected"] += 1

        return {
            "college_id": college_id,
            "total_active_drives": len(drives),
            "companies_participating": len({d.company_id for d in drives}),
            "funnel": {
                "applicants": applicants_cnt,
                "shortlisted": shortlisted_cnt,
                "selected": selected_cnt,
                "confirmed_selection_decisions": confirmed_offers,
                "accepted_offers": accepted_offers,
            },
            "conversions": {
                "application_to_shortlist_pct": app_to_shortlist_pct,
                "application_to_shortlist_denominator": applicants_cnt,
                "shortlist_to_selection_pct": shortlist_to_sel_pct,
                "shortlist_to_selection_denominator": shortlisted_cnt,
            },
            "department_outcomes": dept_outcomes,
        }
