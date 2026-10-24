const express = require('express');
const cors = require('cors');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const fail = (status, message) => Object.assign(new Error(message), { status });

function createApp(options = {}) {
  const app = express();
  const secret = options.secret ?? process.env.PAYSTACK_SECRET_KEY ?? '';
  const webUrl = (options.webUrl ?? process.env.PUBLIC_WEB_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  const fetcher = options.fetch ?? global.fetch;
  const catalog = options.catalog ?? require('./catalog.json');
  const storePath = options.storePath ?? process.env.PAYSTACK_ORDER_STORE_PATH ?? path.join(__dirname, 'data', 'paystack-orders.json');
  // Single-process test-mode storage. Replace this with a database before live payments.
  let records = {};
  const initializing = new Map();
  if (fs.existsSync(storePath)) records = JSON.parse(fs.readFileSync(storePath, 'utf8'));
  function save() {
    fs.mkdirSync(path.dirname(storePath), { recursive: true });
    fs.writeFileSync(`${storePath}.tmp`, JSON.stringify(records), { mode: 0o600 });
    fs.renameSync(`${storePath}.tmp`, storePath);
  }
  function requireKey() {
    if (!/^sk_test_[A-Za-z0-9_-]+$/.test(secret)) throw fail(503, 'Configure a Paystack test secret key. Live payments require production storage and authentication.');
  }
  async function paystack(endpoint, body) {
    const response = await fetcher(`https://api.paystack.co${endpoint}`, {
      method: body ? 'POST' : 'GET',
      headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(15000),
    });
    const payload = await response.json();
    if (!response.ok || payload.status !== true) throw fail(502, 'Paystack could not complete this request. Please retry.');
    return payload.data;
  }
  function tokenOf(req) {
    const token = String(req.headers.authorization || '').replace(/^Bearer /, '');
    if (!/^[a-f0-9]{64}$/.test(token)) throw fail(401, 'Checkout session is missing or invalid.');
    return token;
  }
  function quote(input) {
    if (!input || typeof input !== 'object') throw fail(400, 'Checkout details required.');
    const { items, customer, deliveryAddress, note = '' } = input;
    if (!customer || typeof customer.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email) || customer.email.length > 254 || typeof customer.id !== 'string' || !customer.id || customer.id.length > 100 || typeof customer.name !== 'string' || !customer.name.trim() || customer.name.length > 120) throw fail(400, 'Valid buyer details are required.');
    if (typeof deliveryAddress !== 'string' || deliveryAddress.trim().length < 5 || deliveryAddress.length > 500 || typeof note !== 'string' || note.length > 1000) throw fail(400, 'Enter a valid delivery address and a shorter note.');
    if (!Array.isArray(items) || !items.length || items.length > 30) throw fail(400, 'Choose 1–30 products.');
    const quantities = new Map();
    for (const item of items) {
      if (!item || typeof item.productId !== 'string' || !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 100) throw fail(400, 'Quantities must be whole numbers between 1 and 100.');
      quantities.set(item.productId, (quantities.get(item.productId) || 0) + item.quantity);
    }
    const groups = new Map();
    for (const [productId, quantity] of quantities) {
      const product = catalog.find(p => p.id === productId);
      if (!product || !product.inStock || quantity > product.stockCount) throw fail(409, 'A product is unavailable or exceeds its stock. Local-only listings must be published to the server catalogue first.');
      const unitPrice = Math.round(product.price * 100);
      if (!Number.isSafeInteger(unitPrice) || unitPrice < 1) throw fail(409, 'This product has an invalid price.');
      if (!groups.has(product.sellerId)) groups.set(product.sellerId, { sellerId: product.sellerId, sellerName: product.sellerName, items: [] });
      groups.get(product.sellerId).items.push({ productId, quantity, name: product.name, unitPrice: unitPrice / 100, sellerId: product.sellerId, sellerName: product.sellerName });
    }
    const orders = [...groups.values()].map(group => {
      const subtotal = group.items.reduce((sum, item) => sum + Math.round(item.unitPrice * 100) * item.quantity, 0);
      const commission = Math.round(subtotal * 0.05), deliveryFee = 250000;
      return { ...group, buyerId: customer.id, buyerName: customer.name.trim(), subtotal: subtotal / 100, commission: commission / 100, deliveryFee: deliveryFee / 100, total: (subtotal + commission + deliveryFee) / 100, deliveryAddress: deliveryAddress.trim(), note: note.trim() };
    });
    const amount = orders.reduce((sum, order) => sum + Math.round(order.total * 100), 0);
    if (!Number.isSafeInteger(amount) || amount < 1 || amount > 1000000000) throw fail(400, 'Order amount is outside the supported range.');
    return { orders, amount, email: customer.email.trim().toLowerCase() };
  }
  function applySuccess(record, transaction) {
    if (transaction.status !== 'success' || transaction.reference !== record.reference || transaction.amount !== record.amount || transaction.currency !== 'NGN' || transaction.domain !== 'test' || transaction.customer?.email?.toLowerCase() !== record.email) throw fail(409, 'Payment details did not match this order. No order was marked paid.');
    if (record.status !== 'paid') {
      record.status = 'paid'; record.paidAt = new Date().toISOString(); record.transactionId = String(transaction.id); save();
    }
  }
  function receipt(record) {
    return { reference: record.reference, status: record.status, amount: record.amount, currency: 'NGN', orders: record.status === 'paid' ? record.orders.map((order, i) => ({
      ...order, id: `${record.reference}-${i + 1}`, paymentReference: record.reference,
      status: 'Pending Seller Confirmation', paymentStatus: 'Paid', createdAt: record.createdAt,
      timeline: [{ label: 'Payment verified by Paystack (test mode)', date: record.paidAt }],
    })) : [] };
  }
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Content-Type-Options', 'nosniff');
    if (req.get('origin') && req.get('origin') !== new URL(webUrl).origin) return res.status(403).json({ error: 'Origin not allowed.' });
    next();
  });
  app.use(cors({ origin: new URL(webUrl).origin, methods: ['GET', 'POST'], allowedHeaders: ['Content-Type', 'Authorization'] }));
  // Verify the signature against the original bytes before parsing JSON.
  app.post('/api/paystack/webhook', express.raw({ type: 'application/json', limit: '128kb' }), (req, res, next) => {
    try {
      requireKey();
      const signature = req.get('x-paystack-signature') || '';
      if (!Buffer.isBuffer(req.body) || !/^[a-f0-9]{128}$/i.test(signature)) throw fail(401, 'Invalid webhook signature.');
      const expected = crypto.createHmac('sha512', secret).update(req.body).digest();
      if (!crypto.timingSafeEqual(Buffer.from(signature, 'hex'), expected)) throw fail(401, 'Invalid webhook signature.');
      const event = JSON.parse(req.body.toString('utf8'));
      if (event.event === 'charge.success' && records[event.data?.reference]) applySuccess(records[event.data.reference], event.data);
      res.sendStatus(200);
    } catch (error) { next(error); }
  });
  app.use(express.json({ limit: '32kb' }));
  app.get('/api/paystack/health', (req, res) => res.json({ provider: 'Paystack', mode: /^sk_test_/.test(secret) ? 'test' : 'unconfigured' }));
  app.post('/api/paystack/initialize', async (req, res, next) => {
    try {
      requireKey();
      const token = tokenOf(req), reference = `farmyn_${hash(token).slice(0, 32)}`;
      const fingerprint = hash(JSON.stringify(req.body));
      let record = records[reference];
      if (record && record.fingerprint !== fingerprint) throw fail(409, 'This session belongs to different order details. Start a new checkout.');
      if (!record) {
        const calculated = quote(req.body);
        for (const order of calculated.orders) for (const item of order.items) {
          const used = Object.values(records).filter(r => ['pending', 'paid'].includes(r.status)).reduce((sum, r) => sum + r.orders.flatMap(o => o.items).filter(i => i.productId === item.productId).reduce((n, i) => n + i.quantity, 0), 0);
          if (used + item.quantity > catalog.find(p => p.id === item.productId).stockCount) throw fail(409, 'Stock is reserved by another checkout. Choose a different product or contact support.');
        }
        record = { ...calculated, reference, tokenHash: hash(token), fingerprint, status: 'pending', createdAt: new Date().toISOString() };
        records[reference] = record; save();
      }
      if (record.status === 'paid') return res.json({ ...receipt(record), alreadyPaid: true });
      if (!record.authorizationUrl) {
        if (!initializing.has(reference)) initializing.set(reference, (async () => {
          const payment = await paystack('/transaction/initialize', { email: record.email, amount: record.amount, currency: 'NGN', reference, callback_url: `${webUrl}/checkout/complete`, metadata: { source: 'farmyn' } });
          const destination = new URL(payment.authorization_url);
          if (destination.protocol !== 'https:' || destination.hostname !== 'checkout.paystack.com' || payment.reference !== reference) throw fail(502, 'Unexpected checkout destination.');
          record.authorizationUrl = destination.href; save();
        })());
        try { await initializing.get(reference); } finally { initializing.delete(reference); }
      }
      res.json({ reference, authorizationUrl: record.authorizationUrl, amount: record.amount, currency: 'NGN' });
    } catch (error) { next(error); }
  });
  app.get('/api/paystack/verify/:reference', async (req, res, next) => {
    try {
      requireKey();
      const token = tokenOf(req), record = records[req.params.reference];
      if (!record || record.tokenHash !== hash(token)) throw fail(404, 'Checkout session not found. Use the browser where you started payment.');
      const transaction = await paystack(`/transaction/verify/${encodeURIComponent(record.reference)}`);
      if (transaction.status === 'success') applySuccess(record, transaction);
      res.json({ ...receipt(record), gatewayStatus: transaction.status });
    } catch (error) { next(error); }
  });
  app.use((error, req, res, next) => {
    const status = error.status || 500;
    res.status(status).json({ error: status === 500 ? 'The payment service could not complete this request.' : error.message });
  });
  return app;
}
if (require.main === module) createApp().listen(process.env.PORT || 3001, process.env.HOST || '127.0.0.1', () => console.log('Farmyn Paystack test backend ready'));
module.exports = { createApp };
