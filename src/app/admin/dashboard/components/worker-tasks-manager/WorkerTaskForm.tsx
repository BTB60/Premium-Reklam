"use client";

import type { Dispatch, SetStateAction } from "react";
import { Edit, Plus, CheckCircle, Trash2, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { WorkerDashboardTask, WorkerDashboardUser } from "./types";

export function WorkerTaskForm({
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
  formData: Partial<WorkerDashboardTask>;
  setFormData: Dispatch<SetStateAction<Partial<WorkerDashboardTask>>>;
  users: WorkerDashboardUser[];
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}) {
  return (
    <Card className="p-6 mb-6 border-2 border-[#D90429]">
      <h3 className="font-bold text-[#1F2937] mb-4 flex items-center gap-2">
        {editingId ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        {editingId ? "Tapşırığı redaktə et" : "Yeni tapşırıq əlavə et"}
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
              value={formData.title || ""}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#6B7280] mb-1">İşçi</label>
            <select
              value={formData.assignedTo || ""}
              onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
            >
              <option value="">Seçilməyib</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#6B7280] mb-1">Status</label>
            <select
              value={formData.status || "pending"}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as WorkerDashboardTask["status"] })
              }
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
            >
              <option value="pending">Gözləyir</option>
              <option value="in_progress">İcra olunur</option>
              <option value="completed">Tamamlandı</option>
              <option value="cancelled">Ləğv edildi</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#6B7280] mb-1">Prioritet</label>
            <select
              value={formData.priority || "medium"}
              onChange={(e) =>
                setFormData({ ...formData, priority: e.target.value as WorkerDashboardTask["priority"] })
              }
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
            >
              <option value="low">Aşağı</option>
              <option value="medium">Orta</option>
              <option value="high">Yüksək</option>
              <option value="urgent">Təcili</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-[#6B7280] mb-1">
              Təxmini bitmə vaxtı (tarix və saat)
            </label>
            <input
              type="datetime-local"
              value={formData.dueDate || ""}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
            />
            <p className="mt-1 text-xs text-[#9CA3AF]">
              Statusu “İcra olunur” etməzdən əvvəl doldurun — sonra geri sayım işləyir.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#6B7280] mb-1">Sifariş (əgər varsa)</label>
            <input
              type="number"
              value={formData.orderId || ""}
              onChange={(e) =>
                setFormData({ ...formData, orderId: parseInt(e.target.value, 10) || undefined })
              }
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
              placeholder="ID"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#6B7280] mb-1">Təsvir</label>
          <textarea
            value={formData.description || ""}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#6B7280] mb-1">Qeyd</label>
          <textarea
            value={formData.note || ""}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            rows={2}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" icon={<CheckCircle className="w-4 h-4" />}>
            Yadda saxla
          </Button>
          <Button variant="ghost" onClick={onCancel} icon={<Trash2 className="w-4 h-4" />}>
            Ləğv et
          </Button>
        </div>
      </form>
    </Card>
  );
}
