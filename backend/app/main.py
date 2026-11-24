import os
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.app.config import settings
from backend.app.database import get_db, engine, Base
from backend.app.seed import seed_database
from backend.app.routers import (
    auth_router,
    competencies_router,
    assessments_router,
    readiness_router,
    learning_router,
    eligibility_router,
    companies_router,
    recruiter_router,
    officer_router,
    university_router,
    audit_router,
    student_router
)
from backend.app.services.competency_service import CompetencyService
from backend.app.services.eligibility_service import EligibilityService
from backend.app.services.fairness_service import FairnessService
from backend.app.services.audit_service import AuditService
from backend.app.services.github_service import GitHubService

# Create database tables and seed
Base.metadata.create_all(bind=engine)
seed_database()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Evidence-Based Talent Intelligence and Placement Ecosystem"
)

# Enable CORS for frontend interactions
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register modular API routers under /api
app.include_router(auth_router, prefix="/api")
app.include_router(competencies_router, prefix="/api")
app.include_router(assessments_router, prefix="/api")
app.include_router(readiness_router, prefix="/api")
app.include_router(learning_router, prefix="/api")
app.include_router(eligibility_router, prefix="/api")
app.include_router(companies_router, prefix="/api")
app.include_router(recruiter_router, prefix="/api")
app.include_router(officer_router, prefix="/api")
app.include_router(university_router, prefix="/api")
app.include_router(audit_router, prefix="/api")
app.include_router(student_router, prefix="/api")

@app.get("/api/health")
def api_health():
    return {
        "status": "healthy",
        "platform": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": "connected"
    }

# Mount prototype directory for legacy browser preview
frontend_proto_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend-prototype"))
if os.path.exists(frontend_proto_dir):
    app.mount("/app", StaticFiles(directory=frontend_proto_dir, html=True), name="prototype")

@app.get("/")
def root():
    # Redirect root to /app/ if prototype exists, else return API status
    if os.path.exists(frontend_proto_dir):
        return RedirectResponse(url="/app/")
    return {
        "platform": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "operational",
        "docs_url": "/docs"
    }

# -------------------------------------------------------------
# Backwards-compatible endpoints matching original starter
# -------------------------------------------------------------
class EvidencePayload(BaseModel):
    student_id: str = "student-rahul-01"
    skill: str
    kind: str          # commit | cert | test | mentor | walkthrough
    ref: str           # repo URL, test id, mentor id

@app.post("/evidence")
def legacy_add_evidence(e: EvidencePayload, db: Session = Depends(get_db)):
    comp = CompetencyService.add_evidence(
        db=db,
        student_id=e.student_id,
        skill_name=e.skill,
        kind=e.kind,
        title=f"Evidence: {e.kind}",
        ref_url=e.ref
    )
    return {
        "skill": comp.skill_name,
        "state": comp.state,
        "confidence": comp.confidence,
        "verified_by": comp.verified_by
    }

@app.get("/github/{username}/scan")
async def legacy_scan_github(username: str, student_id: str = "student-rahul-01", db: Session = Depends(get_db)):
    return await GitHubService.scan_and_link(db, student_id, username)

class CheckPayload(BaseModel):
    rules: dict       # {"version":3,"min_cgpa":7,"max_backlogs":0,"required_skills":["SQL"]}
    student: dict     # {"cgpa":7.8,"backlogs":1,"verified_skills":["Python"]}

@app.post("/eligibility")
def legacy_eligibility(c: CheckPayload, db: Session = Depends(get_db)):
    return EligibilityService.evaluate_eligibility(
        db=db,
        rules=c.rules,
        student_data=c.student,
        student_id="student-rahul-01",
        college_id="COLLEGE-A"
    )

@app.post("/fairness")
def legacy_fairness(rates: dict[str, float]):
    return FairnessService.calculate_disparate_impact(rates)["groups"]

@app.get("/audit")
def legacy_audit(college_id: str = "COLLEGE-A", db: Session = Depends(get_db)):
    is_intact, entries = AuditService.verify_chain(db, college_id)
    return {
        "intact": is_intact,
        "entries": [
            {
                "actor": e.actor,
                "action": e.action,
                "ts": e.created_at.isoformat() if e.created_at else "",
                "prev": e.prev_hash,
                "hash": e.hash
            }
            for e in entries
        ]
    }
