import { eq, and, isNull } from 'drizzle-orm';
import { getDatabase } from '../../db/index.js';
import { orders } from '../../db/schema.js';
import { authorizedOrder, failure, json, liveSecret, PaymentError, paystack, readJson, requireMethod } from '../lib/payments.js';

export default async (request: Request) => {
  try {
    requireMethod(request, 'POST');
    liveSecret();
    const { id } = await readJson(request);
    const order = await authorizedOrder(request, id);
    if (order.status !== 'pending') throw new PaymentError('This order has already been paid or submitted for review.', 409);
    if (order.authorizationUrl) return json({ authorizationUrl: order.authorizationUrl });
    const reference = `PAY-${order.id}`;
    if (!order.reference) {
      const [started] = await getDatabase().update(orders).set({ reference, method: 'paystack' }).where(and(eq(orders.id, order.id), eq(orders.status, 'pending'), isNull(orders.reference))).returning();
      if (!started) throw new PaymentError('The payment method changed. Please refresh before paying.', 409);
    }
    const callback = new URL('/payment.html', request.url);
    callback.searchParams.set('order', order.id);
    const data = await paystack('/transaction/initialize', {
      method: 'POST',
      body: JSON.stringify({ email: order.customer.email, amount: order.amount, currency: order.currency, reference, callback_url: callback.toString(), metadata: { order_id: order.id } }),
    });
    const destination = new URL(data.authorization_url);
    if (destination.protocol !== 'https:' || destination.hostname !== 'checkout.paystack.com') throw new PaymentError('Invalid payment destination.', 502);
    await getDatabase().update(orders).set({ authorizationUrl: destination.toString() }).where(eq(orders.id, order.id));
    return json({ authorizationUrl: destination.toString() });
  } catch (error) { return failure(error); }
};
