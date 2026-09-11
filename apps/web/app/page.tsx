"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Apple,
  ArrowRight,
  Beef,
  Bird,
  CheckCircle2,
  Leaf,
  Salad,
  ShieldCheck,
  Soup,
  TrendingUp,
  Truck,
  Wheat,
  Search,
  Star,
  Lock,
  Sparkles,
  Globe,
  MapPin,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import CategoryCard from "@/components/CategoryCard";
import { useApp } from "@/context/AppContext";

const categoryIcons = {
  Vegetables: Salad,
  Fruits: Apple,
  "Grains & Cereals": Wheat,
  "Spices & Seasonings": Soup,
  "Poultry & Eggs": Bird,
  "Livestock & Meat": Beef,
  "Pantry Ingredients": Soup,
} as const;

const features = [
  {
    icon: Lock,
    title: "Secure Escrow Payments",
    description: "Your money is safe. We hold payments securely and only release funds to the farmer after you confirm delivery.",
  },
  {
    icon: Truck,
    title: "Real-time Updates",
    description: "Track your order from the farm gate all the way to your doorstep or warehouse.",
  },
  {
    icon: ShieldCheck,
    title: "Shop with Confidence",
    description: "We verify growers, view their badges, and check honest reviews before you buy.",
  },
  {
    icon: TrendingUp,
    title: "Direct Pricing",
    description: "No hidden fees or unexpected costs. Easily compare offers and minimum order quantities.",
  },
];

const trustPoints = [
  "Strict seller verification",
  "Your payments are protected",
  "Post bulk orders & get bids",
];

const heroBackgrounds = [
  "/hero-farm.jpg",
  "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1600&q=80", // Lush green crop field irrigation
];

export default function Home() {
  const router = useRouter();
  const { products, bulkRequests, addToCart } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCategory, setSearchCategory] = useState("All");
  const [bgIndex, setBgIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % heroBackgrounds.length);
    }, 6000); // Transition background every 6 seconds
    return () => clearInterval(timer);
  }, []);

  const categories = Array.from(
    products.reduce((map, product) => {
      map.set(product.category, (map.get(product.category) ?? 0) + 1);
      return map;
    }, new Map<string, number>()),
  ).map(([name, count]) => ({ name, count }));

  const featuredProducts = products.filter((product) => product.featured).slice(0, 4);

  const stats = [
    {
      value: `${products.filter((product) => product.sellerVerified).length}+`,
      label: "Verified Listings",
      icon: ShieldCheck,
      color: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30",
    },
    {
      value: `${categories.length}`,
      label: "Shopping Categories",
      icon: Salad,
      color: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30",
    },
    {
      value: `${bulkRequests.length}+`,
      label: "Open Bulk Requests",
      icon: Wheat,
      color: "text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-950/30",
    },
    {
      value: "100% Secure",
      label: "Escrow Protection",
      icon: Lock,
      color: "text-primary bg-accent/60 dark:text-primary-foreground dark:bg-primary/20",
    },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) {
      params.set("search", searchQuery.trim());
    }
    if (searchCategory !== "All") {
      params.set("category", searchCategory);
    }
    router.push(`/marketplace?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-24 md:pt-16 md:pb-28">
        {/* Background Slideshow & Overlay */}
        <div className="absolute inset-0 z-0">
          {heroBackgrounds.map((bg, idx) => (
            <motion.img
              key={bg}
              src={bg}
              alt={`Nigerian farmland background ${idx + 1}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: idx === bgIndex ? 1 : 0 }}
              transition={{ duration: 1.5 }}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/25 animate-fade-in" />
        </div>

        <div className="container relative z-10 grid gap-12 lg:grid-cols-12 lg:gap-8 items-center min-h-[75vh]">
          {/* Left Column: Text & Interactive Search Bar */}
          <div className="lg:col-span-7 flex flex-col items-start justify-center">
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-display text-4xl font-extrabold leading-[1.15] text-white sm:text-5xl lg:text-[3.75rem]"
            >
              Fresh farm produce,
              <span className="text-secondary block mt-2">sourced directly from Nigerian farmers</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-6 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg"
            >
              Farmyn connects households, restaurants, and wholesale buyers directly with verified Nigerian growers. Buy fresh produce, livestock, and grains with secure payment protection.
            </motion.p>

            {/* Interactive Search Bar widget */}
            <motion.form
              onSubmit={handleSearch}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-8 w-full max-w-2xl rounded-2xl border border-white/10 bg-white/95 backdrop-blur-md p-2 shadow-elevated flex flex-col sm:flex-row gap-2"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="What are you sourcing today? (Tomatoes, Rice, Cow...)"
                  className="w-full h-12 rounded-xl bg-transparent pl-10 pr-3 text-sm focus:outline-none focus:ring-0 text-slate-900 placeholder:text-muted-foreground"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="h-px bg-slate-200 sm:h-8 sm:w-px self-center" />
              <select
                className="h-12 bg-transparent px-3 text-sm text-slate-800 focus:outline-none font-medium cursor-pointer sm:w-48"
                value={searchCategory}
                onChange={(e) => setSearchCategory(e.target.value)}
              >
                <option value="All">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.name} value={cat.name}>{cat.name}</option>
                ))}
              </select>
              <Button type="submit" size="lg" className="h-12 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 rounded-xl">
                <Search className="h-4 w-4" /> Search
              </Button>
            </motion.form>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-8 flex flex-wrap gap-x-6 gap-y-2"
            >
              {trustPoints.map((point) => (
                <div key={point} className="flex items-center gap-2 text-xs font-medium text-white/70">
                  <CheckCircle2 className="h-3.5 w-3.5 text-secondary flex-shrink-0" />
                  {point}
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right Column: Escrow Mechanism Visualization Mockup */}
          <div className="lg:col-span-5 hidden lg:block relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative mx-auto w-full max-w-[400px]"
            >
              {/* Decorative backgrounds */}
              <div className="absolute inset-0 -m-4 rounded-3xl bg-gradient-to-tr from-primary/10 to-secondary/10 blur-xl -z-10" />

              {/* Main Card: Escrow Simulation */}
              <div className="glass bg-card/90 border border-border/80 rounded-3xl p-6 shadow-elevated">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center">
                      <Lock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">Escrow Protection</p>
                      <h4 className="text-sm font-bold text-foreground">Order FYN-9024</h4>
                    </div>
                  </div>
                  <span className="rounded-full bg-secondary/15 px-3 py-1 text-xs font-semibold text-secondary">
                    Held in Escrow
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-primary">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">1. Secure Payment</p>
                      <p className="text-[11px] text-muted-foreground">Payment held securely by Farmyn</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-primary">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">2. Order Shipped</p>
                      <p className="text-[11px] text-muted-foreground">Dispatched from Jos, Plateau</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex h-5 w-5 animate-pulse items-center justify-center rounded-full bg-secondary/20 text-secondary">
                      <span className="h-2 w-2 rounded-full bg-secondary" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">3. Confirm Delivery</p>
                      <p className="text-[11px] text-muted-foreground">Awaiting buyer confirmation to release payout</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 bg-accent/40 rounded-2xl p-4 border border-border/40">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Escrow balance:</span>
                    <span className="font-bold text-primary">NGN 48,500.00</span>
                  </div>
                </div>
              </div>

              {/* Overlapping Mini Card: Verified Farmer */}
              <motion.div
                initial={{ opacity: 0, x: 20, y: 20 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="absolute -bottom-6 -left-10 bg-card border border-border rounded-2xl p-4 shadow-elevated flex items-center gap-3 max-w-[240px]"
              >
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold animate-pulse">
                  NO
                </div>
                <div>
                  <h5 className="text-xs font-bold text-foreground flex items-center gap-1">
                    Mama Ngozi Farm
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  </h5>
                  <p className="text-[10px] text-muted-foreground">Plateau • Vegetable Grower</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="h-2.5 w-2.5 fill-secondary text-secondary" />
                    <span className="text-[10px] font-bold text-foreground">4.8</span>
                    <span className="text-[9px] text-muted-foreground">(24 reviews)</span>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section: Floating Panel */}
      <section className="relative z-20 -mt-16 container px-4 sm:px-6 lg:px-8">
        <div className="glass bg-card/90 border border-border/80 rounded-2xl shadow-elevated grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border/50 py-6 md:py-8">
          {stats.map((stat, i) => {
            const IconComponent = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="px-4 py-4 text-center sm:px-6 flex flex-col items-center justify-center gap-2"
              >
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${stat.color} shadow-sm`}>
                  <IconComponent className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-2xl font-extrabold text-foreground sm:text-3xl">{stat.value}</p>
                  <p className="mt-1 text-[11px] font-semibold tracking-wide uppercase text-muted-foreground">{stat.label}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Shop by Category Section */}
      <section className="bg-[hsl(145_48%_26%)] dark:bg-emerald-950/20 border-t border-b border-border/20 py-20">
        <div className="container">
          <div className="mb-10 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-secondary/90">Categories</p>
            <h2 className="font-display text-3xl font-bold text-white">Shop by Category</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {categories.map((category) => {
              const Icon = categoryIcons[category.name as keyof typeof categoryIcons] || Salad;
              return (
                <div key={category.name} className="h-full">
                  <Link
                    href={`/marketplace?category=${encodeURIComponent(category.name)}`}
                    className="h-full"
                  >
                    <motion.div
                      whileHover={{ y: -4 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="group flex h-full min-h-[176px] flex-col items-center justify-center gap-3 rounded-xl border border-white/20 bg-white/95 p-6 shadow-card transition-colors duration-300 hover:border-secondary/30 hover:bg-white"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent transition-all duration-300 group-hover:bg-primary group-hover:shadow-lg">
                        <Icon className="h-6 w-6 text-primary transition-colors duration-300 group-hover:text-primary-foreground" />
                      </div>
                      <div className="text-center">
                        <h3 className="text-sm font-semibold text-foreground">{category.name}</h3>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {category.count} {category.count === 1 ? "product" : "products"}
                        </p>
                      </div>
                    </motion.div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Listings Section */}
      <section className="bg-background py-12">
        <div className="container">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-secondary">Fresh Picks</p>
              <h2 className="font-display text-3xl font-bold text-foreground">Featured Listings</h2>
            </div>
            <Link href="/marketplace" className="hidden sm:block">
              <Button variant="outline" className="gap-1.5">
                View All <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
            ))}
          </div>
        </div>
      </section>

      {/* Why Farmyn Section */}
      <section className="relative border-t border-b border-border/20 py-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/farm-fields.jpg"
            alt="Farm fields background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-background/80"></div>
        </div>
        <div className="container relative z-10">
          <div className="mb-12 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-secondary">Why Farmyn</p>
            <h2 className="font-display text-3xl font-bold text-foreground">A safer, simpler way to trade</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
              We eliminate the risk of online farm purchases by holding payments in escrow and verifying every single seller on our platform.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4">
            {features.map((feature, i) => {
              const cardColors = [
                "border-t-emerald-600 dark:border-t-emerald-500",
                "border-t-amber-500",
                "border-t-orange-500",
                "border-t-primary"
              ];
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -6 }}
                  className={`rounded-xl border-x border-b border-t-4 border-border bg-card p-6 text-center shadow-card transition-all duration-300 hover:shadow-elevated ${cardColors[i % cardColors.length]}`}
                >
                  <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-accent">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold text-card-foreground">{feature.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trust, Reach & Swap Guarantees Section */}
      <section className="bg-gradient-subtle py-20 border-t border-b border-border/50">
        <div className="container">
          <div className="mb-12 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-secondary">Guaranteed Safety & Nationwide Scale</p>
            <h2 className="font-display text-3xl font-bold text-foreground">Trade without boundaries, with zero risk</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
              Farmyn is built specifically to address the challenges of trust, distance, and logistics in Nigerian agriculture.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Nationwide Reach Card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl border border-border bg-card p-8 shadow-card flex flex-col items-start gap-4 transition-all duration-300 hover:shadow-elevated"
            >
              <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Globe className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Reach Any State in Nigeria</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Farmers are no longer restricted to local markets. List your produce and sell directly to clients, restaurants, and wholesalers in Lagos, Abuja, Port Harcourt, or any other state. We help coordinate logistics for smooth interstate delivery.
                </p>
              </div>
            </motion.div>

            {/* Zero Dupes Escrow Card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-border bg-card p-8 shadow-card flex flex-col items-start gap-4 transition-all duration-300 hover:shadow-elevated"
            >
              <div className="h-12 w-12 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Zero Risk Escrow (No Scams)</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Say goodbye to scams and dupes. Buyers fund the secure escrow before dispatch, proving they have the money. However, the farmer does not receive the payout until the buyer verifies that the goods have arrived safely. No one gets cheated.
                </p>
              </div>
            </motion.div>

            {/* Location-Based Discovery Card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border border-border bg-card p-8 shadow-card flex flex-col items-start gap-4 transition-all duration-300 hover:shadow-elevated"
            >
              <div className="h-12 w-12 rounded-xl bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Location-Based Discovery</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Easily find crop growers, poultry farms, and food vendors near your location or search by state. Save on transportation, cut down logistics times, and source the freshest products straight from local farms.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Bulk Demand Board Section */}
      <section className="container pb-20">
        <div className="relative rounded-3xl bg-gradient-to-br from-primary/90 via-primary to-secondary overflow-hidden shadow-elevated">
          <div className="relative z-10 p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/90">Bulk Requests</p>
                <h2 className="font-display text-4xl font-bold text-white">Source produce in bulk</h2>
                <p className="mt-3 max-w-2xl text-sm text-white/80">
                  Restaurants, hotels, and retail stores can post their wholesale requirements and get direct quotes from verified local farmers.
                </p>
              </div>
              <Link href="/bulk">
                <Button className="gap-2 bg-white text-primary hover:bg-white/90 font-semibold">
                  View Bulk Requests <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {bulkRequests.slice(0, 2).map((request) => (
                <motion.div
                  key={request.id}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="rounded-2xl bg-white/95 backdrop-blur-sm p-6 shadow-card transition-all duration-300 hover:shadow-elevated"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-foreground">{request.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{request.category} | {request.location}</p>
                    </div>
                    <span className="rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-bold">
                      {request.status}
                    </span>
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">{request.quantity}</p>
                  <p className="mt-3 text-xl font-bold text-primary">Budget: NGN {request.budget.toLocaleString()}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
