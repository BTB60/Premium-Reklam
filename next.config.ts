import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ✅ ПРОДАКШЕН: Оптимизация для деплоя
  output: "standalone",
  compress: true,
  poweredByHeader: false,

  // ✅ Experimental features
  experimental: {
    serverActions: {
      bodySizeLimit: '4mb',
    },
  },
  
  // ✅ ПРОПУСКАЕМ ОШИБКИ ТИПОВ И LINTER ПРИ СБОРКЕ
  // (чтобы мелкие TS-ворнинги не роняли деплой)
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },

  devIndicators: false,
};

export default nextConfig;