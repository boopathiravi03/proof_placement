# UI Regression Tests — ProofHire 2.0

## Automated Checks Executed
1. **TypeScript & ESLint + Static Route Compilation (`cd frontend; npm run build`):**
   - Verifies strict TypeScript types, ESLint rules, and Next.js App Router compilation across all 30 routes (`/`, `/login`, `/register`, 8 `/student/*`, 7 `/officer/*`, 5 `/recruiter/*`, 4 `/university/*`).
2. **Backend API & Contract Tests (`python -m unittest discover -s tests -v`):**
   - 64 tests verifying every backend service and API contract consumed by the frontend.
