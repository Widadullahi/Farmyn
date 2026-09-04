"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PiggyBank, Plus, ArrowRight } from 'lucide-react';
import { formatNaira } from '@/lib/app-data';

const BASE = process.env.NEXT_PUBLIC_BMONI_BACKEND_URL || 'http://localhost:3001';

const PURSE_COLORS: Record<string, string> = {
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  blue: 'bg-blue-500',
};

/** Money-pots widget. Lives inside dashboards (buyer/seller), scoped per account via ownerKey. */
export function PursesWidget({ ownerKey, compact = false }: { ownerKey: string; compact?: boolean }) {
  const [purses, setPurses] = useState<any[]>([]);
  const [payout, setPayout] = useState('');
  const [newName, setNewName] = useState('');

  const load = async () => {
    try {
      const r = await fetch(`${BASE}/api/bmoni/purses/${encodeURIComponent(ownerKey)}`).then((x) => x.json());
      setPurses(r.purses || []);
    } catch (_) { setPurses([]); }
  };
  useEffect(() => { load(); }, [ownerKey]);

  const splitPayout = async () => {
    const total = Number(payout) || 0;
    if (!total) return;
    const splits = purses.slice(0, 3).map((p, i) => ({
      purseId: p.id,
      amount: i === 0 ? total * 0.6 : i === 1 ? total * 0.25 : total * 0.15,
    }));
    const r = await fetch(`${BASE}/api/bmoni/purses/${encodeURIComponent(ownerKey)}/split`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ splits }),
    }).then((x) => x.json());
    setPurses(r.purses);
    setPayout('');
  };

  const create = async () => {
    if (!newName.trim()) return;
    const r = await fetch(`${BASE}/api/bmoni/purses/${encodeURIComponent(ownerKey)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), color: 'emerald', target: 20000 }),
    }).then((x) => x.json());
    setPurses(r.purses); setNewName('');
  };

  const total = purses.reduce((s, p) => s + (p.balance || 0), 0);
  const shown = compact ? purses.slice(0, 3) : purses;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-base font-bold">
          <PiggyBank className="h-4 w-4 text-primary" /> Farm Purses
        </h3>
        <Link href="/purses" className="text-xs font-semibold text-primary hover:underline">Open full view</Link>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Split every payout across uses — restock, family, savings.</p>
      <p className="mt-4 font-display text-3xl font-extrabold text-primary">{formatNaira(total)}</p>
      <p className="text-[11px] text-muted-foreground">Total across {purses.length} purses</p>

      <div className={`mt-4 grid gap-3 ${compact ? '' : 'sm:grid-cols-3'}`}>
        {shown.map((p) => {
          const pct = p.target ? Math.min(100, Math.round(((p.balance || 0) / p.target) * 100)) : 0;
          return (
            <div key={p.id} className="rounded-xl border border-border bg-background p-4">
              <p className="text-sm font-bold">{p.name}</p>
              <p className="mt-0.5 text-lg font-extrabold">{formatNaira(p.balance || 0)}</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className={`h-full rounded-full ${PURSE_COLORS[p.color] || 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">{pct}% of {formatNaira(p.target || 0)}</p>
            </div>
          );
        })}
      </div>
      {purses.length === 0 && (
        <p className="mt-3 text-sm text-muted-foreground">No purses yet — they’re created automatically on first load.</p>
      )}

      <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
        <input value={payout} inputMode="numeric" onChange={(e) => setPayout(e.target.value.replace(/[^0-9]/g, ''))} placeholder="Payout to split e.g. 25000" className="w-48 rounded-lg border border-input bg-background px-3 py-2 text-sm" />
        <Button size="sm" onClick={splitPayout} className="gap-1.5">Split 60/25/15 <ArrowRight className="h-3.5 w-3.5" /></Button>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New purse e.g. School fees" className="flex-1 min-w-44 rounded-lg border border-input bg-background px-3 py-2 text-sm" />
        <Button size="sm" variant="outline" onClick={create} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Add</Button>
      </div>
    </div>
  );
}
