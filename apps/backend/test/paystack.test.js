const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { createApp } = require('../sandbox');

const secret = 'sk_test_farmyn_test_fixture';
const token = 'a'.repeat(64);
const body = {
  customer: { id: 'buyer-qa', name: 'QA Buyer', email: 'qa@example.test' },
  items: [{ productId: 'prod-tomatoes', quantity: 2 }], deliveryAddress: 'QA Test Address, Lagos', note: '',
};
async function fixture(t, overrides = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'farmyn-paystack-'));
  const storePath = path.join(directory, 'orders.json');
  const state = { calls: [], transaction: null };
  const fakeFetch = async (url, options) => {
    state.calls.push({ url, options });
    if (url.endsWith('/initialize')) {
      const request = JSON.parse(options.body);
      return { ok: true, json: async () => ({ status: true, data: { reference: request.reference, authorization_url: 'https://checkout.paystack.com/qa-session' } }) };
    }
    return { ok: true, json: async () => ({ status: true, data: state.transaction }) };
  };
  const app = createApp({ secret, storePath, webUrl: 'http://localhost:3000', fetch: fakeFetch, ...overrides });
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  t.after(async () => {
    await new Promise(resolve => server.close(resolve));
    // Only the exact per-test temporary directory created above is removed.
    assert.ok(directory.startsWith(path.join(os.tmpdir(), 'farmyn-paystack-')));
    fs.rmSync(directory, { recursive: true, force: true });
  });
  const initialize = (input = body, session = token) => fetch(`${base}/api/paystack/initialize`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session}` }, body: JSON.stringify(input) });
  const verify = (reference, session = token) => fetch(`${base}/api/paystack/verify/${reference}`, { headers: { Authorization: `Bearer ${session}` } });
  const success = result => ({ id: 123, reference: result.reference, status: 'success', amount: result.amount, currency: 'NGN', domain: 'test', customer: { email: body.customer.email } });
  const webhook = (event, signature) => {
    const raw = JSON.stringify(event);
    return fetch(`${base}/api/paystack/webhook`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-paystack-signature': signature ?? crypto.createHmac('sha512', secret).update(raw).digest('hex') }, body: raw });
  };
  return { base, initialize, verify, success, webhook, state, storePath, fakeFetch };
}

test('no secret and live keys fail closed', async t => {
  for (const key of ['', 'sk_live_not_enabled']) {
    const f = await fixture(t, { secret: key });
    assert.equal((await f.initialize()).status, 503);
    assert.equal(f.state.calls.length, 0);
  }
});
test('server prices override submitted totals, with one delivery fee per seller', async t => {
  const f = await fixture(t);
  const response = await f.initialize({ ...body, amount: 1, items: [...body.items, { productId: 'prod-rice', quantity: 1, price: 1 }] });
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.amount, 9425000); // (17,000 + 68,000) + 5% + two ₦2,500 deliveries.
  assert.equal(JSON.parse(f.state.calls[0].options.body).amount, result.amount);
  assert.equal(JSON.parse(f.state.calls[0].options.body).callback_url, 'http://localhost:3000/checkout/complete');
  assert.equal(fs.readFileSync(f.storePath, 'utf8').includes(token), false);
});
test('invalid address, negative/fractional/excess quantities and unpublished products are rejected', async t => {
  const f = await fixture(t);
  const inputs = [
    { ...body, deliveryAddress: '' },
    ...[-1, 1.5, 99].map(quantity => ({ ...body, items: [{ productId: 'prod-tomatoes', quantity }] })),
    { ...body, items: [{ productId: 'client-only-product', quantity: 1 }] },
  ];
  for (const input of inputs) assert.ok([400, 409].includes((await f.initialize(input)).status));
  assert.equal(f.state.calls.length, 0);
});
test('retries and concurrent initialization reuse a single transaction', async t => {
  const f = await fixture(t);
  const responses = await Promise.all([f.initialize(), f.initialize()]);
  const results = await Promise.all(responses.map(r => r.json()));
  assert.equal(results[0].reference, results[1].reference);
  await f.initialize();
  assert.equal(f.state.calls.length, 1);
  assert.equal((await f.initialize({ ...body, note: 'changed' })).status, 409);
});
test('stock reserved by one checkout cannot be double-sold', async t => {
  const f = await fixture(t);
  const input = { ...body, items: [{ productId: 'prod-tomatoes', quantity: 32 }] };
  assert.equal((await f.initialize(input)).status, 200);
  assert.equal((await f.initialize(body, 'b'.repeat(64))).status, 409);
});
test('a reference alone cannot read another checkout', async t => {
  const f = await fixture(t), result = await (await f.initialize()).json();
  assert.equal((await f.verify(result.reference, 'b'.repeat(64))).status, 404);
  assert.equal((await fetch(`${f.base}/api/paystack/verify/${result.reference}`)).status, 401);
});
test('pending or failed provider transactions do not create paid orders', async t => {
  const f = await fixture(t), result = await (await f.initialize()).json();
  for (const status of ['pending', 'failed', 'abandoned']) {
    f.state.transaction = { ...f.success(result), status };
    const receipt = await (await f.verify(result.reference)).json();
    assert.equal(receipt.status, 'pending'); assert.deepEqual(receipt.orders, []);
  }
});
test('wrong amount, currency, email, mode or reference never marks an order paid', async t => {
  const f = await fixture(t), result = await (await f.initialize()).json();
  for (const patch of [{ amount: 1 }, { currency: 'USD' }, { customer: { email: 'other@example.test' } }, { domain: 'live' }, { reference: 'unrelated' }]) {
    f.state.transaction = { ...f.success(result), ...patch };
    assert.equal((await f.verify(result.reference)).status, 409);
  }
  assert.equal(JSON.parse(fs.readFileSync(f.storePath))[result.reference].status, 'pending');
});
test('successful verification returns stable server-owned order IDs across retries', async t => {
  const f = await fixture(t), result = await (await f.initialize()).json();
  f.state.transaction = f.success(result);
  const first = await (await f.verify(result.reference)).json();
  const again = await (await f.verify(result.reference)).json();
  assert.equal(first.status, 'paid'); assert.equal(first.orders[0].paymentStatus, 'Paid');
  assert.equal(first.orders[0].buyerId, body.customer.id);
  assert.deepEqual(first.orders, again.orders);
});
test('unsigned and forged webhook requests are rejected', async t => {
  const f = await fixture(t), result = await (await f.initialize()).json();
  assert.equal((await f.webhook({ event: 'charge.success', data: f.success(result) }, 'bad')).status, 401);
  assert.equal((await f.webhook({ event: 'charge.success', data: f.success(result) }, '0'.repeat(128))).status, 401);
  assert.equal(JSON.parse(fs.readFileSync(f.storePath))[result.reference].status, 'pending');
});
test('signed success webhooks are idempotent; mismatched amounts are rejected', async t => {
  const f = await fixture(t), result = await (await f.initialize()).json();
  assert.equal((await f.webhook({ event: 'charge.success', data: { ...f.success(result), amount: 1 } })).status, 409);
  const event = { event: 'charge.success', data: f.success(result) };
  assert.equal((await f.webhook(event)).status, 200);
  const before = fs.readFileSync(f.storePath, 'utf8');
  assert.equal((await f.webhook(event)).status, 200);
  assert.equal(fs.readFileSync(f.storePath, 'utf8'), before);
});
test('paid records survive a backend restart', async t => {
  const f = await fixture(t), result = await (await f.initialize()).json();
  await f.webhook({ event: 'charge.success', data: f.success(result) });
  const restarted = createApp({ secret, storePath: f.storePath, fetch: f.fakeFetch });
  const server = restarted.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  f.state.transaction = f.success(result);
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/paystack/verify/${result.reference}`, { headers: { Authorization: `Bearer ${token}` } });
  assert.equal((await response.json()).status, 'paid');
});
test('foreign browser origins and removed wallet routes are unavailable', async t => {
  const f = await fixture(t);
  const response = await fetch(`${f.base}/api/paystack/health`, { headers: { Origin: 'https://foreign.example' } });
  assert.equal(response.status, 403);
  assert.equal((await fetch(`${f.base}/api/bmoni/balances/other`)).status, 404);
});
