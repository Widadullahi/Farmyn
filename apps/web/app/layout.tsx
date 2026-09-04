import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: {
    default: "Farmyn Nigeria — Fresh Farm Produce, Secured by Escrow",
    template: "%s | Farmyn Nigeria",
  },
  description:
    "Buy fresh produce, poultry, livestock and grains directly from verified Nigerian farmers. Every order protected by BMONI-powered escrow — money released only on delivery.",
  keywords: ["Nigeria", "farm produce", "marketplace", "escrow", "BMONI", "agriculture"],
  themeColor: "#166534",
  openGraph: {
    title: "Farmyn Nigeria — Fresh Farm Produce, Secured by Escrow",
    description: "Direct farm trade with BMONI escrow protection and verified sellers.",
    type: "website",
  },
  icons: { icon: "/farmlink-logo.png", apple: "/farmlink-logo.png" },
};

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
