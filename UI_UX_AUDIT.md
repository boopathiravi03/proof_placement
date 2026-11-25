# UI/UX Audit — ProofHire 2.0

**Audit Scope:** All 30 Next.js App Router pages (`/` + `(auth)` + `(student)` + `(officer)` + `(recruiter)` + `(university)`), shared layouts (`RoleLayout`, `StudentLayout`, `OfficerLayout`, `RecruiterLayout`, `UniversityLayout`, `Sidebar`, `Header`), and `frontend/src/components/ui/*`.

## 1. Existing Design Strengths
- **Role-Based Navigation Architecture:** `RoleLayout.tsx` cleanly isolates Student, T&P Officer, Recruiter, and University Admin routes with a persistent dark navy sidebar (`#0f172a` / `#172554`) and mobile slide-over drawer.
- **Reusable Primitives:** `PageHeader`, `StatCard`, `ProgressBar`, `ReadinessRing`, `CompetencyBadge`, `DataTable`, `Modal`, `EmptyState`, `ErrorState`, `LoadingSkeleton`, and `ConfirmationDialog` exist across the UI.
- **Evidence State Separation:** `CompetencyBadge` separates `Claimed`, `Observed`, `Evidence-linked`, `Assessed`, `Verified`, and `Expired`.

## 2. Usability, Visual & Accessibility Issues Found
| Area | Issue Observed | Remediation |
|---|---|---|
| Color & Brand Consistency | `Sidebar.tsx` and `Header.tsx` used purple-cyan gradients (`#8a6cff` -> `#4cc3ff`), and `app/page.tsx` used `backdrop-blur-md` glassmorphism | Replace with restrained navy/blue enterprise tokens (`#172554`, `#2563EB`) and clean solid/border surfaces |
| Competency Iconography | `CompetencyBadge.tsx` used `Sparkles` (flashy AI icon) for `Evidence-linked` | Replace with `Link2` so evidence linking clearly conveys artifact provenance, not AI magic |
| Keyboard & Focus Accessibility | `globals.css` lacked global `:focus-visible` outlines and `@media (prefers-reduced-motion: reduce)` | Add high-contrast `:focus-visible` ring (`2px solid var(--pri)`) and reduced-motion rules |
| Modal & Landmark ARIA | `Modal.tsx` lacked `role="dialog"`, `aria-modal="true"`, and `aria-label` on close button; `RoleLayout.tsx` lacked skip-to-content link, `aria-current="page"`, and `aria-expanded` on dropdowns | Add full ARIA attributes, skip link, `aria-current="page"`, and `aria-label` attributes |
| Judge Entry & Demo Clarity | `app/page.tsx` lacked a concise 5-minute judge walkthrough strip and explicit fictional-demo / simulated-integration indicators | Add a clean "Judge Walkthrough & Demo Personas" band at the top of `app/page.tsx` |
