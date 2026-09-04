"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { BmoniModeBadge } from '@/components/BmoniModeBadge';
import { Button } from '@/components/ui/button';
import { bmoni } from '@/lib/bmoni';
import { useApp } from '@/context/AppContext';
import { formatNaira } from '@/lib/app-data';
import {
  ShieldCheck, Lock, Banknote, CheckCircle2, Wallet, Building2,
  PackageCheck, RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Step = 1 | 2 | 3 | 4 | 5;

const STEP_META = [
  { label: 'Account', icon: ShieldCheck },
  { label: 'Wallet', icon: Wallet },
  { label: 'NGN rail', icon: Building2 },
  { label: 'Escrow lock', icon: Lock },
  { label: 'Release & payout', icon: PackageCheck },
];

interface Identity {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  bvn: string;
}

function identityFromName(name: string, email: string, phone: string): Identity {
  const parts = name.trim().split(/\s+/);
  return {
    firstName: parts[0] || 'Farmyn',
    lastName: parts.slice(1).join(' ') || parts[0] || 'User',
    email,
    phoneNumber: phone,
    bvn: '',
  };
}

export default function BmoniCheckoutPage() {
  const { currentUser } = useApp();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [ids, setIds] = useState<any>({});
  const [amount, setAmount] = useState('28000');
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [existingId, setExistingId] = useState('');

  const push = (m: string) => setLog((l) => [...l, `${new Date().toLocaleTimeString()} — ${m}`]);
  const saveIds = (v: any) => {
    setIds(v);
    try { localStorage.setItem('farmlink-bmoni-ids', JSON.stringify(v)); } catch (_) {}
  };

  useEffect(() => {
    if (currentUser) setIdentity(identityFromName(currentUser.name, currentUser.email, currentUser.phone));
    try {
      const raw = localStorage.getItem('farmlink-bmoni-ids');
      if (raw) {
        const v = JSON.parse(raw);
        if (v?.bmoniUserId) {
          setIds(v);
          setExistingId(v.bmoniUserId);
          push(`Resumed saved session: ${v.bmoniUserId}.`);
        }
      }
    } catch (_) {}
    try {
      const q = new URLSearchParams(window.location.search).get('amount');
      if (q && Number(q) > 0) {
        setAmount(String(Math.round(Number(q))));
        push(`Order total carried over: ${q}.`);
      }
    } catch (_) {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  async function continueFromUser(bmoniUserId: string) {
    bmoniUserId = (bmoniUserId || '').trim();
    if (!identity) return;
    if (bmoniUserId.length < 8 || /\s/.test(bmoniUserId)) {
      push('That input is not a valid account id. Create the account first, or paste an id from an earlier run.');
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      push(`Continuing with money account ${bmoniUserId}…`);
      setStep(2);
      push('Provisioning CNGN smart wallet (owner-proof → create-managed)…');
      const wallet = await bmoni.createWallet(bmoniUserId);
      const smartWalletId = (wallet as any).smartWalletId || (wallet as any).id;
      const walletAddress = (wallet as any).address || (wallet as any).smartWalletAddress;
      if (!smartWalletId) throw new Error('Wallet provisioning returned no id.');
      if ((wallet as any).reused) push('Wallet already existed — reusing it (owner-key release signing unavailable for reused wallets).');
      else push(`Wallet ready: ${smartWalletId}`);
      const next = { bmoniUserId, smartWalletId, walletAddress, ownerPrivateKey: (wallet as any)._demoOwnerPrivateKey };
      saveIds(next);
      setStep(3);

      const cleanBvn = identity.bvn.replace(/\D/g, '');
      if (cleanBvn.length !== 11) {
        push('Enter your 11-digit BVN below, then click “Continue with saved account” again to activate the rail.');
        setLoading(false);
        return;
      }
      push('Activating Naira rail (BVN verified) + fetching virtual account…');
      await bmoni.onboardNGN(bmoniUserId, cleanBvn, walletAddress || '');
      const vba = await bmoni.depositAccount(bmoniUserId);
      push(`Naira rail active. Buyer pays ${(vba as any).accountNumber || (vba as any).account_number} → credited as CNGN.`);
      const withVba = { ...next, vba };
      saveIds(withVba);
      setStep(4);

      push(`Locking ${formatNaira(Number(amount) || 0)} in escrow…`);
      const lock = await bmoni.lockEscrow({
        bmoniUserId,
        smartWalletId,
        toAddress: walletAddress,
        amount: Number(amount).toFixed(2),
        description: 'Farmyn escrow order',
      });
      push(`Funds locked — proposal ${(lock as any).proposalId}. The farmer cannot withdraw yet.`);
      saveIds({ ...withVba, proposalId: (lock as any).proposalId });
      setStep(5);
    } catch (e: any) {
      push(`ERROR: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function runFullCheckout() {
    if (!identity) return;
    setLoading(true);
    setLog([]);
    try {
      if (!/^\+?\d{10,15}$/.test(identity.phoneNumber.replace(/\s/g, ''))) {
        throw new Error('Your profile phone number is not international format. Update it in your profile (e.g. +2348012345678).');
      }
      push(`Creating money account for ${identity.firstName} ${identity.lastName}…`);
      let bmoniUserId: string;
      try {
        const user = await bmoni.createUser({
          firstName: identity.firstName,
          lastName: identity.lastName,
          email: identity.email,
          phoneNumber: identity.phoneNumber,
        }) as any;
        bmoniUserId = user.bmoniUserId || user.id;
        if (!bmoniUserId) throw new Error('Unexpected response from account creation.');
        push(`Account ready${user.reused ? ' (existing account linked)' : ''}.`);
      } catch (e: any) {
        if (/already exists/i.test(e.message || '')) {
          push('An account with this phone/email already exists. Use “Continue with saved account” or “Find my account” below.');
        }
        throw e;
      }
      await continueFromUser(bmoniUserId!);
    } catch (e: any) {
      push(`ERROR: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function release() {
    setLoading(true);
    try {
      push('Buyer confirmed delivery — releasing escrow…');
      const r = await bmoni.releaseEscrow({
        bmoniUserId: ids.bmoniUserId,
        proposalId: ids.proposalId,
        ownerPrivateKey: ids.ownerPrivateKey,
      });
      push(`Released (${(r as any).status}). Paying farmer via bank offramp…`);
      const off = await bmoni.offramp({
        bmoniUserId: ids.bmoniUserId,
        smartWalletId: ids.smartWalletId,
        accountNumber: '0123456789',
        bankCode: '058',
        bankName: 'Guaranty Trust Bank',
        fromAmount: Number(amount).toFixed(2),
      });
      push(`Farmer paid: ${(off as any).note || (off as any).status || 'offramp completed'}.`);
    } catch (e: any) {
      push(`ERROR: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  const amountNum = Number(amount) || 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-10 max-w-5xl">
        <div className="mb-4">
          <Link href="/cart" className="text-xs font-semibold text-muted-foreground hover:text-foreground">← Back to cart & orders</Link>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-emerald-700">
            <ShieldCheck className="h-4 w-4" /> BMONI-secured checkout
          </span>
          <BmoniModeBadge />
        </div>
        <h1 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">Pay safely — farmer gets paid on delivery</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Your payment goes into a protected escrow balance (CNGN) powered by BMONI rails.
          The farmer ships knowing funds are secured, and money is released to their bank
          only after you confirm delivery. No delivery, no payout.
        </p>

        <ol className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {STEP_META.map((s, i) => {
            const n = (i + 1) as Step;
            const done = step > n || step === 5;
            const current = step === n && step !== 5;
            const Icon = done ? CheckCircle2 : s.icon;
            return (
              <li key={s.label} className={cn(
                'flex items-center gap-2 rounded-md border p-3 text-xs font-semibold',
                done ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : current ? 'border-primary/40 bg-accent/50 text-foreground' : 'border-border bg-card text-muted-foreground',
              )}>
                <Icon className={cn('h-4 w-4 shrink-0', done ? 'text-emerald-600' : current ? 'text-primary' : '')} />
                <span><span className="mr-1 opacity-60">{n}.</span>{s.label}</span>
              </li>
            );
          })}
        </ol>

        {!currentUser || !identity ? (
          <div className="mt-6 rounded-md border border-border bg-card p-8 text-center shadow-sm">
            <h2 className="text-lg font-bold">Sign in to check out securely</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Your money account is created from your FarmLink profile — no extra forms.
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <Link href="/login"><Button variant="outline">Login</Button></Link>
              <Link href="/register"><Button>Create account</Button></Link>
            </div>
          </div>
        ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
          <div className="rounded-md border border-border bg-card p-6 shadow-sm">
            <h2 className="text-base font-bold">Order summary</h2>
            <div className="mt-4 space-y-3 rounded-md bg-muted/40 p-4 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Buyer</span><span className="font-semibold">{identity.firstName} {identity.lastName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span className="font-semibold">{identity.phoneNumber}</span></div>
              <div className="flex justify-between border-t border-border pt-3 text-base font-extrabold"><span>Total held in escrow</span><span className="text-primary">{formatNaira(amountNum)}</span></div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold">Amount (₦)
                <input value={amount} inputMode="decimal" onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2" />
              </label>
              <label className="block text-sm font-semibold">BVN (11 digits)
                <input value={identity.bvn} inputMode="numeric" maxLength={11} onChange={(e) => setIdentity({ ...identity, bvn: e.target.value.replace(/\D/g, '').slice(0, 11) })} placeholder="Your BVN" className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 tracking-widest" />
              </label>
            </div>
            <details className="mt-3 text-xs text-muted-foreground">
              <summary className="cursor-pointer font-semibold">Testing on sandbox?</summary>
              <p className="mt-1">Only two personas verify: Bunch Dillon (+2348000000000, BVN 95888168924) and Samson Jabo (+2348000000001, BVN 22222222222). Numbers are first-come on the shared key — a 409 means another team holds it; use “Find my account” below.</p>
            </details>

            <div className="mt-5 flex flex-wrap gap-3">
              <Button onClick={runFullCheckout} disabled={loading} size="lg" className="gap-2">
                <Lock className="h-4 w-4" /> {loading ? 'Processing…' : 'Fund escrow'}
              </Button>
              <Button onClick={release} disabled={loading || !ids.proposalId} size="lg" variant="outline" className="gap-2">
                <Banknote className="h-4 w-4" /> Confirm delivery & pay farmer
              </Button>
            </div>

            <details className="mt-5 rounded-md border border-border p-4 text-sm">
              <summary className="cursor-pointer font-semibold">Already have a money account? Continue or find it</summary>
              <div className="mt-3 space-y-2">
                <div className="flex gap-2">
                  <input value={existingId} onChange={(e) => setExistingId(e.target.value)} placeholder="Paste account id" className="flex-1 rounded-md border border-input px-3 py-2" />
                  <Button variant="outline" disabled={loading || !existingId} onClick={() => continueFromUser(existingId)}>Continue</Button>
                </div>
                <Button
                  variant="secondary" disabled={loading}
                  onClick={async () => {
                    setLoading(true);
                    try {
                      push(`Looking up account for ${identity.phoneNumber}…`);
                      const r = await bmoni.recoverUser(identity.phoneNumber, identity.email);
                      push('Account found. Continuing…');
                      setExistingId(r.bmoniUserId);
                      await continueFromUser(r.bmoniUserId);
                    } catch (e: any) { push(`Lookup failed: ${e.message}`); }
                    finally { setLoading(false); }
                  }}
                >
                  <RotateCcw className="h-4 w-4 mr-1.5" /> Find my account
                </Button>
              </div>
            </details>
          </div>

          <div className="space-y-6">
            <div className="rounded-md border border-border bg-card p-6 shadow-sm">
              <h2 className="text-base font-bold flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" /> Payment destination</h2>
              {ids.vba ? (
                <div className="mt-4 rounded-md bg-emerald-50 border border-emerald-200 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-700">Transfer exactly</p>
                  <p className="mt-1 text-2xl font-extrabold text-emerald-900">{formatNaira(amountNum)}</p>
                  <p className="mt-2 text-sm">Acct <b className="tracking-wider">{ids.vba.accountNumber || ids.vba.account_number}</b></p>
                  <p className="text-sm text-muted-foreground">{ids.vba.bankName} · {ids.vba.accountName || 'Farmyn Escrow'}</p>
                  <p className="mt-2 text-[11px] text-emerald-800">Auto-credited as CNGN and locked until you confirm delivery.</p>
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">Click <b>Fund escrow</b> to generate your protected payment account for this order.</p>
              )}
            </div>

            <div className="rounded-md border border-border bg-card p-6 shadow-sm">
              <h2 className="text-base font-bold">Why it’s safe</h2>
              <ul className="mt-3 space-y-2.5 text-sm text-muted-foreground">
                {[['Farmer ships with confidence', 'They see funds locked before dispatch.'], ['You inspect first', 'Release happens only on your confirmation.'], ['Bank-grade rails', 'Powered by BMONI Embedded wallets and NGN rails.']].map(([t, d]) => (
                  <li key={t} className="flex gap-2.5">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-emerald-600" />
                    <span><b className="text-foreground">{t}.</b> {d}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        )}

        <div className="mt-6 rounded-md border border-border bg-card p-6 shadow-sm">
          <h2 className="text-base font-bold">Order activity</h2>
          <div className="mt-3 max-h-56 overflow-auto rounded-md bg-slate-950 p-4 font-mono text-xs leading-relaxed text-emerald-300">
            {log.length === 0 ? <span className="text-slate-500">Every escrow event will appear here with a timestamp…</span> : log.map((l, i) => <div key={i}>{l}</div>)}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
