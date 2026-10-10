import { createHmac, timingSafeEqual } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { getDatabase } from '../../db/index.js';
import { orders } from '../../db/schema.js';
import { failure, json, liveSecret, PaymentError, requireMethod, verifyOrder } from '../lib/payments.js';

export default async (request: Request) => {
  try {
    requireMethod(request, 'POST');
    const body = await request.text();
    if (Buffer.byteLength(body) > 128000) throw new PaymentError('Payload too large.', 413);
    const signature = request.headers.get('x-paystack-signature') || '';
    const expected = createHmac('sha512', liveSecret()).update(body).digest('hex');
    if (!/^[a-f0-9]{128}$/.test(signature) || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) throw new PaymentError('Invalid webhook signature.', 401);
    const event = JSON.parse(body);
    if (event.event === 'charge.success' && typeof event.data?.reference === 'string') {
      const [order] = await getDatabase().select().from(orders).where(eq(orders.reference, event.data.reference)).limit(1);
      if (order) await verifyOrder(order);
    }
    return json({ received: true });
  } catch (error) { return failure(error); }
};
