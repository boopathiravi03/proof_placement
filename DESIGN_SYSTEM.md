# Design System — ProofHire 2.0

## 1. Visual Direction
Enterprise SaaS placement intelligence platform: clean, data-focused, high-contrast, restrained navy-and-blue palette, subtle `1px` borders, zero flashy AI gradients or heavy glassmorphism.

## 2. Color Tokens (`frontend/src/app/globals.css`)
- **Primary Navy (`--navy` / `--side`):** `#172554` / `#0f172a`
- **Primary Blue (`--pri`):** `#2563EB` (`--pri-hover`: `#1D4ED8`)
- **Light Blue Tint (`--pt`):** `#EFF6FF`
- **Workspace Background (`--bg`):** `#F8FAFC`
- **Card Surface (`--card`):** `#FFFFFF`
- **Main Text (`--ink`):** `#0F172A`
- **Secondary Text (`--mut`):** `#64748B`
- **Border (`--line`):** `#E2E8F0`
- **Semantic Statuses (always paired with text + icon, never color alone):**
  - Success / Verified: `#16A34A` (`--ok`) on `#ECFDF5` (`--okt`)
  - Warning / Assessed / Pending: `#D97706` (`--warn`) on `#FFFBEB` (`--wt`)
  - Danger / Expired / Compromised: `#DC2626` (`--bad`) on `#FEF2F2` (`--bt`)

## 3. Typography
- **Font Family:** `Plus Jakarta Sans`, system sans-serif fallback.
- **Scale:**
  - Page Title (`PageHeader`): `text-2xl font-extrabold tracking-tight text-ink`
  - Section Heading: `text-base font-bold text-ink`
  - Body / Table Text: `text-xs` / `text-sm text-ink`
  - Labels / Metadata: `text-[11px] font-semibold text-mut`

## 4. Layout & Accessibility Standards
- **Sidebar:** Fixed/sticky `w-64` on `lg+`, slide-over drawer `< 1024px`.
- **Focus Ring:** `:focus-visible` `2px solid var(--pri)` with `2px` offset.
- **Reduced Motion:** `@media (prefers-reduced-motion: reduce)` disables transitions/animations.
