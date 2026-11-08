import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Farmyn Nigeria",
    short_name: "Farmyn",
    description: "Buy and sell farm products directly across Nigeria.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f8faf7",
    theme_color: "#166534",
    orientation: "portrait-primary",
    categories: ["shopping", "business", "food"],
    icons: [
      { src: "/farmyn-pwa-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/farmyn-pwa-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/farmyn-pwa-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
