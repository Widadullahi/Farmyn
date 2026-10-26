"use client";
import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import BrandLogo from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState(""); const [code, setCode] = useState(""); const [password, setPassword] = useState("");
  const [step, setStep] = useState(0); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  return <main className="min-h-screen bg-muted/30 px-4 py-12"><div className="mx-auto max-w-md rounded-2xl border bg-card p-8"><Link href="/" aria-label="Farmyn home"><BrandLogo /></Link><h1 className="mt-8 font-display text-2xl font-bold">Reset your password</h1>
    <form className="mt-6 space-y-4" onSubmit={async e => { e.preventDefault(); if (busy) return; setBusy(true); try { const r = await api(step === 0 ? '/auth/forgot' : '/auth/reset', step === 0 ? { email } : { email, code, password }); setMessage(r.message); setStep(step + 1); setPassword(""); } catch(e) { setMessage(e instanceof Error ? e.message : 'Please retry.'); } finally { setBusy(false); } }}>
      {step < 2 && <><Label htmlFor="reset-email">Email address</Label><Input id="reset-email" type="email" autoComplete="email" required value={email} readOnly={step === 1} onChange={e => setEmail(e.target.value)} /></>}
      {step === 1 && <><Label htmlFor="reset-code">Code from your email</Label><Input id="reset-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" required value={code} onChange={e => setCode(e.target.value)} /><Label htmlFor="new-password">New password</Label><Input id="new-password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required value={password} onChange={e => setPassword(e.target.value)} /><p className="text-xs text-muted-foreground">At least 12 characters, upper and lower case, a number and a symbol.</p></>}
      {message && <p role="status" className="text-sm">{message}</p>}{step < 2 && <Button type="submit" disabled={busy} className="w-full">{busy ? 'Please wait…' : step === 0 ? 'Send reset code' : 'Reset password'}</Button>}
    </form><Link href="/login" className="mt-6 inline-block text-sm font-semibold text-primary">Back to sign in</Link>
  </div></main>;
}
