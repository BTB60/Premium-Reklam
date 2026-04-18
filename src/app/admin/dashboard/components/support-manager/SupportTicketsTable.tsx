"use client";

import { MessageSquare, Edit, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { SupportTicket } from "./types";
import {
  getCategoryLabel,
  getPriorityColor,
  getPriorityLabel,
  getStatusColor,
} from "./labels";

export function SupportTicketsTable({
  tickets,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  tickets: SupportTicket[];
  onView: (t: SupportTicket) => void;
  onEdit: (t: SupportTicket) => void;
  onDelete: (id: number) => void;
  onStatusChange: (ticketId: number, status: string) => void;
}) {
  return (
    <Card className="overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">ID</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Mövzu</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">İstifadəçi</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Kateqoriya</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Prioritet</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Status</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Tarix</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Əməliyyat</th>
          </tr>
        </thead>
        <tbody>
          {tickets.length === 0 ? (
            <tr>
              <td colSpan={8} className="py-12 text-center text-[#6B7280]">
                Müraciət tapılmadı
              </td>
            </tr>
          ) : (
            tickets.map((ticket) => (
              <tr
                key={ticket.id}
                className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer"
                onClick={() => onView(ticket)}
              >
                <td className="py-3 px-4 font-medium">#{ticket.id}</td>
                <td className="py-3 px-4">
                  <p className="font-medium text-[#1F2937]">{ticket.subject}</p>
                  <p className="text-xs text-[#6B7280] line-clamp-1">{ticket.message}</p>
                </td>
                <td className="py-3 px-4">
                  <div>
                    <p className="text-sm font-medium">{ticket.userFullName}</p>
                    <p className="text-xs text-[#6B7280]">@{ticket.userUsername}</p>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-700">
                    {getCategoryLabel(ticket.category)}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                    {getPriorityLabel(ticket.priority)}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <select
                    value={ticket.status}
                    onChange={(e) => {
                      e.stopPropagation();
                      onStatusChange(ticket.id, e.target.value);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className={`text-xs px-2 py-1 rounded border ${getStatusColor(ticket.status)}`}
                  >
                    <option value="open">Açıq</option>
                    <option value="in_progress">İcra olunur</option>
                    <option value="resolved">Həll olunub</option>
                    <option value="closed">Bağlandı</option>
                  </select>
                </td>
                <td className="py-3 px-4">
                  <span className="text-sm text-[#6B7280]">
                    {new Date(ticket.createdAt).toLocaleDateString("az-AZ")}
                  </span>
                </td>
                <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => onView(ticket)}
                      className="p-2 text-blue-500 hover:bg-blue-50 rounded"
                      title="Bax"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit(ticket)}
                      className="p-2 text-amber-500 hover:bg-amber-50 rounded"
                      title="Redaktə"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(ticket.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded"
                      title="Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </Card>
  );
}
