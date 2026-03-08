import { Link } from "react-router-dom";
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
    icon: ShieldCheck,
    title: "Secure Escrow Payments",
    description: "Buyer funds remain protected until delivery is confirmed, reducing fraud risk on both sides.",
  },
  {
    icon: Truck,
    title: "Tracked Fulfilment",
    description: "Follow every order from seller confirmation through dispatch, delivery, and payout release.",
  },
  {
    icon: Leaf,
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
  "Verified sellers across produce, fruits, grains, spices, proteins, and pantry staples",
  "Protected checkout with delivery confirmation before payout",
  "Bulk order support for restaurants, hotels, supermarkets, and distributors",
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
    { value: `${categories.length}`, label: "Shopping Categories" },
    { value: `${bulkRequests.length}+`, label: "Open Bulk Requests" },
    { value: "24/7", label: "Order Visibility" },
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
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="max-w-3xl font-display text-4xl font-extrabold leading-[1.1] text-primary-foreground sm:text-5xl lg:text-[3.5rem]"
          >
            Fresh farm produce,
            <span className="text-secondary"> sourced directly from trusted sellers across Nigeria</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-5 max-w-2xl text-base leading-relaxed text-primary-foreground/75 sm:text-lg"
          >
            Farmyn connects farmers, poultry producers, livestock sellers, food vendors, households, restaurants, and supermarkets through one trusted marketplace for discovery, protected checkout, delivery tracking, reviews, and bulk sourcing.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Link to="/marketplace">
              <Button size="lg" className="gap-2 bg-secondary text-secondary-foreground shadow-lg hover:bg-secondary/90">
                Browse Marketplace <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/register">
              <Button
                size="lg"
                className="border border-primary-foreground/20 bg-primary-foreground text-foreground shadow-lg hover:bg-primary-foreground/90"
              >
                Start Selling
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

      <section className="container py-20">
        <div className="mb-12 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-secondary">Why Farmyn</p>
          <h2 className="font-display text-3xl font-bold text-foreground">Built for Trusted Agricultural Commerce</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
            Farmyn helps sellers reach more buyers while giving households and businesses a safer way to order fresh food online.
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
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-secondary">Bulk Orders</p>
              <h2 className="font-display text-3xl font-bold text-foreground">Demand board for restaurants and distributors</h2>
              <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
                Restaurants, hotels, supermarkets, and distributors can post demand and discover supply opportunities from trusted sellers.
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
                    <p className="mt-1 text-sm text-muted-foreground">{request.category} | {request.location}</p>
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
