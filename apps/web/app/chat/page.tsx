"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { Camera, MessageSquare, QrCode, Search, Send, ShieldCheck, Store, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/context/AppContext";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate, formatNaira, User } from "@/lib/app-data";

function QrScanner({ onFound, onClose }: { onFound: (id: string) => void; onClose: () => void }) {
  const [error, setError] = useState("");
  useEffect(() => {
    let scanner: import("html5-qrcode").Html5Qrcode | null = null;
    let cancelled = false;
    void import("html5-qrcode").then(async ({ Html5Qrcode }) => {
      if (cancelled) return;
      scanner = new Html5Qrcode("farmyn-qr-reader");
      try {
        await scanner.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 240, height: 240 } }, decoded => {
          try { const id = new URL(decoded).searchParams.get("user"); if (id) onFound(id); else setError("This is not a Farmyn profile QR code."); }
          catch { setError("This is not a Farmyn profile QR code."); }
        }, () => undefined);
      } catch { setError("Camera access is unavailable. Allow camera permission and try again."); }
    });
    return () => { cancelled = true; if (scanner?.isScanning) void scanner.stop().then(() => scanner?.clear()).catch(() => undefined); };
  }, [onFound]);
  return <Modal title="Scan a Farmyn QR code" onClose={onClose}><div id="farmyn-qr-reader" className="overflow-hidden rounded-2xl bg-slate-950" /><p className="mt-4 text-sm text-muted-foreground">Point your camera at another member&apos;s Farmyn QR code to open their chat.</p>{error && <p className="mt-3 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}</Modal>;
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return <div className="fixed inset-0 z-[90] flex items-center justify-center bg-foreground/45 p-4 backdrop-blur-sm"><div className="w-full max-w-md rounded-3xl border bg-background p-5 shadow-2xl"><div className="mb-5 flex items-center justify-between gap-4"><h2 className="text-lg font-bold">{title}</h2><button onClick={onClose} aria-label="Close" className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted"><X className="h-4 w-4" /></button></div>{children}</div></div>;
}

const avatar = (user?: User) => (user?.storeName || user?.name || "??").slice(0, 2).toUpperCase();

function ChatContent() {
  const router = useRouter(), params = useSearchParams();
  const targetUserId = params.get("user"), targetProductId = params.get("product");
  const { currentUser, isHydrated, chatMessages, users, products, sendChatMessage } = useApp();
  const [activeUserId, setActiveUserId] = useState<string | null>(targetUserId);
  const [messageText, setMessageText] = useState("");
  const [peopleQuery, setPeopleQuery] = useState("");
  const [showMyQr, setShowMyQr] = useState(false), [showScanner, setShowScanner] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (isHydrated && !currentUser) { sessionStorage.setItem("farmyn-return-to", `/chat?${params.toString()}`); router.push("/login"); } }, [currentUser, isHydrated, params, router]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages, activeUserId]);

  const myMessages = useMemo(() => currentUser ? chatMessages.filter(message => message.senderId === currentUser.id || message.receiverId === currentUser.id) : [], [chatMessages, currentUser]);
  const partnerIds = useMemo(() => currentUser ? Array.from(new Set(myMessages.map(message => message.senderId === currentUser.id ? message.receiverId : message.senderId))) : [], [myMessages, currentUser]);
  const visiblePartnerIds = targetUserId && !partnerIds.includes(targetUserId) ? [...partnerIds, targetUserId] : partnerIds;
  const threads = visiblePartnerIds.map(id => {
    const partner = users.find(user => user.id === id);
    const conversation = currentUser ? myMessages.filter(message => (message.senderId === currentUser.id && message.receiverId === id) || (message.senderId === id && message.receiverId === currentUser.id)) : [];
    return { partner, lastMessage: conversation.at(-1) };
  }).filter(item => item.partner).sort((a, b) => Date.parse(b.lastMessage?.createdAt || "0") - Date.parse(a.lastMessage?.createdAt || "0"));

  if (!currentUser) return null;
  const query = peopleQuery.trim().toLowerCase();
  const people = users.filter(user => user.id !== currentUser.id && (!query || [user.username, user.name, user.storeName, user.location].filter(Boolean).some(value => value!.toLowerCase().includes(query)))).slice(0, 20);
  const activePartner = users.find(user => user.id === activeUserId);
  const enquiryProduct = targetUserId === activeUserId ? products.find(product => product.id === targetProductId && product.sellerId === activeUserId) : undefined;
  const activeConversation = myMessages.filter(message => (message.senderId === currentUser.id && message.receiverId === activeUserId) || (message.senderId === activeUserId && message.receiverId === currentUser.id));
  const profileUrl = typeof window === "undefined" ? "" : `${window.location.origin}/chat?user=${encodeURIComponent(currentUser.id)}`;

  const selectPerson = (id: string) => { setActiveUserId(id); setPeopleQuery(""); router.replace(`/chat?user=${encodeURIComponent(id)}`); };
  const scanFound = (id: string) => { const person = users.find(user => user.id === id && user.id !== currentUser.id); if (!person) return toast.error("That Farmyn member could not be found."); setShowScanner(false); selectPerson(id); };
  const send = async (event: React.FormEvent) => { event.preventDefault(); if (!messageText.trim() || !activeUserId) return; const result = await sendChatMessage(activeUserId, messageText.trim(), enquiryProduct?.id); if (result.ok) setMessageText(""); else toast.error(result.message); };

  return <div className="flex min-h-screen flex-col bg-[#f4f7f4]"><Navbar /><main className="mx-auto flex w-full max-w-[1800px] flex-1 flex-col px-3 py-4 sm:px-5 lg:min-h-0 lg:px-8 lg:py-6"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-primary">Farmyn messages</p><h1 className="mt-1 text-2xl font-bold">Conversations and people</h1></div><div className="flex gap-2"><Button variant="outline" onClick={() => setShowScanner(true)}><Camera className="h-4 w-4" /> Scan QR</Button><Button onClick={() => setShowMyQr(true)}><QrCode className="h-4 w-4" /> My QR code</Button></div></div><div className="grid flex-1 gap-4 lg:min-h-[680px] lg:grid-cols-[360px_minmax(0,1fr)]"><aside className="flex min-h-[520px] flex-col overflow-hidden rounded-3xl border bg-card shadow-sm"><div className="border-b p-4"><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={peopleQuery} onChange={event => setPeopleQuery(event.target.value)} placeholder="Search @username, name or location" className="h-11 pl-10" /></div></div><div className="min-h-0 flex-1 overflow-y-auto">{query ? <div><p className="px-4 pb-2 pt-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">People</p>{people.length ? people.map(person => <PersonButton key={person.id} person={person} active={person.id === activeUserId} subtitle={`@${person.username || "member"} · ${person.location}`} onClick={() => selectPerson(person.id)} />) : <p className="p-6 text-center text-sm text-muted-foreground">No member matches that search.</p>}</div> : <div><p className="px-4 pb-2 pt-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Recent conversations</p>{threads.length ? threads.map(({ partner, lastMessage }) => partner && <PersonButton key={partner.id} person={partner} active={partner.id === activeUserId} subtitle={lastMessage?.message || `@${partner.username || "member"}`} onClick={() => selectPerson(partner.id)} />) : <div className="px-6 py-12 text-center"><UserRound className="mx-auto h-8 w-8 text-primary/40" /><p className="mt-3 text-sm font-semibold">Find someone to message</p><p className="mt-1 text-xs text-muted-foreground">Search by username above or scan their QR code.</p></div>}</div>}</div></aside><section className="flex min-h-[600px] min-w-0 flex-col overflow-hidden rounded-3xl border bg-card shadow-sm">{activePartner ? <><header className="flex items-center justify-between gap-4 border-b bg-white px-4 py-4 sm:px-6"><div className="flex min-w-0 items-center gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 font-bold text-primary">{avatar(activePartner)}</span><div className="min-w-0"><h2 className="flex items-center gap-1.5 truncate font-bold">{activePartner.storeName || activePartner.name}{activePartner.verified && <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />}</h2><p className="truncate text-xs text-muted-foreground">@{activePartner.username || "member"} · {activePartner.location}</p></div></div><Link href={`/store/${encodeURIComponent(activePartner.id)}`} className="hidden items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold text-primary sm:flex"><Store className="h-4 w-4" /> View profile</Link></header>{enquiryProduct && <div className="flex items-center gap-3 border-b bg-accent/30 px-4 py-3 sm:px-6"><img src={enquiryProduct.image} alt="" className="h-12 w-12 rounded-xl object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{enquiryProduct.name}</p><p className="text-xs text-primary">{formatNaira(enquiryProduct.price)} · {enquiryProduct.unit}</p></div></div>}<div className="flex-1 space-y-4 overflow-y-auto bg-[#f8faf8] p-4 sm:p-6">{activeConversation.length ? activeConversation.map(message => { const mine = message.senderId === currentUser.id; return <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}><div className={`max-w-[86%] rounded-2xl px-4 py-3 text-sm shadow-sm sm:max-w-[70%] ${mine ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md border bg-white"}`}>{message.productId && <p className={`mb-1 text-xs font-semibold ${mine ? "text-white/70" : "text-primary"}`}>Re: {message.productName}</p>}<p className="whitespace-pre-wrap leading-relaxed">{message.message}</p><time className={`mt-1 block text-right text-[10px] ${mine ? "text-white/55" : "text-muted-foreground"}`}>{formatDate(message.createdAt)}</time></div></div>; }) : <div className="flex h-full items-center justify-center text-center"><div><MessageSquare className="mx-auto h-10 w-10 text-primary/30" /><p className="mt-3 font-semibold">Start a conversation with {activePartner.name.split(" ")[0]}</p><p className="mt-1 text-sm text-muted-foreground">Be clear about product, price, quantity, pickup, or delivery.</p></div></div>}<div ref={messagesEndRef} /></div><form onSubmit={send} className="flex gap-2 border-t bg-white p-3 sm:p-4"><Input value={messageText} onChange={event => setMessageText(event.target.value)} placeholder="Write a message…" aria-label="Message" className="h-11 flex-1" /><Button type="submit" size="icon" className="h-11 w-11 shrink-0" aria-label="Send message"><Send className="h-4 w-4" /></Button></form></> : <div className="flex flex-1 items-center justify-center p-8 text-center"><div><span className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10"><MessageSquare className="h-9 w-9 text-primary" /></span><h2 className="mt-5 text-xl font-bold">Your Farmyn inbox</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Search for a member by username, select a recent conversation, or scan someone&apos;s QR code to begin.</p></div></div>}</section></div></main>{showMyQr && <Modal title="Your Farmyn QR code" onClose={() => setShowMyQr(false)}><div className="rounded-3xl bg-white p-6 text-center"><QRCodeSVG value={profileUrl} size={240} level="H" fgColor="#165c3a" bgColor="#ffffff" imageSettings={{ src: "/farmyn-pwa-192.png", height: 42, width: 42, excavate: true }} className="mx-auto max-w-full" /><p className="mt-5 font-bold">@{currentUser.username || "member"}</p><p className="mt-1 text-sm text-muted-foreground">Let another person scan this code to start chatting with you.</p></div></Modal>}{showScanner && <QrScanner onFound={scanFound} onClose={() => setShowScanner(false)} />}</div>;
}

function PersonButton({ person, active, subtitle, onClick }: { person: User; active: boolean; subtitle: string; onClick: () => void }) {
  return <button onClick={onClick} className={`flex w-full items-center gap-3 border-l-2 px-4 py-3 text-left transition-colors ${active ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted/50"}`}><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-sm font-bold text-primary">{avatar(person)}</span><span className="min-w-0 flex-1"><span className="flex items-center gap-1.5 truncate text-sm font-semibold">{person.storeName || person.name}{person.verified && <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-primary" />}</span><span className="mt-0.5 block truncate text-xs text-muted-foreground">{subtitle}</span></span></button>;
}

export default function ChatPage() { return <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading messages…</div>}><ChatContent /></Suspense>; }
