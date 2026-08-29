# Accessibility Standard

## Target

Razchly targets WCAG 2.2 AA for core authenticated flows and login.

## Keyboard

- A visible skip link targets the main workspace.
- Every interactive element is reachable in a logical order.
- Focus is visible on light and dark surfaces.
- Escape closes non-destructive dialogs, sheets, menus, and command search.
- Enter and Space activate buttons according to native behavior.
- Custom clickable rows use native buttons or links whenever possible.
- Focus returns to the trigger after an overlay closes.

## Focus appearance

- Minimum 2px visible outline or equivalent ring
- Gold-derived focus color with sufficient contrast
- At least 2px separation from the component edge when practical
- Focus is never removed without a replacement

## Contrast

- Body and form text: at least 4.5:1
- Large text: at least 3:1
- Placeholder and helper text remain readable
- Green and red never carry meaning without a label, sign, or context
- Disabled controls remain identifiable without appearing active

## Forms

- Every input has a persistent label.
- Required state is announced in text or semantics.
- Errors are associated with the affected field.
- Validation explains how to recover.
- Numeric inputs use the appropriate input mode.
- Date and time controls retain accessible native behavior.

## Dialogs and sheets

- Use `role="dialog"` or `role="alertdialog"` as appropriate.
- Set `aria-modal="true"`.
- Provide an accessible title.
- Prevent accidental background interaction.
- Ensure close controls have explicit labels.
- Destructive confirmations name the affected object and consequence.

## Data and charts

- Tables use semantic headers.
- Financial values use readable text, not canvas alone.
- Charts have a nearby textual summary or key values.
- Tooltips are supplemental, not the only way to access data.
- Hidden balances remain hidden in labels, tooltips, and summaries.

## Images and icons

- Meaningful images have descriptive alt text.
- Decorative images use empty alt text.
- Icon-only controls have accessible names.
- User avatars may use empty alt text when the adjacent user name provides identity.

## Motion and sensory access

- Respect reduced motion.
- Do not use flashing content.
- Do not require drag, hover, or color perception for a core action.
- Touch targets are at least 44 by 44 CSS pixels.

## Language and copy

- Root document language is Indonesian.
- Labels use plain action-oriented language.
- Currency follows Indonesian formatting.
- ID and EN modes do not mix within the same active surface unless the term is a product or market standard.

## Verification checklist

- Keyboard-only pass for login, navigation, add transaction, save, and close
- 200 percent browser zoom without lost actions
- 360px width without clipped controls
- Reduced-motion pass
- Automated TypeScript and build pass
- Manual contrast check for new token combinations
