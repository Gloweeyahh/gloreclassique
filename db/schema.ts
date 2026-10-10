import { integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export type OrderItem = { id: number; name: string; colorName: string; qty: number; price: number; image: string };
export type Customer = { name: string; email: string; phone: string; address: string; city: string; state: string; instructions: string };

export const orders = pgTable('orders', {
  id: text('id').primaryKey(),
  tokenHash: text('token_hash').notNull(),
  customer: jsonb('customer').$type<Customer>().notNull(),
  items: jsonb('items').$type<OrderItem[]>().notNull(),
  amount: integer('amount').notNull(),
  currency: text('currency').notNull().default('NGN'),
  status: text('status').notNull().default('pending'),
  method: text('method'),
  reference: text('reference').unique(),
  authorizationUrl: text('authorization_url'),
  proofKey: text('proof_key'),
  notifiedAt: timestamp('notified_at', { withTimezone: true }),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
