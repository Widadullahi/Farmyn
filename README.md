# Farmyn Nigeria

Farmyn is a listing and chat marketplace for farm products. Sellers publish products with photos, prices, available quantities, and locations. Buyers browse those listings and message sellers directly to discuss availability, pickup, delivery, and payment.

Farmyn does not process payments, hold funds, create orders, or provide escrow.

Seller promotion is optional: a seven-day listing Boost costs ₦2,000, a seven-day category banner costs ₦5,000, and a seven-day homepage banner costs ₦10,000. Sellers submit requests from their dashboard and the super-admin schedules approved campaigns.

## Development

Use Node.js 22 or newer. Run `npm ci`, copy each app's `.env.example` to a private `.env`, provide the AWS staging values, and run `npm run dev`.

- `apps/web`: Next.js frontend with marketplace, seller profiles, dashboards, and chat.
- `apps/backend`: Express API using Cognito, DynamoDB, and private S3 product photos.
- `npm test --workspace backend`: backend validation tests.
- `npm run lint --workspace web`: frontend lint.
- `npm run build`: production build.

The API stores profiles, listings, sessions, and mirrored chat messages in DynamoDB. Product photos are stored privately in S3 and returned through short-lived signed URLs.

The private `/admin` console shows platform metrics, users, listings, promotion requests, active boosts, scheduled banners, and an activity log. Configure `ADMIN_EMAIL` and a scrypt `ADMIN_PASSWORD_HASH` only in the backend environment.
