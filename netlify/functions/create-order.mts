import { randomBytes } from 'node:crypto';
import { getDatabase } from '../../db/index.js';
import { orders } from '../../db/schema.js';
import { failure, hashToken, json, newToken, priceCart, publicOrder, readJson, requireMethod, validateCustomer } from '../lib/payments.js';

export default async (request: Request) => {
  try {
    requireMethod(request, 'POST');
    const body = await readJson(request);
    const customer = validateCustomer(body.customer);
    const items = priceCart(body.items);
    const token = newToken();
    const amount = items.reduce((total, item) => total + item.price * item.qty * 100, 0);
    const [order] = await getDatabase().insert(orders).values({ id: `GC-${randomBytes(12).toString('hex')}`, tokenHash: hashToken(token), customer, items, amount }).returning();
    return json({ order: publicOrder(order), token }, 201);
  } catch (error) { return failure(error); }
};
