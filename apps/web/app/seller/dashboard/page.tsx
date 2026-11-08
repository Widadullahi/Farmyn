"use client";
import { useState } from "react";
import Link from "next/link";
import { ImageIcon, MessageSquare, Package, Plus, Rocket, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "@/context/AppContext";
import { api } from "@/lib/api";
import { formatNaira, marketplaceCategories } from "@/lib/app-data";

export default function SellerDashboardPage() {
  const { currentUser, products, addProduct, uploadPhoto } = useApp();
  const [form, setForm] = useState({ name: "", category: marketplaceCategories[0] as string, price: "", stockCount: "", unit: "", minimumOrder: "", location: currentUser?.location || "", description: "" });
  const [photos, setPhotos] = useState<{ image: string; preview: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [promoBusy, setPromoBusy] = useState("");
  if (!currentUser) return <><Navbar /><main className="container min-h-[65vh] py-20 text-center"><h1 className="text-3xl font-bold">Your listings</h1><p className="mt-3 text-muted-foreground">Sign in to publish and manage products.</p><Button asChild className="mt-6"><Link href="/login">Log in</Link></Button></main><Footer /></>;
  const mine = products.filter(product => product.sellerId === currentUser.id);
  const update = (key: string, value: string) => setForm(previous => ({ ...previous, [key]: value }));
  const publish = async (event: React.FormEvent) => { event.preventDefault(); if (!photos.length) return toast.error("Upload at least one product photo."); setBusy(true); const result = await addProduct({ ...form, images: photos.map(photo => photo.image), price: Number(form.price), stockCount: Number(form.stockCount) }); setBusy(false); if (!result.ok) return toast.error(result.message); toast.success(result.message); setPhotos([]); setForm(previous => ({ ...previous, name: "", price: "", stockCount: "", unit: "", minimumOrder: "", description: "" })); };
  const uploadPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    const available = 8 - photos.length;
    const selected = Array.from(files).slice(0, available);
    if (files.length > available) toast.error(`You can add up to 8 photos. ${available} slot${available === 1 ? " is" : "s are"} available.`);
    const invalid = selected.find(file => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 3 * 1024 * 1024);
    if (invalid) return toast.error("Each photo must be a JPEG, PNG or WebP under 3 MB.");
    setUploading(true);
    try {
      const uploaded: { image: string; preview: string }[] = [];
      for (const file of selected) uploaded.push(await uploadPhoto(file));
      setPhotos(previous => [...previous, ...uploaded]);
      toast.success(`${uploaded.length} photo${uploaded.length === 1 ? "" : "s"} uploaded. The first photo is your cover.`);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Upload failed."); }
    finally { setUploading(false); }
  };
  const requestPromotion = async (type: "boost" | "category-banner" | "homepage-banner", productId?: string) => { setPromoBusy(type + (productId || "")); try { const result = await api<{ message: string }>("/promotions/request", { type, ...(productId ? { productId } : {}), note: "" }); toast.success(result.message); } catch (error) { toast.error(error instanceof Error ? error.message : "Could not send request."); } finally { setPromoBusy(""); } };
  return <><Navbar /><main className="container py-10">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-widest text-primary">Seller workspace</p><h1 className="mt-2 text-3xl font-bold">Your listings</h1><p className="mt-2 text-sm text-muted-foreground">Publish products, promote them, and reply to buyers directly.</p></div><Button asChild variant="outline"><Link href="/chat"><MessageSquare className="h-4 w-4" /> Messages</Link></Button></div>
    <div className="mt-8 grid gap-8 lg:grid-cols-[380px_1fr]">
      <form onSubmit={publish} className="space-y-4 rounded-2xl border bg-card p-6"><h2 className="flex items-center gap-2 font-semibold"><Plus className="h-4 w-4" /> Add a listing</h2><Input required placeholder="Product name" value={form.name} onChange={e => update("name", e.target.value)} /><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.category} onChange={e => update("category", e.target.value)}>{marketplaceCategories.map(category => <option key={category}>{category}</option>)}</select><div className="grid grid-cols-2 gap-3"><Input required type="number" min="1" placeholder="Price (₦)" value={form.price} onChange={e => update("price", e.target.value)} /><Input required type="number" min="1" placeholder="Available qty" value={form.stockCount} onChange={e => update("stockCount", e.target.value)} /></div><div className="grid grid-cols-2 gap-3"><Input required placeholder="Unit, e.g. bag" value={form.unit} onChange={e => update("unit", e.target.value)} /><Input required placeholder="Minimum quantity" value={form.minimumOrder} onChange={e => update("minimumOrder", e.target.value)} /></div><Input required placeholder="Location" value={form.location} onChange={e => update("location", e.target.value)} /><Textarea required minLength={10} placeholder="Describe the product" value={form.description} onChange={e => update("description", e.target.value)} />
        <div><label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-4 py-5 text-sm font-medium text-primary transition hover:bg-primary/10"><UploadCloud className="h-5 w-5" />{uploading ? "Uploading photos…" : photos.length ? "Add more photos" : "Choose product photos"}<Input className="sr-only" type="file" multiple disabled={uploading || photos.length >= 8} accept="image/jpeg,image/png,image/webp" onChange={e => { void uploadPhotos(e.target.files); e.currentTarget.value = ""; }} /></label><p className="mt-2 text-xs text-muted-foreground">Choose up to 8 photos, each under 3 MB. The first photo is shown as the cover.</p></div>
        {photos.length > 0 && <div className="grid grid-cols-4 gap-2">{photos.map((photo, index) => <div key={photo.image} className="relative aspect-square overflow-hidden rounded-lg border"><img src={photo.preview} alt={`Product photo ${index + 1}`} className="h-full w-full object-cover" />{index === 0 && <span className="absolute bottom-1 left-1 rounded bg-foreground/80 px-1.5 py-0.5 text-[9px] font-semibold text-background">Cover</span>}<button type="button" aria-label={`Remove photo ${index + 1}`} onClick={() => setPhotos(previous => previous.filter((_, photoIndex) => photoIndex !== index))} className="absolute right-1 top-1 rounded-full bg-background/90 p-1 shadow"><X className="h-3 w-3" /></button></div>)}</div>}
        <Button className="w-full" disabled={busy || uploading}>{busy ? "Publishing…" : uploading ? "Uploading…" : "Publish listing"}</Button></form>
      <section className="rounded-2xl border bg-card p-6"><div className="flex items-center justify-between"><h2 className="flex items-center gap-2 font-semibold"><Package className="h-4 w-4" /> Live listings</h2><span className="text-sm text-muted-foreground">{mine.length}</span></div><div className="mt-5 space-y-3">{mine.length === 0 ? <p className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">Your published listings will appear here.</p> : mine.map(product => <div key={product.id} className="flex flex-wrap items-center gap-4 rounded-xl border p-3"><img src={product.image} alt="" className="h-16 w-16 rounded-lg object-cover" /><div className="min-w-0 flex-1"><p className="truncate font-semibold">{product.name}</p><p className="text-sm text-primary">{formatNaira(product.price)} / {product.unit}</p><p className="text-xs text-muted-foreground">{product.stockCount} available · {product.location}</p></div><Button size="sm" variant="outline" disabled={Boolean(promoBusy) || product.featured} onClick={() => requestPromotion("boost", product.id)}><Rocket className="h-3.5 w-3.5" /> {product.featured ? "Boosted" : "Boost · ₦2,000"}</Button></div>)}</div></section>
    </div>
    <section className="mt-8"><div className="mb-5"><p className="text-xs font-semibold uppercase tracking-widest text-primary">Banner advertising</p><h2 className="mt-2 text-2xl font-bold">Promote your whole business</h2></div><div className="grid gap-5 md:grid-cols-2"><article className="rounded-2xl border bg-card p-6"><ImageIcon className="h-6 w-6 text-primary" /><h3 className="mt-4 font-semibold">Category banner · ₦5,000</h3><p className="mt-2 text-sm text-muted-foreground">Seven days above marketplace listings. Farmyn schedules approved artwork.</p><Button className="mt-5" variant="outline" disabled={Boolean(promoBusy)} onClick={() => requestPromotion("category-banner")}>Request category banner</Button></article><article className="rounded-2xl border bg-card p-6"><ImageIcon className="h-6 w-6 text-primary" /><h3 className="mt-4 font-semibold">Homepage banner · ₦10,000</h3><p className="mt-2 text-sm text-muted-foreground">Seven days on the Farmyn homepage with a direct call to action.</p><Button className="mt-5" variant="outline" disabled={Boolean(promoBusy)} onClick={() => requestPromotion("homepage-banner")}>Request homepage banner</Button></article></div></section>
  </main><Footer /></>;
}
