const crypto = require('node:crypto');
const { checkout } = require('./validation');
const error = (status, message) => Object.assign(new Error(message), { status });
const hash = v => crypto.createHash('sha256').update(v).digest('hex');
const put = item => ({ Put: { Item: item, ConditionExpression: 'attribute_not_exists(pk)' } });
class Payments {
  constructor(store, secret, webUrl, fetcher = fetch) { Object.assign(this, { store, secret, webUrl, fetcher }); }
  requireKey() {
    // Keep the live gate closed until hosted acceptance, settlement and refund procedures are approved.
    if (!/^sk_test_[A-Za-z0-9_-]+$/.test(this.secret || '')) throw error(503, 'Payments are not available yet.');
  }
  async provider(path, body) {
    this.requireKey();
    const r = await this.fetcher(`https://api.paystack.co${path}`, { method: body ? 'POST' : 'GET', headers: { Authorization: `Bearer ${this.secret}`, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(15000) });
    const json = await r.json(); if (!r.ok || json.status !== true) throw error(502, 'The payment provider is unavailable. Please retry.'); return json.data;
  }
  async initialize(user, body, key) {
    this.requireKey(); if (user.role !== 'buyer') throw error(403, 'Only buyers can check out.');
    if (!/^[a-f0-9]{64}$/.test(key || '')) throw error(400, 'A valid checkout session is required.');
    const input = checkout.parse(body), reference = `farmyn_${hash(user.id + key).slice(0, 32)}`, fingerprint = hash(JSON.stringify(input));
    let record = await this.store.get('PAYMENT', reference);
    if (record && (record.data.buyerId !== user.id || record.data.fingerprint !== fingerprint)) throw error(409, 'Checkout details have changed. Start a new checkout.');
    if (!record) {
      const quantities = new Map(); for (const item of input.items) quantities.set(item.productId, (quantities.get(item.productId) || 0) + item.quantity);
      const groups = new Map();
      for (const [id, quantity] of quantities) {
        const product = (await this.store.get('PRODUCT', id))?.data;
        if (!product || !product.inStock || product.stockCount < quantity || quantity > 100) throw error(409, 'A product is no longer available in this quantity.');
        if (!groups.has(product.sellerId)) groups.set(product.sellerId, { sellerId: product.sellerId, sellerName: product.sellerName, items: [] });
        groups.get(product.sellerId).items.push({ productId: id, quantity, name: product.name, unitPrice: product.price, sellerId: product.sellerId, sellerName: product.sellerName });
      }
      const orders = [...groups.values()].map((group, i) => {
        const cents = group.items.reduce((n, p) => n + Math.round(p.unitPrice * 100) * p.quantity, 0), fee = Math.round(cents * 0.05);
        return { ...group, id: `${reference}-${i + 1}`, buyerId: user.id, buyerName: user.name, deliveryAddress: input.deliveryAddress, note: input.note, subtotal: cents / 100, commission: fee / 100, deliveryFee: 2500, total: (cents + fee + 250000) / 100, paymentReference: reference, paymentStatus: 'Paid', status: 'Pending Seller Confirmation', createdAt: new Date().toISOString() };
      });
      record = { pk: 'PAYMENT', sk: reference, data: { reference, buyerId: user.id, email: user.email, fingerprint, amount: orders.reduce((n, o) => n + Math.round(o.total * 100), 0), orders, status: 'pending' } };
      if (record.data.amount > 1000000000) throw error(400, 'This order exceeds the checkout limit.');
      try { await this.store.put(record, 'attribute_not_exists(pk)'); } catch (e) { if (e.name !== 'ConditionalCheckFailedException') throw e; record = await this.store.get('PAYMENT', reference); }
    }
    const data = record.data;
    if (data.status === 'paid') return { reference, alreadyPaid: true };
    if (data.status === 'review') throw error(409, 'This payment needs support review. Do not pay again.');
    if (!data.authorizationUrl) {
      // Deterministic reference prevents duplicate charges when initialization is retried.
      const p = await this.provider('/transaction/initialize', { email: data.email, amount: data.amount, currency: 'NGN', reference, callback_url: `${this.webUrl}/checkout/complete`, metadata: { source: 'farmyn' } });
      const url = new URL(p.authorization_url); if (url.protocol !== 'https:' || url.hostname !== 'checkout.paystack.com' || p.reference !== reference) throw error(502, 'Unexpected payment destination.');
      // Update only the URL: a concurrent webhook must never be overwritten with pending state.
      try { await this.store.transact([{ Update: { Key: { pk: 'PAYMENT', sk: reference }, UpdateExpression: 'SET #d.authorizationUrl = :url', ConditionExpression: '#d.#s = :pending', ExpressionAttributeNames: { '#d': 'data', '#s': 'status' }, ExpressionAttributeValues: { ':url': url.href, ':pending': 'pending' } } }]); } catch (e) { if (e.name !== 'TransactionCanceledException') throw e; }
      data.authorizationUrl = url.href;
    }
    return { reference, authorizationUrl: data.authorizationUrl, amount: data.amount, currency: 'NGN' };
  }
  async verify(reference, user) {
    const record = await this.store.get('PAYMENT', reference);
    if (!record || record.data.buyerId !== user.id) throw error(404, 'Payment not found.');
    const transaction = await this.provider(`/transaction/verify/${encodeURIComponent(reference)}`);
    if (transaction.status === 'success') await this.apply(record, transaction);
    const data = (await this.store.get('PAYMENT', reference)).data;
    return { reference, status: data.status, orders: data.status === 'paid' ? data.orders : [], gatewayStatus: transaction.status };
  }
  async apply(record, transaction) {
    const d = record.data;
    if (transaction.reference !== d.reference || transaction.status !== 'success' || transaction.amount !== d.amount || transaction.currency !== 'NGN' || transaction.domain !== 'test' || transaction.customer?.email?.toLowerCase() !== d.email.toLowerCase()) throw error(409, 'Payment details did not match this order.');
    if (['paid', 'review'].includes(d.status)) return;
    const orders = d.orders.map(o => ({ ...o, timeline: [{ label: 'Payment verified by Paystack (test mode)', date: new Date().toISOString() }] }));
    const entries = [{ Update: { Key: { pk: 'PAYMENT', sk: d.reference }, UpdateExpression: 'SET #d.#s = :paid, #d.orders = :orders', ConditionExpression: '#d.#s = :pending', ExpressionAttributeNames: { '#d': 'data', '#s': 'status' }, ExpressionAttributeValues: { ':paid': 'paid', ':pending': 'pending', ':orders': orders } } }];
    for (const o of orders) {
      entries.push(put({ pk: `ORDERS#${o.buyerId}`, sk: o.id, data: o }), put({ pk: `ORDERS#${o.sellerId}`, sk: o.id, data: o }));
      for (const p of o.items) entries.push({ Update: { Key: { pk: 'PRODUCT', sk: p.productId }, UpdateExpression: 'SET #d.stockCount = #d.stockCount - :quantity', ConditionExpression: '#d.stockCount >= :quantity AND #d.price = :price AND #d.sellerId = :seller', ExpressionAttributeNames: { '#d': 'data' }, ExpressionAttributeValues: { ':quantity': p.quantity, ':price': p.unitPrice, ':seller': o.sellerId } } });
    }
    try { await this.store.transact(entries); }
    catch (e) {
      if (e.name !== 'TransactionCanceledException') throw e;
      const fresh = await this.store.get('PAYMENT', d.reference); if (fresh.data.status === 'paid') return;
      // A paid transaction with stock conflict is retained for operator review, never silently discarded or fulfilled twice.
      try { await this.store.transact([{ Update: { Key: { pk: 'PAYMENT', sk: d.reference }, UpdateExpression: 'SET #d.#s = :review', ConditionExpression: '#d.#s = :pending', ExpressionAttributeNames: { '#d': 'data', '#s': 'status' }, ExpressionAttributeValues: { ':review': 'review', ':pending': 'pending' } } }, put({ pk: 'PAYMENT_REVIEW', sk: d.reference, data: { reference: d.reference, reason: 'Inventory changed after payment; resolve or refund through Paystack.', createdAt: new Date().toISOString() } })]); } catch (race) { if (race.name !== 'TransactionCanceledException') throw race; }
      console.error(JSON.stringify({ event: 'payment_review_required', reference: d.reference }));
    }
  }
}
module.exports = { Payments, error, hash };
