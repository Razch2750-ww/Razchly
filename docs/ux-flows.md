# UX Flows

## Global navigation

### Desktop

1. User enters an authenticated route.
2. Rail identifies the active route.
3. Command bar exposes search, date, sync state, and profile.
4. `Ctrl/Cmd + K` or `/` opens command search.
5. Selecting a command navigates or opens an existing quick-entry flow.

### Mobile

1. Bottom dock exposes Dashboard, Transactions, Investments, and Loans.
2. Center add control opens a bottom sheet.
3. The sheet offers transaction, Grab income, receipt analysis, and attendance.
4. Selecting an action closes the sheet before opening the next surface.

## Authentication

1. Unauthenticated user sees the login surface.
2. User starts Google sign-in.
3. Button shows a loading state and prevents duplicate submission.
4. Authentication failure remains readable on the login surface.
5. Success enters the application shell and preserves the intended route when supported.

## Add transaction

1. User opens the form from Dashboard, Transactions, command palette, or mobile add sheet.
2. User selects income, expense, or transfer.
3. Nominal is the first dominant field.
4. Relevant account fields adapt to the selected type.
5. Category, note, fee, and time follow.
6. Validation appears near the affected field.
7. Save shows a pending state and blocks duplicate submission.
8. Success closes the form, restores focus, and updates subscribed data.

## Review transactions

1. User selects period and optional account or type filters.
2. Monthly statement updates from the current filter.
3. Ledger remains the dominant surface.
4. User can search, edit, delete, export, or open analysis without losing period context.
5. Delete requires an explicit destructive confirmation.

## Grab settlement

1. User enters received cash and driver/customer application amounts.
2. Interface explains calculated allocations before save.
3. Invalid combinations block save with a specific message.
4. Success writes through the existing transaction flow and updates connected accounts.

## Receipt analysis

1. User uploads or captures an image.
2. Preview confirms the selected source.
3. Extraction displays loading progress without blocking navigation controls.
4. Parsed merchant, date, amount, and category remain editable.
5. User confirms before a transaction is saved.
6. Failure preserves the image and offers retry or manual entry.

## Accounts and settings

1. User opens Settings and selects the relevant section.
2. Existing values load into labeled controls.
3. Dirty state is visually clear where supported.
4. Save affects only the active section.
5. Success confirmation names what changed.
6. Destructive account actions explain balance or transaction consequences.

## Investments and AI trading

1. User selects asset or engine context.
2. Current holdings or inputs remain visible while analysis loads.
3. Results separate evidence, risk, and suggested action.
4. Simulated or illustrative values are labeled.
5. Any real trade action retains the existing confirmation and backend safeguards.

## Loans

1. User chooses payable or receivable.
2. Principal, interest method, tenor, and linked account remain explicit.
3. A summary shows the calculated total before save.
4. Payments update progress and remaining amount through existing logic.
5. Paid loans remain distinguishable from active loans.

## Attendance

1. Current status determines whether Check in or Check out is primary.
2. User records the action and optional context.
3. Current session and history update without changing the configured work period.
4. Permission or location errors identify the failed requirement.

## Savings

1. User creates or selects a target.
2. Interface emphasizes target, collected amount, and remaining amount.
3. Funding uses existing account and transaction behavior.
4. Completion changes the state without hiding historical context.

## Recovery rules

- Escape closes non-destructive overlays.
- Browser Back returns to a meaningful parent route.
- Failed saves preserve entered values.
- Switching responsive breakpoints does not discard form state.
- Closing a sheet or dialog returns focus to its trigger.
