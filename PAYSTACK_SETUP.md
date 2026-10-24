# Paystack checkout for Farmyn

The previous wallet provider has been removed. Farmyn now initializes Paystack hosted checkout on the backend, verifies payments server-side, and accepts signed `charge.success` webhooks. The browser cannot set a paid status by submitting an amount or visiting a success URL.

## Current scope

This integration intentionally accepts **test secret keys only**. It is ready to configure and test, not to collect live funds. The existing marketplace still uses local browser accounts/listings; payment records use a single-process JSON file. Live keys fail closed until the application has production authentication, a shared catalogue/order database, reliable inventory/reservation management and operational refund/settlement handling.

Paystack payment collection is not delivery-controlled escrow. Confirming delivery does not initiate a bank payout. No raw wallet keys, BVNs, token wallets or old withdrawal routes remain.

## Configure locally

1. In the Paystack dashboard, switch to **Test mode**, then open **Settings → API Keys & Webhooks**.
2. Put the test secret key in `apps/backend/.env` as `PAYSTACK_SECRET_KEY=sk_test_...`. Keep it out of chat, frontend variables and Git. The private `.env` files have been removed from Git tracking and are ignored; only `.env.example` templates should be committed. Hosted redirect checkout does not require a public key in the frontend.
3. Set `PUBLIC_WEB_URL=http://localhost:3000` in that backend file. This controls the allowed browser origin and callback URL. Use exactly the hostname/port used by the browser; `localhost` and `127.0.0.1` are different origins.
4. Set `NEXT_PUBLIC_API_URL=http://localhost:3001` in `apps/web/.env`. This value is public and contains no key. Rebuild/restart the frontend after changing it.
5. Run `npm ci`, then `npm run dev` from the repository root.
6. Sign in to the demo buyer account, add a server-published product, enter a delivery address and select **Pay with Paystack**. Complete a Paystack **test** payment.

The server controls the payment currency (NGN), product price, 5% platform fee, quantity validation and delivery fee (₦2,500 per seller). Paystack receives the total in kobo. The delivery/commission totals shown in the cart follow the same grouping rules.

## Callback and webhook

- Callback: `<PUBLIC_WEB_URL>/checkout/complete`
- Webhook: `<backend-public-url>/api/paystack/webhook`

Configure the webhook in Paystack's test settings. A loopback URL cannot receive Paystack's remote webhooks. Use a publicly reachable test backend or your own development tunnel when testing notifications. Do not expose the development server casually.

On return from hosted checkout, Paystack supplies `reference` in the callback query string. The browser must also possess the original checkout session token, retained in sessionStorage. The backend matches the token, stored order, amount, reference, currency, test mode and customer email against Paystack's Verify API response. Only then are the server-owned order IDs imported into the local marketplace. Reloads do not duplicate orders or decrement stock twice. A failed or pending payment leaves the cart intact.

The webhook validates an HMAC-SHA512 signature using the exact raw request bytes and constant-time comparison before processing an event. Duplicate successful notifications are idempotent; mismatched values are rejected. Unknown transaction references do not create orders.

If you return in another browser or lose the checkout session, the app does not expose an order merely from its public payment reference. The production version needs authenticated, account-based recovery.

## Test adapter limitations

- `apps/backend/catalog.json` is the authoritative **test catalogue**. Local-only seller listings are rejected at checkout until published to this catalogue. A real shared product service is required before launch.
- Payment data is stored in `apps/backend/data/paystack-orders.json`, ignored by Git. It survives a local restart but is not suitable for serverless instances, concurrent workers or ephemeral hosting. `PAYSTACK_ORDER_STORE_PATH` can select a persistent test location.
- Pending checkout reservations currently do not expire automatically. Reusing an identical browser checkout session resumes the same transaction; abandoned reservations need operator review. Production requires durable reservation expiry, reconciliation and handling of late payment notifications.
- The storefront's account, chat and fulfillment data is still local to a browser. This migration fixes the logout/reload reset and hydration behavior, but it does not replace local authentication with a secure identity service.
- The persisted client order flags are presentation state, not a financial authority. Fulfillment must be driven by authenticated server records in the production version.
- Automatic seller transfers, refunds and dispute processing are not implemented. Do not treat buyer delivery confirmation as a money transfer.
- Old demo payment statuses are migrated to **Unverified** rather than treated as real Paystack receipts.
- The previous provider key was removed from the current environment template/configuration. If it was committed earlier, its old Git history still needs secret rotation at the issuer.

## Tests

Run `npm test --workspace backend` for HTTP-level tests using an isolated fake Paystack upstream. They cover pricing, stock validation/reservations, session access, retries, invalid payment details, signed/forged webhooks, repeated events and restart persistence. These tests do not contact Paystack or charge money.

## Deployment preparation

The existing Vercel frontend and the Express payment backend are separate services. Before testing a hosted deployment, set `NEXT_PUBLIC_API_URL` to the deployed test backend's HTTPS URL and `PUBLIC_WEB_URL` to the frontend's HTTPS origin, then rebuild. Set `HOST=0.0.0.0` on a hosted backend so the host can reach its HTTP listener. Store the secret in the backend host's secret manager. The integration has not been deployed by this change.

## Official references

- [Initialize hosted checkout](https://paystack.com/docs/payments/accept-payments/)
- [Verify transaction status](https://paystack.com/docs/payments/verify-payments/)
- [Validate webhook signatures](https://paystack.com/docs/payments/webhooks/)
