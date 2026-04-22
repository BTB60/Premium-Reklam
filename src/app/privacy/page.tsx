import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Gizlilik Siyasəti",
  description:
    "Premium Reklam platformasında şəxsi məlumatların toplanması, istifadəsi və qorunması qaydaları.",
};

export default function PrivacyPolicyPage() {
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

        <h1 className="text-3xl sm:text-4xl font-bold text-[#1F2937] tracking-tight">Gizlilik Siyasəti</h1>
        <p className="mt-3 text-sm text-[#6B7280]">
          Son yenilənmə: 21 aprel 2026 · Premium Reklam (“biz”, “platforma”) olaraq şəxsi məlumatlarınızı
          Azərbaycan Respublikasının qanunvericiliyinə uyğun və şəffaf şəkildə emal edirik.
        </p>

        <div className="mt-10 space-y-10 text-[#374151] text-[15px] leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-[#1F2937] mb-3">1. Ümumi</h2>
            <p>
              Bu siyasət veb saytı və mobil brauzer vasitəsilə əlçatan olan Premium Reklam xidmətlərindən
              istifadə etdikdə şəxsi məlumatlarınızın necə toplanması, saxlanması və istifadəsi barədə
              məlumat verir. Xidmətdən istifadə etməklə bu siyasəti qəbul etmiş sayılırsınız.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1F2937] mb-3">2. Hansı məlumatları toplayırıq</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Qeydiyyat və hesab:</strong> ad, istifadəçi adı, e-poçt, telefon nömrəsi, şifrə
                (yalnız təhlükəsiz saxlama üsulu ilə, adətən hash).
              </li>
              <li>
                <strong>Sifariş və əməliyyatlar:</strong> çatdırılma/əlaqə məlumatları, sifariş təsviri,
                məhsul ölçüləri, məbləğlər, sifariş statusu, ödəniş üsulu barədə ümumi məlumat.
              </li>
              <li>
                <strong>Ödəniş təsdiqləri:</strong> ödəniş qəbzinin şəkli və ya faylı (siz yüklədikdə),
                sorğu məbləği və status.
              </li>
              <li>
                <strong>Dəstək və bildirişlər:</strong> dəstək çatında yazdığınız mətn və əlavələr
                (şəkil/video), sistem bildirişləri və elanlar üzrə göstəricilər.
              </li>
              <li>
                <strong>Texniki məlumat:</strong> IP ünvanı, brauzer/növ cihaz, sessiya və təhlükəsizlik
                üçün JWT token, xəta jurnalları (şəxsiyyəti birbaşa açılmayan formada).
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1F2937] mb-3">3. Məqsəd və hüquqi əsas</h2>
            <p className="mb-2">Məlumatlar əsasən bu məqsədlərlə emal olunur:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>hesabın yaradılması və təhlükəsiz giriş;</li>
              <li>sifarişlərin qəbulu, hazırlanması və çatdırılması;</li>
              <li>ödəniş sorğularının yoxlanması və borc/hesab uyğunlaşdırılması;</li>
              <li>müştəri dəstəyi və vacib bildirişlər (sifariş, ödəniş, sistem);</li>
              <li>fırıldaqçılığın qarşısının alınması, hüquqi öhdəliklərin yerinə yetirilməsi.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1F2937] mb-3">4. Saxlama və təhlükəsizlik</h2>
            <p>
              Məlumatlar müvafiq təhlükəsizlik tədbirləri ilə serverlərdə saxlanılır. Şifrələr açıq mətn
              kimi saxlanılmır. Ödəniş kartı məlumatları birbaşa bizdə toplanmır; ödənişlər üzrə yalnız sizin
              təqdim etdiyiniz təsdiq sənədləri və əməliyyat qeydləri işlənə bilər.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1F2937] mb-3">5. Paylaşım</h2>
            <p>
              Məlumatlarınızı satmırıq. Yalnız zəruri olduqda etibarlı texniki xidmət təminatçılarına
              (hostinq, e-poçt, analitika — tətbiq olunduğu təqdirdə) və ya qanuni tələb üzrə dövlət
              orqanlarına ötürülə bilər.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1F2937] mb-3">6. Sizin hüquqlarınız</h2>
            <p className="mb-2">
              Ölkə qanunları çərçivəsində şəxsi məlumatlarınıza çıxış, düzəliş və müəyyən hallarda silinmə
              və ya emala etiraz hüququna maliksiniz. Sorğularınızı platforma üzərindən dəstək kanalı və ya
              şirkətin elan etdiyi əlaqə vasitəsi ilə göndərə bilərsiniz.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1F2937] mb-3">7. Kukilər və lokal yaddaş</h2>
            <p>
              Brauzerinizdə sessiya, dil seçimi və təhlükəsizlik üçün lokal yaddaş (məsələn,{" "}
              <code className="text-sm bg-gray-100 px-1 rounded">localStorage</code>) istifadə oluna bilər.
              Bu, xidmətin işləməsi üçün vacib funksiyalar üçündür. Brauzer parametrlərindən kukiləri
              məhdudlaşdıra bilərsiniz; bu halda bəzi funksiyalar düzgün işləməyə bilər.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1F2937] mb-3">8. Uşaqlar</h2>
            <p>
              Xidmət 18 yaşdan aşağı şəxslər üçün nəzərdə tutulmayıb; onlardan şəxsi məlumat qəsdən tələb etmirik.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1F2937] mb-3">9. Dəyişikliklər</h2>
            <p>
              Bu siyasəti yeniləyə bilərik. Əhəmiyyətli dəyişikliklər barədə platforma və ya e-poçt vasitəsilə
              bildiriş verilə bilər. Yenilənmiş mətn həmişə bu səhifədə dərc olunur.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1F2937] mb-3">10. Əlaqə</h2>
            <p>
              Gizlilik ilə bağlı suallar üçün veb saytdakı əlaqə bölməsindən və ya qeydiyyat zamanı
              göstərdiyiniz üsulla bizimlə əlaqə saxlayın.
            </p>
          </section>
        </div>

        <p className="mt-12 text-sm text-[#9CA3AF]">
          Ətraflı hüquqi şərtlər üçün{" "}
          <Link href="/terms" className="text-[#D90429] hover:underline">
            İstifadə şərtləri
          </Link>{" "}
          səhifəsinə baxın.
        </p>
      </article>
    </div>
  );
}
