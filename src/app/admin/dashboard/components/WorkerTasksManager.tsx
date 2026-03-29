"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { 
  Search, Download, Plus, Edit, Trash2, CheckCircle, Clock, 
  AlertCircle, Calendar, User, Filter, ClipboardList
} from "lucide-react";

interface Task {
  id: number;
  title: string;
  description?: string;
  assignedTo?: string;
  assignedToName?: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  dueDate?: string;
  createdAt: string;
  completedAt?: string;
  orderId?: number;
  orderNumber?: string;
  note?: string;
}

interface User {
  id: string;
  fullName: string;
  username: string;
  role: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL 
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : "https://premium-reklam-backend.onrender.com/api";

export default function WorkerTasksManager() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formError, setFormError] = useState("");

  const [formData, setFormData] = useState<Partial<Task>>({
    title: "",
    description: "",
    assignedTo: "",
    status: "pending",
    priority: "medium",
    dueDate: "",
    orderId: undefined,
    note: "",
  });

  useEffect(() => {
    loadTasks();
    loadUsers();
  }, []);

  const getToken = () => {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem("decor_current_user");
    if (!stored) return null;
    try {
      const parsed = JSON.parse(stored);
      return parsed?.token || null;
    } catch {
      return null;
    }
  };

  const loadTasks = async () => {
    try {
      const token = getToken();
      // Пока нет эндпоинта задач - используем заглушку
      // Когда бэкенд будет готов - заменить на fetch(`${API_BASE}/tasks`)
      const stored = localStorage.getItem("decor_tasks");
      if (stored) {
        setTasks(JSON.parse(stored));
      }
    } catch (error) {
      console.error("[Tasks] Load error:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/users`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data?.users || [];
        // Фильтруем только рабочих (не админов)
        const workers = list.filter((u: User) => u.role !== "ADMIN");
        setUsers(workers);
      }
    } catch (error) {
      console.error("[Tasks] Load users error:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      assignedTo: "",
      status: "pending",
      priority: "medium",
      dueDate: "",
      orderId: undefined,
      note: "",
    });
    setFormError("");
  };

  const handleEdit = (task: Task) => {
    setEditingId(task.id);
    setFormData({
      title: task.title,
      description: task.description,
      assignedTo: task.assignedTo,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate?.split("T")[0] || "",
      orderId: task.orderId,
      note: task.note,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.title?.trim()) {
      setFormError("Ad tələb olunur");
      return;
    }

    try {
      const token = getToken();
      const method = editingId ? "PUT" : "POST";
      const url = editingId 
        ? `${API_BASE}/tasks/${editingId}` 
        : `${API_BASE}/tasks`;

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        await loadTasks();
        setShowForm(false);
        setEditingId(null);
        resetForm();
      } else {
        throw new Error("API error");
      }
    } catch (error) {
      console.error("[Tasks] Save error:", error);
      
      // Фолбэк: localStorage
      const taskToSave: Task = {
        id: editingId || Date.now(),
        title: formData.title!,
        description: formData.description,
        assignedTo: formData.assignedTo,
        assignedToName: users.find(u => u.id === formData.assignedTo)?.fullName,
        status: formData.status as any || "pending",
        priority: formData.priority as any || "medium",
        dueDate: formData.dueDate,
        orderId: formData.orderId,
        note: formData.note,
        createdAt: editingId 
          ? tasks.find(t => t.id === editingId)?.createdAt || new Date().toISOString()
          : new Date().toISOString(),
        completedAt: formData.status === "completed" ? new Date().toISOString() : undefined,
      };

      let updated: Task[];
      if (editingId) {
        updated = tasks.map(t => t.id === editingId ? taskToSave : t);
      } else {
        updated = [...tasks, taskToSave];
      }
      
      setTasks(updated);
      localStorage.setItem("decor_tasks", JSON.stringify(updated));
      
      setShowForm(false);
      setEditingId(null);
      resetForm();
      setFormError("Yadda saxlandı (lokal)");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tapşırığı silmək istədiyinizə əminsiniz?")) return;
    
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/tasks/${id}`, {
        method: "DELETE",
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      
      if (res.ok) {
        await loadTasks();
      } else {
        throw new Error("API error");
      }
    } catch (error) {
      const updated = tasks.filter(t => t.id !== id);
      setTasks(updated);
      localStorage.setItem("decor_tasks", JSON.stringify(updated));
    }
  };

  const updateTaskStatus = async (taskId: number, status: string) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status })
      });
      
      if (res.ok) {
        await loadTasks();
      } else {
        // Фолбэк
        const updated = tasks.map(t => 
          t.id === taskId 
            ? { 
                ...t, 
                status: status as any,
                completedAt: status === "completed" ? new Date().toISOString() : undefined
              } 
            : t
        );
        setTasks(updated);
        localStorage.setItem("decor_tasks", JSON.stringify(updated));
      }
    } catch (error) {
      console.error("[Tasks] Update error:", error);
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (searchQuery) {
      const matchesSearch = 
        t.id.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.assignedToName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
    }
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    if (assigneeFilter !== "all" && t.assignedTo !== assigneeFilter) return false;
    return true;
  });

  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === "pending").length,
    inProgress: tasks.filter(t => t.status === "in_progress").length,
    completed: tasks.filter(t => t.status === "completed").length,
    cancelled: tasks.filter(t => t.status === "cancelled").length,
    urgent: tasks.filter(t => t.priority === "urgent" && t.status !== "completed").length,
    overdue: tasks.filter(t => {
      if (!t.dueDate || t.status === "completed") return false;
      return new Date(t.dueDate) < new Date();
    }).length,
  };

  const handleExport = () => {
    const headers = ["ID", "Ad", "Təyin olunub", "Status", "Prioritet", "Son tarix", "Yaradılıb"];
    const rows = filteredTasks.map(t => [
      t.id,
      t.title,
      t.assignedToName || "-",
      t.status,
      t.priority,
      t.dueDate || "-",
      new Date(t.createdAt).toLocaleDateString("az-AZ")
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tasks_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Gözləyir",
      in_progress: "İcra olunur",
      completed: "Tamamlandı",
      cancelled: "Ləğv edildi"
    };
    return labels[status] || status;
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      low: "Aşağı",
      medium: "Orta",
      high: "Yüksək",
      urgent: "Təcili"
    };
    return labels[priority] || priority;
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: "bg-gray-100 text-gray-700",
      medium: "bg-blue-100 text-blue-700",
      high: "bg-orange-100 text-orange-700",
      urgent: "bg-red-100 text-red-700"
    };
    return colors[priority] || "bg-gray-100 text-gray-700";
  };

  if (loading) {
    return (
      <Card className="p-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D90429] mx-auto" />
      </Card>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ClipboardList className="w-8 h-8 text-[#D90429]" />
          <h1 className="text-2xl font-bold text-[#1F2937]">Tapşırıqlar</h1>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="ghost" size="sm" icon={<Download className="w-4 h-4" />}>
            Export
          </Button>
          <Button onClick={() => { setShowForm(true); resetForm(); }} icon={<Plus className="w-4 h-4" />}>
            Yeni tapşırıq
          </Button>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-[#6B7280] text-sm">Ümumi</p>
          <p className="text-2xl font-bold text-[#1F2937]">{stats.total}</p>
        </Card>
        <Card className="p-4 bg-blue-50">
          <p className="text-blue-600 text-sm flex items-center gap-1">
            <Clock className="w-4 h-4" /> İcra olunur
          </p>
          <p className="text-2xl font-bold text-blue-700">{stats.inProgress}</p>
        </Card>
        <Card className="p-4 bg-green-50">
          <p className="text-green-600 text-sm flex items-center gap-1">
            <CheckCircle className="w-4 h-4" /> Tamamlandı
          </p>
          <p className="text-2xl font-bold text-green-700">{stats.completed}</p>
        </Card>
        <Card className="p-4 bg-red-50">
          <p className="text-red-600 text-sm flex items-center gap-1">
            <AlertCircle className="w-4 h-4" /> Təcili
          </p>
          <p className="text-2xl font-bold text-red-700">{stats.urgent}</p>
        </Card>
      </div>

      {stats.overdue > 0 && (
        <Card className="p-4 mb-6 bg-amber-50 border border-amber-200">
          <div className="flex items-center gap-2 text-amber-700">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">{stats.overdue} tapşırıq son tarixi keçib!</span>
          </div>
        </Card>
      )}

      {/* Фильтры */}
      <Card className="p-4 mb-6">
        <div className="grid md:grid-cols-5 gap-4">
          <div className="relative md:col-span-2">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Axtar: ad, təsvir, işçi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
          >
            <option value="all">Bütün statuslar</option>
            <option value="pending">Gözləyir</option>
            <option value="in_progress">İcra olunur</option>
            <option value="completed">Tamamlandı</option>
            <option value="cancelled">Ləğv edildi</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
          >
            <option value="all">Bütün prioritetlər</option>
            <option value="low">Aşağı</option>
            <option value="medium">Orta</option>
            <option value="high">Yüksək</option>
            <option value="urgent">Təcili</option>
          </select>
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
          >
            <option value="all">Bütün işçilər</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.fullName}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Форма создания/редактирования */}
      {showForm && (
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

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.fullName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6B7280] mb-1">Status</label>
                <select
                  value={formData.status || "pending"}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
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
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
                >
                  <option value="low">Aşağı</option>
                  <option value="medium">Orta</option>
                  <option value="high">Yüksək</option>
                  <option value="urgent">Təcili</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6B7280] mb-1">Son tarix</label>
                <input
                  type="date"
                  value={formData.dueDate || ""}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6B7280] mb-1">Sifariş (əgər varsa)</label>
                <input
                  type="number"
                  value={formData.orderId || ""}
                  onChange={(e) => setFormData({ ...formData, orderId: parseInt(e.target.value) || undefined })}
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
              <Button type="submit" icon={<CheckCircle className="w-4 h-4" />}>Yadda saxla</Button>
              <Button
                variant="ghost"
                onClick={() => { setShowForm(false); setEditingId(null); resetForm(); }}
                icon={<Trash2 className="w-4 h-4" />}
              >
                Ləğv et
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Таблица задач */}
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
            {filteredTasks.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-[#6B7280]">
                  Tapşırıq tapılmadı
                </td>
              </tr>
            ) : (
              filteredTasks.map((task) => {
                const isOverdue = task.dueDate && task.status !== "completed" && new Date(task.dueDate) < new Date();
                
                return (
                  <tr key={task.id} className={`border-t border-gray-100 hover:bg-gray-50 ${isOverdue ? "bg-red-50" : ""}`}>
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
                        onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                        className={`text-xs px-2 py-1 rounded border ${
                          task.status === "completed" ? "bg-green-100 text-green-700 border-green-200" :
                          task.status === "in_progress" ? "bg-blue-100 text-blue-700 border-blue-200" :
                          task.status === "cancelled" ? "bg-gray-100 text-gray-700 border-gray-200" :
                          "bg-amber-100 text-amber-700 border-amber-200"
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
                          onClick={() => handleEdit(task)}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded"
                          title="Redaktə"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(task.id)}
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

      {/* Итоговая строка */}
      {filteredTasks.length > 0 && (
        <Card className="mt-4 p-4 bg-[#1F2937] text-white">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-white/60 text-xs">Göstərilən</p>
                <p className="font-bold">{filteredTasks.length} ədəd</p>
              </div>
              <div>
                <p className="text-white/60 text-xs">Tamamlanma</p>
                <p className="font-bold text-green-400">
                  {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                </p>
              </div>
              <div>
                <p className="text-white/60 text-xs">Gözləyir</p>
                <p className="font-bold text-amber-400">{stats.pending} ədəd</p>
              </div>
              {stats.overdue > 0 && (
                <div>
                  <p className="text-white/60 text-xs">Gecikib</p>
                  <p className="font-bold text-red-400">{stats.overdue} ədəd</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}