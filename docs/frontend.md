# Razchly Frontend Contract

## Objective

Razchly must feel like a private financial operating system, not a generic SaaS dashboard. The frontend prioritizes financial clarity, fast daily input, and trustworthy feedback. Visual work may be ambitious, but it must preserve product behavior and user data.

## Scope

This contract covers every browser-rendered surface:

- Login and authentication presentation
- Global application shell and navigation
- Dashboard
- Transactions and transaction entry
- Investments and AI trading
- Loans
- Attendance
- Grab income tracking
- Savings targets
- Receipt analysis
- Settings
- Shared loading, empty, error, modal, sheet, toast, and offline states

## Current stack

- React 19 and TypeScript
- Vite 6
- Tailwind CSS 4 plus semantic CSS tokens
- React Router
- Zustand
- Motion
- Recharts
- Lucide, retained as the existing icon family
- Firebase Auth and Firestore

Do not migrate frameworks, introduce a second component system, or add a dependency for work that native React, CSS, or the current stack already handles.

## Frontend boundaries

Visual work may change composition, hierarchy, spacing, typography, responsive behavior, motion, and UI copy.

Visual work must not change:

- Firebase collection names or document shapes
- Authentication behavior
- Express endpoints or third-party API contracts
- Route paths
- Store field names or persistence rules
- Financial calculation semantics
- Existing feature availability

If an existing UI exposes questionable product behavior, document it instead of silently changing the backend contract.

## Route inventory

| Route | Primary job | Primary action |
|---|---|---|
| `/` | Understand current financial position | Add transaction |
| `/transactions` | Review and reconcile money movement | Add transaction |
| `/investments` | Track portfolio position | Add asset |
| `/ai-trading` | Inspect and run trading analysis | Run analysis |
| `/loans` | Track debt and receivables | Add loan |
| `/attendance` | Record and review working time | Check in or out |
| `/grab` | Record Grab income and allocation | Add Grab transaction |
| `/savings` | Track saving goals | Create or fund target |
| `/analyze` | Extract transaction data from an image | Upload or capture receipt |
| `/settings` | Manage accounts, preferences, and integrations | Save the active section |

## Architecture rules

- Keep route components lazy-loaded.
- Reuse `Layout`, `PageShell`, `MotionWrappers`, existing modals, and existing domain components before creating new abstractions.
- Keep route-specific calculations in their current route unless they are already shared.
- Put global visual tokens and cross-route patterns in `src/index.css`.
- Keep one-off structural classes close to the owning component.
- Prefer semantic HTML over anonymous interactive `div` elements.
- Financial numerals use tabular figures and never rely on color alone.

## Required UI states

Every applicable control or surface must account for:

- Default
- Hover
- Keyboard focus
- Pressed or active
- Disabled
- Loading
- Empty
- Error
- Success
- Offline or stale data when the product exposes that state

## Quality gate

Frontend work is complete only when:

- `npm run lint` passes
- `npm run build` passes
- `git diff --check` passes
- No horizontal overflow exists at 360px
- Primary flows work with keyboard only
- Touch targets are at least 44 by 44 CSS pixels
- Reduced motion preserves all content and actions
- Dialogs and sheets have names, focus behavior, and a clear close path
- Loading and empty states resemble the final layout
- No route, Firebase shape, or server behavior changed unintentionally
