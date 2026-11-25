from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from backend.app.models.models import (
    EligibilityRule,
    EligibilityDecision,
    EligibilityAppeal,
    Student,
    Competency,
    AssessmentAttempt,
    Evidence,
    JobRole,
    PlacementDrive,
)
from backend.app.services.audit_service import AuditService


class EligibilityService:
    @staticmethod
    def evaluate_eligibility(
        db: Session,
        rules: Dict[str, Any],
        student_data: Dict[str, Any],
        student_id: str,
        college_id: str,
    ) -> Dict[str, Any]:
        """Backwards-compatible direct rule evaluation."""
        min_cgpa = float(rules.get("min_cgpa", 6.5))
        max_backlogs = int(rules.get("max_backlogs", 0))
        required_skills = rules.get("required_skills", [])
        version = int(rules.get("version", 1))

        actual_cgpa = float(student_data.get("cgpa", 0.0))
        actual_backlogs = int(student_data.get("backlogs", 0))
        verified_skills = set(student_data.get("verified_skills", []))

        failed_rules: List[str] = []
        rule_items: List[Dict[str, str]] = []

        if actual_cgpa < min_cgpa:
            msg = f"Minimum CGPA requirement: needed {min_cgpa}, student has {actual_cgpa}"
            failed_rules.append(msg)
            rule_items.append({"criterion": f"CGPA >= {min_cgpa}", "result": "Failed", "explanation": msg})
        else:
            rule_items.append({"criterion": f"CGPA >= {min_cgpa}", "result": "Passed", "explanation": f"Student CGPA is {actual_cgpa}"})

        if actual_backlogs > max_backlogs:
            msg = f"Maximum active backlogs: allowed {max_backlogs}, student has {actual_backlogs}"
            failed_rules.append(msg)
            rule_items.append({"criterion": f"Backlogs <= {max_backlogs}", "result": "Failed", "explanation": msg})
        else:
            rule_items.append({"criterion": f"Backlogs <= {max_backlogs}", "result": "Passed", "explanation": f"Student has {actual_backlogs} active backlog(s)"})

        for skill in required_skills:
            if skill not in verified_skills:
                msg = f"Required verified skill '{skill}' missing from verified profile"
                failed_rules.append(msg)
                rule_items.append({"criterion": f"{skill} verified", "result": "Failed", "explanation": msg})
            else:
                rule_items.append({"criterion": f"{skill} verified", "result": "Passed", "explanation": f"{skill} is verified"})

        is_eligible = len(failed_rules) == 0

        decision = EligibilityDecision(
            college_id=college_id,
            student_id=student_id,
            rule_id=str(rules.get("rule_id", "rule-v" + str(version))),
            rule_version=version,
            eligible=is_eligible,
            status="eligible" if is_eligible else "not_eligible",
            student_inputs=student_data,
            failed_conditions=failed_rules,
            rule_items=rule_items,
        )
        db.add(decision)
        db.commit()
        db.refresh(decision)

        AuditService.log_event(
            db=db,
            college_id=college_id,
            actor="System Eligibility Engine",
            action=f"Evaluated student {student_id} for rule v{version}: {'ELIGIBLE' if is_eligible else 'INELIGIBLE'} ({len(failed_rules)} failed conditions)",
        )

        return {
            "eligible": is_eligible,
            "status": decision.status,
            "failed_rules": failed_rules,
            "rule_items": rule_items,
            "rule_version": version,
            "inputs": student_data,
            "decision_id": decision.id,
        }

    @staticmethod
    def create_versioned_rule(
        db: Session,
        college_id: str,
        rule_name: str,
        min_cgpa: float = 6.5,
        max_backlogs: int = 0,
        required_skills: Optional[List[str]] = None,
        eligible_departments: Optional[List[str]] = None,
        eligible_grad_years: Optional[List[int]] = None,
        min_assessment_score: float = 0.0,
        standing_arrears_allowed: bool = False,
        job_role_id: Optional[str] = None,
        drive_id: Optional[str] = None,
        created_by: str = "T&P Officer",
        description: Optional[str] = None,
    ) -> EligibilityRule:
        # Validate rule parameters strictly
        if min_cgpa < 0.0 or min_cgpa > 10.0:
            raise ValueError("Invalid rule configuration: min_cgpa must be between 0.0 and 10.0")
        if max_backlogs < 0:
            raise ValueError("Invalid rule configuration: max_backlogs cannot be negative")
        if min_assessment_score < 0.0 or min_assessment_score > 100.0:
            raise ValueError("Invalid rule configuration: min_assessment_score must be between 0 and 100")

        # Determine next version for this college / job_role / drive without overwriting past versions
        q = db.query(EligibilityRule).filter(EligibilityRule.college_id == college_id)
        if job_role_id:
            q = q.filter(EligibilityRule.job_role_id == job_role_id)
        if drive_id:
            q = q.filter(EligibilityRule.drive_id == drive_id)
        prev_rules = q.order_by(EligibilityRule.version.desc()).all()
        next_version = (prev_rules[0].version + 1) if prev_rules else 1

        for pr in prev_rules:
            pr.active = False

        rule = EligibilityRule(
            college_id=college_id,
            drive_id=drive_id,
            job_role_id=job_role_id,
            rule_name=rule_name,
            description=description,
            rule_type="composite",
            operator=">=",
            expected_value={"min_cgpa": min_cgpa, "max_backlogs": max_backlogs},
            mandatory=True,
            version=next_version,
            min_cgpa=min_cgpa,
            max_backlogs=max_backlogs,
            standing_arrears_allowed=standing_arrears_allowed,
            eligible_departments=eligible_departments or [],
            eligible_grad_years=eligible_grad_years or [],
            required_skills=required_skills or [],
            min_assessment_score=min_assessment_score,
            created_by=created_by,
            approval_status="approved",
            active=True,
        )
        db.add(rule)
        db.commit()
        db.refresh(rule)

        AuditService.log_event(
            db=db,
            college_id=college_id,
            actor=created_by,
            action=f"Created eligibility rule '{rule_name}' v{next_version} (CGPA >= {min_cgpa}, max_backlogs <= {max_backlogs})",
        )
        return rule

    @staticmethod
    def evaluate_student_for_job(
        db: Session,
        student_id: str,
        job_role_id: str,
        drive_id: Optional[str] = None,
        rule_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise ValueError(f"Student {student_id} not found")

        job = db.query(JobRole).filter(JobRole.id == job_role_id).first()
        if not job:
            raise ValueError(f"Job role {job_role_id} not found")

        # Load active rule version (or specified rule)
        rule = None
        if rule_id:
            rule = db.query(EligibilityRule).filter(EligibilityRule.id == rule_id).first()
        if not rule:
            q = db.query(EligibilityRule).filter(
                EligibilityRule.college_id == student.college_id,
                EligibilityRule.active == True,
            )
            if drive_id:
                drive_rule = q.filter(EligibilityRule.drive_id == drive_id).first()
                rule = drive_rule or q.filter(EligibilityRule.job_role_id == job_role_id).first()
            else:
                rule = q.filter(EligibilityRule.job_role_id == job_role_id).first()

        min_cgpa = rule.min_cgpa if rule else (job.min_cgpa or 6.0)
        max_backlogs = rule.max_backlogs if rule else (job.max_backlogs if job.max_backlogs is not None else 0)
        req_skills = (rule.required_skills if rule and rule.required_skills else job.required_skills) or []
        req_depts = (rule.eligible_departments if rule and rule.eligible_departments else job.eligible_departments) or []
        req_years = (rule.eligible_grad_years if rule and rule.eligible_grad_years else job.eligible_grad_years) or []
        min_asm = rule.min_assessment_score if rule else (job.min_assessment_score or 0.0)
        rule_version = rule.version if rule else 1
        effective_rule_id = rule.id if rule else f"job-default-{job.id}"

        competencies = db.query(Competency).filter(Competency.student_id == student_id).all()
        comp_map = {c.skill_name.lower(): c for c in competencies}
        attempts = db.query(AssessmentAttempt).filter(AssessmentAttempt.student_id == student_id).all()

        rule_items: List[Dict[str, str]] = []
        failed_conditions: List[str] = []
        pending_conditions: List[str] = []
        manual_review_conditions: List[str] = []

        # 1. Academic CGPA (Do not silently treat missing data as failed)
        if student.cgpa is None or student.cgpa <= 0:
            msg = "Academic CGPA record missing; requires officer verification"
            manual_review_conditions.append(msg)
            rule_items.append({"criterion": f"CGPA >= {min_cgpa}", "result": "Needs Review", "explanation": msg})
        elif student.cgpa < min_cgpa:
            msg = f"Student CGPA is {student.cgpa} (minimum required: {min_cgpa})"
            failed_conditions.append(msg)
            rule_items.append({"criterion": f"CGPA >= {min_cgpa}", "result": "Failed", "explanation": msg})
        else:
            rule_items.append({"criterion": f"CGPA >= {min_cgpa}", "result": "Passed", "explanation": f"Student CGPA is {student.cgpa}"})

        # 2. Active Backlogs
        if student.backlogs is None:
            msg = "Backlog count not recorded; requires verification"
            manual_review_conditions.append(msg)
            rule_items.append({"criterion": f"Active backlogs <= {max_backlogs}", "result": "Needs Review", "explanation": msg})
        elif student.backlogs > max_backlogs:
            msg = f"Student has {student.backlogs} active backlog(s) (maximum allowed: {max_backlogs})"
            failed_conditions.append(msg)
            rule_items.append({"criterion": f"Active backlogs <= {max_backlogs}", "result": "Failed", "explanation": msg})
        else:
            rule_items.append({"criterion": f"Active backlogs <= {max_backlogs}", "result": "Passed", "explanation": f"{student.backlogs} active backlog(s) recorded"})

        # 3. Department / Branch eligibility (never uses demographic attributes)
        if req_depts:
            if not student.branch:
                msg = "Department/branch missing from profile"
                manual_review_conditions.append(msg)
                rule_items.append({"criterion": f"Branch in {', '.join(req_depts)}", "result": "Needs Review", "explanation": msg})
            elif student.branch.upper() not in [d.upper() for d in req_depts]:
                msg = f"Branch '{student.branch}' is outside eligible branches ({', '.join(req_depts)})"
                failed_conditions.append(msg)
                rule_items.append({"criterion": f"Branch in {', '.join(req_depts)}", "result": "Failed", "explanation": msg})
            else:
                rule_items.append({"criterion": f"Branch in {', '.join(req_depts)}", "result": "Passed", "explanation": f"Student branch is {student.branch}"})

        # 4. Graduation Year
        grad_year = getattr(student, "graduation_year", 2026)
        if req_years:
            if not grad_year:
                msg = "Graduation year missing from profile"
                manual_review_conditions.append(msg)
                rule_items.append({"criterion": f"Graduation Year in {req_years}", "result": "Needs Review", "explanation": msg})
            elif grad_year not in req_years:
                msg = f"Graduation year {grad_year} not in {req_years}"
                failed_conditions.append(msg)
                rule_items.append({"criterion": f"Graduation Year in {req_years}", "result": "Failed", "explanation": msg})
            else:
                rule_items.append({"criterion": f"Graduation Year in {req_years}", "result": "Passed", "explanation": f"Graduation year is {grad_year}"})

        # 5. Required Competencies (Distinguish pending verification vs failed)
        now = datetime.utcnow()
        for sk in req_skills:
            comp = comp_map.get(sk.lower())
            if not comp:
                msg = f"{sk} verification/assessment not completed"
                pending_conditions.append(msg)
                rule_items.append({"criterion": f"{sk} proficiency", "result": "Pending", "explanation": msg})
            elif comp.state == "expired" or (comp.expires_at and comp.expires_at < now):
                msg = f"{sk} verification expired; reassessment needed"
                pending_conditions.append(msg)
                rule_items.append({"criterion": f"{sk} proficiency", "result": "Pending", "explanation": msg})
            elif comp.state in ["verified", "assessed"]:
                rule_items.append({"criterion": f"{sk} proficiency", "result": "Passed", "explanation": f"{sk} is {comp.state}"})
            else:
                msg = f"{sk} is currently '{comp.state}'; requires assessment or mentor verification"
                pending_conditions.append(msg)
                rule_items.append({"criterion": f"{sk} proficiency", "result": "Pending", "explanation": msg})

        # 6. Minimum Assessment Score (if configured > 0)
        if min_asm and min_asm > 0:
            if not attempts:
                msg = f"No assessment completed yet (minimum {min_asm}% required)"
                pending_conditions.append(msg)
                rule_items.append({"criterion": f"Assessment >= {min_asm}%", "result": "Pending", "explanation": msg})
            else:
                best_pct = max((a.score / max(a.total_questions, 1)) * 100.0 for a in attempts)
                if best_pct < min_asm:
                    msg = f"Highest assessment score is {round(best_pct, 1)}% (required: {min_asm}%)"
                    failed_conditions.append(msg)
                    rule_items.append({"criterion": f"Assessment >= {min_asm}%", "result": "Failed", "explanation": msg})
                else:
                    rule_items.append({"criterion": f"Assessment >= {min_asm}%", "result": "Passed", "explanation": f"Best score is {round(best_pct, 1)}%"})

        if failed_conditions:
            status = "not_eligible"
            is_eligible = False
        elif manual_review_conditions:
            status = "needs_manual_review"
            is_eligible = False
        elif pending_conditions:
            status = "pending_verification"
            is_eligible = False
        else:
            status = "eligible"
            is_eligible = True

        inputs_snapshot = {
            "cgpa": student.cgpa,
            "backlogs": student.backlogs,
            "branch": student.branch,
            "graduation_year": grad_year,
            "competencies": {c.skill_name: c.state for c in competencies},
        }

        decision = EligibilityDecision(
            college_id=student.college_id,
            student_id=student_id,
            drive_id=drive_id,
            job_role_id=job_role_id,
            rule_id=effective_rule_id,
            rule_version=rule_version,
            eligible=is_eligible,
            status=status,
            student_inputs=inputs_snapshot,
            failed_conditions=failed_conditions + pending_conditions + manual_review_conditions,
            rule_items=rule_items,
        )
        db.add(decision)
        db.commit()
        db.refresh(decision)

        return {
            "decision_id": decision.id,
            "student_id": student_id,
            "job_role_id": job_role_id,
            "drive_id": drive_id,
            "eligible": is_eligible,
            "status": status,
            "rule_id": effective_rule_id,
            "rule_version": rule_version,
            "rule_items": rule_items,
            "failed_conditions": failed_conditions,
            "pending_conditions": pending_conditions,
            "manual_review_conditions": manual_review_conditions,
            "inputs": inputs_snapshot,
        }

    @staticmethod
    def evaluate_cohort_for_drive(db: Session, college_id: str, drive_id: str) -> Dict[str, Any]:
        drive = db.query(PlacementDrive).filter(PlacementDrive.id == drive_id, PlacementDrive.college_id == college_id).first()
        if not drive:
            raise ValueError("Drive not found in college")

        students = db.query(Student).filter(Student.college_id == college_id).all()
        evaluations = []
        counts = {"eligible": 0, "not_eligible": 0, "pending_verification": 0, "needs_manual_review": 0}
        for st in students:
            ev = EligibilityService.evaluate_student_for_job(db, st.id, drive.job_role_id, drive_id=drive.id)
            counts[ev["status"]] = counts.get(ev["status"], 0) + 1
            evaluations.append({
                "student_id": st.id,
                "student_name": st.name,
                "branch": st.branch,
                "cgpa": st.cgpa,
                "backlogs": st.backlogs,
                **ev,
            })

        return {
            "drive_id": drive_id,
            "college_id": college_id,
            "summary": counts,
            "evaluations": evaluations,
        }

    @staticmethod
    def officer_override_decision(
        db: Session,
        decision_id: str,
        college_id: str,
        officer_name: str,
        new_eligible: bool,
        reason: str,
    ) -> EligibilityDecision:
        if not reason or not reason.strip():
            raise ValueError("Officer override requires a recorded reason.")

        decision = db.query(EligibilityDecision).filter(
            EligibilityDecision.id == decision_id,
            EligibilityDecision.college_id == college_id,
        ).first()
        if not decision:
            raise ValueError("Eligibility decision not found in college")

        decision.eligible = new_eligible
        decision.status = "eligible" if new_eligible else "not_eligible"
        decision.override_by = officer_name
        decision.override_reason = reason.strip()
        decision.override_at = datetime.utcnow()
        db.commit()
        db.refresh(decision)

        AuditService.log_event(
            db=db,
            college_id=college_id,
            actor=officer_name,
            action=f"Override eligibility decision {decision_id} -> {decision.status}. Reason: {reason.strip()}",
        )
        return decision

    @staticmethod
    def submit_appeal(
        db: Session,
        decision_id: str,
        student_id: str,
        reason: str,
        appeal_type: str = "incorrect_evaluation",
        requested_correction: Optional[Dict[str, Any]] = None,
    ) -> EligibilityAppeal:
        decision = db.query(EligibilityDecision).filter(EligibilityDecision.id == decision_id).first()
        if not decision:
            raise ValueError(f"Decision {decision_id} not found")

        decision.appealed = True
        appeal = EligibilityAppeal(
            decision_id=decision_id,
            student_id=student_id,
            college_id=decision.college_id,
            appeal_type=appeal_type,
            reason=reason,
            requested_correction=requested_correction or {},
            status="pending",
        )
        db.add(appeal)
        db.commit()
        db.refresh(appeal)

        AuditService.log_event(
            db=db,
            college_id=decision.college_id,
            actor=f"Student {student_id}",
            action=f"Submitted eligibility appeal ({appeal_type}) for decision {decision_id}: '{reason[:60]}'",
        )
        return appeal

    @staticmethod
    def review_appeal(
        db: Session,
        appeal_id: str,
        college_id: str,
        officer_name: str,
        action: str,  # approved | rejected | clarification_requested
        reviewer_notes: str = "",
        corrected_data: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        appeal = db.query(EligibilityAppeal).filter(
            EligibilityAppeal.id == appeal_id,
            EligibilityAppeal.college_id == college_id,
        ).first()
        if not appeal:
            raise ValueError("Appeal not found in college")

        if action not in ["approved", "rejected", "clarification_requested"]:
            raise ValueError("Invalid appeal review action")

        appeal.status = action
        appeal.decided_by = officer_name
        appeal.reviewer_notes = reviewer_notes
        if action in ["approved", "rejected"]:
            appeal.resolved_at = datetime.utcnow()

        recalculated = None
        if action == "approved":
            student = db.query(Student).filter(Student.id == appeal.student_id, Student.college_id == college_id).first()
            if student and corrected_data:
                if "cgpa" in corrected_data and corrected_data["cgpa"] is not None:
                    student.cgpa = float(corrected_data["cgpa"])
                if "backlogs" in corrected_data and corrected_data["backlogs"] is not None:
                    student.backlogs = int(corrected_data["backlogs"])
                if "branch" in corrected_data and corrected_data["branch"]:
                    student.branch = str(corrected_data["branch"])
                if "graduation_year" in corrected_data and corrected_data["graduation_year"] is not None:
                    student.graduation_year = int(corrected_data["graduation_year"])
                db.flush()

            orig_decision = db.query(EligibilityDecision).filter(EligibilityDecision.id == appeal.decision_id).first()
            if orig_decision and orig_decision.job_role_id:
                recalculated = EligibilityService.evaluate_student_for_job(
                    db,
                    appeal.student_id,
                    orig_decision.job_role_id,
                    drive_id=orig_decision.drive_id,
                    rule_id=orig_decision.rule_id,
                )

        db.commit()
        db.refresh(appeal)

        AuditService.log_event(
            db=db,
            college_id=college_id,
            actor=officer_name,
            action=f"{action.upper()} eligibility appeal {appeal.id} for student {appeal.student_id}",
        )

        return {
            "appeal_id": appeal.id,
            "status": appeal.status,
            "decided_by": officer_name,
            "recalculated_eligibility": recalculated,
        }
