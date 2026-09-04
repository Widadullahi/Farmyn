"use client";

import Link from "next/link";
import { ArrowRight, LayoutDashboard, Lock, PackageCheck, PiggyBank, ShoppingCart } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BmoniModeBadge } from "@/components/BmoniModeBadge";
import { MoneyAccountCard } from "@/components/MoneyAccountCard";
import { PursesWidget } from "@/components/PursesWidget";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext";
import { formatDate, formatNaira } from "@/lib/app-data";

export default function DashboardPage() {
  const { currentUser, orders } = useApp();

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20">
          <div className="mx-auto max-w-2xl rounded-md border border-border bg-card p-8 text-center shadow-sm">
            <h1 className="font-display text-3xl font-bold">My Dashboard</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Sign in to see your escrow orders, purses and payouts in one place.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link href="/login"><Button variant="outline">Login</Button></Link>
              <Link href="/register"><Button>Create account</Button></Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const isSeller = currentUser.role === "seller";
  const myOrders = orders.filter((o) => (isSeller ? o.sellerId === currentUser.id : o.buyerId === currentUser.id));
  const heldOrders = myOrders.filter((o) => o.paymentStatus === "Held in Escrow");
  const heldTotal = heldOrders.reduce((s, o) => s + o.total, 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-10 max-w-5xl">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-emerald-700">
            <LayoutDashboard className="h-4 w-4" /> {isSeller ? "Seller overview" : "My dashboard"}
          </span>
          <BmoniModeBadge />
        </div>
        <h1 className="mt-2 font-display text-3xl font-extrabold">
          Welcome back, {currentUser.storeName || currentUser.name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isSeller ? "Track sales held in escrow and budget payouts with purses." : "Track your escrow orders and budget with purses."}
        </p>

        {isSeller && (
          <div className="mt-4 rounded-xl border border-primary/30 bg-accent/40 p-4 text-sm flex flex-wrap items-center justify-between gap-3">
            <span>Full store management lives in your seller dashboard.</span>
            <Link href="/seller/dashboard"><Button size="sm" className="gap-1.5">Open seller dashboard <ArrowRight className="h-3.5 w-3.5" /></Button></Link>
          </div>
        )}

        <div className="mt-6">
          <MoneyAccountCard
            ownerKey={`farmlink-${currentUser.id}`}
            profile={(() => {
              const parts = currentUser.name.trim().split(/\s+/);
              return {
                firstName: parts[0] || "Farmyn",
                lastName: parts.slice(1).join(" ") || parts[0] || "User",
                email: currentUser.email,
                phoneNumber: currentUser.phone,
              };
            })()}
          />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Held in escrow", value: formatNaira(heldTotal), icon: Lock, hint: `${heldOrders.length} order${heldOrders.length === 1 ? "" : "s"}` },
            { label: isSeller ? "Sales orders" : "My orders", value: String(myOrders.length), icon: ShoppingCart, hint: "all time" },
            { label: "Released", value: String(myOrders.length - heldOrders.length), icon: PackageCheck, hint: "completed payouts" },
          ].map((s) => (
            <div key={s.label} className="rounded-md border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</span>
                <s.icon className="h-4 w-4 text-primary" />
              </div>
              <p className="mt-3 font-display text-2xl font-bold">{s.value}</p>
              <p className="text-[11px] text-muted-foreground">{s.hint}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-md border border-border bg-card p-6 shadow-sm">
            <h2 className="text-base font-bold">{isSeller ? "Latest sales" : "Latest orders"}</h2>
            <div className="mt-4 space-y-3">
              {myOrders.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No orders yet. <Link href="/marketplace" className="font-semibold text-primary hover:underline">Browse the marketplace</Link>.
                </p>
              )}
              {myOrders.slice(0, 4).map((o) => (
                <div key={o.id} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 text-sm">
                  <div>
                    <p className="font-semibold">{o.id}</p>
                    <p className="text-xs text-muted-foreground">{isSeller ? o.buyerName : o.sellerName} · {formatDate(o.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatNaira(o.total)}</p>
                    <p className="text-[11px] text-secondary font-semibold">{o.paymentStatus}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/cart"><Button size="sm" variant="outline">Track orders</Button></Link>
              {!isSeller && (
                <Link href="/checkout-bmoni"><Button size="sm" className="gap-1.5"><Lock className="h-3.5 w-3.5" /> Pay with escrow</Button></Link>
              )}
            </div>
          </div>

          <PursesWidget ownerKey={`farmlink-${currentUser.id}`} compact />
        </div>

        <div className="mt-6 rounded-md border border-border bg-card p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-sm">
            <PiggyBank className="h-5 w-5 text-primary" />
            <span className="text-muted-foreground">Want the full budgeting view with goals and custom splits?</span>
          </div>
          <Link href="/purses"><Button variant="outline" size="sm" className="gap-1.5">Open full purses <ArrowRight className="h-3.5 w-3.5" /></Button></Link>
        </div>
      </main>
    </div>
  );
}
