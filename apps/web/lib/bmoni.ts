// Tiny client for Farmyn BMONI escrow backend (apps/backend/index.js).
// Set NEXT_PUBLIC_BMONI_BACKEND_URL to http://localhost:3001 (or deployed URL).
const BASE = process.env.NEXT_PUBLIC_BMONI_BACKEND_URL || 'http://localhost:3001';

async function call(path: string, body?: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!res.ok) {
    // Surface server hint + raw data (409s sometimes carry the existing record)
    const extra = data?.hint ? ` Hint: ${data.hint}` : '';
    const raw = data?.data ? ` Data: ${JSON.stringify(data.data).slice(0, 300)}` : '';
    throw new Error(`${data.error || `Request failed: ${path}`}${extra}${raw}`);
  }
  return data;
}

export const bmoni = {
  createUser: (u: { firstName: string; lastName: string; email: string; phoneNumber: string }) =>
    call('/api/bmoni/users', u),
  recoverUser: (phone: string, email: string) =>
    fetch(`${BASE}/api/bmoni/users/recover?phone=${encodeURIComponent(phone)}&email=${encodeURIComponent(email)}`).then(async (r) => {
      const data = await r.json();
      if (!r.ok) throw new Error(`${data.error || 'Recover failed'}${data.debug ? ` Debug: ${JSON.stringify(data.debug).slice(0, 400)}` : ''}`);
      return data as { bmoniUserId: string };
    }),
  resetAccounts: () =>
    call('/api/bmoni/reset', { phones: ['+2348000000000', '+2348000000001'] }),
  createWallet: (bmoniUserId: string) => call('/api/bmoni/wallet', { bmoniUserId, currency: 'CNGN' }),
  onboardNGN: (bmoniUserId: string, bvn: string, ngnWalletAddress: string) =>
    call('/api/bmoni/onboard-ngn', { bmoniUserId, bvn, ngnWalletAddress, ngnWalletIndex: 0 }),
  status: (bmoniUserId: string) => fetch(`${BASE}/api/bmoni/status/${bmoniUserId}`).then((r) => r.json()),
  balances: (bmoniUserId: string) => fetch(`${BASE}/api/bmoni/balances/${bmoniUserId}`).then((r) => r.json()),
  depositAccount: (bmoniUserId: string) =>
    fetch(`${BASE}/api/bmoni/deposit-account/${bmoniUserId}`).then((r) => r.json()),
  lockEscrow: (p: { bmoniUserId: string; smartWalletId: string; toAddress: string; amount: string; description?: string }) =>
    call('/api/bmoni/escrow/lock', p),
  releaseEscrow: (p: { bmoniUserId: string; proposalId: string; ownerPrivateKey?: string }) =>
    call('/api/bmoni/escrow/release', p),
  offramp: (p: { bmoniUserId: string; smartWalletId: string; accountNumber: string; bankCode: string; bankName: string; fromAmount: string }) =>
    call('/api/bmoni/offramp', p),
  health: () =>
    fetch(`${BASE}/api/bmoni/health`).then(async (r) => {
      try { return await r.json(); } catch { return { mode: 'unreachable', keyValid: false }; }
    }),
};
