# 🗺️ ROADMAP.md — Razchly Prioritized Roadmap

This document outlines the priority ordering and phases to transition **Razchly** from its current prototype state into a robust, enterprise-grade financial SaaS application.

---

## Phase 1: Security & Compliance (Priority 1)
*Harden access controls, prevent data leakage, and ensure data integrity.*
- **Firestore Security Rules:** Review and enforce strictly authenticated writes/reads per user.
- **Input Sanitization:** Add middleware to validate payloads on all Express proxy routes (Bybit, Webhook, Gemini).
- **Express Rate Limiting:** Prevent DDoS and brute force on AI/Trading endpoints to avoid high API billing.
- **Secrets Audit:** Ensure no development keys or credentials are leaked in code or client-side assets.

---

## Phase 2: Code Quality & Architecture Hardening (Priority 2)
*Establish clean coding patterns, reduce cognitive load, and improve maintainability.*
- **Global Error Handler:** Add central error catching and logging middleware in `server.ts`.
- **Zustand Store Refactoring:** Separate UI state from domain state, and standardize local storage sync.
- **Drizzle Database integration:** Explore migrations path to map Firestore collections to PostgreSQL for high-fidelity reporting.
- **API Response Standardization:** Enforce consistent JSON formats (status, data, errors) on all Express endpoints.

---

## Phase 3: UX & Visual Modernization (Priority 3)
*Build a premium, beautiful SaaS interface inspired by top-tier tools.*
- **Responsive Layout:** Fix grids and flex wrap behaviors on mobile dashboards and charts.
- **Loading States & Skeletons:** Implement loading skeletons for long-running processes (AI trading backtesting, receipt analysis).
- **Theme Polish:** Refine transition timing, active button shadows, and text accessibility.

---

## Phase 4: Performance & Optimization (Priority 4)
*Reduce latency and optimize bandwidth.*
- **Lazy Loading:** Code-split route tabs (Dashboard, AI Trading, Loans, Attendance) using React lazy load.
- **Bybit API Caching:** Cache order statuses and asset prices temporarily to avoid hitting rate limits.
- **Bundle Optimization:** Optimize Vite assets compilation and compress SVG/PNG assets.

---

## Phase 5: Testing & DevOps (Priority 5)
*Enforce high testing coverage and automated deployments.*
- **API Tests:** Write integration tests for `/api/quotes` and `/api/gemini/trading-analysis`.
- **E2E Testing:** Implement Playwright tests to verify complete checkout and transaction flows.
- **CI/CD Pipeline:** Enforce automatic linting and regression test runs before merges.
