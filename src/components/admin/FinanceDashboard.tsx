"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { finance, type FinancialTransaction } from "@/lib/db";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Plus,
  Calendar,
  DollarSign,
  Trash2,
  Filter,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface FinanceDashboardProps {
  transactions: FinancialTransaction[];
}

export function FinanceDashboard({ transactions }: FinanceDashboardProps) {
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [formData, setFormData] = useState({
    type: "income" as "income" | "expense",
    category: "",
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });

  const summary = useMemo(() => {
    const income = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    return { income, expense, balance: income - expense };
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    let filtered = transactions;
    if (filterType !== "all") {
      filtered = filtered.filter((t) => t.type === filterType);
    }
    if (dateRange.start) {
      filtered = filtered.filter((t) => t.date >= dateRange.start);
    }
    if (dateRange.end) {
      filtered = filtered.filter((t) => t.date <= dateRange.end);
    }
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filterType, dateRange]);

  const monthlyData = useMemo(() => {
    const months: Record<string, { income: number; expense: number }> = {};
    transactions.forEach((t) => {
      const month = t.date.slice(0, 7);
      if (!months[month]) months[month] = { income: 0, expense: 0 };
      if (t.type === "income") months[month].income += t.amount;
      else months[month].expense += t.amount;
    });
    return Object.entries(months)
      .sort()
      .slice(-6)
      .map(([month, data]) => ({
        month: month.slice(5),
        ...data,
      }));
  }, [transactions]);

  const handleSubmit = () => {
    if (!formData.category || !formData.amount) return;
    finance.create({
      type: formData.type,
      category: formData.category,
      amount: parseFloat(formData.amount),
      description: formData.description,
      date: formData.date,
      createdBy: "admin",
    });
    setShowForm(false);
    window.location.reload();
  };

  const handleDelete = (id: string) => {
    if (confirm("Əməliyyatı silmək istədiyinizə əminsiniz?")) {
      finance.delete(id);
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Ümumi Gəlir</p>
              <p className="text-xl font-bold text-emerald-600">{summary.income.toFixed(2)} AZN</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Ümumi Xərc</p>
              <p className="text-xl font-bold text-red-600">{summary.expense.toFixed(2)} AZN</p>
            </div>
          </div>
        </Card>

        <Card className={`p-4 ${summary.balance >= 0 ? "bg-emerald-50" : "bg-red-50"}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${summary.balance >= 0 ? "bg-emerald-200" : "bg-red-200"}`}>
              <Wallet className={`w-5 h-5 ${summary.balance >= 0 ? "text-emerald-700" : "text-red-700"}`} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Balans</p>
              <p className={`text-xl font-bold ${summary.balance >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                {summary.balance.toFixed(2)} AZN
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Chart */}
      <Card className="p-6">
        <h3 className="font-bold mb-4">Aylıq Gəlir/Xərc</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="income" name="Gəlir" fill="#10B981" />
            <Bar dataKey="expense" name="Xərc" fill="#EF4444" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Add Transaction */}
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(true)} icon={<Plus className="w-4 h-4" />}>
          Yeni Əməliyyat
        </Button>
      </div>

      {showForm && (
        <Card className="p-6">
          <h3 className="font-bold mb-4">Yeni Əməliyyat</h3>
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tip</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as "income" | "expense" })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="income">Gəlir</option>
                <option value="expense">Xərc</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Kateqoriya</label>
              <Input
                value={formData.category}
                onChange={(value) => setFormData({ ...formData, category: value })}
                placeholder="Məs: Satış, Əmək haqqı"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Məbləğ (AZN)</label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(value) => setFormData({ ...formData, amount: value })}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tarix</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div className="md:col-span-4">
              <label className="block text-sm font-medium mb-1">Açıqlama</label>
              <Input
                value={formData.description}
                onChange={(value) => setFormData({ ...formData, description: value })}
                placeholder="Əməliyyat haqqında əlavə məlumat"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleSubmit}>Yadda Saxla</Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Ləğv Et</Button>
          </div>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex gap-2">
          {["all", "income", "expense"].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type as "all" | "income" | "expense")}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                filterType === type
                  ? "bg-[#D90429] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {type === "all" ? "Hamısı" : type === "income" ? "Gəlir" : "Xərc"}
            </button>
          ))}
        </div>
        <div className="flex gap-2 items-center">
          <Calendar className="w-4 h-4 text-gray-400" />
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="w-32 px-3 py-2 border rounded-lg"
          />
          <span className="text-gray-400">-</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="w-32 px-3 py-2 border rounded-lg"
          />
        </div>
      </div>

      {/* Transactions List */}
      <Card className="p-6">
        <h3 className="font-bold mb-4">Əməliyyatlar</h3>
        <div className="space-y-2">
          {filteredTransactions.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Əməliyyat yoxdur</p>
          ) : (
            filteredTransactions.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      t.type === "income" ? "bg-emerald-100" : "bg-red-100"
                    }`}
                  >
                    {t.type === "income" ? (
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{t.category}</p>
                    <p className="text-sm text-gray-500">{t.description}</p>
                    <p className="text-xs text-gray-400">{t.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`font-bold ${
                      t.type === "income" ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {t.type === "income" ? "+" : "-"}
                    {t.amount.toFixed(2)} AZN
                  </span>
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
