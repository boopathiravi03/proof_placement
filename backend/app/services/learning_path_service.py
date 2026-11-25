import os
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from backend.app.models.models import (
    Student,
    LearningPath,
    LearningTask,
    LearningResource,
    SkillPrerequisite,
    TaskSubmission,
    LearningEvent,
    RecommendationLog,
    Competency,
    Evidence,
    AssessmentAttempt,
)
from backend.app.services.skill_gap_service import SkillGapService, ROLE_COMPETENCY_REQUIREMENTS
from backend.app.services.competency_service import CompetencyService
from backend.app.services.readiness_service import ReadinessService
from backend.app.services.audit_service import AuditService

# Verified, official external learning resources (no fabricated URLs)
VERIFIED_DEFAULT_RESOURCES: List[Dict[str, str]] = [
    {"title": "PostgreSQL Official Documentation: Queries & Joins", "provider": "PostgreSQL Global Development Group", "url": "https://www.postgresql.org/docs/current/queries.html", "resource_type": "documentation", "skill_name": "SQL"},
    {"title": "SQLBolt Interactive SQL Lessons", "provider": "SQLBolt", "url": "https://sqlbolt.com/", "resource_type": "practice", "skill_name": "SQL"},
    {"title": "The Python Tutorial (Official Docs)", "provider": "Python Software Foundation", "url": "https://docs.python.org/3/tutorial/", "resource_type": "documentation", "skill_name": "Python"},
    {"title": "FastAPI Official User Guide", "provider": "Tiangolo / FastAPI", "url": "https://fastapi.tiangolo.com/tutorial/", "resource_type": "documentation", "skill_name": "REST APIs"},
    {"title": "PostgreSQL Data Definition & Normalization Docs", "provider": "PostgreSQL", "url": "https://www.postgresql.org/docs/current/ddl.html", "resource_type": "documentation", "skill_name": "Database Design"},
    {"title": "Pro Git Book (Official Reference)", "provider": "Git SCM", "url": "https://git-scm.com/book/en/v2", "resource_type": "documentation", "skill_name": "Git"},
    {"title": "Docker Get Started Guide", "provider": "Docker Inc.", "url": "https://docs.docker.com/get-started/", "resource_type": "tutorial", "skill_name": "Docker"},
    {"title": "Pytest Official Documentation", "provider": "Pytest", "url": "https://docs.pytest.org/en/stable/", "resource_type": "documentation", "skill_name": "Testing"},
    {"title": "OAuth 2.0 & JWT Security Best Practices (FastAPI)", "provider": "FastAPI", "url": "https://fastapi.tiangolo.com/tutorial/security/", "resource_type": "tutorial", "skill_name": "Authentication"},
    {"title": "MDN Web Docs: JavaScript Guide", "provider": "Mozilla MDN", "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide", "resource_type": "documentation", "skill_name": "JavaScript"},
    {"title": "TypeScript Handbook", "provider": "Microsoft TypeScript", "url": "https://www.typescriptlang.org/docs/handbook/intro.html", "resource_type": "documentation", "skill_name": "TypeScript"},
    {"title": "React Official Learn Guide", "provider": "Meta React", "url": "https://react.dev/learn", "resource_type": "tutorial", "skill_name": "React"},
    {"title": "MDN Web Development Overview", "provider": "Mozilla MDN", "url": "https://developer.mozilla.org/en-US/docs/Learn", "resource_type": "documentation", "skill_name": "Web Development"},
    {"title": "Visualizing Algorithms & Data Structures", "provider": "VisuAlgo", "url": "https://visualgo.net/en", "resource_type": "practice", "skill_name": "DSA"},
    {"title": "Oracle Java SE Tutorials", "provider": "Oracle", "url": "https://docs.oracle.com/javase/tutorial/", "resource_type": "documentation", "skill_name": "Java"},
    {"title": "Operating Systems: Three Easy Pieces", "provider": "OSTEP", "url": "https://pages.cs.wisc.edu/~remzi/OSTEP/", "resource_type": "documentation", "skill_name": "Operating Systems"},
    {"title": "Cloudflare Learning Center: Computer Networking", "provider": "Cloudflare", "url": "https://www.cloudflare.com/learning/network-layer/what-is-the-network-layer/", "resource_type": "documentation", "skill_name": "Computer Networks"},
]

DEFAULT_PREREQUISITES: List[tuple[str, str]] = [
    ("REST APIs", "Python"),
    ("Database Design", "SQL"),
    ("Authentication", "REST APIs"),
    ("Docker", "Git"),
    ("Testing", "Python"),
    ("TypeScript", "JavaScript"),
    ("React", "JavaScript"),
    ("DSA", "Python"),
]

# Deterministic task templates mapped by skill and gap_status
TASK_TEMPLATES: Dict[str, Dict[str, Any]] = {
    "SQL": {
        "title": "Complete SQL Query & Join Exercises",
        "task_type": "sql_exercises",
        "estimated_minutes": 60,
        "difficulty": "Intermediate",
        "learning_objective": "Master multi-table JOINs, GROUP BY aggregations, window functions, and query filtering.",
        "practical_activity": "Solve 5 relational query problems using ProofHire's in-memory SQL sandbox (employees, departments, projects).",
        "expected_deliverable": "SQL query solution script or GitHub Gist URL.",
        "completion_criteria": "Submit SQL exercise solutions and pass the DBMS adaptive reassessment (>= 60%).",
        "recommended_reassessment": "DBMS",
    },
    "Python": {
        "title": "Python Core Functions & Data Processing Practice",
        "task_type": "coding_practice",
        "estimated_minutes": 60,
        "difficulty": "Intermediate",
        "learning_objective": "Write clean, well-typed Python functions handling edge cases and collections.",
        "practical_activity": "Implement string/list algorithms and run unit test assertions in a repository.",
        "expected_deliverable": "GitHub repository URL containing Python solutions and tests.",
        "completion_criteria": "Submit code repository and pass Programming adaptive assessment.",
        "recommended_reassessment": "Programming",
    },
    "REST APIs": {
        "title": "Build a REST API using FastAPI",
        "task_type": "mini_project",
        "estimated_minutes": 120,
        "difficulty": "Intermediate",
        "learning_objective": "Design and implement typed CRUD endpoints with Pydantic validation and proper HTTP status codes.",
        "practical_activity": "Build a 4-endpoint FastAPI service with request/response schemas and OpenAPI docs.",
        "expected_deliverable": "GitHub repository URL with README and API endpoints.",
        "completion_criteria": "Submit repository URL as evidence; transitions REST APIs to Evidence-linked.",
        "recommended_reassessment": "Web Development",
    },
    "Database Design": {
        "title": "Design a Normalized Relational Database Schema",
        "task_type": "mini_project",
        "estimated_minutes": 90,
        "difficulty": "Intermediate",
        "learning_objective": "Apply 3NF normalization, foreign key constraints, and B-Tree indexing strategies.",
        "practical_activity": "Create an ER diagram and SQL DDL script for a campus placement or library system.",
        "expected_deliverable": "SQL schema file or repository URL.",
        "completion_criteria": "Submit DDL schema artifact for mentor/officer review.",
        "recommended_reassessment": "DBMS",
    },
    "Authentication": {
        "title": "Implement JWT Authentication & RBAC Middleware",
        "task_type": "coding_practice",
        "estimated_minutes": 90,
        "difficulty": "Intermediate",
        "learning_objective": "Secure API routes using password hashing, signed JWT tokens, and role checks.",
        "practical_activity": "Add login, token verification, and role-based route guards to an API project.",
        "expected_deliverable": "GitHub commit/PR URL demonstrating auth middleware.",
        "completion_criteria": "Submit PR/repo URL; enters Evidence-linked state.",
        "recommended_reassessment": "Web Development",
    },
    "Testing": {
        "title": "Write Automated API & Unit Tests",
        "task_type": "debugging",
        "estimated_minutes": 60,
        "difficulty": "Intermediate",
        "learning_objective": "Verify edge cases, error handling, and authorization boundaries via automated tests.",
        "practical_activity": "Write at least 5 unit/integration tests covering happy paths and failure cases.",
        "expected_deliverable": "Test suite repository URL or CI output log.",
        "completion_criteria": "Submit test suite evidence and complete Debugging assessment.",
        "recommended_reassessment": "Debugging",
    },
    "Docker": {
        "title": "Containerize an Application with Multi-Stage Docker Build",
        "task_type": "mini_project",
        "estimated_minutes": 75,
        "difficulty": "Beginner",
        "learning_objective": "Package an application and its dependencies reproducibly using Dockerfiles.",
        "practical_activity": "Write a multi-stage Dockerfile and docker-compose.yml for a backend + database stack.",
        "expected_deliverable": "Repository URL containing Dockerfile and build notes.",
        "completion_criteria": "Submit repository evidence and pass Frameworks & Tools assessment.",
        "recommended_reassessment": "Frameworks & Tools",
    },
    "Git": {
        "title": "Git Branching, Pull Requests & Conflict Resolution Lab",
        "task_type": "concept_learning",
        "estimated_minutes": 45,
        "difficulty": "Beginner",
        "learning_objective": "Collaborate cleanly with feature branches, atomic commits, and merge conflict resolution.",
        "practical_activity": "Create a feature branch, open a pull request, and resolve a simulated merge conflict.",
        "expected_deliverable": "GitHub PR or repository link.",
        "completion_criteria": "Link Git repository artifact.",
        "recommended_reassessment": "Frameworks & Tools",
    },
    "DSA": {
        "title": "Solve Core Data Structures & Dynamic Programming Problems",
        "task_type": "coding_practice",
        "estimated_minutes": 90,
        "difficulty": "Intermediate",
        "learning_objective": "Analyze time/space complexity and implement optimal hash map, tree, and DP solutions.",
        "practical_activity": "Complete 3 algorithmic problems in ProofHire's Python sandbox.",
        "expected_deliverable": "Repository or sandbox completion record.",
        "completion_criteria": "Pass DSA adaptive assessment (>= 60%).",
        "recommended_reassessment": "DSA",
    },
    "JavaScript": {
        "title": "Modern JavaScript Async & DOM Manipulation Exercises",
        "task_type": "coding_practice",
        "estimated_minutes": 60,
        "difficulty": "Intermediate",
        "learning_objective": "Master Promises, async/await, closures, and event handling.",
        "practical_activity": "Build a fetch-driven interactive widget with error and loading states.",
        "expected_deliverable": "GitHub repository URL.",
        "completion_criteria": "Submit repository URL and complete Web Development assessment.",
        "recommended_reassessment": "Web Development",
    },
    "TypeScript": {
        "title": "Add Strict TypeScript Interfaces to a Frontend App",
        "task_type": "concept_learning",
        "estimated_minutes": 60,
        "difficulty": "Intermediate",
        "learning_objective": "Eliminate runtime type bugs using interfaces, generics, and discriminated unions.",
        "practical_activity": "Convert an untyped JS module to strict TypeScript (`tsc --noEmit`).",
        "expected_deliverable": "Repository link showing typed components.",
        "completion_criteria": "Submit repository artifact.",
        "recommended_reassessment": "Web Development",
    },
    "React": {
        "title": "Build a Stateful React Component Dashboard",
        "task_type": "mini_project",
        "estimated_minutes": 120,
        "difficulty": "Intermediate",
        "learning_objective": "Architect reusable hooks, controlled forms, and responsive state transitions.",
        "practical_activity": "Create a filterable data table and detail modal in React.",
        "expected_deliverable": "GitHub repository URL.",
        "completion_criteria": "Submit repository artifact for review.",
        "recommended_reassessment": "Web Development",
    },
    "Web Development": {
        "title": "HTTP, CORS & REST Architecture Mastery",
        "task_type": "documentation",
        "estimated_minutes": 45,
        "difficulty": "Intermediate",
        "learning_objective": "Understand browser security headers, CORS preflight, and REST semantics.",
        "practical_activity": "Document and test an API integration with proper error handling.",
        "expected_deliverable": "Technical notes or repository URL.",
        "completion_criteria": "Pass Web Development adaptive assessment.",
        "recommended_reassessment": "Web Development",
    },
    "Java": {
        "title": "Java OOP, Collections & Concurrency Practice",
        "task_type": "coding_practice",
        "estimated_minutes": 90,
        "difficulty": "Intermediate",
        "learning_objective": "Apply Java generics, Streams API, and exception hierarchies.",
        "practical_activity": "Implement a thread-safe task queue or inventory service in Java.",
        "expected_deliverable": "GitHub repository URL.",
        "completion_criteria": "Submit repository artifact.",
        "recommended_reassessment": "Programming",
    },
    "Aptitude": {
        "title": "Quantitative, Logical & Verbal Timed Drills",
        "task_type": "aptitude_practice",
        "estimated_minutes": 45,
        "difficulty": "Intermediate",
        "learning_objective": "Improve speed and accuracy on placement screening aptitude sections.",
        "practical_activity": "Complete timed quantitative and logical reasoning sets.",
        "expected_deliverable": "Assessment completion record.",
        "completion_criteria": "Pass Aptitude adaptive assessment (>= 60%).",
        "recommended_reassessment": "Aptitude",
    },
    "Operating Systems": {
        "title": "Process Scheduling, Deadlocks & Virtual Memory Review",
        "task_type": "concept_learning",
        "estimated_minutes": 60,
        "difficulty": "Intermediate",
        "learning_objective": "Analyze Coffman deadlock conditions, CPU scheduling, and paging.",
        "practical_activity": "Complete OS conceptual walkthroughs and diagnostic quiz.",
        "expected_deliverable": "Assessment completion record.",
        "completion_criteria": "Pass Operating Systems adaptive assessment.",
        "recommended_reassessment": "Operating Systems",
    },
    "Computer Networks": {
        "title": "TCP/IP, TLS Handshake & CIDR Subnetting Lab",
        "task_type": "concept_learning",
        "estimated_minutes": 60,
        "difficulty": "Intermediate",
        "learning_objective": "Trace OSI layers, TLS 1.3 key exchange, and subnet host calculations.",
        "practical_activity": "Solve 5 CIDR subnetting exercises and trace an HTTPS request.",
        "expected_deliverable": "Notes URL or assessment record.",
        "completion_criteria": "Pass Computer Networks adaptive assessment.",
        "recommended_reassessment": "Computer Networks",
    },
}

ROLE_PROJECTS: Dict[str, List[Dict[str, Any]]] = {
    "Backend Developer": [
        {
            "title": "Multi-Tenant Placement API with Role-Based Access & PostgreSQL",
            "description": "Design and build a secure backend service supporting student profiles, versioned eligibility checks, and hash-chained audit logs.",
            "skills_covered": ["Python", "SQL", "REST APIs", "Database Design", "Authentication", "Testing"],
            "expected_features": ["Normalized 3NF SQL schema", "FastAPI CRUD + Pydantic validation", "JWT RBAC middleware", "Pytest integration tests"],
            "suggested_technology": "Python, FastAPI, PostgreSQL/SQLite, Pytest, Docker",
            "deliverables": "Public GitHub repository with README, schema.sql, and passing test output",
            "evaluation_criteria": "Schema normalization, API error handling, RBAC enforcement, and >=80% test coverage. Note: Project submission produces Evidence-linked status; verification requires mentor review or assessment.",
        },
    ],
    "Frontend Developer": [
        {
            "title": "Interactive Competency & Analytics Dashboard",
            "description": "Build a responsive, accessible dashboard with filterable data tables, chart visualizations, and validated multi-step forms.",
            "skills_covered": ["JavaScript", "TypeScript", "React", "Web Development", "Git", "Testing"],
            "expected_features": ["Strict TypeScript types", "Accessible keyboard navigation", "Loading/error/empty states", "Component unit tests"],
            "suggested_technology": "Next.js, React, TypeScript, Tailwind CSS",
            "deliverables": "GitHub repository URL and deployed preview or screenshots",
            "evaluation_criteria": "Component modularity, type safety, responsiveness, and clean state management. Project completion produces Evidence-linked status.",
        },
    ],
    "Data Analyst": [
        {
            "title": "Cohort Placement & Skill-Gap Telemetry Pipeline",
            "description": "Analyze multi-table placement datasets using advanced SQL window functions and Python data processing to surface actionable insights.",
            "skills_covered": ["SQL", "Python", "Database Design", "Aptitude"],
            "expected_features": ["CTE & window function SQL queries", "Data cleaning & anomaly checks", "Cohort summary metrics"],
            "suggested_technology": "PostgreSQL/SQLite, Python, Pandas",
            "deliverables": "SQL script collection + Python analysis notebook in GitHub",
            "evaluation_criteria": "Query accuracy, clear metric definitions, and reproducible scripts.",
        },
    ],
}


class RecommendationValidationLayer:
    """
    Validates any generated/AI-assisted learning recommendations before saving or showing to students.
    """
    @staticmethod
    def validate_recommendations(
        candidate_tasks: List[Dict[str, Any]],
        identified_gaps: List[Dict[str, Any]],
        prerequisite_map: Dict[str, List[str]],
    ) -> tuple[List[Dict[str, Any]], bool, str]:
        gap_skills = {
            g["skill_name"].lower(): g
            for g in identified_gaps
            if g["gap_status"] != "meets_requirement"
        }
        valid_taxonomy = {g["skill_name"].lower() for g in identified_gaps}

        validated: List[Dict[str, Any]] = []
        seen_keys = set()
        notes: List[str] = []

        for task in candidate_tasks:
            skill_key = (task.get("skill") or "").strip().lower()
            # Rule 1: Must map to real skill in role/taxonomy
            if skill_key not in valid_taxonomy:
                notes.append(f"Rejected task '{task.get('title')}': skill '{task.get('skill')}' not in target taxonomy.")
                continue
            # Rule 2: Must address an actual identified gap
            if skill_key not in gap_skills:
                notes.append(f"Skipped task for '{task.get('skill')}': student already meets requirement.")
                continue
            # Rule 3: Prevent duplicate tasks
            dedup_key = (skill_key, (task.get("title") or "").strip().lower())
            if dedup_key in seen_keys:
                notes.append(f"Deduplicated task '{task.get('title')}'.")
                continue
            seen_keys.add(dedup_key)

            # Rule 4: Never promise auto-verification or fake certification
            criteria = task.get("completion_criteria") or ""
            if "auto-verified" in criteria.lower() or "instant certificate" in criteria.lower():
                task["completion_criteria"] = "Submit evidence for review and complete validated reassessment."

            validated.append(task)

        # Rule 5: Respect prerequisites via topological priority ordering
        # If skill B has prerequisite A (and A is also in validated), A must appear before B
        skill_rank = {t["skill"].lower(): i for i, t in enumerate(validated)}
        ordered = list(validated)
        for _ in range(len(ordered)):
            swapped = False
            for idx in range(len(ordered)):
                sk = ordered[idx]["skill"].lower()
                prereqs = [p.lower() for p in prerequisite_map.get(sk, [])]
                for p in prereqs:
                    for j in range(idx + 1, len(ordered)):
                        if ordered[j]["skill"].lower() == p:
                            ordered[idx], ordered[j] = ordered[j], ordered[idx]
                            swapped = True
                            break
                    if swapped:
                        break
                if swapped:
                    break
            if not swapped:
                break

        validation_ok = len(ordered) > 0 or len(gap_skills) == 0
        summary_note = "; ".join(notes) if notes else "All recommendations validated against taxonomy, real gaps, and prerequisites."
        return ordered, validation_ok, summary_note


class LearningPathService:
    @staticmethod
    def seed_defaults(db: Session) -> None:
        if not db.query(LearningResource).first():
            for res in VERIFIED_DEFAULT_RESOURCES:
                db.add(
                    LearningResource(
                        title=res["title"],
                        provider=res["provider"],
                        url=res["url"],
                        resource_type=res["resource_type"],
                        skill_name=res["skill_name"],
                        is_verified=True,
                        is_external=True,
                        approved_by="ProofHire Curriculum Board",
                    )
                )
        if not db.query(SkillPrerequisite).first():
            for sk, pre in DEFAULT_PREREQUISITES:
                db.add(SkillPrerequisite(skill_name=sk, prerequisite_skill=pre))
        db.commit()

    @staticmethod
    def _build_deterministic_tasks(
        db: Session,
        gaps: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        resources = (
            db.query(LearningResource)
            .filter(LearningResource.soft_deleted == False, LearningResource.is_verified == True)
            .all()
        )
        res_by_skill: Dict[str, List[str]] = {}
        for r in resources:
            res_by_skill.setdefault(r.skill_name.lower(), []).append(r.id)

        tasks: List[Dict[str, Any]] = []
        for g in gaps:
            if g["gap_status"] == "meets_requirement":
                continue
            skill = g["skill_name"]
            tmpl = TASK_TEMPLATES.get(skill, {
                "title": f"Close Competency Gap in {skill}",
                "task_type": "concept_learning",
                "estimated_minutes": 60,
                "difficulty": g["required_proficiency"],
                "learning_objective": f"Achieve {g['required_proficiency']} proficiency in {skill}.",
                "practical_activity": f"Complete structured exercises and build a practical artifact demonstrating {skill}.",
                "expected_deliverable": "Repository URL or documented work artifact.",
                "completion_criteria": f"Submit evidence artifact and pass {skill} reassessment if available.",
                "recommended_reassessment": skill,
            })

            # Tailor description to explain why the task is recommended
            desc = f"{g['explanation']} Activity: {tmpl['practical_activity']}"
            tasks.append({
                "title": tmpl["title"],
                "description": desc,
                "skill": skill,
                "learning_objective": tmpl["learning_objective"],
                "priority": g["priority"],
                "estimated_minutes": tmpl["estimated_minutes"],
                "difficulty": tmpl["difficulty"],
                "task_type": tmpl["task_type"],
                "prerequisites": g.get("prerequisites", []),
                "practical_activity": tmpl["practical_activity"],
                "expected_deliverable": tmpl["expected_deliverable"],
                "completion_criteria": tmpl["completion_criteria"],
                "recommended_reassessment": tmpl["recommended_reassessment"],
                "resource_ids": res_by_skill.get(skill.lower(), []),
            })
        return tasks

    @staticmethod
    def _format_task(db: Session, task: LearningTask) -> Dict[str, Any]:
        res_objs = []
        if task.resource_ids:
            res_objs = (
                db.query(LearningResource)
                .filter(LearningResource.id.in_(task.resource_ids), LearningResource.soft_deleted == False)
                .all()
            )
        return {
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "skill": task.skill,
            "learning_objective": task.learning_objective,
            "priority": task.priority,
            "estimated_minutes": task.estimated_minutes,
            "difficulty": task.difficulty,
            "task_type": task.task_type,
            "prerequisites": task.prerequisites or [],
            "practical_activity": task.practical_activity,
            "expected_deliverable": task.expected_deliverable,
            "completion_criteria": task.completion_criteria,
            "recommended_reassessment": task.recommended_reassessment,
            "status": task.status,
            "time_spent_minutes": task.time_spent_minutes,
            "task_order": task.task_order,
            "completed": task.completed,
            "completed_at": task.completed_at.isoformat() if task.completed_at else None,
            "resources": [
                {
                    "id": r.id,
                    "title": r.title,
                    "provider": r.provider,
                    "url": r.url,
                    "resource_type": r.resource_type,
                    "is_verified": r.is_verified,
                    "is_external": r.is_external,
                    "source_label": "External Verified Resource" if r.is_external else "ProofHire Curated",
                }
                for r in res_objs
            ],
        }

    @staticmethod
    def generate_or_get_learning_path(
        db: Session,
        student_id: str,
        target_role: str = "Backend Developer",
        force_regenerate: bool = False,
        ai_candidates: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        LearningPathService.seed_defaults(db)

        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise ValueError(f"Student {student_id} not found")

        role_name = SkillGapService.normalize_role(target_role)
        gap_analysis = SkillGapService.analyze_skill_gaps(db, student_id, role_name, persist=True)
        gaps = gap_analysis["gaps"]
        missing_or_gap_skills = [g["skill_name"] for g in gaps if g["gap_status"] != "meets_requirement"]

        lp = (
            db.query(LearningPath)
            .filter(
                LearningPath.student_id == student_id,
                LearningPath.target_role == role_name,
                LearningPath.soft_deleted == False,
            )
            .first()
        )

        # Readiness snapshot before
        readiness = ReadinessService.calculate_readiness(db, student_id, role_name)
        current_readiness_score = readiness["overall_score"]

        if not lp or force_regenerate or ai_candidates is not None:
            prereq_map = {g["skill_name"].lower(): g.get("prerequisites", []) for g in gaps}
            source = "ai_assisted" if ai_candidates is not None else "deterministic_template"
            candidates = ai_candidates if ai_candidates is not None else LearningPathService._build_deterministic_tasks(db, gaps)

            # Always pass through validation layer; fallback to deterministic if AI candidates produce nothing valid
            validated_tasks, val_ok, val_notes = RecommendationValidationLayer.validate_recommendations(
                candidates, gaps, prereq_map
            )
            if ai_candidates is not None and not validated_tasks and missing_or_gap_skills:
                # Fallback to deterministic templates
                det_candidates = LearningPathService._build_deterministic_tasks(db, gaps)
                validated_tasks, val_ok, det_notes = RecommendationValidationLayer.validate_recommendations(
                    det_candidates, gaps, prereq_map
                )
                val_notes = f"AI output failed validation ({val_notes}); fell back to deterministic templates ({det_notes})."
                source = "deterministic_fallback"

            if not lp:
                lp = LearningPath(
                    student_id=student_id,
                    college_id=student.college_id,
                    target_role=role_name,
                    missing_skills=missing_or_gap_skills,
                    recommendation_version="v2.0-validated",
                    readiness_before=current_readiness_score,
                    readiness_after=current_readiness_score,
                )
                db.add(lp)
                db.flush()
            else:
                lp.missing_skills = missing_or_gap_skills
                lp.readiness_after = current_readiness_score
                lp.updated_at = datetime.utcnow()
                # Soft-delete only incomplete tasks when regenerating so completed evidence is preserved
                for old_t in lp.tasks:
                    if not old_t.completed and old_t.status == "not_started":
                        old_t.soft_deleted = True

            existing_active_titles = {
                (t.skill.lower(), t.title.lower())
                for t in lp.tasks
                if not t.soft_deleted
            }
            next_order = max([t.task_order for t in lp.tasks], default=0) + 1

            for item in validated_tasks:
                key = (item["skill"].lower(), item["title"].lower())
                if key in existing_active_titles:
                    continue
                t = LearningTask(
                    learning_path_id=lp.id,
                    title=item["title"],
                    description=item["description"],
                    skill=item["skill"],
                    learning_objective=item.get("learning_objective"),
                    priority=item.get("priority", "Medium"),
                    estimated_minutes=item.get("estimated_minutes", 45),
                    difficulty=item.get("difficulty", "Intermediate"),
                    task_type=item.get("task_type", "concept_learning"),
                    prerequisites=item.get("prerequisites", []),
                    practical_activity=item.get("practical_activity"),
                    expected_deliverable=item.get("expected_deliverable"),
                    completion_criteria=item.get("completion_criteria"),
                    recommended_reassessment=item.get("recommended_reassessment"),
                    resource_ids=item.get("resource_ids", []),
                    status="not_started",
                    task_order=next_order,
                )
                db.add(t)
                next_order += 1

            db.add(
                RecommendationLog(
                    student_id=student_id,
                    college_id=student.college_id,
                    target_role=role_name,
                    version="v2.0",
                    source=source,
                    input_references={"gap_count": len(missing_or_gap_skills), "readiness_score": current_readiness_score},
                    validation_passed=val_ok,
                    validation_notes=val_notes,
                )
            )
            db.add(
                LearningEvent(
                    student_id=student_id,
                    college_id=student.college_id,
                    learning_path_id=lp.id,
                    event_type="learning_path_generated",
                    details={"target_role": role_name, "source": source, "tasks_count": len(validated_tasks)},
                )
            )
            db.commit()
            db.refresh(lp)

        active_tasks = [t for t in lp.tasks if not t.soft_deleted]
        active_tasks.sort(key=lambda x: x.task_order)
        tasks_dto = [LearningPathService._format_task(db, t) for t in active_tasks]

        return {
            "learning_path_id": lp.id,
            "student_id": student_id,
            "college_id": student.college_id,
            "target_role": lp.target_role,
            "missing_skills": lp.missing_skills,
            "recommendation_version": lp.recommendation_version,
            "readiness_before": lp.readiness_before,
            "readiness_after": current_readiness_score,
            "gap_analysis": gap_analysis,
            "tasks": tasks_dto,
        }

    @staticmethod
    def update_task_progress(
        db: Session,
        task_id: str,
        student_id: str,
        status: str,
        time_spent_minutes: Optional[int] = None,
    ) -> Dict[str, Any]:
        allowed_statuses = {
            "not_started",
            "in_progress",
            "submitted",
            "awaiting_review",
            "completed",
            "reassessment_required",
        }
        if status not in allowed_statuses:
            raise ValueError(f"Invalid task status '{status}'")

        task = db.query(LearningTask).filter(LearningTask.id == task_id, LearningTask.soft_deleted == False).first()
        if not task:
            raise ValueError("Learning task not found")

        lp = db.query(LearningPath).filter(LearningPath.id == task.learning_path_id).first()
        if not lp or lp.student_id != student_id:
            raise PermissionError("Unauthorized: Student does not own this learning task")

        task.status = status
        if status == "completed":
            task.completed = True
            task.completed_at = datetime.utcnow()
        if time_spent_minutes is not None and time_spent_minutes >= 0:
            task.time_spent_minutes = (task.time_spent_minutes or 0) + time_spent_minutes

        db.add(
            LearningEvent(
                student_id=student_id,
                college_id=lp.college_id,
                learning_path_id=lp.id,
                task_id=task.id,
                event_type="task_progress_updated",
                details={"status": status, "time_spent_minutes": time_spent_minutes},
            )
        )
        db.commit()
        db.refresh(task)

        # Note: Task completion alone NEVER sets Competency.state = 'verified'
        return {
            "success": True,
            "task": LearningPathService._format_task(db, task),
            "note": "Progress saved. Competency verification still requires validated evidence and authorized assessment or mentor sign-off.",
        }

    @staticmethod
    def submit_task_evidence(
        db: Session,
        task_id: str,
        student_id: str,
        artifact_type: str,
        artifact_url: str,
        notes: Optional[str] = None,
    ) -> Dict[str, Any]:
        task = db.query(LearningTask).filter(LearningTask.id == task_id, LearningTask.soft_deleted == False).first()
        if not task:
            raise ValueError("Learning task not found")

        lp = db.query(LearningPath).filter(LearningPath.id == task.learning_path_id).first()
        if not lp or lp.student_id != student_id:
            raise PermissionError("Unauthorized: Cannot submit evidence for another student's task")

        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise ValueError("Student not found")

        ev_kind = "repo" if artifact_type in ["repo", "project_url"] else "lab"
        ev_title = f"Learning Task Deliverable: {task.title}"

        # Integrate with Evidence Intelligence Engine -> produces evidence_linked (NEVER verified)
        comp = CompetencyService.add_evidence(
            db=db,
            student_id=student_id,
            skill_name=task.skill,
            kind=ev_kind,
            title=ev_title,
            ref_url=artifact_url,
            confidence=0.75,
            extra_metadata={"task_id": task.id, "artifact_type": artifact_type, "notes": notes or ""},
        )

        # Fetch the created evidence item
        ev = (
            db.query(Evidence)
            .filter(Evidence.competency_id == comp.id, Evidence.ref_url == artifact_url)
            .order_by(Evidence.created_at.desc())
            .first()
        )

        submission = TaskSubmission(
            task_id=task.id,
            student_id=student_id,
            college_id=student.college_id,
            artifact_type=artifact_type,
            artifact_url=artifact_url,
            notes=notes,
            evidence_id=ev.id if ev else None,
            status="awaiting_review",
        )
        db.add(submission)

        task.status = "awaiting_review"
        task.completed = True
        task.completed_at = datetime.utcnow()

        db.add(
            LearningEvent(
                student_id=student_id,
                college_id=student.college_id,
                learning_path_id=lp.id,
                task_id=task.id,
                event_type="task_evidence_submitted",
                details={"submission_id": submission.id, "skill": task.skill, "competency_state": comp.state},
            )
        )
        db.commit()
        db.refresh(submission)

        AuditService.log_event(
            db=db,
            college_id=student.college_id,
            actor=student.name,
            action=f"Submitted evidence for learning task '{task.title}' ({task.skill} -> {comp.state})",
        )

        return {
            "success": True,
            "submission_id": submission.id,
            "evidence_id": submission.evidence_id,
            "competency_state": comp.state,
            "task_status": task.status,
            "recommended_reassessment": task.recommended_reassessment,
            "message": f"Evidence linked for {task.skill} (state: {comp.state}). Verification requires authorized assessment or mentor review.",
        }

    @staticmethod
    def review_task_submission(
        db: Session,
        submission_id: str,
        reviewer_name: str,
        reviewer_role: str,
        reviewer_college_id: Optional[str],
        approved: bool,
        review_notes: str = "",
    ) -> Dict[str, Any]:
        if reviewer_role not in ["officer", "university_admin", "mentor"]:
            raise PermissionError("Unauthorized: Only authorized mentors or placement officers can review task submissions.")

        sub = db.query(TaskSubmission).filter(TaskSubmission.id == submission_id).first()
        if not sub:
            raise ValueError("Task submission not found")

        if reviewer_college_id and sub.college_id != reviewer_college_id:
            raise PermissionError("Tenant isolation violation: Cannot review submission from another college.")

        sub.status = "approved" if approved else "rejected"
        sub.reviewed_by = reviewer_name
        sub.review_notes = review_notes
        sub.reviewed_at = datetime.utcnow()

        task = db.query(LearningTask).filter(LearningTask.id == sub.task_id).first()
        if task:
            task.status = "reassessment_required" if approved and task.recommended_reassessment else ("completed" if approved else "in_progress")

        db.commit()

        AuditService.log_event(
            db=db,
            college_id=sub.college_id,
            actor=reviewer_name,
            action=f"{'Approved' if approved else 'Rejected'} learning task submission {sub.id}",
        )

        return {
            "submission_id": sub.id,
            "status": sub.status,
            "reviewed_by": reviewer_name,
            "task_status": task.status if task else None,
        }

    @staticmethod
    def get_recommended_projects(target_role: str = "Backend Developer") -> List[Dict[str, Any]]:
        role_name = SkillGapService.normalize_role(target_role)
        return ROLE_PROJECTS.get(role_name, ROLE_PROJECTS["Backend Developer"])

    @staticmethod
    def get_learning_progress(
        db: Session,
        student_id: str,
        target_role: str = "Backend Developer",
    ) -> Dict[str, Any]:
        role_name = SkillGapService.normalize_role(target_role)
        lp = (
            db.query(LearningPath)
            .filter(
                LearningPath.student_id == student_id,
                LearningPath.target_role == role_name,
                LearningPath.soft_deleted == False,
            )
            .first()
        )
        tasks = [t for t in lp.tasks if not t.soft_deleted] if lp else []
        completed_tasks = [t for t in tasks if t.completed or t.status in ["completed", "submitted", "awaiting_review"]]
        pending_tasks = [t for t in tasks if t not in completed_tasks]

        # Only sum genuinely tracked time (never fabricate)
        tracked_minutes = sum(t.time_spent_minutes for t in tasks if t.time_spent_minutes is not None)
        has_tracked_time = any(t.time_spent_minutes is not None for t in tasks)

        submissions = (
            db.query(TaskSubmission)
            .filter(TaskSubmission.student_id == student_id)
            .order_by(TaskSubmission.created_at.desc())
            .all()
        )

        # Before-and-after assessment comparison by skill
        attempts = (
            db.query(AssessmentAttempt)
            .filter(AssessmentAttempt.student_id == student_id)
            .order_by(AssessmentAttempt.created_at.asc())
            .all()
        )
        skill_progression: Dict[str, Dict[str, Any]] = {}
        for att in attempts:
            cat = att.category
            pct = round((att.score / max(att.total_questions, 1)) * 100.0, 1)
            if cat not in skill_progression:
                skill_progression[cat] = {
                    "skill": cat,
                    "initial_score_pct": pct,
                    "latest_score_pct": pct,
                    "attempts_count": 1,
                    "delta_pct": 0.0,
                }
            else:
                skill_progression[cat]["latest_score_pct"] = pct
                skill_progression[cat]["attempts_count"] += 1
                skill_progression[cat]["delta_pct"] = round(
                    pct - skill_progression[cat]["initial_score_pct"], 1
                )

        # Current readiness vs initial readiness
        current_readiness = ReadinessService.calculate_readiness(db, student_id, role_name)
        gap_analysis = SkillGapService.analyze_skill_gaps(db, student_id, role_name, persist=False)

        skills_meeting = [g["skill_name"] for g in gap_analysis["gaps"] if g["gap_status"] == "meets_requirement"]
        remaining_gaps = [g["skill_name"] for g in gap_analysis["gaps"] if g["gap_status"] != "meets_requirement"]
        needs_verification = [
            g["skill_name"]
            for g in gap_analysis["gaps"]
            if g["gap_status"] in ["evidence_required", "assessment_required", "reassessment_recommended"]
        ]

        return {
            "student_id": student_id,
            "target_role": role_name,
            "completed_tasks_count": len(completed_tasks),
            "pending_tasks_count": len(pending_tasks),
            "total_tasks_count": len(tasks),
            "tracked_time_minutes": tracked_minutes if has_tracked_time else None,
            "submissions_count": len(submissions),
            "readiness_before": lp.readiness_before if lp and lp.readiness_before is not None else current_readiness["overall_score"],
            "readiness_current": current_readiness["overall_score"],
            "before_after_assessments": list(skill_progression.values()),
            "skills_meeting_requirement": skills_meeting,
            "remaining_gaps": remaining_gaps,
            "skills_needing_verification": needs_verification,
        }

    # --- Admin Learning Resource Management ---
    @staticmethod
    def list_resources(db: Session, skill_name: Optional[str] = None) -> List[Dict[str, Any]]:
        LearningPathService.seed_defaults(db)
        q = db.query(LearningResource).filter(LearningResource.soft_deleted == False)
        if skill_name:
            q = q.filter(LearningResource.skill_name.ilike(skill_name))
        return [
            {
                "id": r.id,
                "title": r.title,
                "provider": r.provider,
                "url": r.url,
                "resource_type": r.resource_type,
                "skill_name": r.skill_name,
                "is_verified": r.is_verified,
                "is_external": r.is_external,
                "approved_by": r.approved_by,
            }
            for r in q.all()
        ]

    @staticmethod
    def add_resource(
        db: Session,
        title: str,
        provider: str,
        url: str,
        resource_type: str,
        skill_name: str,
        actor_role: str,
        actor_name: str,
    ) -> LearningResource:
        if actor_role not in ["officer", "university_admin"]:
            raise PermissionError("Only administrators or placement officers can add verified learning resources.")
        if not url.startswith("https://") and not url.startswith("http://"):
            raise ValueError("Resource URL must be a valid HTTP/HTTPS URL.")
        res = LearningResource(
            title=title,
            provider=provider,
            url=url,
            resource_type=resource_type,
            skill_name=skill_name,
            is_verified=True,
            is_external=True,
            approved_by=actor_name,
        )
        db.add(res)
        db.commit()
        db.refresh(res)
        return res

    @staticmethod
    def remove_resource(db: Session, resource_id: str, actor_role: str) -> Dict[str, Any]:
        if actor_role not in ["officer", "university_admin"]:
            raise PermissionError("Only administrators or placement officers can remove learning resources.")
        res = db.query(LearningResource).filter(LearningResource.id == resource_id).first()
        if not res:
            raise ValueError("Resource not found")
        res.soft_deleted = True
        db.commit()
        return {"deleted": True, "resource_id": resource_id}
