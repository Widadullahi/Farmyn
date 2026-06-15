import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import CategoryCard from "@/components/CategoryCard";
import { useApp } from "@/context/AppContext";
import heroImage from "@/assets/hero-farm.jpg";

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
    description: "Buyer funds remain protected until delivery is confirmed, reducing fraud risk on both sides.",
  },
  {
    icon: Truck,
    title: "Tracked Fulfilment",
    description: "Follow every order from seller confirmation through dispatch, delivery, and payout release.",
  },
  {
    icon: ShieldCheck,
    title: "Verified Seller Profiles",
    description: "Seller badges, store information, and review history help buyers shop with confidence.",
  },
  {
    icon: TrendingUp,
    title: "Transparent Pricing",
    description: "Clear pricing and minimum order details make it easier to compare offers and buy in bulk.",
  },
];

const trustPoints = [
  "Verified sellers across produce and proteins",
  "Escrow-protected checkout",
  "Bulk order demand board",
];

const heroBackgrounds = [
  heroImage,
  "https://images.unsplash.com/photo-1595855759920-86582396756a?w=1600&q=80", // African sunset agricultural field
  "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1600&q=80", // Lush green crop field irrigation
];

const Index = () => {
  const navigate = useNavigate();
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
    navigate(`/marketplace?${params.toString()}`);
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
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/95 via-foreground/80 to-foreground/45 animate-fade-in" />
        </div>

        <div className="container relative z-10 grid gap-12 lg:grid-cols-12 lg:gap-8 items-center min-h-[75vh]">
          {/* Left Column: Text & Interactive Search Bar */}
          <div className="lg:col-span-7 flex flex-col items-start justify-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-secondary mb-6"
            >
              <Sparkles className="h-3 w-3 text-secondary animate-pulse" />
              Direct access. No middleman. Secure Escrow.
            </motion.div>

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
              Farmyn connects crop growers, livestock owners, and food vendors directly with households, restaurants, and wholesale buyers under a secure escrow-protected trade system.
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
                      <p className="text-xs font-semibold text-foreground">1. Escrow Funded</p>
                      <p className="text-[11px] text-muted-foreground">NGN 48,500 safely held by Farmyn</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-primary">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">2. Produce in Transit</p>
                      <p className="text-[11px] text-muted-foreground">Dispatched from Jos, Plateau</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex h-5 w-5 animate-pulse items-center justify-center rounded-full bg-secondary/20 text-secondary">
                      <span className="h-2 w-2 rounded-full bg-secondary" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">3. Buyer Delivery Verification</p>
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
      <section className="container py-20">
        <div className="mb-10 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-secondary">Categories</p>
          <h2 className="font-display text-3xl font-bold text-foreground">Shop by Category</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {categories.map((category) => {
            const Icon = categoryIcons[category.name as keyof typeof categoryIcons] || Salad;
            return (
              <CategoryCard
                key={category.name}
                name={category.name}
                icon={Icon}
                count={category.count}
                href={`/marketplace?category=${encodeURIComponent(category.name)}`}
              />
            );
          })}
        </div>
      </section>

      {/* Featured Listings Section */}
      <section className="bg-gradient-subtle py-20">
        <div className="container">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-secondary">Fresh Picks</p>
              <h2 className="font-display text-3xl font-bold text-foreground">Featured Listings</h2>
            </div>
            <Link to="/marketplace" className="hidden sm:block">
              <Button variant="outline" className="gap-1.5">
                View All <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
            ))}
          </div>
        </div>
      </section>

      {/* Why Farmyn Section */}
      <section className="container py-20">
        <div className="mb-12 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-secondary">Why Farmyn</p>
          <h2 className="font-display text-3xl font-bold text-foreground">Built for Trusted Agricultural Commerce</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
            Farmyn helps sellers reach more buyers while giving households and businesses a safer way to order fresh food online.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
      </section>

      {/* Bulk Demand Board Section */}
      <section className="container pb-20">
        <div className="rounded-3xl border border-border bg-gradient-to-r from-card to-accent/20 p-8 shadow-card">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-secondary">Bulk Orders</p>
              <h2 className="font-display text-3xl font-bold text-foreground">Demand board for restaurants and distributors</h2>
              <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
                Restaurants, hotels, supermarkets, and distributors can post demand and discover supply opportunities from trusted sellers.
              </p>
            </div>
            <Link to="/bulk">
              <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                View Bulk Requests <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {bulkRequests.slice(0, 2).map((request) => (
              <motion.div
                key={request.id}
                whileHover={{ y: -2 }}
                className="rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-subtle"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{request.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{request.category} | {request.location}</p>
                  </div>
                  <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
                    {request.status}
                  </span>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">{request.quantity}</p>
                <p className="mt-2 text-sm font-medium text-primary">Budget: NGN {request.budget.toLocaleString()}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
