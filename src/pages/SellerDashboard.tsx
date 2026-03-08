import { useState } from "react";
import { ArrowUpRight, Megaphone, Package, Plus, ShieldCheck, ShoppingCart, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "@/context/AppContext";
import { formatDate, formatNaira } from "@/lib/app-data";

const SellerDashboard = () => {
  const {
    currentUser,
    products,
    orders,
    bulkRequests,
    adRequests,
    addProduct,
    updateSellerProfile,
    advanceOrderStatus,
    createAdRequest,
  } = useApp();

  const [storeName, setStoreName] = useState(currentUser?.storeName || "");
  const [location, setLocation] = useState(currentUser?.location || "");
  const [bio, setBio] = useState(currentUser?.bio || "");
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("Vegetables");
  const [price, setPrice] = useState("0");
  const [stockCount, setStockCount] = useState("0");
  const [unit, setUnit] = useState("basket");
  const [minimumOrder, setMinimumOrder] = useState("1 basket");
  const [image, setImage] = useState("https://images.unsplash.com/photo-1546470427-0d4db154ceb8?w=900&q=80");
  const [description, setDescription] = useState("");
  const [adType, setAdType] = useState<"Homepage Banner" | "Sidebar Ad" | "Featured Listing">("Featured Listing");
  const [adTitle, setAdTitle] = useState("");
  const [adBudget, setAdBudget] = useState("0");

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
              <Link to="/login">
                <Button variant="outline">Login</Button>
              </Link>
              <Link to="/register">
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
              <ShieldCheck className="h-3.5 w-3.5" />
              {currentUser.verified ? "Verified seller" : "Verification pending"}
            </div>
            <h1 className="mt-3 font-display text-3xl font-bold text-foreground">{currentUser.storeName || currentUser.name}</h1>
            <p className="text-sm text-muted-foreground">{currentUser.location}</p>
          </div>
          <Link to="/marketplace">
            <Button className="gap-2 self-start">
              Explore marketplace <ArrowUpRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Subtotal Sold", value: formatNaira(totalSales), icon: TrendingUp },
            { label: "Active Products", value: sellerProducts.length.toString(), icon: Package },
            { label: "Orders", value: sellerOrders.length.toString(), icon: ShoppingCart },
            { label: "Average Ticket", value: formatNaira(avgTicket), icon: Megaphone },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{stat.label}</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
                  <stat.icon className="h-4 w-4 text-primary" />
                </div>
              </div>
              <p className="mt-4 font-display text-2xl font-bold text-card-foreground">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.05fr,0.95fr]">
          <div className="space-y-8">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <h2 className="text-lg font-semibold text-foreground">Store profile</h2>
              <p className="mt-1 text-sm text-muted-foreground">Transparent seller profiles are a core PRD trust feature.</p>
              <div className="mt-5 grid gap-4">
                <Input placeholder="Store name" value={storeName} onChange={(event) => setStoreName(event.target.value)} />
                <Input placeholder="Location" value={location} onChange={(event) => setLocation(event.target.value)} />
                <Textarea placeholder="Store bio" value={bio} onChange={(event) => setBio(event.target.value)} />
                <Button onClick={saveProfile}>Save profile</Button>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Product listing and inventory</h2>
                  <p className="mt-1 text-sm text-muted-foreground">List inventory directly without paying for a separate seller tool.</p>
                </div>
                <div className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
                  {sellerProducts.length} products
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Input placeholder="Product name" value={productName} onChange={(event) => setProductName(event.target.value)} />
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={category} onChange={(event) => setCategory(event.target.value)}>
                  <option>Vegetables</option>
                  <option>Poultry</option>
                  <option>Livestock</option>
                  <option>Processed Food</option>
                </select>
                <Input placeholder="Price" type="number" value={price} onChange={(event) => setPrice(event.target.value)} />
                <Input placeholder="Stock count" type="number" value={stockCount} onChange={(event) => setStockCount(event.target.value)} />
                <Input placeholder="Unit" value={unit} onChange={(event) => setUnit(event.target.value)} />
                <Input placeholder="Minimum order" value={minimumOrder} onChange={(event) => setMinimumOrder(event.target.value)} />
                <Input className="sm:col-span-2" placeholder="Image URL" value={image} onChange={(event) => setImage(event.target.value)} />
                <Textarea className="sm:col-span-2" placeholder="Description" value={description} onChange={(event) => setDescription(event.target.value)} />
              </div>
              <Button className="mt-4 gap-2" onClick={handleAddProduct}>
                <Plus className="h-4 w-4" />
                Add product
              </Button>

              <div className="mt-6 space-y-3">
                {sellerProducts.map((product) => (
                  <div key={product.id} className="rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-foreground">{product.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {product.category} • {product.stockCount} in stock • {product.minimumOrder}
                        </p>
                      </div>
                      <p className="font-medium text-primary">{formatNaira(product.price)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Order management</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Advance order status to simulate seller operations and escrow release.</p>
                </div>
              </div>
              <div className="mt-5 space-y-4">
                {sellerOrders.map((order) => (
                  <div key={order.id} className="rounded-xl border border-border p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-semibold text-foreground">{order.id}</p>
                        <p className="text-sm text-muted-foreground">
                          Buyer: {order.buyerName} • {formatDate(order.createdAt)}
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
                    <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                      {order.items.map((item) => (
                        <div key={`${order.id}-${item.productId}`} className="flex items-center justify-between">
                          <span>{item.name} x {item.quantity}</span>
                          <span>{formatNaira(item.unitPrice * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">Seller subtotal: {formatNaira(order.subtotal)}</p>
                      {order.status !== "Completed" && (
                        <Button variant="outline" size="sm" onClick={() => advanceOrderStatus(order.id)}>
                          Advance status
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <h2 className="text-lg font-semibold text-foreground">Bulk opportunities</h2>
              <p className="mt-1 text-sm text-muted-foreground">Future PRD feature, now implemented locally so you can test B2B demand early.</p>
              <div className="mt-5 space-y-3">
                {bulkRequests.map((request) => (
                  <div key={request.id} className="rounded-xl border border-border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-foreground">{request.title}</h3>
                        <p className="text-sm text-muted-foreground">{request.quantity} • {request.location}</p>
                      </div>
                      <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">{request.status}</span>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">{request.notes}</p>
                    <p className="mt-3 text-sm font-medium text-primary">Budget: {formatNaira(request.budget)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <h2 className="text-lg font-semibold text-foreground">Price insights</h2>
              <p className="mt-1 text-sm text-muted-foreground">Rule-based price guidance replaces paid AI for now.</p>
              <div className="mt-5 space-y-3">
                {priceInsights.map((insight) => (
                  <div key={insight.id} className="rounded-xl border border-border p-4">
                    <p className="font-semibold text-foreground">{insight.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">Current: {formatNaira(insight.currentPrice)}</p>
                    <p className="mt-1 text-sm text-primary">
                      Suggested range: {formatNaira(insight.suggestedMin)} - {formatNaira(insight.suggestedMax)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <h2 className="text-lg font-semibold text-foreground">Advert requests</h2>
              <p className="mt-1 text-sm text-muted-foreground">Supports the PRD revenue model without adding another vendor right now.</p>
              <div className="mt-5 grid gap-4">
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={adType} onChange={(event) => setAdType(event.target.value as typeof adType)}>
                  <option>Featured Listing</option>
                  <option>Homepage Banner</option>
                  <option>Sidebar Ad</option>
                </select>
                <Input placeholder="Campaign title" value={adTitle} onChange={(event) => setAdTitle(event.target.value)} />
                <Input placeholder="Budget" type="number" value={adBudget} onChange={(event) => setAdBudget(event.target.value)} />
                <Button onClick={handleAdRequest}>Submit advert request</Button>
              </div>

              <div className="mt-5 space-y-3">
                {sellerAdRequests.map((request) => (
                  <div key={request.id} className="rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-foreground">{request.title}</p>
                        <p className="text-sm text-muted-foreground">{request.type}</p>
                      </div>
                      <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">{request.status}</span>
                    </div>
                    <p className="mt-3 text-sm font-medium text-primary">{formatNaira(request.budget)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SellerDashboard;
