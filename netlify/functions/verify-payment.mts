import { authorizedOrder, failure, json, readJson, requireMethod, verifyOrder } from '../lib/payments.js';

export default async (request: Request) => {
  try {
    requireMethod(request, 'POST');
    const { id } = await readJson(request);
    const order = await authorizedOrder(request, id);
    return json({ order: await verifyOrder(order) });
  } catch (error) { return failure(error); }
};
