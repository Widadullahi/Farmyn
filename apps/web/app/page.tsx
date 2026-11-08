"use client";

import Link from "next/link";
import { ArrowRight, BarChart3, Beef, CheckCircle2, ChevronRight, Egg, Leaf, MapPin, MessageSquare, PackageCheck, Search, ShieldCheck, Sprout, Store, Wheat, Zap } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import MarketplaceJourney from "@/components/MarketplaceJourney";
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

const categories = [
  { name: "Vegetables", icon: Leaf, color: "bg-emerald-50 text-emerald-700" },
  { name: "Grains & Cereals", icon: Wheat, color: "bg-amber-50 text-amber-700" },
  { name: "Poultry & Eggs", icon: Egg, color: "bg-orange-50 text-orange-700" },
  { name: "Livestock & Meat", icon: Beef, color: "bg-rose-50 text-rose-700" },
];

export default function Home() {
  const { products, banners } = useApp();
  const banner = banners.find(item => item.placement === "homepage");
  return <div className="min-h-screen bg-background">
    <Navbar />
    <main>
      <section className="relative overflow-hidden bg-primary py-16 text-primary-foreground sm:py-20 lg:py-24">
        <div className="absolute -right-32 -top-40 h-[520px] w-[520px] rounded-full border border-white/10" /><div className="absolute -right-10 -top-20 h-[320px] w-[320px] rounded-full border border-white/10" />
        <div className="container relative z-10 grid items-center gap-12 lg:grid-cols-[1.15fr_.85fr]">
          <div><div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium"><Sprout className="h-3.5 w-3.5 text-secondary" /> Nigeria&apos;s direct farm marketplace</div>
          <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-[1.04] sm:text-6xl">Buy fresh. Sell freely. <span className="text-secondary">Grow locally.</span></h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-primary-foreground/75 sm:text-lg">One professional account to discover farm products, contact sellers, and publish your own listings across Nigeria.</p>
          <form action="/marketplace" className="mt-7 flex max-w-xl overflow-hidden rounded-xl border border-white/15 bg-white p-1.5 shadow-xl"><div className="flex min-w-0 flex-1 items-center gap-2 px-3 text-foreground"><Search className="h-4 w-4 shrink-0 text-primary" /><input name="search" aria-label="Search the marketplace" placeholder="What farm product do you need?" className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" /></div><Button type="submit" className="h-11 shrink-0 rounded-lg">Search</Button></form>
          <div className="mt-5 flex flex-wrap gap-3"><Button asChild variant="outline" className="border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white"><Link href="/marketplace">Explore all listings</Link></Button><Button asChild className="bg-secondary text-secondary-foreground hover:bg-secondary/90"><Link href="/seller/dashboard"><Store className="h-4 w-4" /> Post a listing</Link></Button></div>
          <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-xs text-white/70"><span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-secondary" /> No sales commission</span><span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-secondary" /> Direct seller chat</span><span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-secondary" /> Local listings</span></div></div>
          <div className="relative hidden min-h-[520px] md:block"><div className="absolute inset-0 overflow-hidden rounded-[2.25rem] border border-white/15 shadow-2xl"><img src="/farmyn-journey-produce.jpg" alt="Farmer presenting fresh produce" className="h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" /></div><div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/20 bg-white/90 p-5 text-foreground shadow-xl backdrop-blur"><div className="flex items-center justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-widest text-primary">Ready to trade</p><p className="mt-1 font-display text-xl font-semibold">Fresh listings from real local businesses</p></div><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-white"><ArrowRight className="h-5 w-5" /></span></div></div><div className="absolute -left-6 top-10 rounded-xl border border-white/30 bg-white px-4 py-3 text-foreground shadow-xl"><p className="text-[10px] uppercase tracking-widest text-muted-foreground">One account</p><p className="mt-1 text-sm font-bold">Buy + sell</p></div></div>
        </div>
      </section>

      {banner && <section className="container py-8"><Link href={banner.ctaHref} className="group relative block min-h-64 overflow-hidden rounded-3xl bg-foreground text-white shadow-xl"><img src={banner.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-55 transition-transform duration-700 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-transparent" /><div className="relative z-10 max-w-xl p-8 sm:p-12"><span className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest">Sponsored · {banner.sponsorName}</span><h2 className="mt-5 text-3xl font-bold">{banner.title}</h2><p className="mt-3 text-sm leading-relaxed text-white/80">{banner.subtitle}</p><span className="mt-6 inline-flex rounded-lg bg-white px-4 py-2 text-sm font-semibold text-foreground">{banner.ctaLabel}</span></div></Link></section>}

      <section className="container py-16"><div className="grid gap-5 md:grid-cols-3">{features.map(({ icon: Icon, title, text }) => <div key={title} className="rounded-2xl border bg-card p-6"><Icon className="h-6 w-6 text-primary" /><h2 className="mt-4 text-lg font-semibold">{title}</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p></div>)}</div></section>

      <section className="container pb-20"><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-widest text-primary">Browse categories</p><h2 className="mt-2 text-3xl font-bold">From the farm to your search</h2></div><Link href="/marketplace" className="hidden items-center gap-1 text-sm font-semibold text-primary sm:flex">See all categories <ChevronRight className="h-4 w-4" /></Link></div><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{categories.map(({name,icon:Icon,color}) => <Link key={name} href={`/marketplace?category=${encodeURIComponent(name)}`} className="group flex items-center gap-4 rounded-2xl border bg-card p-5 shadow-sm transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"><span className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}><Icon className="h-6 w-6" /></span><span className="flex-1 font-semibold">{name}</span><ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" /></Link>)}</div></section>

      <section className="border-y bg-muted/30 py-16"><div className="container"><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-widest text-primary">Latest listings</p><h2 className="mt-2 text-3xl font-bold">Fresh from local sellers</h2></div><Link href="/marketplace" className="text-sm font-semibold text-primary">View all</Link></div>{products.length ? <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{[...products].sort((a, b) => Number(b.featured) - Number(a.featured)).slice(0,4).map(product => <ProductCard key={product.id} product={product} />)}</div> : <div className="mt-8 rounded-2xl border border-dashed bg-card p-10 text-center text-sm text-muted-foreground">Listings will appear here when sellers publish them.</div>}</div></section>

      <div id="how-it-works"><MarketplaceJourney /></div>

      <section className="bg-primary text-primary-foreground"><div className="container grid gap-10 py-16 lg:grid-cols-2 lg:items-center lg:py-20"><div><p className="text-xs font-semibold uppercase tracking-widest text-secondary">Built for local sellers</p><h2 className="mt-3 text-3xl font-bold sm:text-4xl">Turn your available stock into a listing buyers can find.</h2><p className="mt-4 max-w-xl text-sm leading-7 text-white/70">Add photos, prices, quantity, location, and product details. Interested buyers can message you directly, while optional boosts help your listings reach more people.</p><Button asChild size="lg" className="mt-7 bg-secondary text-secondary-foreground hover:bg-secondary/90"><Link href="/register">Create a seller account <ArrowRight className="h-4 w-4" /></Link></Button></div><div className="grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-white/15 bg-white/10 p-5"><PackageCheck className="h-6 w-6 text-secondary" /><h3 className="mt-4 font-semibold">Control your listings</h3><p className="mt-2 text-xs leading-5 text-white/65">Publish what is available and update the details when stock changes.</p></div><div className="rounded-2xl border border-white/15 bg-white/10 p-5"><MessageSquare className="h-6 w-6 text-secondary" /><h3 className="mt-4 font-semibold">Answer real enquiries</h3><p className="mt-2 text-xs leading-5 text-white/65">Discuss price, quantity, delivery, and pickup directly with buyers.</p></div><div className="rounded-2xl border border-white/15 bg-white/10 p-5 sm:col-span-2"><MapPin className="h-6 w-6 text-secondary" /><h3 className="mt-4 font-semibold">Reach buyers searching by location</h3><p className="mt-2 text-xs leading-5 text-white/65">Help nearby households and businesses discover what your farm or store has ready.</p></div></div></div></section>

      <section className="container py-20" id="promote"><div className="mx-auto max-w-2xl text-center"><p className="text-xs font-semibold uppercase tracking-widest text-primary">Promote on Farmyn</p><h2 className="mt-3 text-3xl font-bold">Reach more buyers without paying sales commission</h2><p className="mt-3 text-sm text-muted-foreground">Pay only when you want extra visibility. Banner spaces are limited and scheduled by Farmyn.</p></div><div className="mt-10 grid gap-5 lg:grid-cols-3">{promotions.map(item => <article key={item.name} className="rounded-2xl border bg-card p-6 shadow-sm"><div className="flex items-center justify-between"><Zap className="h-5 w-5 text-primary" /><span className="text-xs text-muted-foreground">{item.period}</span></div><h3 className="mt-5 text-lg font-semibold">{item.name}</h3><p className="mt-2 text-3xl font-bold text-primary">{formatNaira(item.price)}</p><p className="mt-4 min-h-12 text-sm leading-relaxed text-muted-foreground">{item.text}</p><Button asChild variant="outline" className="mt-6 w-full"><Link href="/seller/dashboard"><BarChart3 className="h-4 w-4" /> Promote a listing</Link></Button></article>)}</div></section>

      <section className="border-y bg-accent/40"><div className="container grid gap-8 py-16 lg:grid-cols-[1fr_auto] lg:items-center"><div className="flex gap-5"><span className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-white sm:flex"><ShieldCheck className="h-7 w-7" /></span><div><p className="text-xs font-semibold uppercase tracking-widest text-primary">Trade thoughtfully</p><h2 className="mt-2 text-3xl font-bold">Confirm the details before you make a deal.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Ask questions, verify product condition and quantity, agree on pickup or delivery, and use a payment method you trust. Farmyn does not hold funds or guarantee transactions.</p></div></div><Button asChild variant="outline" size="lg"><Link href="/about">Read our safety guide</Link></Button></div></section>

      <section className="container py-20"><div className="overflow-hidden rounded-[2rem] bg-foreground px-6 py-12 text-center text-background sm:px-12 sm:py-16"><Sprout className="mx-auto h-9 w-9 text-secondary" /><h2 className="mx-auto mt-5 max-w-2xl text-3xl font-bold sm:text-4xl">Ready to find your next supplier—or your next buyer?</h2><p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-background/65">Join a marketplace designed for direct, practical farm trade across Nigeria.</p><div className="mt-7 flex flex-wrap justify-center gap-3"><Button asChild size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90"><Link href="/marketplace">Browse listings</Link></Button><Button asChild size="lg" variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"><Link href="/register">Create an account</Link></Button></div></div></section>
    </main>
    <Footer />
  </div>;
}
