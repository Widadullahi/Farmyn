"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import { usePathname } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowUpRight, ChevronRight, Home, Info, LayoutDashboard, Leaf, LogOut, Menu, MessageSquare, ShoppingBag, ShoppingCart, Sprout, Store, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/utils";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { currentUser, cartCount, logout } = useApp();
  const pathname = usePathname();
  const dashboard = currentUser?.role === "seller" ? "/seller/dashboard" : "/dashboard";
  const displayName = currentUser?.storeName || currentUser?.name || "";
  const links = [
    { label: "Home", href: "/", icon: Home, description: "Fresh finds and farm favourites" },
    { label: "Marketplace", href: "/marketplace", icon: ShoppingBag, description: "Shop directly from local growers" },
    { label: "Bulk orders", href: "/bulk", icon: Sprout, description: "Source more for your business" },
    { label: "About us", href: "/about", icon: Info, description: "Get to know Farmyn" },
    ...(currentUser ? [
      { label: "Messages", href: "/chat", icon: MessageSquare, description: "Connect with buyers and farmers" },
      { label: "Dashboard", href: dashboard, icon: LayoutDashboard, description: "Your account at a glance" },
    ] : []),
  ];

  useEffect(() => { setMobileOpen(false); }, [pathname]);
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1280px)");
    const closeOnDesktop = () => { if (desktop.matches) setMobileOpen(false); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  const brand = <BrandLogo />;

  return (
    <header className="sticky top-0 z-40 border-b border-primary/10 bg-background/95 shadow-[0_2px_12px_rgba(20,50,35,0.03)] backdrop-blur-xl">
      <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6 xl:h-20 xl:px-8">
        <Link href="/" aria-label="Farmyn home" className="flex shrink-0 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4">{brand}</Link>
        <nav aria-label="Main navigation" className="hidden items-center gap-0.5 xl:flex">
          {links.map(link => <Link key={link.href} href={link.href} aria-current={pathname === link.href ? "page" : undefined} className={cn("rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors", pathname === link.href ? "bg-accent text-primary" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground")}>{link.label}</Link>)}
        </nav>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link href="/cart" aria-label={`Shopping cart${cartCount ? `, ${cartCount} item${cartCount === 1 ? "" : "s"}` : ", empty"}`} className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-primary/10 bg-card text-foreground transition-colors hover:border-primary/30 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <ShoppingCart className="h-[19px] w-[19px]" aria-hidden="true" />
            {cartCount > 0 && <span aria-hidden="true" className="absolute -right-1 -top-1 flex h-[19px] min-w-[19px] items-center justify-center rounded-full border-2 border-background bg-primary px-1 text-[9px] font-bold text-white">{cartCount > 99 ? "99+" : cartCount}</span>}
          </Link>
          <div className="hidden items-center gap-2 xl:flex">
            {currentUser ? <><Link href={dashboard} className="flex h-10 items-center gap-2 rounded-lg bg-accent/70 px-3 text-xs font-medium text-primary"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[9px] text-white">{displayName.slice(0, 2).toUpperCase()}</span><span className="max-w-[100px] truncate">{displayName}</span></Link><Button variant="ghost" size="icon" aria-label="Log out" onClick={logout}><LogOut className="h-4 w-4" /></Button></> : <><Button asChild variant="ghost" size="sm"><Link href="/login">Log in</Link></Button><Button asChild className="rounded-lg text-xs"><Link href="/register">Get started <ArrowUpRight className="h-4 w-4" /></Link></Button></>}
          </div>
          <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
            <Dialog.Trigger asChild><button aria-label="Open navigation menu" className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 xl:hidden"><Menu className="h-5 w-5" /></button></Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/35 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 motion-reduce:animate-none" />
              <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-[calc(100%_-_20px)] max-w-sm flex-col border-l border-border bg-background shadow-2xl outline-none duration-200 data-[state=open]:animate-in data-[state=open]:slide-in-from-right data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right motion-reduce:animate-none">
                <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 pb-5 pt-[max(20px,env(safe-area-inset-top))]">
                  <Link href="/" aria-label="Farmyn home" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5">{brand}</Link>
                  <Dialog.Close asChild><button aria-label="Close navigation menu" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><X className="h-5 w-5" /></button></Dialog.Close>
                </div>
                <Dialog.Title className="sr-only">Explore Farmyn</Dialog.Title>
                <Dialog.Description className="sr-only">Browse the marketplace, place bulk orders, or manage your account.</Dialog.Description>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5">
                  <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Explore Farmyn</p>
                  <nav aria-label="Mobile navigation" className="space-y-1.5">{links.map(link => {
                    const active = pathname === link.href;
                    return <Link key={link.href} href={link.href} aria-current={active ? "page" : undefined} onClick={() => setMobileOpen(false)} className={cn("group flex min-h-16 items-center gap-3 rounded-xl border p-3 transition-colors", active ? "border-primary/10 bg-accent/80" : "border-transparent hover:bg-accent/50")}><span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", active ? "bg-primary text-white" : "border border-border bg-card text-muted-foreground")}><link.icon className="h-[18px] w-[18px]" /></span><span className="min-w-0 flex-1"><span className={cn("block text-sm font-semibold", active ? "text-primary" : "text-foreground")}>{link.label}</span><span className="mt-0.5 block text-[11px] text-muted-foreground">{link.description}</span></span><ChevronRight className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-muted-foreground/50")} /></Link>;
                  })}</nav>
                  {!currentUser && <Link href="/register" onClick={() => setMobileOpen(false)} className="mt-5 flex items-center gap-3 rounded-xl border border-primary/10 bg-accent/40 p-4"><span className="rounded-xl bg-card p-2.5 text-primary"><Store className="h-5 w-5" /></span><span className="flex-1"><span className="block text-sm font-semibold text-foreground">Grow with Farmyn</span><span className="mt-1 block text-[11px] text-muted-foreground">Bring your farm to more buyers.</span></span><ArrowUpRight className="h-4 w-4 text-primary" /></Link>}
                </div>
                <div className="shrink-0 space-y-4 border-t border-border bg-card px-5 pt-5 pb-[max(20px,env(safe-area-inset-bottom))]">
                  {currentUser ? <><Link href={dashboard} onClick={() => setMobileOpen(false)} className="flex min-w-0 items-center gap-3 rounded-xl bg-muted/50 p-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">{displayName.slice(0, 2).toUpperCase()}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{displayName}</span><span className="mt-0.5 block text-[11px] capitalize text-muted-foreground">{currentUser.role} account</span></span><ChevronRight className="h-4 w-4 text-muted-foreground" /></Link><Button variant="outline" className="h-11 w-full rounded-xl" onClick={() => { logout(); setMobileOpen(false); }}><LogOut className="h-4 w-4" /> Log out</Button></> : <div className="grid grid-cols-2 gap-3"><Button asChild variant="outline" className="h-11 rounded-xl"><Link href="/login" onClick={() => setMobileOpen(false)}>Log in</Link></Button><Button asChild className="h-11 rounded-xl"><Link href="/register" onClick={() => setMobileOpen(false)}>Get started <ArrowUpRight className="h-4 w-4" /></Link></Button></div>}
                  <p className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground"><Leaf className="h-3 w-3 text-primary" />Fresh connections. Better harvests.</p>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
