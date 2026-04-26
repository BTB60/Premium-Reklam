"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  Play, 
  Calculator, 
  Shield, 
  TrendingUp,
  CheckCircle,
  Zap,
  Award,
  Users,
  Star,
  ArrowRight,
  Smartphone,
  Receipt,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useState, useEffect } from "react";
import {
  getHydrationHomeCarouselSlides,
  loadHomeCarouselSlides,
  type HomeCarouselSlide,
} from "@/lib/homeCarousel";

// Before/After Comparison Component
function BeforeAfterCard() {
  return (
    <Card className="overflow-hidden">
      <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#E5E7EB]">
        {/* Before */}
        <div className="p-4 sm:p-6 bg-gray-50">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 bg-gray-200 text-gray-600 rounded-full text-sm font-medium">
              ƏVVƏL
            </span>
          </div>
          <ul className="space-y-3 text-[#6B7280]">
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-1">✕</span>
              <span>WhatsApp-da sifariş qarışıqlığı</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-1">✕</span>
              <span>Borc kimdə qaldı bilmirsən</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-1">✕</span>
              <span>Qiymət hesablamada səhv</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-1">✕</span>
              <span>Sifariş statusu bilinmir</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-1">✕</span>
              <span>Vaxt itkisi</span>
            </li>
          </ul>
        </div>

        {/* After */}
        <div className="p-4 sm:p-6 bg-[#16A34A]/5">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 bg-[#16A34A] text-white rounded-full text-sm font-medium">
              SONRA
            </span>
          </div>
          <ul className="space-y-3 text-[#1F2937]">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-[#16A34A] mt-0.5" />
              <span>Bir kliklə sifariş yarat</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-[#16A34A] mt-0.5" />
              <span>Real-time borc nəzarəti</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-[#16A34A] mt-0.5" />
              <span>Avtomatik qiymət hesablama</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-[#16A34A] mt-0.5" />
              <span>Sifarişi izlə</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-[#16A34A] mt-0.5" />
              <span>Gündə 1 saat vaxta qənaət</span>
            </li>
          </ul>
        </div>
      </div>
    </Card>
  );
}

// Image Carousel Section
function ImageCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState<HomeCarouselSlide[]>(() => getHydrationHomeCarouselSlides());

  useEffect(() => {
    void loadHomeCarouselSlides().then((loaded) => {
      setSlides(loaded);
      setCurrentSlide(0);
    });
    const reload = () => {
      void loadHomeCarouselSlides().then((loaded) => {
        setSlides(loaded);
        setCurrentSlide(0);
      });
    };
    window.addEventListener("premium:home-carousel-changed", reload);
    window.addEventListener("storage", reload);
    return () => {
      window.removeEventListener("premium:home-carousel-changed", reload);
      window.removeEventListener("storage", reload);
    };
  }, []);

  // Slayd sayı azalanda cari indeks keçərli aralıqda qalsın
  useEffect(() => {
    if (slides.length <= 0) return;
    setCurrentSlide((c) => (c >= slides.length ? 0 : c));
  }, [slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => {
      const len = slides.length;
      if (len <= 0) return 0;
      return (prev + 1) % len;
    });
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => {
      const len = slides.length;
      if (len <= 0) return 0;
      return (prev - 1 + len) % len;
    });
  };

  // Avtomatik: slides.length dəyişəndə interval yenilənsin (köhnə closure ilə modulo səhv olurdu)
  useEffect(() => {
    if (slides.length <= 0) return;
    const len = slides.length;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % len);
    }, 4000);
    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <div className="relative max-w-6xl mx-auto px-1 sm:px-0">
      <div className="overflow-hidden rounded-2xl sm:rounded-[28px] shadow-xl sm:shadow-2xl shadow-black/10 border border-white bg-white touch-pan-y">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className="w-full flex-shrink-0 h-[min(56vw,280px)] min-h-[220px] sm:h-[430px] lg:h-[560px] relative"
            >
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover"
                sizes="(max-width: 640px) 100vw, 896px"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
              <div className="absolute left-0 right-0 bottom-0 p-4 pb-14 sm:p-8 sm:pb-8 lg:p-10 text-white">
                <div className="max-w-3xl min-w-0">
                  <span className="inline-flex items-center rounded-full bg-white/15 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-semibold backdrop-blur-sm mb-2 sm:mb-3">
                    Premium Reklam
                  </span>
                  <h3 className="text-lg sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-1 sm:mb-2 leading-tight line-clamp-3 sm:line-clamp-none">
                    {slide.title}
                  </h3>
                  <p className="text-white/85 text-xs sm:text-lg lg:text-xl leading-relaxed line-clamp-2 sm:line-clamp-none">
                    {slide.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Oxlar: mobil mətnlə üst-üstə düşməsin deyə aşağı; md+ mərkəz */}
      <button
        type="button"
        onClick={prevSlide}
        aria-label="Əvvəlki slayd"
        className="absolute left-2 bottom-3 sm:left-4 md:left-5 md:top-1/2 md:bottom-auto md:-translate-y-1/2 z-10 min-h-[44px] min-w-[44px] h-11 w-11 sm:h-12 sm:w-12 bg-white/95 rounded-full flex items-center justify-center shadow-lg hover:bg-white active:scale-95 transition-transform"
      >
        <ChevronLeft className="w-6 h-6 text-gray-700" />
      </button>
      <button
        type="button"
        onClick={nextSlide}
        aria-label="Növbəti slayd"
        className="absolute right-2 bottom-3 sm:right-4 md:right-5 md:top-1/2 md:bottom-auto md:-translate-y-1/2 z-10 min-h-[44px] min-w-[44px] h-11 w-11 sm:h-12 sm:w-12 bg-white/95 rounded-full flex items-center justify-center shadow-lg hover:bg-white active:scale-95 transition-transform"
      >
        <ChevronRight className="w-6 h-6 text-gray-700" />
      </button>

      {/* Nöqtələr — toxunma sahəsi geniş */}
      <div className="flex justify-center flex-wrap gap-1.5 sm:gap-2 mt-4 sm:mt-5 px-2">
        {slides.map((s, index) => (
          <button
            key={s.id}
            type="button"
            aria-label={`Slayd ${index + 1}`}
            aria-current={currentSlide === index ? "true" : undefined}
            onClick={() => setCurrentSlide(index)}
            className="p-2 -m-1 rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
          >
            <span
              className={`block rounded-full transition-all ${
                currentSlide === index ? "h-2.5 w-8 bg-[#D90429]" : "h-2.5 w-2.5 bg-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

// Feature Cards for TikTok/Short attention span
function QuickFeatures() {
  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "30 saniyədə sifariş",
      description: "3 addımlıq sürətli proses",
    },
    {
      icon: <Receipt className="w-6 h-6" />,
      title: "Borc nəzarəti",
      description: "Real-time balans izləmə",
    },
    {
      icon: <Smartphone className="w-6 h-6" />,
      title: "Mobil dostluq",
      description: "Hər yerdən sifariş ver",
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: "Bonus sistemi",
      description: "Hər sifarişdən bonus qazan",
    },
  ];

  return (
    <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-3 sm:gap-4">
      {features.map((feature, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="h-full text-center p-4 sm:p-5">
            <div className="w-11 h-11 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 rounded-xl bg-[#D90429]/10 flex items-center justify-center text-[#D90429]">
              {feature.icon}
            </div>
            <h4 className="font-bold text-[#1F2937] text-sm sm:text-base mb-1 leading-snug">{feature.title}</h4>
            <p className="text-[11px] sm:text-xs text-[#6B7280] leading-snug">{feature.description}</p>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

// Social Proof for Viral Effect
function SocialProof() {
  const stats = [
    { value: "500+", label: "Aktiv Dekorçu" },
    { value: "10K+", label: "Tamamlanmış Sifariş" },
    { value: "4.9", label: "Reytinq" },
    { value: "50K+", label: "Yüklənmə" },
  ];

  return (
    <div className="bg-[#1F2937] rounded-2xl p-4 sm:p-6 text-white">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-center">
        {stats.map((stat, index) => (
          <div key={index} className="min-w-0 px-1">
            <p className="text-lg sm:text-2xl font-bold text-[#D90429] font-[Manrope] tabular-nums">{stat.value}</p>
            <p className="text-[10px] sm:text-xs text-gray-400 mt-1 leading-tight">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Main Viral Landing Component
export function ViralLanding() {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Hero Section - TikTok Style */}
      <section className="text-center px-0.5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-[#D90429]/10 text-[#D90429] rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-6"
        >
          <Zap className="w-4 h-4 shrink-0" />
          <span>Reklamçılar üçün #1 Sistem</span>
        </motion.div>
        
        <h1 className="text-[1.5rem] leading-snug sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#1F2937] mb-3 sm:mb-4 font-[Manrope] px-1">
          Sifarişini <span className="text-[#D90429]">30 saniyəyə</span> yarat
        </h1>
        
        <p className="text-sm sm:text-lg text-[#6B7280] max-w-xl mx-auto mb-5 sm:mb-6 leading-relaxed px-1">
          Dekorçular üçün hazırlanmış professional sifariş sistemi. 
          Borc nəzarəti, avtomatik hesablama, bonuslar.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md sm:max-w-none mx-auto">
          <Link href="/register" className="w-full sm:w-auto">
            <Button size="lg" className="w-full min-h-[48px] justify-center" icon={<ArrowRight className="w-5 h-5" />}>
              Pulsuz Başla
            </Button>
          </Link>
          <Link href="/marketplace" className="w-full sm:w-auto">
            <Button variant="secondary" size="lg" className="w-full min-h-[48px] justify-center" icon={<Play className="w-5 h-5" />}>
              Marketplace
            </Button>
          </Link>
        </div>
      </section>

      {/* Image Carousel */}
      <ImageCarousel />

      {/* Quick Features */}
      <QuickFeatures />

      {/* Before/After */}
      <section className="px-0.5">
        <h2 className="text-xl sm:text-2xl font-bold text-[#1F2937] text-center mb-4 sm:mb-6 font-[Manrope]">
          Fərqi Gör
        </h2>
        <BeforeAfterCard />
      </section>

      {/* Social Proof */}
      <SocialProof />

      {/* CTA */}
      <Card className="bg-gradient-to-br from-[#D90429] to-[#EF476F] text-white text-center border-none p-5 sm:p-8">
        <h2 className="text-xl sm:text-2xl font-bold mb-2 font-[Manrope] leading-snug">
          İlk Sifarişinə 10% Endirim
        </h2>
        <p className="text-white/80 mb-4 text-sm sm:text-base leading-relaxed px-1">
          İlk 100 dekorçuya xüsusi təklif. Tələsin!
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-xs sm:max-w-none mx-auto">
          <Button variant="secondary" className="bg-white text-[#D90429] border-none w-full sm:w-auto min-h-[48px] justify-center">
            Qeydiyyatdan Keç
          </Button>
        </div>
        <p className="text-white/60 text-xs sm:text-sm mt-4 leading-snug">
          Kredit kartı tələb olunmur • Pulsuz başla
        </p>
      </Card>
    </div>
  );
}
