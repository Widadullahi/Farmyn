import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  poweredByHeader: false,
  async rewrites() {
    const origin = process.env.API_ORIGIN || "http://127.0.0.1:3001";
    if (!/^https?:\/\//.test(origin)) throw new Error("API_ORIGIN must be an HTTP(S) origin");
    return [{ source: "/api/:path*", destination: `${origin.replace(/\/$/, "")}/api/:path*` }];
  },
  async headers() { return [{ source: "/(.*)", headers: [{ key: "X-Content-Type-Options", value: "nosniff" }, { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }, { key: "X-Frame-Options", value: "DENY" }, { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" }] }]; },
};
export default nextConfig;
