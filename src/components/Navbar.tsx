import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, LogOut, Menu, ShoppingCart, Store, UserCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import farmLinkLogo from "@/assets/farmlink-logo.png";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/utils";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { currentUser, cartCount, logout } = useApp();
  const location = useLocation();

  const links = [
    { label: "Marketplace", href: "/marketplace" },
    { label: "Bulk Orders", href: "/bulk" },
    { label: "About", href: "/about" },
  ];

  if (currentUser) {
    links.push({ label: "Chat", href: "/chat" });
  }

  if (currentUser?.role === "seller") {
    links.push({ label: "Dashboard", href: "/seller/dashboard" });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="container flex h-[4.5rem] items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={farmLinkLogo} alt="Farmyn Nigeria" className="h-8 w-8" />
          <span className="font-display text-lg font-bold tracking-tight text-foreground">
            Farm<span className="text-primary">yn</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                location.pathname === link.href
                  ? "bg-accent text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/cart">
            <Button variant="ghost" size="icon" className="relative h-9 w-9">
              <ShoppingCart className="h-[1.125rem] w-[1.125rem]" />
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-secondary px-1 text-[10px] font-bold text-secondary-foreground">
                {cartCount}
              </span>
            </Button>
          </Link>

          <div className="hidden items-center gap-2 md:flex">
            {currentUser ? (
              <>
                <div className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground">
                  {currentUser.role === "seller" ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Store className="h-3 w-3" />
                      {currentUser.storeName || currentUser.name}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5">
                      <UserCircle2 className="h-3 w-3" />
                      {currentUser.name}
                    </span>
                  )}
                </div>
                {currentUser.role === "seller" ? (
                  <Link to="/seller/dashboard">
                    <Button size="sm">Dashboard</Button>
                  </Link>
                ) : (
                  <Link to="/register">
                    <Button size="sm" variant="outline" className="gap-1.5">
                      Start Selling <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                )}
                <Button variant="ghost" size="sm" className="gap-1.5" onClick={logout}>
                  <LogOut className="h-3.5 w-3.5" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                    Log in
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" className="gap-1.5">
                    Get Started <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 md:hidden"
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-card p-4 md:hidden">
          <nav className="flex flex-col gap-2">
            {links.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  location.pathname === link.href
                    ? "bg-accent text-primary"
                    : "text-foreground hover:bg-muted",
                )}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 border-t border-border pt-3">
              {currentUser ? (
                <div className="space-y-2">
                  {currentUser.role === "seller" && (
                    <Link to="/seller/dashboard" onClick={() => setMobileOpen(false)}>
                      <Button className="w-full" size="sm">Dashboard</Button>
                    </Link>
                  )}
                  <Button
                    variant="outline"
                    className="w-full"
                    size="sm"
                    onClick={() => {
                      logout();
                      setMobileOpen(false);
                    }}
                  >
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Link to="/login" className="flex-1" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" className="w-full" size="sm">Log in</Button>
                  </Link>
                  <Link to="/register" className="flex-1" onClick={() => setMobileOpen(false)}>
                    <Button className="w-full" size="sm">Get Started</Button>
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
