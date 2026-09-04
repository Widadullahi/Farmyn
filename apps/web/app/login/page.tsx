"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApp } from "@/context/AppContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const result = login(email, password);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    router.push(result.user?.role === "seller" ? "/seller/dashboard" : "/dashboard");
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="mb-10 inline-flex items-center gap-2">
            <img src="/farmlink-logo.png" alt="Farmyn" className="h-8 w-8" />
            <span className="font-display text-lg font-bold text-foreground">
              Farm<span className="text-primary">yn</span>
            </span>
          </Link>

          <h1 className="font-display text-2xl font-bold text-foreground">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your credentials to access your account.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium">Email address</Label>
              <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-medium">Password</Label>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={(event) => setPassword(event.target.value)} 
                  required 
                  className="pr-10"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full gap-2">
              Log in <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-semibold text-primary hover:underline">Create account</Link>
          </p>
        </div>
      </div>

      <div className="relative hidden lg:block">
        <img src="/hero-farm.jpg" alt="Nigerian farm" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 to-foreground/20" />
        <div className="absolute bottom-12 left-12 right-12 rounded-3xl bg-background/10 p-6 backdrop-blur">
          <blockquote className="text-lg font-medium leading-relaxed text-primary-foreground">
            "Farmyn helps trusted sellers reach more buyers while giving customers a safer way to order farm products online."
          </blockquote>
          <div className="mt-4">
            <p className="text-sm font-semibold text-primary-foreground">Farmyn</p>
            <p className="text-xs text-primary-foreground/70">Trusted agricultural marketplace</p>
          </div>
        </div>
      </div>
    </div>
  );
}
