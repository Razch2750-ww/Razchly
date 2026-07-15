# 🧠 MEMORY.md — Razchly AI Agent Project Memory & Context

This file serves as a persistent memory ledger for AI engineering agents working on this repository, summarizing key design decisions, resolved issues, and development context across coding sessions.

---

## 1. Core Project Context
- **Name:** Razchly
- **Scope:** Personal Finance, Gig-Economy Driver Tooling, Multi-Asset Charting, and AI Quantitative Trading Assistant.
- **Languages:** Indonesian (primary user-facing UI and analysis outputs) and English (code/APIs).
- **Target OS Environment:** Windows (development/production build support).

---

## 2. Key Architecture Decisions
- **Client-to-BaaS Database Connection:** Frontend components query Firestore collections directly. This was kept to preserve backward compatibility and ensure real-time UI synchronization without building heavy CRUD endpoints on the backend proxy server.
- **Server API Key Encapsulation:** Google Gemini, TradingView client connection, and Bybit order signatures are strictly encapsulated inside the backend `server.ts` to prevent client-side credential exposure.
- **High-Fidelity Offline Mock Fallbacks:** Built-in mock data generators exist in the Express backend for all key AI endpoints. If a rate limit (HTTP 429) or connection timeout occurs on Gemini or TradingView, the server falls back immediately to realistic Indonesian rupiah/stock mock data, guaranteeing a robust and stable user experience.

---

## 3. Persistent Rules
- **No Abstractions:** Avoid adding new layers of abstraction unless explicitly requested. Prefer local, clean, single-file solutions.
- **Zero-Dependency Policy:** Avoid adding new dependencies unless absolutely necessary.
- **Bilingual Interface:** Maintain user-facing texts, AI financial strategies, and trading output matrices strictly in **Indonesian**. Keep variables, functions, and database schemas in **English**.
