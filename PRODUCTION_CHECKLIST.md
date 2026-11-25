# Production Checklist — ProofHire 2.0

- [ ] Set `ENVIRONMENT=production` and a cryptographically random `SECRET_KEY` (never use default dev secret).
- [ ] Point `DATABASE_URL` to managed PostgreSQL / Supabase and apply `db/schema.sql`.
- [ ] Configure `ALLOWED_ORIGINS` strictly to your deployed Vercel domain(s) (never `*` in production).
- [ ] Configure `NEXT_PUBLIC_API_URL` in Vercel to point to the HTTPS Render backend URL.
- [ ] Configure `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` if live OAuth is enabled; otherwise GitHub stays in public-API / demo-fallback mode.
- [ ] Configure `SMTP_HOST` / `SMTP_USER` / `SMTP_PASSWORD` if live email dispatch is enabled; otherwise announcements remain in `simulated_preview` mode.
- [ ] Back `_RATE_LIMIT_STORE` with Redis if running multiple Uvicorn workers.
- [ ] Mirror `AuditCheckpoint` HMAC signatures to external WORM storage (e.g., S3 Object Lock).
- [ ] Complete institutional legal review of `PrivacyNoticeVersion` before production onboarding (ProofHire does not claim formal DPDP legal certification).
