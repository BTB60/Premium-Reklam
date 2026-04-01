"use client";

import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { OrderTimeline, OrderStatusBadge, OrderStatus } from "@/components/ui/OrderTimeline";
import { 
  ChevronLeft, 
  Download, 
  MessageSquare, 
  FileText,
  Printer,
  Ruler,
  CreditCard,
  Calendar,
  User,
  Phone,
  MapPin
} from "lucide-react";
import Link from "next/link";

// Mock order data
const orderData = {
  id: "ORD-2024-001",
  status: "production" as OrderStatus,
  createdAt: "09.03.2024 14:30",
  customer: {
    name: "Aygün Məmmədova",
    phone: "+994 50 123 45 67",
    address: "Bakı, Nizami r., H. Cavid pr. 47",
  },
  product: {
    name: "Premium Pərdə",
    category: "Pərdə",
    pricePerUnit: 45,
  },
  sizes: [
    { width: 3.5, height: 2.8, area: 9.8 },
    { width: 2.2, height: 2.8, area: 6.16 },
  ],
  files: [
    { name: "dizayn_v1.pdf", size: "2.4 MB", type: "pdf" },
    { name: "olcu_skemasi.jpg", size: "1.8 MB", type: "image" },
  ],
  notes: "Otaq şimal tərəfə baxır, günəş işığı çox düşür. Qalın və qaranlıq rəng seçilsin.",
  payment: {
    method: "Nağd",
    status: "pending",
    totalArea: 15.96,
    unitPrice: 45,
    subtotal: 718.2,
    discount: 0,
    total: 718.2,
    paid: 0,
    remaining: 718.2,
  },
  timeline: [
    { status: "pending", date: "09.03.2024 14:30", note: "Sifariş yaradıldı" },
    { status: "approved", date: "09.03.2024 15:45", note: "Admin tərəfindən təsdiqləndi" },
    { status: "design", date: "10.03.2024 09:20", note: "Dizayn yoxlanılır" },
    { status: "printing", date: "10.03.2024 14:00", note: "Çap prosesinə başlandı" },
    { status: "production", date: "11.03.2024 10:30", note: "Hazırlanır" },
  ],
  estimatedReady: "13.03.2024",
};

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  return (
    <main className="min-h-screen bg-[#F8F9FB] pb-24 md:pb-8">
      <Header variant="decorator" userName="Əli Vəliyev" />
      
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Back Button */}
        <Link
          href="/dashboard/orders"
          className="inline-flex items-center gap-2 text-[#6B7280] hover:text-[#D90429] transition-colors mb-4"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Sifarişlərə Qayıt</span>
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#1F2937] font-[Manrope]">
              Sifariş #{orderData.id}
            </h1>
            <p className="text-[#6B7280] text-sm mt-1">
              Yaradılma tarixi: {orderData.createdAt}
            </p>
          </div>
          <OrderStatusBadge status={orderData.status} />
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column - Timeline */}
          <div className="space-y-6">
            <Card>
              <h2 className="text-lg font-bold text-[#1F2937] font-[Manrope] mb-4">
                Sifariş Vəziyyəti
              </h2>
              <OrderTimeline currentStatus={orderData.status} />
            </Card>

            {/* Customer Info */}
            <Card>
              <h2 className="text-lg font-bold text-[#1F2937] font-[Manrope] mb-4">
                Müştəri Məlumatları
              </h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#D90429]/10 flex items-center justify-center text-[#D90429]">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-[#6B7280]">Ad Soyad</p>
                    <p className="font-medium text-[#1F2937]">{orderData.customer.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#D90429]/10 flex items-center justify-center text-[#D90429]">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-[#6B7280]">Telefon</p>
                    <p className="font-medium text-[#1F2937]">{orderData.customer.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#D90429]/10 flex items-center justify-center text-[#D90429]">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-[#6B7280]">Ünvan</p>
                    <p className="font-medium text-[#1F2937]">{orderData.customer.address}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Notes */}
            <Card>
              <h2 className="text-lg font-bold text-[#1F2937] font-[Manrope] mb-4">
                Əlavə Qeydlər
              </h2>
              <p className="text-[#6B7280] bg-gray-50 p-4 rounded-xl">
                {orderData.notes}
              </p>
            </Card>
          </div>

          {/* Right Column - Details */}
          <div className="space-y-6">
            {/* Product Info */}
            <Card>
              <h2 className="text-lg font-bold text-[#1F2937] font-[Manrope] mb-4">
                Məhsul Məlumatları
              </h2>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#D90429]/20 to-[#EF476F]/20 flex items-center justify-center">
                  <Printer className="w-8 h-8 text-[#D90429]" />
                </div>
                <div>
                  <p className="font-bold text-[#1F2937]">{orderData.product.name}</p>
                  <p className="text-sm text-[#6B7280]">{orderData.product.category}</p>
                  <p className="text-[#D90429] font-semibold">{orderData.product.pricePerUnit} AZN/m²</p>
                </div>
              </div>
            </Card>

            {/* Sizes */}
            <Card>
              <h2 className="text-lg font-bold text-[#1F2937] font-[Manrope] mb-4">
                Ölçülər
              </h2>
              <div className="space-y-3">
                {orderData.sizes.map((size, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#D90429]/10 flex items-center justify-center text-[#D90429]">
                        <Ruler className="w-4 h-4" />
                      </div>
                      <span className="text-sm text-[#6B7280]">Ölçü {index + 1}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-[#1F2937]">{size.width} × {size.height} m</p>
                      <p className="text-sm text-[#6B7280]">{size.area} m²</p>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-3 border-t border-[#E5E7EB]">
                  <span className="font-medium text-[#1F2937]">Ümumi Sahə</span>
                  <span className="font-bold text-[#D90429]">{orderData.payment.totalArea} m²</span>
                </div>
              </div>
            </Card>

            {/* Files */}
            <Card>
              <h2 className="text-lg font-bold text-[#1F2937] font-[Manrope] mb-4">
                Fayllar
              </h2>
              <div className="space-y-3">
                {orderData.files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#D90429]/10 flex items-center justify-center text-[#D90429]">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-[#1F2937] text-sm">{file.name}</p>
                        <p className="text-xs text-[#6B7280]">{file.size}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" icon={<Download className="w-4 h-4" />}>
                      Yüklə
                    </Button>
                  </div>
                ))}
              </div>
            </Card>

            {/* Payment Summary */}
            <Card>
              <h2 className="text-lg font-bold text-[#1F2937] font-[Manrope] mb-4">
                Ödəniş Məlumatları
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280]">Ödəniş üsulu</span>
                  <span className="font-medium text-[#1F2937]">{orderData.payment.method}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280]">Məhsul qiyməti</span>
                  <span className="font-medium text-[#1F2937]">{orderData.payment.subtotal} AZN</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280]">Endirim</span>
                  <span className="font-medium text-[#16A34A]">-{orderData.payment.discount} AZN</span>
                </div>
                <div className="pt-3 border-t border-[#E5E7EB]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-[#1F2937]">Ümumi</span>
                    <span className="font-bold text-xl text-[#D90429] font-[Manrope]">{orderData.payment.total} AZN</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#6B7280]">Ödənilib: {orderData.payment.paid} AZN</span>
                    <span className="text-[#DC2626]">Qalıq: {orderData.payment.remaining} AZN</span>
                  </div>
                </div>
              </div>
              <Button className="w-full mt-4" icon={<CreditCard className="w-5 h-5" />}>
                Ödəniş Et
              </Button>
            </Card>

            {/* Estimated Ready */}
            <div className="flex items-center gap-3 p-4 bg-[#D90429]/5 rounded-xl border border-[#D90429]/20">
              <div className="w-10 h-10 rounded-lg bg-[#D90429]/10 flex items-center justify-center text-[#D90429]">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-[#6B7280]">Təxmini hazır olma tarixi</p>
                <p className="font-bold text-[#1F2937]">{orderData.estimatedReady}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <MobileNav variant="decorator" />
    </main>
  );
}