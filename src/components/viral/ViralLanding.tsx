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
        <div className="p-6 bg-gray-50">
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
        <div className="p-6 bg-[#16A34A]/5">
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
    <div className="relative max-w-6xl mx-auto">
      <div className="overflow-hidden rounded-[28px] shadow-2xl shadow-black/10 border border-white bg-white">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className="w-full flex-shrink-0 h-[320px] sm:h-[430px] lg:h-[560px] relative"
            >
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
              <div className="absolute left-0 right-0 bottom-0 p-5 sm:p-8 lg:p-10 text-white">
                <div className="max-w-3xl">
                  <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm mb-3">
                    Premium Reklam
                  </span>
                  <h3 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold mb-2 leading-tight">
                    {slide.title}
                  </h3>
                  <p className="text-white/85 text-sm sm:text-lg lg:text-xl leading-relaxed">
                    {slide.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-12 sm:h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
      >
        <ChevronLeft className="w-6 h-6 text-gray-700" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-12 sm:h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
      >
        <ChevronRight className="w-6 h-6 text-gray-700" />
      </button>

      {/* Dots */}
      <div className="flex justify-center gap-2 mt-5">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-2.5 rounded-full transition-all ${
              currentSlide === index ? "w-8 bg-[#D90429]" : "w-2.5 bg-gray-300 hover:bg-gray-400"
            }`}
          />
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
    <div className="grid grid-cols-2 gap-4">
      {features.map((feature, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="h-full text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-[#D90429]/10 flex items-center justify-center text-[#D90429]">
              {feature.icon}
            </div>
            <h4 className="font-bold text-[#1F2937] text-sm mb-1">{feature.title}</h4>
            <p className="text-xs text-[#6B7280]">{feature.description}</p>
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
    <div className="bg-[#1F2937] rounded-2xl p-6 text-white">
      <div className="grid grid-cols-4 gap-4 text-center">
        {stats.map((stat, index) => (
          <div key={index}>
            <p className="text-2xl font-bold text-[#D90429] font-[Manrope]">{stat.value}</p>
            <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Main Viral Landing Component
export function ViralLanding() {
  return (
    <div className="space-y-8">
      {/* Hero Section - TikTok Style */}
      <section className="text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#D90429]/10 text-[#D90429] rounded-full text-sm font-medium mb-6"
        >
          <Zap className="w-4 h-4" />
          <span>Reklamçılar üçün #1 Sistem</span>
        </motion.div>
        
        <h1 className="text-4xl lg:text-5xl font-bold text-[#1F2937] mb-4 font-[Manrope]">
          Sifarişini <span className="text-[#D90429]">30 saniyəyə</span> yarat
        </h1>
        
        <p className="text-lg text-[#6B7280] max-w-xl mx-auto mb-6">
          Dekorçular üçün hazırlanmış professional sifariş sistemi. 
          Borc nəzarəti, avtomatik hesablama, bonuslar.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/register">
            <Button size="lg" icon={<ArrowRight className="w-5 h-5" />}>
              Pulsuz Başla
            </Button>
          </Link>
          <Link href="/marketplace">
            <Button variant="secondary" size="lg" icon={<Play className="w-5 h-5" />}>
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
      <section>
        <h2 className="text-2xl font-bold text-[#1F2937] text-center mb-6 font-[Manrope]">
          Fərqi Gör
        </h2>
        <BeforeAfterCard />
      </section>

      {/* Social Proof */}
      <SocialProof />

      {/* CTA */}
      <Card className="bg-gradient-to-br from-[#D90429] to-[#EF476F] text-white text-center border-none">
        <h2 className="text-2xl font-bold mb-2 font-[Manrope]">
          İlk Sifarişinə 10% Endirim
        </h2>
        <p className="text-white/80 mb-4">
          İlk 100 dekorçuya xüsusi təklif. Tələsin!
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="secondary" className="bg-white text-[#D90429] border-none">
            Qeydiyyatdan Keç
          </Button>
        </div>
        <p className="text-white/60 text-sm mt-4">
          Kredit kartı tələb olunmur • Pulsuz başla
        </p>
      </Card>
    </div>
  );
}
