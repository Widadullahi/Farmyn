import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-10">
        <div className="max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-secondary">Product vision</p>
          <h1 className="mt-3 font-display text-4xl font-bold text-foreground">Farmyn Nigeria</h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Farmyn is built to connect farmers, livestock producers, fish farmers, food vendors, households, restaurants, supermarkets, and distributors through a trusted digital marketplace for Nigerian agricultural commerce.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="text-lg font-semibold text-foreground">Current product scope</h2>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li>Buyer and seller registration with verification-ready onboarding flow.</li>
              <li>Product listings, search, filters, and verified seller badges.</li>
              <li>Protected checkout with delivery confirmation flow.</li>
              <li>Order tracking, reviews, seller dashboard, bulk requests, and ad requests.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="text-lg font-semibold text-foreground">Why it matters</h2>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li>Direct seller access helps improve farmer margins and buyer trust.</li>
              <li>Clear categories support households, restaurants, and bulk buyers.</li>
              <li>Protected order flow encourages safer online agricultural commerce.</li>
              <li>The product is structured to grow into logistics, analytics, and mobile later.</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="text-lg font-semibold text-foreground">Roadmap</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-4">
            {[
              ["Phase 1", "Accounts, listings, protected checkout, order management, and reviews"],
              ["Phase 2", "Seller verification, ads, and stronger analytics"],
              ["Phase 3", "Bulk marketplace, price insights, and logistics integrations"],
              ["Phase 4", "Mobile apps and regional expansion"],
            ].map(([phase, description]) => (
              <div key={phase} className="rounded-xl border border-border bg-background p-4">
                <p className="text-sm font-semibold text-foreground">{phase}</p>
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
