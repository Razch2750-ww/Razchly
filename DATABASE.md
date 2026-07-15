# 🗄️ DATABASE.md — Razchly Database Schema & Specifications

This document describes the data storage structures used in Razchly across **Firebase Firestore** and **PostgreSQL (Drizzle ORM)**.

---

## 1. Firebase Firestore Schema (Primary Store)
All user data is stored inside nested document subcollections under the primary `/users/{userId}` parent document.

### Collection Layout
```
/users/{userId}
  ├── accounts/{accountId}
  ├── categories/{categoryId}
  ├── transactions/{transactionId}
  ├── investments/{investmentId}
  ├── loans/{loanId}
  └── attendance/{attendanceId}
```

### Document Schemas

#### `/users/{userId}/accounts/{accountId}`
Stores bank, cash, or e-wallet configurations.
- `id` (string): Unique identifier.
- `name` (string): Account display name (e.g., "BCA", "Grab Cash").
- `type` (string): `bank`, `e-wallet`, `cash`.
- `balance` (number): Current account balance.

#### `/users/{userId}/transactions/{transactionId}`
Logs cash inflows, outflows, or transfer events.
- `id` (string): Unique transaction ID.
- `accountId` (string): ID of the account affected.
- `type` (string): `income`, `expense`, `transfer`.
- `amount` (number): Transaction nominal.
- `date` (string): ISO-8601 Timestamp.
- `note` (string): Memo/note.
- `categoryId` (string): ID of matched category.

#### `/users/{userId}/investments/{investmentId}`
Tracks stocks, cryptos, and gold holdings.
- `id` (string): Unique investment ID.
- `category` (string): `saham`, `crypto`, `emas`.
- `code` (string): Asset code (e.g., `BBCA`, `BTCUSDT`).
- `qty` (number): Holding quantity.
- `price` (number): Purchase price.
- `date` (string): ISO timestamp of trade.

---

## 2. PostgreSQL Schema (Drizzle ORM Mapping)
The folder `src/db/schema.ts` defines the mapping for a relational migration path:

```typescript
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const accounts = pgTable('accounts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  balance: doublePrecision('balance').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  accountId: integer('account_id').references(() => accounts.id),
  type: text('type').notNull(),
  amount: doublePrecision('amount').notNull(),
  date: timestamp('date').notNull(),
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow(),
});
```
