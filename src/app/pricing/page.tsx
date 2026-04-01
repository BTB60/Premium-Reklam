"use client";

import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { 
  Check, 
  X, 
  Star, 
  Zap, 
  Crown,
  TrendingUp,
  FileText,
  Users,
  Headphones
} from "lucide-react";
import { motion } from "framer-motion";

const plans = [
  {
    id: "basic",
    name: "Basic",
    description: "Yeni başlayanlar üçün ideal",
    price: 0,
    period: "aylıq",
    popular: false,
    icon: <Star className="w-6 h-6" />,
    features: [
      { text: "Standart sifarişlər", included: true },
      { text: "3 aktiv sifariş", included: true },
      { text: "Əsas analitika", included: true },
      { text: "Email dəstək", included: true },
      { text: "Prioritet sifariş", included: false },
      { text: "Tam analitika", included: false },
      { text: "CRM sistemi", included: false },
      { text: "PDF export", included: false },
      { text: "Portfolio səhifəsi", included: false },
      { text: "Şəxsi menecer", included: false },
    ],
    cta: "Pulsuz Başla",
    variant: "secondary" as const,
  },
  {
    id: "pro",
    name: "Pro",
    description: "Professional dekorçular üçün",
    price: 49,
    period: "aylıq",
    popular: true,
    icon: <Zap className="w-6 h-6" />,
    features: [
      { text: "Prioritet sifarişlər", included: true },
      { text: "Limitsiz aktiv sifariş", included: true },
      { text: "Tam analitika", included: true },
      { text: "7/24 dəstək", included: true },
      { text: "CRM Lite", included: true },
      { text: "PDF export", included: true },
      { text: "Portfolio səhifəsi", included: true },
      { text: "Xüsusi endirimlər", included: false },
      { text: "Şəxsi menecer", included: false },
      { text: "Premium dəstək", included: false },
    ],
    cta: "Pro-ya Keç",
    variant: "primary" as const,
  },
  {
    id: "elite",
    name: "Elite",
    description: "Ən yaxşı təcrübə üçün",
    price: 99,
    period: "aylıq",
    popular: false,
    icon: <Crown className="w-6 h-6" />,
    features: [
      { text: "Bütün Pro xüsusiyyətləri", included: true },
      { text: "Xüsusi endirimlər (15%)", included: true },
      { text: "Şəxsi menecer", included: true },
      { text: "Premium dəstək", included: true },
      { text: "VİP çatdırılma", included: true },
      { text: "Öncədən bildirişlər", included: true },
      { text: "Xüsusi dizayn konsultasiyası", included: true },
      { text: "Reklam dəstəyi", included: true },
      { text: "API ərişi", included: true },
      { text: "Ağ etiket həlləri", included: true },
    ],
    cta: "Elite Al",
    variant: "secondary" as const,
  },
];

const commissionRates = [
  { range: "0 - 1,000 AZN", rate: "15%", description: "Yeni dekorçular üçün" },
  { range: "1,000 - 5,000 AZN", rate: "10%", description: "Təcrübəli dekorçular üçün" },
  { range: "5,000+ AZN", rate: "5%", description: "Professional dekorçular üçün" },
];

function PlanCard({ plan, index }: { plan: typeof plans[0]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card 
        className={`h-full flex flex-col ${plan.popular ? 'ring-2 ring-[#D90429] relative' : ''}`}
        hover={true}
      >
        {plan.popular && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="bg-[#D90429] text-white text-xs font-bold px-3 py-1 rounded-full">
              Ən Populyar
            </span>
          </div>
        )}
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className={`w-14 h-14 mx-auto mb-4 rounded-xl flex items-center justify-center ${
            plan.popular ? 'bg-[#D90429] text-white' : 'bg-[#D90429]/10 text-[#D90429]'
          }`}>
            {plan.icon}
          </div>
          <h3 className="text-2xl font-bold text-[#1F2937] font-[Manrope]">{plan.name}</h3>
          <p className="text-[#6B7280] text-sm mt-1">{plan.description}</p>
        </div>

        {/* Price */}
        <div className="text-center mb-6">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-4xl font-bold text-[#1F2937] font-[Manrope]">
              {plan.price === 0 ? "Pulsuz" : `${plan.price} AZN`}
            </span>
            {plan.price > 0 && (
              <span className="text-[#6B7280]">/{plan.period}</span>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="flex-1 space-y-3 mb-6">
          {plan.features.map((feature, i) => (
            <div key={i} className="flex items-center gap-3">
              {feature.included ? (
                <div className="w-5 h-5 rounded-full bg-[#16A34A]/10 flex items-center justify-center">
                  <Check className="w-3 h-3 text-[#16A34A]" />
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                  <X className="w-3 h-3 text-gray-400" />
                </div>
              )}
              <span className={feature.included ? "text-[#1F2937]" : "text-[#6B7280]"}>
                {feature.text}
              </span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Button 
          variant={plan.variant} 
          className="w-full"
          size="lg"
        >
          {plan.cta}
        </Button>
      </Card>
    </motion.div>
  );
}

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#F8F9FB]">
      <Header variant="public" />
      
      {/* Hero */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl lg:text-5xl font-bold text-[#1F2937] mb-4 font-[Manrope]">
              Sadə və Şəffaf <span className="text-[#D90429]">Qiymətlər</span>
            </h1>
            <p className="text-lg text-[#6B7280]">
              Biznesinizin ölçüsünə uyğun plan seçin. Pulsuz başlayın, böyüdükcə yüksəlin.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="pb-16 lg:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {plans.map((plan, index) => (
              <PlanCard key={plan.id} plan={plan} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Commission Rates */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#1F2937] mb-4 font-[Manrope]">
              Komissiya Dərəcələri
            </h2>
            <p className="text-[#6B7280] max-w-2xl mx-auto">
              Nə qədər çox satış etsəniz, komissiya dərəcəniz bir o qədər aşağı olar
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {commissionRates.map((rate, index) => (
              <Card key={index} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#D90429]/10 flex items-center justify-center text-[#D90429]">
                  <TrendingUp className="w-8 h-8" />
                </div>
                <p className="text-sm text-[#6B7280] mb-2">{rate.range}</p>
                <p className="text-4xl font-bold text-[#D90429] font-[Manrope] mb-2">
                  {rate.rate}
                </p>
                <p className="text-sm text-[#6B7280]">{rate.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Comparison */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#1F2937] mb-4 font-[Manrope]">
              Xüsusiyyət Müqayisəsi
            </h2>
            <p className="text-[#6B7280]">
              Planlar arasındakı fərqləri görün
            </p>
          </div>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#1F2937]">Xüsusiyyət</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-[#1F2937]">Basic</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-[#D90429]">Pro</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-[#1F2937]">Elite</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  <tr>
                    <td className="px-6 py-4 text-sm text-[#1F2937]">Sifariş limiti</td>
                    <td className="px-6 py-4 text-center text-sm text-[#6B7280]">3 aktiv</td>
                    <td className="px-6 py-4 text-center text-sm text-[#16A34A] font-medium">Limitsiz</td>
                    <td className="px-6 py-4 text-center text-sm text-[#16A34A] font-medium">Limitsiz</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-[#1F2937]">Analitika</td>
                    <td className="px-6 py-4 text-center text-sm text-[#6B7280]">Əsas</td>
                    <td className="px-6 py-4 text-center text-sm text-[#16A34A] font-medium">Tam</td>
                    <td className="px-6 py-4 text-center text-sm text-[#16A34A] font-medium">Tam + API</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-[#1F2937]">Dəstək</td>
                    <td className="px-6 py-4 text-center text-sm text-[#6B7280]">Email</td>
                    <td className="px-6 py-4 text-center text-sm text-[#16A34A] font-medium">7/24</td>
                    <td className="px-6 py-4 text-center text-sm text-[#16A34A] font-medium">Premium</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-[#1F2937]">Komissiya</td>
                    <td className="px-6 py-4 text-center text-sm text-[#6B7280]">15%</td>
                    <td className="px-6 py-4 text-center text-sm text-[#16A34A] font-medium">10%</td>
                    <td className="px-6 py-4 text-center text-sm text-[#16A34A] font-medium">5%</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-[#1F2937]">Portfolio</td>
                    <td className="px-6 py-4 text-center"><X className="w-5 h-5 text-gray-300 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-[#16A34A] mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-[#16A34A] mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-[#1F2937]">Şəxsi menecer</td>
                    <td className="px-6 py-4 text-center"><X className="w-5 h-5 text-gray-300 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><X className="w-5 h-5 text-gray-300 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-[#16A34A] mx-auto" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#1F2937] mb-4 font-[Manrope]">
              Tez-tez Verilən Suallar
            </h2>
          </div>

          <div className="space-y-4">
            <Card>
              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer list-none font-semibold text-[#1F2937]">
                  Planımı istədiyim vaxt dəyişə bilərəmmi?
                  <span className="transition-transform group-open:rotate-180">▼</span>
                </summary>
                <p className="mt-4 text-[#6B7280]">
                  Bəli, istədiyiniz vaxt planınızı yüksəldə və ya aşağı sala bilərsiniz. Dəyişiklik növbəti faktura dövründə qüvvəyə minir.
                </p>
              </details>
            </Card>
            <Card>
              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer list-none font-semibold text-[#1F2937]">
                  Komissiya necə hesablanır?
                  <span className="transition-transform group-open:rotate-180">▼</span>
                </summary>
                <p className="mt-4 text-[#6B7280]">
                  Komissiya hər ayın sonunda ümumi satış məbləğinizə görə hesablanır. Məsələn, əgər ayda 3,000 AZN satış etmisinizsə, 10% komissiya ödəyirsiniz.
                </p>
              </details>
            </Card>
            <Card>
              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer list-none font-semibold text-[#1F2937]">
                  Pulsuz planla nə qədər işləyə bilərəm?
                  <span className="transition-transform group-open:rotate-180">▼</span>
                </summary>
                <p className="mt-4 text-[#6B7280]">
                  Basic planı limitsiz istifadə edə bilərsiniz. Ancaq 3-dən çox aktiv sifarişiniz ola bilməz və bəzi premium xüsusiyyətlər məhdud olacaq.
                </p>
              </details>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="bg-gradient-to-br from-[#D90429] to-[#EF476F] text-white text-center border-none">
            <h2 className="text-3xl font-bold mb-4 font-[Manrope]">
              Hazırsınız?
            </h2>
            <p className="text-white/80 mb-6 max-w-xl mx-auto">
              Bu gün başlayın və reklam ekosistemimizin bir hissəsi olun. Pulsuz Basic planı ilə başlayın, biznesiniz böyüdükcə yüksəlin.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button variant="secondary" className="bg-white text-[#D90429] border-none hover:bg-gray-100">
                  Pulsuz Başla
                </Button>
              </Link>
              <Link href="/marketplace">
                <Button variant="ghost" className="text-white hover:bg-white/10">
                  Marketplace
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1F2937] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#D90429] flex items-center justify-center">
                  <span className="text-white font-bold text-xl">D</span>
                </div>
                <span className="font-bold text-xl font-[Manrope]">Premium Reklam</span>
              </div>
              <p className="text-gray-400 text-sm">
                Premium dekor xidmətləri ilə evinizi və ofisinizi bəzəyin.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Məhsul</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Xüsusiyyətlər</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Qiymətlər</a></li>
                <li><a href="#" className="hover:text-white transition-colors">İnteqrasiyalar</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Şirkət</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Haqqımızda</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Komanda</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Karyera</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Əlaqə</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Dəstək</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Yardım Mərkəzi</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status Səhifəsi</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Şərtlər</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Gizlilik</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-400 text-sm">
            © 2024 Premium Reklam. Bütün hüquqlar qorunur.
          </div>
        </div>
      </footer>
    </main>
  );
}