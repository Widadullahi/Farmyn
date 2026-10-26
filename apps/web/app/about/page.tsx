import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-10">
        <div className="max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-secondary">About Us</p>
          <h1 className="mt-3 font-display text-4xl font-bold text-foreground">Bridging the gap in Nigerian agriculture</h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Farmyn is an agricultural marketplace built to connect local growers, livestock owners, and food vendors directly with household and commercial buyers. Paystack checkout and clear order tracking help make farm-to-table transactions more transparent.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="text-lg font-semibold text-foreground">Why shop on Farmyn?</h2>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li><strong>Paystack Checkout:</strong> Complete payment on Paystack. Payment confirmation, delivery and seller settlement are separate steps.</li>
              <li><strong>Direct conversations:</strong> Ask sellers about availability, produce quality and delivery before you order.</li>
              <li><strong>Seller profiles:</strong> Review a seller’s details and any published feedback. A verification badge appears only after a separate business review.</li>
              <li><strong>Bulk Sourcing:</strong> Post custom wholesale requests to receive direct competitive quotes from multiple farms.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="text-lg font-semibold text-foreground">How it works</h2>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li><strong>1. Discover:</strong> Browse local listings or post a customized bulk request outlining your specifications.</li>
              <li><strong>2. Order & Fund:</strong> Pay through Paystack. After payment is verified, the seller can prepare your order.</li>
              <li><strong>3. Delivery & Verification:</strong> Track the order to your door and confirm receipt when it arrives. Seller settlement is handled separately.</li>
              <li><strong>4. Grow Together:</strong> Leave a review to build community trust and help local farmers scale their business.</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="text-lg font-semibold text-foreground">Our Core Principles</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {[
              ["Trust First", "Building clear profiles, payment verification and order tracking."],
              ["Fair Returns", "Empowering farmers to keep more of their profits by cutting out middlemen."],
              ["High Quality", "Connecting you directly to fresh, locally-sourced produce, meats, and grains from regional hubs."]
            ].map(([title, description]) => (
              <div key={title} className="rounded-xl border border-border bg-background p-4">
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="mt-2 text-sm text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
