# Paystack setup

The default API now uses authenticated Cognito accounts and DynamoDB, not the previous local-file prototype. Follow [PRODUCTION_SETUP.md](PRODUCTION_SETUP.md) for AWS deployment, the Secrets Manager key, same-origin API configuration, hosted webhook checks and the live-payment release gate.

Use a Paystack test secret key only. The AWS adapter rejects live keys until inventory reservation, refunds, reconciliation and seller settlement are implemented and approved. Earlier local sandbox transactions are regression fixtures, not production orders.
