"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

const slides = [
  { image: "/farmyn-journey-produce.jpg", label: "01 · LIST WHAT IS READY", title: "Turn today’s harvest into a listing buyers can discover.", text: "Add clear photos, quantity, price, and location. Your product becomes searchable across the Farmyn marketplace.", action: "Create your first listing", href: "/seller/dashboard" },
  { image: "/farmyn-journey-chat.jpg", label: "02 · START A CONVERSATION", title: "Ask, compare, and agree without leaving Farmyn.", text: "Buyers can contact a seller from a listing to confirm freshness, available quantity, pickup, delivery, and price.", action: "Browse the marketplace", href: "/marketplace" },
  { image: "/farmyn-journey-livestock.jpg", label: "03 · SELL MORE THAN PRODUCE", title: "From cattle to grains, every farm business has a place.", text: "Create listings across Farmyn’s agricultural categories and keep each product connected to your public seller profile.", action: "Explore categories", href: "/marketplace" },
  { image: "/farmyn-journey-grains.jpg", label: "04 · GROW YOUR REACH", title: "Manage buying and selling from one professional account.", text: "Reply to enquiries, update stock, manage your listings, and request optional promotion whenever you want more visibility.", action: "Create one Farmyn account", href: "/register" },
];

export default function MarketplaceJourney() {
  const section = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const update = () => {
      if (!section.current) return;
      const start = section.current.offsetTop;
      const range = Math.max(1, section.current.offsetHeight - window.innerHeight);
      const progress = Math.max(0, Math.min(0.999, (window.scrollY - start) / range));
      setActive(Math.min(slides.length - 1, Math.floor(progress * slides.length)));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => { window.removeEventListener("scroll", update); window.removeEventListener("resize", update); };
  }, []);

  const go = (index: number) => {
    if (!section.current) return;
    const target = Math.max(0, Math.min(slides.length - 1, index));
    const range = section.current.offsetHeight - window.innerHeight;
    window.scrollTo({ top: section.current.offsetTop + (range * target) / (slides.length - 1), behavior: "smooth" });
  };
  const slide = slides[active];

  return <section ref={section} className="relative h-[400vh] border-y bg-[#f2f3eb]" aria-label="How Farmyn works">
    <div className="sticky top-0 flex min-h-[680px] h-screen items-center overflow-hidden py-12">
      <div className="container">
        <div className="mb-7 flex items-end justify-between gap-6"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">The Farmyn marketplace journey</p><h2 className="mt-2 max-w-2xl text-3xl font-bold sm:text-4xl">One account. Every side of the market.</h2></div><p className="font-display text-xl font-bold text-primary"><span className="text-3xl">0{active + 1}</span> / 04</p></div>
        <div className="grid items-center gap-8 lg:grid-cols-[1.15fr_.85fr] lg:gap-14">
          <div className="relative h-[42vh] min-h-[300px] overflow-hidden rounded-[1.75rem] bg-primary shadow-2xl sm:h-[50vh]">
            {slides.map((item, index) => <img key={item.image} src={item.image} alt="" className={`absolute inset-0 h-full w-full object-cover transition duration-700 ${index === active ? "scale-100 opacity-100" : "scale-105 opacity-0"}`} />)}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" /><p className="absolute bottom-6 left-6 rounded-full bg-white/15 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-white backdrop-blur">{slide.label}</p>
          </div>
          <div className="py-2"><p className="text-xs font-semibold uppercase tracking-widest text-primary">Step {active + 1}</p><h3 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">{slide.title}</h3><p className="mt-5 max-w-lg text-sm leading-7 text-muted-foreground">{slide.text}</p><Link href={slide.href} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary">{slide.action} <ArrowRight className="h-4 w-4" /></Link><div className="mt-8 flex items-center gap-3"><button onClick={() => go(active - 1)} disabled={active === 0} aria-label="Previous step" className="flex h-10 w-10 items-center justify-center rounded-full border bg-white disabled:opacity-30"><ArrowLeft className="h-4 w-4" /></button><div className="flex gap-2">{slides.map((_, index) => <button key={index} onClick={() => go(index)} aria-label={`Go to step ${index + 1}`} aria-current={index === active ? "step" : undefined} className={`h-2 rounded-full transition-all ${index === active ? "w-8 bg-primary" : "w-2 bg-primary/20"}`} />)}</div><button onClick={() => go(active + 1)} disabled={active === slides.length - 1} aria-label="Next step" className="flex h-10 w-10 items-center justify-center rounded-full border bg-white disabled:opacity-30"><ArrowRight className="h-4 w-4" /></button></div></div>
        </div>
        <div className="mt-7 flex items-center gap-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"><span>Scroll to explore</span><div className="h-0.5 flex-1 overflow-hidden bg-primary/10"><span className="block h-full bg-primary transition-all" style={{ width: `${((active + 1) / slides.length) * 100}%` }} /></div><span>Step 0{active + 1}</span></div>
      </div>
    </div>
  </section>;
}
