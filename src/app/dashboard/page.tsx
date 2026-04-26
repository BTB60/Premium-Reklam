"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  orderApi,
  productApi,
  authApi,
  isOrderCancelled,
  orderCountsTowardLoyaltySpend,
  loyaltySpendAmountAzn,
  type OrderSummary,
} from "@/lib/authApi";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { motion, AnimatePresence } from "framer-motion";
import {
  fetchMyClientPaymentRequests,
  submitClientPaymentRequest,
  type ClientPaymentRequestRow,
} from "@/lib/clientPaymentNotificationsApi";
import { playPremiumNotificationSound } from "@/lib/notificationSound";
import {
  getLoyaltyBonusProgress,
  isLoyaltyBonusProgramEnabled,
  LOYALTY_FIRST_THRESHOLD_AZN,
  LOYALTY_SECOND_THRESHOLD_AZN,
  getLoyaltyPercentages,
  loyaltyOverrideFromProfile,
  type LoyaltyPercentOverride,
} from "@/lib/db";
import { 
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Package, 
  Bell, 
  Settings, 
  Award,
  Plus,
  Eye,
  Clock,
  CheckCircle,
  User,
  ShoppingBag,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  Wallet,
  CreditCard,
  Banknote,
  X,
  Repeat,
  MessageCircle,
  Route,
  Calculator,
  ImagePlus,
  FileDown,
  ChevronLeft,
  ChevronRight,
  Calendar,
  BarChart3,
  History,
} from "lucide-react";

function getCurrentYearMonth(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`;
}

function parseOrderCreatedAt(o: any): Date | null {
  const raw = o?.createdAt ?? o?.created_at;
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function parsePaymentCreatedAt(iso: string): Date | null {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function dateInYearMonth(d: Date, ym: string): boolean {
  const [y, m] = ym.split("-").map(Number);
  return d.getFullYear() === y && d.getMonth() + 1 === m;
}

function MiniSparkline({ data, color = "#ff6600" }: { data: number[]; color?: string }) {
  const width = 64;
  const height = 20;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = Math.max(1, max - min);
  const points = data
    .map((v, i) => {
      const x = data.length === 1 ? 0 : (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 3) - 1.5;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-4 w-full max-w-[4rem] shrink-0 overflow-hidden"
      preserveAspectRatio="none"
      aria-hidden
    >
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DashboardMetricCard({
  label,
  value,
  hint,
  icon: Icon,
  color,
  trend,
}: {
  label: string;
  value: string;
  hint: string;
  icon: any;
  color: string;
  trend: number[];
}) {
  return (
    <div className="rounded-xl border border-[#E5E9F0] bg-white p-2.5 sm:p-3 shadow-sm min-w-0 max-w-full overflow-hidden">
      <div className="flex items-center gap-2 min-w-0">
        <div
          className="w-7 h-7 rounded-lg flex shrink-0 items-center justify-center"
          style={{ backgroundColor: `${color}14`, color }}
        >
          <Icon className="w-3.5 h-3.5" />
        </div>
        <p className="text-[10px] font-medium uppercase tracking-wide text-[#64748B] truncate min-w-0 flex-1 leading-tight">
          {label}
        </p>
        <MiniSparkline data={trend} color={color} />
      </div>
      <p className="mt-1.5 text-sm sm:text-base font-bold text-[#0F172A] tabular-nums leading-tight truncate" title={value}>
        {value}
      </p>
      <p className="mt-1 text-[10px] text-[#94A3B8] leading-snug line-clamp-2">{hint}</p>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [orderSummary, setOrderSummary] = useState<OrderSummary | null>(null);
  const [orderBlocked, setOrderBlocked] = useState(false);
  const [nextWeeklyDueDate, setNextWeeklyDueDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"home" | "history">("home");
  const [clientPayAmount, setClientPayAmount] = useState("");
  const [clientPayReceiptData, setClientPayReceiptData] = useState<string>("");
  const [clientPayReceiptName, setClientPayReceiptName] = useState<string>("");
  const [clientPayBusy, setClientPayBusy] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<ClientPaymentRequestRow[]>([]);
  const [historyQuery, setHistoryQuery] = useState("");
  const [historyType, setHistoryType] = useState<"all" | "orders" | "payments">("all");
  const [historyPaymentStatus, setHistoryPaymentStatus] = useState<"all" | "PENDING" | "APPROVED" | "REJECTED">("all");
  const [historyMonthKey, setHistoryMonthKey] = useState(getCurrentYearMonth);
  const [historyDay, setHistoryDay] = useState<number | null>(null);

  const [paymentOverviewMode, setPaymentOverviewMode] = useState<"month" | "year">("month");
  const [paymentOverviewMonthKey, setPaymentOverviewMonthKey] = useState(getCurrentYearMonth);
  const [paymentOverviewYear, setPaymentOverviewYear] = useState(() => new Date().getFullYear());

  const [loyaltyProfileOverride, setLoyaltyProfileOverride] = useState<LoyaltyPercentOverride>(null);
  const [hasCustomUserPrices, setHasCustomUserPrices] = useState(false);

  useEffect(() => {
    const currentUser = authApi.getCurrentUser();
    if (!currentUser) return;
    setUser(currentUser);
    loadData();
  }, [router]);

  useEffect(() => {
    const onBalanceUpdated = () => {
      void loadData();
    };
    window.addEventListener("premium:user-balance-updated", onBalanceUpdated);
    return () => window.removeEventListener("premium:user-balance-updated", onBalanceUpdated);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const user = authApi.getCurrentUser();
      const uid = user ? Number(user.userId) : NaN;
      const userPricesPromise =
        Number.isFinite(uid) && uid > 0
          ? productApi.getUserPrices(uid).catch(() => [])
          : Promise.resolve([]);

      const [ordersResponse, profile, myPayments, userPricesRows] = await Promise.all([
        orderApi.getMyOrders(),
        authApi.getMyProfile().catch(() => null),
        fetchMyClientPaymentRequests().catch(() => []),
        userPricesPromise,
      ]);
      setHasCustomUserPrices(Array.isArray(userPricesRows) && userPricesRows.length > 0);
      const ordersData = ordersResponse as any;
      const orders = ordersData.orders || [];
      setUserOrders(orders);
      
      const today = new Date().toISOString().split('T')[0];
      const monthStart = today.substring(0, 7) + '-01';
      
      const todayOrders = orders.filter((o: any) => {
        if (isOrderCancelled(o)) return false;
        const orderDate = (o.createdAt || '').split('T')[0];
        return orderDate === today;
      });
      
      const monthOrders = orders.filter((o: any) => {
        if (isOrderCancelled(o)) return false;
        const orderDate = o.createdAt || "";
        return orderDate >= monthStart;
      });
      const monthOrdersForBonus = monthOrders.filter((o: any) => orderCountsTowardLoyaltySpend(o));
      
      const activeOrders = orders.filter((o: any) => !isOrderCancelled(o));
      
      const summary = {
        todayOrderCount: todayOrders.length,
        todayOrderAmount: todayOrders.reduce((sum: number, o: any) => sum + Number(o.totalAmount || 0), 0),
        monthOrderCount: monthOrders.length,
        monthOrderAmount: monthOrdersForBonus.reduce(
          (sum: number, o: any) => sum + loyaltySpendAmountAzn(o),
          0
        ),
        totalPaid: activeOrders.reduce((sum: number, o: any) => sum + Number(o.paidAmount || 0), 0),
        totalDebt:
          profile && Number.isFinite(Number((profile as any).totalDebt))
            ? Number((profile as any).totalDebt)
            : activeOrders.reduce((sum: number, o: any) => sum + Number(o.remainingAmount || 0), 0),
        totalOrders: orders.length,
        totalAmount: activeOrders.reduce((sum: number, o: any) => sum + Number(o.totalAmount || 0), 0),
      };
      
      setOrderSummary(summary);
      setLoyaltyProfileOverride(loyaltyOverrideFromProfile(profile as any));
      setOrderBlocked(Boolean((profile as any)?.orderBlocked));
      setNextWeeklyDueDate((profile as any)?.nextWeeklyDueDate ? String((profile as any).nextWeeklyDueDate) : null);
      setPaymentHistory(myPayments);
    } catch (error) {
      console.error("Data load error:", error);
      setHasCustomUserPrices(false);
      setUserOrders([]);
      setOrderSummary(null);
      setOrderBlocked(false);
      setNextWeeklyDueDate(null);
      setPaymentHistory([]);
      setLoyaltyProfileOverride(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const submitClientPaymentNotification = async () => {
    const amount = parseFloat(clientPayAmount.replace(",", "."));
    if (Number.isNaN(amount) || amount <= 0) {
      alert("Düzgün məbləğ daxil edin");
      return;
    }
    setClientPayBusy(true);
    try {
      await submitClientPaymentRequest(amount, clientPayReceiptData || undefined, clientPayReceiptName || undefined);
      setClientPayAmount("");
      setClientPayReceiptData("");
      setClientPayReceiptName("");
      await loadData();
      playPremiumNotificationSound();
      alert("Ödəniş bildirişi göndərildi. Admin təsdiqləyəndə borc yenilənəcək.");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Göndərilmədi");
    } finally {
      setClientPayBusy(false);
    }
  };

  const historyMonthLabel = useMemo(() => {
    const [y, m] = historyMonthKey.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString("az-AZ", { month: "long", year: "numeric" });
  }, [historyMonthKey]);

  const historyDaysInMonth = useMemo(() => {
    const [y, m] = historyMonthKey.split("-").map(Number);
    return new Date(y, m, 0).getDate();
  }, [historyMonthKey]);

  const canGoNextHistoryMonth = historyMonthKey < getCurrentYearMonth();

  const shiftHistoryMonth = (delta: number) => {
    const [y, m] = historyMonthKey.split("-").map(Number);
    const next = new Date(y, m - 1 + delta, 1);
    const cap = new Date();
    const capFirst = new Date(cap.getFullYear(), cap.getMonth(), 1);
    if (next > capFirst) return;
    setHistoryMonthKey(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`);
    setHistoryDay(null);
  };

  const goHistoryCurrentMonth = () => {
    setHistoryMonthKey(getCurrentYearMonth());
    setHistoryDay(null);
  };

  const ordersInHistoryPeriod = useMemo(() => {
    return userOrders.filter((o) => {
      const d = parseOrderCreatedAt(o);
      if (!d || !dateInYearMonth(d, historyMonthKey)) return false;
      if (historyDay !== null && d.getDate() !== historyDay) return false;
      return true;
    });
  }, [userOrders, historyMonthKey, historyDay]);

  const paymentsInHistoryPeriod = useMemo(() => {
    return paymentHistory.filter((p) => {
      const d = parsePaymentCreatedAt(p.createdAt);
      if (!d || !dateInYearMonth(d, historyMonthKey)) return false;
      if (historyDay !== null && d.getDate() !== historyDay) return false;
      return true;
    });
  }, [paymentHistory, historyMonthKey, historyDay]);

  const historyDaysWithActivity = useMemo(() => {
    const set = new Set<number>();
    const [y, m] = historyMonthKey.split("-").map(Number);
    for (const o of userOrders) {
      const d = parseOrderCreatedAt(o);
      if (d && d.getFullYear() === y && d.getMonth() + 1 === m) set.add(d.getDate());
    }
    for (const p of paymentHistory) {
      const d = parsePaymentCreatedAt(p.createdAt);
      if (d && d.getFullYear() === y && d.getMonth() + 1 === m) set.add(d.getDate());
    }
    return set;
  }, [userOrders, paymentHistory, historyMonthKey]);

  const filteredOrders = useMemo(() => {
    const q = historyQuery.trim().toLowerCase();
    if (!q) return ordersInHistoryPeriod;
    return ordersInHistoryPeriod.filter((o) => {
      const orderNo = String(o.orderNumber || o.order_number || o.id || "").toLowerCase();
      const customer = String(o.customerName || o.customer_name || "").toLowerCase();
      const amount = String(Number(o.totalAmount || 0).toFixed(2));
      return orderNo.includes(q) || customer.includes(q) || amount.includes(q);
    });
  }, [historyQuery, ordersInHistoryPeriod]);

  const filteredPayments = useMemo(() => {
    const q = historyQuery.trim().toLowerCase();
    return paymentsInHistoryPeriod.filter((p) => {
      if (historyPaymentStatus !== "all" && p.status !== historyPaymentStatus) return false;
      if (!q) return true;
      const amount = String(Number(p.amount || 0).toFixed(2));
      const date = new Date(p.createdAt).toLocaleDateString("az-AZ").toLowerCase();
      const statusText = String(p.status || "").toLowerCase();
      return amount.includes(q) || date.includes(q) || statusText.includes(q);
    });
  }, [historyPaymentStatus, historyQuery, paymentsInHistoryPeriod]);

  const historyPeriodOrderTotal = useMemo(
    () => ordersInHistoryPeriod.reduce((s, o) => s + Number(o.totalAmount || 0), 0),
    [ordersInHistoryPeriod]
  );

  const historyPeriodPaymentTotal = useMemo(
    () => paymentsInHistoryPeriod.reduce((s, p) => s + Number(p.amount || 0), 0),
    [paymentsInHistoryPeriod]
  );

  const approvedPaymentRequests = useMemo(
    () => paymentHistory.filter((p) => p.status === "APPROVED"),
    [paymentHistory]
  );

  const paymentOverviewMonthLabel = useMemo(() => {
    const [y, m] = paymentOverviewMonthKey.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString("az-AZ", { month: "long", year: "numeric" });
  }, [paymentOverviewMonthKey]);

  const canPaymentOverviewNextMonth = paymentOverviewMonthKey < getCurrentYearMonth();

  const shiftPaymentOverviewMonth = (delta: number) => {
    const [y, m] = paymentOverviewMonthKey.split("-").map(Number);
    const next = new Date(y, m - 1 + delta, 1);
    const cap = new Date();
    const capFirst = new Date(cap.getFullYear(), cap.getMonth(), 1);
    if (next > capFirst) return;
    setPaymentOverviewMonthKey(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`);
  };

  const goPaymentOverviewCurrentMonth = () => {
    setPaymentOverviewMonthKey(getCurrentYearMonth());
  };

  const paymentOverviewMonthStats = useMemo(() => {
    const list = approvedPaymentRequests.filter((p) => {
      const d = parsePaymentCreatedAt(p.createdAt);
      return d && dateInYearMonth(d, paymentOverviewMonthKey);
    });
    const sum = list.reduce((s, p) => s + Number(p.amount || 0), 0);
    const pending = paymentHistory.filter((p) => {
      if (p.status !== "PENDING") return false;
      const d = parsePaymentCreatedAt(p.createdAt);
      return d && dateInYearMonth(d, paymentOverviewMonthKey);
    }).length;
    const rejected = paymentHistory.filter((p) => {
      if (p.status !== "REJECTED") return false;
      const d = parsePaymentCreatedAt(p.createdAt);
      return d && dateInYearMonth(d, paymentOverviewMonthKey);
    }).length;
    return {
      list: list.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
      sum,
      count: list.length,
      pending,
      rejected,
    };
  }, [approvedPaymentRequests, paymentHistory, paymentOverviewMonthKey]);

  const paymentOverviewYearStats = useMemo(() => {
    const y = paymentOverviewYear;
    const months = Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const key = `${y}-${String(m).padStart(2, "0")}`;
      const list = approvedPaymentRequests.filter((p) => {
        const d = parsePaymentCreatedAt(p.createdAt);
        return d && dateInYearMonth(d, key);
      });
      const sum = list.reduce((s, p) => s + Number(p.amount || 0), 0);
      return {
        month: m,
        key,
        shortLabel: new Date(y, i, 1).toLocaleDateString("az-AZ", { month: "short" }),
        sum,
        count: list.length,
      };
    });
    const yearSum = months.reduce((s, x) => s + x.sum, 0);
    const yearCount = months.reduce((s, x) => s + x.count, 0);
    return { months, yearSum, yearCount };
  }, [approvedPaymentRequests, paymentOverviewYear]);

  const paymentOverviewYearOptions = useMemo(() => {
    const set = new Set<number>();
    const cur = new Date().getFullYear();
    set.add(cur);
    for (const p of paymentHistory) {
      const d = parsePaymentCreatedAt(p.createdAt);
      if (d) set.add(d.getFullYear());
    }
    return Array.from(set).sort((a, b) => b - a);
  }, [paymentHistory]);

  const loyaltyBonus = useMemo(() => {
    const spent = Number(orderSummary?.monthOrderAmount ?? 0);
    return getLoyaltyBonusProgress(spent, loyaltyProfileOverride, { hasCustomUserPrices });
  }, [orderSummary?.monthOrderAmount, loyaltyProfileOverride, hasCustomUserPrices]);

  const loyaltyPercentPreset = useMemo(
    () => getLoyaltyPercentages(loyaltyProfileOverride),
    [loyaltyProfileOverride]
  );

  const dashboardChartData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, index) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - index));
      const key = d.toISOString().slice(0, 10);
      return {
        key,
        label: d.toLocaleDateString("az-AZ", { weekday: "short" }),
        orders: 0,
        amount: 0,
      };
    });

    for (const order of userOrders) {
      const d = parseOrderCreatedAt(order);
      if (!d || isOrderCancelled(order)) continue;
      const row = days.find((x) => x.key === d.toISOString().slice(0, 10));
      if (row) {
        row.orders += 1;
        row.amount += Number(order.totalAmount || 0);
      }
    }

    return days;
  }, [userOrders]);

  const trendOrders = dashboardChartData.map((d) => d.orders);
  const trendAmounts = dashboardChartData.map((d) => d.amount);
  const trendPaid = dashboardChartData.map((_, i) => Math.max(0, Number(orderSummary?.totalPaid || 0) / 7 + i * 4));
  const trendDebt = dashboardChartData.map((_, i) => Math.max(0, Number(orderSummary?.totalDebt || 0) / 7 - i * 3));

  const handleReorder = (order: any) => {
    const firstItem = order?.items?.[0];
    const pid = firstItem?.productId || firstItem?.product_id;
    if (pid) {
      router.push(`/orders/new?productId=${encodeURIComponent(String(pid))}`);
      return;
    }
    alert("Təkrar sifariş üçün məhsul ID tapılmadı");
  };

  const handleExportMyReport = () => {
    const now = new Date();
    const stamp = now.toISOString().slice(0, 10);
    const summary = orderSummary || {
      totalOrders: userOrders.length,
      totalAmount: 0,
      totalPaid: 0,
      totalDebt: 0,
      monthOrderCount: 0,
      monthOrderAmount: 0,
      todayOrderCount: 0,
      todayOrderAmount: 0,
    };

    const periodLabel =
      historyDay !== null ? `${historyMonthLabel} — ${historyDay} gün` : historyMonthLabel;

    const includeOrders = historyType === "all" || historyType === "orders";
    const includePayments = historyType === "all" || historyType === "payments";
    const orderRows = filteredOrders
      .map((o: any, index) => {
        const orderNo = String(o.orderNumber || o.order_number || o.id || "-");
        return `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(orderNo)}</td>
            <td>${escapeHtml(new Date(o.createdAt).toLocaleString("az-AZ"))}</td>
            <td>${escapeHtml(o.customerName || o.customer_name || "-")}</td>
            <td class="right">${Number(o.totalAmount || 0).toFixed(2)}</td>
            <td>${escapeHtml(o.status || "-")}</td>
            <td>${escapeHtml(o.paymentStatus || o.payment_status || "-")}</td>
          </tr>`;
      })
      .join("");

    const paymentRows = filteredPayments
      .map((p, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(String(p.id))}</td>
          <td>${escapeHtml(new Date(p.createdAt).toLocaleString("az-AZ"))}</td>
          <td class="right">${Number(p.amount || 0).toFixed(2)}</td>
          <td>${escapeHtml(p.status || "-")}</td>
        </tr>`)
      .join("");

    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Qaimə hesabatı - ${escapeHtml(String(user?.username || "user"))}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; color: #1f2937; margin: 28px; }
    .top { display: flex; justify-content: space-between; gap: 24px; border-bottom: 3px solid #D90429; padding-bottom: 18px; margin-bottom: 22px; }
    .brand { font-size: 26px; font-weight: 800; color: #D90429; }
    .muted { color: #6b7280; font-size: 12px; }
    h1 { margin: 8px 0 0; font-size: 22px; }
    h2 { font-size: 15px; margin: 24px 0 10px; color: #111827; }
    .boxgrid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 18px 0; }
    .box { border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px; background: #fafafa; }
    .box b { display: block; margin-top: 4px; font-size: 16px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
    th, td { border: 1px solid #e5e7eb; padding: 8px; vertical-align: top; }
    th { background: #f3f4f6; text-align: left; font-weight: 700; }
    .right { text-align: right; }
    .total { margin-top: 16px; display: flex; justify-content: flex-end; }
    .total-card { min-width: 260px; border: 1px solid #D90429; border-radius: 12px; padding: 12px; }
    .footer { margin-top: 34px; padding-top: 14px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #6b7280; text-align: center; }
    @media print { body { margin: 16px; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="top">
    <div>
      <div class="brand">Premium Reklam</div>
      <div class="muted">Qaimə formasında istifadəçi hesabatı</div>
      <h1>Hesabat / Qaimə</h1>
    </div>
    <div class="right">
      <div><b>Qaimə tarixi:</b> ${escapeHtml(now.toLocaleString("az-AZ"))}</div>
      <div><b>Dövr:</b> ${escapeHtml(periodLabel)}</div>
      <div><b>İstifadəçi:</b> ${escapeHtml(user?.fullName || user?.username || "-")}</div>
    </div>
  </div>

  <div class="boxgrid">
    <div class="box"><span class="muted">Ümumi sifariş</span><b>${Number(summary.totalOrders || 0)}</b></div>
    <div class="box"><span class="muted">Sifariş məbləği</span><b>${Number(summary.totalAmount || 0).toFixed(2)} AZN</b></div>
    <div class="box"><span class="muted">Ödənilmiş</span><b>${Number(summary.totalPaid || 0).toFixed(2)} AZN</b></div>
    <div class="box"><span class="muted">Qalıq borc</span><b>${Number(summary.totalDebt || 0).toFixed(2)} AZN</b></div>
  </div>

  ${includeOrders ? `
    <h2>Sifariş tarixçəsi</h2>
    <table>
      <thead>
        <tr><th>#</th><th>Sifariş No</th><th>Tarix</th><th>Dekor adı</th><th class="right">Məbləğ (AZN)</th><th>Status</th><th>Ödəniş</th></tr>
      </thead>
      <tbody>${orderRows || `<tr><td colspan="7" class="muted">Seçilmiş dövrdə sifariş yoxdur.</td></tr>`}</tbody>
    </table>
  ` : ""}

  ${includePayments ? `
    <h2>Ödəniş tarixçəsi</h2>
    <table>
      <thead>
        <tr><th>#</th><th>ID</th><th>Tarix</th><th class="right">Məbləğ (AZN)</th><th>Status</th></tr>
      </thead>
      <tbody>${paymentRows || `<tr><td colspan="5" class="muted">Seçilmiş dövrdə ödəniş yoxdur.</td></tr>`}</tbody>
    </table>
  ` : ""}

  <div class="total">
    <div class="total-card">
      <div class="muted">Qaimə üzrə görünən sifariş cəmi</div>
      <b>${filteredOrders.reduce((sum: number, o: any) => sum + Number(o.totalAmount || 0), 0).toFixed(2)} AZN</b>
      <div class="muted" style="margin-top:6px">Görünən ödəniş cəmi: ${filteredPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0).toFixed(2)} AZN</div>
    </div>
  </div>

  <div class="footer">
    Bu qaimə Premium Reklam sistemi tərəfindən avtomatik yaradılıb. PDF kimi saxlamaq üçün çap pəncərəsində “Save as PDF / PDF olaraq saxla” seçin.
  </div>
  <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 250); };</script>
</body>
</html>`;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("PDF qaimə üçün popup icazəsi verin.");
      return;
    }
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#E5E7EB] border-t-[#D90429] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(217,4,41,0.08),transparent_32%),linear-gradient(180deg,#FFF7F7_0%,#F8F9FB_34%,#F8F9FB_100%)]">
      <div>
        
        {/* Home Tab */}
        {activeTab === "home" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="grid lg:grid-cols-[17rem_minmax(0,1fr)] gap-6 items-start min-w-0">
              <aside className="hidden lg:block sticky top-28 space-y-4">
                <div className="rounded-2xl border border-white bg-white/80 p-4 shadow-sm backdrop-blur-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#ff6600] to-[#D90429] text-white flex items-center justify-center font-black">
                      {String(user.fullName || user.username || "P").slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-[#0F172A] truncate">{user.fullName}</p>
                      <p className="text-xs text-[#64748B] truncate">@{user.username}</p>
                    </div>
                  </div>
                  <div className="mt-4 rounded-2xl bg-gradient-to-br from-[#ff6600] to-[#D90429] p-4 text-white">
                    <p className="text-xs text-white/75">Premium Plan</p>
                    <p className="mt-1 font-black">Aktiv kabinet</p>
                    <p className="mt-2 text-xs text-white/80">Bonuslar, qaimə və sifariş izləmə hamısı bir yerdə.</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white bg-white/80 p-2 shadow-sm backdrop-blur-xl">
                  {[
                    { label: "Ana səhifə", icon: User, action: () => setActiveTab("home"), active: activeTab === "home" },
                    { label: "Məhsullar", icon: ShoppingBag, action: () => router.push("/dashboard/products") },
                    { label: "Sifarişlər", icon: Package, action: () => router.push("/dashboard/orders") },
                    { label: "Tarixçələr", icon: History, action: () => setActiveTab("history"), active: activeTab === "history" },
                    { label: "Tənzimləmələr", icon: Settings, action: () => router.push("/profile") },
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={item.action}
                      className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                        "active" in item && item.active ? "bg-[#ff6600]/10 text-[#ff6600]" : "text-[#64748B] hover:bg-slate-50 hover:text-[#0F172A]"
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </button>
                  ))}
                </div>
              </aside>

              <div className="space-y-4 sm:space-y-5 min-w-0">
            <section className="relative overflow-hidden rounded-2xl sm:rounded-[24px] bg-gradient-to-br from-[#111827] via-[#2B0A12] to-[#D90429] p-4 sm:p-6 lg:p-7 text-white shadow-xl shadow-[#D90429]/12">
              <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute bottom-0 right-10 h-28 w-28 rounded-full bg-[#EF476F]/30 blur-xl" />
              <div className="relative grid lg:grid-cols-[1.2fr_.8fr] gap-4 sm:gap-5 items-end min-w-0">
                <div className="min-w-0">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-2.5 py-0.5 text-[10px] sm:text-xs font-semibold backdrop-blur">
                    <Award className="w-3.5 h-3.5 shrink-0" />
                    Premium panel
                  </span>
                  <h1 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight break-words">
                    Salam, {String(user.fullName || user.username || "istifadəçi").split(" ")[0]}.
                  </h1>
                  <p className="mt-2 max-w-2xl text-xs sm:text-sm text-white/75 leading-relaxed">
                    Sifarişlərinizi, ödənişlərinizi, bonus progressinizi və dəstək yazışmalarını bir paneldən izləyin.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => router.push("/dashboard/orders")}
                      className="bg-white/10 text-white border-white/20 hover:bg-white/15"
                      icon={<Package className="w-4 h-4" />}
                    >
                      Sifarişlərim
                    </Button>
                    <Link href="/profile">
                      <Button
                        variant="secondary"
                        className="bg-white/10 text-white border-white/20 hover:bg-white/15"
                        icon={<Settings className="w-4 h-4" />}
                      >
                        Tənzimləmələr
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 sm:gap-2 min-w-0">
                  <div className="min-w-0 rounded-xl border border-white/15 bg-white/10 p-2 sm:p-2.5 backdrop-blur">
                    <p className="text-[9px] sm:text-[10px] text-white/65 truncate">Qalıq borc</p>
                    <p className="mt-0.5 text-sm sm:text-base font-black tabular-nums truncate">
                      {(orderSummary?.totalDebt || 0).toFixed(2)}
                    </p>
                    <p className="text-[9px] text-white/55">AZN</p>
                  </div>
                  <div className="min-w-0 rounded-xl border border-white/15 bg-white/10 p-2 sm:p-2.5 backdrop-blur">
                    <p className="text-[9px] sm:text-[10px] text-white/65 truncate">Bu ay bonus əsası</p>
                    <p className="mt-0.5 text-sm sm:text-base font-black tabular-nums truncate">
                      {(orderSummary?.monthOrderAmount || 0).toFixed(0)}
                    </p>
                    <p className="text-[9px] text-white/55">AZN</p>
                  </div>
                  <div className="col-span-2 min-w-0 rounded-xl border border-white/15 bg-white/10 p-2 sm:p-2.5 backdrop-blur">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
                      <div className="min-w-0">
                        <p className="text-[9px] sm:text-[10px] text-white/65">Bonus progress</p>
                        <p className="mt-0.5 text-[10px] sm:text-xs font-medium text-white/85 leading-snug line-clamp-2">
                          {loyaltyBonus.hint}
                        </p>
                      </div>
                      <span className="text-sm sm:text-base font-black tabular-nums shrink-0">
                        {loyaltyBonus.progressPercent.toFixed(0)}%
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-white/15 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-white"
                        style={{ width: `${loyaltyBonus.progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 min-w-0">
              {[
                {
                  label: "Ödəniş bildir",
                  hint: "Qəbz və məbləğ göndər",
                  icon: CreditCard,
                  action: () => document.getElementById("payment-notice-card")?.scrollIntoView({ behavior: "smooth", block: "center" }),
                },
                { label: "Tarixçə", hint: "PDF qaimə və hesabat", icon: FileDown, action: () => setActiveTab("history") },
                { label: "Dəstək", hint: "Adminlə yazış", icon: MessageCircle, action: () => router.push("/dashboard/support") },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.action}
                  className="group rounded-xl border border-[#E5E7EB] bg-white p-2.5 sm:p-3 text-left shadow-sm transition hover:shadow-md min-w-0"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#D90429]/10 text-[#D90429] flex shrink-0 items-center justify-center group-hover:bg-[#D90429] group-hover:text-white transition">
                      <item.icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#1F2937] truncate">{item.label}</p>
                      <p className="text-[11px] text-[#6B7280] mt-0.5 line-clamp-2 leading-snug">{item.hint}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 min-[360px]:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5 min-w-0">
              <DashboardMetricCard
                label="Ümumi sifariş"
                value={String(userOrders.length)}
                hint="Son 7 gün aktivliyi"
                icon={Package}
                color="#ff6600"
                trend={trendOrders}
              />
              <DashboardMetricCard
                label="Bu ay sifariş"
                value={String(orderSummary?.monthOrderCount || 0)}
                hint="Aylıq sifariş sayı"
                icon={TrendingUp}
                color="#3B82F6"
                trend={trendAmounts}
              />
              <DashboardMetricCard
                label="Ödənilib"
                value={`${(orderSummary?.totalPaid || 0).toFixed(2)} AZN`}
                hint="Təsdiqlənmiş ödənişlər"
                icon={CheckCircle}
                color="#16A34A"
                trend={trendPaid}
              />
              <DashboardMetricCard
                label="Qalan borc"
                value={`${(orderSummary?.totalDebt || 0).toFixed(2)} AZN`}
                hint="Planlı ödəniş üçün əsas"
                icon={AlertCircle}
                color="#EF4444"
                trend={trendDebt}
              />
            </div>

            <div className="rounded-xl border border-[#E8ECF3] bg-white p-3 sm:p-4 shadow-sm min-w-0 overflow-hidden">
              <div className="mb-2 sm:mb-3 min-w-0">
                <h3 className="font-bold text-[#0F172A] flex items-center gap-1.5 text-sm sm:text-base">
                  <BarChart3 className="w-4 h-4 shrink-0 text-[#ff6600]" />
                  <span className="truncate">Sifariş statistikası</span>
                </h3>
                <p className="text-[10px] sm:text-xs text-[#64748B] mt-0.5 leading-snug">Son 7 gün — say və məbləğ</p>
              </div>
              <div className="h-44 sm:h-52 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dashboardChartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ff6600" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ff6600" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8ECF0" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#64748B" }} axisLine={false} tickLine={false} interval={0} />
                    <YAxis width={32} tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={(v) => String(v)} />
                    <Tooltip
                      contentStyle={{ borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 12 }}
                      formatter={(value: number, name: string) => [
                        name === "amount" ? `${Number(value).toFixed(2)} AZN` : value,
                        name === "amount" ? "Məbləğ" : "Sifariş",
                      ]}
                    />
                    <Area type="monotone" dataKey="amount" stroke="#ff6600" fill="url(#ordersGradient)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div id="payment-notice-card">
              <Card className="p-5 mb-6 border border-dashed border-[#D90429]/40 bg-[#FFF5F5]">
                <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#1F2937] flex items-center gap-2">
                      <Banknote className="w-5 h-5 text-[#D90429]" />
                      Ödəniş bildirişi
                    </h3>
                    <p className="text-xs text-[#6B7280] mt-1">
                      Ödədiyiniz məbləği qeyd edin. Borc yalnız admin təsdiqlədikdən sonra azalır.
                    </p>
                  </div>
                  <div className="flex gap-2 items-center flex-wrap">
                    <input
                      type="number"
                      min={0.01}
                      step={0.01}
                      className="w-36 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      placeholder="Məbləğ (AZN)"
                      value={clientPayAmount}
                      onChange={(e) => setClientPayAmount(e.target.value)}
                    />
                    <label className="inline-flex items-center gap-2 text-xs px-3 py-2 border border-gray-200 rounded-lg cursor-pointer bg-white">
                      <ImagePlus className="w-4 h-4" />
                      {clientPayReceiptName ? "Qəbz seçildi" : "Qəbz əlavə et"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = () => {
                            setClientPayReceiptData(String(reader.result || ""));
                            setClientPayReceiptName(file.name);
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>
                    <Button size="sm" onClick={() => void submitClientPaymentNotification()} disabled={clientPayBusy}>
                      {clientPayBusy ? "…" : "Göndər"}
                    </Button>
                  </div>
                </div>
                {clientPayReceiptName && (
                  <p className="text-xs text-[#6B7280] mt-2">Qəbz: {clientPayReceiptName}</p>
                )}
              </Card>
            </div>

            {orderBlocked && (
              <Card className="p-4 mb-6 border border-red-200 bg-red-50">
                <p className="text-sm font-semibold text-red-700">
                  Sifariş müvəqqəti bloklanıb (həftəlik ödəniş gecikməsi).
                </p>
                <p className="text-xs text-red-600 mt-1">
                  Yalnız admin bloku açdıqdan sonra yeni sifariş verə bilərsiniz.
                  {nextWeeklyDueDate ? ` Son ödəniş tarixi: ${nextWeeklyDueDate}` : ""}
                </p>
              </Card>
            )}

            {/* Monthly Summary */}
            <div className="grid grid-cols-1 min-[340px]:grid-cols-2 lg:grid-cols-4 gap-2 mb-4 min-w-0">
              <Card className="min-w-0 overflow-hidden p-2.5 sm:p-3 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl">
                <p className="text-[10px] sm:text-xs text-blue-600 font-medium leading-tight">Bu gün sifariş</p>
                <p className="text-lg sm:text-xl font-bold text-blue-700 tabular-nums mt-0.5 truncate">
                  {orderSummary?.todayOrderCount || 0}
                </p>
                <p className="text-[10px] sm:text-xs text-blue-500 mt-0.5 tabular-nums truncate">
                  {(orderSummary?.todayOrderAmount || 0).toFixed(2)} AZN
                </p>
              </Card>

              <Card className="min-w-0 overflow-hidden p-2.5 sm:p-3 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl">
                <p className="text-[10px] sm:text-xs text-purple-600 font-medium leading-tight line-clamp-2">Bu ay bonus əsası</p>
                <p className="text-base sm:text-lg font-bold text-purple-700 tabular-nums mt-0.5 truncate leading-tight">
                  {(orderSummary?.monthOrderAmount || 0).toFixed(2)} AZN
                </p>
                <p className="text-[9px] text-purple-600/80 mt-1 leading-snug line-clamp-2">Baza (endirimdən əvvəl)</p>
              </Card>

              <Card className="min-w-0 overflow-hidden p-2.5 sm:p-3 bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl">
                <p className="text-[10px] sm:text-xs text-green-600 font-medium">Ümumi ödəniş</p>
                <p className="text-base sm:text-lg font-bold text-green-700 tabular-nums mt-0.5 truncate leading-tight">
                  {(orderSummary?.totalPaid || 0).toFixed(2)} AZN
                </p>
              </Card>

              <Card className="min-w-0 overflow-hidden p-2.5 sm:p-3 bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl">
                <p className="text-[10px] sm:text-xs text-red-600 font-medium">Ümumi borc</p>
                <p className="text-base sm:text-lg font-bold text-red-700 tabular-nums mt-0.5 truncate leading-tight">
                  {(orderSummary?.totalDebt || 0).toFixed(2)} AZN
                </p>
              </Card>
            </div>

            {/* Quick Order Button */}
            <Card className="p-3 sm:p-4 mb-4 bg-gradient-to-r from-[#D90429] to-[#EF476F] text-white overflow-hidden rounded-xl">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between min-w-0">
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-bold">Məhsul sifarişi</h3>
                  <p className="opacity-90 text-xs sm:text-sm leading-snug mt-0.5">Məhsul seçin və ölçüləri daxil edin</p>
                </div>
                <Button
                  onClick={() => router.push("/dashboard/products")}
                  className="bg-white text-[#D90429] hover:bg-gray-100 w-full sm:w-auto shrink-0 text-sm py-2"
                  icon={<Plus className="w-4 h-4" />}
                >
                  Sifariş Et
                </Button>
              </div>
            </Card>

            <div className="grid md:grid-cols-3 gap-2 sm:gap-3 mb-4">
              <Card className="p-3 rounded-xl min-w-0 overflow-hidden">
                <h3 className="text-sm font-semibold text-[#1F2937] flex items-center gap-1.5 mb-1.5">
                  <Calculator className="w-3.5 h-3.5 shrink-0 text-[#D90429]" />
                  Ödəniş planı
                </h3>
                <p className="text-[11px] text-[#6B7280] mb-2 leading-snug">Borc 1 aya; həftəlik ödəniş.</p>
                <p className="text-[10px] text-[#6B7280]">1 ay (4 həftə)</p>
                <p className="text-sm font-bold text-[#D90429] mt-0.5 tabular-nums truncate">
                  {((orderSummary?.totalDebt || 0) / 4).toFixed(2)} AZN/həftə
                </p>
              </Card>

              <Card className="p-3 rounded-xl min-w-0 overflow-hidden">
                <h3 className="text-sm font-semibold text-[#1F2937] flex items-center gap-1.5 mb-1.5">
                  <Award className="w-3.5 h-3.5 shrink-0 text-[#16A34A]" />
                  Bonus proqramı
                </h3>
                <p className="text-[11px] text-[#6B7280] mb-1.5 leading-snug line-clamp-3">
                  Bu ay (bonus):{" "}
                  <span className="font-medium text-[#1F2937] tabular-nums">{loyaltyBonus.spent.toFixed(0)} AZN</span>
                  {loyaltyBonus.activePercent > 0 && (
                    <>
                      {" "}
                      · <span className="font-medium text-[#16A34A]">{loyaltyBonus.activePercent}%</span>
                    </>
                  )}
                </p>
                <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#16A34A] to-[#22C55E] transition-all"
                    style={{ width: `${loyaltyBonus.progressPercent}%` }}
                  />
                </div>
                <p className="text-[10px] text-[#6B7280] mt-1.5 line-clamp-2">{loyaltyBonus.hint}</p>
                <p className="text-[10px] text-[#9CA3AF] mt-1 leading-snug">
                  Yalnız admin təsdiqləyən sifarişlərin baza məbləği sayılır; &quot;gözləyir&quot; statusu bonusa
                  düşmür.
                </p>
                {isLoyaltyBonusProgramEnabled() && !hasCustomUserPrices && (
                  <p className="text-[10px] text-[#9CA3AF] mt-1 leading-snug">
                    Hədlər: {LOYALTY_FIRST_THRESHOLD_AZN} AZN → {loyaltyPercentPreset.first}% ·{" "}
                    {LOYALTY_SECOND_THRESHOLD_AZN} AZN → {loyaltyPercentPreset.second}% (admin paneldə dəyişilir)
                  </p>
                )}
              </Card>

              <Card className="p-3 rounded-xl min-w-0 overflow-hidden">
                <h3 className="text-sm font-semibold text-[#1F2937] flex items-center gap-1.5 mb-1.5">
                  <MessageCircle className="w-3.5 h-3.5 shrink-0 text-[#3B82F6]" />
                  Dəstək
                </h3>
                <p className="text-[11px] text-[#6B7280] mb-2 leading-snug">Sifariş sualı üçün yazın.</p>
                <Link href="/dashboard/support">
                  <Button size="sm" className="w-full text-xs py-1.5">
                    Dəstəyə yaz
                  </Button>
                </Link>
              </Card>
            </div>

            <Card className="p-3 sm:p-4 mb-4 min-w-0 overflow-hidden rounded-xl">
              <h3 className="text-sm font-semibold text-[#1F2937] flex items-center gap-1.5 mb-2">
                <Route className="w-3.5 h-3.5 shrink-0 text-[#D90429]" />
                Borc detalları
              </h3>
              <div className="space-y-1.5">
                {userOrders.slice(0, 4).map((order) => {
                  const total = Number(order.totalAmount || 0);
                  const paid = Number(order.paidAmount || order.paid_amount || 0);
                  const remaining = Number(order.remainingAmount || order.remaining_amount || 0);
                  return (
                    <div
                      key={order.id}
                      className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-2 text-[10px] sm:text-[11px] min-w-0 overflow-hidden"
                    >
                      <p className="font-semibold text-[#1F2937] truncate text-xs">
                        #{order.orderNumber || order.order_number || order.id}
                      </p>
                      <div className="mt-1.5 grid grid-cols-3 gap-1 min-w-0">
                        <div className="tabular-nums text-[#6B7280] min-w-0 truncate">
                          <span className="text-[9px] text-[#9CA3AF] block truncate">Ümumi</span>
                          {total.toFixed(2)}
                        </div>
                        <div className="tabular-nums text-[#16A34A] min-w-0 truncate">
                          <span className="text-[9px] text-[#9CA3AF] block truncate">Ödənilib</span>
                          {paid.toFixed(2)}
                        </div>
                        <div className="tabular-nums text-[#DC2626] min-w-0 truncate">
                          <span className="text-[9px] text-[#9CA3AF] block truncate">Qalıq</span>
                          {remaining.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {userOrders.length === 0 && <p className="text-sm text-[#6B7280]">Borc detalı üçün sifariş yoxdur.</p>}
              </div>
            </Card>

            {/* Recent Orders */}
            <div>
              <div className="flex items-center justify-between mb-2 gap-2 min-w-0">
                <h2 className="text-base font-bold text-[#1F2937] truncate">Son sifarişlər</h2>
                <Button variant="ghost" size="sm" className="text-xs shrink-0 py-1" onClick={() => router.push("/dashboard/orders")}>
                  Hamısı
                </Button>
              </div>

              {userOrders.length === 0 ? (
                <Card className="p-6 text-center rounded-xl">
                  <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-[#6B7280] mb-3">Hələ sifarişiniz yoxdur</p>
                  <Button size="sm" onClick={() => router.push("/orders/new")} icon={<Plus className="w-4 h-4" />}>
                    Sifariş Et
                  </Button>
                </Card>
              ) : (
                <div className="grid gap-2">
                  {userOrders.slice(0, 5).map((order) => (
                    <Card key={order.id} className="p-2.5 sm:p-3 min-w-0 overflow-hidden rounded-xl">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="font-semibold text-[#1F2937] truncate">
                            #{order.orderNumber || order.order_number || order.id}
                          </p>
                          <p className="text-xs text-[#6B7280]">
                            {new Date(order.createdAt).toLocaleDateString("az-AZ")}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 sm:justify-end">
                          <div className="text-left sm:text-right min-w-0">
                            <p className="font-semibold text-[#1F2937] tabular-nums">
                              {Number(order.totalAmount || 0).toFixed(2)} AZN
                            </p>
                            <p className="text-xs text-[#6B7280]">{order.items?.length || 0} məhsul</p>
                          </div>
                          <StatusBadge status={order.status?.toLowerCase() || "pending"} />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleReorder(order)}
                            icon={<Repeat className="w-4 h-4" />}
                            className="shrink-0"
                          >
                            Təkrar
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "history" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-[#1F2937] flex items-center gap-2">
                  <History className="w-7 h-7 text-[#D90429]" />
                  Tarixçələr
                </h1>
                <p className="text-sm text-[#6B7280] mt-1">
                  Ödəniş xülasəsi və sifariş / ödəniş tarixçəniz — ay və gün üzrə.
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={handleRefresh} icon={<RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />}>
                Yenilə
              </Button>
            </div>

            <Card className="p-0 overflow-hidden border border-[#E5E7EB] shadow-sm">
              <div className="bg-gradient-to-br from-[#0F766E] to-[#115E59] px-5 py-4 text-white">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                      <BarChart3 className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-lg tracking-tight">Ödəniş xülasəsi</h2>
                      <p className="text-xs text-white/80 mt-0.5">
                        Admin tərəfindən təsdiqlənmiş ödəniş bildirişləriniz üzrə ay və il cəmləri.
                      </p>
                    </div>
                  </div>
                  <div className="inline-flex rounded-lg bg-black/20 p-0.5 w-fit">
                    <button
                      type="button"
                      onClick={() => setPaymentOverviewMode("month")}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                        paymentOverviewMode === "month" ? "bg-white text-teal-900" : "text-white/90 hover:bg-white/10"
                      }`}
                    >
                      Aylıq
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentOverviewMode("year")}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                        paymentOverviewMode === "year" ? "bg-white text-teal-900" : "text-white/90 hover:bg-white/10"
                      }`}
                    >
                      İllik
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-white">
                {paymentOverviewMode === "month" ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1 border border-[#E5E7EB] rounded-xl p-0.5 bg-[#F9FAFB]">
                        <button
                          type="button"
                          onClick={() => shiftPaymentOverviewMonth(-1)}
                          className="p-2 rounded-lg hover:bg-white transition"
                          aria-label="Əvvəlki ay"
                        >
                          <ChevronLeft className="w-5 h-5 text-[#374151]" />
                        </button>
                        <span className="px-3 text-sm font-semibold text-[#1F2937] min-w-[11rem] text-center">
                          {paymentOverviewMonthLabel}
                        </span>
                        <button
                          type="button"
                          disabled={!canPaymentOverviewNextMonth}
                          onClick={() => shiftPaymentOverviewMonth(1)}
                          className="p-2 rounded-lg hover:bg-white transition disabled:opacity-35 disabled:pointer-events-none"
                          aria-label="Növbəti ay"
                        >
                          <ChevronRight className="w-5 h-5 text-[#374151]" />
                        </button>
                      </div>
                      {paymentOverviewMonthKey !== getCurrentYearMonth() && (
                        <button
                          type="button"
                          onClick={goPaymentOverviewCurrentMonth}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-teal-50 text-teal-800 border border-teal-100 hover:bg-teal-100"
                        >
                          Cari ay
                        </button>
                      )}
                    </div>

                    <div className="grid sm:grid-cols-3 gap-3">
                      <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 p-4">
                        <p className="text-xs font-medium text-emerald-700">Təsdiqlənmiş cəm</p>
                        <p className="text-2xl font-bold text-emerald-900 mt-1">
                          {paymentOverviewMonthStats.sum.toFixed(2)} AZN
                        </p>
                        <p className="text-[11px] text-emerald-600 mt-1">
                          {paymentOverviewMonthStats.count} əməliyyat
                        </p>
                      </div>
                      <div className="rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] p-4">
                        <p className="text-xs font-medium text-amber-700">Gözləyir</p>
                        <p className="text-xl font-bold text-[#1F2937] mt-1">{paymentOverviewMonthStats.pending}</p>
                        <p className="text-[11px] text-[#6B7280] mt-1">həmin ay üzrə sorğu</p>
                      </div>
                      <div className="rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] p-4">
                        <p className="text-xs font-medium text-red-700">Rədd edilib</p>
                        <p className="text-xl font-bold text-[#1F2937] mt-1">{paymentOverviewMonthStats.rejected}</p>
                        <p className="text-[11px] text-[#6B7280] mt-1">həmin ay üzrə sorğu</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-[#6B7280] mb-2">Həmin ay — təsdiqlənmiş siyahı</p>
                      <div className="max-h-52 overflow-y-auto space-y-2 rounded-xl border border-[#E5E7EB] p-2 bg-[#FAFBFC]">
                        {paymentOverviewMonthStats.list.length === 0 ? (
                          <p className="text-sm text-[#6B7280] py-6 text-center">Bu ay üçün təsdiqlənmiş ödəniş yoxdur.</p>
                        ) : (
                          paymentOverviewMonthStats.list.map((p) => (
                            <div
                              key={p.id}
                              className="flex items-center justify-between text-sm bg-white rounded-lg px-3 py-2 border border-[#F3F4F6]"
                            >
                              <span className="text-[#6B7280] text-xs">
                                {new Date(p.createdAt).toLocaleString("az-AZ", {
                                  day: "2-digit",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              <span className="font-semibold text-emerald-700">
                                +{Number(p.amount || 0).toFixed(2)} AZN
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="text-xs font-medium text-[#6B7280] sr-only">İl</label>
                      <select
                        value={paymentOverviewYear}
                        onChange={(e) => setPaymentOverviewYear(Number(e.target.value))}
                        className="px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm bg-white font-medium text-[#1F2937]"
                      >
                        {paymentOverviewYearOptions.map((yr) => (
                          <option key={yr} value={yr}>
                            {yr}
                          </option>
                        ))}
                      </select>
                      <span className="text-xs text-[#6B7280]">üzrə ay ay cəmlər</span>
                    </div>

                    <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 p-4 flex flex-wrap items-end justify-between gap-2">
                      <div>
                        <p className="text-xs font-medium text-emerald-700">İl üzrə təsdiqlənmiş cəm</p>
                        <p className="text-2xl font-bold text-emerald-900 mt-1">
                          {paymentOverviewYearStats.yearSum.toFixed(2)} AZN
                        </p>
                      </div>
                      <p className="text-sm text-emerald-800 font-medium">
                        {paymentOverviewYearStats.yearCount} təsdiqlənmiş bildiriş
                      </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      {paymentOverviewYearStats.months.map((row) => (
                        <div
                          key={row.key}
                          className={`rounded-xl border p-3 text-center ${
                            row.sum > 0
                              ? "bg-teal-50 border-teal-200"
                              : "bg-[#F9FAFB] border-[#E5E7EB] opacity-80"
                          }`}
                        >
                          <p className="text-[11px] font-medium text-[#6B7280] capitalize">{row.shortLabel}</p>
                          <p className={`text-sm font-bold mt-1 ${row.sum > 0 ? "text-teal-800" : "text-[#9CA3AF]"}`}>
                            {row.sum > 0 ? `${row.sum.toFixed(2)}` : "—"}
                          </p>
                          {row.count > 0 && (
                            <p className="text-[10px] text-teal-600 mt-0.5">{row.count} əməliyyat</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <Card className="overflow-hidden border border-[#E5E7EB] shadow-sm">
              <div className="bg-gradient-to-r from-[#1F2937] via-[#374151] to-[#D90429]/90 px-5 py-4 text-white">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-lg tracking-tight">İstifadəçi tarixçəsi</h2>
                      <p className="text-xs text-white/80 mt-0.5">
                        Ay və gün üzrə süzgəc — cari ay yenilənir; əvvəlki aylara keçə bilərsiniz.
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleExportMyReport}
                    icon={<FileDown className="w-4 h-4" />}
                    className="text-white border border-white/30 hover:bg-white/10 shrink-0"
                  >
                    PDF qaimə
                  </Button>
                </div>

                <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-1 bg-black/20 rounded-xl p-1 w-fit">
                    <button
                      type="button"
                      onClick={() => shiftHistoryMonth(-1)}
                      className="p-2 rounded-lg hover:bg-white/10 transition"
                      aria-label="Əvvəlki ay"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="px-3 min-w-[10.5rem] text-center">
                      <p className="text-sm font-semibold">{historyMonthLabel}</p>
                      {historyMonthKey === getCurrentYearMonth() ? (
                        <p className="text-[10px] text-emerald-200 font-medium">Cari ay</p>
                      ) : (
                        <p className="text-[10px] text-amber-200 font-medium">Arxiv ay</p>
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={!canGoNextHistoryMonth}
                      onClick={() => shiftHistoryMonth(1)}
                      className="p-2 rounded-lg hover:bg-white/10 transition disabled:opacity-35 disabled:pointer-events-none"
                      aria-label="Növbəti ay"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                  {historyMonthKey !== getCurrentYearMonth() && (
                    <button
                      type="button"
                      onClick={goHistoryCurrentMonth}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition w-fit"
                    >
                      Bu ayə qayıt
                    </button>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <div className="rounded-lg bg-black/25 px-3 py-1.5">
                    <span className="text-white/70">Ay üzrə sifariş: </span>
                    <span className="font-semibold">{ordersInHistoryPeriod.length}</span>
                    <span className="text-white/60"> · </span>
                    <span className="font-semibold">{historyPeriodOrderTotal.toFixed(2)} AZN</span>
                  </div>
                  <div className="rounded-lg bg-black/25 px-3 py-1.5">
                    <span className="text-white/70">Ay üzrə ödəniş sorğusu: </span>
                    <span className="font-semibold">{paymentsInHistoryPeriod.length}</span>
                    <span className="text-white/60"> · </span>
                    <span className="font-semibold">{historyPeriodPaymentTotal.toFixed(2)} AZN</span>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-4 bg-white">
                <div>
                  <p className="text-xs font-medium text-[#6B7280] mb-2">Gün üzrə süzgəc</p>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                    <button
                      type="button"
                      onClick={() => setHistoryDay(null)}
                      className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                        historyDay === null
                          ? "bg-[#D90429] text-white border-[#D90429]"
                          : "bg-white text-[#374151] border-[#E5E7EB] hover:border-[#D90429]/40"
                      }`}
                    >
                      Bütün ay
                    </button>
                    {Array.from({ length: historyDaysInMonth }, (_, i) => i + 1).map((day) => {
                      const has = historyDaysWithActivity.has(day);
                      const active = historyDay === day;
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => setHistoryDay(active ? null : day)}
                          className={`shrink-0 min-w-[2.25rem] py-1.5 rounded-full text-xs font-medium border transition relative ${
                            active
                              ? "bg-[#D90429] text-white border-[#D90429]"
                              : has
                                ? "bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]"
                                : "bg-[#F9FAFB] text-[#9CA3AF] border-[#E5E7EB] hover:border-gray-300"
                          }`}
                        >
                          {day}
                          {has && !active && (
                            <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#D90429]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-[#9CA3AF] mt-1.5">
                    Qırmızı nöqtə — həmin gün sifariş və ya ödəniş qeydi var. Yuxarıdan “Yenilə” ilə məlumatı yeniləyin.
                  </p>
                </div>

                <div className="flex flex-col lg:flex-row flex-wrap gap-2 lg:items-center">
                  <input
                    type="text"
                    value={historyQuery}
                    onChange={(e) => setHistoryQuery(e.target.value)}
                    placeholder="Axtar: nömrə, müştəri, məbləğ..."
                    className="px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm flex-1 min-w-[200px]"
                  />
                  <select
                    value={historyType}
                    onChange={(e) => setHistoryType(e.target.value as "all" | "orders" | "payments")}
                    className="px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm bg-white"
                  >
                    <option value="all">Növ: hamısı</option>
                    <option value="orders">Yalnız sifarişlər</option>
                    <option value="payments">Yalnız ödənişlər</option>
                  </select>
                  {(historyType === "all" || historyType === "payments") && (
                    <select
                      value={historyPaymentStatus}
                      onChange={(e) =>
                        setHistoryPaymentStatus(e.target.value as "all" | "PENDING" | "APPROVED" | "REJECTED")
                      }
                      className="px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm bg-white"
                    >
                      <option value="all">Ödəniş statusu: hamısı</option>
                      <option value="PENDING">Gözləyir</option>
                      <option value="APPROVED">Təsdiqlənib</option>
                      <option value="REJECTED">Rədd edilib</option>
                    </select>
                  )}
                </div>

                <div className="grid lg:grid-cols-2 gap-4">
                  {(historyType === "all" || historyType === "orders") && (
                    <div className="rounded-xl border border-[#E5E7EB] bg-[#FAFBFC] p-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-semibold text-[#1F2937]">Sifarişlər</p>
                        <span className="text-xs text-[#6B7280]">{filteredOrders.length} sətir</span>
                      </div>
                      <div className="space-y-2 max-h-[min(420px,50vh)] overflow-y-auto pr-1">
                        {filteredOrders.map((order) => (
                          <div
                            key={order.id}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm bg-white rounded-xl p-3 border border-[#F3F4F6] shadow-sm"
                          >
                            <div>
                              <span className="font-semibold text-[#1F2937]">
                                #{order.orderNumber || order.order_number || order.id}
                              </span>
                              <p className="text-xs text-[#6B7280] mt-0.5">
                                {new Date(order.createdAt).toLocaleString("az-AZ", {
                                  day: "2-digit",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                            <span className="text-[#D90429] font-bold whitespace-nowrap">
                              {Number(order.totalAmount || 0).toFixed(2)} AZN
                            </span>
                          </div>
                        ))}
                        {filteredOrders.length === 0 && (
                          <p className="text-sm text-[#6B7280] py-6 text-center">Bu dövrdə sifariş yoxdur.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {(historyType === "all" || historyType === "payments") && (
                    <div className="rounded-xl border border-[#E5E7EB] bg-[#FAFBFC] p-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-semibold text-[#1F2937]">Ödəniş sorğuları</p>
                        <span className="text-xs text-[#6B7280]">{filteredPayments.length} sətir</span>
                      </div>
                      <div className="space-y-2 max-h-[min(420px,50vh)] overflow-y-auto pr-1">
                        {filteredPayments.map((p) => (
                          <div
                            key={p.id}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm bg-white rounded-xl p-3 border border-[#F3F4F6] shadow-sm"
                          >
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-[#1F2937]">
                                {Number(p.amount || 0).toFixed(2)} AZN
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  p.status === "APPROVED"
                                    ? "bg-green-100 text-green-700"
                                    : p.status === "REJECTED"
                                      ? "bg-red-100 text-red-700"
                                      : "bg-amber-100 text-amber-700"
                                }`}
                              >
                                {p.status === "APPROVED"
                                  ? "Təsdiqlənib"
                                  : p.status === "REJECTED"
                                    ? "Rədd edilib"
                                    : "Gözləyir"}
                              </span>
                            </div>
                            <span className="text-xs text-[#6B7280] whitespace-nowrap">
                              {new Date(p.createdAt).toLocaleString("az-AZ", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        ))}
                        {filteredPayments.length === 0 && (
                          <p className="text-sm text-[#6B7280] py-6 text-center">Bu dövrdə ödəniş qeydi yoxdur.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        )}

      </div>
    </div>
  );
}