"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowDownLeft, ArrowRight, ArrowUpRight, Check, ChevronDown, ClipboardList, Clock3, Package, Plus, Search, ShoppingBag, Sprout, Wallet } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { formatNaira, Order } from "@/lib/app-data";
import { Button } from "@/components/ui/button";

type SellerSection = "inventory" | "orders" | "profile";

export default function DashboardOverview({ onSellerNavigate }: { onSellerNavigate?: (section: SellerSection) => void }) {
  const { currentUser, orders, products, cartCount } = useApp();
  const [period, setPeriod] = useState("all");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  if (!currentUser) return null;
  const seller = currentUser.role === "seller";
  const mine = orders.filter(o => seller ? o.sellerId === currentUser.id : o.buyerId === currentUser.id);
  const now = new Date();
  const cutoff = now.getTime() - Number(period) * 86400000;
  const selected = mine.filter(o => period === "all" || new Date(o.createdAt).getTime() >= cutoff);
  const completed = selected.filter(o => o.status === "Completed");
  const active = selected.filter(o => o.status !== "Completed");
  const awaiting = selected.filter(o => seller ? o.status === "Pending Seller Confirmation" : o.status === "Delivered");
  const inventory = products.filter(p => p.sellerId === currentUser.id);
  const value = selected.reduce((sum, o) => sum + (seller ? o.subtotal : o.total), 0);
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
    const monthly = selected.filter(o => { const d = new Date(o.createdAt); return d.getFullYear() === date.getFullYear() && d.getMonth() === date.getMonth(); });
    return { label: date.toLocaleDateString("en-NG", { month: "short" }), value: monthly.reduce((sum, o) => sum + (seller ? o.subtotal : o.total), 0) };
  });
  const max = Math.max(...months.map(m => m.value), 1);
  const hasChartData = months.some(m => m.value > 0);
  const rows = selected.filter(o => {
    const matchesStatus = status === "all" || (status === "active" ? o.status !== "Completed" : o.status === "Completed");
    return matchesStatus && `${o.id} ${o.buyerName} ${o.sellerName} ${o.items.map(i => i.name).join(" ")}`.toLowerCase().includes(search.toLowerCase());
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const stages: Order["status"][] = ["Pending Seller Confirmation", "Preparing Order", "In Transit", "Delivered", "Completed"];
  const stageLabels = ["New orders", "Preparing", "In transit", "Delivered", "Completed"];
  const parts = currentUser.name.trim().split(/\s+/);
  const metrics = [
    { label: seller ? "Total order value" : "Total ordered", value: formatNaira(value), icon: Wallet, hint: "Recorded orders in selected period", accent: true },
    { label: "Active orders", value: active.length.toString().padStart(2, "0"), icon: ClipboardList, hint: "From confirmation to delivery" },
    { label: "Completed orders", value: completed.length.toString().padStart(2, "0"), icon: Check, hint: "Marked complete in your records" },
    { label: seller ? "Available listings" : "Items in cart", value: String(seller ? inventory.filter(p => p.inStock).length : cartCount).padStart(2, "0"), icon: seller ? Sprout : ShoppingBag, hint: seller ? `${inventory.length} products in your store` : "Ready for your next order" },
  ];

  return <div className="dashboard-overview space-y-7">
    <section className="flex flex-wrap items-end justify-between gap-5">
      <div>
        <p className="dashboard-eyebrow">{seller ? "YOUR FARM. YOUR BUSINESS." : "FRESH FROM THE FARM."}</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Welcome back, {parts[0]}<span className="text-primary">.</span></h2>
        <p className="mt-2 text-sm text-muted-foreground">{seller ? "A clear view of your store, orders, and what needs attention." : "Your orders, favourite farm finds, and everyday essentials in one place."}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="relative"><span className="sr-only">Dashboard period</span><select aria-label="Dashboard period" value={period} onChange={e => setPeriod(e.target.value)} className="h-10 appearance-none rounded-lg border border-border bg-white py-2 pl-3 pr-9 text-xs font-medium"><option value="all">All time</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option></select><ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-muted-foreground" /></label>
        {seller && onSellerNavigate ? <Button onClick={() => onSellerNavigate("inventory")} className="gap-2 rounded-lg"><Plus className="h-4 w-4" /> Add a product</Button> : <Button asChild className="gap-2 rounded-lg"><Link href="/marketplace"><ShoppingBag className="h-4 w-4" /> Browse marketplace</Link></Button>}
      </div>
    </section>

    <div className="flex items-start gap-2.5 rounded-lg border border-amber-200/70 bg-amber-50/70 px-4 py-3 text-xs leading-relaxed text-amber-900"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" /><p><strong>Your workspace.</strong> Summaries reflect your stored orders and listings. Payment confirmation and seller settlement are separate.</p></div>

    <section aria-label="Account summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map(m => <div key={m.label} className={`dashboard-metric ${m.accent ? "dashboard-metric-primary" : ""}`}><div className="flex items-center justify-between gap-3"><p className="text-xs font-medium">{m.label}</p><span className="dashboard-metric-icon"><m.icon className="h-4 w-4" /></span></div><p className="mt-5 text-3xl font-semibold tracking-tight tabular-nums">{m.value}</p><p className="mt-2 text-[11px] opacity-70">{m.hint}</p></div>)}
    </section>

    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,1fr)]">
      <section className="dashboard-panel p-5 sm:p-6" aria-label="Order value chart">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-sm font-semibold">{seller ? "Store performance" : "Your order activity"}</h3><p className="mt-1 text-xs text-muted-foreground">Monthly order value · last six calendar months</p></div><span className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><span className="h-2 w-2 rounded-full bg-primary" /> Order value</span></div>
        {hasChartData ? <div className="mt-8 grid h-44 grid-cols-6 items-end gap-3 border-b border-border" role="img" aria-label={months.map(m => `${m.label}: ${formatNaira(m.value)}`).join(", ")}>{months.map(m => <div key={m.label} className="flex h-full flex-col justify-end items-center gap-2"><span className="text-[10px] text-muted-foreground">{m.value ? formatNaira(m.value) : "—"}</span><div className="w-full max-w-10 rounded-t-md bg-primary/85" style={{ height: `${m.value ? Math.max(4, (m.value / max) * 70) : 2}%`, opacity: m.value ? 1 : 0.15 }} /><span className="pb-2 text-[11px] text-muted-foreground">{m.label}</span></div>)}</div> : <div className="mt-5 flex h-44 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-slate-50/70 text-center"><ArrowUpRight className="mb-3 h-6 w-6 text-primary/60" /><p className="text-sm font-medium">Your next chapter starts here</p><p className="mt-1 max-w-xs px-4 text-xs leading-relaxed text-muted-foreground">No orders in the last six months for this period. New orders will appear here.</p></div>}
        <p className="mt-4 text-[10px] text-muted-foreground">Order values include {seller ? "product subtotals" : "delivery and platform fees"}. Payment settlement is tracked separately.</p>
      </section>
      <section className="dashboard-panel p-5 sm:p-6"><h3 className="text-sm font-semibold">Order pipeline</h3><p className="mt-1 text-xs text-muted-foreground">Every order, from farm to doorstep</p><div className="mt-6 space-y-4">{stages.map((stage, i) => { const count = selected.filter(o => o.status === stage).length; return <div key={stage} className="flex items-center gap-3 text-xs"><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${i === 4 ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{i === 4 ? <Check className="h-3.5 w-3.5" /> : <span>{i + 1}</span>}</span><span className="flex-1 text-muted-foreground">{stageLabels[i]}</span><span className="font-semibold tabular-nums">{count.toString().padStart(2, "0")}</span></div>; })}</div></section>
    </div>

    <section className="dashboard-panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-5 py-5 sm:px-6"><div><h3 className="text-sm font-semibold">Recent orders <span className="ml-2 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">{selected.length}</span></h3><p className="mt-1 text-xs text-muted-foreground">Keep every delivery moving in the right direction.</p></div><div className="flex flex-wrap items-center gap-2"><label className="relative"><Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" /><input aria-label="Search orders" placeholder="Search orders…" value={search} onChange={e => setSearch(e.target.value)} className="h-9 w-44 rounded-lg border border-border bg-slate-50/60 pl-8 pr-3 text-xs" /></label><select aria-label="Filter order status" value={status} onChange={e => setStatus(e.target.value)} className="h-9 rounded-lg border border-border bg-white px-2 text-xs"><option value="all">All statuses</option><option value="active">Active</option><option value="completed">Completed</option></select></div></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[610px] text-left text-xs"><thead className="bg-slate-50/70 text-[10px] uppercase tracking-wider text-muted-foreground"><tr><th className="px-6 py-3 font-medium">Order / product</th><th className="px-4 py-3 font-medium">{seller ? "Customer" : "Farm / seller"}</th><th className="px-4 py-3 font-medium">Date</th><th className="px-4 py-3 font-medium">Status</th><th className="px-6 py-3 text-right font-medium">Amount</th></tr></thead><tbody className="divide-y divide-border">{rows.slice(0, 6).map(o => <tr key={o.id} className="transition-colors hover:bg-slate-50/70"><td className="max-w-56 px-6 py-4"><p className="truncate font-semibold">{o.items[0]?.name || "Farm order"}{o.items.length > 1 ? ` +${o.items.length - 1}` : ""}</p><p className="mt-1 truncate text-[10px] text-muted-foreground">{o.id}</p></td><td className="px-4 py-4 text-muted-foreground">{seller ? o.buyerName : o.sellerName}</td><td className="whitespace-nowrap px-4 py-4 text-muted-foreground">{new Date(o.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</td><td className="px-4 py-4"><span className={`inline-flex whitespace-nowrap items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium ${o.status === "Completed" ? "bg-emerald-50 text-emerald-700" : o.status === "Delivered" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-800"}`}><span className="h-1 w-1 rounded-full bg-current" />{o.status === "Pending Seller Confirmation" ? "Awaiting confirmation" : o.status}</span></td><td className="whitespace-nowrap px-6 py-4 text-right font-semibold tabular-nums">{formatNaira(seller ? o.subtotal : o.total)}</td></tr>)}</tbody></table>{rows.length === 0 && <div className="px-6 py-12 text-center"><Package className="mx-auto mb-3 h-7 w-7 text-slate-300" /><p className="text-sm font-medium">{search || status !== "all" ? "No matching orders" : "No orders in this period"}</p><p className="mt-1 text-xs text-muted-foreground">{search || status !== "all" ? "Try another search or choose all statuses." : seller ? "Orders from customers will appear here." : "Explore the marketplace to find your next farm favourite."}</p></div>}</div>
      <div className="flex items-center justify-between border-t border-border px-6 py-3"><span className="text-[11px] text-muted-foreground">Showing {Math.min(rows.length, 6)} of {rows.length} orders</span>{seller && onSellerNavigate ? <button onClick={() => onSellerNavigate("orders")} className="flex items-center gap-1.5 text-xs font-semibold text-primary">Manage orders <ArrowRight className="h-3.5 w-3.5" /></button> : <Link href="/cart" className="flex items-center gap-1.5 text-xs font-semibold text-primary">View all orders <ArrowRight className="h-3.5 w-3.5" /></Link>}</div>
    </section>

    <div className="grid gap-5 lg:grid-cols-2"><section className="dashboard-panel flex items-start gap-4 p-6"><span className="rounded-xl bg-amber-50 p-3 text-amber-700"><Clock3 className="h-5 w-5" /></span><div><h3 className="text-sm font-semibold">{awaiting.length ? `${awaiting.length} order${awaiting.length === 1 ? " needs" : "s need"} your attention` : "You're all caught up"}</h3><p className="mt-2 text-xs leading-relaxed text-muted-foreground">{seller ? "Confirm new orders and keep customers updated as you prepare their produce." : "When your order arrives, review the delivery details before confirming receipt."}</p>{seller && onSellerNavigate ? <button onClick={() => onSellerNavigate("orders")} className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-primary">Review orders <ArrowRight className="h-3.5 w-3.5" /></button> : <Link href="/cart" className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary">Track deliveries <ArrowRight className="h-3.5 w-3.5" /></Link>}</div></section><section className="dashboard-panel flex items-start gap-4 p-6"><span className="rounded-xl bg-emerald-50 p-3 text-emerald-700"><ArrowDownLeft className="h-5 w-5" /></span><div><h3 className="text-sm font-semibold">{seller ? "Make your store stand out" : "Good food starts with a conversation"}</h3><p className="mt-2 text-xs leading-relaxed text-muted-foreground">{seller ? "Keep your farm location, store story, and product details up to date." : "Ask your farmer about freshness, availability, and delivery before you order."}</p>{seller && onSellerNavigate ? <button onClick={() => onSellerNavigate("profile")} className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary">Update store profile <ArrowRight className="h-3.5 w-3.5" /></button> : <Link href="/chat" className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary">Open messages <ArrowRight className="h-3.5 w-3.5" /></Link>}</div></section></div>

    <section className="dashboard-panel flex flex-wrap items-center justify-between gap-4 p-6"><div><h3 className="text-sm font-semibold">Payments with Paystack</h3><p className="mt-2 text-xs leading-relaxed text-muted-foreground">Paystack confirms payments at checkout. Order delivery and seller settlement are separate. Payment availability is shown in your account.</p></div><Button asChild variant="outline"><Link href="/cart">View cart & orders <ArrowRight className="h-4 w-4" /></Link></Button></section>
    <p className="pb-3 text-center text-[10px] text-muted-foreground">Farmyn workspace · Growing better connections, one harvest at a time.</p>
  </div>;
}
