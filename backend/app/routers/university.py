from fastapi import APIRouter

router = APIRouter(prefix="/university", tags=["University Administration"])

@router.get("/colleges-summary")
def get_colleges_summary():
    return {
        "tenant_policy": "Strict Tenant Isolation (Row-Level Security & College Partitioning)",
        "isolation_guarantee": "University administrators access aggregated institution-level indicators only. Direct student profiles and private evidence remain strictly quarantined within their respective college tenants.",
        "colleges": [
            {
                "college_id": "COLLEGE-A",
                "name": "Apex Engineering Institute (College A)",
                "placement_rate": 68,
                "verified_skill_coverage": 41,
                "gap_closure_rate": 33,
                "fairness_flags": 1,
                "status": "Review required"
            },
            {
                "college_id": "COLLEGE-B",
                "name": "Beacon Technology Campus (College B)",
                "placement_rate": 74,
                "verified_skill_coverage": 57,
                "gap_closure_rate": 46,
                "fairness_flags": 0,
                "status": "Optimal"
            },
            {
                "college_id": "COLLEGE-C",
                "name": "Crestline Institute of Science (College C)",
                "placement_rate": 61,
                "verified_skill_coverage": 35,
                "gap_closure_rate": 28,
                "fairness_flags": 2,
                "status": "Intervention required"
            }
        ]
    }
