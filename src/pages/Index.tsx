import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Leaf,
  ShieldCheck,
  Truck,
  TrendingUp,
  Salad,
  Bird,
  Beef,
  UtensilsCrossed,
  Blocks,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import CategoryCard from "@/components/CategoryCard";
import { useApp } from "@/context/AppContext";
import heroImage from "@/assets/hero-farm.jpg";

const categoryIcons = [Salad, Bird, Beef, UtensilsCrossed];

const features = [
  {
    icon: ShieldCheck,
    title: "Escrow Payments",
    description: "Funds are held until delivery is confirmed, reducing fraud risk for buyers and sellers.",
  },
  {
    icon: Truck,
    title: "Order Tracking",
    description: "Track every order stage from seller confirmation to delivery and escrow release.",
  },
  {
    icon: Leaf,
    title: "Verified Seller Profiles",
    description: "Transparent profiles, badges, and review history build trust in every transaction.",
  },
  {
    icon: TrendingUp,
    title: "Price Transparency",
    description: "Local-first pricing insights help sellers benchmark prices without paying for AI APIs yet.",
  },
];

const trustPoints = [
  "Buyer and seller accounts with owned local-first workflows",
  "Escrow-style checkout and delivery confirmation",
  "Bulk request board for restaurants and distributors",
];

const Index = () => {
  const { products, bulkRequests, addToCart } = useApp();

  const categories = Array.from(
    products.reduce((map, product) => {
      map.set(product.category, (map.get(product.category) ?? 0) + 1);
      return map;
    }, new Map<string, number>()),
  ).map(([name, count]) => ({ name, count }));

  const featuredProducts = products.filter((product) => product.featured).slice(0, 4);

  const stats = [
    { value: `${products.filter((product) => product.sellerVerified).length}+`, label: "Verified Listings" },
    { value: `${bulkRequests.length}+`, label: "Open Bulk Requests" },
    { value: "5%", label: "Commission Per Completed Order" },
    { value: "100%", label: "Code You Control" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Nigerian farmland" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/90 via-foreground/75 to-foreground/30" />
        </div>
        <div className="container relative z-10 flex min-h-[90vh] flex-col items-start justify-center py-20">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-1.5 text-sm font-medium text-primary-foreground">
              <Blocks className="h-4 w-4 text-secondary" />
              Local-first marketplace MVP based on your PRD
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="max-w-3xl font-display text-4xl font-extrabold leading-[1.1] text-primary-foreground sm:text-5xl lg:text-[3.5rem]"
          >
            Farm commerce for Nigeria,{" "}
            <span className="text-secondary">without paying for platform lock-in first</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-5 max-w-2xl text-base leading-relaxed text-primary-foreground/75 sm:text-lg"
          >
            Farmers, poultry producers, livestock sellers, food vendors, households, restaurants, and supermarkets can now use a single FarmLink flow for listings, cart, escrow checkout, reviews, order tracking, and bulk requests.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Link to="/marketplace">
              <Button size="lg" className="gap-2 shadow-lg">
                Browse Marketplace <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/seller/dashboard">
              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground/25 text-primary-foreground hover:bg-primary-foreground/10"
              >
                Open Seller Dashboard
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-8 flex flex-col gap-2"
          >
            {trustPoints.map((point) => (
              <div key={point} className="flex items-center gap-2 text-sm text-primary-foreground/70">
                <CheckCircle2 className="h-3.5 w-3.5 text-secondary" />
                {point}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="border-b border-border bg-card">
        <div className="container grid grid-cols-2 divide-x divide-border sm:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="px-4 py-8 text-center sm:px-6"
            >
              <p className="font-display text-2xl font-bold text-primary sm:text-3xl">{stat.value}</p>
              <p className="mt-1 text-xs font-medium text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="container py-20">
        <div className="mb-10 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-secondary">Categories</p>
          <h2 className="font-display text-3xl font-bold text-foreground">Shop by Category</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {categories.map((category, index) => (
            <CategoryCard
              key={category.name}
              name={category.name}
              icon={categoryIcons[index] || Salad}
              count={category.count}
              href={`/marketplace?category=${encodeURIComponent(category.name)}`}
            />
          ))}
        </div>
      </section>

      <section className="bg-gradient-subtle py-20">
        <div className="container">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-secondary">MVP Features</p>
              <h2 className="font-display text-3xl font-bold text-foreground">Working Marketplace Flow</h2>
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

      <section className="container py-20">
        <div className="mb-12 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-secondary">Why FarmLink</p>
          <h2 className="font-display text-3xl font-bold text-foreground">Built Around the PRD</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
            The current codebase now covers the PRD MVP directly in your own frontend: buyer and seller accounts, product listings, escrow-style checkout, order tracking, reviews, bulk demand capture, and seller monetization requests.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-xl border border-border bg-card p-6 text-center shadow-card"
            >
              <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-accent">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-card-foreground">{feature.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="container pb-20">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-card">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-secondary">Bulk Marketplace</p>
              <h2 className="font-display text-3xl font-bold text-foreground">Restaurant and distributor demand board</h2>
              <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
                Bulk requests are live in the app already, so you can test B2B demand capture before paying for a custom logistics or procurement stack.
              </p>
            </div>
            <Link to="/bulk">
              <Button className="gap-2">
                View Bulk Requests <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {bulkRequests.slice(0, 2).map((request) => (
              <div key={request.id} className="rounded-2xl border border-border bg-background p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{request.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{request.category} • {request.location}</p>
                  </div>
                  <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
                    {request.status}
                  </span>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">{request.quantity}</p>
                <p className="mt-2 text-sm font-medium text-primary">Budget: NGN {request.budget.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
