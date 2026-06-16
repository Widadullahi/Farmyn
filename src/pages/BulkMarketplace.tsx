import { useState } from "react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "@/context/AppContext";
import { formatDate, formatNaira, marketplaceCategories } from "@/lib/app-data";

const BulkMarketplace = () => {
  const { bulkRequests, currentUser, createBulkRequest } = useApp();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(marketplaceCategories[0]);
  const [quantity, setQuantity] = useState("");
  const [budget, setBudget] = useState("0");
  const [location, setLocation] = useState(currentUser?.location || "");
  const [notes, setNotes] = useState("");

  const handleCreate = () => {
    const result = createBulkRequest({
      title,
      category,
      quantity,
      budget: Number(budget),
      location,
      notes,
    });

    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    setTitle("");
    setQuantity("");
    setBudget("0");
    setNotes("");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-10">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-secondary">Wholesale Sourcing</p>
          <h1 className="mt-3 font-display text-4xl font-bold text-foreground">Request bulk produce & find verified suppliers</h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Tell local farmers what you need, your target volume, and budget. Growers will respond directly with quotes.
          </p>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[0.95fr,1.05fr]">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="text-lg font-semibold text-foreground">Create bulk request</h2>
            <p className="mt-1 text-sm text-muted-foreground">Best used by buyers. Sellers can browse the open opportunities on the right.</p>
            <div className="mt-5 grid gap-4">
              <Input placeholder="Request title" value={title} onChange={(event) => setTitle(event.target.value)} />
              <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={category} onChange={(event) => setCategory(event.target.value)}>
                {marketplaceCategories.map((entry) => (
                  <option key={entry} value={entry}>{entry}</option>
                ))}
              </select>
              <Input placeholder="Quantity needed" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
              <Input placeholder="Budget" type="number" value={budget} onChange={(event) => setBudget(event.target.value)} />
              <Input placeholder="Delivery location" value={location} onChange={(event) => setLocation(event.target.value)} />
              <Textarea placeholder="Additional notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
              <Button onClick={handleCreate}>Publish request</Button>
            </div>
          </div>

          <div className="space-y-4">
            {bulkRequests.map((request) => (
              <div key={request.id} className="rounded-2xl border border-border bg-card p-6 shadow-card">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">{request.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {request.category} • {request.location} • Posted by {request.buyerName}
                    </p>
                  </div>
                  <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
                    {request.status}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-muted/50 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Quantity</p>
                    <p className="mt-1 text-sm font-medium text-foreground">{request.quantity}</p>
                  </div>
                  <div className="rounded-xl bg-muted/50 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Budget</p>
                    <p className="mt-1 text-sm font-medium text-foreground">{formatNaira(request.budget)}</p>
                  </div>
                  <div className="rounded-xl bg-muted/50 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Created</p>
                    <p className="mt-1 text-sm font-medium text-foreground">{formatDate(request.createdAt)}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{request.notes}</p>
                
                {currentUser && currentUser.id !== request.buyerId && (
                  <div className="mt-4 flex justify-end border-t border-border/40 pt-4">
                    <Link to={`/chat?user=${request.buyerId}`}>
                      <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                        <MessageSquare className="h-3.5 w-3.5" />
                        Message Buyer
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default BulkMarketplace;
