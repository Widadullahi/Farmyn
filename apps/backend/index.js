const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { createApp } = require('./app');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
async function configuredApp() {
  let secret = process.env.PAYSTACK_SECRET_KEY || '';
  if (process.env.PAYSTACK_SECRET_ARN) {
    const result = await new SecretsManagerClient({}).send(new GetSecretValueCommand({ SecretId: process.env.PAYSTACK_SECRET_ARN }));
    secret = JSON.parse(result.SecretString).PAYSTACK_SECRET_KEY;
  }
  return createApp({ table: process.env.DYNAMODB_TABLE, clientId: process.env.COGNITO_CLIENT_ID, bucket: process.env.PRODUCT_PHOTOS_BUCKET, webUrl: process.env.PUBLIC_WEB_URL?.replace(/\/$/, ''), secret });
}
if (require.main === module) configuredApp().then(app => app.listen(process.env.PORT || 3001, '127.0.0.1', () => console.log('Farmyn AWS API ready'))).catch(e => { console.error('Farmyn API startup failed:', e.name); process.exitCode = 1; });
module.exports = { configuredApp };
