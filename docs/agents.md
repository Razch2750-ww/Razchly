# Frontend agent contract

This file is the short handoff for agents working on Razchly's browser UI.

## Before editing

- Read `PRODUCT.md`, `ARCHITECTURE.md`, and the frontend documents in `docs/`.
- Inspect the owning route and shared tokens before adding a component.
- Keep work on a dedicated redesign branch; never rewrite `main`.

## Preserve

- Firebase collections, document shapes, authentication, API endpoints, route paths, store fields, and financial calculations.
- React Router lazy loading, the current icon family, and installed dependencies.
- Indonesian copy and the existing ID/EN language behavior.

## Design contract

- Use semantic Ledger tokens; do not branch on a theme ID in components.
- Keep one gold-derived action color; green and red are semantic data colors.
- Prefer a dominant surface plus a supporting rail/register over equal-card grids.
- No gradients, decorative glass, glow, nested card stacks, gradient text, or spectacle motion.
- Ship mobile and desktop together, with 44px coarse-pointer targets and reduced-motion support.

## Verify

Run `node --import tsx scripts/check-themes.ts`, TypeScript, lint, build, `git diff --check`, and a backend/route diff review. If a browser is unavailable, state that visual inspection was not performed rather than implying it was.
