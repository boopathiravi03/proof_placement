# ProofHire 2.0 — Technical Architecture

## 1. Implemented System Diagram
```mermaid
flowchart TB
  subgraph Clients["Role-Based Web Interfaces (Next.js 14 App Router + TypeScript + Tailwind)"]
    S["Student Portal (/student/*)"]
    O["T&P Officer Console (/officer/*)"]
    R["Recruiter Hub (/recruiter/*)"]
    U["University Admin (/university/*)"]
  end

  API["Centralized ApiClient (frontend/src/lib/api.ts)"]
  Clients --> API

  subgraph Backend["FastAPI Backend (/api/* — 122 OpenAPI Paths / 127 Operations)"]
    MW["Security Headers + Rate Limit Middleware"]
    GOV["GovernanceService (RBAC, Tenant Isolation, 6-Category Consent, DataAccessLog)"]
    MW --> GOV

    subgraph Engines["Domain Service Layer (backend/app/services/)"]
      EV["Competency & Evidence Engine"]
      AS["Adaptive Assessment Engine"]
      PRI["Placement Readiness Index (PRI)"]
      LP["Learning Path & Skill-Gap Engine"]
      EL["Versioned Eligibility & Matching"]
      II["Institutional Intelligence & NAAC/NIRF"]
      AU["AuditService (SHA-256 + HMAC Checkpoints) & FairnessService"]
    end
    GOV --> Engines
  end

  API -->|HTTPS / REST JSON| MW

  subgraph DB["Persistence Layer"]
    SQL["SQLite (proofhire.db — Local/Demo) / PostgreSQL + Supabase RLS (Production)"]
  end
  Engines --> SQL

  subgraph Ext["External & Optional Integrations (Graceful Fallback)"]
    GH["GitHub Public API / OAuth (Never auto-verifies)"]
    SMTP["SMTP Provider (Simulated Preview when SMTP_HOST unset)"]
    LLM["Optional LLM Key (Deterministic fallback active by default)"]
  end
  EV --> GH
  EL --> SMTP
  LP --> LLM
```

## 2. Actual Communication & Data Flow
- **Frontend -> Backend:** Every page calls `ApiClient` (`frontend/src/lib/api.ts`), which communicates with FastAPI routers registered under `/api/*`.
- **Governance Gate:** `GovernanceService.authorize_and_log_access()` checks college tenant boundaries, student ownership, recruiter least-privilege, and purpose-specific consent before allowing protected reads/writes, logging to `DataAccessLog` and `SecurityEvent`.
- **Database:** SQLAlchemy ORM supports zero-config SQLite (`proofhire.db`) locally and PostgreSQL/Supabase (`DATABASE_URL`, `db/schema.sql` with `tenant_isolation` RLS policies) in staging/production.
- **External Services Status:** Public GitHub API works when reachable with demo repo fallback; SMTP and external LLM keys are optional—deterministic fallbacks and `simulated_preview` modes ensure full offline/demo reliability without fabricated success claims.
