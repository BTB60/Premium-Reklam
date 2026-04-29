"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { getAdminBearerToken, getAdminDashboardApiBase } from "./admin-dashboard-api";
import type { WorkerDashboardTask, WorkerDashboardUser } from "./worker-tasks-manager/types";
import { fromDatetimeLocalToIso, toDatetimeLocalValue } from "./worker-tasks-manager/datetimeLocal";
import { WorkerHeaderBar } from "./worker-tasks-manager/WorkerHeaderBar";
import { WorkerStatsCards } from "./worker-tasks-manager/WorkerStatsCards";
import { WorkerOverdueBanner } from "./worker-tasks-manager/WorkerOverdueBanner";
import { WorkerFilterBar } from "./worker-tasks-manager/WorkerFilterBar";
import { WorkerTaskForm } from "./worker-tasks-manager/WorkerTaskForm";
import { WorkerTasksTable } from "./worker-tasks-manager/WorkerTasksTable";
import { WorkerTasksFooter } from "./worker-tasks-manager/WorkerTasksFooter";

const API_BASE = getAdminDashboardApiBase();

function mapApiTask(row: Record<string, unknown>): WorkerDashboardTask {
  const due = row.dueDate != null ? String(row.dueDate) : undefined;
  const oid = row.orderId != null ? Number(row.orderId) : undefined;
  return {
    id: Number(row.id),
    title: String(row.title ?? ""),
    description: row.description != null ? String(row.description) : undefined,
    assignedTo: row.assignedTo != null ? String(row.assignedTo) : "",
    assignedToName: row.assignedToName != null ? String(row.assignedToName) : undefined,
    status: (row.status as WorkerDashboardTask["status"]) || "pending",
    priority: (row.priority as WorkerDashboardTask["priority"]) || "medium",
    dueDate: due || undefined,
    workStartedAt: row.workStartedAt != null ? String(row.workStartedAt) : undefined,
    orderId: Number.isFinite(oid) ? oid : undefined,
    orderNumber: row.orderNumber != null ? String(row.orderNumber) : undefined,
    note: row.note != null ? String(row.note) : undefined,
    createdAt: row.createdAt != null ? String(row.createdAt) : new Date().toISOString(),
    completedAt: row.completedAt != null ? String(row.completedAt) : undefined,
  };
}

function mapStaffUser(u: Record<string, unknown>): WorkerDashboardUser {
  return {
    id: String(u.id ?? ""),
    fullName: String(u.fullName ?? u.full_name ?? ""),
    username: String(u.username ?? ""),
    role: String(u.role ?? ""),
  };
}

function buildApiPayload(fd: Partial<WorkerDashboardTask>) {
  return {
    title: fd.title?.trim(),
    description: fd.description?.trim() || undefined,
    assignedTo: fd.assignedTo ? Number(fd.assignedTo) : null,
    status: fd.status,
    priority: fd.priority,
    dueDate: fd.dueDate ? fromDatetimeLocalToIso(String(fd.dueDate)) : undefined,
    orderId:
      fd.orderId !== undefined && fd.orderId !== null && !Number.isNaN(Number(fd.orderId))
        ? Number(fd.orderId)
        : null,
    note: fd.note?.trim() || undefined,
  };
}

export default function WorkerTasksManager() {
  const [tasks, setTasks] = useState<WorkerDashboardTask[]>([]);
  const [users, setUsers] = useState<WorkerDashboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formError, setFormError] = useState("");

  const [formData, setFormData] = useState<Partial<WorkerDashboardTask>>({
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

  const getToken = () => getAdminBearerToken();

  const loadTasks = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/admin/worker-tasks`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        setTasks(list.map((row: Record<string, unknown>) => mapApiTask(row)));
        setLoading(false);
        return;
      }
    } catch (error) {
      console.error("[Tasks] API load error:", error);
    }
    try {
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
      const res = await fetch(`${API_BASE}/admin/staff`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        setUsers(list.map((u: Record<string, unknown>) => mapStaffUser(u)));
        return;
      }
    } catch (error) {
      console.error("[Tasks] Load staff error:", error);
    }
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/admin/users`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data?.users || [];
        const staffRoles = new Set(["DIZAYNER", "USTA", "CHAPCI"]);
        const workers = list
          .filter((u: WorkerDashboardUser) => staffRoles.has(String(u.role || "").toUpperCase()))
          .map((u: Record<string, unknown>) => mapStaffUser(u));
        setUsers(workers);
      }
    } catch (error) {
      console.error("[Tasks] Load users fallback error:", error);
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

  const handleEdit = (task: WorkerDashboardTask) => {
    setEditingId(task.id);
    setFormData({
      title: task.title,
      description: task.description,
      assignedTo: task.assignedTo,
      status: task.status,
      priority: task.priority,
      dueDate: toDatetimeLocalValue(task.dueDate),
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
      const body = buildApiPayload(formData);
      const method = editingId ? "PUT" : "POST";
      const url = editingId
        ? `${API_BASE}/admin/worker-tasks/${editingId}`
        : `${API_BASE}/admin/worker-tasks`;

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        await loadTasks();
        setShowForm(false);
        setEditingId(null);
        resetForm();
        return;
      }
      const errJson = await res.json().catch(() => ({}));
      throw new Error((errJson as { message?: string }).message || `HTTP ${res.status}`);
    } catch (error) {
      console.error("[Tasks] Save error:", error);
      setFormError(error instanceof Error ? error.message : "Yadda saxlanılmadı");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tapşırığı silmək istədiyinizə əminsiniz?")) return;

    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/admin/worker-tasks/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        await loadTasks();
      } else {
        throw new Error("API error");
      }
    } catch (error) {
      const updated = tasks.filter((t) => t.id !== id);
      setTasks(updated);
      localStorage.setItem("decor_tasks", JSON.stringify(updated));
    }
  };

  const updateTaskStatus = async (taskId: number, status: string) => {
    const target = tasks.find((t) => t.id === taskId);
    if (status === "in_progress") {
      if (!target?.dueDate?.trim()) {
        window.alert(
          "“İcra olunur” seçməzdən əvvəl tapşırıqda təxmini bitmə vaxtını (tarix və saat) qeyd edin — redaktə düyməsindən."
        );
        return;
      }
    }

    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/admin/worker-tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        await loadTasks();
      } else {
        const updated = tasks.map((t) => {
          if (t.id !== taskId) return t;
          const nextStatus = status as WorkerDashboardTask["status"];
          if (nextStatus === "in_progress") {
            return {
              ...t,
              status: nextStatus,
              workStartedAt: t.workStartedAt || new Date().toISOString(),
              completedAt: undefined,
            };
          }
          if (nextStatus === "completed") {
            return {
              ...t,
              status: nextStatus,
              completedAt: new Date().toISOString(),
            };
          }
          return {
            ...t,
            status: nextStatus,
            workStartedAt: nextStatus === "pending" || nextStatus === "cancelled" ? undefined : t.workStartedAt,
            completedAt: undefined,
          };
        });
        setTasks(updated);
        localStorage.setItem("decor_tasks", JSON.stringify(updated));
      }
    } catch (error) {
      console.error("[Tasks] Update error:", error);
    }
  };

  const filteredTasks = tasks.filter((t) => {
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
    pending: tasks.filter((t) => t.status === "pending").length,
    inProgress: tasks.filter((t) => t.status === "in_progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
    cancelled: tasks.filter((t) => t.status === "cancelled").length,
    urgent: tasks.filter((t) => t.priority === "urgent" && t.status !== "completed").length,
    overdue: tasks.filter((t) => {
      if (!t.dueDate || t.status === "completed") return false;
      return new Date(t.dueDate) < new Date();
    }).length,
  };

  const handleExport = () => {
    const headers = ["ID", "Ad", "Təyin olunub", "Status", "Prioritet", "Son tarix", "Yaradılıb"];
    const rows = filteredTasks.map((t) => [
      t.id,
      t.title,
      t.assignedToName || "-",
      t.status,
      t.priority,
      t.dueDate || "-",
      new Date(t.createdAt).toLocaleDateString("az-AZ"),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tasks_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
      <WorkerHeaderBar
        onExport={handleExport}
        onNewTask={() => {
          setEditingId(null);
          setShowForm(true);
          resetForm();
        }}
      />
      <WorkerStatsCards
        stats={{
          total: stats.total,
          inProgress: stats.inProgress,
          completed: stats.completed,
          urgent: stats.urgent,
        }}
      />
      <WorkerOverdueBanner count={stats.overdue} />
      <WorkerFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={setPriorityFilter}
        assigneeFilter={assigneeFilter}
        onAssigneeFilterChange={setAssigneeFilter}
        users={users}
      />

      {showForm && (
        <WorkerTaskForm
          editingId={editingId}
          formError={formError}
          formData={formData}
          setFormData={setFormData}
          users={users}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingId(null);
            resetForm();
          }}
        />
      )}

      <WorkerTasksTable
        tasks={filteredTasks}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onStatusChange={updateTaskStatus}
      />

      {filteredTasks.length > 0 && (
        <WorkerTasksFooter
          filteredCount={filteredTasks.length}
          stats={{
            total: stats.total,
            completed: stats.completed,
            pending: stats.pending,
            overdue: stats.overdue,
          }}
        />
      )}
    </div>
  );
}
