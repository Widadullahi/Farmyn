"use client";
import { useEffect, useState } from "react";
import { paymentHealth } from "@/lib/paystack";
import { cn } from "@/lib/utils";

export function PaymentStatusBadge({ className }: { className?: string }) {
  const [status, setStatus] = useState("Checking payments…");
  useEffect(() => {
    let active = true;
    paymentHealth().then(result => { if (active) setStatus(result.mode === "test" ? "Paystack · Test mode" : "Paystack · Setup needed"); }).catch(() => { if (active) setStatus("Payments unavailable"); });
    return () => { active = false; };
  }, []);
  return <span className={cn("inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-[10px] font-medium text-muted-foreground", className)}><span className="h-1.5 w-1.5 rounded-full bg-current" />{status}</span>;
}
