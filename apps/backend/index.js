const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { createApp } = require('./app');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
// In AWS, secrets come from Secrets Manager (EDGE_SECRET_ARN / ADMIN_SECRET_ARN);
// locally the plain EDGE_SECRET / ADMIN_PASSWORD_HASH variables are used instead.
async function fromSecret(arn, key, fallback) {
  if (!arn) return fallback || '';
  const result = await new SecretsManagerClient({}).send(new GetSecretValueCommand({ SecretId: arn }));
  return JSON.parse(result.SecretString)[key] || '';
}
async function configuredApp() {
  const [edgeSecret, adminPasswordHash] = await Promise.all([
    fromSecret(process.env.EDGE_SECRET_ARN, 'EDGE_SECRET', process.env.EDGE_SECRET),
    fromSecret(process.env.ADMIN_SECRET_ARN, 'ADMIN_PASSWORD_HASH', process.env.ADMIN_PASSWORD_HASH),
  ]);
  return createApp({ table: process.env.DYNAMODB_TABLE, clientId: process.env.COGNITO_CLIENT_ID, bucket: process.env.PRODUCT_PHOTOS_BUCKET, webUrl: process.env.PUBLIC_WEB_URL?.replace(/\/$/, ''), adminEmail: process.env.ADMIN_EMAIL, adminPasswordHash, edgeSecret });
}
if (require.main === module) configuredApp().then(app => app.listen(process.env.PORT || 3001, '127.0.0.1', () => console.log('Farmyn AWS API ready'))).catch(e => { console.error('Farmyn API startup failed:', e.name); process.exitCode = 1; });
module.exports = { configuredApp };
