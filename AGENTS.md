# Razchly Frontend Instructions

These instructions apply to the entire repository.

## Required reading for frontend work

Read these files before changing UI, in this order:

1. `PRODUCT.md`
2. `ARCHITECTURE.md`
3. `docs/frontend.md`
4. `docs/design.md`
5. `docs/layout.md`
6. `docs/components.md`
7. `docs/ux-flows.md`
8. `docs/motion.md`
9. `docs/ACCESSIBILITY.md`
10. `docs/responsive.md`

The documents in `docs/` are the current frontend source of truth. The root `DESIGN.md` is retained for historical compatibility.

## Non-negotiable boundaries

- Preserve Firebase collections, document shapes, authentication, API endpoints, route paths, and financial calculations unless the user explicitly requests a backend change.
- Do not remove a feature to simplify the interface.
- Do not add a dependency without proving the current stack cannot solve the problem cleanly.
- Keep React Router route-level lazy loading.
- Reuse the existing icon family and motion package.
- Never commit secrets, generated credentials, or private user data.

## Design contract

- Apply Obsidian Ledger consistently to every route and shared state.
- Financial hierarchy comes before decoration.
- Use one gold brand accent; green and red are semantic only.
- No gradients, glow, decorative glass, nested cards, or generic equal-card rows.
- Mobile and desktop may use different compositions while preserving the same tasks and data.
- Keep controls, empty states, dialogs, sheets, and browser-native surfaces inside the same visual system.

## Implementation workflow

1. Audit the affected route and its current states.
2. Preserve data subscriptions and mutations.
3. Repair shared tokens or primitives before route-specific overrides.
4. Implement desktop and mobile together.
5. Cover loading, empty, error, focus, disabled, and reduced-motion states.
6. Run the quality gate.
7. Review the diff for unintended backend or route changes.

## Quality gate

Run:

```bash
npm run lint
npm run build
git diff --check
```

Also inspect representative desktop and mobile renders when a browser is available. If rendered inspection is unavailable, report that limitation and do not claim full visual verification.

## Git workflow

- Frontend redesign work belongs on a dedicated branch.
- Do not push redesign commits directly to `main` unless the user explicitly changes this instruction.
- Keep commits reviewable and name them by the visible outcome.
