"use client";

import { useState } from "react";
import { Search, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { useApp } from "@/context/AppContext";

export default function MarketplacePage() {
  const params = useSearchParams();
  const initialCategory = params.get("category");
  const initialSearch = params.get("search") || "";
  const { products, categories, addToCart } = useApp();
  const [search, setSearch] = useState(initialSearch);
  const [activeCategory, setActiveCategory] = useState(initialCategory || "All");
  const [location, setLocation] = useState("All");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);

  const locations = ["All", ...Array.from(new Set(products.map((product) => product.location)))];

  const filtered = products.filter((product) => {
    const query = search.trim().toLowerCase();
    const matchesSearch =
      query.length === 0 ||
      product.name.toLowerCase().includes(query) ||
      product.sellerName.toLowerCase().includes(query) ||
      product.location.toLowerCase().includes(query);
    const matchesCategory = activeCategory === "All" || product.category === activeCategory;
    const matchesLocation = location === "All" || product.location === location;
    const matchesVerified = !verifiedOnly || product.sellerVerified;
    const matchesStock = !inStockOnly || product.inStock;
    return matchesSearch && matchesCategory && matchesLocation && matchesVerified && matchesStock;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="border-b border-border bg-card">
        <div className="container py-8">
          <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">Marketplace</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Buy fresh produce, poultry, livestock, and grains directly from verified local growers across Nigeria.
          </p>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid gap-4 rounded-2xl border border-border bg-card p-4 shadow-card lg:grid-cols-[1.4fr,repeat(4,minmax(0,1fr))]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products, sellers or locations..."
              className="h-10 pl-10"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={activeCategory}
            onChange={(event) => setActiveCategory(event.target.value)}
          >
            {categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
          >
            {locations.map((entry) => (
              <option key={entry} value={entry}>{entry}</option>
            ))}
          </select>
          <label className="flex h-10 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm">
            <input type="checkbox" checked={verifiedOnly} onChange={() => setVerifiedOnly((value) => !value)} />
            Verified only
          </label>
          <label className="flex h-10 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm">
            <input type="checkbox" checked={inStockOnly} onChange={() => setInStockOnly((value) => !value)} />
            In stock
          </label>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              setSearch("");
              setActiveCategory("All");
              setLocation("All");
              setVerifiedOnly(false);
              setInStockOnly(false);
            }}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Reset
          </Button>
        </div>

        <div className="mb-8 mt-4 flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
                activeCategory === category
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "border border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="mb-5 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "product" : "products"} found
          </p>
          <div className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
            <ShieldCheck className="h-3 w-3" />
            Verified seller marketplace
          </div>
        </div>

        {filtered.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="mt-4 text-base font-medium text-foreground">No products found</p>
            <p className="mt-1 text-sm text-muted-foreground">Try adjusting your filters</p>
          </motion.div>
        )}
      </div>

      <Footer />
    </div>
  );
}
