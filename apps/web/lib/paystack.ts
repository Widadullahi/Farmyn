import type { Order } from "./app-data";
import { api } from "./api";
const SESSION = "farmyn-checkout-key-v2";
export interface CheckoutRequest { items: { productId: string; quantity: number }[]; deliveryAddress: string; note: string }
export interface PaymentReceipt { reference: string; status: "pending" | "paid" | "review"; orders: Order[] }
export async function startCheckout(body: CheckoutRequest) {
  const fingerprint = JSON.stringify(body);
  let previous: { key: string; fingerprint: string } | null = null;
  try { previous = JSON.parse(sessionStorage.getItem(SESSION) || "null"); } catch { /* Replace invalid checkout state. */ }
  if (!previous || previous.fingerprint !== fingerprint) {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    previous = { key: Array.from(bytes, b => b.toString(16).padStart(2, "0")).join(""), fingerprint };
    sessionStorage.setItem(SESSION, JSON.stringify(previous));
  }
  const response = await fetch('/api/paystack/initialize', { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json", "x-checkout-key": previous.key }, body: JSON.stringify(body), signal: AbortSignal.timeout(25000) });
  const result = await response.json(); if (!response.ok) throw new Error(result.error || "Payment could not be started.");
  if (result.alreadyPaid) return { authorizationUrl: `/checkout/complete?reference=${encodeURIComponent(result.reference)}` };
  const url = new URL(result.authorizationUrl); if (url.protocol !== "https:" || url.hostname !== "checkout.paystack.com") throw new Error("Unexpected payment destination.");
  return { authorizationUrl: url.href };
}
export const verifyCheckout = (reference: string) => api<PaymentReceipt>(`/paystack/verify/${encodeURIComponent(reference)}`, undefined, "GET");
export const paymentHealth = () => api<{ mode: "test" | "unconfigured" }>("/paystack/health", undefined, "GET");
