# Final Action Plan — ProofHire 2.0

## P0 – Must Fix Before Production / Public Demo
1. **Guard `POST /api/audit/{college_id}/tamper` in `backend/app/routers/audit.py`**
   - **Reason:** Currently any caller can trigger audit tampering simulation without an environment check.
   - **Effort:** 15 mins | **Dependencies:** `settings.ENVIRONMENT` | **Impact:** Prevents audit corruption in staging/prod.
   - **Verification:** Unit test asserting `403` when `ENVIRONMENT=production`.
2. **Enforce Mandatory JWT Auth (`get_current_user`) on Protected Routers**
   - **Reason:** Several endpoints use `get_current_user_optional` or omit `current_user` for zero-login demo switching, allowing unauthenticated direct API calls to bypass `GovernanceService`.
   - **Effort:** 2–3 hours | **Dependencies:** Frontend `ApiClient` sending Bearer token from `AuthContext` | **Impact:** Closes primary RBAC/tenant bypass vector.
   - **Verification:** Integration tests asserting `401` on unauthenticated calls when `ENVIRONMENT != "development"`.
3. **Disable Auto-Seeding (`seed_database()`) When `ENVIRONMENT=production` in `backend/app/main.py`**
   - **Reason:** Prevents demo fixtures from ever being inserted into an empty production database.
   - **Effort:** 15 mins | **Dependencies:** `settings.ENVIRONMENT` | **Impact:** Protects production data hygiene.
   - **Verification:** Startup check with `ENVIRONMENT=production`.

## P1 – Important Improvements
4. **Inject PostgreSQL RLS Session Context (`SET LOCAL app.current_college_id`) in `get_db()`**
   - **Reason:** Activates database-level `tenant_isolation` policies defined in `db/schema.sql`.
   - **Effort:** 1–2 hours | **Dependencies:** Live PostgreSQL instance | **Impact:** Defense-in-depth tenant isolation.
   - **Verification:** Postgres integration test querying across two college contexts.
5. **Add Automated Playwright Browser E2E Tests**
   - **Reason:** Verifies mobile viewports (`360px`–`1920px`) and real UI click-throughs automatically.
   - **Effort:** 3–4 hours | **Dependencies:** Running FastAPI + Next.js dev servers | **Impact:** Prevents UI regressions.
   - **Verification:** `npx playwright test` passing.

## P2 – Future Improvements
6. **Containerized Code Execution Sandbox** (replace AST + simulated runner in `code_execution_service.py`).
7. **Redis-Backed Distributed Rate Limiter** (replace `_RATE_LIMIT_STORE` in `main.py`).
8. **External WORM Storage Mirror for `AuditCheckpoint` HMAC Signatures** (e.g., S3 Object Lock).
