"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { type Order, type User } from "@/lib/db";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  Users,
  Package,
  DollarSign,
  ShoppingBag,
  Award,
} from "lucide-react";

interface AnalyticsDashboardProps {
  orders: Order[];
  users: User[];
}

const COLORS = ["#D90429", "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6"];

export function AnalyticsDashboard({ orders, users }: AnalyticsDashboardProps) {
  // Calculate stats
  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, o) => sum + o.finalTotal, 0);
    const totalOrders = orders.length;
    const totalCustomers = users.filter(u => u.role === "DECORATOR").length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    const statusCounts = orders.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      totalRevenue,
      totalOrders,
      totalCustomers,
      avgOrderValue,
      statusCounts,
    };
  }, [orders, users]);

  // Daily sales data (last 7 days)
  const dailySales = useMemo(() => {
    const days = 7;
    const data = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      
      const dayOrders = orders.filter(o => o.createdAt.startsWith(dateStr));
      const revenue = dayOrders.reduce((sum, o) => sum + o.finalTotal, 0);
      
      data.push({
        date: date.toLocaleDateString("az-AZ", { weekday: "short" }),
        revenue,
        orders: dayOrders.length,
      });
    }
    return data;
  }, [orders]);

  // Monthly sales data
  const monthlySales = useMemo(() => {
    const months = 6;
    const data = [];
    const now = new Date();
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = date.toISOString().slice(0, 7);
      
      const monthOrders = orders.filter(o => o.createdAt.startsWith(monthStr));
      const revenue = monthOrders.reduce((sum, o) => sum + o.finalTotal, 0);
      
      data.push({
        month: date.toLocaleDateString("az-AZ", { month: "short" }),
        revenue,
        orders: monthOrders.length,
      });
    }
    return data;
  }, [orders]);

  // Status distribution
  const statusData = useMemo(() => {
    const statusNames: Record<string, string> = {
      pending: "Gözləyir",
      approved: "Təsdiqləndi",
      design: "Dizayn",
      printing: "Çap",
      production: "İstehsalat",
      ready: "Hazır",
      delivering: "Çatdırılma",
      completed: "Tamamlandı",
      cancelled: "Ləğv edildi",
    };
    
    return Object.entries(stats.statusCounts).map(([status, count]) => ({
      name: statusNames[status] || status,
      value: count,
    }));
  }, [stats.statusCounts]);

  // Top customers
  const topCustomers = useMemo(() => {
    const customerStats = users
      .filter(u => u.role === "DECORATOR")
      .map(u => ({
        name: u.fullName,
        orders: u.totalOrders,
        spent: u.totalSales,
      }))
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 5);
    return customerStats;
  }, [users]);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Ümumi Gəlir</p>
              <p className="text-lg font-bold">{(stats.totalRevenue || 0).toFixed(0)} AZN</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Sifarişlər</p>
              <p className="text-lg font-bold">{stats.totalOrders}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Müştərilər</p>
              <p className="text-lg font-bold">{stats.totalCustomers}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Orta Sifariş</p>
              <p className="text-lg font-bold">{(stats.avgOrderValue || 0).toFixed(0)} AZN</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Daily Sales Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#D90429]" />
            Son 7 gün satışları
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dailySales}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value} AZN`, "Gəlir"]} />
              <Bar dataKey="revenue" fill="#D90429" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Monthly Sales Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-[#D90429]" />
            Aylıq satışlar
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlySales}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value} AZN`, "Gəlir"]} />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#D90429"
                strokeWidth={2}
                dot={{ fill: "#D90429" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Status Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-[#D90429]" />
            Sifariş statusları
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {statusData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-4 justify-center">
            {statusData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-1 text-xs">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span>{entry.name}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Customers */}
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#D90429]" />
            Ən yaxşı müştərilər
          </h3>
          <div className="space-y-3">
            {topCustomers.map((customer, index) => (
              <div
                key={customer.name}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#D90429] text-white rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{customer.name}</p>
                    <p className="text-xs text-gray-500">{customer.orders} sifariş</p>
                  </div>
                </div>
                <p className="font-bold text-[#D90429]">{(customer.spent || 0).toFixed(0)} AZN</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
