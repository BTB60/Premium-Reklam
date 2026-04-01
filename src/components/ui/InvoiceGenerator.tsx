"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { X, Download, FileText, Loader2 } from "lucide-react";

interface Order {
  id: string;
  orderNumber?: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  status?: string;
  totalAmount?: number;
  items?: Array<{
    productName?: string;
    quantity?: number;
    unitPrice?: number;
    lineTotal?: number;
  }>;
  createdAt?: string;
}

interface InvoiceGeneratorProps {
  order: Order;
  onClose?: () => void;
}

export function InvoiceGenerator({ order, onClose }: InvoiceGeneratorProps) {
  const [loading, setLoading] = useState(false);

  const generateInvoice = async () => {
    setLoading(true);

    try {
      // Create invoice HTML
      const invoiceHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Faktura #${order.orderNumber || order.id}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { font-size: 24px; font-weight: bold; color: #D90429; }
    .invoice-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .invoice-info div { flex: 1; }
    .invoice-number { font-size: 18px; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
    th { background-color: #f5f5f5; }
    .total-row { font-weight: bold; background-color: #f5f5f5; }
    .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">Premium Reklam</div>
    <p>Peşəkar Reklam Xidmətləri</p>
  </div>
  
  <div class="invoice-info">
    <div>
      <strong>Müştəri:</strong><br>
      ${order.customerName || "Naməlum"}<br>
      Tel: ${order.customerPhone || "-"}<br>
      Ünvan: ${order.customerAddress || "-"}
    </div>
    <div style="text-align: right;">
      <div class="invoice-number">FAKTURA</div>
      <div>#${order.orderNumber || order.id}</div>
      <div>Tarix: ${order.createdAt ? new Date(order.createdAt).toLocaleDateString("az-AZ") : new Date().toLocaleDateString("az-AZ")}</div>
      <div>Status: ${order.status || "Gözləyir"}</div>
    </div>
  </div>
  
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Məhsul</th>
        <th>Miqdar</th>
        <th>Qiymət</th>
        <th>Cəmi</th>
      </tr>
    </thead>
    <tbody>
      ${order.items?.map((item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${item.productName || "-"}</td>
          <td>${item.quantity || 1}</td>
          <td>${(item.unitPrice || 0).toFixed(2)} ₼</td>
          <td>${(item.lineTotal || 0).toFixed(2)} ₼</td>
        </tr>
      `).join("") || ""}
    </tbody>
    <tfoot>
      <tr class="total-row">
        <td colspan="4">ÜMUMİ:</td>
        <td>${(order.totalAmount || 0).toFixed(2)} ₼</td>
      </tr>
    </tfoot>
  </table>
  
  <div class="footer">
    <p>Təşəkkür edirik ki, Premium Reklam-ı seçdiniz!</p>
    <p>Əlaqə: info@premiumreklam.az | Tel: +994 XX XXX XX XX</p>
  </div>
</body>
</html>
      `;

      // Create blob and download
      const blob = new Blob([invoiceHTML], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Faktura_${order.orderNumber || order.id}.html`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating invoice:", error);
      alert("Faktura yaradıla bilmədi");
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async () => {
    setLoading(true);

    try {
      // Open print dialog for PDF save
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        alert("Popup bağlanıb. Zəhmət olmasa popup icazəsi verin.");
        return;
      }

      printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Faktura #${order.orderNumber || order.id}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { font-size: 24px; font-weight: bold; color: #D90429; }
    .invoice-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .invoice-info div { flex: 1; }
    .invoice-number { font-size: 18px; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
    th { background-color: #f5f5f5; }
    .total-row { font-weight: bold; background-color: #f5f5f5; }
    .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
    @media print { body { margin: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">Premium Reklam</div>
    <p>Peşəkar Reklam Xidmətləri</p>
  </div>
  
  <div class="invoice-info">
    <div>
      <strong>Müştəri:</strong><br>
      ${order.customerName || "Naməlum"}<br>
      Tel: ${order.customerPhone || "-"}<br>
      Ünvan: ${order.customerAddress || "-"}
    </div>
    <div style="text-align: right;">
      <div class="invoice-number">FAKTURA</div>
      <div>#${order.orderNumber || order.id}</div>
      <div>Tarix: ${order.createdAt ? new Date(order.createdAt).toLocaleDateString("az-AZ") : new Date().toLocaleDateString("az-AZ")}</div>
      <div>Status: ${order.status || "Gözləyir"}</div>
    </div>
  </div>
  
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Məhsul</th>
        <th>Miqdar</th>
        <th>Qiymət</th>
        <th>Cəmi</th>
      </tr>
    </thead>
    <tbody>
      ${order.items?.map((item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${item.productName || "-"}</td>
          <td>${item.quantity || 1}</td>
          <td>${(item.unitPrice || 0).toFixed(2)} ₼</td>
          <td>${(item.lineTotal || 0).toFixed(2)} ₼</td>
        </tr>
      `).join("") || ""}
    </tbody>
    <tfoot>
      <tr class="total-row">
        <td colspan="4">ÜMUMİ:</td>
        <td>${(order.totalAmount || 0).toFixed(2)} ₼</td>
      </tr>
    </tfoot>
  </table>
  
  <div class="footer">
    <p>Təşəkkür edirik ki, Premium Reklam-ı seçdiniz!</p>
    <p>Əlaqə: info@premiumreklam.az | Tel: +994 XX XXX XX XX</p>
  </div>
  
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>
      `);
      printWindow.document.close();
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("PDF yaradıla bilmədi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[#1F2937]">Faktura Yarat</h2>
          {onClose && (
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <FileText className="w-10 h-10 text-[#D90429]" />
            <div>
              <p className="font-medium">Sifariş #{order.orderNumber || order.id}</p>
              <p className="text-sm text-gray-500">
                {order.customerName || "Naməlum müştəri"}
              </p>
              <p className="text-lg font-bold text-[#D90429]">
                {(order.totalAmount || 0).toFixed(2)} ₼
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={generateInvoice}
            disabled={loading}
            className="w-full"
            icon={loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          >
            HTML Olaraq Yüklə
          </Button>

          <Button
            onClick={generatePDF}
            disabled={loading}
            variant="secondary"
            className="w-full"
            icon={loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          >
            PDF Olaraq Çap Et
          </Button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
          PDF yaratmaq üçün brauzerdə "Fayl → PDF Olaraq Saxla" seçin
        </p>
      </Card>
    </div>
  );
}
