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
      setMsg('An account with this phone/email already exists. Use “Find my existing account” below instead of creating a new one.');
    } else {
      setMsg(m);
    }
  };

  async function createAccount() {
    setLoading(true); setMsg('');
    try {
      const u = await bmoni.createUser(profile) as any;
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
      const r = await bmoni.recoverUser(profile.phoneNumber, profile.email);
      save({ ...(acct || {}), bmoniUserId: r.bmoniUserId } as Acct);
      setMsg('Existing account linked. Now create your wallet (or continue below if you already have one).');
    } catch (e: any) { err(e); }
    finally { setLoading(false); }
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
      const vba = await bmoni.depositAccount(acct.bmoniUserId);
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

      {!acct?.bmoniUserId && (
        <div className="mt-4 space-y-2">
          <div className="rounded-md bg-muted/50 p-3 text-sm">
            <p className="font-semibold">{profile.firstName} {profile.lastName}</p>
            <p className="text-xs text-muted-foreground">{profile.email} · {profile.phoneNumber}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" disabled={loading} onClick={createAccount}>Create money account</Button>
            <Button size="sm" variant="outline" disabled={loading} onClick={findExisting}>Find my existing account</Button>
          </div>
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
            Testing on sandbox? Your mentor can provide a test BVN — verification only passes with matching registered details.
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
