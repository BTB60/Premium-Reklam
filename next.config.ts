import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ✅ ПРОДАКШЕН: Оптимизация для деплоя
  output: "standalone", // Уменьшает размер сборки на ~70%, копирует только нужные файлы
  compress: true,       // Включает Gzip/Brotli сжатие
  
  // ✅ Безопасность: отключаем заголовок X-Powered-By
  poweredByHeader: false,

  // ✅ Experimental features
  experimental: {
    serverActions: {
      bodySizeLimit: '4mb', // Увеличено для загрузки фото/видео
    },
  },
  
  typescript: {
    ignoreBuildErrors: false, // В продакшене ошибки типов должны ломать сборку
  },
  
  images: {
    unoptimized: process.env.NODE_ENV === "production", // Отключаем оптимизацию Next.js Image если CDN на стороне хостинга
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },

  // ✅ ОТКЛЮЧЕНИЕ DEV-ИНДИКАТОРОВ
  devIndicators: false,

  // ✅ Security Headers (для продакшена)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // CORS заголовки (если фронт и бэк на разных доменах)
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NEXT_PUBLIC_SITE_URL || '*',
          },
        ],
      },
    ];
  },
};

export default nextConfig;