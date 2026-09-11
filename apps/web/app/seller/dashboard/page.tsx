"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowUpRight, Megaphone, Package, Plus, ShieldCheck, ShoppingCart, TrendingUp, MessageSquare, MapPin, User, Send } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "@/context/AppContext";
import { formatDate, formatNaira, marketplaceCategories } from "@/lib/app-data";

export default function SellerDashboardPage() {
  const {
    currentUser,
    products,
    orders,
    bulkRequests,
    adRequests,
    chatMessages,
    users,
    addProduct,
    updateSellerProfile,
    advanceOrderStatus,
    createAdRequest,
    sendChatMessage,
  } = useApp();

  const [activeTab, setActiveTab] = useState<"overview" | "inventory" | "orders" | "ads" | "chat" | "profile">("overview");

  // Store Profile form state
  const [storeName, setStoreName] = useState(currentUser?.storeName || "");
  const [location, setLocation] = useState(currentUser?.location || "");
  const [bio, setBio] = useState(currentUser?.bio || "");

  // Add Product form state
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState(marketplaceCategories[0]);
  const [price, setPrice] = useState("0");
  const [stockCount, setStockCount] = useState("0");
  const [unit, setUnit] = useState("basket");
  const [minimumOrder, setMinimumOrder] = useState("1 basket");
  const [image, setImage] = useState("https://images.pexels.com/photos/17674119/pexels-photo-17674119.jpeg?cs=srgb&dl=pexels-gulsahaydgn-17674119.jpeg&fm=jpg");
  const [description, setDescription] = useState("");

  // Ads form state
  const [adType, setAdType] = useState<"Homepage Banner" | "Sidebar Ad" | "Featured Listing">("Featured Listing");
  const [adTitle, setAdTitle] = useState("");
  const [adBudget, setAdBudget] = useState("0");

  // Dashboard Embedded Chat state
  const [activeChatUserId, setActiveChatUserId] = useState<string | null>(null);
  const [chatInputText, setChatInputText] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, activeChatUserId]);

  if (!currentUser || currentUser.role !== "seller") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20">
          <div className="mx-auto max-w-2xl rounded-3xl border border-border bg-card p-8 text-center shadow-card">
            <h1 className="font-display text-3xl font-bold text-foreground">Seller dashboard</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              This area is for sellers. Log in with the demo seller account or create a seller account to manage listings, orders, bulk opportunities, and advert requests.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link href="/login">
                <Button variant="outline">Login</Button>
              </Link>
              <Link href="/register">
                <Button>Create seller account</Button>
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const sellerProducts = products.filter((product) => product.sellerId === currentUser.id);
  const sellerOrders = orders.filter((order) => order.sellerId === currentUser.id);
  const sellerAdRequests = adRequests.filter((request) => request.sellerId === currentUser.id);
  const totalSales = sellerOrders.reduce((sum, order) => sum + order.subtotal, 0);
  const avgTicket = sellerOrders.length ? totalSales / sellerOrders.length : 0;

  const priceInsights = sellerProducts.map((product) => ({
    id: product.id,
    name: product.name,
    currentPrice: product.price,
    suggestedMin: Math.round(product.price * 0.95),
    suggestedMax: Math.round(product.price * 1.08),
  }));

  const saveProfile = () => {
    updateSellerProfile({
      storeName,
      location,
      bio,
    });
  };

  const handleAddProduct = () => {
    const result = addProduct({
      name: productName,
      category,
      price: Number(price),
      stockCount: Number(stockCount),
      unit,
      minimumOrder,
      image,
      location,
      description,
    });

    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    setProductName("");
    setPrice("0");
    setStockCount("0");
    setUnit("basket");
    setMinimumOrder("1 basket");
    setDescription("");
  };

  const handleAdRequest = () => {
    const result = createAdRequest(adType, adTitle, Number(adBudget));
    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    setAdTitle("");
    setAdBudget("0");
  };

  const handleSendDashboardMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInputText.trim() || !activeChatUserId) return;

    sendChatMessage(activeChatUserId, chatInputText.trim());
    setChatInputText("");
  };

  // Dashboard chat helper variables
  const myMessages = chatMessages.filter(
    (msg) => msg.senderId === currentUser.id || msg.receiverId === currentUser.id,
  );
  const activeChatPartnerIds = Array.from(
    new Set(
      myMessages.map((msg) =>
        msg.senderId === currentUser.id ? msg.receiverId : msg.senderId,
      ),
    ),
  );
  const chatPartners = activeChatPartnerIds
    .map((partnerId) => users.find((u) => u.id === partnerId))
    .filter((u): u is typeof users[number] => Boolean(u));

  const currentChatPartner = users.find((u) => u.id === activeChatUserId);
  const activeChatConversation = myMessages.filter(
    (msg) =>
      (msg.senderId === currentUser.id && msg.receiverId === activeChatUserId) ||
      (msg.senderId === activeChatUserId && msg.receiverId === currentUser.id),
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container py-8">
        {/* Store Info (simplified header, colorful top bar) */}
        <div className="mb-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">
                {currentUser.storeName || currentUser.name}
              </h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1 font-semibold">
                <MapPin className="h-3.5 w-3.5 text-primary" /> {currentUser.location}
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/marketplace">
                <Button variant="outline" className="gap-1.5">
                  Explore Market <ArrowUpRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Colorful Tab Navigation links */}
        <div className="flex flex-wrap gap-1 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 p-2 rounded-xl mb-8">
          {[
            { id: "overview", label: "Overview", icon: TrendingUp },
            { id: "inventory", label: "Inventory", icon: Package },
            { id: "orders", label: "Orders & Escrow", icon: ShoppingCart },
            { id: "ads", label: "Marketing & Ads", icon: Megaphone },
            { id: "chat", label: "Direct Messages", icon: MessageSquare },
            { id: "profile", label: "Store Profile", icon: User },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold transition-all rounded-lg ${
                  isSelected
                    ? "bg-white/80 dark:bg-card text-primary shadow-subtle"
                    : "text-muted-foreground hover:bg-white/50 dark:hover:bg-card/50"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content window */}
        <div className="space-y-8">
          {/* 1. OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div className="grid gap-6">
              {/* Stats panel grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Subtotal Sold", value: formatNaira(totalSales), icon: TrendingUp },
                  { label: "Active Products", value: sellerProducts.length.toString(), icon: Package },
                  { label: "Orders", value: sellerOrders.length.toString(), icon: ShoppingCart },
                  { label: "Average Ticket", value: formatNaira(avgTicket), icon: Megaphone },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-border bg-card p-5 shadow-card hover:shadow-elevated transition-shadow duration-300">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{stat.label}</span>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
                        <stat.icon className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                    <p className="mt-4 font-display text-2xl font-bold text-card-foreground">{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-6 lg:grid-cols-12">
                {/* CSS Bar Chart performance - Monthly */}
                <div className="lg:col-span-7 rounded-2xl border border-border bg-card p-6 shadow-card flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Monthly Revenue Trend</h3>
                    <p className="text-xs text-muted-foreground">Gross sales over the last 6 months</p>
                  </div>
                  <div className="flex items-end justify-between h-52 pt-6 gap-3">
                    {[
                      { month: "Jan", sales: 25000, height: "h-[25%]", amount: "₦25k" },
                      { month: "Feb", sales: 42000, height: "h-[42%]", amount: "₦42k" },
                      { month: "Mar", sales: 35000, height: "h-[35%]", amount: "₦35k" },
                      { month: "Apr", sales: 68000, height: "h-[68%]", amount: "₦68k" },
                      { month: "May", sales: 58000, height: "h-[58%]", amount: "₦58k" },
                      { month: "Jun", sales: 115000, height: "h-[100%]", amount: "₦115k" },
                    ].map((bar) => (
                      <div key={bar.month} className="flex-1 flex flex-col items-center gap-2 group">
                        <div className="relative w-full flex justify-center items-end h-36">
                          <div className="absolute bottom-[105%] bg-primary text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md">
                            {bar.amount}
                          </div>
                          <div className={`w-full max-w-[32px] rounded-t-lg bg-gradient-to-t from-primary via-primary/90 to-secondary ${bar.height} transition-all duration-500 group-hover:from-secondary group-hover:to-primary shadow-subtle`} />
                        </div>
                        <span className="text-xs font-bold text-muted-foreground uppercase">{bar.month}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Price insights sidebar */}
                <div className="lg:col-span-5 rounded-2xl border border-border bg-card p-6 shadow-card">
                  <h3 className="text-lg font-bold text-foreground">Market Price Guidance</h3>
                  <p className="text-xs text-muted-foreground mt-1">Suggested pricing based on current marketplace demand.</p>
                  <div className="mt-5 space-y-3 max-h-[15rem] overflow-y-auto pr-1">
                    {priceInsights.length === 0 ? (
                      <p className="text-sm text-muted-foreground">List products to see pricing suggestions.</p>
                    ) : (
                      priceInsights.map((insight) => (
                        <div key={insight.id} className="rounded-xl border border-border p-3 flex items-center justify-between text-sm">
                          <div>
                            <p className="font-semibold text-foreground">{insight.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Current: {formatNaira(insight.currentPrice)}</p>
                          </div>
                          <p className="font-bold text-primary text-xs bg-accent/40 rounded px-2 py-1">
                            {formatNaira(insight.suggestedMin)} - {formatNaira(insight.suggestedMax)}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. INVENTORY TAB */}
          {activeTab === "inventory" && (
            <div className="grid gap-6 lg:grid-cols-12">
              {/* Product Listing Form */}
              <div className="lg:col-span-5 rounded-2xl border border-border bg-card p-6 shadow-card self-start">
                <h2 className="text-lg font-bold text-foreground">Add New Product</h2>
                <p className="text-xs text-muted-foreground mt-1">List produce, poultry, grains, or ingredients directly to the marketplace.</p>
                <div className="mt-5 grid gap-3 text-sm">
                  <Input placeholder="Product name" value={productName} onChange={(event) => setProductName(event.target.value)} />
                  <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={category} onChange={(event) => setCategory(event.target.value)}>
                    {marketplaceCategories.map((entry) => (
                      <option key={entry} value={entry}>{entry}</option>
                    ))}
                  </select>
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Price (NGN)" type="number" value={price} onChange={(event) => setPrice(event.target.value)} />
                    <Input placeholder="Stock count" type="number" value={stockCount} onChange={(event) => setStockCount(event.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Unit (e.g. basket)" value={unit} onChange={(event) => setUnit(event.target.value)} />
                    <Input placeholder="Min order (e.g. 1 basket)" value={minimumOrder} onChange={(event) => setMinimumOrder(event.target.value)} />
                  </div>
                  <Input placeholder="Image URL" value={image} onChange={(event) => setImage(event.target.value)} />
                  <Textarea placeholder="Detailed product description..." value={description} onChange={(event) => setDescription(event.target.value)} />
                  <Button className="mt-2 gap-2 bg-primary hover:bg-primary/90" onClick={handleAddProduct}>
                    <Plus className="h-4 w-4" /> Add Product
                  </Button>
                </div>
              </div>

              {/* Product List table */}
              <div className="lg:col-span-7 rounded-2xl border border-border bg-card p-6 shadow-card">
                <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-foreground">My Listings</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Manage stock levels and marketplace visibility</p>
                  </div>
                  <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
                    {sellerProducts.length} Listings
                  </span>
                </div>
                <div className="space-y-3 max-h-[30rem] overflow-y-auto pr-1">
                  {sellerProducts.length === 0 ? (
                    <div className="py-12 text-center text-sm text-muted-foreground">
                      No products listed yet. Use the form to list your first item!
                    </div>
                  ) : (
                    sellerProducts.map((product) => (
                      <div key={product.id} className="rounded-xl border border-border p-4 flex items-center justify-between gap-4 bg-muted/10 hover:bg-muted/20 transition-colors">
                        <div className="flex items-center gap-3">
                          <img src={product.image} alt={product.name} className="h-12 w-12 rounded-lg object-cover bg-muted" />
                          <div>
                            <h4 className="font-bold text-foreground text-sm">{product.name}</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {product.category} • {product.stockCount} {product.unit} in stock
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary text-sm">{formatNaira(product.price)}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Min: {product.minimumOrder}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 3. ORDERS TAB */}
          {activeTab === "orders" && (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <div className="border-b border-border pb-4 mb-4">
                <h2 className="text-lg font-bold text-foreground">Escrow Protected Orders</h2>
                <p className="text-xs text-muted-foreground mt-1">Manage buyer orders. Payments are securely held in escrow until delivery is marked successful.</p>
              </div>
              <div className="space-y-4 max-h-[32rem] overflow-y-auto pr-1">
                {sellerOrders.length === 0 ? (
                  <div className="py-12 text-center text-sm text-muted-foreground">
                    No buyer orders received yet.
                  </div>
                ) : (
                  sellerOrders.map((order) => (
                    <div key={order.id} className="rounded-xl border border-border p-5 bg-muted/10 hover:border-border/80 transition-colors">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-foreground">{order.id}</span>
                            <span className="text-xs text-muted-foreground">• {formatDate(order.createdAt)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 font-semibold">
                            Customer: {order.buyerName} | Delivery to: {order.deliveryAddress}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-accent/60 px-3 py-1 text-[10px] font-semibold text-accent-foreground">
                            {order.status}
                          </span>
                          <span className="rounded-full bg-secondary/15 px-3 py-1 text-[10px] font-semibold text-secondary">
                            {order.paymentStatus}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 border-y border-border/40 py-3 space-y-2 text-xs text-muted-foreground bg-card/40 rounded-xl px-4">
                        {order.items.map((item) => (
                          <div key={`${order.id}-${item.productId}`} className="flex items-center justify-between">
                            <span>{item.name} <strong className="text-foreground">x {item.quantity}</strong></span>
                            <span className="font-semibold text-foreground">{formatNaira(item.unitPrice * item.quantity)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <p className="text-sm font-bold text-foreground">Order Subtotal: {formatNaira(order.subtotal)}</p>
                        {order.status !== "Completed" && (
                          <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={() => advanceOrderStatus(order.id)}>
                            Advance Status
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 4. ADS TAB */}
          {activeTab === "ads" && (
            <div className="grid gap-6 lg:grid-cols-12">
              <div className="lg:col-span-5 rounded-2xl border border-border bg-card p-6 shadow-card self-start">
                <h2 className="text-lg font-bold text-foreground">Promote Store Listings</h2>
                <p className="text-xs text-muted-foreground mt-1">Increase your visibility and reach more buyers across the platform.</p>
                <div className="mt-5 grid gap-4 text-sm">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-muted-foreground">Placement Type</label>
                    <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={adType} onChange={(event) => setAdType(event.target.value as typeof adType)}>
                      <option>Featured Listing</option>
                      <option>Homepage Banner</option>
                      <option>Sidebar Ad</option>
                    </select>
                  </div>
                  <Input placeholder="Campaign title (e.g. Mango Season Promo)" value={adTitle} onChange={(event) => setAdTitle(event.target.value)} />
                  <Input placeholder="Ad Budget (NGN)" type="number" value={adBudget} onChange={(event) => setAdBudget(event.target.value)} />
                  <Button className="mt-2 bg-primary hover:bg-primary/90" onClick={handleAdRequest}>Submit Ad Campaign</Button>
                </div>
              </div>

              <div className="lg:col-span-7 rounded-2xl border border-border bg-card p-6 shadow-card">
                <h2 className="text-lg font-bold text-foreground border-b border-border pb-4 mb-4">Ad Campaigns & Placement History</h2>
                <div className="space-y-3 max-h-[30rem] overflow-y-auto pr-1">
                  {sellerAdRequests.length === 0 ? (
                    <div className="py-12 text-center text-sm text-muted-foreground">
                      No ad campaign requests submitted yet.
                    </div>
                  ) : (
                    sellerAdRequests.map((request) => (
                      <div key={request.id} className="rounded-xl border border-border p-4 flex items-center justify-between gap-4 bg-muted/10">
                        <div>
                          <p className="font-bold text-foreground text-sm">{request.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{request.type} • {formatDate(request.createdAt)}</p>
                        </div>
                        <div className="text-right">
                          <span className="rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-semibold text-accent-foreground">
                            {request.status}
                          </span>
                          <p className="font-bold text-primary text-xs mt-1.5">{formatNaira(request.budget)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 5. DIRECT MESSAGES TAB (INTEGRATION) */}
          {activeTab === "chat" && (
            <div className="border border-border bg-card rounded-2xl flex flex-col md:flex-row h-[500px] overflow-hidden shadow-card">
              {/* Inbox list */}
              <div className="w-full md:w-64 border-r border-border flex flex-col">
                <div className="p-4 border-b border-border bg-muted/10">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Buyer Conversations</h3>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-border/40">
                  {chatPartners.length === 0 ? (
                    <p className="p-4 text-center text-xs text-muted-foreground">No customer chats yet.</p>
                  ) : (
                    chatPartners.map((partner) => (
                      <button
                        key={partner.id}
                        onClick={() => setActiveChatUserId(partner.id)}
                        className={`w-full text-left p-3.5 flex items-center gap-2.5 transition-colors ${
                          activeChatUserId === partner.id ? "bg-accent/60" : "hover:bg-muted/30"
                        }`}
                      >
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                          {partner.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-foreground truncate">{partner.name}</h4>
                          <p className="text-[10px] text-muted-foreground truncate">Customer</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Message viewport */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {currentChatPartner ? (
                  <>
                    <div className="p-3 border-b border-border bg-muted/20 flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                        {currentChatPartner.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-xs font-bold text-foreground">{currentChatPartner.name}</span>
                    </div>

                    <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-muted/5">
                      {activeChatConversation.map((msg) => {
                        const isMe = msg.senderId === currentUser.id;
                        return (
                          <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[75%] rounded-xl px-3 py-2 text-xs shadow-subtle ${
                              isMe
                                ? "bg-primary text-primary-foreground rounded-tr-none"
                                : "bg-card border border-border text-foreground rounded-tl-none"
                            }`}>
                              <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                              <span className="block text-[8px] mt-1 text-right opacity-60">
                                {formatDate(msg.createdAt)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={chatEndRef} />
                    </div>

                    <form onSubmit={handleSendDashboardMessage} className="p-3 border-t border-border flex gap-2 bg-card">
                      <Input
                        placeholder="Type reply..."
                        value={chatInputText}
                        onChange={(e) => setChatInputText(e.target.value)}
                        className="flex-1 h-9 text-xs"
                      />
                      <Button type="submit" size="icon" className="h-9 w-9 bg-primary hover:bg-primary/90 shrink-0">
                        <Send className="h-3.5 w-3.5" />
                      </Button>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <MessageSquare className="h-10 w-10 text-muted-foreground/60 mb-2 animate-pulse" />
                    <p className="text-xs text-muted-foreground">Select a customer thread to view details and reply.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 6. PROFILE TAB */}
          {activeTab === "profile" && (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card max-w-2xl">
              <h2 className="text-lg font-bold text-foreground">Edit Store Profile</h2>
              <p className="text-xs text-muted-foreground mt-1">Transparent profiles help you build trust with buyers.</p>
              <div className="mt-5 grid gap-4 text-sm">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground">Store Display Name</label>
                  <Input placeholder="Store name" value={storeName} onChange={(event) => setStoreName(event.target.value)} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground">Farming Location</label>
                  <Input placeholder="Location" value={location} onChange={(event) => setLocation(event.target.value)} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground">Store Description / Biography</label>
                  <Textarea placeholder="Store bio" value={bio} onChange={(event) => setBio(event.target.value)} />
                </div>
                <Button className="bg-primary hover:bg-primary/90 self-start" onClick={saveProfile}>Save Changes</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
