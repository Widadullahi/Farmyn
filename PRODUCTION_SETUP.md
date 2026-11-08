# Production setup

Farmyn uses Cognito for accounts, DynamoDB for profiles, listings, sessions and messages, S3 for private product photos, and Lambda/API Gateway for the Express API.

Deploy `infra/template.yaml` with the exact HTTPS frontend origin and an operations email. Configure the frontend with the resulting API origin. Register separate buyer and seller accounts, verify email flows, publish a listing with a real image, and confirm that listing-linked chat works in two browser sessions.

The stack creates a `farmyn/admin` Secrets Manager secret with a random placeholder, so admin sign-in is refused until you store the real hash: `aws secretsmanager put-secret-value --secret-id farmyn/admin --secret-string '{"ADMIN_PASSWORD_HASH":"<salt>:<hash>"}'`. The hash must use the `salt:hash` scrypt format documented in `apps/backend/.env.example`. `AdminEmail` defaults to the template value. The API reads the secret on cold start, so new values apply within minutes. Confirm that `/admin` creates an HttpOnly, SameSite=Strict session and that an unauthenticated request to `/api/admin/overview` returns 401.

Farmyn is a communication marketplace. Buyers and sellers arrange payment, pickup, and delivery outside the platform. The product should not claim to verify transactions, protect funds, provide escrow, or track fulfillment.
