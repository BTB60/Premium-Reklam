"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  OrderTimeline,
  OrderStatusBadge,
  OrderStatus,
  normalizeOrderTimelineStatus,
} from "@/components/ui/OrderTimeline";
import { orders as ordersDb } from "@/lib/db/orders";
import { auth } from "@/lib/db/auth";
import type { Order } from "@/lib/db/types";
import {
  formatReadyCountdown,
  getReadyCountdownParts,
  isOrderOverdue,
  shouldShowReadyCountdown,
} from "@/lib/orderDelay";
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
  MapPin,
  Timer
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
  estimatedReadyAt: null,
  overdue: false,
  countdownActive: false,
};

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    if (!currentUser) {
      router.push("/login");
      return;
    }

    const found = ordersDb.getById(params.id);
    if (found && String(found.userId) === String(currentUser.id)) {
      setOrder(found);
    } else {
      setOrder(null);
    }
    setLoading(false);
  }, [params.id, router]);

  const displayOrder = useMemo(() => {
    if (!order) return orderData;

    const firstItem = order.items?.[0];
    const sizes = (order.items || []).map((item) => ({
      width: Number(item.width || 0),
      height: Number(item.height || 0),
      area: Number(item.width || 0) * Number(item.height || 0) * Number(item.quantity || 1),
    }));
    const subtotal = Number(order.subtotal ?? order.finalTotal ?? order.totalAmount ?? 0);
    const total = Number(order.finalTotal ?? order.totalAmount ?? subtotal);
    const paid = Number(order.paidAmount ?? 0);

    return {
      id: order.orderNumber || order.id,
      status: normalizeOrderTimelineStatus(order.workflowStatus || order.status),
      createdAt: new Date(order.createdAt).toLocaleString("az-AZ"),
      customer: {
        name: order.customerName || "Müştəri",
        phone: order.customerPhone || order.customerWhatsapp || "-",
        address: order.customerAddress || "-",
      },
      product: {
        name: firstItem?.productName || "Sifariş məhsulu",
        category: (order.items || []).length > 1 ? `${order.items.length} məhsul` : "Məhsul",
        pricePerUnit: Number(firstItem?.unitPrice || 0),
      },
      sizes,
      files: [],
      notes: order.note || "Əlavə qeyd yoxdur.",
      payment: {
        method: order.paymentMethod || "debt",
        status: order.paymentStatus || "pending",
        totalArea: sizes.reduce((sum, s) => sum + s.area, 0),
        unitPrice: Number(firstItem?.unitPrice || 0),
        subtotal,
        discount: Number(order.discountTotal || 0),
        total,
        paid,
        remaining: Number(order.remainingAmount ?? Math.max(0, total - paid)),
      },
      estimatedReady: order.estimatedReadyAt
        ? new Date(order.estimatedReadyAt).toLocaleString("az-AZ")
        : order.workflowStatus === "bitdi"
          ? "Tamamlandı"
          : "Admin təyin etdikdə burada görünəcək",
      overdue: isOrderOverdue({
        status: order.workflowStatus || order.status,
        estimatedReadyAt: order.estimatedReadyAt,
      }),
      countdownActive: shouldShowReadyCountdown({
        status: order.workflowStatus || order.status,
        estimatedReadyAt: order.estimatedReadyAt,
      }),
      estimatedReadyAt: order.estimatedReadyAt || null,
    };
  }, [order]);

  const countdownParts = getReadyCountdownParts(displayOrder.estimatedReadyAt, nowMs);
  const countdownText = formatReadyCountdown(displayOrder.estimatedReadyAt, nowMs);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F8F9FB] pb-24 md:pb-8">
        <Header variant="decorator" />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center text-[#6B7280]">
          Sifariş yüklənir...
        </div>
        <MobileNav variant="decorator" />
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-[#F8F9FB] pb-24 md:pb-8">
        <Header variant="decorator" />
        <div className="max-w-4xl mx-auto px-4 py-20">
          <Card className="p-8 text-center">
            <h1 className="text-xl font-bold text-[#1F2937] mb-2">Sifariş tapılmadı</h1>
            <p className="text-[#6B7280] mb-5">Bu sifariş mövcud deyil və ya sizin hesaba aid deyil.</p>
            <Link href="/dashboard/orders">
              <Button>Sifarişlərə qayıt</Button>
            </Link>
          </Card>
        </div>
        <MobileNav variant="decorator" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8F9FB] pb-24 md:pb-8">
      <Header variant="decorator" />
      
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
              Sifariş #{displayOrder.id}
            </h1>
            <p className="text-[#6B7280] text-sm mt-1">
              Yaradılma tarixi: {displayOrder.createdAt}
            </p>
          </div>
          <OrderStatusBadge status={displayOrder.status as OrderStatus} />
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column - Timeline */}
          <div className="space-y-6">
            <Card>
              <h2 className="text-lg font-bold text-[#1F2937] font-[Manrope] mb-4">
                Sifariş Vəziyyəti
              </h2>
              <OrderTimeline currentStatus={displayOrder.status as OrderStatus} />
            </Card>

            {/* Customer Info */}
            <Card>
              <h2 className="text-lg font-bold text-[#1F2937] font-[Manrope] mb-4">
                Dekor məlumatları
              </h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#D90429]/10 flex items-center justify-center text-[#D90429]">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-[#6B7280]">Dekor adı</p>
                    <p className="font-medium text-[#1F2937]">{displayOrder.customer.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#D90429]/10 flex items-center justify-center text-[#D90429]">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-[#6B7280]">Telefon</p>
                    <p className="font-medium text-[#1F2937]">{displayOrder.customer.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#D90429]/10 flex items-center justify-center text-[#D90429]">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-[#6B7280]">Ünvan</p>
                    <p className="font-medium text-[#1F2937]">{displayOrder.customer.address}</p>
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
                {displayOrder.notes}
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
                  <p className="font-bold text-[#1F2937]">{displayOrder.product.name}</p>
                  <p className="text-sm text-[#6B7280]">{displayOrder.product.category}</p>
                  <p className="text-[#D90429] font-semibold">{displayOrder.product.pricePerUnit} AZN/m²</p>
                </div>
              </div>
            </Card>

            {/* Sizes */}
            <Card>
              <h2 className="text-lg font-bold text-[#1F2937] font-[Manrope] mb-4">
                Ölçülər
              </h2>
              <div className="space-y-3">
                {displayOrder.sizes.map((size, index) => (
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
                  <span className="font-bold text-[#D90429]">{displayOrder.payment.totalArea.toFixed(2)} m²</span>
                </div>
              </div>
            </Card>

            {/* Files */}
            <Card>
              <h2 className="text-lg font-bold text-[#1F2937] font-[Manrope] mb-4">
                Fayllar
              </h2>
              <div className="space-y-3">
                {displayOrder.files.length > 0 ? displayOrder.files.map((file, index) => (
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
                )) : (
                  <p className="text-sm text-[#6B7280] bg-gray-50 rounded-xl p-3">Bu sifarişə fayl əlavə edilməyib.</p>
                )}
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
                  <span className="font-medium text-[#1F2937]">{displayOrder.payment.method}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280]">Məhsul qiyməti</span>
                  <span className="font-medium text-[#1F2937]">{displayOrder.payment.subtotal.toFixed(2)} AZN</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280]">Endirim</span>
                  <span className="font-medium text-[#16A34A]">-{displayOrder.payment.discount.toFixed(2)} AZN</span>
                </div>
                <div className="pt-3 border-t border-[#E5E7EB]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-[#1F2937]">Ümumi</span>
                    <span className="font-bold text-xl text-[#D90429] font-[Manrope]">{displayOrder.payment.total.toFixed(2)} AZN</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#6B7280]">Ödənilib: {displayOrder.payment.paid.toFixed(2)} AZN</span>
                    <span className="text-[#DC2626]">Qalıq: {displayOrder.payment.remaining.toFixed(2)} AZN</span>
                  </div>
                </div>
              </div>
              <Button className="w-full mt-4" icon={<CreditCard className="w-5 h-5" />}>
                Ödəniş Et
              </Button>
            </Card>

            {/* Estimated Ready */}
            <div
              className={`flex items-center gap-3 p-4 rounded-xl border ${
                displayOrder.overdue
                  ? "bg-red-50 border-red-200"
                  : "bg-[#D90429]/5 border-[#D90429]/20"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  displayOrder.overdue ? "bg-red-100 text-red-600" : "bg-[#D90429]/10 text-[#D90429]"
                }`}
              >
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-[#6B7280]">Təyin edilmiş təhvil tarixi</p>
                <p className="font-bold text-[#1F2937]">{displayOrder.estimatedReady}</p>
                {displayOrder.countdownActive && countdownParts && (
                  <div
                    className={`mt-3 rounded-xl border p-3 ${
                      countdownParts.overdue
                        ? "bg-red-100 border-red-200 text-red-800"
                        : "bg-white border-[#F3F4F6] text-[#1F2937]"
                    }`}
                  >
                    <p className="text-xs font-medium flex items-center gap-1 mb-2">
                      <Timer className="w-4 h-4" />
                      {countdownParts.overdue ? "Təhvil vaxtı keçib" : "Təhvil vaxtına geri sayım"}
                    </p>
                    <p className="text-xl font-black tracking-tight">{countdownText}</p>
                  </div>
                )}
                {displayOrder.overdue && !displayOrder.countdownActive && (
                  <p className="text-xs font-semibold text-red-700 mt-1">
                    Bu sifariş təyin edilmiş tarixdən gecikir.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <MobileNav variant="decorator" />
    </main>
  );
}