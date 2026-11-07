const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { createApp } = require('./app');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
async function configuredApp() {
  let edgeSecret = process.env.EDGE_SECRET || '';
  if (process.env.EDGE_SECRET_ARN) {
    const result = await new SecretsManagerClient({}).send(new GetSecretValueCommand({ SecretId: process.env.EDGE_SECRET_ARN }));
    edgeSecret = JSON.parse(result.SecretString).EDGE_SECRET;
  }
  return createApp({ table: process.env.DYNAMODB_TABLE, clientId: process.env.COGNITO_CLIENT_ID, bucket: process.env.PRODUCT_PHOTOS_BUCKET, webUrl: process.env.PUBLIC_WEB_URL?.replace(/\/$/, ''), adminEmail: process.env.ADMIN_EMAIL, adminPasswordHash: process.env.ADMIN_PASSWORD_HASH, edgeSecret });
}
if (require.main === module) configuredApp().then(app => app.listen(process.env.PORT || 3001, '127.0.0.1', () => console.log('Farmyn AWS API ready'))).catch(e => { console.error('Farmyn API startup failed:', e.name); process.exitCode = 1; });
module.exports = { configuredApp };
