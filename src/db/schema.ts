import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, doublePrecision } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const accounts = pgTable('accounts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  balance: doublePrecision('balance').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  accountId: integer('account_id')
    .references(() => accounts.id),
  type: text('type').notNull(),
  amount: doublePrecision('amount').notNull(),
  date: timestamp('date').notNull(),
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const investments = pgTable('investments', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  category: text('category').notNull(),
  code: text('code').notNull(),
  qty: doublePrecision('qty').notNull(),
  price: doublePrecision('price').notNull(),
  date: timestamp('date').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
