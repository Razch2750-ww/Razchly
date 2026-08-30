# Component Contracts

## Shared shell components

### `Layout`

Owns desktop rail, command bar, mobile dock, global quick actions, route transition, profile entry, and command palette. It must not own route-specific data calculations.

### `PageShell`

Provides consistent route header, actions, content width, and scroll behavior for workbench routes. Route components supply semantic title, description, actions, and children.

### `MotionWrappers`

Provides bounded reveal and state-transition primitives. It must honor reduced motion and must not wrap every static element by default.

### `ThemeApplicator`

Maps one saved theme ID to semantic browser and Ledger tokens. It owns `color-scheme`, PWA `theme-color`, native-control treatment, frame and paper accents, semantic status colors, and chart colors. Components must not inspect theme IDs or theme categories directly.

### Theme picker

- Uses category controls for Light, Dark, and AMOLED instead of rendering all presets as one long mobile list.
- Each option previews command frame, canvas, raised surface, text hierarchy, rule, and action color.
- Selection uses `aria-pressed`, a check icon, focus treatment, and a stable border without scale-induced layout movement.
- Preset IDs remain stable because they are persisted in the user document.

## Financial display primitives

### Statement value

- Display face for the primary amount
- Tabular figures
- Supports hidden balance state
- Wraps safely on narrow screens
- Includes a visible text label outside the value

### Metric pair

- Label plus value
- Optional comparison or helper text
- Semantic color only when meaning requires it
- No decorative icon tile by default

### Ledger row

- Clear primary description
- Account or category context
- Date or time
- Right-aligned amount
- Keyboard-accessible action when interactive
- One divider between rows, not a boxed card per item

### Data table

- Semantic `table`, `thead`, and `tbody` when the content is tabular
- Sticky header only inside its own scrolling region
- Currency and numeric columns align right
- Mobile either collapses to a designed row or scrolls horizontally with a visible affordance

## Controls

### Buttons

Variants are primary, secondary, quiet, and destructive. Every button needs a meaningful label, visible focus, disabled state, and at least 44px touch size on coarse pointers.

### Inputs

- Label above the control
- Placeholder never replaces the label
- Helper text below when needed
- Error text names the issue and recovery
- Numeric financial input displays locale-friendly formatting without changing stored values

### Select and segmented control

Use select for long or dynamic options. Use segmented control for two to four mutually exclusive, frequently switched states.

## Overlays

### Dialog

Use for destructive confirmation or a task requiring protected focus. It has a programmatic name, focus entry, Escape close unless unsafe, and focus return.

### Bottom sheet

Use for mobile transaction entry and quick actions. It includes a clear title, close action, safe-area padding, and scroll containment.

### Command palette

Desktop shortcut: `Ctrl/Cmd + K` or `/` outside an input. It searches existing routes and approved quick actions. Escape closes it. It does not perform hidden backend work.

## Feedback

### Loading

Skeletons match the final layout. Avoid a generic spinner as the only feedback for route loading.

### Empty

State what is absent, why it matters, and provide the most relevant action. Never imply that user data exists when it does not.

### Error

State the failed operation and a recovery action. Use toast only for transient global feedback; keep form errors near the field.

### Success

Confirm the saved object or completed action in plain language. Avoid celebratory effects for routine financial records.

## Component creation rule

Create a shared component only when at least two routes need the same behavior and visual contract. Otherwise keep the implementation local and document the pattern here if it later becomes shared.
