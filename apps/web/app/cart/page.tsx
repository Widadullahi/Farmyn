"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Minus, Plus, ShieldCheck, ShoppingCart, Star, Truck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useApp } from "@/context/AppContext";
import { formatDate, formatNaira } from "@/lib/app-data";

export default function CartPage() {
  const {
    cart,
    products,
    currentUser,
    orders,
    updateCartQuantity,
    removeFromCart,
    checkout,
    markOrderCompleted,
    addReview,
  } = useApp();
  const [deliveryAddress, setDeliveryAddress] = useState(currentUser?.location || "");
  const [note, setNote] = useState("");
  const [paying, setPaying] = useState(false);
  useEffect(() => { setDeliveryAddress(currentUser?.location || ""); }, [currentUser?.id, currentUser?.location]);
  const [reviewRatings, setReviewRatings] = useState<Record<string, number>>({});
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  const cartItems = cart
    .map((item) => ({
      ...item,
      product: products.find((product) => product.id === item.productId),
    }))
    .filter((entry): entry is typeof entry & { product: NonNullable<typeof entry.product> } => Boolean(entry.product));

  const sellerSubtotals = new Map<string, number>();
  cartItems.forEach(entry => sellerSubtotals.set(entry.product.sellerId, (sellerSubtotals.get(entry.product.sellerId) || 0) + Math.round(entry.product.price * 100) * entry.quantity));
  const subtotal = [...sellerSubtotals.values()].reduce((sum, value) => sum + value, 0) / 100;
  const commission = [...sellerSubtotals.values()].reduce((sum, value) => sum + Math.round(value * 0.05), 0) / 100;
  const deliveryFee = sellerSubtotals.size * 2500;
  const total = subtotal + commission + deliveryFee;
  const buyerOrders = currentUser ? orders.filter((order) => order.buyerId === currentUser.id) : [];

  const handleCheckout = async () => {
    setPaying(true);
    try {
      const result = await checkout({ deliveryAddress, note });
      if (!result.ok || !result.authorizationUrl) { toast.error(result.message); return; }
      window.location.assign(result.authorizationUrl);
    } catch { toast.error("Could not open checkout. Your cart is still saved."); }
    finally { setPaying(false); }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-10">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground">Cart and order tracking</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Pay through Paystack. Orders are marked paid only after server verification; delivery and seller settlement are tracked separately.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.4fr,0.9fr]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <div className="mb-5 flex items-center gap-3">
                <ShoppingCart className="h-5 w-5 text-primary" />
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Current cart</h2>
                  <p className="text-sm text-muted-foreground">{cartItems.length} line items</p>
                </div>
              </div>

              {cartItems.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border py-14 text-center">
                  <p className="text-base font-medium text-foreground">Your cart is empty</p>
                  <p className="mt-1 text-sm text-muted-foreground">Add products from the marketplace to begin checkout.</p>
                  <Link href="/marketplace" className="mt-5 inline-block">
                    <Button className="gap-2">
                      Browse Marketplace <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map(({ product, quantity }) => (
                    <div key={product.id} className="rounded-2xl border border-border p-4">
                      <div className="flex flex-col gap-4 sm:flex-row">
                        <img src={product.image} alt={product.name} className="h-24 w-full rounded-xl object-cover sm:w-28" />
                        <div className="flex-1">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <h3 className="font-semibold text-foreground">{product.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {product.sellerName} • {product.location}
                              </p>
                              <p className="mt-1 text-sm text-primary">{formatNaira(product.price)} per {product.unit}</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => removeFromCart(product.id)}>
                              Remove
                            </Button>
                          </div>
                          <div className="mt-4 flex items-center justify-between">
                            <div className="inline-flex items-center rounded-full border border-border">
                              <button aria-label={`Decrease ${product.name} quantity`} className="px-3 py-2" onClick={() => updateCartQuantity(product.id, quantity - 1)}>
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="px-3 text-sm font-medium">{quantity}</span>
                              <button aria-label={`Increase ${product.name} quantity`} disabled={quantity >= product.stockCount} className="px-3 py-2 disabled:opacity-30" onClick={() => updateCartQuantity(product.id, quantity + 1)}>
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <span className="font-semibold text-foreground">
                              {formatNaira(product.price * quantity)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <div className="mb-5 flex items-center gap-3">
                <Truck className="h-5 w-5 text-primary" />
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Your orders</h2>
                  <p className="text-sm text-muted-foreground">Track confirmation, preparation, delivery, and payment status.</p>
                </div>
              </div>

              <div className="space-y-4">
                {buyerOrders.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No orders yet.</p>
                ) : (
                  buyerOrders.map((order) => (
                    <div key={order.id} className="rounded-2xl border border-border p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{order.id}</p>
                          <p className="text-sm text-muted-foreground">
                            {order.sellerName} • {formatDate(order.createdAt)}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
                            {order.status}
                          </span>
                          <span className="rounded-full bg-secondary/15 px-3 py-1 text-xs font-medium text-secondary">
                            {order.paymentStatus}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 space-y-3">
                        {order.items.map((item) => (
                          <Fragment key={`${order.id}-${item.productId}`}>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                {item.name} x {item.quantity}
                              </span>
                              <span className="font-medium text-foreground">{formatNaira(item.unitPrice * item.quantity)}</span>
                            </div>
                            {(order.status === "Delivered" || order.status === "Completed") && (
                              <div className="rounded-xl bg-muted/50 p-3">
                                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                  <Star className="h-4 w-4 text-secondary" />
                                  Leave a review for {item.name}
                                </div>
                                <div className="mt-3 grid gap-3 sm:grid-cols-[140px,1fr,auto]">
                                  <select
                                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                                    value={reviewRatings[item.productId] || 5}
                                    onChange={(event) =>
                                      setReviewRatings((prev) => ({
                                        ...prev,
                                        [item.productId]: Number(event.target.value),
                                      }))
                                    }
                                  >
                                    {[5, 4, 3, 2, 1].map((rating) => (
                                      <option key={rating} value={rating}>{rating} stars</option>
                                    ))}
                                  </select>
                                  <Input
                                    placeholder="Share your delivery and quality experience"
                                    value={reviewNotes[item.productId] || ""}
                                    onChange={(event) =>
                                      setReviewNotes((prev) => ({
                                        ...prev,
                                        [item.productId]: event.target.value,
                                      }))
                                    }
                                  />
                                  <Button
                                    variant="outline"
                                    onClick={async () => {
                                      const result = await addReview(
                                        item.productId,
                                        reviewRatings[item.productId] || 5,
                                        reviewNotes[item.productId] || "",
                                      );

                                      if (!result.ok) {
                                        toast.error(result.message);
                                        return;
                                      }

                                      toast.success(result.message);
                                      setReviewNotes((prev) => ({ ...prev, [item.productId]: "" }));
                                    }}
                                  >
                                    Submit review
                                  </Button>
                                </div>
                              </div>
                            )}
                          </Fragment>
                        ))}
                      </div>
                      <div className="mt-4 rounded-xl bg-muted/50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Latest event</p>
                        <p className="mt-1 text-sm text-foreground">{order.timeline[0]?.label}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(order.timeline[0]?.date || order.createdAt)}</p>
                      </div>
                      {order.status === "Delivered" && order.paymentStatus === "Paid" && (
                        <Button className="mt-4" onClick={() => markOrderCompleted(order.id)}>
                          Confirm delivery
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
                <ShieldCheck className="h-3.5 w-3.5" />
                Order summary
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium text-foreground">{formatNaira(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Platform commission (5%)</span>
                  <span className="font-medium text-foreground">{formatNaira(commission)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Delivery (₦2,500 per seller)</span>
                  <span className="font-medium text-foreground">{formatNaira(deliveryFee)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-3 text-base">
                  <span className="font-semibold text-foreground">Estimated total</span>
                  <span className="font-display text-xl font-bold text-primary">{formatNaira(total)}</span>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <Input
                  placeholder="Delivery address"
                  value={deliveryAddress}
                  onChange={(event) => setDeliveryAddress(event.target.value)}
                />
                <Textarea
                  placeholder="Delivery notes, landmarks, or buyer instructions"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
                <Button className="w-full gap-2" disabled={cartItems.length === 0 || paying} onClick={handleCheckout}>
                  {paying ? "Opening Paystack…" : "Pay with Paystack"} <ArrowRight className="h-4 w-4" />
                </Button>
                <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
                  You will complete payment on Paystack. The server checks prices and stock before checkout. Test mode only; no funds are held in escrow.
                </p>
              </div>
            </div>

            {!currentUser && (
              <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                <p className="text-sm text-muted-foreground">
                  You are currently signed out. Create an account or log in to check out.
                </p>
                <div className="mt-4 flex gap-3">
                  <Link href="/login">
                    <Button variant="outline">Login</Button>
                  </Link>
                  <Link href="/register">
                    <Button>Create Account</Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
