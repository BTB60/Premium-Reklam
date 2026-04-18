"use client";

import { User, Calendar, Edit, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { WorkerDashboardTask } from "./types";
import { getPriorityColor, getPriorityLabel } from "./labels";

export function WorkerTasksTable({
  tasks,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  tasks: WorkerDashboardTask[];
  onEdit: (t: WorkerDashboardTask) => void;
  onDelete: (id: number) => void;
  onStatusChange: (taskId: number, status: string) => void;
}) {
  return (
    <Card className="overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">ID</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Tapşırıq</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">İşçi</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Prioritet</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Son tarix</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Status</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Əməliyyat</th>
          </tr>
        </thead>
        <tbody>
          {tasks.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-12 text-center text-[#6B7280]">
                Tapşırıq tapılmadı
              </td>
            </tr>
          ) : (
            tasks.map((task) => {
              const isOverdue =
                !!task.dueDate && task.status !== "completed" && new Date(task.dueDate) < new Date();

              return (
                <tr
                  key={task.id}
                  className={`border-t border-gray-100 hover:bg-gray-50 ${isOverdue ? "bg-red-50" : ""}`}
                >
                  <td className="py-3 px-4 font-medium">#{task.id}</td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-[#1F2937]">{task.title}</p>
                    {task.description && (
                      <p className="text-xs text-[#6B7280] line-clamp-1">{task.description}</p>
                    )}
                    {task.orderNumber && (
                      <p className="text-xs text-blue-600 mt-1">Sifariş: #{task.orderNumber}</p>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {task.assignedToName ? (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{task.assignedToName}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-[#6B7280]">Təyin edilməyib</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      {getPriorityLabel(task.priority)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {task.dueDate ? (
                      <div className="flex items-center gap-1">
                        <Calendar className={`w-4 h-4 ${isOverdue ? "text-red-500" : "text-gray-400"}`} />
                        <span className={`text-sm ${isOverdue ? "text-red-600 font-medium" : "text-[#6B7280]"}`}>
                          {new Date(task.dueDate).toLocaleDateString("az-AZ")}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-[#6B7280]">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={task.status}
                      onChange={(e) => onStatusChange(task.id, e.target.value)}
                      className={`text-xs px-2 py-1 rounded border ${
                        task.status === "completed"
                          ? "bg-green-100 text-green-700 border-green-200"
                          : task.status === "in_progress"
                            ? "bg-blue-100 text-blue-700 border-blue-200"
                            : task.status === "cancelled"
                              ? "bg-gray-100 text-gray-700 border-gray-200"
                              : "bg-amber-100 text-amber-700 border-amber-200"
                      }`}
                    >
                      <option value="pending">Gözləyir</option>
                      <option value="in_progress">İcra olunur</option>
                      <option value="completed">Tamamlandı</option>
                      <option value="cancelled">Ləğv edildi</option>
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit(task)}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded"
                        title="Redaktə"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(task.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded"
                        title="Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </Card>
  );
}
