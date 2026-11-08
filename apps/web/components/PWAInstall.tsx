"use client";

import { useEffect, useState } from "react";
import { Download, Share, Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const isStandalone = () => window.matchMedia("(display-mode: standalone)").matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);

export function InstallAppButton({ mobile = false }: { mobile?: boolean }) {
  return <button type="button" onClick={() => window.dispatchEvent(new Event("farmyn-install"))} className={mobile ? "flex min-h-16 w-full items-center gap-3 rounded-xl border border-transparent p-3 text-left transition-colors hover:bg-accent/50" : "inline-flex h-10 items-center gap-2 rounded-lg border border-primary/15 bg-card px-3 text-xs font-semibold text-primary transition-colors hover:bg-accent"}><span className={mobile ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-primary" : ""}><Download className="h-[18px] w-[18px]" /></span><span><span className="block font-semibold">Download app</span>{mobile && <span className="mt-0.5 block text-[11px] font-normal text-muted-foreground">Install Farmyn on this device</span>}</span></button>;
}

export default function PWAInstall() {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [open, setOpen] = useState(false);
  const [iosHelp, setIosHelp] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) void navigator.serviceWorker.register("/sw.js");
    const installed = isStandalone();
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const dismissedAt = Number(localStorage.getItem("farmyn-install-dismissed") || 0);
    const canShowAgain = Date.now() - dismissedAt > 7 * 86400000;
    const beforeInstall = (event: Event) => { event.preventDefault(); setPrompt(event as InstallPromptEvent); if (!installed && canShowAgain) window.setTimeout(() => setOpen(true), 1200); };
    const manualOpen = () => { if (installed) return; setIosHelp(isIos); setOpen(true); };
    window.addEventListener("beforeinstallprompt", beforeInstall);
    window.addEventListener("farmyn-install", manualOpen);
    if (!installed && canShowAgain) window.setTimeout(() => { setIosHelp(isIos); setOpen(true); }, 1500);
    return () => { window.removeEventListener("beforeinstallprompt", beforeInstall); window.removeEventListener("farmyn-install", manualOpen); };
  }, []);

  const close = () => { localStorage.setItem("farmyn-install-dismissed", String(Date.now())); setOpen(false); };
  const install = async () => {
    if (!prompt) { setIosHelp(true); return; }
    await prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice.outcome === "accepted") setOpen(false);
    setPrompt(null);
  };

  if (!open) return null;
  return <div className="fixed inset-x-4 bottom-4 z-[80] mx-auto max-w-md rounded-3xl border border-primary/15 bg-background p-5 shadow-2xl sm:bottom-6"><button type="button" aria-label="Close install prompt" onClick={close} className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground"><X className="h-4 w-4" /></button><div className="flex gap-4 pr-9"><span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10"><img src="/farmyn-icon.svg" alt="" className="h-10 w-10" /></span><div><p className="text-xs font-bold uppercase tracking-widest text-primary">Farmyn app</p><h2 className="mt-1 text-xl font-bold">Take the marketplace with you</h2></div></div><p className="mt-4 text-sm leading-6 text-muted-foreground">Install Farmyn for quicker access to listings, messages, and your seller dashboard.</p>{iosHelp ? <div className="mt-4 rounded-2xl bg-muted/60 p-4 text-sm"><p className="flex items-center gap-2 font-semibold"><Share className="h-4 w-4 text-primary" /> Install from your browser</p><p className="mt-2 text-muted-foreground">On iPhone, tap Share and choose “Add to Home Screen.” On other browsers, open the menu and choose “Install app.”</p></div> : <Button onClick={install} className="mt-5 h-11 w-full"><Smartphone className="h-4 w-4" /> Install Farmyn</Button>}<button type="button" onClick={close} className="mt-3 w-full text-center text-xs font-medium text-muted-foreground">Maybe later</button></div>;
}
