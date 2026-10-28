"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { MapPin, MessageSquare, ShieldCheck, Store } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext";

export default function SellerStorePage() {
  const { sellerId } = useParams<{ sellerId: string }>();
  const { users, products, isHydrated, addToCart } = useApp();
  const seller = users.find((user) => user.id === sellerId && user.role === "seller");
  const listings = products.filter((product) => product.sellerId === sellerId);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-8">
        {!isHydrated ? (
          <p className="text-sm text-muted-foreground">Loading store…</p>
        ) : !seller ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center">
            <h1 className="text-xl font-semibold">Store unavailable</h1>
            <p className="mt-2 text-sm text-muted-foreground">This farmer&apos;s store could not be found.</p>
            <Link href="/marketplace" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">Back to marketplace</Link>
          </div>
        ) : (
          <>
            <Link href="/marketplace" className="text-sm text-muted-foreground hover:text-primary">← Marketplace</Link>
            <section className="mt-5 rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Store className="h-8 w-8" /></div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Farmer&apos;s store</p>
                    <h1 className="mt-1 font-display text-2xl font-bold text-foreground">{seller.storeName || seller.name}</h1>
                    <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{seller.location || "Nigeria"}</p>
                    {seller.verified && <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-primary"><ShieldCheck className="h-4 w-4" />Verified seller</p>}
                  </div>
                </div>
                <Button asChild className="gap-2"><Link href={`/chat?user=${encodeURIComponent(seller.id)}`}><MessageSquare className="h-4 w-4" />Message farmer</Link></Button>
              </div>
              {seller.bio && <p className="mt-6 max-w-3xl border-t border-border pt-5 text-sm leading-relaxed text-muted-foreground">{seller.bio}</p>}
            </section>
            <section className="mt-9">
              <h2 className="font-display text-xl font-bold">Products from this farm</h2>
              <p className="mt-1 text-sm text-muted-foreground">Choose a product and use its message button to ask the farmer about it.</p>
              {listings.length ? (
                <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {listings.map((product) => <ProductCard key={product.id} product={product} onAddToCart={addToCart} />)}
                </div>
              ) : <p className="mt-5 rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">No products listed yet.</p>}
            </section>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
