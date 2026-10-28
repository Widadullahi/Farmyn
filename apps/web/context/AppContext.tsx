"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { startCheckout, verifyCheckout } from "@/lib/paystack";
import { allCategories, AppState, BulkRequest, initialAppState, User, UserRole } from "@/lib/app-data";
type Result = { ok: boolean; message: string; user?: User; authorizationUrl?: string };
interface RegisterInput { role: UserRole; name: string; email: string; phone: string; password: string; location: string; storeName?: string }
interface ProductInput { name: string; category: string; price: number; oldPrice?: number | null; stockCount: number; unit: string; minimumOrder: string; image: string; location: string; description: string }
interface AppContextValue extends AppState {
  currentUser: User | null; isHydrated: boolean; serviceError: string; categories: string[]; cartCount: number;
  registerUser: (input: RegisterInput) => Promise<Result>;
  confirmRegistration: (email: string, code: string) => Promise<Result>;
  login: (email: string, password: string) => Promise<Result>;
  logout: () => Promise<void>;
  addToCart: (id: string) => void; updateCartQuantity: (id: string, quantity: number) => void; removeFromCart: (id: string) => void; clearCart: () => void;
  checkout: (input: { deliveryAddress: string; note?: string }) => Promise<Result>;
  confirmPayment: (reference: string) => Promise<Result>;
  addProduct: (input: ProductInput) => Promise<Result>;
  updateProduct: (id: string, input: Omit<ProductInput, "image"> & { image?: string }) => Promise<Result>;
  uploadPhoto: (file: File) => Promise<{ image: string; preview: string }>;
  updateSellerProfile: (patch: Partial<User>) => Promise<void>;
  advanceOrderStatus: (id: string) => Promise<void>; markOrderCompleted: (id: string) => Promise<void>;
  addReview: (id: string, rating: number, comment: string) => Promise<Result>;
  createBulkRequest: (input: Omit<BulkRequest, "id" | "buyerId" | "buyerName" | "status" | "createdAt">) => Promise<Result>;
  createAdRequest: (type: "Homepage Banner" | "Sidebar Ad" | "Featured Listing", title: string, budget: number) => Promise<Result>;
  sendChatMessage: (id: string, message: string) => Promise<Result>;
}
const CART_KEY = "farmyn-cart-v2";
const AppContext = createContext<AppContextValue | null>(null);
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(initialAppState);
  const [isHydrated, setHydrated] = useState(false);
  const [serviceError, setServiceError] = useState("");
  const requestId = useRef(0);
  const refresh = useCallback(async () => {
    const id = ++requestId.current;
    try { const next = await api<AppState>("/state", undefined, "GET"); if (id === requestId.current) { setState(prev => ({ ...next, cart: prev.cart })); setServiceError(""); } }
    catch (e) { if (id === requestId.current) { setServiceError(e instanceof Error ? e.message : "Farmyn is temporarily unavailable."); setState(prev => ({ ...initialAppState, cart: prev.cart })); } }
    finally { setHydrated(true); }
  }, []);
  useEffect(() => {
    // Retire the prototype store; it contained demo accounts and plaintext passwords.
    try { localStorage.removeItem("farmyn-local-mvp-v1"); } catch { /* Private browser storage may be unavailable. */ }
    try { const cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]"); if (Array.isArray(cart) && cart.every(x => typeof x.productId === "string" && Number.isSafeInteger(x.quantity) && x.quantity > 0 && x.quantity <= 100)) setState(p => ({ ...p, cart })); } catch { /* Ignore invalid guest carts. */ }
    void refresh();
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void refresh(); }, 20000);
    const focus = () => { void refresh(); }; window.addEventListener("focus", focus);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", focus); requestId.current++; };
  }, [refresh]);
  useEffect(() => { if (isHydrated) { try { localStorage.setItem(CART_KEY, JSON.stringify(state.cart)); } catch { /* Server records remain safe when guest storage is unavailable. */ } } }, [state.cart, isHydrated]);
  const currentUser = state.users.find(u => u.id === state.currentUserId) || null;
  const mutate = async (path: string, body?: unknown, method?: string): Promise<Result> => {
    try { const r = await api<{ message: string; user?: User }>(path, body, method); await refresh(); return { ok: true, ...r }; }
    catch (e) { return { ok: false, message: e instanceof Error ? e.message : "Please retry." }; }
  };
  const notify = async (path: string, body?: unknown, method?: string) => { const r = await mutate(path, body, method); if (r.ok) toast.success(r.message); else toast.error(r.message); };
  const updateCartQuantity = (id: string, quantity: number) => {
    const product = state.products.find(p => p.id === id);
    if (!Number.isSafeInteger(quantity) || quantity < 0) return;
    setState(prev => ({ ...prev, cart: quantity === 0 ? prev.cart.filter(p => p.productId !== id) : product ? prev.cart.map(p => p.productId === id ? { ...p, quantity: Math.min(quantity, product.stockCount, 100) } : p).filter(p => p.quantity > 0) : prev.cart }));
  };
  const addToCart = (id: string) => {
    const product = state.products.find(p => p.id === id); if (!product || product.stockCount < 1) { toast.error("This product is out of stock."); return; }
    setState(prev => { const item = prev.cart.find(p => p.productId === id); return { ...prev, cart: item ? prev.cart.map(p => p.productId === id ? { ...p, quantity: Math.min(p.quantity + 1, product.stockCount, 100) } : p) : [...prev.cart, { productId: id, quantity: 1 }] }; }); toast.success("Added to cart.");
  };
  const checkout = async (input: { deliveryAddress: string; note?: string }): Promise<Result> => {
    if (!currentUser || currentUser.role !== "buyer") return { ok: false, message: "Sign in as a buyer to check out." };
    try { const result = await startCheckout({ items: state.cart, deliveryAddress: input.deliveryAddress, note: input.note || "" }); return { ok: true, message: "Opening Paystack…", ...result }; }
    catch (e) { return { ok: false, message: e instanceof Error ? e.message : "Checkout is unavailable." }; }
  };
  const confirmPayment = async (reference: string): Promise<Result> => {
    if (!currentUser || !/^farmyn_[a-f0-9]{32}$/.test(reference)) return { ok: false, message: "Sign in to verify this payment." };
    const receipt = await verifyCheckout(reference);
    if (receipt.status === "review") return { ok: false, message: "Payment was received, but availability changed. Your payment is recorded for support review. Do not pay again. Keep your payment reference." };
    if (receipt.status !== "paid") return { ok: false, message: "Payment has not been confirmed. Your cart is still saved." };
    if (!receipt.orders.length || receipt.orders.some(o => o.buyerId !== currentUser.id || o.paymentStatus !== "Paid" || o.paymentReference !== reference)) throw new Error("The payment does not match your account.");
    const marker = `farmyn-receipt-${reference}`;
    if (!localStorage.getItem(marker)) {
      const quantities = new Map<string, number>(); receipt.orders.forEach(o => o.items.forEach(i => quantities.set(i.productId, (quantities.get(i.productId) || 0) + i.quantity)));
      setState(prev => ({ ...prev, cart: prev.cart.map(i => ({ ...i, quantity: Math.max(0, i.quantity - (quantities.get(i.productId) || 0)) })).filter(i => i.quantity > 0) }));
      localStorage.setItem(marker, "confirmed");
    }
    await refresh(); return { ok: true, message: "Paystack verified your test payment. Your order is saved and awaiting seller confirmation." };
  };
  return <AppContext.Provider value={{ ...state, currentUser, isHydrated, serviceError, categories: [...allCategories], cartCount: state.cart.reduce((n, p) => n + p.quantity, 0),
    registerUser: input => mutate("/auth/register", input), confirmRegistration: (email, code) => mutate("/auth/confirm", { email, code }), login: (email, password) => mutate("/auth/login", { email, password }),
    logout: async () => { const r = await mutate("/auth/logout", {}); if (!r.ok) toast.error(r.message); else sessionStorage.removeItem("farmyn-checkout-key-v2"); },
    addToCart, updateCartQuantity, removeFromCart: id => updateCartQuantity(id, 0), clearCart: () => setState(p => ({ ...p, cart: [] })), checkout, confirmPayment,
    addProduct: input => mutate("/products", input), updateProduct: (id, input) => mutate(`/products/${encodeURIComponent(id)}`, input, "PATCH"), uploadPhoto: file => api("/uploads", file), updateSellerProfile: patch => notify("/profile", patch, "PATCH"),
    advanceOrderStatus: id => notify(`/orders/${encodeURIComponent(id)}/advance`, {}), markOrderCompleted: id => notify(`/orders/${encodeURIComponent(id)}/advance`, {}),
    addReview: (productId, rating, comment) => mutate("/reviews", { productId, rating, comment }), createBulkRequest: input => mutate("/bulk", input),
    createAdRequest: (type, title, budget) => mutate("/ads", { type, title, budget }), sendChatMessage: (receiverId, message) => mutate("/messages", { receiverId, message })
  }}>
    {serviceError && <div role="status" className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-950">{serviceError}</div>}
    {children}
  </AppContext.Provider>;
}
export function useApp() { const value = useContext(AppContext); if (!value) throw new Error("AppProvider is missing."); return value; }
