import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "İstifadə şərtləri",
  description: "Premium Reklam platformasından istifadə qaydaları və öhdəliklər.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <Header variant="public" />
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14 pb-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#D90429] transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Ana səhifəyə qayıt
        </Link>

        <h1 className="text-3xl sm:text-4xl font-bold text-[#1F2937] tracking-tight">İstifadə şərtləri</h1>
        <p className="mt-3 text-sm text-[#6B7280]">Son yenilənmə: 21 aprel 2026</p>

        <div className="mt-10 space-y-10 text-[#374151] text-[15px] leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-[#1F2937] mb-3">1. Xidmətin təsviri</h2>
            <p>
              Premium Reklam onlayn platforması reklam və dekor məhsulları üzrə sifariş, hesab idarəetməsi,
              ödəniş sorğuları və müştəri dəstəyi funksiyalarını təqdim edir. Xidmətdən istifadə bu şərtlərə
              riayət etməyi tələb edir.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1F2937] mb-3">2. Hesab və təhlükəsizlik</h2>
            <p>
              Doğru məlumat vermək və giriş məlumatlarınızı qorumaq sizin öhdəliyinizdədir. Şübhəli
              fəaliyyət aşkar edilərsə, hesab müvəqqəti dayandırıla bilər.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1F2937] mb-3">3. Sifarişlər və qiymətlər</h2>
            <p>
              Sifarişlər təsdiq və istehsal prosesinə tabedir. Qiymətlər və çatdırılma şərtləri sifariş
              anında göstərilən və ya razılaşdırılan məlumatlar əsasında həyata keçirilir.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1F2937] mb-3">4. Ödənişlər</h2>
            <p>
              Ödəniş sorğuları yoxlamadan sonra təsdiq və ya rədd edilə bilər. Borc və ödəniş qaydaları
              hesabınızda əks olunan qaydalara uyğun tətbiq olunur.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1F2937] mb-3">5. Məsuliyyətin məhdudlaşdırılması</h2>
            <p>
              Platforma “olduğu kimi” təqdim olunur. Qanunla icazə verilən hədddə, dolayı zərərə görə
              məsuliyyət istisna edilə və ya məhdudlaşdırıla bilər.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1F2937] mb-3">6. Dəyişikliklər</h2>
            <p>
              Şərtlər yenilənə bilər. Davam edən istifadə yenilənmiş şərtlərin qəbulu kimi şərh oluna
              bilər.
            </p>
          </section>
        </div>

        <p className="mt-12 text-sm text-[#9CA3AF]">
          Şəxsi məlumatlar üçün{" "}
          <Link href="/privacy" className="text-[#D90429] hover:underline">
            Gizlilik siyasəti
          </Link>
          .
        </p>
      </article>
    </div>
  );
}
