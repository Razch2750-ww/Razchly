# 🔒 SECURITY.md — Razchly Security Assessment & Guidelines

This document details the security model, vulnerability audit parameters, and protective measures implemented in Razchly.

---

## 1. Authentication & Session Management
- **Frontend Authentication:** Handled securely by the **Firebase Auth Web SDK**. Sessions are persisted in indexDB/cookies and managed out-of-band by Google.
- **Backend API Authorization:** Express routes that access user-specific operations must validate the `Authorization: Bearer <ID_TOKEN>` header using the `firebase-admin` SDK (`adminAuth.verifyIdToken(token)`).

---

## 2. API Proxy Security (Express)
All sensitive integrations (Bybit, TradingView, Google Gemini) are routed through the backend proxy (`server.ts`) to avoid exposing API keys to the client browser.
- **Secrets Encryption:** API keys are loaded strictly from the server's `.env` environment variables and are never bundled in frontend Vite builds.
- **Payload Validation:** Express request bodies must be validated and sanitized to prevent:
  - **NoSQL Injection:** Sanitizing special characters in query inputs.
  - **SSRF (Server-Side Request Forgery):** Forcing `/api/trade/webhook-send` to validate destination domains if restricted to specific MT5/Bybit hosts.

---

## 3. Database Security Rules (Firestore)
Data access is restricted at the database level using `firestore.rules`.
- **Default Policy:** Deny all read and write operations by default.
- **User Isolation:** Users may only read, create, update, or delete documents inside their own user path: `databases/{database}/documents/users/{userId}/**` where `userId == request.auth.uid`.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 4. Input & Output Sanitization
- **XSS Prevention:** HTML inputs are sanitized before rendering. React's default behavior escapes values inside `{}` by default, preventing raw HTML injection unless `dangerouslySetInnerHTML` is used.
- **SQL Injection Prevention:** Although the database is Firestore (NoSQL), any future Postgres/Drizzle integrations must use parameterized queries (Drizzle ORM uses parameterized bindings by default).
- **Bybit API Security:** The Bybit trading execution endpoint signature must be recalculated strictly on the server-side (`HMAC-SHA256`) using timestamp-matching to prevent replay attacks.
