import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import farmLinkLogo from "@/assets/farmlink-logo.png";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-foreground text-primary-foreground">
      <div className="container py-14">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <Link to="/" className="mb-4 inline-flex items-center gap-2.5">
              <img src={farmLinkLogo} alt="Farmyn" className="h-8 w-8" />
              <span className="font-display text-lg font-bold">
                Farm<span className="text-secondary">yn</span>
              </span>
            </Link>
            <p className="mb-5 text-sm leading-relaxed text-primary-foreground/60">
              Farmyn Nigeria connects trusted sellers directly with households and businesses looking for fresh produce, poultry, livestock, and processed foods.
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Enter your email"
                className="h-9 border-primary-foreground/20 bg-primary-foreground/5 text-primary-foreground placeholder:text-primary-foreground/30 focus-visible:ring-secondary"
              />
              <Button size="sm" variant="secondary" className="shrink-0 gap-1" onClick={() => toast.success("Thanks for subscribing.")}>
                Subscribe <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-8 md:col-span-8">
            <div>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-primary-foreground/40">Marketplace</h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link to="/marketplace" className="text-primary-foreground/70 transition-colors hover:text-secondary">Browse All</Link></li>
                <li><Link to="/bulk" className="text-primary-foreground/70 transition-colors hover:text-secondary">Bulk Orders</Link></li>
                <li><Link to="/cart" className="text-primary-foreground/70 transition-colors hover:text-secondary">Cart</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-primary-foreground/40">Sellers</h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link to="/register" className="text-primary-foreground/70 transition-colors hover:text-secondary">Start Selling</Link></li>
                <li><Link to="/seller/dashboard" className="text-primary-foreground/70 transition-colors hover:text-secondary">Dashboard</Link></li>
                <li><Link to="/about" className="text-primary-foreground/70 transition-colors hover:text-secondary">Seller Guide</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-primary-foreground/40">Company</h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link to="/about" className="text-primary-foreground/70 transition-colors hover:text-secondary">About Us</Link></li>
                <li><Link to="/about" className="text-primary-foreground/70 transition-colors hover:text-secondary">How It Works</Link></li>
                <li><Link to="/about" className="text-primary-foreground/70 transition-colors hover:text-secondary">Trust & Safety</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-primary-foreground/10 pt-6 sm:flex-row">
          <p className="text-xs text-primary-foreground/40">
            Copyright 2026 Farmyn Nigeria. All rights reserved.
          </p>
          <div className="flex gap-6">
            <span className="text-xs text-primary-foreground/40">Made in Nigeria</span>
            <span className="text-xs text-primary-foreground/40">Trusted farm-to-buyer commerce</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
