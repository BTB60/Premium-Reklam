"use client";

import type { Dispatch, SetStateAction } from "react";
import { Edit, Plus, Send, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { SupportTicket, SupportTicketUser } from "./types";

export function SupportTicketForm({
  users,
  selectedTicket,
  formData,
  setFormData,
  onSubmit,
  onCancel,
}: {
  users: SupportTicketUser[];
  selectedTicket: SupportTicket | null;
  formData: Partial<SupportTicket>;
   setFormData: Dispatch<SetStateAction<Partial<SupportTicket>>>;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}) {
  return (
    <Card className="p-6 mb-6 border-2 border-[#D90429]">
      <h3 className="font-bold text-[#1F2937] mb-4 flex items-center gap-2">
        {selectedTicket ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        {selectedTicket ? "Müraciəti redaktə et" : "Yeni müraciət əlavə et"}
      </h3>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#6B7280] mb-1">İstifadəçi *</label>
            <select
              value={formData.userId || ""}
              onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
              required
              disabled={!!selectedTicket}
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
            <label className="block text-sm font-medium text-[#6B7280] mb-1">Mövzu *</label>
            <input
              type="text"
              value={formData.subject || ""}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#6B7280] mb-1">Kateqoriya</label>
            <select
              value={formData.category || "other"}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as SupportTicket["category"] })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
            >
              <option value="technical">Texniki</option>
              <option value="billing">Ödəniş</option>
              <option value="order">Sifariş</option>
              <option value="account">Hesab</option>
              <option value="other">Digər</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#6B7280] mb-1">Prioritet</label>
            <select
              value={formData.priority || "medium"}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as SupportTicket["priority"] })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
            >
              <option value="low">Aşağı</option>
              <option value="medium">Orta</option>
              <option value="high">Yüksək</option>
              <option value="urgent">Təcili</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#6B7280] mb-1">Status</label>
            <select
              value={formData.status || "open"}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as SupportTicket["status"] })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
            >
              <option value="open">Açıq</option>
              <option value="in_progress">İcra olunur</option>
              <option value="resolved">Həll olunub</option>
              <option value="closed">Bağlandı</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#6B7280] mb-1">Təyin et</label>
            <select
              value={formData.assignedTo || ""}
              onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
            >
              <option value="">Seçilməyib</option>
              {users
                .filter((u) => u.username !== "admin")
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName}
                  </option>
                ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#6B7280] mb-1">Mesaj *</label>
          <textarea
            value={formData.message || ""}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
            required
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" icon={<Send className="w-4 h-4" />}>
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
