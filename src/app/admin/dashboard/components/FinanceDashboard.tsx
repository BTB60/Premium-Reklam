"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { 
  Search, Download, DollarSign, TrendingUp, TrendingDown, 
  Wallet, CreditCard, AlertCircle, CheckCircle, Clock, X
} from "lucide-react";
import { getAdminBearerToken } from "./admin-dashboard-api";
import {
  approveClientPaymentRequest,
  fetchFinanceDebts,
  fetchFinanceTransactions,
  fetchPendingClientPayments,
  rejectClientPaymentRequest,
  updateFinanceBalance,
  type ClientPaymentRequestRow,
  type FinanceTransactionHistoryRow,
  type FinanceTransactionType,
  type FinanceUserDebtRow,
} from "@/lib/clientPaymentNotificationsApi";

interface Payment {
  id: number;
  orderId?: number;
  orderNumber?: string;
  userId?: string;
  userFullName?: string;
  userUsername?: string;
  amount: number;
  paidAmount: number;
  paymentMethod: "cash" | "card" | "transfer" | "other";
  paymentStatus: "pending" | "partial" | "paid" | "refunded";
  paymentDate?: string;
  createdAt: string;
  note?: string;
}

interface User {
  id: string;
  fullName: string;
  username: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL 
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : "https://premium-reklam-backend.onrender.com/api";

export default function FinanceDashboard() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [clientPayPending, setClientPayPending] = useState<ClientPaymentRequestRow[]>([]);
  const [isFullAdmin, setIsFullAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [debts, setDebts] = useState<FinanceUserDebtRow[]>([]);
  const [history, setHistory] = useState<FinanceTransactionHistoryRow[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [txUser, setTxUser] = useState<FinanceUserDebtRow | null>(null);
  const [txAmount, setTxAmount] = useState("");
  const [txNote, setTxNote] = useState("");
  const [txType, setTxType] = useState<FinanceTransactionType>("CREDIT");
  const [txSubmitting, setTxSubmitting] = useState(false);

  useEffect(() => {
    loadPayments();
    loadUsers();
    void loadDebtsAndHistory();
    try {
      const sub = localStorage.getItem("premium_session_type") === "subadmin";
      if (sub) {
        setIsFullAdmin(false);
      } else {
        const raw = localStorage.getItem("decor_current_user");
        const p = raw ? (JSON.parse(raw) as { role?: string }) : {};
        setIsFullAdmin(p.role === "ADMIN");
      }
    } catch {
      setIsFullAdmin(false);
    }
  }, []);

  const loadDebtsAndHistory = async () => {
    try {
      const [debtRows, historyRows] = await Promise.all([
        fetchFinanceDebts(),
        fetchFinanceTransactions(),
      ]);
      setDebts(debtRows);
      setHistory(historyRows);
    } catch (error) {
      console.error("[Finance] load debts/history error:", error);
    }
  };

  const loadClientPayPending = async () => {
    try {
      const list = await fetchPendingClientPayments();
      setClientPayPending(list);
    } catch {
      setClientPayPending([]);
    }
  };

  useEffect(() => {
    void loadClientPayPending();
    const onRefresh = () => void loadClientPayPending();
    window.addEventListener("premium:refresh-client-payment-requests", onRefresh);
    return () => window.removeEventListener("premium:refresh-client-payment-requests", onRefresh);
  }, []);

  const getToken = () => getAdminBearerToken();

  const loadPayments = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/payments`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data?.payments || [];
        const normalized: Payment[] = list.map((row: any) => {
          const amount = Number(row?.amount ?? 0);
          const methodRaw = String(row?.method ?? "").toLowerCase();
          const method: Payment["paymentMethod"] =
            methodRaw === "cash" || methodRaw === "card" || methodRaw === "transfer" ? methodRaw : "other";
          const createdAt = row?.createdAt || new Date().toISOString();
          return {
            id: Number(row?.id ?? 0),
            orderId: row?.order?.id ? Number(row.order.id) : undefined,
            orderNumber: row?.order?.orderNumber || (row?.order?.id ? `#${row.order.id}` : undefined),
            userId: row?.user?.id != null ? String(row.user.id) : undefined,
            userFullName: row?.user?.fullName || undefined,
            userUsername: row?.user?.username || undefined,
            amount,
            paidAmount: amount,
            paymentMethod: method,
            paymentStatus: "paid",
            paymentDate: createdAt,
            createdAt,
            note: row?.note || undefined,
          };
        });
        setPayments(normalized);
      }
    } catch (error) {
      console.error("[Finance] Load error:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/users`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data?.users || [];
        setUsers(list);
      }
    } catch (error) {
      console.error("[Finance] Load users error:", error);
    }
  };

  const updatePaymentStatus = async (_paymentId: number, _status: string) => {};
  const addPayment = async (_orderId: number, _amount: number, _method: string) => false;

  const openTxModal = (user: FinanceUserDebtRow, type: FinanceTransactionType) => {
    setTxUser(user);
    setTxType(type);
    setTxAmount("");
    setTxNote("");
    setModalOpen(true);
  };

  const submitTx = async () => {
    if (!txUser) return;
    const amount = Number(txAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      alert("Məbləğ düzgün deyil");
      return;
    }
    setTxSubmitting(true);
    try {
      await updateFinanceBalance({
        userId: txUser.userId,
        amount,
        transactionType: txType,
        note: txNote.trim() || undefined,
      });
      setModalOpen(false);
      await Promise.all([loadDebtsAndHistory(), loadClientPayPending()]);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Əməliyyat alınmadı");
    } finally {
      setTxSubmitting(false);
    }
  };

  const filteredPayments = payments.filter(p => {
    if (searchQuery) {
      const user = users.find(u => u.id === String(p.userId));
      const matchesSearch = 
        p.id.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(p.orderNumber || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        user?.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user?.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(p.userFullName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(p.userUsername || "").toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
    }
    if (statusFilter !== "all" && p.paymentStatus !== statusFilter) return false;
    if (methodFilter !== "all" && p.paymentMethod !== methodFilter) return false;
    if (dateFilter !== "all") {
      const paymentDate = new Date(p.paymentDate || p.createdAt);
      const now = new Date();
      const daysDiff = (now.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24);
      if (dateFilter === "today" && daysDiff > 1) return false;
      if (dateFilter === "week" && daysDiff > 7) return false;
      if (dateFilter === "month" && daysDiff > 30) return false;
    }
    return true;
  });

  const stats = {
    totalRevenue: payments.filter(p => p.paymentStatus === "paid").reduce((sum, p) => sum + p.paidAmount, 0),
    totalDebt: debts.reduce((sum, d) => sum + Number(d.totalDebt || 0), 0),
    pendingCount: payments.filter(p => p.paymentStatus === "pending").length,
    partialCount: payments.filter(p => p.paymentStatus === "partial").length,
    paidCount: payments.filter(p => p.paymentStatus === "paid").length,
    avgPayment: payments.filter(p => p.paidAmount > 0).length > 0
      ? payments.reduce((sum, p) => sum + p.paidAmount, 0) / payments.filter(p => p.paidAmount > 0).length
      : 0,
  };

  const handleExport = () => {
    const headers = ["ID", "Sifariş", "İstifadəçi", "Məbləğ", "Ödənilib", "Borc", "Status", "Tarix"];
    const rows = filteredPayments.map(p => {
      const user = users.find(u => u.id === String(p.userId));
      const debt = Math.max(0, p.amount - p.paidAmount);
      return [
        p.id,
        p.orderNumber || "-",
        user?.fullName || p.userFullName || "-",
        p.amount.toFixed(2),
        p.paidAmount.toFixed(2),
        debt.toFixed(2),
        p.paymentStatus,
        new Date(p.paymentDate || p.createdAt).toLocaleDateString("az-AZ")
      ];
    });
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finance_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: "Nağd",
      card: "Kart",
      transfer: "Köçürmə",
      other: "Digər"
    };
    return labels[method] || method;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-amber-100 text-amber-700",
      partial: "bg-blue-100 text-blue-700",
      paid: "bg-green-100 text-green-700",
      refunded: "bg-red-100 text-red-700"
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  if (loading) {
    return (
      <Card className="p-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D90429] mx-auto" />
      </Card>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Wallet className="w-8 h-8 text-[#D90429]" />
          <h1 className="text-2xl font-bold text-[#1F2937]">Maliyyə</h1>
        </div>
        <Button onClick={handleExport} variant="ghost" size="sm" icon={<Download className="w-4 h-4" />}>
          Export
        </Button>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <TrendingUp className="w-6 h-6" />
            <span className="text-xs bg-white/20 px-2 py-1 rounded">+12%</span>
          </div>
          <p className="text-white/80 text-sm mt-2">Ümumi gəlir</p>
          <p className="text-2xl font-bold">{stats.totalRevenue.toFixed(2)} AZN</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-red-500 to-red-600 text-white">
          <div className="flex items-center justify-between">
            <TrendingDown className="w-6 h-6" />
            <span className="text-xs bg-white/20 px-2 py-1 rounded">-{stats.totalDebt > 0 ? "var" : "0"}</span>
          </div>
          <p className="text-white/80 text-sm mt-2">Ümumi borc</p>
          <p className="text-2xl font-bold">{stats.totalDebt.toFixed(2)} AZN</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-amber-500" />
            <span className="text-xs text-amber-600">Gözləyir</span>
          </div>
          <p className="text-[#6B7280] text-sm">Ödənişlər</p>
          <p className="text-2xl font-bold text-[#1F2937]">{stats.pendingCount + stats.partialCount}</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-xs text-green-600">Tamam</span>
          </div>
          <p className="text-[#6B7280] text-sm">Ödənilib</p>
          <p className="text-2xl font-bold text-[#1F2937]">{stats.paidCount}</p>
        </Card>
      </div>

      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Ümumi Borc Siyahısı</h2>
          <span className="text-xs text-[var(--text-muted)]">Borca görə azalan sıra</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--text-muted)] border-b border-[var(--border)]">
                <th className="py-2 pr-2">Username</th>
                <th className="py-2 pr-2">Ad Soyad</th>
                <th className="py-2 pr-2">Ümumi Borc</th>
                <th className="py-2">Əməliyyat</th>
              </tr>
            </thead>
            <tbody>
              {debts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 text-[var(--text-muted)]">
                    Məlumat yoxdur
                  </td>
                </tr>
              ) : (
                debts.map((row) => (
                  <tr key={row.userId} className="border-b border-[var(--border)]/60">
                    <td className="py-2 pr-2 font-medium">@{row.username}</td>
                    <td className="py-2 pr-2">{row.fullName}</td>
                    <td className="py-2 pr-2">
                      <span className={Number(row.totalDebt) > 0 ? "text-red-600 font-semibold" : "text-green-600 font-semibold"}>
                        {Number(row.totalDebt).toFixed(2)} AZN
                      </span>
                    </td>
                    <td className="py-2">
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-green-700 hover:bg-green-50"
                          onClick={() => openTxModal(row, "CREDIT")}
                        >
                          Ödəniş Yaz
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-700 hover:bg-red-50"
                          onClick={() => openTxModal(row, "DEBIT")}
                        >
                          Borc Artır
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {clientPayPending.length > 0 && (
        <Card className="p-4 mb-6 border-amber-200 bg-amber-50/50">
          <h2 className="text-sm font-bold text-[#1F2937] mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            Müştəri ödəniş bildirişləri (gözləyir)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[#6B7280] border-b border-amber-100">
                  <th className="py-2 pr-2">ID</th>
                  <th className="py-2 pr-2">Müştəri</th>
                  <th className="py-2 pr-2">Məbləğ</th>
                  <th className="py-2 pr-2">Tarix</th>
                  <th className="py-2">Əməliyyat</th>
                </tr>
              </thead>
              <tbody>
                {clientPayPending.map((row) => (
                  <tr key={row.id} className="border-b border-amber-100/80">
                    <td className="py-2 pr-2 font-medium">#{row.id}</td>
                    <td className="py-2 pr-2">
                      <div>{row.userFullName}</div>
                      <div className="text-xs text-[#6B7280]">@{row.username}</div>
                    </td>
                    <td className="py-2 pr-2 font-semibold">{Number(row.amount).toFixed(2)} AZN</td>
                    <td className="py-2 pr-2 text-[#6B7280]">
                      {row.createdAt ? new Date(row.createdAt).toLocaleString("az-AZ") : "—"}
                    </td>
                    <td className="py-2">
                      {isFullAdmin ? (
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-green-700 hover:bg-green-50"
                            onClick={async () => {
                              try {
                                await approveClientPaymentRequest(row.id);
                                await loadClientPayPending();
                              } catch (e) {
                                alert(e instanceof Error ? e.message : "Xəta");
                              }
                            }}
                          >
                            Təsdiq
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-700 hover:bg-red-50"
                            onClick={async () => {
                              try {
                                await rejectClientPaymentRequest(row.id);
                                await loadClientPayPending();
                              } catch (e) {
                                alert(e instanceof Error ? e.message : "Xəta");
                              }
                            }}
                          >
                            Rədd
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-[#6B7280]">Yalnız tam admin təsdiq edə bilər</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Фильтры */}
      <Card className="p-4 mb-6">
        <div className="grid md:grid-cols-5 gap-4">
          <div className="relative md:col-span-2">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Axtar: ID, sifariş, istifadəçi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
          >
            <option value="all">Bütün statuslar</option>
            <option value="pending">Gözləyir</option>
            <option value="partial">Qismən</option>
            <option value="paid">Ödənilib</option>
            <option value="refunded">Qaytarılıb</option>
          </select>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
          >
            <option value="all">Bütün üsullar</option>
            <option value="cash">Nağd</option>
            <option value="card">Kart</option>
            <option value="transfer">Köçürmə</option>
            <option value="other">Digər</option>
          </select>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
          >
            <option value="all">Bütün tarixlər</option>
            <option value="today">Bu gün</option>
            <option value="week">Son 7 gün</option>
            <option value="month">Son 30 gün</option>
          </select>
        </div>
      </Card>

      {/* Таблица платежей */}
      <Card className="overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Ödəniş ID</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Sifariş</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">İstifadəçi</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Məbləğ</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Ödənilib</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Borc</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Üsul</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Status</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Əməliyyat</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-[#6B7280]">
                  Ödəniş tapılmadı
                </td>
              </tr>
            ) : (
              filteredPayments.map((payment) => {
                const user = users.find(u => u.id === String(payment.userId));
                const debt = Math.max(0, payment.amount - payment.paidAmount);
                
                return (
                  <tr key={payment.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">#{payment.id}</td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-[#6B7280]">{payment.orderNumber || "-"}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-sm">{user?.fullName || payment.userFullName || "Naməlum"}</p>
                        <p className="text-xs text-[#6B7280]">@{user?.username || payment.userUsername || "-"}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-[#1F2937]">
                      {payment.amount.toFixed(2)} AZN
                    </td>
                    <td className="py-3 px-4 text-green-600 font-medium">
                      {payment.paidAmount.toFixed(2)} AZN
                    </td>
                    <td className="py-3 px-4 font-medium">
                      {debt > 0 ? (
                        <span className="text-red-600">{debt.toFixed(2)} AZN</span>
                      ) : (
                        <span className="text-green-600">0 AZN</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        payment.paymentMethod === "cash" ? "bg-green-100 text-green-700" :
                        payment.paymentMethod === "card" ? "bg-blue-100 text-blue-700" :
                        payment.paymentMethod === "transfer" ? "bg-purple-100 text-purple-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {getMethodLabel(payment.paymentMethod)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-1 rounded border ${getStatusColor(payment.paymentStatus)}`}>
                        {payment.paymentStatus === "paid" ? "Ödənilib" : payment.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {false && debt > 0 && payment.paymentStatus !== "refunded" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => addPayment(payment.orderId || 0, debt, "cash")}
                          className="text-green-600 hover:bg-green-50"
                        >
                          <CreditCard className="w-4 h-4 mr-1" />
                          Ödə
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </Card>

      {/* Итоговая строка */}
      {filteredPayments.length > 0 && (
        <Card className="mt-4 p-4 bg-[#1F2937] text-white">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-white/60 text-xs">Göstərilən</p>
                <p className="font-bold">{filteredPayments.length} ədəd</p>
              </div>
              <div>
                <p className="text-white/60 text-xs">Ümumi məbləğ</p>
                <p className="font-bold">{filteredPayments.reduce((s, p) => s + p.amount, 0).toFixed(2)} AZN</p>
              </div>
              <div>
                <p className="text-white/60 text-xs">Ümumi ödənilib</p>
                <p className="font-bold text-green-400">{filteredPayments.reduce((s, p) => s + p.paidAmount, 0).toFixed(2)} AZN</p>
              </div>
              <div>
                <p className="text-white/60 text-xs">Ümumi borc</p>
                <p className="font-bold text-red-400">{filteredPayments.reduce((s, p) => s + (p.amount - p.paidAmount), 0).toFixed(2)} AZN</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white/60 text-xs">Orta ödəniş</p>
              <p className="font-bold">{stats.avgPayment.toFixed(2)} AZN</p>
            </div>
          </div>
        </Card>
      )}

      <Card className="mt-6 p-6">
        <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Transaction History</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--text-muted)] border-b border-[var(--border)]">
                <th className="py-2 pr-2">Tarix</th>
                <th className="py-2 pr-2">İstifadəçi</th>
                <th className="py-2 pr-2">Tip</th>
                <th className="py-2 pr-2">Məbləğ</th>
                <th className="py-2 pr-2">Əvvəl</th>
                <th className="py-2 pr-2">Sonra</th>
                <th className="py-2">Admin</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-4 text-[var(--text-muted)]">Tarixçə boşdur</td>
                </tr>
              ) : (
                history.slice(0, 20).map((h) => (
                  <tr key={h.id} className="border-b border-[var(--border)]/60">
                    <td className="py-2 pr-2 text-[var(--text-muted)]">{new Date(h.createdAt).toLocaleString("az-AZ")}</td>
                    <td className="py-2 pr-2">{h.fullName}</td>
                    <td className="py-2 pr-2">
                      <span className={h.transactionType === "DEBIT" ? "text-red-600" : "text-green-600"}>
                        {h.transactionType}
                      </span>
                    </td>
                    <td className="py-2 pr-2 font-medium">{Number(h.amount).toFixed(2)} AZN</td>
                    <td className="py-2 pr-2">{Number(h.balanceBefore).toFixed(2)} AZN</td>
                    <td className="py-2 pr-2">{Number(h.balanceAfter).toFixed(2)} AZN</td>
                    <td className="py-2 text-[var(--text-muted)]">{h.performedBy || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {modalOpen && txUser && (
        <div className="fixed inset-0 z-[120] bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[var(--text-primary)]">
                {txType === "CREDIT" ? "Ödəniş Yaz" : "Borc Artır"} — @{txUser.username}
              </h3>
              <button type="button" onClick={() => setModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[var(--text-muted)]">Məbləğ (AZN)</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)]"
                />
              </div>
              <div>
                <label className="text-xs text-[var(--text-muted)]">Qeyd (opsional)</label>
                <input
                  type="text"
                  value={txNote}
                  onChange={(e) => setTxNote(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)]"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)} disabled={txSubmitting}>
                  Bağla
                </Button>
                <Button size="sm" onClick={submitTx} loading={txSubmitting}>
                  Təsdiq et
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}