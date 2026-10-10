# Payment setup

Checkout now creates an order on Netlify before showing the payment page. Customers can either open Paystack’s hosted checkout or upload a receipt for a manual bank transfer. Prices are calculated on the server from the shared product catalog in `js/products.js`; browser-submitted prices are ignored. Amounts are stored in kobo and charged in NGN. Delivery costs are not included because the site has no configured delivery pricing; the checkout and payment pages explain that they are confirmed separately.

## Enable live Paystack payments

1. Activate your Paystack merchant account for live payments.
2. In Netlify **Project configuration → Environment variables**, privately add `PAYSTACK_SECRET_KEY` with Functions/runtime scope and the production context. Use the live secret from your Paystack dashboard. Never place the secret in HTML, JavaScript, source control, or a chat message. This integration deliberately rejects test credentials because live payments were requested. No public key is needed for server-initialized hosted checkout.
3. In your Paystack dashboard, configure the live webhook URL to `https://gloreclasique.netlify.app/.netlify/functions/paystack-webhook`. For another production domain, use that domain with the same path. Each transaction sets its own callback to the payment page on the site where checkout started.
4. Redeploy after configuring environment variables. Netlify provisions the database and applies the included order migration during deployment.
5. Place a small real order, complete payment, and check the confirmation page and merchant dashboard. This charges real money. Also check that the signed webhook confirms the order when the customer does not return to the site.

Until a live secret is configured, online payment is visibly unavailable and bank transfers remain available. Preview deployments should not receive live credentials unless you intentionally want real charges there.

## Order and receipt notifications

Privately configure `RESEND_API_KEY` with Functions/runtime scope to receive paid-order and bank-transfer receipt emails. Optionally set `ORDER_NOTIFICATION_EMAIL` to the store’s recipient address and `ORDER_FROM_EMAIL` to a sender on a Resend-verified domain. The existing store recipient and Resend onboarding sender are the defaults; the onboarding sender has Resend account restrictions, so use a verified sender for production.

Orders are persisted in Netlify Database even when email is unavailable. Proof files are stored privately in the `payment-proofs` Netlify Blobs store and attached to receipt emails when notifications are configured. Uploads accept JPG, PNG, or PDF, validate file signatures, and are limited to 3 MB. Successful uploads are labelled **awaiting store review**, never **paid**. Review the transfer in the bank account before fulfilling a manual order. This change does not add an administrative approval dashboard.

Email failures do not undo verified payments or saved receipts. Opening a confirmed Paystack order or receiving another verified webhook retries a notification that has not been recorded as sent. Retrying the manual receipt endpoint also retries its notification. Resend idempotency keys limit duplicate notifications.

## Payment safeguards

- Each order has a private access token stored in the checkout tab’s session storage; only its hash is persisted in the database. Order IDs alone cannot access an order or upload a receipt. Return in the same browser tab used for checkout. Losing that session requires contacting the store with the order reference rather than paying again.
- Paystack references are persisted before initialization. The amount, currency, reference, customer email, and live transaction domain must match during server-side verification before an order is marked paid.
- Webhook signatures are validated against the raw request body. Browser callbacks alone never count as proof of payment.
- A started Paystack transaction prevents submitting a separate manual transfer for the same order, reducing accidental double payments. Contact the store if an interrupted initialization cannot resume, rather than creating another charge or making a second transfer.
- The cart is retained on cancellation, API errors, and manual-review submissions. Purchased quantities are removed only after a verified Paystack payment. Payment completion does not decrement browser-local inventory. The existing catalog stock limits are checked when an order is created; this integration does not introduce shared inventory reservations across shoppers.

## Local checks

Run `npx tsc --noEmit` for server-side type checking and `node --check js/checkout-payment.js` for browser JavaScript syntax. Netlify development can be started with `/opt/buildhome/node-deps/node_modules/.bin/netlify dev --port 8889`. Do not use live payment credentials for routine development. The database migration is in `netlify/database/migrations/` and is applied by the platform at deployment, not by the frontend.
