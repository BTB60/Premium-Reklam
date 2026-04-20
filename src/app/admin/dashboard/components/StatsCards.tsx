"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Users, Package, TrendingUp, Award, RefreshCw, Wallet, Bell } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getAdminBearerToken, getAdminDashboardApiBase } from "./admin-dashboard-api";

type DashboardStats = {
  totalUsers: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  adminCount: number;
  decorcuCount: number;
};

type RecentOrder = {
  id?: string | number;
  orderNumber?: string;
  customerName?: string;
  totalAmount?: number;
  createdAt?: string;
};

type ActiveTab = "dashboard" | "users" | "orders" | "shops" | "elan" | "notifications" | "analytics" | "products" | "finance" | "inventory" | "workerTasks" | "support" | "settings" | "tasks" | "accessSettings" | "auditLogs";

interface StatsCardsProps {
  onNavigate?: (tab: ActiveTab) => void;
}

export default function StatsCards({ onNavigate }: StatsCardsProps) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    adminCount: 0,
    decorcuCount: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);

  const load = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const token = getAdminBearerToken();
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      const base = getAdminDashboardApiBase();

      const [statsRes, ordersRes] = await Promise.all([
        fetch(`${base}/admin/dashboard`, { headers }),
        fetch(`${base}/admin/orders`, { headers }),
      ]);

      if (statsRes.ok) {
        const data = (await statsRes.json()) as Record<string, unknown>;
        setStats({
          totalUsers: Number(data.totalUsers || 0),
          totalOrders: Number(data.totalOrders || 0),
          pendingOrders: Number(data.pendingOrders || 0),
          totalRevenue: Number(data.totalRevenue || 0),
          adminCount: Number(data.adminCount || 0),
          decorcuCount: Number(data.decorcuCount || 0),
        });
      }

      if (ordersRes.ok) {
        const ordersData = (await ordersRes.json()) as RecentOrder[];
        const list = Array.isArray(ordersData) ? ordersData : [];
        list.sort((a, b) => {
          const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return tb - ta;
        });
        setRecentOrders(list.slice(0, 5));
      } else {
        setRecentOrders([]);
      }
      setLastUpdatedAt(new Date().toLocaleTimeString("az-AZ"));
    } catch (e) {
      console.error("[StatsCards] load failed:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const roleBreakdown = useMemo(
    () => ({
      decorators: stats.decorcuCount,
      admins: stats.adminCount,
    }),
    [stats.decorcuCount, stats.adminCount]
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Dashboard</h1>

      <Card className="p-5 mb-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-[var(--text-muted)]">Sürətli əməliyyatlar</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Son yenilənmə: {lastUpdatedAt || "—"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" icon={<Users className="w-4 h-4" />} onClick={() => onNavigate?.("users")}>
              İstifadəçilər
            </Button>
            <Button size="sm" variant="secondary" icon={<Package className="w-4 h-4" />} onClick={() => onNavigate?.("orders")}>
              Sifarişlər
            </Button>
            <Button size="sm" variant="secondary" icon={<Wallet className="w-4 h-4" />} onClick={() => onNavigate?.("finance")}>
              Maliyyə
            </Button>
            <Button size="sm" variant="ghost" icon={<RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />} onClick={() => void load(true)} disabled={refreshing || loading}>
              Yenilə
            </Button>
          </div>
        </div>
      </Card>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[var(--text-muted)] text-sm">Ümumi İstifadəçi</p>
              <p className="text-3xl font-bold text-[var(--text-primary)]">{loading ? "..." : stats.totalUsers}</p>
            </div>
            <div className="w-12 h-12 bg-[#fff0e6] border border-[#ffd2b6] rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-[#ff6600]" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[var(--text-muted)] text-sm">Ümumi Sifariş</p>
              <p className="text-3xl font-bold text-[var(--text-primary)]">{loading ? "..." : stats.totalOrders}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[var(--text-muted)] text-sm">Gözləyən Sifariş</p>
              <p className="text-3xl font-bold text-[var(--text-primary)]">{loading ? "..." : stats.pendingOrders}</p>
            </div>
            <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-amber-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[var(--text-muted)] text-sm">Ümumi Gəlir</p>
              <p className="text-3xl font-bold text-[var(--text-primary)]">
                {loading ? "..." : `${stats.totalRevenue.toFixed(0)} AZN`}
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-emerald-500" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">İstifadəçi Rolleri</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Decorator</span>
              <span className="font-semibold">{loading ? "..." : roleBreakdown.decorators}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Admin</span>
              <span className="font-semibold">{loading ? "..." : roleBreakdown.admins}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">Son Sifarişlər</h3>
          {loading ? (
            <p className="text-[var(--text-muted)] text-sm">Yüklənir...</p>
          ) : recentOrders.length === 0 ? (
            <p className="text-[var(--text-muted)] text-sm">Sifariş tapılmadı</p>
          ) : (
            <div className="space-y-2">
              {recentOrders.map((o) => (
                <div key={String(o.id ?? o.orderNumber)} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">#{o.orderNumber || o.id}</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {o.customerName || "Müştəri"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[var(--text-primary)]">
                      {(Number(o.totalAmount || 0)).toFixed(2)} AZN
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-6 mt-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-[var(--text-primary)]">Canlı Status</h3>
            <p className="text-sm text-[var(--text-muted)] mt-1">Gözləyən sifarişlər və bildiriş axını</p>
          </div>
          <Bell className="w-5 h-5 text-[#ff6600]" />
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl border border-[var(--border)] p-4 bg-[var(--card)]">
            <p className="text-xs text-[var(--text-muted)]">Pending nisbəti</p>
            <p className="text-xl font-semibold text-[var(--text-primary)]">
              {loading || stats.totalOrders === 0 ? "0%" : `${Math.round((stats.pendingOrders / stats.totalOrders) * 100)}%`}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border)] p-4 bg-[var(--card)]">
            <p className="text-xs text-[var(--text-muted)]">Aktivlik göstəricisi</p>
            <p className="text-xl font-semibold text-[var(--text-primary)]">
              {loading ? "..." : recentOrders.length > 0 ? "Yüksək" : "Aşağı"}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}