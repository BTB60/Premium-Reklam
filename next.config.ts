import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  compress: true,
  poweredByHeader: false,
  devIndicators: false,

  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },

  // Kiçik TS xəbərdarlıqları prod build-i dayandırmasın (ESLint: next build --no-lint və ya CI konfiqi)
  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
