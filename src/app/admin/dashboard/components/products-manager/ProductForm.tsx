"use client";

import { Edit, Plus, Save, X, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PRODUCT_CATEGORIES } from "./constants";

export function ProductForm({
  editingId,
  formError,
  name,
  setName,
  category,
  setCategory,
  unitPrice,
  setUnitPrice,
  purchasePrice,
  setPurchasePrice,
  width,
  setWidth,
  height,
  setHeight,
  status,
  setStatus,
  description,
  setDescription,
  imageUrl,
  setImageUrl,
  onSubmit,
  onCancel,
}: {
  editingId: number | null;
  formError: string;
  name: string;
  setName: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  unitPrice: string;
  setUnitPrice: (v: string) => void;
  purchasePrice: string;
  setPurchasePrice: (v: string) => void;
  width: string;
  setWidth: (v: string) => void;
  height: string;
  setHeight: (v: string) => void;
  status: string;
  setStatus: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  imageUrl: string;
  setImageUrl: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}) {
  return (
    <Card className="p-6 mb-6 border-2 border-[#D90429]">
      <h3 className="font-bold text-[#1F2937] mb-4 flex items-center gap-2">
        {editingId ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        {editingId ? "Məhsulu redaktə et" : "Yeni məhsul əlavə et"}
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
            <label className="block text-sm font-medium text-[#6B7280] mb-1">Ad *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#6B7280] mb-1">Kateqoriya</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
            >
              <option value="">Seçin (default: Banner)</option>
              {PRODUCT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#6B7280] mb-1">Satış qiyməti (AZN) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#6B7280] mb-1">Alış qiyməti (AZN)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
              placeholder="0.00"
            />
            <p className="text-xs text-[#9CA3AF] mt-1">İstifadəçi tərəfində göstərilmir</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#6B7280] mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
            >
              <option value="active">Aktiv</option>
              <option value="inactive">Qeyri-aktiv</option>
              <option value="draft">Qaralama</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#6B7280] mb-1">En (m)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#6B7280] mb-1">Hündürlük (m)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#6B7280] mb-1">Təsvir</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#6B7280] mb-1">Şəkil URL</label>
          <div className="flex gap-2">
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
            />
            {imageUrl && <img src={imageUrl} alt="" className="w-10 h-10 object-cover rounded border" />}
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
