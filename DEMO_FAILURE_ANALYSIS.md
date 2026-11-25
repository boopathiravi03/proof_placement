# Demo Failure Analysis — ProofHire 2.0

| # | Likely Demo Failure | Root Cause | Recovery Plan |
|---|---|---|---|
| 1 | **Audit Chain Shows "Tampered" at Start of Demo** | Prior rehearsal clicked `Simulate Tamper` on `/officer/audit` without resetting `proofhire.db`. | Run `$env:PYTHONPATH="."; python scripts/reset_demo.py` before going on stage. |
| 2 | **Frontend Shows "Standalone Mode" Instead of "Live API"** | FastAPI backend isn't running on port `8000` or `frontend/.env.local` has wrong `NEXT_PUBLIC_API_URL`. | Start `uvicorn backend.app.main:app --port 8000` and verify `http://localhost:8000/api/health`. |
| 3 | **Missing Phase 4 Question Categories** | Database was wiped without running `seed_comprehensive_questions()`. | `scripts/reset_demo.py` now calls `seed_comprehensive_questions()` automatically. |
| 4 | **GitHub Scan Fails Due to Offline Wi-Fi at Venue** | Venue Wi-Fi blocks `api.github.com` or rate-limits unauthenticated calls. | `github_service.py` automatically falls back to clearly labeled demo repositories (`rahulk-dev`). |
| 5 | **Email Dispatch Questioned as "Not Actually Sent"** | `SMTP_HOST` is unset in local demo environment. | Show the explicit `preview_simulated` badge/log and explain honest simulation behavior. |
