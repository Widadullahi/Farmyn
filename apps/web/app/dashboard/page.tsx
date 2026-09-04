"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  LayoutDashboard,
  Lock,
  LogOut,
  MessageSquare,
  PackageCheck,
  PanelLeftOpen,
  PiggyBank,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Store,
  X,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BmoniModeBadge } from "@/components/BmoniModeBadge";
import { MoneyAccountCard } from "@/components/MoneyAccountCard";
import { PursesWidget } from "@/components/PursesWidget";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext";
import { formatDate, formatNaira } from "@/lib/app-data";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/marketplace", label: "Marketplace", icon: Store },
  { href: "/cart", label: "Cart & Orders", icon: ShoppingCart },
  { href: "/purses", label: "Purses", icon: PiggyBank },
  { href: "/checkout-bmoni", label: "Secure Checkout", icon: ShieldCheck },
  { href: "/chat", label: "Messages", icon: MessageSquare },
] as const;

function SidebarLink({
  href,
  label,
  Icon,
  active,
  collapsed,
  onNavigate,
}: {
  href: string;
  label: string;
  Icon: typeof LayoutDashboard;
  active: boolean;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      aria-label={label}
      className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors ${
        collapsed ? "justify-center" : ""
      } ${
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}

export default function DashboardPage() {
  const { currentUser, orders, logout } = useApp();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

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

  const initials = (currentUser.storeName || currentUser.name).slice(0, 2).toUpperCase();

  const profile = (() => {
    const parts = currentUser.name.trim().split(/\s+/);
    return {
      firstName: parts[0] || "Farmyn",
      lastName: parts.slice(1).join(" ") || parts[0] || "User",
      email: currentUser.email,
      phoneNumber: currentUser.phone,
    };
  })();

  return (
    <div className="flex min-h-screen bg-muted/40">
      {/* Desktop sidebar — full height */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-card lg:flex">
        <div className="flex items-center gap-2.5 border-b border-border px-5 py-4">
          <img src="/farmlink-logo.png" alt="Farmyn" className="h-8 w-8" />
          <span className="font-display text-lg font-bold text-foreground">
            Farm<span className="text-primary">yn</span>
          </span>
        </div>
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-extrabold text-primary-foreground">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-foreground">{currentUser.storeName || currentUser.name}</p>
            <p className="text-[11px] font-semibold text-muted-foreground">
              {isSeller ? "Seller account" : "Buyer account"}
            </p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          <p className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Menu</p>
          {NAV_ITEMS.map((item) => (
            <SidebarLink
              key={item.href}
              href={item.href}
              label={item.label}
              Icon={item.icon}
              active={pathname === item.href}
            />
          ))}
          {isSeller && (
            <SidebarLink
              href="/seller/dashboard"
              label="Seller dashboard"
              Icon={ArrowRight}
              active={pathname === "/seller/dashboard"}
            />
          )}
        </nav>
        <div className="space-y-2 border-t border-border p-3">
          <BmoniModeBadge className="w-full justify-center" />
          <Button variant="ghost" size="sm" className="w-full gap-1.5" onClick={logout}>
            <LogOut className="h-3.5 w-3.5" /> Logout
          </Button>
        </div>
      </aside>

      {/* Mobile icon rail — always visible, expands to full menu on toggle */}
      <aside className="sticky top-0 flex h-screen w-16 shrink-0 flex-col items-center border-r border-border bg-card py-4 lg:hidden">
        <img src="/farmlink-logo.png" alt="Farmyn" className="h-8 w-8" />
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open full menu"
          title="Open full menu"
          className="mt-4 rounded-md p-2.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <PanelLeftOpen className="h-5 w-5" />
        </button>
        <nav className="mt-2 flex flex-1 flex-col items-center gap-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                title={item.label}
                className={`rounded-md p-2.5 transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
              </Link>
            );
          })}
        </nav>
        <button
          onClick={logout}
          aria-label="Logout"
          title="Logout"
          className="rounded-md p-2.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </aside>

      {/* Mobile expanded drawer — full menu, toggle back to icons */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
              <span className="flex items-center gap-2">
                <img src="/farmlink-logo.png" alt="Farmyn" className="h-7 w-7" />
                <span className="font-display text-base font-bold">Farm<span className="text-primary">yn</span></span>
              </span>
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Hide full menu"
                title="Hide full menu"
                className="rounded-md p-2 text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-extrabold text-primary-foreground">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{currentUser.storeName || currentUser.name}</p>
                <p className="text-[11px] font-semibold text-muted-foreground">
                  {isSeller ? "Seller account" : "Buyer account"}
                </p>
              </div>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto p-3">
              {NAV_ITEMS.map((item) => (
                <SidebarLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  Icon={item.icon}
                  active={pathname === item.href}
                  onNavigate={() => setMobileOpen(false)}
                />
              ))}
              {isSeller && (
                <SidebarLink
                  href="/seller/dashboard"
                  label="Seller dashboard"
                  Icon={ArrowRight}
                  active={pathname === "/seller/dashboard"}
                  onNavigate={() => setMobileOpen(false)}
                />
              )}
            </nav>
            <div className="border-t border-border p-3">
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => { logout(); setMobileOpen(false); }}
              >
                Logout
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background px-4 sm:px-6">
          <h1 className="font-display text-lg font-bold text-foreground">My Dashboard</h1>
          <div className="ml-auto flex items-center gap-2">
            <BmoniModeBadge className="hidden sm:inline-flex" />
            <Link href="/marketplace">
              <Button variant="outline" size="sm" className="gap-1.5">
                <ShoppingBag className="h-3.5 w-3.5" /> Marketplace
              </Button>
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-emerald-700">
                <LayoutDashboard className="h-4 w-4" /> {isSeller ? "Seller overview" : "My dashboard"}
              </span>
              <BmoniModeBadge />
            </div>
            <h2 className="mt-2 font-display text-3xl font-extrabold">
              Welcome back, {currentUser.storeName || currentUser.name}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isSeller ? "Track sales held in escrow and budget payouts with purses." : "Track your escrow orders and budget with purses."}
            </p>
          </div>

          {isSeller && (
            <div className="rounded-xl border border-primary/30 bg-accent/40 p-4 text-sm flex flex-wrap items-center justify-between gap-3">
              <span>Full store management lives in your seller dashboard.</span>
              <Link href="/seller/dashboard"><Button size="sm" className="gap-1.5">Open seller dashboard <ArrowRight className="h-3.5 w-3.5" /></Button></Link>
            </div>
          )}

          <MoneyAccountCard ownerKey={`farmlink-${currentUser.id}`} profile={profile} />

          <div className="grid gap-4 sm:grid-cols-3">
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

          <div className="grid gap-6 lg:grid-cols-2">
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

          <div className="rounded-md border border-border bg-card p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-sm">
              <PiggyBank className="h-5 w-5 text-primary" />
              <span className="text-muted-foreground">Want the full budgeting view with goals and custom splits?</span>
            </div>
            <Link href="/purses"><Button variant="outline" size="sm" className="gap-1.5">Open full purses <ArrowRight className="h-3.5 w-3.5" /></Button></Link>
          </div>
        </main>
      </div>
    </div>
  );
}
