from sqlalchemy.orm import Session
from backend.app.database import engine, Base, SessionLocal
from backend.app.models.models import (
    College, Department, User, Student, Competency, Evidence,
    Company, JobRole, PlacementDrive, QuestionBank, Application,
    Approval, LearningPath, LearningTask
)
from backend.app.services.audit_service import AuditService

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Check if already seeded
        if db.query(College).first():
            return

        print("Seeding ProofHire 2.0 database...")

        # 1. Colleges
        col_a = College(id="COLLEGE-A", code="COL-A", name="Apex Engineering Institute (College A)", city="Bengaluru", state="Karnataka")
        col_b = College(id="COLLEGE-B", code="COL-B", name="Beacon Technology Campus (College B)", city="Pune", state="Maharashtra")
        db.add_all([col_a, col_b])
        db.flush()

        # 2. Question Bank (SQL, Aptitude, Python, DSA, Git across Levels 1, 2, 3)
        questions = [
            # SQL Level 1
            QuestionBank(
                category="SQL",
                question="Which clause filters rows before grouping occurs in a SELECT query?",
                options=["WHERE", "ORDER BY", "HAVING", "GROUP BY"],
                correct_option_index=0,
                difficulty_level=1,
                explanation="The WHERE clause filters individual rows before any grouping or aggregate functions are calculated."
            ),
            QuestionBank(
                category="SQL",
                question="Which keyword eliminates duplicate records from a query result set?",
                options=["UNIQUE", "DISTINCT", "DROP", "FILTER"],
                correct_option_index=1,
                difficulty_level=1,
                explanation="SELECT DISTINCT suppresses duplicate rows from the final projection."
            ),
            # SQL Level 2
            QuestionBank(
                category="SQL",
                question="Which JOIN returns all rows from the left table regardless of matching rows in the right table?",
                options=["INNER JOIN", "LEFT JOIN", "CROSS JOIN", "FULL OUTER JOIN"],
                correct_option_index=1,
                difficulty_level=2,
                explanation="A LEFT (OUTER) JOIN preserves every record from the left table, filling unmatched right columns with NULL."
            ),
            QuestionBank(
                category="SQL",
                question="Which aggregate function calculates the total number of non-null expressions or rows?",
                options=["SUM", "COUNT", "AVG", "MAX"],
                correct_option_index=1,
                difficulty_level=2,
                explanation="COUNT() returns the cardinal count of rows matching criteria."
            ),
            # SQL Level 3
            QuestionBank(
                category="SQL",
                question="Which clause is used to filter aggregated group results produced by GROUP BY?",
                options=["WHERE", "HAVING", "LIMIT", "QUALIFY"],
                correct_option_index=1,
                difficulty_level=3,
                explanation="HAVING filters post-aggregation groups; WHERE cannot filter on aggregate function outputs."
            ),
            QuestionBank(
                category="SQL",
                question="A foreign key constraint primarily enforces what database guarantee?",
                options=["Query Execution Speed", "Referential Integrity", "Column-level Encryption", "Index Compression"],
                correct_option_index=1,
                difficulty_level=3,
                explanation="Foreign keys enforce referential integrity between child and parent tables."
            ),
            QuestionBank(
                category="SQL",
                question="ROW_NUMBER(), RANK(), and DENSE_RANK() are classifications of what SQL feature?",
                options=["Window Functions", "Table Joins", "Integrity Constraints", "Stored Procedures"],
                correct_option_index=0,
                difficulty_level=3,
                explanation="These are window analytical functions operating over a defined OVER(PARTITION BY ... ORDER BY ...) partition."
            ),
            # Python
            QuestionBank(
                category="Python",
                question="What is the average time complexity of looking up a key in a Python dict?",
                options=["O(n)", "O(1)", "O(log n)", "O(n^2)"],
                correct_option_index=1,
                difficulty_level=2,
                explanation="Python dictionaries are implemented via hash tables, providing O(1) amortized average lookup."
            ),
            # Aptitude
            QuestionBank(
                category="Aptitude",
                question="If a train travels at 60 km/h, how many meters does it cover in 1 second?",
                options=["16.67 m", "18.5 m", "15.0 m", "20.0 m"],
                correct_option_index=0,
                difficulty_level=1,
                explanation="60 * (5/18) = 16.67 meters per second."
            )
        ]
        db.add_all(questions)
        db.flush()

        # 3. Main Student (Rahul K.)
        student_rahul = Student(
            id="student-rahul-01",
            college_id="COLLEGE-A",
            name="Rahul K.",
            roll_number="CS21B104",
            branch="CSE",
            gender="Male",
            category="General",
            cgpa=7.8,
            backlogs=1,
            github_username="rahulk-dev",
            github_connected=False
        )
        db.add(student_rahul)
        db.flush()

        # Rahul's initial competencies
        skills_rahul = [
            Competency(student_id=student_rahul.id, college_id="COLLEGE-A", skill_name="Python", state="claimed", confidence=0.5),
            Competency(student_id=student_rahul.id, college_id="COLLEGE-A", skill_name="SQL", state="claimed", confidence=0.5),
            Competency(student_id=student_rahul.id, college_id="COLLEGE-A", skill_name="Git", state="claimed", confidence=0.5),
            Competency(student_id=student_rahul.id, college_id="COLLEGE-A", skill_name="Docker", state="claimed", confidence=0.4)
        ]
        db.add_all(skills_rahul)
        db.flush()

        # Additional cohort students for Recruiter talent search & pipeline
        cohort_students = [
            ("student-anita-02", "Anita S.", "CSE", ["SQL", "Python", "Docker"]),
            ("student-karthik-03", "Karthik M.", "IT", ["Python", "Git"]),
            ("student-priya-04", "Priya D.", "CSE", ["SQL", "Git"]),
            ("student-imran-05", "Imran A.", "ECE", ["Python", "SQL"]),
            ("student-divya-06", "Divya R.", "IT", ["SQL", "Docker", "Git"])
        ]
        for sid, name, branch, skills in cohort_students:
            st = Student(
                id=sid,
                college_id="COLLEGE-A",
                name=name,
                branch=branch,
                cgpa=8.2,
                backlogs=0
            )
            db.add(st)
            db.flush()
            for sk in skills:
                db.add(Competency(
                    student_id=st.id,
                    college_id="COLLEGE-A",
                    skill_name=sk,
                    state="verified",
                    confidence=0.95,
                    verified_by="Prof. Meena (DBMS Lab)" if sk == "SQL" else "Technical Assessment Board",
                    verification_method="mentor_signoff" if sk in ["SQL", "Docker"] else "machine_test"
                ))

        # 4. Companies & Roles
        acme = Company(id="comp-acme", name="Acme Tech", industry="Software Engineering", website="https://acme.tech")
        gamma = Company(id="comp-gamma", name="Gamma Labs", industry="Data Analytics & AI", website="https://gammalabs.ai")
        beta = Company(id="comp-beta", name="Beta Soft", industry="Cloud Infrastructure", website="https://betasoft.io")
        db.add_all([acme, gamma, beta])
        db.flush()

        role_backend = JobRole(
            id="role-backend-01",
            company_id=acme.id,
            title="Backend Developer",
            min_cgpa=7.0,
            max_backlogs=0,
            required_skills=["Python", "SQL", "Git", "Docker"]
        )
        db.add(role_backend)
        db.flush()

        # 5. Placement Drives (With Wednesday Clash)
        drives = [
            PlacementDrive(college_id="COLLEGE-A", company_id=acme.id, job_role_id=role_backend.id, title="Acme Tech", day_of_week="Mon", activity="Visit"),
            PlacementDrive(college_id="COLLEGE-A", company_id=acme.id, job_role_id=role_backend.id, title="Acme Tech", day_of_week="Tue", activity="Test"),
            PlacementDrive(college_id="COLLEGE-A", company_id=gamma.id, job_role_id=role_backend.id, title="Gamma Labs", day_of_week="Wed", activity="Interviews", has_clash=True),
            PlacementDrive(college_id="COLLEGE-A", company_id=beta.id, job_role_id=role_backend.id, title="Beta Soft", day_of_week="Wed", activity="Visit", has_clash=True),
            PlacementDrive(college_id="COLLEGE-A", company_id=gamma.id, job_role_id=role_backend.id, title="Gamma Labs", day_of_week="Fri", activity="Offers")
        ]
        db.add_all(drives)
        db.flush()

        # 6. Hiring Pipeline Applications
        pipeline_apps = [
            Application(
                college_id="COLLEGE-A",
                drive_id=drives[0].id,
                student_id="student-anita-02",
                student_name="Anita S.",
                branch="CSE",
                verified_skills="SQL, Python verified",
                stage="Shortlisted",
                stage_index=0
            ),
            Application(
                college_id="COLLEGE-A",
                drive_id=drives[0].id,
                student_id="student-divya-06",
                student_name="Divya R.",
                branch="IT",
                verified_skills="SQL, Docker, Git verified",
                stage="Interview",
                stage_index=1
            ),
            Application(
                college_id="COLLEGE-A",
                drive_id=drives[0].id,
                student_id="student-imran-05",
                student_name="Imran A.",
                branch="ECE",
                verified_skills="Python, SQL verified",
                stage="Shortlisted",
                stage_index=0
            )
        ]
        db.add_all(pipeline_apps)
        db.flush()

        # 7. Approvals Queue for Officer
        approvals = [
            Approval(
                college_id="COLLEGE-A",
                proposed_by="Predictive Agent",
                title="Flag 12 students as at-risk",
                description="Predictive agent identified weak SQL and low mock score patterns in CSE semester 6.",
                status="pending"
            ),
            Approval(
                college_id="COLLEGE-A",
                proposed_by="Skill-gap Agent",
                title="Add Docker workshop for CSE batch",
                description="Skill-gap agent detected 40% of newly registered job roles demand Docker containerization.",
                status="pending"
            ),
            Approval(
                college_id="COLLEGE-B",
                proposed_by="Predictive Agent",
                title="Flag 4 students as at-risk",
                description="Predictive agent identified missing Docker and Git verifications.",
                status="pending"
            )
        ]
        db.add_all(approvals)
        db.flush()

        # 8. Seed Audit Log with Verified Genesis Chain for College A & College B
        AuditService.log_event(db, "COLLEGE-A", "System Genesis", "ProofHire 2.0 Genesis Block Initialized")
        AuditService.log_event(db, "COLLEGE-A", "T&P Officer", "Loaded statutory placement drive schedule for Semester 8")
        AuditService.log_event(db, "COLLEGE-B", "System Genesis", "ProofHire 2.0 Genesis Block Initialized for College B")

        db.commit()
        print("Database successfully seeded.")
    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
