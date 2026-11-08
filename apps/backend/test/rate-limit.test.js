const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../app');
const { hash } = require('../utils');

test('rate limits use the CloudFront viewer IP only when the edge secret matches', async t => {
  const keys = [];
  const store = { get: async () => undefined, put: async () => {}, list: async () => [], delete: async () => {}, transact: async () => {}, limit: async key => { keys.push(key); } };
  const cognito = { send: async () => ({}) };
  const app = createApp({ table: 'fixture', clientId: 'fixture', bucket: 'fixture', webUrl: 'https://farmyn.example', edgeSecret: 'edge-secret-fixture' }, { store, cognito, s3: { send: async () => ({}) } });
  const server = app.listen(0, '127.0.0.1'); await new Promise(r => server.once('listening', r));
  t.after(() => new Promise(r => server.close(r)));
  const forgot = headers => fetch(`http://127.0.0.1:${server.address().port}/api/auth/forgot`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://farmyn.example', ...headers }, body: JSON.stringify({ email: 'buyer@example.test' }) });
  const viewerKey = hash('ingress:forgot:203.0.113.7');

  assert.equal((await forgot({ 'x-farmyn-edge': 'edge-secret-fixture', 'x-farmyn-viewer-ip': '203.0.113.7' })).status, 200);
  assert.equal(keys[0], viewerKey);
  keys.length = 0;
  await forgot({ 'x-farmyn-edge': 'wrong-secret-value!', 'x-farmyn-viewer-ip': '203.0.113.7' });
  assert.ok(keys.length && keys[0] !== viewerKey);
  keys.length = 0;
  await forgot({ 'x-farmyn-viewer-ip': '203.0.113.7' });
  assert.ok(keys.length && keys[0] !== viewerKey);
});
