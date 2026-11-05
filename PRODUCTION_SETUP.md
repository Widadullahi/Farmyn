# Production setup

Farmyn uses Cognito for accounts, DynamoDB for profiles, listings, sessions and messages, S3 for private product photos, and Lambda/API Gateway for the Express API.

Deploy `infra/template.yaml` with the exact HTTPS frontend origin and an operations email. Configure the frontend with the resulting API origin. Register separate buyer and seller accounts, verify email flows, publish a listing with a real image, and confirm that listing-linked chat works in two browser sessions.

Supply `AdminEmail` and `AdminPasswordHash` when deploying the SAM template. The password hash must use the `salt:hash` scrypt format documented in `apps/backend/.env.example`. Confirm that `/admin` creates an HttpOnly, SameSite=Strict session and that an unauthenticated request to `/api/admin/overview` returns 401.

Farmyn is a communication marketplace. Buyers and sellers arrange payment, pickup, and delivery outside the platform. The product should not claim to verify transactions, protect funds, provide escrow, or track fulfillment.
