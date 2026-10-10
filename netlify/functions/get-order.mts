import { authorizedOrder, failure, json, publicOrder, requireMethod } from '../lib/payments.js';

export default async (request: Request) => {
  try {
    requireMethod(request, 'GET');
    const order = await authorizedOrder(request, new URL(request.url).searchParams.get('id'));
    return json({ order: publicOrder(order) });
  } catch (error) { return failure(error); }
};
