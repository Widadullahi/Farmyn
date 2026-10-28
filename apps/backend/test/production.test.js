const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createApp, publicUser } = require('../app');
const { hash, Payments } = require('../payments');
const { Store } = require('../store');
const { product, registration, checkout } = require('../validation');
const token = 'a'.repeat(64);
const owner = { id: 'buyer-a', name: 'Test Buyer', email: 'buyer@example.test', phone: '+2348000000000', role: 'buyer', emailVerified: true, verified: false, joinedAt: '2026-01-01T00:00:00Z', location: 'Lagos' };
class MemoryStore {
  constructor(rows = []) { this.rows = new Map(rows.map(r => [`${r.pk}|${r.sk}`, structuredClone(r)])); this.transactions = []; }
  async get(pk, sk) { return structuredClone(this.rows.get(`${pk}|${sk}`)); }
  async put(row, condition) { if (condition && this.rows.has(`${row.pk}|${row.sk}`)) throw Object.assign(new Error(), { name: 'ConditionalCheckFailedException' }); this.rows.set(`${row.pk}|${row.sk}`, structuredClone(row)); }
  async list(pk) { return [...this.rows.values()].filter(r => r.pk === pk).map(r => structuredClone(r)); }
  async delete(pk, sk) { this.rows.delete(`${pk}|${sk}`); }
  async limit() {}
  async transact(entries) { this.transactions.push(entries); for (const e of entries) if (e.Put) await this.put(e.Put.Item); }
}
async function fixture(t, options = {}) {
  const store = options.store || new MemoryStore([{ pk: 'PROFILE', sk: owner.id, data: owner }, { pk: 'SESSION', sk: hash(token), userId: owner.id, expiresAt: Date.now() / 1000 + 600 }, { pk: 'SELLER', sk: 'seller-a', data: { id: 'seller-a', role: 'seller', name: 'Test Store', verified: false } }]);
  const calls = [];
  const cognito = { send: async command => { calls.push(command); if (command.constructor.name === 'InitiateAuthCommand') return { AuthenticationResult: { AccessToken: 'fixture-access-token' } }; if (command.constructor.name === 'GetUserCommand') return { UserAttributes: Object.entries({ sub: owner.id, name: owner.name, email: owner.email, email_verified: 'true', 'custom:role': 'buyer' }).map(([Name, Value]) => ({ Name, Value })) }; return {}; } };
  const app = createApp({ table: 'fixture', clientId: 'fixture', bucket: 'fixture', webUrl: 'https://farmyn.example', secret: 'sk_test_fixture', ...options.config }, { store, cognito, s3: { send: async () => ({}) } });
  const server = app.listen(0, '127.0.0.1'); await new Promise(r => server.once('listening', r));
  t.after(() => new Promise(r => server.close(r)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = (path, body, opts = {}) => fetch(base + path, { method: body === undefined ? 'GET' : 'POST', headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), Origin: 'https://farmyn.example', Cookie: `farmyn_session=${token}`, ...opts.headers }, ...(body === undefined ? {} : { body: JSON.stringify(body) }), ...opts, ...(opts.headers ? { headers: { 'Content-Type': 'application/json', Origin: 'https://farmyn.example', Cookie: `farmyn_session=${token}`, ...opts.headers } } : {}) });
  return { store, calls, request, app };
}
test('unconfigured AWS fails closed without seeded marketplace data', async t => { const f = await fixture(t, { config: { table: '' } }); assert.equal((await f.request('/api/health')).status, 503); assert.equal((await f.request('/api/state')).status, 503); assert.equal((await f.request('/api/auth/login', { email: owner.email, password: 'x' })).status, 503); });
test('anonymous state exposes only public seller profiles, never buyer emails or phone numbers', async t => { const f = await fixture(t); const state = await (await f.request('/api/state', undefined, { headers: { Cookie: '' } })).json(); assert.equal(state.currentUserId, null); assert.equal(state.users.length, 1); assert.equal(state.users[0].email, undefined); assert.equal(JSON.stringify(state).includes(owner.email), false); assert.deepEqual(state.orders, []); });
test('authenticated state contains own orders and messages only', async t => { const f = await fixture(t); await f.store.put({ pk: 'ORDERS#another-buyer', sk: 'private', data: { id: 'private', buyerId: 'another-buyer' } }); const state = await (await f.request('/api/state')).json(); assert.equal(state.currentUserId, owner.id); assert.deepEqual(state.orders, []); assert.equal(JSON.stringify(state).includes('another-buyer'), false); });
test('expired and revoked sessions cannot mutate data', async t => { const f = await fixture(t); await f.store.put({ pk: 'SESSION', sk: hash(token), userId: owner.id, expiresAt: 1 }); assert.equal((await f.request('/api/messages', {})).status, 401); await f.store.put({ pk: 'SESSION', sk: hash(token), userId: owner.id, authVersion: 0, expiresAt: Date.now() / 1000 + 600 }); await f.store.put({ pk: 'PROFILE', sk: owner.id, data: { ...owner, authVersion: 1 } }); assert.equal((await f.request('/api/messages', {})).status, 401); });
test('cross-origin writes are rejected before authentication and state mutation', async t => { const f = await fixture(t); assert.equal((await f.request('/api/auth/logout', {}, { headers: { Origin: 'https://attacker.example' } })).status, 403); assert.ok(await f.store.get('SESSION', hash(token))); });
test('Cognito registration sends a code, never returns a password or a fake code', async t => { const f = await fixture(t); const v = { ...owner, password: 'ValidPassword123!' }; delete v.id; delete v.verified; delete v.emailVerified; delete v.joinedAt; const r = await f.request('/api/auth/register', v); assert.equal(r.status, 201); const body = await r.json(); assert.equal(Object.keys(body).join(','), 'message'); assert.equal(f.calls[0].constructor.name, 'SignUpCommand'); assert.equal((await f.store.list('PROFILE')).length, 1); });
test('Cognito login returns a random HttpOnly Secure cookie; token is stored only as a hash', async t => { const f = await fixture(t); const r = await f.request('/api/auth/login', { email: owner.email, password: 'ValidPassword123!' }); assert.equal(r.status, 200); const cookie = r.headers.get('set-cookie'); assert.match(cookie, /HttpOnly/); assert.match(cookie, /Secure/); assert.match(cookie, /SameSite=Lax/); const value = cookie.match(/farmyn_session=([a-f0-9]{64})/)[1]; assert.notEqual(value, token); assert.ok(await f.store.get('SESSION', hash(value))); assert.equal(JSON.stringify(await f.store.list('SESSION')).includes(value), false); const data = await r.json(); assert.equal(data.user.password, undefined); });
test('logout revokes the server session and expires its cookie', async t => { const f = await fixture(t); const r = await f.request('/api/auth/logout', {}); assert.equal(r.status, 200); assert.equal(await f.store.get('SESSION', hash(token)), undefined); assert.match(r.headers.get('set-cookie'), /Max-Age=0/); });
test('buyer cannot publish products, patch seller identity, or request ads', async t => { const f = await fixture(t); assert.equal((await f.request('/api/products', {})).status, 403); assert.equal((await f.request('/api/profile', {}, { method: 'PATCH' })).status, 403); assert.equal((await f.request('/api/ads', {})).status, 403); });
test('only the listing owner can edit validated details without replacing the photo', async t => {
  const f = await fixture(t);
  const path = '/api/products/listing-a';
  const input = { name: 'Fresh red tomatoes', category: 'Vegetables', price: 2400, stockCount: 0, unit: 'basket', minimumOrder: '1 basket', location: 'Lagos', description: 'Fresh tomatoes from our farm.' };
  await f.store.put({ pk: 'PRODUCT', sk: 'listing-a', data: { ...input, id: 'listing-a', sellerId: owner.id, sellerName: 'Test Farm', image: `products/${owner.id}/photo.jpg`, stockCount: 4, inStock: true } });
  assert.equal((await f.request(path, input, { method: 'PATCH' })).status, 403);
  await f.store.put({ pk: 'PROFILE', sk: owner.id, data: { ...owner, role: 'seller' } });
  assert.equal((await f.request(path, { ...input, sellerId: 'forged' }, { method: 'PATCH' })).status, 400);
  assert.equal((await f.request(path, { ...input, price: -1 }, { method: 'PATCH' })).status, 400);
  assert.equal((await f.request(path, { ...input, oldPrice: 2000 }, { method: 'PATCH' })).status, 400);
  assert.equal((await f.request('/api/products/someone-elses-listing', input, { method: 'PATCH' })).status, 404);
  assert.equal((await f.request(path, { ...input, oldPrice: 3000 }, { method: 'PATCH' })).status, 200);
  const updated = (await f.store.get('PRODUCT', 'listing-a')).data;
  assert.equal(updated.image, `products/${owner.id}/photo.jpg`);
  assert.equal(updated.stockCount, 0);
  assert.equal(updated.inStock, false);
  assert.equal(updated.oldPrice, 3000);
  assert.equal(updated.version, 1);
  assert.equal((await f.request(path, { ...input, oldPrice: null }, { method: 'PATCH' })).status, 200);
  assert.equal((await f.store.get('PRODUCT', 'listing-a')).data.oldPrice, undefined);
});
test('unowned orders and undelivered products cannot be updated or reviewed', async t => { const f = await fixture(t); assert.equal((await f.request('/api/orders/private/advance', {})).status, 404); assert.equal((await f.request('/api/reviews', { productId: 'private', rating: 5, comment: 'Good product' })).status, 403); });
test('messages are written atomically for sender and receiver with server-owned identities', async t => { const f = await fixture(t); await f.store.put({ pk: 'PROFILE', sk: 'seller-a', data: { ...owner, id: 'seller-a', role: 'seller', name: 'Test Seller' } }); const r = await f.request('/api/messages', { receiverId: 'seller-a', message: '<b>Hello</b>' }); assert.equal(r.status, 201); const mine = await f.store.list(`MESSAGES#${owner.id}`), theirs = await f.store.list('MESSAGES#seller-a'); assert.equal(mine.length, 1); assert.deepEqual(mine[0].data, theirs[0].data); assert.equal(mine[0].data.senderId, owner.id); assert.equal((await f.request('/api/messages', { receiverId: 'seller-a', message: 'Hi', senderId: 'forged' })).status, 400); });
test('product enquiries identify the listing in both inboxes and reject unrelated listings', async t => {
  const f = await fixture(t);
  await f.store.put({ pk: 'PROFILE', sk: 'seller-a', data: { ...owner, id: 'seller-a', role: 'seller', name: 'Test Seller' } });
  await f.store.put({ pk: 'PRODUCT', sk: 'tomatoes', data: { id: 'tomatoes', sellerId: 'seller-a', name: 'Fresh Tomatoes' } });
  await f.store.put({ pk: 'PRODUCT', sk: 'other', data: { id: 'other', sellerId: 'another-seller', name: 'Other Product' } });
  assert.equal((await f.request('/api/messages', { receiverId: 'seller-a', message: 'Is this available?', productId: 'other' })).status, 400);
  assert.equal((await f.request('/api/messages', { receiverId: 'seller-a', message: 'Is this available?', productId: 'missing' })).status, 400);
  assert.equal((await f.request('/api/messages', { receiverId: 'seller-a', message: 'Is this available?', productId: 'tomatoes', productName: 'Forged' })).status, 400);
  assert.equal((await f.request('/api/messages', { receiverId: 'seller-a', message: 'Is this available?', productId: 'tomatoes' })).status, 201);
  const mine = (await f.store.list(`MESSAGES#${owner.id}`))[0].data;
  const theirs = (await f.store.list('MESSAGES#seller-a'))[0].data;
  assert.deepEqual(mine, theirs);
  assert.equal(mine.productId, 'tomatoes');
  assert.equal(mine.productName, 'Fresh Tomatoes');
});
test('signed webhook is mandatory, and live payments remain blocked', async t => { const f = await fixture(t); assert.equal((await f.request('/api/paystack/webhook', {})).status, 401); const live = new Payments(f.store, 'sk_live_disallowed', 'https://farmyn.example'); assert.throws(() => live.requireKey(), /not available/); });
test('payment records belong to authenticated buyers; arbitrary references reveal nothing', async t => { const f = await fixture(t); await f.store.put({ pk: 'PAYMENT', sk: `farmyn_${'b'.repeat(32)}`, data: { buyerId: 'another-buyer' } }); assert.equal((await f.request(`/api/paystack/verify/farmyn_${'b'.repeat(32)}`)).status, 404); });
test('schema rejects forged prices, role escalation, remote image URLs, invalid money and quantities', () => {
  assert.equal(registration.safeParse({ ...owner, role: 'admin' }).success, false);
  assert.equal(checkout.safeParse({ items: [{ productId: 'x', quantity: -1 }], deliveryAddress: 'Lagos', amount: 1 }).success, false);
  assert.equal(product.safeParse({ image: 'https://attacker.example/image.svg', price: 0.001 }).success, false);
  assert.equal(publicUser(owner).email, undefined); assert.equal(publicUser(owner).phone, undefined);
});
test('DynamoDB queries paginate and transactions use the configured table', async () => { const calls = []; const client = { send: async c => { calls.push(c); if (c.constructor.name === 'QueryCommand') return calls.length === 1 ? { Items: [{ sk: 'one' }], LastEvaluatedKey: { pk: 'PRODUCT', sk: 'one' } } : { Items: [{ sk: 'two' }] }; return {}; } }; const store = new Store('farmyn-table', client); assert.equal((await store.list('PRODUCT')).length, 2); assert.ok(calls[1].input.ExclusiveStartKey); await store.transact([{ Put: { Item: { pk: 'A', sk: 'B' } } }]); assert.equal(calls[2].input.TransactItems[0].Put.TableName, 'farmyn-table'); });
test('payment mismatch cannot create an order or change stock', async () => { const store = new MemoryStore(); const p = new Payments(store, 'sk_test_fixture', 'https://farmyn.example'); await assert.rejects(p.apply({ data: { reference: 'ref', amount: 100, email: owner.email } }, { status: 'success', reference: 'ref', amount: 1, currency: 'NGN', domain: 'test', customer: { email: owner.email } }), /did not match/); assert.equal(store.transactions.length, 0); });
test('disguised SVG and script uploads are rejected before S3 storage', async t => {
  const f = await fixture(t); await f.store.put({ pk: 'PROFILE', sk: owner.id, data: { ...owner, role: 'seller' } });
  const response = await f.request('/api/uploads', undefined, { method: 'POST', headers: { 'Content-Type': 'image/jpeg' }, body: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>') });
  assert.equal(response.status, 400);
});
test('seller cannot grant a verification badge or change their role through profile updates', async t => {
  const f = await fixture(t); await f.store.put({ pk: 'PROFILE', sk: owner.id, data: { ...owner, role: 'seller' } });
  assert.equal((await f.request('/api/profile', { storeName: 'Store', location: 'Lagos', bio: '', verified: true, role: 'admin' }, { method: 'PATCH' })).status, 400);
});
class AtomicPaymentStore extends MemoryStore {
  async transact(entries) {
    const next = new Map(structuredClone([...this.rows]));
    const cancelled = () => { throw Object.assign(new Error('condition failed'), { name: 'TransactionCanceledException' }); };
    for (const e of entries) {
      if (e.Put) { const row = e.Put.Item, key = `${row.pk}|${row.sk}`; if (e.Put.ConditionExpression && next.has(key)) cancelled(); next.set(key, structuredClone(row)); }
      else if (e.Update) {
        const u = e.Update, key = `${u.Key.pk}|${u.Key.sk}`, row = next.get(key), v = u.ExpressionAttributeValues;
        if (u.Key.pk === 'PAYMENT') { if (row.data.status !== v[':pending']) cancelled(); if (v[':url']) row.data.authorizationUrl = v[':url']; else { row.data.status = v[':paid'] || v[':review']; if (v[':orders']) row.data.orders = v[':orders']; } }
        else if (u.Key.pk === 'PRODUCT') { if (!row || row.data.stockCount < v[':quantity'] || row.data.price !== v[':price'] || row.data.sellerId !== v[':seller']) cancelled(); row.data.stockCount -= v[':quantity']; }
      }
    }
    this.transactions.push(entries); this.rows = next;
  }
}
test('AWS checkout prices and buyer identity come from server records; concurrent finalization creates one order', async () => {
  const store = new AtomicPaymentStore([{ pk: 'PRODUCT', sk: 'product-a', data: { id: 'product-a', name: 'Produce', price: 1000, inStock: true, stockCount: 2, sellerId: 'seller-a', sellerName: 'Store' } }]);
  const provider = async (url, options) => { const body = JSON.parse(options.body); return { ok: true, json: async () => ({ status: true, data: { reference: body.reference, authorization_url: 'https://checkout.paystack.com/fixture' } }) }; };
  const payments = new Payments(store, 'sk_test_fixture', 'https://farmyn.example', provider);
  const result = await payments.initialize(owner, { items: [{ productId: 'product-a', quantity: 1 }], deliveryAddress: 'Test address, Lagos' }, 'b'.repeat(64));
  assert.equal(result.amount, 355000);
  const record = await store.get('PAYMENT', result.reference), transaction = { status: 'success', reference: result.reference, amount: result.amount, currency: 'NGN', domain: 'test', customer: { email: owner.email } };
  await Promise.all([payments.apply(record, transaction), payments.apply(record, transaction)]);
  assert.equal((await store.list(`ORDERS#${owner.id}`)).length, 1); assert.equal((await store.list('ORDERS#seller-a')).length, 1);
  assert.equal((await store.get('PRODUCT', 'product-a')).data.stockCount, 1); assert.equal((await store.get('PAYMENT', result.reference)).data.status, 'paid');
});
test('stock conflicts retain a paid transaction for support review without creating fulfillment orders', async () => {
  const order = { id: 'order-a', buyerId: owner.id, sellerId: 'seller-a', items: [{ productId: 'product-a', quantity: 1, unitPrice: 1000 }] };
  const record = { pk: 'PAYMENT', sk: 'ref', data: { reference: 'ref', buyerId: owner.id, email: owner.email, amount: 100000, orders: [order], status: 'pending' } };
  const store = new AtomicPaymentStore([record, { pk: 'PRODUCT', sk: 'product-a', data: { stockCount: 0, price: 1000, sellerId: 'seller-a' } }]);
  const payments = new Payments(store, 'sk_test_fixture', 'https://farmyn.example');
  await payments.apply(record, { reference: 'ref', status: 'success', amount: 100000, currency: 'NGN', domain: 'test', customer: { email: owner.email } });
  assert.equal((await store.get('PAYMENT', 'ref')).data.status, 'review'); assert.equal((await store.list('PAYMENT_REVIEW')).length, 1); assert.equal((await store.list(`ORDERS#${owner.id}`)).length, 0);
});
test('deployment build allows only source and dependencies, never private environment files or sandbox fixtures', () => {
  const fs = require('node:fs'), path = require('node:path');
  const make = fs.readFileSync(path.join(__dirname, '../Makefile'), 'utf8'); assert.match(make, /build-Api:/); assert.equal(make.includes('cp -r'), false); assert.equal(make.includes('.env'), false); assert.equal(make.includes('sandbox.js'), false); assert.equal(make.includes('test/'), false);
});
test('Lambda HTTP API v2 adapter preserves authentication cookies and response status', async t => {
  const f = await fixture(t); const handler = require('@codegenie/serverless-express')({ app: f.app });
  const response = await handler({ version: '2.0', routeKey: 'ANY /{proxy+}', rawPath: '/api/auth/login', rawQueryString: '', headers: { host: 'api.example', origin: 'https://farmyn.example', 'content-type': 'application/json' }, requestContext: { accountId: 'fixture', apiId: 'fixture', domainName: 'api.example', requestId: 'fixture', stage: '$default', http: { method: 'POST', path: '/api/auth/login', protocol: 'HTTP/1.1', sourceIp: '127.0.0.1', userAgent: 'fixture' } }, body: JSON.stringify({ email: owner.email, password: 'ValidPassword123!' }), isBase64Encoded: false }, { getRemainingTimeInMillis: () => 30000 });
  assert.equal(response.statusCode, 200); assert.ok(response.cookies.some(c => /farmyn_session=/.test(c) && /HttpOnly/.test(c) && /Secure/.test(c)));
  assert.equal(JSON.parse(response.body).user.id, owner.id);
});
