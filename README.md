# Farmyn Nigeria

A farm-produce marketplace with buyer/seller dashboards, listings, local chat and Paystack hosted checkout.

## Development

- `apps/web`: Next.js frontend on port 3000.
- `apps/backend`: Express Paystack test integration on port 3001.

Install with `npm ci`, configure the two `.env.example` files, then run `npm run dev`.

See [PAYSTACK_SETUP.md](PAYSTACK_SETUP.md) for keys, callbacks, webhooks, testing and the remaining production requirements. Keep the secret key on the backend only.

The payment adapter is test-only. Marketplace accounts, chat and listings still use browser storage; payment records use a local server file and a test catalogue. A production database/authentication service and seller settlement workflow are required before accepting live payments.

## Commands

- `npm run dev`: start both apps.
- `npm run build`: build the frontend.
- `npm test --workspace backend`: test payment initialization and verification with a fake provider.
- `npm run lint`: run project linting (the inherited lint setup requires repair).
