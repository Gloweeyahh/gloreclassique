import { getStore } from '@netlify/blobs';
import { and, eq, isNull } from 'drizzle-orm';
import { getDatabase } from '../../db/index.js';
import { orders } from '../../db/schema.js';
import { authorizedOrder, failure, json, notifyOrder, PaymentError, publicOrder, requireMethod, verifyOrder } from '../lib/payments.js';

export default async (request: Request) => {
  try {
    requireMethod(request, 'POST');
    if (Number(request.headers.get('content-length')) > 4500000) throw new PaymentError('Upload a file smaller than 3 MB.', 413);
    const form = await request.formData();
    const order = await authorizedOrder(request, form.get('id'));
    if (order.status === 'awaiting_review') {
      try { await notifyOrder(order); } catch {}
      return json({ order: publicOrder(order) });
    }
    if (order.status !== 'pending') throw new PaymentError('This order has already been paid.', 409);
    if (order.reference) {
      const verified = await verifyOrder(order);
      if (verified.status === 'paid') throw new PaymentError('Your Paystack payment is already confirmed. Refresh this page.', 409);
      throw new PaymentError('A Paystack transaction has already started. Contact the store before making a separate bank transfer.', 409);
    }
    const file = form.get('proofFile');
    if (!(file instanceof File) || file.size === 0 || file.size > 3 * 1024 * 1024) throw new PaymentError('Upload a JPG, PNG, or PDF smaller than 3 MB.');
    const bytes = Buffer.from(await file.arrayBuffer());
    const extension = bytes.subarray(0, 5).toString() === '%PDF-' ? 'pdf' : bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ? 'png' : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 ? 'jpg' : null;
    if (!extension || !['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) throw new PaymentError('Only JPG, PNG, and PDF files are accepted.');
    const proofKey = `${order.id}.${extension}`;
    await getStore('payment-proofs').set(proofKey, bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer, { metadata: { contentType: file.type } });
    const [updated] = await getDatabase().update(orders).set({ status: 'awaiting_review', method: 'bank_transfer', proofKey }).where(and(eq(orders.id, order.id), eq(orders.status, 'pending'), isNull(orders.reference))).returning();
    if (!updated) throw new PaymentError('This order changed. Please refresh.', 409);
    try { await notifyOrder(updated); } catch {}
    return json({ order: publicOrder(updated) });
  } catch (error) { return failure(error); }
};
