from datetime import datetime, timedelta
from typing import Optional, List, Dict
from sqlalchemy.orm import Session
from backend.app.models.models import Competency, Evidence, Student
from backend.app.services.audit_service import AuditService

# Lifecycle states:
# 1. Claimed: Student self-reports the skill.
# 2. Observed: Activity detected (e.g. lab participation, basic profile scan).
# 3. Evidence-linked: Code commits, repos, certificates, hackathons attached.
# 4. Assessed: Successfully passed adaptive machine assessment (>=60%).
# 5. Verified: Mentor sign-off, live practical walkthrough, or official proctored credential.
# 6. Expired: Verification expired after validity period (requires reassessment).

WEAK_EVIDENCE = {"commit", "repo", "cert", "hackathon"}
ASSESSMENT_EVIDENCE = {"test", "assessment"}
VERIFICATION_METHODS = {"mentor", "walkthrough", "proctored_exam"}

class CompetencyService:
    @staticmethod
    def evaluate_state(current_state: str, evidence_kinds: List[str], has_mentor_signoff: bool = False, is_expired: bool = False) -> str:
        if is_expired:
            return "expired"
        
        kinds_set = set(evidence_kinds)
        
        # Rule: Verified requires mentor signoff OR practical walkthrough, and preceding assessment/evidence
        if has_mentor_signoff or (kinds_set & {"mentor", "walkthrough"}):
            # Must have either passed assessment or have solid evidence to verify
            return "verified"
            
        # Rule: Validated test/assessment produces Assessed
        if kinds_set & ASSESSMENT_EVIDENCE:
            return "assessed"
            
        # Rule: Commits, repos, certs, hackathons produce Evidence-linked
        if kinds_set & WEAK_EVIDENCE:
            return "evidence_linked"
            
        if "observed" in kinds_set:
            return "observed"
            
        return "claimed"

    @staticmethod
    def add_evidence(
        db: Session,
        student_id: str,
        skill_name: str,
        kind: str,
        title: str,
        ref_url: str,
        confidence: float = 0.70,
        extra_metadata: Optional[Dict] = None
    ) -> Competency:
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise ValueError(f"Student {student_id} not found")

        # Find or create competency record
        competency = (
            db.query(Competency)
            .filter(Competency.student_id == student_id, Competency.skill_name == skill_name)
            .first()
        )
        if not competency:
            competency = Competency(
                student_id=student_id,
                college_id=student.college_id,
                skill_name=skill_name,
                state="claimed",
                confidence=0.50
            )
            db.add(competency)
            db.flush()

        # Add evidence item
        evidence_item = Evidence(
            student_id=student_id,
            college_id=student.college_id,
            competency_id=competency.id,
            kind=kind,
            title=title,
            ref_url=ref_url,
            confidence=confidence,
            extra_metadata=extra_metadata or {}
        )
        db.add(evidence_item)
        db.flush()

        # Re-evaluate all evidence for this competency
        all_evidence = db.query(Evidence).filter(Evidence.competency_id == competency.id).all()
        kinds = [e.kind for e in all_evidence]
        
        old_state = competency.state
        new_state = CompetencyService.evaluate_state(
            current_state=old_state,
            evidence_kinds=kinds,
            has_mentor_signoff=bool(competency.verified_by)
        )
        
        competency.state = new_state
        if new_state == "verified" and not competency.expires_at:
            competency.expires_at = datetime.utcnow() + timedelta(days=365)
            
        competency.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(competency)

        AuditService.log_event(
            db=db,
            college_id=student.college_id,
            actor=student.name,
            action=f"Added evidence '{title}' for {skill_name}: state {old_state} -> {new_state}"
        )
        return competency

    @staticmethod
    def sign_off_mentor(
        db: Session,
        student_id: str,
        skill_name: str,
        mentor_name: str,
        notes: Optional[str] = None
    ) -> Competency:
        competency = (
            db.query(Competency)
            .filter(Competency.student_id == student_id, Competency.skill_name == skill_name)
            .first()
        )
        if not competency:
            raise ValueError(f"Competency {skill_name} not found for student")
        
        # Enforce prerequisite: Must be at least Assessed or Evidence-linked to be verified by mentor
        if competency.state not in ["assessed", "evidence_linked"]:
            raise ValueError(f"Cannot verify {skill_name}: student must complete assessment or link evidence first")

        old_state = competency.state
        competency.state = "verified"
        competency.verified_by = mentor_name
        competency.verification_method = "mentor_signoff"
        competency.confidence = 0.98
        competency.expires_at = datetime.utcnow() + timedelta(days=365)
        competency.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(competency)

        AuditService.log_event(
            db=db,
            college_id=competency.college_id,
            actor=mentor_name,
            action=f"Mentor sign-off for {skill_name}: {old_state} -> verified"
        )
        return competency
