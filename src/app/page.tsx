"use client";

import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ViralLanding } from "@/components/viral/ViralLanding";
import { PromoBanner } from "@/components/viral/PromoBanner";
import { 
  ArrowRight, 
  CheckCircle, 
  Calculator, 
  Shield, 
  Zap, 
  Clock,
  Star,
  ChevronDown,
  Play,
  TrendingUp,
  Award,
  Users
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

// Price Calculator Widget
function PriceCalculatorWidget() {
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [productType, setProductType] = useState("banner");
  const [price, setPrice] = useState<number | null>(null);

  const calculatePrice = () => {
    const w = parseFloat(width) || 0;
    const h = parseFloat(height) || 0;
    const area = w * h;
    
    // En x Uzunluq x 5
    const total = area * 5;
    setPrice(total);
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#1F2937] mb-2">
            En (m)
          </label>
          <input
            type="number"
            step="0.1"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            placeholder="Məsələn: 4.5"
            className="w-full h-12 rounded-[14px] border border-[#E5E7EB] px-4 focus:outline-none focus:border-[#D90429]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#1F2937] mb-2">
            Hündürlük (m)
          </label>
          <input
            type="number"
            step="0.1"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="Məsələn: 2.8"
            className="w-full h-12 rounded-[14px] border border-[#E5E7EB] px-4 focus:outline-none focus:border-[#D90429]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#1F2937] mb-2">
            Məhsul Tipi
          </label>
          <select 
            value={productType}
            onChange={(e) => setProductType(e.target.value)}
            className="w-full h-12 rounded-[14px] border border-[#E5E7EB] px-4 focus:outline-none focus:border-[#D90429] bg-white"
          >
            <option value="banner">Banner</option>
            <option value="vinil">Vinil</option>
            <option value="orakal">Orakal</option>
          </select>
        </div>
        <Button onClick={calculatePrice} className="w-full">
          Qiymət Hesabla
        </Button>
      </div>
      {price !== null && (
        <div className="mt-6 pt-6 border-t border-[#E5E7EB]">
          <div className="flex items-center justify-between">
            <span className="text-[#6B7280]">Təxmini qiymət:</span>
            <span className="text-2xl font-bold text-[#D90429] font-[Manrope]">
              {price.toFixed(2)} AZN
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {width}m × {height}m × 5 AZN/m²
          </p>
        </div>
      )}
    </Card>
  );
}

// Hero Section
function HeroSection() {
  return (
    <section className="relative py-20 lg:py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-2 bg-[#D90429]/10 text-[#D90429] rounded-full text-sm font-medium mb-6">
              Premium Dekor Xidməti
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-[#1F2937] leading-tight mb-6 font-[Manrope]">
              Evinizi <span className="text-[#D90429]">Premium</span> Üslubda Bəzəyin
            </h1>
            <p className="text-lg text-[#6B7280] mb-8 leading-relaxed">
              Professional dekorçularımızla evinizi və ofisinizi ən yüksək standartlarda bəzəyin. 
              Sürətli, keyfiyyətli və sərfəli xidmət.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" icon={<ArrowRight className="w-5 h-5" />}>
                Sifariş Et
              </Button>
              <Button variant="secondary" size="lg">
                Ətraflı Məlumat
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-6 sm:gap-8 mt-12">
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-[#1F2937] font-[Manrope]">500+</p>
                <p className="text-[#6B7280] text-xs sm:text-sm">Tamamlanmış Layihə</p>
              </div>
              <div className="hidden sm:block w-px h-12 bg-[#E5E7EB]" />
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-[#1F2937] font-[Manrope]">50+</p>
                <p className="text-[#6B7280] text-xs sm:text-sm">Professional Dekorçu</p>
              </div>
              <div className="hidden sm:block w-px h-12 bg-[#E5E7EB]" />
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-[#1F2937] font-[Manrope]">98%</p>
                <p className="text-[#6B7280] text-xs sm:text-sm">Məmnun Müştəri</p>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative rounded-[24px] overflow-hidden bg-gradient-to-br from-[#D90429]/20 to-[#EF476F]/20 p-8">
              <div className="aspect-[4/3] rounded-[18px] bg-white/50 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-[#D90429]/10 flex items-center justify-center">
                    <Star className="w-12 h-12 text-[#D90429]" />
                  </div>
                  <p className="text-[#1F2937] font-semibold">Premium Keyfiyyət</p>
                </div>
              </div>
            </div>
            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 bg-white rounded-2xl p-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#16A34A]/10 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-[#16A34A]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1F2937]">Sürətli Çatdırılma</p>
                  <p className="text-xs text-[#6B7280]">24 saat ərzində</p>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl p-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#D90429]/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-[#D90429]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1F2937]">Keyfiyyət Zəmanəti</p>
                  <p className="text-xs text-[#6B7280]">100% təminat</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Services Section
function ServicesSection() {
  const services = [
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Sürətli Xidmət",
      description: "Sifarişiniz 24 saat ərzində hazırlanır və çatdırılır.",
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Keyfiyyət Zəmanəti",
      description: "Bütün materiallar və işçilik üçün 100% zəmanət.",
    },
    {
      icon: <Calculator className="w-8 h-8" />,
      title: "Şəffaf Qiymətlər",
      description: "Gizli xərclər yoxdur, ödədiyiniz qiymət son qiymətdir.",
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: "7/24 Dəstək",
      description: "Hər zaman əlaqə saxlaya biləcəyiniz dəstək komandası.",
    },
  ];

  return (
    <section id="services" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-[#1F2937] mb-4 font-[Manrope]">
            Niyə Bizi Seçməlisiniz?
          </h2>
          <p className="text-[#6B7280] max-w-2xl mx-auto">
            Professional komandamız və premium xidmətlərimizlə fərq yaradırıq
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <Card key={index} className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#D90429]/10 flex items-center justify-center text-[#D90429]">
                {service.icon}
              </div>
              <h3 className="text-lg font-bold text-[#1F2937] mb-2 font-[Manrope]">
                {service.title}
              </h3>
              <p className="text-[#6B7280] text-sm">{service.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// How It Works Section
function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      title: "Ölçü Alın",
      description: "Otağınızın ölçülərini qeyd edin və ya professional ölçü xidmətimizdən istifadə edin.",
    },
    {
      number: "02",
      title: "Məhsul Seçin",
      description: "Geniş məhsul çeşidimizdən zövqünüzə uyğun dekor seçin.",
    },
    {
      number: "03",
      title: "Sifariş Verin",
      description: "Sürətli və təhlükəsiz ödəniş ilə sifarişinizi tamamlayın.",
    },
    {
      number: "04",
      title: "Quraşdırma",
      description: "Professional komandamız quraşdırmanı həyata keçirsin.",
    },
  ];

  return (
    <section id="how-it-works" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-[#1F2937] mb-4 font-[Manrope]">
            Necə İşləyir?
          </h2>
          <p className="text-[#6B7280] max-w-2xl mx-auto">
            4 sadə addımla xəyalınızdakı dekorasiyaya sahib olun
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <div className="text-6xl font-bold text-[#D90429]/10 font-[Manrope] mb-4">
                {step.number}
              </div>
              <h3 className="text-xl font-bold text-[#1F2937] mb-3 font-[Manrope]">
                {step.title}
              </h3>
              <p className="text-[#6B7280]">{step.description}</p>
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-[#E5E7EB] to-transparent" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Pricing Calculator Section
function PricingSection() {
  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#1F2937] mb-4 font-[Manrope]">
              Qiymət Hesablayıcı
            </h2>
            <p className="text-[#6B7280] mb-8">
              Otağınızın ölçülərini daxil edin və təxmini qiyməti öyrənin
            </p>
            <PriceCalculatorWidget />
          </div>
          <div className="relative">
            <div className="aspect-square rounded-[24px] bg-gradient-to-br from-[#D90429]/10 to-[#EF476F]/10 flex items-center justify-center">
              <div className="text-center">
                <Calculator className="w-24 h-24 text-[#D90429] mx-auto mb-6" />
                <p className="text-xl font-semibold text-[#1F2937]">Sərfəli Qiymətlər</p>
                <p className="text-[#6B7280] mt-2">Rəqabətli qiymətlərlə keyfiyyətli xidmət</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Testimonials Section
function TestimonialsSection() {
  const testimonials = [
    {
      name: "Aygün Məmmədova",
      role: "Ev sahibi",
      content: "Çox peşəkar komanda! Sifarişim vaxtında və yüksək keyfiyyətlə hazırlandı. Hər kəsə tövsiyə edirəm.",
      rating: 5,
    },
    {
      name: "Rəşid Əliyev",
      role: "Biznesmen",
      content: "Ofisimin dekorasiyası üçün müraciət etdim. Nəticədən çox məmnunam. Keyfiyyət və xidmət əla!",
      rating: 5,
    },
    {
      name: "Nigar Həsənli",
      role: "Dizayner",
      content: "Mən də dekorator kimi bu platformada çalışıram. Çox sərfəli şərait və daimi sifarişlər var.",
      rating: 5,
    },
  ];

  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-[#1F2937] mb-4 font-[Manrope]">
            Müştəri Rəyləri
          </h2>
          <p className="text-[#6B7280] max-w-2xl mx-auto">
            Müştərilərimizin bizim haqqımızda dedikləri
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index}>
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-[#F59E0B] text-[#F59E0B]" />
                ))}
              </div>
              <p className="text-[#1F2937] mb-6 leading-relaxed">"{testimonial.content}"</p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#D90429]/10 flex items-center justify-center text-[#D90429] font-bold">
                  {testimonial.name[0]}
                </div>
                <div>
                  <p className="font-semibold text-[#1F2937]">{testimonial.name}</p>
                  <p className="text-sm text-[#6B7280]">{testimonial.role}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// FAQ Section
function FAQSection() {
  const faqs = [
    {
      question: "Sifariş neçə gün ərzində hazırlanır?",
      answer: "Adətən sifarişlər 3-5 iş günü ərzində hazırlanır. Təcili sifarişlər üçün 24 saatlıq express xidmətimiz də mövcuddur.",
    },
    {
      question: "Ödəniş hansı üsullarla edilə bilər?",
      answer: "Nağd, bank kartı (Visa, Mastercard) və ya bank köçürməsi ilə ödəniş edə bilərsiniz.",
    },
    {
      question: "Quraşdırma xidməti daxildirmi?",
      answer: "Bəli, bütün sifarişlərdə peşəkar quraşdırma xidməti daxildir. Əlavə ödəniş tələb olunmur.",
    },
    {
      question: "Zəmanət müddəti nə qədərdir?",
      answer: "Bütün məhsullar və quraşdırma işləri üçün 2 il zəmanət verilir.",
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-[#1F2937] mb-4 font-[Manrope]">
            Tez-tez Verilən Suallar
          </h2>
          <p className="text-[#6B7280]">
            Ən çox soruşulan suallar və cavabları
          </p>
        </div>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <Card key={index} className="group">
              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <span className="font-semibold text-[#1F2937]">{faq.question}</span>
                  <ChevronDown className="w-5 h-5 text-[#6B7280] transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-4 text-[#6B7280] leading-relaxed">{faq.answer}</p>
              </details>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// Contact Section
function ContactSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <section id="contact" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12">
          <div>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#1F2937] mb-4 font-[Manrope]">
              Bizimlə Əlaqə
            </h2>
            <p className="text-[#6B7280] mb-8">
              Suallarınız var? Bizimlə əlaqə saxlayın, ən qısa zamanda cavablandıraq.
            </p>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#D90429]/10 flex items-center justify-center text-[#D90429]">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-[#6B7280]">Telefon</p>
                  <p className="font-semibold text-[#1F2937]">+994 50 798 81 77</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#D90429]/10 flex items-center justify-center text-[#D90429]">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-[#6B7280]">Email</p>
                  <p className="font-semibold text-[#1F2937]">premiumreklam@bk.ru</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#D90429]/10 flex items-center justify-center text-[#D90429]">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-[#6B7280]">Ünvan</p>
                  <p className="font-semibold text-[#1F2937]">Bakı şəh., Nizami r.</p>
                </div>
              </div>
            </div>
          </div>
          <Card>
            <form onSubmit={handleSubmit} className="space-y-4">
              {submitted && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700">
                  Mesajınız uğurla göndərildi!
                </div>
              )}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#1F2937] mb-2">Ad</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full h-12 rounded-[14px] border border-[#E5E7EB] px-4 focus:outline-none focus:border-[#D90429]"
                    placeholder="Adınız"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1F2937] mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full h-12 rounded-[14px] border border-[#E5E7EB] px-4 focus:outline-none focus:border-[#D90429]"
                    placeholder="email@example.com"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1F2937] mb-2">Mövzu</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full h-12 rounded-[14px] border border-[#E5E7EB] px-4 focus:outline-none focus:border-[#D90429]"
                  placeholder="Mövzu"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1F2937] mb-2">Mesaj</label>
                <textarea
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full rounded-[14px] border border-[#E5E7EB] px-4 py-3 focus:outline-none focus:border-[#D90429] resize-none"
                  placeholder="Mesajınız..."
                  required
                />
              </div>
              <Button type="submit" className="w-full">Göndər</Button>
            </form>
          </Card>
        </div>
      </div>
    </section>
  );
}

// Footer
function Footer() {
  return (
    <footer className="bg-[#1F2937] text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img
                src="/Backup_of_YENILOGO.svg"
                alt="Premium Reklam"
                className="h-8 w-auto"
              />
            </div>
            <p className="text-gray-400 text-sm">
              Premium dekor xidmətləri ilə evinizi və ofisinizi bəzəyin.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Xidmətlər</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a href="#services" className="hover:text-white transition-colors">Vinil Çap</a></li>
              <li><a href="#services" className="hover:text-white transition-colors">Banner</a></li>
              <li><a href="#services" className="hover:text-white transition-colors">Orakal</a></li>
              <li><a href="#services" className="hover:text-white transition-colors">Dizayn</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Şirkət</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
               <li><a href="/" className="hover:text-white transition-colors">Ana Səhvə</a></li>
              <li><a href="/track" className="hover:text-white transition-colors">Sifariş İzlə</a></li>
              <li><a href="#services" className="hover:text-white transition-colors">Xidmətlər</a></li>
              <li><a href="#contact" className="hover:text-white transition-colors">Əlaqə</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Sosial</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Instagram</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Facebook</a></li>
              <li><a href="#" className="hover:text-white transition-colors">LinkedIn</a></li>
              <li><a href="#" className="hover:text-white transition-colors">YouTube</a></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-400 text-sm">
            © 2024 Premium Reklam. Bütün hüquqlar qorunur.
          </p>
          <div className="flex gap-6 text-sm text-gray-400">
            <a href="#" className="hover:text-white transition-colors">Gizlilik Siyasəti</a>
            <a href="#" className="hover:text-white transition-colors">İstifadə Şərtləri</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Main Page Component
export default function Home() {
  return (
    <main className="min-h-screen bg-[#F8F9FB]">
      <PromoBanner />
      <Header variant="public" />
      
      {/* Viral Landing - TikTok/Instagram Optimized */}
      <section className="py-12 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <ViralLanding />
        </div>
      </section>
      
      {/* Traditional Sections */}
      <ServicesSection />
      <HowItWorksSection />
      <PricingSection />
      <TestimonialsSection />
      <FAQSection />
      <ContactSection />
      <Footer />
    </main>
  );
}
