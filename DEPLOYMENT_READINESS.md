# Deployment Readiness — ProofHire 2.0

## Target Topology
- **Frontend:** Vercel (`frontend/`, Next.js 14 App Router) configured via `vercel.json` and `NEXT_PUBLIC_API_URL`.
- **Backend:** Render (`backend/app/main.py`, FastAPI + Uvicorn) configured via `render.yaml` and `DATABASE_URL` (PostgreSQL / Supabase).
- **Local / Hackathon Demo:** Zero-dependency SQLite (`proofhire.db`) + FastAPI (`uvicorn backend.app.main:app --port 8000`) + Next.js (`npm run dev`).

## Environment Separation
- **Local Development:** `ENVIRONMENT=development`, SQLite (`proofhire.db`), `ALLOWED_ORIGINS=http://localhost:3000`.
- **Testing:** In-memory SQLite (`sqlite:///:memory:`) isolated per test case.
- **Staging / Production:** `ENVIRONMENT=production`, Supabase PostgreSQL (`DATABASE_URL`), strong random `SECRET_KEY`, explicit `ALLOWED_ORIGINS`, optional `GITHUB_CLIENT_ID`/`GITHUB_CLIENT_SECRET`, `SMTP_HOST`.

## Honest Deployment Status
- Local production build (`npm run build`) and FastAPI startup/OpenAPI generation are verified locally.
- Live cloud deployment to Render and Vercel has **not** been executed from this environment and requires provisioning credentials in those dashboards.
