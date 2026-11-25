# Deployment Guide — ProofHire 2.0

## 1. Local Development (Zero-Dependency)
**Backend:**
```powershell
$env:PYTHONPATH="."
uvicorn backend.app.main:app --reload --port 8000
```
**Frontend:**
```powershell
cd frontend
npm install
npm run dev
```
- Frontend URL: `http://localhost:3000`
- Backend API & Swagger Docs: `http://localhost:8000/docs`
- Health Check: `GET http://localhost:8000/api/health`

## 2. Demo Data Reset (Local / Staging Only)
```powershell
$env:PYTHONPATH="."
python scripts/reset_demo.py
```
`reset_demo.py` aborts automatically if `ENVIRONMENT=production`.

## 3. Production Deployment (Render + Vercel + Supabase PostgreSQL)
1. **Database (Supabase / PostgreSQL):**
   - Run `db/schema.sql` to create normalized tables, indexes, and `tenant_isolation` RLS policies.
2. **Backend (Render via `render.yaml`):**
   - Connect repository; Render uses `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT` and `/api/health`.
   - Set `ENVIRONMENT=production`, `SECRET_KEY`, `DATABASE_URL`, and `ALLOWED_ORIGINS=https://<your-vercel-domain>`.
3. **Frontend (Vercel via `frontend/vercel.json`):**
   - Set Root Directory to `frontend`.
   - Set `NEXT_PUBLIC_API_URL=https://<your-render-service>.onrender.com`.
   - Deploy (`npm run build`).
