# Production setup

Farmyn uses Cognito for accounts, DynamoDB for profiles, listings, sessions and messages, S3 for private product photos, and Lambda/API Gateway for the Express API.

Deploy `infra/template.yaml` with the exact HTTPS frontend origin and an operations email. Configure the frontend with the resulting API origin. Register one account, verify its email, publish a listing, then use the same account to browse and chat. Confirm that listing-linked chat works between two different accounts in separate browser sessions.

The Cognito verification subject and message are branded as Farmyn by default. To replace the default Cognito sender with `Farmyn <no-reply@farmyn.ng>`, first verify that email address or the `farmyn.ng` domain in Amazon SES in the deployment region. Then deploy with `CognitoFromEmail=no-reply@farmyn.ng` and `CognitoEmailSourceArn` set to the verified SES identity ARN. If those parameters are left empty, Cognito's default sender remains in use.

The stack creates a `farmyn/admin` Secrets Manager secret with a random placeholder, so admin sign-in is refused until you store the real hash: `aws secretsmanager put-secret-value --secret-id farmyn/admin --secret-string '{"ADMIN_PASSWORD_HASH":"<salt>:<hash>"}'`. The hash must use the `salt:hash` scrypt format documented in `apps/backend/.env.example`. `AdminEmail` defaults to the template value. The API reads the secret on cold start, so new values apply within minutes. Confirm that `/admin` creates an HttpOnly, SameSite=Strict session and that an unauthenticated request to `/api/admin/overview` returns 401.

Farmyn is a communication marketplace. Buyers and sellers arrange payment, pickup, and delivery outside the platform. The product should not claim to verify transactions, protect funds, provide escrow, or track fulfillment.
