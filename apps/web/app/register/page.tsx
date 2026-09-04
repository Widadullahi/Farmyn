"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ShoppingBag, Tractor, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApp } from "@/context/AppContext";

export default function RegisterPage() {
  const router = useRouter();
  const { registerUser } = useApp();
  const [role, setRole] = useState<"buyer" | "seller">("buyer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [storeName, setStoreName] = useState("");
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [readyToVerify, setReadyToVerify] = useState(false);

  const beginVerification = (event: React.FormEvent) => {
    event.preventDefault();
    const nextOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(nextOtp);
    setReadyToVerify(true);
    toast.success(`Verification code: ${nextOtp}`);
  };

  const completeRegistration = () => {
    if (otp !== generatedOtp) {
      toast.error("Incorrect verification code.");
      return;
    }

    const result = registerUser({
      role,
      name,
      email,
      phone,
      password,
      location,
      storeName: role === "seller" ? storeName : undefined,
    });

    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    router.push(role === "seller" ? "/seller/dashboard" : "/dashboard");
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <Link href="/" className="mb-10 inline-flex items-center gap-2">
            <img src="/farmlink-logo.png" alt="Farmyn" className="h-8 w-8" />
            <span className="font-display text-lg font-bold text-foreground">
              Farm<span className="text-primary">yn</span>
            </span>
          </Link>

          <h1 className="font-display text-2xl font-bold text-foreground">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Join Farmyn as a buyer or seller and start trading with confidence.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            {([
              { value: "buyer" as const, label: "I want to Buy", icon: ShoppingBag },
              { value: "seller" as const, label: "I want to Sell", icon: Tractor },
            ]).map((entry) => (
              <button
                key={entry.value}
                type="button"
                onClick={() => setRole(entry.value)}
                className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-sm font-medium transition-all ${
                  role === entry.value
                    ? "border-primary bg-accent text-primary"
                    : "border-border bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                <entry.icon className="h-5 w-5" />
                {entry.label}
              </button>
            ))}
          </div>

          <form onSubmit={beginVerification} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-medium">Full name</Label>
              <Input id="name" value={name} onChange={(event) => setName(event.target.value)} required />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium">Email address</Label>
                <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs font-medium">Phone number</Label>
                <Input id="phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} required />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="location" className="text-xs font-medium">Location</Label>
                <Input id="location" placeholder="Jos, Plateau" value={location} onChange={(event) => setLocation(event.target.value)} required />
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
            </div>
            {role === "seller" && (
              <div className="space-y-1.5">
                <Label htmlFor="store" className="text-xs font-medium">Store name</Label>
                <Input id="store" placeholder="Farmyn Seller Store" value={storeName} onChange={(event) => setStoreName(event.target.value)} required />
              </div>
            )}
            <Button type="submit" className="w-full gap-2">
              Generate verification code <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          {readyToVerify && (
            <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-card">
              <p className="text-sm font-semibold text-foreground">Verify your email</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Verification code: <span className="font-semibold text-primary">{generatedOtp}</span>
              </p>
              <div className="mt-4 flex gap-3">
                <Input placeholder="Enter OTP" value={otp} onChange={(event) => setOtp(event.target.value)} />
                <Button onClick={completeRegistration}>Verify</Button>
              </div>
            </div>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">Log in</Link>
          </p>
        </div>
      </div>

      <div className="relative hidden lg:block">
        <img src="/hero-farm.jpg" alt="Nigerian farm" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 to-foreground/20" />
        <div className="absolute bottom-12 left-12 right-12">
          <div className="grid grid-cols-3 gap-5 text-primary-foreground">
            {[["Buyers", "Protected Checkout"], ["Sellers", "Verified Profiles"], ["Bulk", "Business Supply"]].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-background/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-wide text-primary-foreground/60">{label}</p>
                <p className="mt-2 font-display text-xl font-bold">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
