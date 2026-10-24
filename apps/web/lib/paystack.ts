import type { Order } from "./app-data";

const BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001").replace(/\/$/, "");
const SESSION_KEY = "farmyn-paystack-checkout";
export interface CheckoutRequest {
  customer: { id: string; name: string; email: string };
  items: { productId: string; quantity: number }[];
  deliveryAddress: string;
  note: string;
}
interface Session { token: string; buyerId: string; fingerprint: string; reference?: string }
export interface PaymentReceipt { reference: string; status: "pending" | "paid"; orders: Order[]; gatewayStatus?: string }
async function request<T>(path: string, token: string, body?: unknown): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    method: body ? "POST" : "GET", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(20000), cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "The payment request failed. Please retry.");
  return data as T;
}
export async function startCheckout(body: CheckoutRequest) {
  const fingerprint = JSON.stringify(body);
  let session: Session | null = null;
  try { session = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null"); } catch { /* Start a new session for malformed state. */ }
  if (!session || session.buyerId !== body.customer.id || session.fingerprint !== fingerprint) {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    session = { token: Array.from(bytes, b => b.toString(16).padStart(2, "0")).join(""), buyerId: body.customer.id, fingerprint };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
  const result = await request<{ reference: string; authorizationUrl?: string; alreadyPaid?: boolean }>("/api/paystack/initialize", session.token, body);
  session.reference = result.reference;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  if (result.alreadyPaid) return { authorizationUrl: `/checkout/complete?reference=${encodeURIComponent(result.reference)}` };
  const url = new URL(result.authorizationUrl || "");
  if (url.protocol !== "https:" || url.hostname !== "checkout.paystack.com") throw new Error("Unexpected payment destination.");
  return { authorizationUrl: url.href };
}
export async function verifyCheckout(reference: string, buyerId: string) {
  let session: Session | null;
  try { session = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null"); } catch { session = null; }
  if (!session || session.buyerId !== buyerId || session.reference !== reference) throw new Error("This payment belongs to another browser session. Sign in with the account that started checkout.");
  return request<PaymentReceipt>(`/api/paystack/verify/${encodeURIComponent(reference)}`, session.token);
}
export async function paymentHealth(): Promise<{ mode: "test" | "unconfigured" }> {
  const response = await fetch(`${BASE}/api/paystack/health`, { signal: AbortSignal.timeout(5000), cache: "no-store" });
  if (!response.ok) throw new Error("Payments unavailable");
  return response.json();
}
