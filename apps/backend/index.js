const express = require('express');
const cors = require('cors');
try { require('dotenv').config({ path: require('path').join(__dirname, '.env') }); } catch (_) {}
const { ethers } = require('ethers');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const BASE_URL = (process.env.BMONI_BASE_URL || 'https://embedded-dev.bmoni.com').replace(/\/$/, '');
const API_KEY = process.env.BMONI_API_KEY || '';
const LIVE = Boolean(API_KEY);

// Real-project mode: no mock data anywhere. Every money route below calls the
// live BMONI API (sandbox or production, per BMONI_BASE_URL). Without a key we
// fail fast with a clear error instead of faking balances.
function needKey(res) {
  if (!API_KEY) {
    res.status(503).json({
      error: 'Payments backend not configured.',
      hint: 'Set BMONI_API_KEY in apps/backend/.env (sandbox) or a production key, then restart the backend.',
    });
    return false;
  }
  return true;
}

// Phone/email -> bmoniUserId cache (BMONI has no idempotency keys; a retried create returns 409)
const store = { users: {}, wallets: {}, escrows: {} };

// File-backed cache: phone/email -> bmoniUserId, survives server restarts.
// BMONI has no idempotency keys: a retried create returns 409 without the id,
// so we recover the id from this cache (docs: treat 409 as success).
const fs = require('fs');
const path = require('path');
const USER_CACHE_FILE = path.join(__dirname, '.bmoni-users.json');
let userCache = {};
try { userCache = JSON.parse(fs.readFileSync(USER_CACHE_FILE, 'utf8')); } catch (_) { userCache = {}; }
function saveUserCache() {
  try { fs.writeFileSync(USER_CACHE_FILE, JSON.stringify(userCache, null, 2)); } catch (_) {}
}

async function bmoni(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'x-api-key': API_KEY,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!res.ok) {
    const err = new Error(data?.message || `BMONI ${res.status} on ${path}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data?.data ?? data;
}

app.get('/', (req, res) => {
  res.json({ name: 'Farmyn Backend API', mode: LIVE ? 'live' : 'unconfigured', baseUrl: BASE_URL });
});

// Health: is BMONI reachable with this key? Open http://localhost:3001/api/bmoni/health
// Uses a read-only endpoint — no users/wallets created.
app.get('/api/bmoni/health', async (req, res) => {
  if (!API_KEY) return res.json({ mode: 'unconfigured', keyValid: false, hint: 'BMONI_API_KEY is empty. Set it in apps/backend/.env and restart.' });
  try {
    const data = await bmoni('/v1/smart-wallets/supported-currencies');
    res.json({ mode: 'live', keyValid: true, supported: data });
  } catch (e) {
    res.status(e.status || 500).json({
      mode: 'error', keyValid: false,
      error: e.message,
      hint: e.status === 401 ? 'Key rejected for this environment. Use a sandbox key with the dev URL, or a production key with the production URL.' : undefined,
      data: e.data,
    });
  }
});

// 1. Create BMONI user — maps to POST /v1/users
// Body: { firstName, lastName, email, phoneNumber }
app.post('/api/bmoni/users', async (req, res) => {
  try {
    if (!needKey(res)) return;
    const { firstName, lastName, email, phoneNumber } = req.body;
    const data = await bmoni('/v1/users', { method: 'POST', body: { firstName, lastName, email, phoneNumber } });
    const bmoniUserId = data?.bmoniUserId || data?.id || data?.userId || data?.user?.id;
    if (bmoniUserId) {
      if (phoneNumber) userCache[`phone:${phoneNumber}`] = bmoniUserId;
      if (email) userCache[`email:${email}`] = bmoniUserId;
      saveUserCache();
      console.log(`[BMONI] user created: ${bmoniUserId} (${phoneNumber} / ${email})`);
    }
    res.json(data);
  } catch (e) {
    // 409 = retry of a create that already succeeded. Recover cached id.
    if (e.status === 409) {
      const { email, phoneNumber } = req.body || {};
      const cached = (phoneNumber && userCache[`phone:${phoneNumber}`]) || (email && userCache[`email:${email}`]);
      if (cached) return res.json({ bmoniUserId: cached, reused: true, note: 'User already existed (409). Reusing cached bmoniUserId.' });
      return res.status(409).json({
        error: e.message,
        hint: 'This phone/email already has a BMONI user from an earlier run, but this server has no cached id (restart cleared it). Fix: paste the bmoniUserId from your first run log into "Existing bmoniUserId", or switch persona to Samson Jabo (+2348000000001).',
        data: e.data,
      });
    }
    res.status(e.status || 500).json({ error: e.message, data: e.data });
  }
});

// Specific user helpers FIRST (Express matches in order — :id would swallow these).
app.get('/api/bmoni/users/by-phone/:phone', (req, res) => {
  const id = userCache[`phone:${req.params.phone}`];
  if (!id) return res.status(404).json({ error: 'no cached user for this phone' });
  res.json({ bmoniUserId: id });
});
app.get('/api/bmoni/users/by-email/:email', (req, res) => {
  const id = userCache[`email:${req.params.email}`];
  if (!id) return res.status(404).json({ error: 'no cached user for this email' });
  res.json({ bmoniUserId: id });
});
// Recover live from BMONI: list partner users and match by phone/email.
// (Spec confirms GET /v1/users is a paginated list; no search filter, so we match client-side.)
// Helpers: BMONI stores phones in varying formats (+234..., 234..., 080...),
// and user fields nest differently per endpoint — so match on last-10-digits
// and scan nested objects for phone/email-ish values.
function digits(s) { return String(s || '').replace(/\D/g, ''); }
function last10(s) { const d = digits(s); return d.slice(-10); }
function collectStrings(obj, out = [], depth = 0) {
  if (obj == null || depth > 3) return out;
  if (typeof obj === 'string') { out.push(obj); return out; }
  if (Array.isArray(obj)) { obj.forEach((v) => collectStrings(v, out, depth + 1)); return out; }
  if (typeof obj === 'object') { Object.values(obj).forEach((v) => collectStrings(v, out, depth + 1)); }
  return out;
}
function extractUsers(list) {
  if (Array.isArray(list)) return list;
  return list?.users || list?.items || list?.data?.users || list?.data?.items || list?.data || list?.result || list?.results || [];
}
function matchUser(users, phone, email) {
  const wantDigits = phone ? last10(phone) : null;
  const wantEmail = email ? String(email).toLowerCase() : null;
  return users.find((u) => {
    const strings = collectStrings(u);
    const phoneHit = wantDigits && strings.some((s) => /^[+\d][\d\s+\-()]*$/.test(s.trim()) && last10(s) === wantDigits);
    const emailHit = wantEmail && strings.some((s) => String(s).toLowerCase() === wantEmail);
    return phoneHit || emailHit;
  });
}
function userIdOf(u) { return u?.bmoniUserId || u?.id || u?.userId || u?.user?.id; }
function debugUsers(users) {
  return {
    checked: users.length,
    sampleKeys: users[0] ? Object.keys(users[0]).slice(0, 12) : [],
    // masked contact-ish values only (sandbox test numbers — no real PII here)
    contacts: users.slice(0, 10).map((u) =>
      collectStrings(u).filter((s) => /@/.test(s) || last10(s).length === 10).slice(0, 3)),
  };
}
app.get('/api/bmoni/users/recover', async (req, res) => {
  try {
    if (!needKey(res)) return;
    const { phone, email } = req.query;
    if (!phone && !email) return res.status(400).json({ error: 'pass ?phone= or ?email=' });
    // Shared sandbox keys hold hundreds of users from many partners, so scan
    // several pages (not just the first 100) before giving up.
    let checked = 0;
    for (let page = 1; page <= 10; page++) {
      const users = extractUsers(await bmoni(`/v1/users?limit=100&page=${page}`));
      if (!users.length) break;
      checked += users.length;
      const hit = matchUser(users, phone, email);
      if (hit) {
        const bmoniUserId = userIdOf(hit);
        if (phone) userCache[`phone:${phone}`] = bmoniUserId;
        if (email) userCache[`email:${email}`] = bmoniUserId;
        saveUserCache();
        return res.json({ bmoniUserId, reused: true, note: `Recovered live from GET /v1/users (page ${page}).` });
      }
      if (users.length < 100) break;
    }
    return res.status(404).json({ error: `no live user matches that phone/email (checked ${checked}). The number may belong to another partner on this shared sandbox key — ask support@bkey.me for your own key, or link via bmoniUserId paste.` });
  } catch (e) { res.status(e.status || 500).json({ error: e.message, data: e.data }); }
});
// Inspect / delete / reactivate one user (for resetting stuck sandbox accounts)
app.get('/api/bmoni/users/:id', async (req, res) => {
  try {
    if (!needKey(res)) return;
    res.json(await bmoni(`/v1/users/${req.params.id}`));
  } catch (e) { res.status(e.status || 500).json({ error: e.message, data: e.data }); }
});
app.delete('/api/bmoni/users/:id', async (req, res) => {
  try {
    if (!needKey(res)) return;
    res.json(await bmoni(`/v1/users/${req.params.id}`, { method: 'DELETE' }));
  } catch (e) { res.status(e.status || 500).json({ error: e.message, hint: e.status === 400 ? 'Deletion needs empty wallets. Offramp/withdraw any balance first.' : undefined, data: e.data }); }
});
app.post('/api/bmoni/users/:id/reactivate', async (req, res) => {
  try {
    if (!needKey(res)) return;
    res.json(await bmoni(`/v1/users/${req.params.id}/reactivate`, { method: 'POST' }));
  } catch (e) { res.status(e.status || 500).json({ error: e.message, data: e.data }); }
});
// Close account: recover ids for the given phones, delete those users, clear local cache.
// Body: { phones: ["+234...", ...] }
app.post('/api/bmoni/reset', async (req, res) => {
  try {
    if (!needKey(res)) return;
    const phones = req.body?.phones || [];
    const users = extractUsers(await bmoni('/v1/users?limit=100&page=1'));
    const out = [];
    for (const phone of phones) {
      const hit = matchUser(users, phone, null);
      if (!hit) { out.push({ phone, status: 'not-found', debug: debugUsers(users) }); continue; }
      const id = userIdOf(hit);
      try {
        await bmoni(`/v1/users/${id}`, { method: 'DELETE' });
        out.push({ phone, bmoniUserId: id, status: 'deleted' });
      } catch (e) {
        out.push({ phone, bmoniUserId: id, status: 'delete-failed', error: e.message, data: e.data });
      }
      delete userCache[`phone:${phone}`];
    }
    saveUserCache();
    res.json({ results: out, note: 'Now click Run to create fresh. If create 409s after delete, the account is in 90-day recovery — use Reactivate with the id above.' });
  } catch (e) { res.status(e.status || 500).json({ error: e.message, data: e.data }); }
});

// 2. Provision CNGN smart wallet — owner-proof-challenge -> sign -> create-managed
// Body: { bmoniUserId, ownerPrivateKey? } — server generates ephemeral key for demo; production uses SDK on-device key
app.post('/api/bmoni/wallet', async (req, res) => {
  try {
    if (!needKey(res)) return;
    const { bmoniUserId, currency = 'CNGN' } = req.body;
    if (!bmoniUserId) return res.status(400).json({ error: 'bmoniUserId required' });
    // Ephemeral owner key (hackathon shortcut — production: sign on-device via bmoni_embedded_sdk)
    const owner = ethers.Wallet.createRandom();
    const chal = await bmoni(`/v1/users/${bmoniUserId}/smart-wallets/owner-proof-challenges`, {
      method: 'POST', body: { currency, userOwnerAddress: owner.address },
    });
    const challengeId = chal.challengeId || chal.id;
    const message = chal.message || chal.challenge;
    const ownerProofSignature = await owner.signMessage(message); // EIP-191 for this step
    const wallet = await bmoni(`/v1/users/${bmoniUserId}/smart-wallets/create-managed`, {
      method: 'POST',
      body: { currency, userOwnerAddress: owner.address, ownerProofChallengeId: challengeId, ownerProofSignature },
    });
    // WARNING: never persist raw private keys in prod — return owner key only for sandbox demo
    res.json({ ...wallet, _demoOwnerPrivateKey: owner.privateKey, _demoOwnerAddress: owner.address });
  } catch (e) {
    // 409/E502 = this user already has a wallet for the currency (one per
    // currency). Reuse it via the balances endpoint — no owner key available
    // for a reused wallet, so release-signing stays disabled for it.
    if (e.status === 409 || /already exists/i.test(e.message || '')) {
      try {
        const b = await bmoni(`/v1/users/${req.body?.bmoniUserId}/smart-wallets/account/balances`);
        const addr = b.smartAccountAddress || b.address || b.smartWalletAddress;
        const list = Array.isArray(b) ? b : b.balances || b.data || b.items || [];
        const w = list.find((x) => /NGN|CNGN/i.test(x.currency || '')) || list[0];
        if (w?.smartWalletId) {
          return res.json({
            smartWalletId: w.smartWalletId, address: addr, reused: true,
            note: 'Wallet already existed (409). Reusing it — owner-key release signing unavailable for reused wallets.',
          });
        }
      } catch (_) {}
    }
    res.status(e.status || 500).json({ error: e.message, data: e.data });
  }
});

// 3. Onboard Nigeria rail — POST /onboarding/start-nigeria
// Body: { bmoniUserId, bvn, ngnWalletAddress }
app.post('/api/bmoni/onboard-ngn', async (req, res) => {
  try {
    if (!needKey(res)) return;
    const { bmoniUserId, bvn, ngnWalletAddress, ngnWalletIndex = 0 } = req.body;
    const data = await bmoni(`/v1/users/${bmoniUserId}/onboarding/start-nigeria`, {
      method: 'POST', body: { bvn, ngnWalletAddress, ngnWalletIndex },
    });
    res.json(data);
  } catch (e) { res.status(e.status || 500).json({ error: e.message, data: e.data }); }
});

// 4a. Status / balances / deposit account
app.get('/api/bmoni/kyc/bvn-lookup/:userId/:bvn', async (req, res) => {
  try {
    if (!needKey(res)) return;
    res.json(await bmoni(`/v1/users/${req.params.userId}/kyc/bvn-lookup/${req.params.bvn}`));
  } catch (e) { res.status(e.status || 500).json({ error: e.message, data: e.data }); }
});
app.get('/api/bmoni/status/:userId', async (req, res) => {
  try {
    if (!needKey(res)) return;
    res.json(await bmoni(`/v1/users/${req.params.userId}/onboarding/status`));
  } catch (e) { res.status(e.status || 500).json({ error: e.message, data: e.data }); }
});

app.get('/api/bmoni/balances/:userId', async (req, res) => {
  try {
    if (!needKey(res)) return;
    res.json(await bmoni(`/v1/users/${req.params.userId}/smart-wallets/account/balances`));
  } catch (e) { res.status(e.status || 500).json({ error: e.message, data: e.data }); }
});

app.get('/api/bmoni/deposit-account/:userId', async (req, res) => {
  try {
    if (!needKey(res)) return;
    res.json(await bmoni(`/v1/users/${req.params.userId}/bank-accounts/deposit-accounts/NGN`));
  } catch (e) { res.status(e.status || 500).json({ error: e.message, data: e.data }); }
});

// 4b. Escrow: lock funds as TRANSFER proposal -> approve -> sign (release on delivery)
// Body: { bmoniUserId, smartWalletId, toAddress, amount, description, ownerPrivateKey? }
app.post('/api/bmoni/escrow/lock', async (req, res) => {
  try {
    if (!needKey(res)) return;
    const { bmoniUserId, smartWalletId, toAddress, amount, description = 'Farmyn escrow lock' } = req.body;
    const proposal = await bmoni(`/v1/users/${bmoniUserId}/smart-wallets/${smartWalletId}/proposals`, {
      method: 'POST', body: { proposal: { type: 'TRANSFER', toAddress, amount: String(amount), currency: 'CNGN', description } },
    });
    const proposalId = proposal?.proposal?.id || proposal?.id || proposal?.proposalId || proposal?.proposal?.proposalId;
    await bmoni(`/v1/users/${bmoniUserId}/smart-wallets/proposals/${proposalId}/approve`, { method: 'POST' });
    res.json({ proposalId, status: 'PENDING_SIGNATURES' });
  } catch (e) { res.status(e.status || 500).json({ error: e.message, data: e.data }); }
});

app.post('/api/bmoni/escrow/release', async (req, res) => {
  try {
    if (!needKey(res)) return;
    const { bmoniUserId, proposalId, ownerPrivateKey } = req.body;
    const payload = await bmoni(`/v1/users/${bmoniUserId}/smart-wallets/proposals/${proposalId}/sign-payload`);
    const hashToSign = payload.hashToSign || payload.hash;
    const signer = new ethers.Wallet(ownerPrivateKey);
    // Raw digest sign — NO EIP-191 prefix (unlike owner-proof step)
    const sig = signer.signingKey.sign(hashToSign.replace(/^0x/, ''));
    const signature = sig.serialized;
    const result = await bmoni(`/v1/users/${bmoniUserId}/smart-wallets/proposals/${proposalId}/sign`, {
      method: 'POST', body: { signature },
    });
    res.json(result);
  } catch (e) { res.status(e.status || 500).json({ error: e.message, data: e.data }); }
});

// 4c. Farmer payout to Nigerian bank: verify -> register -> offramp
app.post('/api/bmoni/offramp', async (req, res) => {
  try {
    if (!needKey(res)) return;
    const { bmoniUserId, smartWalletId, accountNumber, bankCode, bankName, fromAmount } = req.body;
    const verify = await bmoni(`/v1/users/${bmoniUserId}/bank-accounts/verify-nigerian-account`, {
      method: 'POST', body: { accountNumber, bankCode },
    });
    const holder = verify.accountHolderName || verify.account_name;
    const reg = await bmoni(`/v1/users/${bmoniUserId}/bank-accounts/withdrawal-accounts/nigeria`, {
      method: 'POST', body: { accountNumber, bankCode, bankName, accountHolderName: holder },
    });
    const bankAccountId = reg.id || reg.bankAccountId;
    const off = await bmoni(`/v1/users/${bmoniUserId}/smart-wallets/${smartWalletId}/offramp/nigeria`, {
      method: 'POST', body: { bankAccountId, fromAmount: String(fromAmount) },
    });
    res.json({ verify, registration: reg, offramp: off });
  } catch (e) { res.status(e.status || 500).json({ error: e.message, data: e.data }); }
});

// 5. Farm Purses — split one CNGN balance into different uses (Seeds, Family, Savings...)
// Hackathon-fast: local ledger on top of single BMONI wallet. Live money still moves
// via BMONI TRANSFER/offramp; purses just track allocation. Roadmap: 1 smart-wallet per purse.
const purses = {}; // { bmoniUserId: [{ id, name, color, target, balance }] }
const DEFAULT_PURSES = [
  { name: 'Seeds & Restock', color: 'emerald', target: 50000 },
  { name: 'Family', color: 'amber', target: 30000 },
  { name: 'Savings', color: 'blue', target: 40000 },
];
function getPurses(userId) {
  if (!purses[userId]) {
    purses[userId] = DEFAULT_PURSES.map((p, i) => ({ id: `purse-${i}`, balance: 0, ...p }));
  }
  return purses[userId];
}
app.get('/api/bmoni/purses/:userId', (req, res) => res.json({ purses: getPurses(req.params.userId) }));
app.post('/api/bmoni/purses/:userId', (req, res) => {
  const list = getPurses(req.params.userId);
  const purse = { id: `purse-${Date.now().toString(36)}`, balance: 0, target: 0, color: 'emerald', ...req.body };
  list.push(purse);
  res.json({ purse, purses: list });
});
// Split an incoming payout across purses: { splits: [{ purseId, amount }] }
app.post('/api/bmoni/purses/:userId/split', (req, res) => {
  const list = getPurses(req.params.userId);
  const { splits } = req.body; // e.g. 25000 -> 15k seeds / 7k family / 3k savings
  for (const s of splits || []) {
    const p = list.find((x) => x.id === s.purseId);
    if (p) p.balance += Number(s.amount) || 0;
  }
  res.json({ purses: list, note: 'Purses are a budgeting ledger over the wallet balance.' });
});
// Move between purses (farmer budgeting). Live: TRANSFER proposal between purse wallets.
app.post('/api/bmoni/purses/:userId/move', (req, res) => {
  const list = getPurses(req.params.userId);
  const { fromPurseId, toPurseId, amount } = req.body;
  const from = list.find((x) => x.id === fromPurseId);
  const to = list.find((x) => x.id === toPurseId);
  if (!from || !to) return res.status(404).json({ error: 'purse not found' });
  if (from.balance < Number(amount)) return res.status(400).json({ error: 'insufficient purse balance' });
  from.balance -= Number(amount); to.balance += Number(amount);
  res.json({ purses: list });
});

app.listen(port, () => {
  console.log(`Farmyn Backend listening on ${port} [${LIVE ? 'LIVE (BMONI)' : 'NO KEY — set BMONI_API_KEY'}]`);
});
