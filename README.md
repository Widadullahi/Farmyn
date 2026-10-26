# Farmyn Nigeria

Farm produce marketplace with an AWS-backed API, Cognito accounts, DynamoDB records, private S3 photos and Paystack test checkout.

## Status

Production preparation is implemented; AWS deployment and hosted acceptance are still required. Live payments are blocked. There is no seeded catalogue, demo account, sample order, fake review or local account fallback.

Read [PRODUCTION_SETUP.md](PRODUCTION_SETUP.md) for the architecture, deployment procedure and release requirements. The earlier local-file payment adapter exists only for regression tests and is excluded from the Lambda package.

## Development

Use Node.js 22 or newer. Run `npm ci`, copy each app's `.env.example` to a private `.env`, and supply your AWS staging outputs. Run `npm run dev`. Without AWS configuration the API fails closed and the site shows a setup message.

- `apps/web`: Next.js frontend; server-side `API_ORIGIN` forwards `/api` to the backend.
- `apps/backend`: Express API; deployed to Lambda behind API Gateway with the SAM template in `infra/`.
- `npm test --workspace backend`: API security and payment regression tests with isolated test doubles.
- `npm run lint --workspace web`: frontend lint checks.
- `npm run build`: production frontend build.

Private environment files, payment test records and generated builds are ignored. The deployment build copies an explicit source allowlist so private local files cannot enter the Lambda archive.
