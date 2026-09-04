"use client";

import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { BmoniModeBadge } from '@/components/BmoniModeBadge';
import { PursesWidget } from '@/components/PursesWidget';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { PiggyBank } from 'lucide-react';

export default function PursesPage() {
  const { currentUser } = useApp();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-10 max-w-4xl">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-emerald-700">
            <PiggyBank className="h-4 w-4" /> Farm purses
          </span>
          <BmoniModeBadge />
        </div>
        <h1 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">One harvest, every need covered</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Split each payout into purses — restock the farm, care for family, grow savings.
          Powered by BMONI rails: real money moves on payout, purses track every naira.
        </p>

        {!currentUser ? (
          <div className="mt-6 rounded-md border border-border bg-card p-8 text-center shadow-sm">
            <h2 className="text-lg font-bold">Sign in to see your purses</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Purses belong to your account — they load automatically once you sign in.
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <Link href="/login"><Button variant="outline">Login</Button></Link>
              <Link href="/register"><Button>Create account</Button></Link>
            </div>
          </div>
        ) : (
          <div className="mt-6">
            <PursesWidget ownerKey={`farmlink-${currentUser.id}`} />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
