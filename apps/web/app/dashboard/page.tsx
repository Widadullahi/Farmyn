"use client";
import Link from "next/link";
import { MessageSquare, Search, Store } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext";
export default function DashboardPage() {
  const { currentUser, chatMessages } = useApp();
  if (!currentUser || currentUser.role !== "buyer") return <><Navbar /><main className="container min-h-[65vh] py-20 text-center"><h1 className="text-3xl font-bold">Buyer account</h1><p className="mt-3 text-muted-foreground">Sign in as a buyer to view your conversations.</p><Button asChild className="mt-6"><Link href="/login">Log in</Link></Button></main><Footer /></>;
  const conversations = new Set(chatMessages.flatMap(message => message.senderId === currentUser.id ? [message.receiverId] : message.receiverId === currentUser.id ? [message.senderId] : [])).size;
  return <><Navbar /><main className="container min-h-[65vh] py-12"><div className="rounded-3xl bg-primary px-7 py-9 text-primary-foreground"><p className="text-xs font-semibold uppercase tracking-widest opacity-70">Buyer workspace</p><h1 className="mt-3 text-3xl font-bold">Hello, {currentUser.name.split(" ")[0]}</h1><p className="mt-3 max-w-xl text-sm opacity-80">Browse local listings and chat directly with sellers about availability, price, pickup, and delivery.</p></div><div className="mt-8 grid gap-5 md:grid-cols-2"><section className="rounded-2xl border bg-card p-6"><Search className="h-6 w-6 text-primary" /><h2 className="mt-4 text-lg font-semibold">Find farm products</h2><p className="mt-2 text-sm text-muted-foreground">Compare listings by category, location, price, and seller.</p><Button asChild className="mt-5"><Link href="/marketplace"><Store className="h-4 w-4" /> Browse marketplace</Link></Button></section><section className="rounded-2xl border bg-card p-6"><MessageSquare className="h-6 w-6 text-primary" /><h2 className="mt-4 text-lg font-semibold">Your conversations</h2><p className="mt-2 text-sm text-muted-foreground">{conversations ? `You have conversations with ${conversations} seller${conversations === 1 ? "" : "s"}.` : "Message a seller from any listing to start a conversation."}</p><Button asChild variant="outline" className="mt-5"><Link href="/chat">Open messages</Link></Button></section></div></main><Footer /></>;
}
