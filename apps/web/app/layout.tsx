import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: {
    default: "Farmyn Nigeria — Farm Product Listings",
    template: "%s | Farmyn Nigeria",
  },
  description:
    "Browse farm product listings across Nigeria and chat directly with local sellers.",
  keywords: ["Nigeria", "farm produce", "marketplace", "listings", "farmers", "agriculture"],
  openGraph: {
    title: "Farmyn Nigeria — Farm Product Listings",
    description: "Browse farm products and chat directly with sellers.",
    type: "website",
  },
  icons: { icon: "/farmyn-icon.svg" },
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
