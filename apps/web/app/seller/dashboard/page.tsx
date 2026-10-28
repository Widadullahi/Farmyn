"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import DashboardOverview from "@/components/DashboardOverview";
import { ArrowUpRight, Megaphone, Menu, Package, PanelLeftOpen, Pencil, PiggyBank, Plus, ShieldCheck, ShoppingCart, TrendingUp, MessageSquare, MapPin, User, Send, X } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { PaymentStatusBadge } from "@/components/PaymentStatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "@/context/AppContext";
import { formatDate, formatNaira, marketplaceCategories, Product } from "@/lib/app-data";

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
    updateProduct,
    uploadPhoto,
    updateSellerProfile,
    advanceOrderStatus,
    createAdRequest,
    sendChatMessage,
    logout,
  } = useApp();

  const [activeTab, setActiveTab] = useState<"overview" | "inventory" | "orders" | "ads" | "chat" | "profile">("overview");
  const [mobileOpen, setMobileOpen] = useState(false);

  const NAV_ITEMS = [
    { id: "overview", label: "Overview", icon: TrendingUp },
    { id: "inventory", label: "Inventory", icon: Package },
    { id: "orders", label: "Orders & Payments", icon: ShoppingCart },
    { id: "ads", label: "Marketing & Ads", icon: Megaphone },
    { id: "chat", label: "Direct Messages", icon: MessageSquare },
    { id: "profile", label: "Store Profile", icon: User },
  ] as const;

  const go = (id: typeof activeTab) => {
    setActiveTab(id);
    setMobileOpen(false);
  };
  const tabTitle = NAV_ITEMS.find((t) => t.id === activeTab)?.label ?? "Overview";

  const renderNav = (onNavigate: (id: typeof activeTab) => void) => (
    <>
      <p className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Menu</p>
      {NAV_ITEMS.map((tab) => {
        const Icon = tab.icon;
        const isSelected = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            aria-current={isSelected ? "page" : undefined}
            onClick={() => onNavigate(tab.id)}
            className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors ${
              isSelected
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {tab.label}
          </button>
        );
      })}
    </>
  );

  // Store Profile form state
  const [storeName, setStoreName] = useState(currentUser?.storeName || "");
  const [location, setLocation] = useState(currentUser?.location || "");
  const [bio, setBio] = useState(currentUser?.bio || "");

  // Add Product form state
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState(marketplaceCategories[0]);
  const [price, setPrice] = useState("0");
  const [oldPrice, setOldPrice] = useState("");
  const [stockCount, setStockCount] = useState("0");
  const [unit, setUnit] = useState("");
  const [minimumOrder, setMinimumOrder] = useState("");
  const [image, setImage] = useState("");
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoPreview, setPhotoPreview] = useState("");
  const [description, setDescription] = useState("");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const productFormRef = useRef<HTMLDivElement>(null);

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
          <div className="mx-auto max-w-2xl rounded-lg border border-border bg-card p-8 text-center shadow-sm">
            <h1 className="font-display text-3xl font-bold text-foreground">Seller dashboard</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              This area is for sellers. Log in with your seller account or create one to manage listings, orders, bulk opportunities, and advert requests.
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
  const saveProfile = () => {
    updateSellerProfile({
      storeName,
      location,
      bio,
    });
  };

  const resetProductForm = () => {
    setEditingProductId(null);
    setProductName("");
    setCategory(marketplaceCategories[0]);
    setPrice("0");
    setOldPrice("");
    setStockCount("0");
    setUnit("");
    setMinimumOrder("");
    setImage("");
    setPhotoPreview("");
    setDescription("");
  };
  const startEditingProduct = (item: Product) => {
    setEditingProductId(item.id);
    setProductName(item.name);
    setCategory(item.category as typeof category);
    setPrice(String(item.price));
    setOldPrice(item.oldPrice == null ? "" : String(item.oldPrice));
    setStockCount(String(item.stockCount));
    setUnit(item.unit);
    setMinimumOrder(item.minimumOrder);
    setImage("");
    setPhotoPreview(item.image);
    setDescription(item.description);
    requestAnimationFrame(() => productFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };
  const handleSaveProduct = async () => {
    if (photoBusy) return;
    if (!editingProductId && !image) { toast.error("Upload a product photo first."); return; }
    if (oldPrice.trim() && Number(oldPrice) <= Number(price)) { toast.error("Old price must be higher than the selling price."); return; }
    const input = {
      name: productName,
      category,
      price: Number(price),
      ...(oldPrice.trim() ? { oldPrice: Number(oldPrice) } : editingProductId ? { oldPrice: null } : {}),
      stockCount: Number(stockCount),
      unit,
      minimumOrder,
      ...(image ? { image } : {}),
      location: sellerProducts.find(item => item.id === editingProductId)?.location || location,
      description,
    };
    const result = editingProductId ? await updateProduct(editingProductId, input) : await addProduct({ ...input, image });

    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    resetProductForm();
  };

  const handleAdRequest = async () => {
    const result = await createAdRequest(adType, adTitle, Number(adBudget));
    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    setAdTitle("");
    setAdBudget("0");
  };

  const handleSendDashboardMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInputText.trim() || !activeChatUserId) return;

    const result = await sendChatMessage(activeChatUserId, chatInputText.trim());
    if (result.ok) setChatInputText("");
    else toast.error(result.message);
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
    <div className="dashboard-workspace min-h-screen">
      {/* Desktop sidebar — full height */}
      <aside className="dashboard-sidebar fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-border bg-card lg:flex">
        <div className="flex items-center gap-2.5 border-b border-border px-5 py-4">
          <img src="/farmyn-icon.svg" alt="Farmyn" className="h-8 w-8" />
          <span className="font-display text-lg font-bold text-foreground">
            Farm<span className="text-primary">yn</span>
          </span>
        </div>
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-extrabold text-primary-foreground">
            {(currentUser.storeName || currentUser.name).slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-foreground">{currentUser.storeName || currentUser.name}</p>
            <p className={`text-[11px] font-semibold ${currentUser.verified ? "text-emerald-700" : "text-amber-700"}`}>
              {currentUser.verified ? "Verified seller" : "Verification pending"}
            </p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {renderNav(setActiveTab)}
        </nav>
        <div className="space-y-2 border-t border-border p-3">
          <PaymentStatusBadge className="w-full justify-center" />
          <Button variant="ghost" size="sm" className="w-full" onClick={logout}>Logout</Button>
        </div>
      </aside>

      {/* Mobile icon rail — always visible, expands to full menu on toggle */}
      <aside className="dashboard-sidebar fixed inset-y-0 left-0 z-40 flex w-16 flex-col items-center border-r border-border bg-card py-4 lg:hidden">
        <img src="/farmyn-icon.svg" alt="Farmyn" className="h-8 w-8" />
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open full menu"
          title="Open full menu"
          className="mt-4 rounded-md p-2.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <PanelLeftOpen className="h-5 w-5" />
        </button>
        <nav className="mt-2 flex flex-1 flex-col items-center gap-1 overflow-y-auto">
          {NAV_ITEMS.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                aria-current={isSelected ? "page" : undefined}
                onClick={() => go(tab.id)}
                aria-label={tab.label}
                title={tab.label}
                className={`rounded-md p-2.5 transition-colors ${
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Mobile drawer — full menu, toggle back to icons */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="dashboard-sidebar absolute inset-y-0 left-0 flex w-72 flex-col bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
              <span className="flex items-center gap-2">
                <img src="/farmyn-icon.svg" alt="Farmyn" className="h-7 w-7" />
                <span className="font-display text-base font-bold">Farm<span className="text-primary">yn</span></span>
              </span>
              <button onClick={() => setMobileOpen(false)} aria-label="Hide full menu" title="Hide full menu" className="rounded-md p-2 text-muted-foreground hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto p-3">
              {renderNav(go)}
            </nav>
            <div className="border-t border-border p-3">
              <Button variant="ghost" size="sm" className="w-full" onClick={() => { logout(); setMobileOpen(false); }}>Logout</Button>
            </div>
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="pl-16 lg:pl-64">
        <header className="dashboard-topbar sticky top-0 z-30 flex h-20 items-center gap-3 border-b border-border bg-background px-4 sm:px-6">
          <button onClick={() => setMobileOpen(true)} aria-label="Open menu" className="rounded-md p-2 text-muted-foreground hover:bg-muted lg:hidden">
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-xs font-semibold text-foreground">Seller workspace <span className="mx-2 font-normal text-slate-300">/</span> <span className="text-muted-foreground">{tabTitle}</span></h1>
          <div className="ml-auto flex items-center gap-2">
            <PaymentStatusBadge className="hidden sm:inline-flex" />
            <Link href="/marketplace">
              <Button variant="outline" size="sm" className="gap-1.5">
                Explore Market <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </header>

        {/* Tab Content window */}
        <main className="dashboard-main mx-auto max-w-[1480px] min-w-0 space-y-6 p-5 sm:p-8 xl:p-10">
          {activeTab === "overview" && <DashboardOverview onSellerNavigate={go} />}

          {/* 2. INVENTORY TAB */}
          {activeTab === "inventory" && (
            <div className="grid gap-6 lg:grid-cols-12">
              {/* Product Listing Form */}
              <div ref={productFormRef} className="lg:col-span-5 scroll-mt-24 rounded-md border border-border bg-card p-6 shadow-sm self-start">
                <h2 className="text-lg font-bold text-foreground">{editingProductId ? "Edit listing" : "Add New Product"}</h2>
                <p className="text-xs text-muted-foreground mt-1">{editingProductId ? "Update your listing details and stock. Choose a new photo only if you want to replace it." : "List produce, poultry, grains, or ingredients directly to the marketplace."}</p>
                <div className="mt-5 grid gap-3 text-sm">
                  <div className="space-y-1.5"><label htmlFor="product-name" className="text-xs font-semibold text-foreground">Product name</label><Input id="product-name" placeholder="e.g. Fresh tomatoes" value={productName} onChange={(event) => setProductName(event.target.value)} /></div>
                  <div className="space-y-1.5"><label htmlFor="product-category" className="text-xs font-semibold text-foreground">Product type</label><select id="product-category" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={category} onChange={(event) => setCategory(event.target.value as typeof category)}>
                    {marketplaceCategories.map((entry) => (
                      <option key={entry} value={entry}>{entry}</option>
                    ))}
                  </select></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5"><label htmlFor="product-price" className="text-xs font-semibold text-foreground">Selling price (₦)</label><Input id="product-price" placeholder="0" type="number" min="0" value={price} onChange={(event) => setPrice(event.target.value)} /></div>
                    <div className="space-y-1.5"><label htmlFor="product-old-price" className="text-xs font-semibold text-foreground">Old price (optional)</label><Input id="product-old-price" placeholder="e.g. 7500" type="number" min="0" value={oldPrice} onChange={(event) => setOldPrice(event.target.value)} /></div>
                  </div>
                  <p className="-mt-1 text-[11px] text-muted-foreground">If set, the old price appears crossed out beside your selling price.</p>
                  <div className="space-y-1.5"><label htmlFor="product-stock" className="text-xs font-semibold text-foreground">Quantity in stock</label><Input id="product-stock" placeholder="0" type="number" min="0" value={stockCount} onChange={(event) => setStockCount(event.target.value)} /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5"><label htmlFor="product-unit" className="text-xs font-semibold text-foreground">Unit</label><Input id="product-unit" placeholder="e.g. basket" value={unit} onChange={(event) => setUnit(event.target.value)} /></div>
                    <div className="space-y-1.5"><label htmlFor="product-minimum" className="text-xs font-semibold text-foreground">Minimum order</label><Input id="product-minimum" placeholder="e.g. 1 basket" value={minimumOrder} onChange={(event) => setMinimumOrder(event.target.value)} /></div>
                  </div>
                  <div className="space-y-2"><label htmlFor="product-photo" className="text-sm font-medium">{editingProductId ? "Replace product photo (optional)" : "Product photo"}</label><Input key={editingProductId || "new"} id="product-photo" type="file" accept="image/jpeg,image/png,image/webp" disabled={photoBusy} onChange={async event => { const file = event.target.files?.[0]; if (!file) return; if (file.size > 3 * 1024 * 1024) { toast.error("Choose a photo under 3 MB."); return; } setPhotoBusy(true); try { const result = await uploadPhoto(file); setImage(result.image); setPhotoPreview(result.preview); } catch(e) { toast.error(e instanceof Error ? e.message : "Upload failed."); } finally { setPhotoBusy(false); } }} /><p className="text-xs text-muted-foreground">JPEG, PNG or WebP, up to 3 MB. {photoBusy ? "Uploading…" : image ? "Photo uploaded." : editingProductId ? "Current photo will be kept." : "Choose a clear photo of your produce."}</p>{photoPreview && <img src={photoPreview} alt="Product photo preview" className="h-24 w-24 rounded-lg object-cover" />}</div>
                  <div className="space-y-1.5"><label htmlFor="product-description" className="text-xs font-semibold text-foreground">Description</label><Textarea id="product-description" placeholder="Describe freshness, size, and harvest details" value={description} onChange={(event) => setDescription(event.target.value)} /></div>
                  <div className="mt-2 flex flex-wrap gap-2"><Button className="gap-2 bg-primary hover:bg-primary/90" disabled={photoBusy} onClick={handleSaveProduct}>
                    {editingProductId ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}{editingProductId ? "Save changes" : "Add Product"}
                  </Button>{editingProductId && <Button variant="outline" onClick={resetProductForm}>Cancel</Button>}</div>
                </div>
              </div>

              {/* Product List table */}
              <div className="lg:col-span-7 rounded-md border border-border bg-card p-6 shadow-sm">
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
                      <div key={product.id} className="rounded-md border border-border p-4 flex flex-wrap items-center justify-between gap-4 bg-muted/10 hover:bg-muted/20 transition-colors">
                        <div className="flex min-w-0 items-center gap-3">
                          <img src={product.image} alt={product.name} className="h-12 w-12 rounded-lg object-cover bg-muted" />
                          <div>
                            <h4 className="font-bold text-foreground text-sm">{product.name}</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {product.category} • {product.stockCount} {product.unit} in stock
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-primary text-sm">{formatNaira(product.price)}{product.oldPrice != null && product.oldPrice > product.price && <span className="ml-2 font-normal text-muted-foreground line-through">{formatNaira(product.oldPrice)}</span>}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Min: {product.minimumOrder}</p>
                          <Button type="button" variant="outline" size="sm" className="mt-2 h-8 gap-1.5 text-xs" onClick={() => startEditingProduct(product)}><Pencil className="h-3 w-3" /> Edit</Button>
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
            <div className="rounded-md border border-border bg-card p-6 shadow-sm">
              <div className="border-b border-border pb-4 mb-4">
                <h2 className="text-lg font-bold text-foreground">Customer Orders</h2>
                <p className="text-xs text-muted-foreground mt-1">Manage paid orders and delivery. Seller settlement is handled separately from checkout.</p>
              </div>
              {sellerOrders.length === 0 ? <div className="py-12 text-center text-sm text-muted-foreground">No buyer orders received yet.</div> : (
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full min-w-[760px] text-left text-xs">
                    <caption className="sr-only">Seller orders, customers, products, payment and delivery status</caption>
                    <thead className="bg-muted/50 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"><tr>
                      <th scope="col" className="px-4 py-3">Order</th>
                      <th scope="col" className="px-4 py-3">Customer</th>
                      <th scope="col" className="px-4 py-3">Products</th>
                      <th scope="col" className="px-4 py-3">Status</th>
                      <th scope="col" className="px-4 py-3">Payment</th>
                      <th scope="col" className="px-4 py-3 text-right">Subtotal</th>
                    </tr></thead>
                    <tbody className="divide-y divide-border">
                      {sellerOrders.map(order => <tr key={order.id} className="align-top transition-colors hover:bg-muted/20">
                        <td className="px-4 py-4"><p className="max-w-36 truncate font-semibold text-foreground" title={order.id}>{order.id}</p><p className="mt-1 whitespace-nowrap text-[11px] text-muted-foreground">{formatDate(order.createdAt)}</p>{order.paymentStatus === "Paid" && order.status !== "Delivered" && order.status !== "Completed" && <Button size="sm" variant="outline" className="mt-2 h-7 whitespace-nowrap px-2 text-[11px]" onClick={() => advanceOrderStatus(order.id)}>Advance Status</Button>}</td>
                        <td className="px-4 py-4"><p className="font-semibold text-foreground">{order.buyerName}</p><p className="mt-1 max-w-40 text-[11px] leading-relaxed text-muted-foreground">{order.deliveryAddress}</p></td>
                        <td className="px-4 py-4"><div className="max-w-48 space-y-1.5">{order.items.map(item => <p key={`${order.id}-${item.productId}`} className="text-foreground">{item.name} <span className="whitespace-nowrap text-muted-foreground">× {item.quantity}</span></p>)}</div></td>
                        <td className="px-4 py-4"><span className="inline-flex whitespace-nowrap rounded-full bg-accent/70 px-2.5 py-1 text-[11px] font-medium text-accent-foreground">{order.status}</span></td>
                        <td className="px-4 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${order.paymentStatus === "Paid" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>{order.paymentStatus}</span></td>
                        <td className="whitespace-nowrap px-4 py-4 text-right font-semibold tabular-nums text-foreground">{formatNaira(order.subtotal)}</td>
                      </tr>)}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 4. ADS TAB */}
          {activeTab === "ads" && (
            <div className="grid gap-6 lg:grid-cols-12">
              <div className="lg:col-span-5 rounded-md border border-border bg-card p-6 shadow-sm self-start">
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

              <div className="lg:col-span-7 rounded-md border border-border bg-card p-6 shadow-sm">
                <h2 className="text-lg font-bold text-foreground border-b border-border pb-4 mb-4">Ad Campaigns & Placement History</h2>
                <div className="space-y-3 max-h-[30rem] overflow-y-auto pr-1">
                  {sellerAdRequests.length === 0 ? (
                    <div className="py-12 text-center text-sm text-muted-foreground">
                      No ad campaign requests submitted yet.
                    </div>
                  ) : (
                    sellerAdRequests.map((request) => (
                      <div key={request.id} className="rounded-md border border-border p-4 flex items-center justify-between gap-4 bg-muted/10">
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
            <div className="border border-border bg-card rounded-md flex flex-col md:flex-row h-[500px] overflow-hidden shadow-sm">
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
                            <div className={`max-w-[75%] rounded-md px-3 py-2 text-xs  ${
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
            <div className="rounded-md border border-border bg-card p-6 shadow-sm max-w-2xl">
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
        </main>
      </div>
    </div>
  );
}
