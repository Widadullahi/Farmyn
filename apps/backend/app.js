const express = require('express');
const helmet = require('helmet');
const crypto = require('node:crypto');
const { z, text, registration, product, productUpdate, checkout, bulk } = require('./validation');
const { Payments, error, hash } = require('./payments');
const { Store } = require('./store');
const { CognitoIdentityProviderClient, SignUpCommand, ConfirmSignUpCommand, InitiateAuthCommand, GetUserCommand, ForgotPasswordCommand, ConfirmForgotPasswordCommand, ResendConfirmationCodeCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const sharp = require('sharp');
const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);
const publicUser = u => ({ id: u.id, name: u.name, role: u.role, storeName: u.storeName, location: u.location, bio: u.bio, verified: u.verified, emailVerified: true, joinedAt: u.joinedAt });
const sessionKey = req => { const match = (req.headers.cookie || '').match(/(?:^|;\s*)farmyn_session=([a-f0-9]{64})(?:;|$)/); return match ? hash(match[1]) : null; };

function createApp(config = {}, dependencies = {}) {
  const app = express(), ready = Boolean(config.table && config.clientId && config.bucket && config.webUrl);
  const store = dependencies.store || (ready ? new Store(config.table) : null);
  const cognito = dependencies.cognito || new CognitoIdentityProviderClient({});
  const s3 = dependencies.s3 || new S3Client({});
  const payments = new Payments(store, config.secret, config.webUrl, dependencies.fetch);
  const cookie = (value, age) => `farmyn_session=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}${config.webUrl?.startsWith('https:') ? '; Secure' : ''}`;
  app.disable('x-powered-by'); app.use(helmet());
  app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    if (req.path === '/api/paystack/webhook') return next();
    if (!['GET', 'HEAD'].includes(req.method) && req.get('origin') !== config.webUrl) return next(error(403, 'Request origin is not allowed.'));
    next();
  });
  app.get('/api/health', (req, res) => res.status(ready ? 200 : 503).json({ ready, service: 'Farmyn', storage: ready ? 'DynamoDB' : 'unconfigured' }));
  app.get('/api/paystack/health', (req, res) => res.json({ mode: ready && /^sk_test_/.test(config.secret || '') ? 'test' : 'unconfigured' }));
  app.use((req, res, next) => ready ? next() : next(error(503, 'Farmyn is being set up. Please check back shortly.')));
  app.post('/api/paystack/webhook', express.raw({ type: 'application/json', limit: '128kb' }), wrap(async (req, res) => {
    payments.requireKey(); const signature = req.get('x-paystack-signature') || '';
    if (!Buffer.isBuffer(req.body) || !/^[a-f0-9]{128}$/i.test(signature) || !crypto.timingSafeEqual(Buffer.from(signature, 'hex'), crypto.createHmac('sha512', config.secret).update(req.body).digest())) throw error(401, 'Invalid signature.');
    const payload = JSON.parse(req.body.toString());
    if (payload.event === 'charge.success') { const record = await store.get('PAYMENT', payload.data?.reference); if (record) { const verified = await payments.provider(`/transaction/verify/${encodeURIComponent(record.sk)}`); await payments.apply(record, verified); } }
    res.sendStatus(200);
  }));
  app.use(express.json({ limit: '32kb' }));
  app.use((req, res, next) => { (async () => { const key = sessionKey(req); if (key) { const session = await store.get('SESSION', key); if (session?.expiresAt > Date.now() / 1000) { const user = (await store.get('PROFILE', session.userId))?.data; if (user && (user.authVersion || 0) === (session.authVersion || 0)) req.user = user; } } })().then(() => next(), next); });
  const auth = role => (req, res, next) => !req.user ? next(error(401, 'Please sign in.')) : role && req.user.role !== role ? next(error(403, 'This action is not available for your account.')) : next();
  const throttle = async (req, kind, max = 10) => {
    const ip = req.socket.remoteAddress || 'unknown';
    if (!req.user) await store.limit(hash(`ingress:${kind}:${ip}`), 1000, 300);
    const identity = req.user?.id || (typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : ip);
    await store.limit(hash(`${kind}:${identity}`), max, 300);
  };
  const email = z.string().email().max(254).transform(v => v.toLowerCase());
  app.post('/api/auth/register', wrap(async (req, res) => {
    await throttle(req, 'register', 5); const v = registration.parse(req.body);
    await cognito.send(new SignUpCommand({ ClientId: config.clientId, Username: v.email, Password: v.password, UserAttributes: Object.entries({ email: v.email, name: v.name, phone_number: v.phone, 'custom:role': v.role, 'custom:location': v.location, ...(v.storeName ? { 'custom:storeName': v.storeName } : {}) }).map(([Name, Value]) => ({ Name, Value })) }));
    res.status(201).json({ message: 'Check your email for your verification code.' });
  }));
  app.post('/api/auth/confirm', wrap(async (req, res) => { await throttle(req, 'confirm'); const v = z.object({ email, code: z.string().regex(/^\d{6}$/) }).strict().parse(req.body); await cognito.send(new ConfirmSignUpCommand({ ClientId: config.clientId, Username: v.email, ConfirmationCode: v.code })); res.json({ message: 'Email verified. You can now sign in.' }); }));
  app.post('/api/auth/resend', wrap(async (req, res) => { await throttle(req, 'resend', 3); const v = z.object({ email }).strict().parse(req.body); await cognito.send(new ResendConfirmationCodeCommand({ ClientId: config.clientId, Username: v.email })); res.json({ message: 'If the account needs verification, a new code has been sent.' }); }));
  app.post('/api/auth/login', wrap(async (req, res) => {
    await throttle(req, 'login'); const v = z.object({ email, password: z.string().min(1).max(128) }).strict().parse(req.body);
    const r = await cognito.send(new InitiateAuthCommand({ ClientId: config.clientId, AuthFlow: 'USER_PASSWORD_AUTH', AuthParameters: { USERNAME: v.email, PASSWORD: v.password } }));
    if (!r.AuthenticationResult?.AccessToken) throw error(401, 'Additional account verification is required.');
    const result = await cognito.send(new GetUserCommand({ AccessToken: r.AuthenticationResult.AccessToken }));
    const a = Object.fromEntries(result.UserAttributes.map(x => [x.Name, x.Value]));
    if (a.email_verified !== 'true' || !['buyer', 'seller'].includes(a['custom:role'])) throw error(403, 'Verify your email before signing in.');
    let user = (await store.get('PROFILE', a.sub))?.data;
    if (!user) {
      user = { id: a.sub, name: a.name, email: a.email, phone: a.phone_number || '', role: a['custom:role'], location: a['custom:location'] || '', storeName: a['custom:storeName'], verified: false, emailVerified: true, joinedAt: new Date().toISOString() };
      try { await store.transact([{ Put: { Item: { pk: 'PROFILE', sk: user.id, data: user }, ConditionExpression: 'attribute_not_exists(pk)' } }, ...(user.role === 'seller' ? [{ Put: { Item: { pk: 'SELLER', sk: user.id, data: publicUser(user) } } }] : [])]); } catch (e) { if (e.name !== 'TransactionCanceledException') throw e; user = (await store.get('PROFILE', a.sub))?.data; }
    }
    await store.put({ pk: 'EMAIL', sk: hash(user.email.toLowerCase()), userId: user.id });
    const old = sessionKey(req); if (old) await store.delete('SESSION', old);
    const token = crypto.randomBytes(32).toString('hex'); await store.put({ pk: 'SESSION', sk: hash(token), userId: user.id, authVersion: user.authVersion || 0, expiresAt: Math.floor(Date.now() / 1000) + 28800 });
    res.set('Set-Cookie', cookie(token, 28800)); res.json({ message: 'Signed in successfully.', user });
  }));
  app.post('/api/auth/logout', wrap(async (req, res) => { const key = sessionKey(req); if (key) await store.delete('SESSION', key); res.set('Set-Cookie', cookie('', 0)); res.json({ message: 'Signed out.' }); }));
  app.post('/api/auth/forgot', wrap(async (req, res) => { await throttle(req, 'forgot', 3); const v = z.object({ email }).strict().parse(req.body); try { await cognito.send(new ForgotPasswordCommand({ ClientId: config.clientId, Username: v.email })); } catch (e) { if (e.name !== 'UserNotFoundException') throw e; } res.json({ message: 'If the account exists, a reset code has been sent.' }); }));
  app.post('/api/auth/reset', wrap(async (req, res) => { await throttle(req, 'reset', 5); const v = z.object({ email, code: z.string().regex(/^\d{6}$/), password: z.string().min(12).max(128) }).strict().parse(req.body); await cognito.send(new ConfirmForgotPasswordCommand({ ClientId: config.clientId, Username: v.email, ConfirmationCode: v.code, Password: v.password })); const identity = await store.get('EMAIL', hash(v.email)); if (identity) { const profile = await store.get('PROFILE', identity.userId); if (profile) await store.transact([{ Update: { Key: { pk: 'PROFILE', sk: identity.userId }, UpdateExpression: 'SET #d.authVersion = if_not_exists(#d.authVersion, :zero) + :one', ExpressionAttributeNames: { '#d': 'data' }, ExpressionAttributeValues: { ':zero': 0, ':one': 1 } } }]); } res.json({ message: 'Password reset. Sign in with your new password.' }); }));
  const photoUrl = key => getSignedUrl(s3, new GetObjectCommand({ Bucket: config.bucket, Key: key }), { expiresIn: 900 });
  app.get('/api/state', wrap(async (req, res) => {
    const user = req.user;
    const [products, sellers, bulkRequests, orders, messages, ads, reviews] = await Promise.all(['PRODUCT', 'SELLER', 'BULK', user ? `ORDERS#${user.id}` : null, user ? `MESSAGES#${user.id}` : null, user ? `ADS#${user.id}` : null, 'REVIEW'].map(pk => pk ? store.list(pk) : []));
    const people = new Map(sellers.map(row => [row.sk, row.data]));
    if (user) { people.set(user.id, user); const ids = new Set(messages.flatMap(r => [r.data.senderId, r.data.receiverId]).concat(orders.flatMap(r => [r.data.buyerId, r.data.sellerId]))); for (const id of ids) if (!people.has(id)) { const p = await store.get('PROFILE', id); if (p) people.set(id, publicUser(p.data)); } }
    const listing = await Promise.all(products.map(async r => { const list = reviews.map(x => x.data).filter(x => x.productId === r.sk); return { ...r.data, inStock: r.data.stockCount > 0, sellerVerified: people.get(r.data.sellerId)?.verified === true, image: await photoUrl(r.data.image), rating: list.length ? list.reduce((n, x) => n + x.rating, 0) / list.length : 0, reviewCount: list.length }; }));
    res.json({ currentUserId: user?.id || null, users: [...people.values()], products: listing, cart: [], orders: orders.map(r => r.data), chatMessages: messages.map(r => r.data).sort((a, b) => a.createdAt.localeCompare(b.createdAt)), bulkRequests: bulkRequests.map(r => r.data), adRequests: ads.map(r => r.data), reviews: reviews.map(r => r.data) });
  }));
  app.post('/api/uploads', auth('seller'), express.raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: '3mb' }), wrap(async (req, res) => {
    await throttle(req, 'upload', 10); if (!Buffer.isBuffer(req.body)) throw error(400, 'Choose a JPEG, PNG or WebP photo under 3 MB.');
    const bytes = req.body;
    const raster = bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255])) || bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) || (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP');
    if (!raster) throw error(400, 'Choose a valid JPEG, PNG or WebP photo.');
    let image; try { image = await sharp(req.body, { limitInputPixels: 16000000, animated: false }).rotate().resize(1600, 1600, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 85 }).toBuffer(); } catch { throw error(400, 'This photo could not be read. Choose a valid image.'); }
    const key = `products/${req.user.id}/${crypto.randomUUID()}.jpg`;
    await s3.send(new PutObjectCommand({ Bucket: config.bucket, Key: key, Body: image, ContentType: 'image/jpeg', ServerSideEncryption: 'AES256', Metadata: { owner: req.user.id } }));
    res.status(201).json({ image: key, preview: await photoUrl(key) });
  }));
  app.post('/api/products', auth('seller'), wrap(async (req, res) => {
    await throttle(req, 'product', 20); const v = product.parse(req.body); if (!v.image.startsWith(`products/${req.user.id}/`)) throw error(403, 'Upload a photo from your own account.');
    const photo = await s3.send(new HeadObjectCommand({ Bucket: config.bucket, Key: v.image })); if (photo.Metadata?.owner !== req.user.id || photo.ContentType !== 'image/jpeg') throw error(400, 'Upload a valid product photo first.');
    const data = { ...v, id: crypto.randomUUID(), sellerId: req.user.id, sellerName: req.user.storeName || req.user.name, sellerVerified: req.user.verified, inStock: true, rating: 0, reviewCount: 0, featured: false };
    await store.put({ pk: 'PRODUCT', sk: data.id, data }, 'attribute_not_exists(pk)'); res.status(201).json({ message: 'Product published.' });
  }));
  app.patch('/api/products/:id', auth('seller'), wrap(async (req, res) => {
    await throttle(req, 'product', 20);
    const id = text(1, 100).parse(req.params.id);
    const record = await store.get('PRODUCT', id);
    if (!record || record.data.sellerId !== req.user.id) throw error(404, 'Listing not found.');
    const v = productUpdate.parse(req.body);
    if (v.image) {
      if (!v.image.startsWith(`products/${req.user.id}/`)) throw error(403, 'Upload a photo from your own account.');
      const photo = await s3.send(new HeadObjectCommand({ Bucket: config.bucket, Key: v.image }));
      if (photo.Metadata?.owner !== req.user.id || photo.ContentType !== 'image/jpeg') throw error(400, 'Upload a valid product photo first.');
    }
    const previous = record.data;
    const data = { ...previous, ...v, image: v.image || previous.image, inStock: v.stockCount > 0, version: (previous.version || 0) + 1 };
    if (v.oldPrice === null) delete data.oldPrice;
    await store.transact([{ Put: {
      Item: { pk: 'PRODUCT', sk: id, data },
      ConditionExpression: '#d.sellerId = :seller AND #d.stockCount = :stock AND #d.price = :price AND ' + (previous.version === undefined ? 'attribute_not_exists(#d.version)' : '#d.version = :version'),
      ExpressionAttributeNames: { '#d': 'data' },
      ExpressionAttributeValues: { ':seller': req.user.id, ':stock': previous.stockCount, ':price': previous.price, ...(previous.version === undefined ? {} : { ':version': previous.version }) },
    } }]);
    res.json({ message: 'Listing updated.' });
  }));
  app.patch('/api/profile', auth('seller'), wrap(async (req, res) => {
    const patch = z.object({ storeName: text(2, 100), location: text(2, 100), bio: z.string().trim().max(2000) }).strict().parse(req.body), data = { ...req.user, ...patch };
    await store.transact([{ Put: { Item: { pk: 'PROFILE', sk: data.id, data }, ConditionExpression: 'attribute_not_exists(#d.authVersion) OR #d.authVersion = :version', ExpressionAttributeNames: { '#d': 'data' }, ExpressionAttributeValues: { ':version': req.user.authVersion || 0 } } }, { Put: { Item: { pk: 'SELLER', sk: data.id, data: publicUser(data) } } }]); res.json({ message: 'Profile updated.' });
  }));
  app.post('/api/messages', auth(), wrap(async (req, res) => {
    await throttle(req, 'message', 60); const v = z.object({ receiverId: text(1, 100), message: text(1, 3000) }).strict().parse(req.body);
    const receiver = (await store.get('PROFILE', v.receiverId))?.data; if (!receiver || receiver.id === req.user.id) throw error(400, 'Choose another account to message.');
    const data = { id: crypto.randomUUID(), senderId: req.user.id, senderName: req.user.storeName || req.user.name, receiverId: receiver.id, receiverName: receiver.storeName || receiver.name, message: v.message, createdAt: new Date().toISOString() };
    await store.transact([req.user.id, receiver.id].map(id => ({ Put: { Item: { pk: `MESSAGES#${id}`, sk: `${data.createdAt}#${data.id}`, data } } }))); res.status(201).json({ message: 'Message sent.' });
  }));
  app.post('/api/bulk', auth('buyer'), wrap(async (req, res) => { await throttle(req, 'bulk', 10); const v = bulk.parse(req.body), data = { ...v, id: crypto.randomUUID(), buyerId: req.user.id, buyerName: req.user.name, status: 'Open', createdAt: new Date().toISOString() }; await store.put({ pk: 'BULK', sk: data.id, data }); res.status(201).json({ message: 'Bulk request published.' }); }));
  app.post('/api/ads', auth('seller'), wrap(async (req, res) => { const v = z.object({ type: z.enum(['Homepage Banner', 'Sidebar Ad', 'Featured Listing']), title: text(3, 150), budget: z.number().positive().max(1000000) }).strict().parse(req.body), data = { ...v, id: crypto.randomUUID(), sellerId: req.user.id, sellerName: req.user.storeName || req.user.name, status: 'Pending Approval', createdAt: new Date().toISOString() }; await store.put({ pk: `ADS#${req.user.id}`, sk: data.id, data }); res.status(201).json({ message: 'Request submitted for review.' }); }));
  app.post('/api/orders/:id/advance', auth(), wrap(async (req, res) => {
    const record = await store.get(`ORDERS#${req.user.id}`, req.params.id); if (!record) throw error(404, 'Order not found.'); const d = record.data;
    const flow = ['Pending Seller Confirmation', 'Preparing Order', 'In Transit', 'Delivered', 'Completed'], index = flow.indexOf(d.status);
    if (d.paymentStatus !== 'Paid' || index < 0 || index === 4 || (index === 3 ? req.user.id !== d.buyerId || req.user.role !== 'buyer' : req.user.id !== d.sellerId || req.user.role !== 'seller')) throw error(403, 'This order cannot be updated by your account.');
    const data = { ...d, status: flow[index + 1], timeline: [{ label: index === 3 ? 'Buyer confirmed delivery' : flow[index + 1], date: new Date().toISOString() }, ...d.timeline] };
    await store.transact([d.buyerId, d.sellerId].map(id => ({ Put: { Item: { pk: `ORDERS#${id}`, sk: d.id, data }, ConditionExpression: '#d.#s = :previous', ExpressionAttributeNames: { '#d': 'data', '#s': 'status' }, ExpressionAttributeValues: { ':previous': d.status } } }))); res.json({ message: 'Order updated.' });
  }));
  app.post('/api/reviews', auth('buyer'), wrap(async (req, res) => {
    const v = z.object({ productId: text(1, 100), rating: z.number().int().min(1).max(5), comment: text(3, 1500) }).strict().parse(req.body);
    const owns = (await store.list(`ORDERS#${req.user.id}`)).some(r => ['Delivered', 'Completed'].includes(r.data.status) && r.data.paymentStatus === 'Paid' && r.data.items.some(p => p.productId === v.productId)); if (!owns) throw error(403, 'Only buyers with a delivered, paid order can review this product.');
    const id = `${v.productId}#${req.user.id}`; await store.put({ pk: 'REVIEW', sk: id, data: { ...v, id, buyerId: req.user.id, buyerName: req.user.name, createdAt: new Date().toISOString() } }, 'attribute_not_exists(pk)'); res.status(201).json({ message: 'Review published.' });
  }));
  app.post('/api/paystack/initialize', auth('buyer'), wrap(async (req, res) => { await throttle(req, 'checkout', 15); res.json(await payments.initialize(req.user, req.body, req.get('x-checkout-key'))); }));
  app.get('/api/paystack/verify/:reference', auth('buyer'), wrap(async (req, res) => { if (!/^farmyn_[a-f0-9]{32}$/.test(req.params.reference)) throw error(400, 'Invalid payment reference.'); res.json(await payments.verify(req.params.reference, req.user)); }));
  app.use((req, res) => res.status(404).json({ error: 'Not found.' }));
  app.use((e, req, res, next) => {
    let status = e.status || 500, message = e.status ? e.message : 'The service could not complete this request. Please retry.';
    if (e.name === 'ZodError') { status = 400; message = e.issues.map(x => `${x.path.join('.')}: ${x.message}`).join('; '); }
    if (['NotAuthorizedException', 'UserNotFoundException'].includes(e.name)) { status = 401; message = 'Email or password is incorrect.'; }
    if (e.name === 'UserNotConfirmedException') { status = 403; message = 'Verify your email before signing in.'; }
    if (['UsernameExistsException', 'CodeMismatchException', 'ExpiredCodeException', 'InvalidPasswordException'].includes(e.name)) { status = 400; message = { UsernameExistsException: 'Check your email or sign in if you already have an account.', CodeMismatchException: 'The verification code is incorrect.', ExpiredCodeException: 'The verification code has expired.', InvalidPasswordException: 'Use at least 12 characters, with upper and lower case letters, a number and a symbol.' }[e.name]; }
    if (['ConditionalCheckFailedException', 'TransactionCanceledException'].includes(e.name)) { status = 409; message = 'This item changed or the action was already completed. Refresh and retry.'; }
    if (status === 500) console.error(JSON.stringify({ event: 'api_failure', path: req.path, type: e.name }));
    res.status(status).json({ error: message });
  });
  return app;
}
module.exports = { createApp, publicUser, sessionKey };
