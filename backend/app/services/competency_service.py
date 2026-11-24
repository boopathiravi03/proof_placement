from datetime import datetime, timedelta
from typing import Optional, List, Dict
from sqlalchemy.orm import Session
from backend.app.models.models import Competency, Evidence, Student, MentorVerificationRequest
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

    @staticmethod
    def claim_skill(
        db: Session,
        student_id: str,
        skill_name: str,
        category: str = "languages",
        proficiency: str = "Intermediate"
    ) -> Competency:
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise ValueError(f"Student {student_id} not found")

        competency = (
            db.query(Competency)
            .filter(Competency.student_id == student_id, Competency.skill_name == skill_name)
            .first()
        )
        if competency:
            # If already exists, return it; never downgrade a verified or evidence-linked skill
            return competency

        # STRICT RULE: Self-declared / claimed skills must ALWAYS be 'claimed', never 'verified'
        competency = Competency(
            student_id=student_id,
            college_id=student.college_id,
            skill_name=skill_name,
            category=category,
            proficiency=proficiency,
            state="claimed",
            confidence=0.40
        )
        db.add(competency)
        db.commit()
        db.refresh(competency)

        AuditService.log_event(
            db=db,
            college_id=student.college_id,
            actor=student.name,
            action=f"Student claimed skill '{skill_name}' (state: claimed, proficiency: {proficiency})"
        )
        return competency

    @staticmethod
    def delete_evidence(
        db: Session,
        evidence_id: str,
        student_id: str
    ) -> Competency:
        evidence = db.query(Evidence).filter(Evidence.id == evidence_id, Evidence.student_id == student_id).first()
        if not evidence:
            raise ValueError(f"Evidence {evidence_id} not found for student")

        competency = db.query(Competency).filter(Competency.id == evidence.competency_id).first()
        if not competency:
            raise ValueError(f"Competency not found for evidence")

        skill_name = competency.skill_name
        old_state = competency.state
        title = evidence.title

        db.delete(evidence)
        db.flush()

        # Re-evaluate remaining evidence
        remaining_evidence = db.query(Evidence).filter(Evidence.competency_id == competency.id).all()
        kinds = [e.kind for e in remaining_evidence]

        new_state = CompetencyService.evaluate_state(
            current_state=old_state,
            evidence_kinds=kinds,
            has_mentor_signoff=bool(competency.verified_by and "mentor" in kinds)
        )
        competency.state = new_state
        if new_state != "verified":
            competency.verified_by = None
            competency.verification_method = None

        competency.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(competency)

        AuditService.log_event(
            db=db,
            college_id=competency.college_id,
            actor=student_id,
            action=f"Removed evidence '{title}' for {skill_name}: state {old_state} -> {new_state}"
        )
        return competency

    @staticmethod
    def create_mentor_request(
        db: Session,
        student_id: str,
        skill_name: str,
        mentor_name: str,
        evidence_summary: str,
        mentor_email: Optional[str] = None,
        walkthrough_notes: Optional[str] = None
    ) -> MentorVerificationRequest:
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise ValueError(f"Student {student_id} not found")

        competency = (
            db.query(Competency)
            .filter(Competency.student_id == student_id, Competency.skill_name == skill_name)
            .first()
        )
        if not competency:
            raise ValueError(f"Competency {skill_name} not found")

        # Create verification request
        req = MentorVerificationRequest(
            college_id=student.college_id,
            student_id=student_id,
            competency_id=competency.id,
            skill_name=skill_name,
            mentor_name=mentor_name,
            mentor_email=mentor_email,
            evidence_summary=evidence_summary,
            walkthrough_notes=walkthrough_notes,
            status="pending"
        )
        db.add(req)
        db.commit()
        db.refresh(req)

        AuditService.log_event(
            db=db,
            college_id=student.college_id,
            actor=student.name,
            action=f"Created mentor verification request for {skill_name} assigned to {mentor_name}"
        )
        return req

    @staticmethod
    def adjudicate_mentor_request(
        db: Session,
        request_id: str,
        mentor_name: str,
        approved: bool,
        rejection_reason: Optional[str] = None,
        notes: Optional[str] = None
    ) -> MentorVerificationRequest:
        req = db.query(MentorVerificationRequest).filter(MentorVerificationRequest.id == request_id).first()
        if not req:
            raise ValueError(f"Mentor request {request_id} not found")

        competency = db.query(Competency).filter(Competency.id == req.competency_id).first()
        if not competency:
            raise ValueError(f"Competency for request not found")

        now = datetime.utcnow()
        req.reviewed_by = mentor_name
        req.reviewed_at = now

        if approved:
            req.status = "approved"
            old_state = competency.state
            competency.state = "verified"
            competency.verified_by = mentor_name
            competency.verification_method = "mentor_walkthrough"
            competency.verified_at = now
            competency.confidence = 0.98
            competency.expires_at = now + timedelta(days=365)
            competency.updated_at = now

            # Also attach formal mentor verification evidence
            evidence_item = Evidence(
                student_id=req.student_id,
                college_id=req.college_id,
                competency_id=competency.id,
                kind="mentor",
                title=f"Authorized Mentor Verification: {mentor_name}",
                ref_url=f"https://proofhire.internal/verify/mentor/{req.id}",
                confidence=0.98,
                extra_metadata={"notes": notes, "reviewer": mentor_name}
            )
            db.add(evidence_item)
            action_desc = f"Mentor {mentor_name} APPROVED verification for {req.skill_name}: {old_state} -> verified"
        else:
            req.status = "rejected"
            req.rejection_reason = rejection_reason or "Insufficient practical walkthrough depth"
            action_desc = f"Mentor {mentor_name} REJECTED verification for {req.skill_name}: {req.rejection_reason}"

        db.commit()
        db.refresh(req)

        AuditService.log_event(
            db=db,
            college_id=req.college_id,
            actor=mentor_name,
            action=action_desc
        )
        return req
