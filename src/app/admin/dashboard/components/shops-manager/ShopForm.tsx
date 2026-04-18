"use client";

import type { Dispatch, SetStateAction } from "react";
import { Edit, Plus, Save, X, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { DashboardShop, ShopUserOption } from "./types";

export function ShopForm({
  editingId,
  formError,
  formData,
  setFormData,
  users,
  onSubmit,
  onCancel,
}: {
  editingId: number | null;
  formError: string;
  formData: Partial<DashboardShop>;
  setFormData: Dispatch<SetStateAction<Partial<DashboardShop>>>;
  users: ShopUserOption[];
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}) {
  return (
    <Card className="p-6 mb-6 border-2 border-[#D90429]">
      <h3 className="font-bold text-[#1F2937] mb-4 flex items-center gap-2">
        {editingId ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        {editingId ? "Mağazanı redaktə et" : "Yeni mağaza əlavə et"}
      </h3>

      {formError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {formError}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#6B7280] mb-1">İstifadəçi *</label>
            <select
              value={formData.userId || ""}
              onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
              required
              disabled={!!editingId}
            >
              <option value="">Seçin</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} (@{u.username})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#6B7280] mb-1">Mağaza adı *</label>
            <input
              type="text"
              value={formData.name || ""}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#6B7280] mb-1">Telefon</label>
            <input
              type="tel"
              value={formData.phone || ""}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
              placeholder="+994 XX XXX XX XX"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#6B7280] mb-1">Email</label>
            <input
              type="email"
              value={formData.email || ""}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-[#6B7280] mb-1">Ünvan</label>
            <input
              type="text"
              value={formData.address || ""}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
              placeholder="Şəhər, küçə, ev"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-[#6B7280] mb-1">Təsvir</label>
            <textarea
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#6B7280] mb-1">Status</label>
            <select
              value={formData.status || "active"}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as DashboardShop["status"] })
              }
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
            >
              <option value="active">Aktiv</option>
              <option value="pending">Gözləyir</option>
              <option value="inactive">Qeyri-aktiv</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="submit" icon={<Save className="w-4 h-4" />}>
            Yadda saxla
          </Button>
          <Button variant="ghost" onClick={onCancel} icon={<X className="w-4 h-4" />}>
            Ləğv et
          </Button>
        </div>
      </form>
    </Card>
  );
}
