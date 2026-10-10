import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { and, eq, isNull, ne } from 'drizzle-orm';
import { getDatabase } from '../../db/index.js';
import { orders, type Customer, type OrderItem } from '../../db/schema.js';
import catalog from '../../js/products.js';
import { Resend } from 'resend';
import type {} from '@netlify/functions';

export class PaymentError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

export function environment(name: string) {
  return typeof Netlify !== 'undefined' ? Netlify.env.get(name) : process.env[name];
}

export function liveSecret() {
  const secret = environment('PAYSTACK_SECRET_KEY');
  if (!secret || !secret.startsWith('sk_live_')) {
    throw new PaymentError('Online payment is not configured yet. Please use bank transfer or contact the store.', 503);
  }
  return secret;
}

export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function newToken() {
  return randomBytes(32).toString('hex');
}

export function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } });
}

export function failure(error: unknown) {
  return json({ error: error instanceof PaymentError ? error.message : 'We could not complete this request. Please try again.' }, error instanceof PaymentError ? error.status : 500);
}

export function requireMethod(request: Request, method: string) {
  if (request.method !== method) throw new PaymentError('Method not allowed.', 405);
}

export async function readJson(request: Request) {
  const raw = await request.text();
  if (Buffer.byteLength(raw) > 32000) throw new PaymentError('Request is too large.', 413);
  try { return JSON.parse(raw); } catch { throw new PaymentError('Invalid request.'); }
}

export async function authorizedOrder(request: Request, id: unknown) {
  if (typeof id !== 'string' || !/^GC-[a-f0-9]{24}$/.test(id)) throw new PaymentError('Order not found.', 404);
  const token = request.headers.get('X-Order-Token') || '';
  if (!/^[a-f0-9]{64}$/.test(token)) throw new PaymentError('Order access expired. Please return to checkout.', 403);
  const database = getDatabase();
  const [order] = await database.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order || !timingSafeEqual(Buffer.from(hashToken(token)), Buffer.from(order.tokenHash))) {
    throw new PaymentError('Order not found or access denied.', 403);
  }
  return order;
}

export function publicOrder(order: typeof orders.$inferSelect) {
  return { id: order.id, items: order.items, amount: order.amount, currency: order.currency, status: order.status, method: order.method, onlineAvailable: Boolean(environment('PAYSTACK_SECRET_KEY')?.startsWith('sk_live_')) };
}

export function validateCustomer(input: Record<string, unknown>): Customer {
  if (!input || typeof input !== 'object') throw new PaymentError('Shipping details are required.');
  const customer = {} as Customer;
  for (const field of ['name', 'email', 'phone', 'address', 'city', 'state', 'instructions'] as const) {
    const value = input[field];
    if ((field !== 'instructions' && (typeof value !== 'string' || !value.trim())) || (value != null && typeof value !== 'string')) throw new PaymentError('Please complete your shipping details.');
    customer[field] = typeof value === 'string' ? value.trim() : '';
    if (customer[field].length > (field === 'instructions' ? 1000 : 300)) throw new PaymentError('Shipping details are too long.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) throw new PaymentError('Please enter a valid email address.');
  customer.email = customer.email.toLowerCase();
  return customer;
}

export function priceCart(input: unknown): OrderItem[] {
  if (!Array.isArray(input) || !input.length || input.length > 50) throw new PaymentError('Your cart is empty or too large.');
  const items: OrderItem[] = [];
  for (const entry of input) {
    if (!entry || !Number.isSafeInteger(entry.id) || !Number.isSafeInteger(entry.qty) || entry.qty < 1 || entry.qty > 50) throw new PaymentError('Invalid cart quantity.');
    const product = catalog.find(product => product.id === entry.id);
    const variant = product?.colors.find(color => color.name === entry.colorName);
    if (!product || !variant) throw new PaymentError('A cart item is unavailable. Please update your cart.');
    const existing = items.find(item => item.id === product.id && item.colorName === variant.name);
    const quantity = entry.qty + (existing?.qty || 0);
    if (quantity > variant.stock) throw new PaymentError(`${product.name} (${variant.name}) has insufficient stock. Please update your cart.`);
    if (existing) existing.qty = quantity;
    else items.push({ id: product.id, name: product.name, colorName: variant.name, qty: quantity, price: product.price, image: variant.image });
  }
  return items;
}

export async function paystack(path: string, options: RequestInit = {}) {
  const response = await fetch(`https://api.paystack.co${path}`, { ...options, headers: { Authorization: `Bearer ${liveSecret()}`, 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(15000) });
  const payload = await response.json();
  if (!response.ok || payload.status !== true) throw new PaymentError('Paystack could not process this request. Please retry or use bank transfer.', 502);
  return payload.data;
}

export async function notifyOrder(order: typeof orders.$inferSelect) {
  if (order.notifiedAt) return;
  const key = environment('RESEND_API_KEY');
  if (!key) return;
  const manual = order.status === 'awaiting_review';
  const text = [manual ? 'Bank transfer proof received — verify the transfer before fulfilling.' : 'Paystack payment verified.', `Order: ${order.id}`, `Total: NGN ${(order.amount / 100).toFixed(2)}`, ...Object.entries(order.customer).map(([field, value]) => `${field}: ${value}`), ...order.items.map(item => `${item.name} (${item.colorName}) x ${item.qty}`)].join('\n');
  const attachments = [];
  if (manual && order.proofKey) {
    const { getStore } = await import('@netlify/blobs');
    const file = await getStore({ name: 'payment-proofs', consistency: 'strong' }).get(order.proofKey, { type: 'arrayBuffer' });
    if (file) attachments.push({ filename: `payment-proof.${order.proofKey.split('.').pop()}`, content: Buffer.from(file) });
  }
  const result = await new Resend(key).emails.send({
    from: environment('ORDER_FROM_EMAIL') || 'Glore Classique <onboarding@resend.dev>',
    to: environment('ORDER_NOTIFICATION_EMAIL') || 'glowemeka@gmail.com',
    replyTo: order.customer.email,
    subject: `${manual ? 'Payment proof' : 'Paid order'} — ${order.id}`,
    text,
    attachments,
  }, { idempotencyKey: `${order.id}-${order.status}` });
  if (!result.error) await getDatabase().update(orders).set({ notifiedAt: new Date() }).where(and(eq(orders.id, order.id), eq(orders.status, order.status), isNull(orders.notifiedAt)));
}

export async function verifyOrder(order: typeof orders.$inferSelect) {
  if (order.status === 'paid') {
    try { await notifyOrder(order); } catch {}
    return publicOrder(order);
  }
  if (!order.reference) throw new PaymentError('No Paystack transaction exists for this order.');
  const transaction = await paystack(`/transaction/verify/${encodeURIComponent(order.reference)}`);
  if (transaction.status !== 'success') return publicOrder(order);
  if (transaction.domain !== 'live' || transaction.reference !== order.reference || transaction.amount !== order.amount || transaction.currency !== order.currency || transaction.customer?.email?.toLowerCase() !== order.customer.email) {
    throw new PaymentError('Payment details do not match this order. Please contact the store.', 409);
  }
  const [updated] = await getDatabase().update(orders).set({ status: 'paid', method: 'paystack', paidAt: new Date(), notifiedAt: null }).where(and(eq(orders.id, order.id), eq(orders.reference, order.reference), ne(orders.status, 'paid'))).returning();
  const paid = updated || (await getDatabase().select().from(orders).where(eq(orders.id, order.id)).limit(1))[0];
  if (!paid || paid.status !== 'paid') throw new PaymentError('Order changed. Please refresh.', 409);
  try { await notifyOrder(paid); } catch {}
  return publicOrder(paid);
}
