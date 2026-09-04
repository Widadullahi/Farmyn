"use client";

import { useEffect, useState } from 'react';
import { bmoni } from '@/lib/bmoni';
import { cn } from '@/lib/utils';

type Mode = 'live' | 'unconfigured' | 'unreachable' | 'checking';

export function BmoniModeBadge({ className }: { className?: string }) {
  const [mode, setMode] = useState<Mode>('checking');

  useEffect(() => {
    bmoni.health()
      .then((h: any) => setMode(h?.mode === 'live' ? 'live' : h?.mode === 'unconfigured' ? 'unconfigured' : 'unreachable'))
      .catch(() => setMode('unreachable'));
  }, []);

  const styles: Record<Mode, string> = {
    checking: 'bg-muted text-muted-foreground',
    live: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    unconfigured: 'bg-amber-50 text-amber-700 border-amber-200',
    unreachable: 'bg-red-50 text-red-700 border-red-200',
  };

  const labels: Record<Mode, string> = {
    checking: 'Checking payments…',
    live: 'Connected · BMONI',
    unconfigured: 'Payments not configured',
    unreachable: 'Payments offline',
  };

  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold', styles[mode], className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', mode === 'live' ? 'bg-emerald-500' : mode === 'checking' ? 'bg-muted-foreground animate-pulse' : mode === 'unconfigured' ? 'bg-amber-500' : 'bg-red-500')} />
      {labels[mode]}
    </span>
  );
}
