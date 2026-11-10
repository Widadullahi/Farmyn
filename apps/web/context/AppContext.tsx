"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { allCategories, AppState, initialAppState, User } from "@/lib/app-data";
type Result = { ok: boolean; message: string; user?: User };
interface RegisterInput { name: string; email: string; phone: string; password: string; location: string; storeName?: string; referralCode?: string }
interface ProductInput { name: string; category: string; price: number; oldPrice?: number | null; stockCount: number; unit: string; minimumOrder: string; images: string[]; location: string; description: string }
interface AppContextValue extends AppState {
  currentUser: User | null; isHydrated: boolean; serviceError: string; categories: string[];
  registerUser: (input: RegisterInput) => Promise<Result>;
  confirmRegistration: (email: string, code: string) => Promise<Result>;
  login: (email: string, password: string) => Promise<Result>;
  logout: () => Promise<void>;
  addProduct: (input: ProductInput) => Promise<Result>;
  updateProduct: (id: string, input: Omit<ProductInput, "images"> & { images?: string[] }) => Promise<Result>;
  uploadPhoto: (file: File) => Promise<{ image: string; preview: string }>;
  updateSellerProfile: (patch: Partial<User>) => Promise<Result>;
  sendChatMessage: (id: string, message: string, productId?: string) => Promise<Result>;
}
const AppContext = createContext<AppContextValue | null>(null);
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(initialAppState);
  const [isHydrated, setHydrated] = useState(false);
  const [serviceError, setServiceError] = useState("");
  const requestId = useRef(0);
  const refresh = useCallback(async () => {
    const id = ++requestId.current;
    try { const next = await api<AppState>("/state", undefined, "GET"); if (id === requestId.current) { setState(next); setServiceError(""); } }
    catch (e) { if (id === requestId.current) { setServiceError(e instanceof Error ? e.message : "Farmyn is temporarily unavailable."); setState(initialAppState); } }
    finally { setHydrated(true); }
  }, []);
  useEffect(() => {
    // Retire the prototype store; it contained demo accounts and plaintext passwords.
    try { localStorage.removeItem("farmyn-local-mvp-v1"); } catch { /* Private browser storage may be unavailable. */ }
    void refresh();
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void refresh(); }, 20000);
    const focus = () => { void refresh(); }; window.addEventListener("focus", focus);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", focus); requestId.current++; };
  }, [refresh]);
  const currentUser = state.users.find(u => u.id === state.currentUserId) || null;
  const mutate = async (path: string, body?: unknown, method?: string): Promise<Result> => {
    try { const r = await api<{ message: string; user?: User }>(path, body, method); await refresh(); return { ok: true, ...r }; }
    catch (e) { return { ok: false, message: e instanceof Error ? e.message : "Please retry." }; }
  };
  const notify = async (path: string, body?: unknown, method?: string) => { const r = await mutate(path, body, method); if (r.ok) toast.success(r.message); else toast.error(r.message); };
  return <AppContext.Provider value={{ ...state, currentUser, isHydrated, serviceError, categories: [...allCategories],
    registerUser: input => mutate("/auth/register", input), confirmRegistration: (email, code) => mutate("/auth/confirm", { email, code }), login: (email, password) => mutate("/auth/login", { email, password }),
    logout: async () => { const r = await mutate("/auth/logout", {}); if (!r.ok) toast.error(r.message); },
    addProduct: input => mutate("/products", input), updateProduct: (id, input) => mutate(`/products/${encodeURIComponent(id)}`, input, "PATCH"), uploadPhoto: async file => {
      const intent = await api<{ image: string; preview: string; uploadUrl: string }>("/uploads", { contentType: file.type, size: file.size });
      const response = await fetch(intent.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file, signal: AbortSignal.timeout(60000) });
      if (!response.ok) throw new Error("The photo could not be uploaded. Please try again.");
      return { image: intent.image, preview: intent.preview };
    }, updateSellerProfile: patch => mutate("/profile", patch, "PATCH"),
    sendChatMessage: (receiverId, message, productId) => mutate("/messages", { receiverId, message, ...(productId ? { productId } : {}) })
  }}>
    {serviceError && <div role="status" className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-950">{serviceError}</div>}
    {children}
  </AppContext.Provider>;
}
export function useApp() { const value = useContext(AppContext); if (!value) throw new Error("AppProvider is missing."); return value; }
