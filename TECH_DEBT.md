# ⚠️ TECH_DEBT.md — Razchly Technical Debt & Maintenance Ledger

This document tracks known shortcuts, structural bottlenecks, and deferred refactoring tasks in the codebase.

---

## 1. High-Priority Technical Debt

### Direct Firestore CRUD from Frontend
- **Issue:** The React client directly issues write and update commands to Firestore collections (`users/{uid}/accounts`, etc.). While convenient, this makes it difficult to enforce server-side business rules, auditing, or multi-collection transactional integrity.
- **Impact:** Medium risk of data inconsistency if client-side logic fails mid-transaction (e.g., deducting balance from one account and failing to add to another).
- **Upgrade Path:** Migrate complex multi-collection mutations (like Grab earnings auto-allocation or loan payments) to server-side Express API routes protected by Firebase Admin authorization.

### Missing Global Express Error Handler
- **Issue:** `server.ts` does not contain a global error-catching middleware. Errors thrown in asynchronous Express handlers can result in process termination if not wrapped in try-catch.
- **Impact:** Low-to-Medium risk of server crashes under unexpected edge cases.
- **Upgrade Path:** Implement a global `app.use((err, req, res, next) => { ... })` error handler and standard response templates.

---

## 2. Medium-Priority Technical Debt

### Synchronous / Blocking TradingView WebSocket Client
- **Issue:** The quotes API `/api/quotes` spins up a new `TradingView.Client` on every request, waits for WebSocket connection, registers event listeners, and then closes it. This creates high overhead.
- **Impact:** High API latency (up to 2.5s) and socket exhaustion under high concurrent load.
- **Upgrade Path:** Implement a persistent, singleton TradingView WebSocket connection that remains active and updates a shared cache in-memory.

### Inline CSS Styling & Tailwinds Hardcoding
- **Issue:** Some JSX files contain long, inline Tailwind style lists and hardcoded theme classes, overriding themes.ts variables.
- **Impact:** Harder styling maintenance and potential theme leakage.
- **Upgrade Path:** Refactor utility classes into reusable theme class helpers or extract them into `src/index.css`.

---

## 3. Low-Priority Technical Debt

### Lack of Unit and Integration Tests
- **Issue:** There are zero tests configured in the project.
- **Impact:** Risk of regression bugs during visual or backend refactoring.
- **Upgrade Path:** Install Vitest or Jest, and write tests for `useStore.ts` selectors and `/api/quotes` mock functions.
