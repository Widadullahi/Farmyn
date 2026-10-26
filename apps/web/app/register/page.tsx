"use client";
import { useState } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { api } from "@/lib/api";
import BrandLogo from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
export default function RegisterPage() {
  const { registerUser, confirmRegistration } = useApp();
  const [role, setRole] = useState<"buyer" | "seller">("buyer");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", location: "", storeName: "" });
  const [step, setStep] = useState<"register" | "verify" | "done">("register");
  const [code, setCode] = useState(""); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); if (busy) return; setBusy(true); setMessage("");
    try {
      const result = step === "register" ? await registerUser({ ...form, role, storeName: role === "seller" ? form.storeName : undefined }) : await confirmRegistration(form.email, code);
      setMessage(result.message); if (result.ok) { setStep(step === "register" ? "verify" : "done"); setForm(p => ({ ...p, password: "" })); }
    } finally { setBusy(false); }
  };
  return <main className="min-h-screen bg-muted/30 px-4 py-12"><div className="mx-auto max-w-md rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
    <Link href="/" aria-label="Farmyn home"><BrandLogo /></Link>
    <h1 className="mt-8 font-display text-2xl font-bold">{step === "done" ? "Email verified" : step === "verify" ? "Check your email" : "Create your account"}</h1>
    <p className="mt-2 text-sm text-muted-foreground">{step === "verify" ? `Enter the code sent to ${form.email}.` : step === "done" ? "Your account is ready. Sign in to continue." : "Buy farm produce or open your store on Farmyn."}</p>
    <form onSubmit={submit} className="mt-6 space-y-4">
      {step === "register" && <>
        <div><Label htmlFor="role">Account type</Label><select id="role" value={role} onChange={e => setRole(e.target.value as "buyer" | "seller")} className="mt-1 h-11 w-full rounded-md border bg-background px-3"><option value="buyer">Buyer</option><option value="seller">Seller</option></select></div>
        {([['name','Full name','text'],['email','Email address','email'],['phone','Phone number (e.g. +234…)','tel'],['location','City and state','text'],...(role === 'seller' ? [['storeName','Store name','text']] : []),['password','Password','password']] as string[][]).map(([key,label,type]) => <div key={key}><Label htmlFor={key}>{label}</Label><Input id={key} type={type} value={form[key as keyof typeof form]} required minLength={key === 'password' ? 12 : 2} maxLength={key === 'password' ? 128 : 254} autoComplete={key === 'password' ? 'new-password' : key === 'email' ? 'email' : undefined} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} /></div>)}
        <p className="text-xs text-muted-foreground">Use at least 12 characters with upper and lower case letters, a number and a symbol. Your email must be verified before sign-in.</p>
      </>}
      {step === "verify" && <><Label htmlFor="code">Email verification code</Label><Input id="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" required value={code} onChange={e => setCode(e.target.value)} /> <Button type="button" variant="ghost" disabled={busy} onClick={async () => { setBusy(true); try { const r = await api('/auth/resend', { email: form.email }); setMessage(r.message); } catch(e) { setMessage(e instanceof Error ? e.message : 'Please retry.'); } finally { setBusy(false); } }}>Resend code</Button></>}
      {message && <p role="status" className="text-sm">{message}</p>}
      {step !== "done" && <Button type="submit" disabled={busy} className="h-11 w-full">{busy ? "Please wait…" : step === "verify" ? "Verify email" : "Create account"}</Button>}
    </form><p className="mt-6 text-sm"><Link href="/login" className="font-semibold text-primary">{step === "done" ? "Sign in" : "Already have an account? Sign in"}</Link></p>
  </div></main>;
}
