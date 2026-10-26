"use client";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

import BrandLogo from "@/components/BrandLogo";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-foreground text-primary-foreground">
      <div className="container py-14">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <Link href="/" aria-label="Farmyn home" className="mb-5 inline-flex items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-4 focus-visible:ring-offset-foreground">
              <BrandLogo inverse />
            </Link>
            <p className="mb-5 text-sm leading-relaxed text-primary-foreground/60">
              Farmyn connects local farmers directly with households and businesses looking for fresh produce, poultry, livestock, and grains.
            </p>
            <Link href="/register" className="inline-flex rounded-lg border border-white/25 px-4 py-2 text-sm font-medium text-white hover:bg-white/10">Join Farmyn</Link>
          </div>

          <div className="grid grid-cols-3 gap-8 md:col-span-8">
            <div>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-primary-foreground/40">Marketplace</h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link href="/marketplace" className="text-primary-foreground/70 transition-colors hover:text-secondary">Browse All</Link></li>
                <li><Link href="/bulk" className="text-primary-foreground/70 transition-colors hover:text-secondary">Bulk Orders</Link></li>
                <li><Link href="/cart" className="text-primary-foreground/70 transition-colors hover:text-secondary">Cart</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-primary-foreground/40">Sellers</h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link href="/register" className="text-primary-foreground/70 transition-colors hover:text-secondary">Start Selling</Link></li>
                <li><Link href="/seller/dashboard" className="text-primary-foreground/70 transition-colors hover:text-secondary">Dashboard</Link></li>
                <li><Link href="/about" className="text-primary-foreground/70 transition-colors hover:text-secondary">Seller Guide</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-primary-foreground/40">Secure Payments</h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link href="/cart" className="text-primary-foreground/70 transition-colors hover:text-secondary">Paystack Checkout</Link></li>
                <li><Link href="/cart" className="text-primary-foreground/70 transition-colors hover:text-secondary">Track Orders</Link></li>
                <li><Link href="/about" className="text-primary-foreground/70 transition-colors hover:text-secondary">Trust & Safety</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-primary-foreground/10 pt-6 sm:flex-row">
          <p className="text-xs text-primary-foreground/40">
            Copyright {new Date().getFullYear()} Farmyn Nigeria. All rights reserved.
          </p>
          <div className="flex gap-6">
            <span className="text-xs text-primary-foreground/40">Made in Nigeria</span>
            <span className="text-xs text-primary-foreground/40">Safe, direct farm trade</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
