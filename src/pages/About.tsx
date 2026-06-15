import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-10">
        <div className="max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-secondary">About Us</p>
          <h1 className="mt-3 font-display text-4xl font-bold text-foreground">Bridging the gap in Nigerian agriculture</h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Farmyn is an agricultural marketplace built to connect local growers, livestock owners, and food vendors directly with household and commercial buyers. By introducing escrow payments and verified seller profiles, we make farm-to-table transactions safe, transparent, and hassle-free.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="text-lg font-semibold text-foreground">Why shop on Farmyn?</h2>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li><strong>Secure Escrow:</strong> Your money is held safely by Farmyn and only released after you inspect and accept your delivery.</li>
              <li><strong>Zero Intermediaries:</strong> Buy directly from the farmers who grow your food, ensuring fresh produce and fairer prices.</li>
              <li><strong>Verified Sellers:</strong> Review grower profiles, check their verification badges, and read honest feedback from other buyers.</li>
              <li><strong>Bulk Sourcing:</strong> Post custom wholesale requests to receive direct competitive quotes from multiple farms.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="text-lg font-semibold text-foreground">How it works</h2>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li><strong>1. Discover:</strong> Browse local listings or post a customized bulk request outlining your specifications.</li>
              <li><strong>2. Order & Fund:</strong> Place your order and fund the secure escrow account. The farmer starts preparing your shipment.</li>
              <li><strong>3. Delivery & Verification:</strong> Track the order to your door. Once verified, release the payment to the grower.</li>
              <li><strong>4. Grow Together:</strong> Leave a review to build community trust and help local farmers scale their business.</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="text-lg font-semibold text-foreground">Our Core Principles</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {[
              ["Trust First", "Building verification mechanisms and escrow flows so you can buy and sell with confidence."],
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
};

export default About;
