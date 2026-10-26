"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, CreditCard, Loader2, RefreshCw } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext";

export default function PaymentCompletePage() {
  const { currentUser, isHydrated, confirmPayment } = useApp();
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<"checking" | "paid" | "pending" | "error">("checking");
  const [message, setMessage] = useState("Verifying your payment with Paystack…");
  useEffect(() => {
    if (!isHydrated) return;
    if (!currentUser) { sessionStorage.setItem("farmyn-return-to", window.location.pathname + window.location.search); return; }
    let active = true;
    const reference = new URLSearchParams(window.location.search).get("reference");
    if (!reference) { setStatus("error"); setMessage("No payment reference was supplied. Return to your cart to start checkout."); return; }
    setStatus("checking");
    confirmPayment(reference).then(result => {
      if (!active) return;
      setStatus(result.ok ? "paid" : "pending"); setMessage(result.message);
    }).catch(error => { if (active) { setStatus("error"); setMessage(error.message || "Verification is unavailable. Please retry."); } });
    return () => { active = false; };
    // The action reads the latest account; order updates must not restart verification.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated, currentUser?.id, attempt]);
  return <div className="min-h-screen bg-background"><Navbar /><main className="container flex min-h-[65vh] items-center justify-center py-12"><section className="w-full max-w-lg rounded-3xl border border-border bg-card p-8 text-center shadow-card"><div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-primary">{status === "paid" ? <CheckCircle2 className="h-8 w-8" /> : status === "checking" && currentUser ? <Loader2 className="h-8 w-8 animate-spin" /> : <CreditCard className="h-8 w-8" />}</div><p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Paystack checkout</p><h1 className="mt-3 text-2xl font-bold">{!isHydrated ? "Loading your account" : !currentUser ? "Sign in to verify payment" : status === "paid" ? "Payment confirmed" : status === "checking" ? "Checking your payment" : "Payment not yet confirmed"}</h1><p role="status" className="mt-3 text-sm leading-relaxed text-muted-foreground">{!currentUser && isHydrated ? "Use the account that placed this order. Your cart stays saved until payment is confirmed." : message}</p><div className="mt-6 flex flex-wrap justify-center gap-3">{currentUser && (status === "pending" || status === "error") && <Button onClick={() => setAttempt(a => a + 1)} className="gap-2"><RefreshCw className="h-4 w-4" /> Check again</Button>}<Button asChild variant={status === "paid" ? "default" : "outline"}><Link href={!currentUser ? "/login" : "/cart"}>{!currentUser ? "Sign in" : status === "paid" ? "View your orders" : "Back to cart"}</Link></Button></div><p className="mt-6 text-[11px] text-muted-foreground">Order fulfillment and seller settlement are separate from payment confirmation.</p></section></main><Footer /></div>;
}
