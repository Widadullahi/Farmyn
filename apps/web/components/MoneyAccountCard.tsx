"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { bmoni } from '@/lib/bmoni';
import { formatNaira } from '@/lib/app-data';
import { Landmark, RefreshCw, ShieldCheck, Wallet } from 'lucide-react';

export interface MoneyProfile {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}

interface Acct {
  bmoniUserId: string;
  smartWalletId?: string;
  walletAddress?: string;
  ownerPrivateKey?: string;
  vba?: any;
  railActive?: boolean;
}

const SANDBOX_PERSONAS = [
  {
    label: 'Farmer demo — Bunch Dillon',
    firstName: 'Bunch',
    lastName: 'Dillon',
    email: 'bunch.sandbox@farmyn.test',
    phoneNumber: '+2348000000000',
    bvn: '95888168924',
  },
  {
    label: 'Second demo — Samson Jabo',
    firstName: 'Samson',
    lastName: 'Jabo',
    email: 'samson.sandbox@farmyn.test',
    phoneNumber: '+2348000000001',
    bvn: '22222222222',
  },
];

function lsKey(ownerKey: string) {
  return `bmoni-account-${ownerKey}`;
}

function normalizeBalances(raw: any): { currency: string; amount: string }[] {
  if (!raw) return [];
  const arr = Array.isArray(raw) ? raw : raw.balances || raw.data || raw.items || [];
  if (!Array.isArray(arr)) return [];
  return arr.map((b: any) => ({
    currency: b.currency || b.symbol || b.code || 'CNGN',
    amount: String(b.amount ?? b.balance ?? b.available ?? 0),
  }));
}

/**
 * Real BMONI money-account setup, embedded in dashboards.
 * Logged-in profile → BMONI user → CNGN wallet → BVN rail activation →
 * live virtual account + balance. State persists per FarmLink account.
 */
export function MoneyAccountCard({ ownerKey, profile }: { ownerKey: string; profile: MoneyProfile }) {
  const [acct, setAcct] = useState<Acct | null>(null);
  const [bvn, setBvn] = useState('');
  const [balances, setBalances] = useState<{ currency: string; amount: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [personaIdx, setPersonaIdx] = useState<number | null>(null);
  const [manualId, setManualId] = useState('');

  const activeProfile: MoneyProfile =
    personaIdx !== null
      ? {
          firstName: SANDBOX_PERSONAS[personaIdx].firstName,
          lastName: SANDBOX_PERSONAS[personaIdx].lastName,
          email: SANDBOX_PERSONAS[personaIdx].email,
          phoneNumber: SANDBOX_PERSONAS[personaIdx].phoneNumber,
        }
      : profile;

  const pickPersona = (idx: number | null) => {
    setPersonaIdx(idx);
    if (idx !== null) setBvn(SANDBOX_PERSONAS[idx].bvn);
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(lsKey(ownerKey));
      if (raw) {
        const a = JSON.parse(raw);
        if (a?.bmoniUserId) {
          setAcct(a);
          refreshBalances(a.bmoniUserId);
        }
      }
    } catch (_) {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerKey]);

  const save = (a: Acct) => {
    setAcct(a);
    try { localStorage.setItem(lsKey(ownerKey), JSON.stringify(a)); } catch (_) {}
  };

  const refreshBalances = async (id: string) => {
    try {
      const b = await bmoni.balances(id);
      setBalances(normalizeBalances(b));
    } catch (_) { setBalances([]); }
  };

  const err = (e: any) => {
    const m = String(e?.message || 'Request failed');
    if (/already exists/i.test(m)) {
      setMsg('That phone/email already has a BMONI user (409). Click “Find my existing account” to link it, or paste its bmoniUserId below. On this shared sandbox key the number may belong to another partner — Samson Jabo is the fallback.');
    } else {
      setMsg(m);
    }
  };

  async function createAccount() {
    setLoading(true); setMsg('');
    try {
      const u = await bmoni.createUser(activeProfile) as any;
      const bmoniUserId = u.bmoniUserId || u.id;
      if (!bmoniUserId) throw new Error('Unexpected response from account creation.');
      save({ bmoniUserId });
      setMsg(`Money account created${u.reused ? ' (existing account linked)' : ''}. Now create your wallet.`);
    } catch (e: any) { err(e); }
    finally { setLoading(false); }
  }

  async function findExisting() {
    setLoading(true); setMsg('');
    try {
      const r = await bmoni.recoverUser(activeProfile.phoneNumber, activeProfile.email);
      save({ ...(acct || {}), bmoniUserId: r.bmoniUserId } as Acct);
      setMsg('Existing account linked. Now create your wallet (or continue below if you already have one).');
    } catch (e: any) { err(e); }
    finally { setLoading(false); }
  }

  function linkManual() {
    const id = manualId.trim();
    if (!id) { setMsg('Paste an existing bmoniUserId first.'); return; }
    save({ ...(acct || {}), bmoniUserId: id } as Acct);
    setMsg('Account linked by ID. Continue with wallet creation below.');
  }

  function startFresh() {
    try { localStorage.removeItem(lsKey(ownerKey)); } catch (_) {}
    setAcct(null);
    setBalances([]);
    setMsg('Saved account cleared. Pick a persona and create again, or link an existing ID.');
  }

  async function createWallet() {
    if (!acct?.bmoniUserId) return;
    setLoading(true); setMsg('');
    try {
      const w = await bmoni.createWallet(acct.bmoniUserId) as any;
      const next = {
        ...acct,
        smartWalletId: w.smartWalletId || w.id,
        walletAddress: w.address || w.smartWalletAddress,
        ownerPrivateKey: w._demoOwnerPrivateKey,
      };
      save(next);
      setMsg('CNGN wallet created. Enter your BVN to activate the Naira rail.');
    } catch (e: any) { err(e); }
    finally { setLoading(false); }
  }

  async function activateRail() {
    if (!acct?.bmoniUserId) return;
    const clean = bvn.replace(/\D/g, '');
    if (clean.length !== 11) { setMsg('BVN must be exactly 11 digits.'); return; }
    setLoading(true); setMsg('');
    try {
      await bmoni.onboardNGN(acct.bmoniUserId, clean, acct.walletAddress || '');
      const vbaRaw = await bmoni.depositAccount(acct.bmoniUserId);
      const vbaList = (vbaRaw as any)?.accounts || (vbaRaw as any)?.data?.accounts || [];
      const vba = Array.isArray(vbaList) && vbaList.length > 0 ? vbaList[0] : (vbaRaw as any);
      save({ ...acct, vba, railActive: true });
      await refreshBalances(acct.bmoniUserId);
      setMsg('Naira rail active. Your virtual account is ready to receive.');
    } catch (e: any) { err(e); }
    finally { setLoading(false); }
  }

  return (
    <div className="rounded-md border border-border bg-card p-6 shadow-sm">
      <h3 className="flex items-center gap-2 text-base font-bold">
        <Landmark className="h-4 w-4 text-primary" /> Money account
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        A real BMONI-backed Naira account: wallet, virtual account number and bank payouts.
      </p>

      <details className="mt-4 rounded-md border border-dashed border-border bg-muted/30 p-3" open={!acct?.bmoniUserId}>
        <summary className="cursor-pointer text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Sandbox test identities</summary>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Sandbox verification only passes with these exact name + phone pairs. Pick one for farmer testing — BVN auto-fills.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {SANDBOX_PERSONAS.map((p, i) => (
            <Button
              key={p.phoneNumber}
              size="sm"
              variant={personaIdx === i ? 'default' : 'outline'}
              disabled={loading}
              onClick={() => pickPersona(personaIdx === i ? null : i)}
            >
              {p.label}
            </Button>
          ))}
          {personaIdx !== null && (
            <Button size="sm" variant="ghost" disabled={loading} onClick={() => pickPersona(null)}>
              Use my own details
            </Button>
          )}
        </div>
        {personaIdx !== null && (
          <p className="mt-2 text-xs">
            Using <span className="font-semibold">{SANDBOX_PERSONAS[personaIdx].firstName} {SANDBOX_PERSONAS[personaIdx].lastName}</span>
            {' '}· {SANDBOX_PERSONAS[personaIdx].phoneNumber} · BVN {SANDBOX_PERSONAS[personaIdx].bvn}
          </p>
        )}
      </details>

      {!acct?.bmoniUserId && (
        <div className="mt-4 space-y-2">
          <div className="rounded-md bg-muted/50 p-3 text-sm">
            <p className="font-semibold">{activeProfile.firstName} {activeProfile.lastName}</p>
            <p className="text-xs text-muted-foreground">{activeProfile.email} · {activeProfile.phoneNumber}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" disabled={loading} onClick={createAccount}>Create money account</Button>
            <Button size="sm" variant="outline" disabled={loading} onClick={findExisting}>Find my existing account</Button>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <input
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
              placeholder="Existing bmoniUserId (from 409 / earlier log)"
              className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 text-xs"
            />
            <Button size="sm" variant="secondary" disabled={loading} onClick={linkManual}>Link by ID</Button>
          </div>
        </div>
      )}

      {acct?.bmoniUserId && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <p className="text-[11px] text-muted-foreground">Linked: <span className="font-mono">{acct.bmoniUserId.slice(0, 8)}…</span></p>
          <button onClick={startFresh} className="text-[11px] font-semibold text-muted-foreground underline hover:text-foreground">
            Start fresh / switch persona
          </button>
        </div>
      )}

      {acct?.bmoniUserId && !acct?.smartWalletId && (
        <div className="mt-4 space-y-2">
          <p className="text-sm text-muted-foreground">Account linked. Next: provision your CNGN smart wallet.</p>
          <Button size="sm" disabled={loading} onClick={createWallet} className="gap-1.5">
            <Wallet className="h-3.5 w-3.5" /> Create CNGN wallet
          </Button>
        </div>
      )}

      {acct?.smartWalletId && !acct?.railActive && (
        <div className="mt-4 space-y-2">
          <p className="text-sm text-muted-foreground">Wallet ready. Enter your 11-digit BVN to activate Naira deposits and withdrawals.</p>
          <div className="flex flex-wrap gap-2">
            <input
              value={bvn} inputMode="numeric" maxLength={11}
              onChange={(e) => setBvn(e.target.value.replace(/\D/g, '').slice(0, 11))}
              placeholder="Bank Verification Number"
              className="w-56 rounded-md border border-input bg-background px-3 py-2 text-sm tracking-widest"
            />
            <Button size="sm" disabled={loading} onClick={activateRail}>Activate Naira rail</Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Sandbox: BVN auto-filled from the selected test identity above. Verification only passes with matching registered details.
          </p>
        </div>
      )}

      {acct?.railActive && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
            <ShieldCheck className="h-4 w-4" /> Naira rail active
          </div>
          {acct.vba && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-700">Your virtual account</p>
              <p className="mt-0.5 text-lg font-extrabold tracking-wider">{acct.vba.accountNumber || acct.vba.account_number}</p>
              <p className="text-xs text-muted-foreground">{acct.vba.bankName} · transfers land as CNGN</p>
            </div>
          )}
          <div className="flex items-center justify-between rounded-md bg-muted/50 p-3 text-sm">
            <span className="text-muted-foreground">Wallet balance</span>
            <span className="font-bold">
              {balances.length === 0 ? '—' : balances.map((b) => `${b.currency} ${Number(b.amount).toLocaleString()}`).join(' · ')}
            </span>
            <button onClick={() => acct.bmoniUserId && refreshBalances(acct.bmoniUserId)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted" aria-label="Refresh balance">
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
          <Link href="/checkout-bmoni">
            <Button size="sm" className="w-full">Go to Secure Checkout</Button>
          </Link>
        </div>
      )}

      {msg && <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{msg}</p>}
    </div>
  );
}
