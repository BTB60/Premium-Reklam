"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { type User, type Payment } from "@/lib/db";
import {
  Wallet,
  CreditCard,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  FileText,
} from "lucide-react";

interface PaymentsDashboardProps {
  user: User;
  payments: Payment[];
}

export function PaymentsDashboard({ user, payments }: PaymentsDashboardProps) {
  const stats = useMemo(() => {
    const totalPaid = payments
      .filter(p => p.type === "payment")
      .reduce((sum, p) => sum + p.amount, 0);
    const totalDebt = payments
      .filter(p => p.type === "debt")
      .reduce((sum, p) => sum + p.amount, 0);
    const balance = totalPaid - totalDebt;
    
    return {
      totalPaid,
      totalDebt,
      balance,
      hasDebt: balance < 0,
    };
  }, [payments]);

  const recentPayments = useMemo(() => {
    return payments.slice().sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ).slice(0, 10);
  }, [payments]);

  const getPaymentIcon = (type: Payment["type"]) => {
    switch (type) {
      case "payment":
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case "debt":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case "refund":
        return <TrendingUp className="w-5 h-5 text-blue-600" />;
      default:
        return <CreditCard className="w-5 h-5 text-gray-600" />;
    }
  };

  const getPaymentTypeName = (type: Payment["type"]) => {
    switch (type) {
      case "payment":
        return "Ödəniş";
      case "debt":
        return "Borc";
      case "refund":
        return "Geri ödəniş";
      default:
        return type;
    }
  };

  const getMethodName = (method?: Payment["method"]) => {
    switch (method) {
      case "cash":
        return "Nağd";
      case "card":
        return "Kart";
      case "transfer":
        return "Bank köçürməsi";
      default:
        return "-";
    }
  };

  return (
    <div className="space-y-6">
      {/* Balance Overview */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Ümumi ödəniş</p>
              <p className="text-xl font-bold text-[#1F2937]">{stats.totalPaid.toFixed(2)} AZN</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Ümumi borc</p>
              <p className="text-xl font-bold text-[#1F2937]">{stats.totalDebt.toFixed(2)} AZN</p>
            </div>
          </div>
        </Card>

        <Card className={`p-4 ${stats.hasDebt ? "bg-red-50 border-red-200" : ""}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              stats.hasDebt ? "bg-red-200" : "bg-emerald-100"
            }`}>
              <Wallet className={`w-5 h-5 ${stats.hasDebt ? "text-red-600" : "text-emerald-600"}`} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Balans</p>
              <p className={`text-xl font-bold ${stats.hasDebt ? "text-red-600" : "text-emerald-600"}`}>
                {stats.balance.toFixed(2)} AZN
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Debt Warning */}
      {stats.hasDebt && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">Borc xəbərdarlığı</p>
              <p className="text-sm text-red-600">
                Sizin {Math.abs(stats.balance).toFixed(2)} AZN borcunuz var. Zəhmət olmazsa, tezliklə ödəniş edin.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Payment Summary */}
      <Card className="p-6">
        <h3 className="font-bold text-[#1F2937] mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#D90429]" />
          Ödəniş tarixçəsi
        </h3>
        
        {recentPayments.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Hələ ödəniş tarixçəsi yoxdur</p>
        ) : (
          <div className="space-y-2">
            {recentPayments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                    {getPaymentIcon(payment.type)}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{payment.description}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{getPaymentTypeName(payment.type)}</span>
                      {payment.method && (
                        <>
                          <span>•</span>
                          <span>{getMethodName(payment.method)}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>{new Date(payment.createdAt).toLocaleDateString("az-AZ")}</span>
                    </div>
                  </div>
                </div>
                <span
                  className={`font-bold ${
                    payment.type === "payment" || payment.type === "refund"
                      ? "text-emerald-600"
                      : "text-red-500"
                  }`}
                >
                  {payment.type === "payment" || payment.type === "refund" ? "+" : "-"}
                  {payment.amount.toFixed(2)} AZN
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Payment Methods Info */}
      <Card className="p-6">
        <h3 className="font-bold text-[#1F2937] mb-4">Ödəniş üsulları</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-2xl">💵</span>
            </div>
            <p className="font-medium">Nağd</p>
            <p className="text-xs text-gray-500">Ofisdə ödəniş</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-2xl">💳</span>
            </div>
            <p className="font-medium">Kart</p>
            <p className="text-xs text-gray-500">POS terminal</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-2xl">🏦</span>
            </div>
            <p className="font-medium">Bank köçürməsi</p>
            <p className="text-xs text-gray-500">Onlayn ödəniş</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
