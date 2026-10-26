# Farmyn AWS release preparation

This branch removes the prototype data and replaces the browser-only marketplace with an AWS-backed API. It is a deployment candidate, **not an approved live-payment release**. No resources have been provisioned and no production data has been migrated.

## Architecture

- Next.js sends same-origin `/api/*` requests through a server-side rewrite. `API_ORIGIN` is the AWS HTTP API origin; it is never a browser credential.
- Cognito owns passwords, email verification and password recovery. The API issues a random, 8-hour HttpOnly/Secure/SameSite cookie. Only its hash is stored in DynamoDB. Logout revokes the session; password reset invalidates existing sessions. No passwords, account directories, orders or conversations are kept in browser storage.
- DynamoDB owns profiles, listings, orders, messages, bulk requests, reviews and payment records. Role and ownership checks run on the server. Transactional writes keep the buyer and seller copies of orders/messages consistent. There is no seed script or automatic demo catalogue.
- S3 holds private product photos. Uploads require a seller session, are capped at 3 MB, restricted to JPEG/PNG/WebP signatures, limited to 16 million pixels, and re-encoded as JPEG with metadata stripped. Read URLs expire after 15 minutes. Uploaded images cannot be supplied as arbitrary remote URLs.
- The SAM template enables encryption, private S3 access, DynamoDB point-in-time recovery, retained data resources, API throttling, expiring sessions, logs and email alerts. The custom build copies an explicit list of backend source files, never `.env`, local payment data, sandbox code or fixtures.

## Deploy to an AWS staging account first

1. Use an AWS account you control and choose its region. Install AWS CLI, SAM CLI and Docker on a trusted machine. Use an AWS SSO profile rather than saving account keys on a borrowed laptop.
2. Create a Secrets Manager JSON secret in that region with `PAYSTACK_SECRET_KEY` set to a Paystack **test** secret. Keep the ARN for deployment. If using a customer-managed KMS key, add the narrowly scoped decrypt permission to the function role.
3. From `infra/`, run `sam validate --lint`, `sam build --use-container`, then `sam deploy --guided`. Supply the exact HTTPS frontend origin, secret ARN and an operations email. Review the proposed AWS resources and costs before executing the change set. Confirm the SNS email subscription.
4. Set the frontend's server-side `API_ORIGIN` to the stack's `ApiOrigin` output. Redeploy the frontend so the rewrite changes take effect. Match `PUBLIC_WEB_URL` to this exact frontend origin; preview deployments need their own isolated stack/origin.
5. Set the Paystack test webhook URL to `<ApiOrigin>/api/paystack/webhook`. The webhook validates its raw-body signature and independently verifies a successful transaction through Paystack before writing orders.
6. Verify Cognito's email sender limits and deliverability. Configure your verified SES sender and production email access before onboarding customers. The default Cognito email sender is suitable only for initial staging checks.
7. Register two real staging accounts through emailed verification: one buyer, one seller. Upload a genuine product photo and listing. Check sign-in, password recovery, logout, separate-browser messaging, bulk requests, authorized order progression, and delivered-order reviews. Seller verification stays false until a real operator reviews the business; customers cannot grant themselves a verification badge.
8. Complete Paystack's success, decline, cancellation, duplicate-callback and webhook tests against the hosted stack. Check logs, alert delivery, backup restore and retained resources. Confirm that the built Lambda archive contains no private files and that the Linux sharp dependency loads in the deployed runtime.

## Payment release gate

The new AWS payment adapter accepts test keys only. **Live keys fail closed.** The earlier local-file adapter is retained only as `sandbox.js` for regression tests and is excluded from deployment.

Prices, buyer identity and stock are read from server records. Successful payment finalization writes both order copies and conditionally deducts stock in one DynamoDB transaction. Duplicate callbacks cannot create another order. If stock or price changed before finalization, the payment is retained in `PAYMENT_REVIEW`, no fulfillment order is fabricated, and an operational alert is emitted. Support must resolve/refund these cases through Paystack. Never ask a customer to pay again for a recorded payment under review.

Before enabling live keys, implement and validate inventory reservation/expiry and automated refund/reconciliation handling, confirm the seller settlement and dispute process, and have the business owner approve the release. Live-key support is intentionally not a configuration switch in this candidate. An initialization timeout can require operator reconciliation because Paystack may already have accepted a deterministic reference; do not create blind replacement charges.

## Business information still required

Supply the real support channel, business identity, privacy terms, delivery responsibilities, cancellation/refund rules and seller onboarding/verification process. No fictional contact details, testimonials, ratings, farms or sales statistics have been substituted. Public statistics reflect actual stored records; new accounts and listings start empty.

## Local work and verification limits

Copy each app's `.env.example` to its private `.env`, fill the AWS staging outputs, and run the apps. An unconfigured backend returns an explicit setup-unavailable response, with no local demo fallback. Only guest cart items and a payment retry marker remain in browser storage. The old prototype store, including plaintext passwords and sample accounts, is discarded on first load; prototype records are not migrated into production.

Automated tests exercise API validation, authorization, privacy, session handling, mocked Cognito integration, storage command construction and payment controls. They do **not** prove a live AWS deployment. SAM validation, container packaging and hosted acceptance require AWS tooling/account access and remain separate release checks.

References: [Cognito authentication](https://docs.aws.amazon.com/cognito-user-identity-pools/latest/APIReference/API_InitiateAuth.html), [DynamoDB transactions](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/transaction-apis.html), [S3 signed URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html).
