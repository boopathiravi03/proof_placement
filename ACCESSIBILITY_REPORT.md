# Accessibility Report — ProofHire 2.0 (WCAG 2.2 AA Alignment)

## Implemented Accessibility Controls
1. **Keyboard Navigation & Focus Visibility:**
   - Global `:focus-visible` `2px solid var(--pri)` outline with `2px` offset in `frontend/src/app/globals.css`.
   - Skip-to-main-content link (`<a href="#main-content">`) in `RoleLayout.tsx` targeting `<main id="main-content">`.
2. **ARIA Landmarks & Interactive Controls:**
   - `RoleLayout.tsx`: `aria-current="page"` on active navigation links, `aria-label` on mobile menu open/close and notification toggle buttons, `aria-expanded` on notification dropdown.
   - `Modal.tsx`: `role="dialog"`, `aria-modal="true"`, `aria-labelledby="modal-title"`, `Escape` key dismissal, and `aria-label="Close modal"`.
3. **Non-Color Status Indicators:**
   - `CompetencyBadge.tsx` pairs semantic colors with explicit text labels and Lucide icons (`Link2`, `Clock`, `CheckCircle2`, `ShieldAlert`) so status is never communicated by color alone.
4. **Reduced Motion:**
   - `@media (prefers-reduced-motion: reduce)` in `globals.css` collapses CSS animations and transitions.
