const express = require('express');
const helmet = require('helmet');
const crypto = require('node:crypto');
const { z, text, registration, product, productUpdate } = require('./validation');
const { error, hash } = require('./utils');
const { Store } = require('./store');
const { CognitoIdentityProviderClient, SignUpCommand, ConfirmSignUpCommand, InitiateAuthCommand, GetUserCommand, ForgotPasswordCommand, ConfirmForgotPasswordCommand, ResendConfirmationCodeCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const sharp = require('sharp');
const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);
const publicUser = u => ({ id: u.id, username: u.username, name: u.name, role: u.role, storeName: u.storeName, location: u.location, bio: u.bio, verified: u.verified, emailVerified: true, joinedAt: u.joinedAt });
const referralCodeFor = id => hash(`farmyn-referral:${id}`).slice(0, 8).toUpperCase();
const usernameFor = (name, id) => `${String(name || 'member').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 20) || 'member'}-${hash(id).slice(0, 4)}`;
// Behind CloudFront the socket address is an edge server shared by many viewers.
// CloudFront stamps the viewer IP into x-farmyn-viewer-ip (overwriting any client
// value) and adds x-farmyn-edge; trust the IP header only when that secret matches,
// so calling API Gateway directly cannot spoof it.
const clientIp = (req, edgeSecret) => {
  const sent = req.get('x-farmyn-edge'), viewer = req.get('x-farmyn-viewer-ip');
  const trusted = edgeSecret && sent && viewer && sent.length === edgeSecret.length && crypto.timingSafeEqual(Buffer.from(sent), Buffer.from(edgeSecret));
  return (trusted ? viewer : req.socket.remoteAddress) || 'unknown';
};
const sessionKey = req => { const match = (req.headers.cookie || '').match(/(?:^|;\s*)farmyn_session=([a-f0-9]{64})(?:;|$)/); return match ? hash(match[1]) : null; };
const adminSessionKey = req => { const match = (req.headers.cookie || '').match(/(?:^|;\s*)farmyn_admin=([a-f0-9]{64})(?:;|$)/); return match ? hash(match[1]) : null; };
const verifyPassword = (password, stored) => {
  const [salt, expected] = String(stored || '').split(':');
  if (!/^[a-f0-9]{32}$/.test(salt || '') || !/^[a-f0-9]{128}$/.test(expected || '')) return false;
  const actual = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(actual, Buffer.from(expected, 'hex'));
};

function createApp(config = {}, dependencies = {}) {
  const app = express(), ready = Boolean(config.table && config.clientId && config.bucket && config.webUrl);
  const store = dependencies.store || (ready ? new Store(config.table) : null);
  const cognito = dependencies.cognito || new CognitoIdentityProviderClient({});
  const s3 = dependencies.s3 || new S3Client({});
  const cookie = (value, age) => `farmyn_session=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}${config.webUrl?.startsWith('https:') ? '; Secure' : ''}`;
  const adminCookie = (value, age) => `farmyn_admin=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${age}${config.webUrl?.startsWith('https:') ? '; Secure' : ''}`;
  app.disable('x-powered-by'); app.use(helmet());
  app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    if (!['GET', 'HEAD'].includes(req.method) && req.get('origin') !== config.webUrl) return next(error(403, 'Request origin is not allowed.'));
    next();
  });
  app.get('/api/health', (req, res) => res.status(ready ? 200 : 503).json({ ready, service: 'Farmyn', storage: ready ? 'DynamoDB' : 'unconfigured' }));
  app.use((req, res, next) => ready ? next() : next(error(503, 'Farmyn is being set up. Please check back shortly.')));
  app.use(express.json({ limit: '32kb' }));
  app.use((req, res, next) => { (async () => { const key = sessionKey(req); if (key) { const session = await store.get('SESSION', key); if (session?.expiresAt > Date.now() / 1000) { const user = (await store.get('PROFILE', session.userId))?.data; if (user && (user.authVersion || 0) === (session.authVersion || 0)) req.user = user; } } })().then(() => next(), next); });
  app.use((req, res, next) => { (async () => { const key = adminSessionKey(req); if (key) { const session = await store.get('ADMIN_SESSION', key); if (session?.expiresAt > Date.now() / 1000 && session.email === config.adminEmail?.toLowerCase()) req.admin = { email: session.email }; } })().then(() => next(), next); });
  // Farmyn uses one account type: every signed-in member can browse, chat and sell.
  const auth = () => (req, res, next) => !req.user ? next(error(401, 'Please sign in.')) : next();
  const admin = () => (req, res, next) => !req.admin ? next(error(401, 'Super-admin sign-in required.')) : next();
  const throttle = async (req, kind, max = 10) => {
    const ip = clientIp(req, config.edgeSecret);
    if (!req.user) await store.limit(hash(`ingress:${kind}:${ip}`), 1000, 300);
    const identity = req.user?.id || (typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : ip);
    await store.limit(hash(`${kind}:${identity}`), max, 300);
  };
  const email = z.string().email().max(254).transform(v => v.toLowerCase());
  const activity = async (type, actor, details = {}) => { const createdAt = new Date().toISOString(), id = crypto.randomUUID(); await store.put({ pk: 'ACTIVITY', sk: `${createdAt}#${id}`, data: { id, type, actorId: actor?.id, actorName: actor?.storeName || actor?.name || actor?.email || 'System', createdAt, ...details } }); };
  app.post('/api/auth/register', wrap(async (req, res) => {
    await throttle(req, 'register', 5); const v = registration.parse(req.body);
    await cognito.send(new SignUpCommand({ ClientId: config.clientId, Username: v.email, Password: v.password, UserAttributes: Object.entries({ email: v.email, name: v.name, phone_number: v.phone, 'custom:role': 'seller', 'custom:location': v.location, ...(v.storeName ? { 'custom:storeName': v.storeName } : {}) }).map(([Name, Value]) => ({ Name, Value })) }));
    if (v.referralCode) await store.put({ pk: 'REFERRAL_PENDING', sk: hash(v.email), referralCode: v.referralCode, createdAt: new Date().toISOString(), expiresAt: Math.floor(Date.now() / 1000) + 604800 });
    await activity('user.registration_requested', { email: v.email, name: v.name }, { accountType: 'member', referred: Boolean(v.referralCode) });
    res.status(201).json({ message: 'Check your email for your verification code.' });
  }));
  app.post('/api/auth/confirm', wrap(async (req, res) => { await throttle(req, 'confirm'); const v = z.object({ email, code: z.string().regex(/^\d{6}$/) }).strict().parse(req.body); await cognito.send(new ConfirmSignUpCommand({ ClientId: config.clientId, Username: v.email, ConfirmationCode: v.code })); await activity('user.email_verified', { email: v.email }); res.json({ message: 'Email verified. You can now sign in.' }); }));
  app.post('/api/auth/resend', wrap(async (req, res) => { await throttle(req, 'resend', 3); const v = z.object({ email }).strict().parse(req.body); await cognito.send(new ResendConfirmationCodeCommand({ ClientId: config.clientId, Username: v.email })); res.json({ message: 'If the account needs verification, a new code has been sent.' }); }));
  app.post('/api/auth/login', wrap(async (req, res) => {
    await throttle(req, 'login'); const v = z.object({ email, password: z.string().min(1).max(128) }).strict().parse(req.body);
    const r = await cognito.send(new InitiateAuthCommand({ ClientId: config.clientId, AuthFlow: 'USER_PASSWORD_AUTH', AuthParameters: { USERNAME: v.email, PASSWORD: v.password } }));
    if (!r.AuthenticationResult?.AccessToken) throw error(401, 'Additional account verification is required.');
    const result = await cognito.send(new GetUserCommand({ AccessToken: r.AuthenticationResult.AccessToken }));
    const a = Object.fromEntries(result.UserAttributes.map(x => [x.Name, x.Value]));
    if (a.email_verified !== 'true') throw error(403, 'Verify your email before signing in.');
    let user = (await store.get('PROFILE', a.sub))?.data;
    if (!user) {
      user = { id: a.sub, username: usernameFor(a.name, a.sub), name: a.name, email: a.email, phone: a.phone_number || '', role: 'seller', location: a['custom:location'] || '', storeName: a['custom:storeName'], verified: false, emailVerified: true, joinedAt: new Date().toISOString(), referralCode: referralCodeFor(a.sub), referralCount: 0 };
    }
    // Migrate legacy buyer profiles on sign-in and make every account discoverable as a seller.
    user = { ...user, role: 'seller', username: user.username || usernameFor(user.name, user.id), referralCode: user.referralCode || referralCodeFor(user.id), referralCount: user.referralCount || 0 };
    await store.transact([{ Put: { Item: { pk: 'PROFILE', sk: user.id, data: user } } }, { Put: { Item: { pk: 'SELLER', sk: user.id, data: publicUser(user) } } }]);
    await store.put({ pk: 'REFERRAL_CODE', sk: user.referralCode, userId: user.id });
    const pendingReferral = !user.referredBy && await store.get('REFERRAL_PENDING', hash(user.email.toLowerCase()));
    if (pendingReferral) {
      const referrer = await store.get('REFERRAL_CODE', pendingReferral.referralCode);
      if (referrer?.userId && referrer.userId !== user.id) {
        try {
          const qualifiedAt = new Date().toISOString();
          await store.transact([
            { Put: { Item: { pk: 'REFERRAL', sk: user.id, referrerId: referrer.userId, referredUserId: user.id, referredName: user.name, qualifiedAt }, ConditionExpression: 'attribute_not_exists(pk)' } },
            { Update: { Key: { pk: 'PROFILE', sk: referrer.userId }, UpdateExpression: 'SET #d.referralCount = if_not_exists(#d.referralCount, :zero) + :one', ExpressionAttributeNames: { '#d': 'data' }, ExpressionAttributeValues: { ':zero': 0, ':one': 1 } } },
            { Update: { Key: { pk: 'PROFILE', sk: user.id }, UpdateExpression: 'SET #d.referredBy = :referrer', ExpressionAttributeNames: { '#d': 'data' }, ExpressionAttributeValues: { ':referrer': referrer.userId } } },
          ]);
          user = { ...user, referredBy: referrer.userId };
          await activity('referral.qualified', user, { referrerId: referrer.userId });
        } catch (e) { if (e.name !== 'TransactionCanceledException') throw e; }
      }
      await store.delete('REFERRAL_PENDING', hash(user.email.toLowerCase()));
    }
    await store.put({ pk: 'EMAIL', sk: hash(user.email.toLowerCase()), userId: user.id });
    const old = sessionKey(req); if (old) await store.delete('SESSION', old);
    const token = crypto.randomBytes(32).toString('hex'); await store.put({ pk: 'SESSION', sk: hash(token), userId: user.id, authVersion: user.authVersion || 0, expiresAt: Math.floor(Date.now() / 1000) + 28800 });
    await activity('user.login', user, { role: user.role });
    res.set('Set-Cookie', cookie(token, 28800)); res.json({ message: 'Signed in successfully.', user });
  }));
  app.post('/api/auth/logout', wrap(async (req, res) => { const key = sessionKey(req); if (key) await store.delete('SESSION', key); res.set('Set-Cookie', cookie('', 0)); res.json({ message: 'Signed out.' }); }));
  app.post('/api/auth/forgot', wrap(async (req, res) => { await throttle(req, 'forgot', 3); const v = z.object({ email }).strict().parse(req.body); try { await cognito.send(new ForgotPasswordCommand({ ClientId: config.clientId, Username: v.email })); } catch (e) { if (e.name !== 'UserNotFoundException') throw e; } res.json({ message: 'If the account exists, a reset code has been sent.' }); }));
  app.post('/api/auth/reset', wrap(async (req, res) => { await throttle(req, 'reset', 5); const v = z.object({ email, code: z.string().regex(/^\d{6}$/), password: z.string().min(12).max(128) }).strict().parse(req.body); await cognito.send(new ConfirmForgotPasswordCommand({ ClientId: config.clientId, Username: v.email, ConfirmationCode: v.code, Password: v.password })); const identity = await store.get('EMAIL', hash(v.email)); if (identity) { const profile = await store.get('PROFILE', identity.userId); if (profile) await store.transact([{ Update: { Key: { pk: 'PROFILE', sk: identity.userId }, UpdateExpression: 'SET #d.authVersion = if_not_exists(#d.authVersion, :zero) + :one', ExpressionAttributeNames: { '#d': 'data' }, ExpressionAttributeValues: { ':zero': 0, ':one': 1 } } }]); } res.json({ message: 'Password reset. Sign in with your new password.' }); }));
  const photoUrl = key => getSignedUrl(s3, new GetObjectCommand({ Bucket: config.bucket, Key: key }), { expiresIn: 900 });
  app.get('/api/state', wrap(async (req, res) => {
    const user = req.user;
    const [products, sellers, messages, banners, boosts] = await Promise.all(['PRODUCT', 'SELLER', user ? `MESSAGES#${user.id}` : null, 'BANNER', 'BOOST'].map(pk => pk ? store.list(pk) : []));
    const people = new Map(sellers.map(row => [row.sk, row.data]));
    if (user) { people.set(user.id, user); const ids = new Set(messages.flatMap(r => [r.data.senderId, r.data.receiverId])); for (const id of ids) if (!people.has(id)) { const p = await store.get('PROFILE', id); if (p) people.set(id, publicUser(p.data)); } }
    const now = Date.now(), activeBoosts = new Set(boosts.filter(r => Date.parse(r.data.endsAt) > now).map(r => r.data.productId));
    const listing = await Promise.all(products.map(async r => ({ ...r.data, inStock: r.data.stockCount > 0, featured: activeBoosts.has(r.data.id), sellerVerified: people.get(r.data.sellerId)?.verified === true, image: await photoUrl(r.data.image) })));
    const activeBanners = banners.map(r => r.data).filter(b => b.status === 'active' && Date.parse(b.startsAt) <= now && Date.parse(b.endsAt) > now).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    res.json({ currentUserId: user?.id || null, users: [...people.values()], products: listing, banners: activeBanners, chatMessages: messages.map(r => r.data).sort((a, b) => a.createdAt.localeCompare(b.createdAt)) });
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
    await store.put({ pk: 'PRODUCT', sk: data.id, data }, 'attribute_not_exists(pk)'); await activity('listing.created', req.user, { productId: data.id, productName: data.name }); res.status(201).json({ message: 'Product published.' });
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
    await activity('listing.updated', req.user, { productId: data.id, productName: data.name });
    res.json({ message: 'Listing updated.' });
  }));
  app.patch('/api/profile', auth('seller'), wrap(async (req, res) => {
    const patch = z.object({ storeName: text(2, 100), location: text(2, 100), bio: z.string().trim().max(2000) }).strict().parse(req.body), data = { ...req.user, ...patch };
    await store.transact([{ Put: { Item: { pk: 'PROFILE', sk: data.id, data }, ConditionExpression: 'attribute_not_exists(#d.authVersion) OR #d.authVersion = :version', ExpressionAttributeNames: { '#d': 'data' }, ExpressionAttributeValues: { ':version': req.user.authVersion || 0 } } }, { Put: { Item: { pk: 'SELLER', sk: data.id, data: publicUser(data) } } }]); await activity('seller.profile_updated', req.user); res.json({ message: 'Profile updated.' });
  }));
  app.post('/api/messages', auth(), wrap(async (req, res) => {
    await throttle(req, 'message', 60); const v = z.object({ receiverId: text(1, 100), message: text(1, 3000), productId: text(1, 100).optional() }).strict().parse(req.body);
    const receiver = (await store.get('PROFILE', v.receiverId))?.data; if (!receiver || receiver.id === req.user.id) throw error(400, 'Choose another account to message.');
    let listing;
    if (v.productId) {
      listing = (await store.get('PRODUCT', v.productId))?.data;
      if (!listing || ![req.user.id, receiver.id].includes(listing.sellerId)) throw error(400, 'This product is not available for this conversation.');
    }
    const data = { id: crypto.randomUUID(), senderId: req.user.id, senderName: req.user.storeName || req.user.name, receiverId: receiver.id, receiverName: receiver.storeName || receiver.name, message: v.message, ...(listing ? { productId: listing.id, productName: listing.name } : {}), createdAt: new Date().toISOString() };
    await store.transact([req.user.id, receiver.id].map(id => ({ Put: { Item: { pk: `MESSAGES#${id}`, sk: `${data.createdAt}#${data.id}`, data } } }))); await activity('message.sent', req.user, { receiverId: receiver.id, receiverName: receiver.storeName || receiver.name, productId: listing?.id, productName: listing?.name }); res.status(201).json({ message: 'Message sent.' });
  }));
  app.post('/api/promotions/request', auth('seller'), wrap(async (req, res) => {
    const v = z.object({ type: z.enum(['boost', 'category-banner', 'homepage-banner']), productId: text(1, 100).optional(), note: z.string().trim().max(500).default('') }).strict().parse(req.body);
    if (v.type === 'boost' && !v.productId) throw error(400, 'Choose a listing to boost.');
    if (v.productId) { const listing = (await store.get('PRODUCT', v.productId))?.data; if (!listing || listing.sellerId !== req.user.id) throw error(404, 'Listing not found.'); }
    const prices = { boost: 2000, 'category-banner': 5000, 'homepage-banner': 10000 }, createdAt = new Date().toISOString(), id = crypto.randomUUID();
    const data = { ...v, id, sellerId: req.user.id, sellerName: req.user.storeName || req.user.name, price: prices[v.type], status: 'pending', createdAt }; await store.put({ pk: 'PROMO_REQUEST', sk: id, data }); await activity('promotion.requested', req.user, { requestId: id, promotionType: v.type, price: data.price }); res.status(201).json({ message: 'Promotion request sent to Farmyn.' });
  }));
  app.post('/api/admin/login', wrap(async (req, res) => {
    await throttle(req, 'admin-login', 5); const v = z.object({ email, password: z.string().min(8).max(128) }).strict().parse(req.body);
    if (v.email !== config.adminEmail?.toLowerCase() || !verifyPassword(v.password, config.adminPasswordHash)) throw error(401, 'Email or password is incorrect.');
    const old = adminSessionKey(req); if (old) await store.delete('ADMIN_SESSION', old);
    const token = crypto.randomBytes(32).toString('hex'), expiresAt = Math.floor(Date.now() / 1000) + 14400;
    await store.put({ pk: 'ADMIN_SESSION', sk: hash(token), email: v.email, expiresAt });
    res.set('Set-Cookie', adminCookie(token, 14400)); res.json({ message: 'Super-admin signed in.' });
  }));
  app.post('/api/admin/logout', wrap(async (req, res) => { const key = adminSessionKey(req); if (key) await store.delete('ADMIN_SESSION', key); res.set('Set-Cookie', adminCookie('', 0)); res.json({ message: 'Signed out.' }); }));
  app.get('/api/admin/overview', admin(), wrap(async (req, res) => {
    const [profiles, products, sellers, banners, boosts, events, requests, referrals] = await Promise.all(['PROFILE', 'PRODUCT', 'SELLER', 'BANNER', 'BOOST', 'ACTIVITY', 'PROMO_REQUEST', 'REFERRAL'].map(pk => store.list(pk)));
    const now = Date.now(), activities = events.map(r => r.data).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const referralEntries = profiles.reduce((total, row) => total + Math.floor((row.data.referralCount || 0) / 10), 0);
    res.json({ adminEmail: req.admin.email, metrics: { users: profiles.length, sellers: profiles.length, buyers: 0, listings: products.length, activeListings: products.filter(r => r.data.stockCount > 0).length, messages: activities.filter(a => a.type === 'message.sent').length, activeBoosts: boosts.filter(r => Date.parse(r.data.endsAt) > now).length, activeBanners: banners.filter(r => r.data.status === 'active' && Date.parse(r.data.startsAt) <= now && Date.parse(r.data.endsAt) > now).length, pendingPromotions: requests.filter(r => r.data.status === 'pending').length, qualifiedReferrals: referrals.length, referralEntries }, users: profiles.map(r => r.data).sort((a, b) => b.joinedAt.localeCompare(a.joinedAt)), listings: products.map(r => r.data), banners: banners.map(r => r.data).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), boosts: boosts.map(r => r.data), promotionRequests: requests.map(r => r.data).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), referrals: referrals.map(r => r), activities: activities.slice(0, 200) });
  }));
  app.post('/api/admin/banners', admin(), wrap(async (req, res) => {
    const v = z.object({ title: text(3, 100), subtitle: text(3, 220), imageUrl: z.string().url().max(1000), ctaLabel: text(2, 30), ctaHref: z.string().regex(/^\/[a-zA-Z0-9/?=&%_.-]*$/).max(300), placement: z.enum(['homepage', 'category']), startsAt: z.string().datetime(), endsAt: z.string().datetime(), price: z.number().nonnegative().max(10000000), sponsorName: text(2, 100) }).strict().parse(req.body);
    if (Date.parse(v.endsAt) <= Date.parse(v.startsAt)) throw error(400, 'Banner end date must be after its start date.');
    const data = { ...v, id: crypto.randomUUID(), status: 'active', createdAt: new Date().toISOString() }; await store.put({ pk: 'BANNER', sk: data.id, data }); await activity('banner.created', req.admin, { bannerId: data.id, bannerTitle: data.title }); res.status(201).json({ message: 'Banner scheduled.' });
  }));
  app.delete('/api/admin/banners/:id', admin(), wrap(async (req, res) => { const id = text(1, 100).parse(req.params.id); await store.delete('BANNER', id); await activity('banner.deleted', req.admin, { bannerId: id }); res.json({ message: 'Banner removed.' }); }));
  app.post('/api/admin/boosts', admin(), wrap(async (req, res) => {
    const v = z.object({ productId: text(1, 100), days: z.number().int().min(1).max(90) }).strict().parse(req.body), listing = (await store.get('PRODUCT', v.productId))?.data;
    if (!listing) throw error(404, 'Listing not found.'); const startsAt = new Date().toISOString(), endsAt = new Date(Date.now() + v.days * 86400000).toISOString();
    const data = { id: v.productId, productId: v.productId, productName: listing.name, sellerId: listing.sellerId, sellerName: listing.sellerName, price: 2000, startsAt, endsAt, createdAt: startsAt }; await store.put({ pk: 'BOOST', sk: v.productId, data }); await activity('boost.activated', req.admin, { productId: listing.id, productName: listing.name, days: v.days, price: 2000 }); res.status(201).json({ message: '₦2,000 listing boost activated.' });
  }));
  app.patch('/api/admin/promotions/:id', admin(), wrap(async (req, res) => { const id = text(1, 100).parse(req.params.id), v = z.object({ status: z.enum(['completed', 'rejected']) }).strict().parse(req.body), record = await store.get('PROMO_REQUEST', id); if (!record) throw error(404, 'Promotion request not found.'); await store.put({ ...record, data: { ...record.data, status: v.status, reviewedAt: new Date().toISOString() } }); await activity(`promotion.${v.status}`, req.admin, { requestId: id }); res.json({ message: `Promotion marked ${v.status}.` }); }));
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
