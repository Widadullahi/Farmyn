import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: {
    default: "Farmyn Nigeria — Fresh Farm Produce, Pay with Paystack",
    template: "%s | Farmyn Nigeria",
  },
  description:
    "Buy fresh produce, poultry, livestock and grains directly from verified Nigerian farmers. Pay through Paystack and track your order from confirmation to delivery.",
  keywords: ["Nigeria", "farm produce", "marketplace", "payments", "Paystack", "agriculture"],
  openGraph: {
    title: "Farmyn Nigeria — Fresh Farm Produce, Pay with Paystack",
    description: "Direct farm trade with Paystack checkout and order tracking.",
    type: "website",
  },
  icons: { icon: "/farmyn-logo.png", apple: "/farmyn-logo.png" },
};

export const viewport: Viewport = { themeColor: "#166534" };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
