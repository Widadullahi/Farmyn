"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Eye, EyeOff, X } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { api } from "@/lib/api";
import BrandLogo from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
export default function RegisterPage() {
  const { registerUser, confirmRegistration } = useApp();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "", location: "", storeName: "", referralCode: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState<"register" | "verify" | "done">("register");
  const [code, setCode] = useState(""); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => { const referralCode = new URLSearchParams(window.location.search).get("ref")?.trim().toUpperCase(); if (referralCode) setForm(previous => ({ ...previous, referralCode })); }, []);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); if (busy) return; setBusy(true); setMessage("");
    try {
      const strongPassword = form.password.length >= 12 && /[A-Z]/.test(form.password) && /[a-z]/.test(form.password) && /\d/.test(form.password) && /[^A-Za-z0-9]/.test(form.password);
      if (step === "register" && !strongPassword) { setMessage("Use at least 12 characters with an uppercase letter, lowercase letter, number, and symbol."); return; }
      if (step === "register" && form.password !== form.confirmPassword) { setMessage("Passwords do not match."); return; }
      const { confirmPassword: _confirmPassword, ...account } = form;
      const result = step === "register" ? await registerUser({ ...account, storeName: form.storeName || undefined, referralCode: form.referralCode || undefined }) : await confirmRegistration(form.email, code);
      setMessage(result.message); if (result.ok) { setStep(step === "register" ? "verify" : "done"); setForm(p => ({ ...p, password: "", confirmPassword: "" })); }
    } finally { setBusy(false); }
  };
  return <main className="min-h-screen bg-muted/30 px-4 py-12"><div className="mx-auto max-w-md rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
    <Link href="/" aria-label="Farmyn home"><BrandLogo /></Link>
    <h1 className="mt-8 font-display text-2xl font-bold">{step === "done" ? "Email verified" : step === "verify" ? "Check your email" : "Create your account"}</h1>
    <p className="mt-2 text-sm text-muted-foreground">{step === "verify" ? `Enter the code sent to ${form.email}.` : step === "done" ? "Your account is ready. Sign in to continue." : "One account to buy, chat, list products, and sell on Farmyn."}</p>
    <form onSubmit={submit} className="mt-6 space-y-4">
      {step === "register" && <>
        {([['name','Full name','text'],['email','Email address','email'],['phone','Phone number (e.g. +234…)','tel'],['location','City and state','text'],['storeName','Business or store name (optional)','text'],['referralCode','Referral code (optional)','text']] as string[][]).map(([key,label,type]) => <div key={key}><Label htmlFor={key}>{label}</Label><Input id={key} type={type} value={form[key as keyof typeof form]} required={!['storeName','referralCode'].includes(key)} minLength={key === 'referralCode' ? 8 : key === 'storeName' ? undefined : 2} maxLength={key === 'referralCode' ? 8 : 254} autoComplete={key === 'email' ? 'email' : undefined} className={key === 'referralCode' ? 'uppercase' : undefined} onChange={e => setForm(p => ({ ...p, [key]: key === 'referralCode' ? e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') : e.target.value }))} /></div>)}
        <div><Label htmlFor="password">Create password</Label><div className="relative"><Input id="password" type={showPassword ? "text" : "password"} value={form.password} required minLength={12} maxLength={128} autoComplete="new-password" className="pr-11" onChange={e => setForm(p => ({ ...p, password: e.target.value }))} /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(value => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div>
        <div><Label htmlFor="confirmPassword">Type password again</Label><div className="relative"><Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} value={form.confirmPassword} required minLength={12} maxLength={128} autoComplete="new-password" className="pr-11" onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))} /><button type="button" aria-label={showConfirmPassword ? "Hide repeated password" : "Show repeated password"} onClick={() => setShowConfirmPassword(value => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div>
        <div className="rounded-xl bg-muted/60 p-4"><p className="text-xs font-semibold">Use a strong password like Gmail recommends:</p><div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">{[[form.password.length >= 12,"At least 12 characters"],[/[A-Z]/.test(form.password),"One uppercase letter"],[/[a-z]/.test(form.password),"One lowercase letter"],[/\d/.test(form.password),"One number"],[/[^A-Za-z0-9]/.test(form.password),"One symbol"],[form.password.length > 0 && form.password === form.confirmPassword,"Both passwords match"]].map(([valid,label]) => <span key={String(label)} className={`flex items-center gap-2 ${valid ? "text-emerald-700" : ""}`}>{valid ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}{String(label)}</span>)}</div></div>
        <p className="text-xs text-muted-foreground">Your email must be verified before sign-in.</p>
      </>}
      {step === "verify" && <><Label htmlFor="code">Email verification code</Label><Input id="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" required value={code} onChange={e => setCode(e.target.value)} /> <Button type="button" variant="ghost" disabled={busy} onClick={async () => { setBusy(true); try { const r = await api('/auth/resend', { email: form.email }); setMessage(r.message); } catch(e) { setMessage(e instanceof Error ? e.message : 'Please retry.'); } finally { setBusy(false); } }}>Resend code</Button></>}
      {message && <p role="status" className="text-sm">{message}</p>}
      {step !== "done" && <Button type="submit" disabled={busy} className="h-11 w-full">{busy ? "Please wait…" : step === "verify" ? "Verify email" : "Create account"}</Button>}
    </form><p className="mt-6 text-sm"><Link href="/login" className="font-semibold text-primary">{step === "done" ? "Sign in" : "Already have an account? Sign in"}</Link></p>
  </div></main>;
}
