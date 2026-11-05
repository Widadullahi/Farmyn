"use client";

import Link from "next/link";
import { BarChart3, MessageSquare, Search, Store, Zap } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext";
import { formatNaira } from "@/lib/app-data";

const features = [
  { icon: Search, title: "Discover", text: "Search listings by product, category, seller, and location." },
  { icon: MessageSquare, title: "Chat", text: "Ask about price, quantity, quality, pickup, or delivery." },
  { icon: Store, title: "Deal directly", text: "Buyer and seller agree on the transaction themselves." },
];

const promotions = [
  { name: "Listing Boost", price: 2000, period: "7 days", text: "Move one listing into featured positions and give it stronger visibility." },
  { name: "Category Banner", price: 5000, period: "7 days", text: "Promote your business to buyers browsing the most relevant category." },
  { name: "Homepage Banner", price: 10000, period: "7 days", text: "Put your business in front of visitors on Farmyn's homepage." },
];

export default function Home() {
  const { products, banners } = useApp();
  const banner = banners.find(item => item.placement === "homepage");
  return <div className="min-h-screen bg-background">
    <Navbar />
    <main>
      <section className="relative overflow-hidden bg-primary py-20 text-primary-foreground sm:py-28">
        <div className="container relative z-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Nigeria&apos;s farm marketplace</p>
          <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight sm:text-6xl">Find fresh produce. Talk directly to the seller.</h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-primary-foreground/75 sm:text-lg">Browse what is available, compare sellers, and use in-site chat to agree on the details.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Button asChild size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90"><Link href="/marketplace"><Search className="h-4 w-4" /> Browse listings</Link></Button><Button asChild size="lg" variant="outline" className="border-white/30 bg-white/5 text-white hover:bg-white/10 hover:text-white"><Link href="/register"><Store className="h-4 w-4" /> List your products</Link></Button></div>
        </div>
      </section>

      {banner && <section className="container py-8"><Link href={banner.ctaHref} className="group relative block min-h-64 overflow-hidden rounded-3xl bg-foreground text-white shadow-xl"><img src={banner.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-55 transition-transform duration-700 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-transparent" /><div className="relative z-10 max-w-xl p-8 sm:p-12"><span className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest">Sponsored · {banner.sponsorName}</span><h2 className="mt-5 text-3xl font-bold">{banner.title}</h2><p className="mt-3 text-sm leading-relaxed text-white/80">{banner.subtitle}</p><span className="mt-6 inline-flex rounded-lg bg-white px-4 py-2 text-sm font-semibold text-foreground">{banner.ctaLabel}</span></div></Link></section>}

      <section className="container py-16"><div className="grid gap-5 md:grid-cols-3">{features.map(({ icon: Icon, title, text }) => <div key={title} className="rounded-2xl border bg-card p-6"><Icon className="h-6 w-6 text-primary" /><h2 className="mt-4 text-lg font-semibold">{title}</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p></div>)}</div></section>

      <section className="border-y bg-muted/30 py-16"><div className="container"><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-widest text-primary">Latest listings</p><h2 className="mt-2 text-3xl font-bold">Fresh from local sellers</h2></div><Link href="/marketplace" className="text-sm font-semibold text-primary">View all</Link></div>{products.length ? <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{[...products].sort((a, b) => Number(b.featured) - Number(a.featured)).slice(0,4).map(product => <ProductCard key={product.id} product={product} />)}</div> : <div className="mt-8 rounded-2xl border border-dashed bg-card p-10 text-center text-sm text-muted-foreground">Listings will appear here when sellers publish them.</div>}</div></section>

      <section className="container py-20" id="promote"><div className="mx-auto max-w-2xl text-center"><p className="text-xs font-semibold uppercase tracking-widest text-primary">Promote on Farmyn</p><h2 className="mt-3 text-3xl font-bold">Reach more buyers without paying sales commission</h2><p className="mt-3 text-sm text-muted-foreground">Pay only when you want extra visibility. Banner spaces are limited and scheduled by Farmyn.</p></div><div className="mt-10 grid gap-5 lg:grid-cols-3">{promotions.map(item => <article key={item.name} className="rounded-2xl border bg-card p-6 shadow-sm"><div className="flex items-center justify-between"><Zap className="h-5 w-5 text-primary" /><span className="text-xs text-muted-foreground">{item.period}</span></div><h3 className="mt-5 text-lg font-semibold">{item.name}</h3><p className="mt-2 text-3xl font-bold text-primary">{formatNaira(item.price)}</p><p className="mt-4 min-h-12 text-sm leading-relaxed text-muted-foreground">{item.text}</p><Button asChild variant="outline" className="mt-6 w-full"><Link href="/seller/dashboard"><BarChart3 className="h-4 w-4" /> Promote a listing</Link></Button></article>)}</div></section>
    </main>
    <Footer />
  </div>;
}
