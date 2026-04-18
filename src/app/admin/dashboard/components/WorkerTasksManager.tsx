"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { getAdminBearerToken, getAdminDashboardApiBase } from "./admin-dashboard-api";
import type { WorkerDashboardTask, WorkerDashboardUser } from "./worker-tasks-manager/types";
import { WorkerHeaderBar } from "./worker-tasks-manager/WorkerHeaderBar";
import { WorkerStatsCards } from "./worker-tasks-manager/WorkerStatsCards";
import { WorkerOverdueBanner } from "./worker-tasks-manager/WorkerOverdueBanner";
import { WorkerFilterBar } from "./worker-tasks-manager/WorkerFilterBar";
import { WorkerTaskForm } from "./worker-tasks-manager/WorkerTaskForm";
import { WorkerTasksTable } from "./worker-tasks-manager/WorkerTasksTable";
import { WorkerTasksFooter } from "./worker-tasks-manager/WorkerTasksFooter";

const API_BASE = getAdminDashboardApiBase();

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
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data?.users || [];
        const workers = list.filter((u: WorkerDashboardUser) => u.role !== "ADMIN");
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

  const handleEdit = (task: WorkerDashboardTask) => {
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
      const url = editingId ? `${API_BASE}/tasks/${editingId}` : `${API_BASE}/tasks`;

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(formData),
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

      const taskToSave: WorkerDashboardTask = {
        id: editingId || Date.now(),
        title: formData.title!,
        description: formData.description,
        assignedTo: formData.assignedTo,
        assignedToName: users.find((u) => u.id === formData.assignedTo)?.fullName,
        status: (formData.status as WorkerDashboardTask["status"]) || "pending",
        priority: (formData.priority as WorkerDashboardTask["priority"]) || "medium",
        dueDate: formData.dueDate,
        orderId: formData.orderId,
        note: formData.note,
        createdAt: editingId
          ? tasks.find((t) => t.id === editingId)?.createdAt || new Date().toISOString()
          : new Date().toISOString(),
        completedAt: formData.status === "completed" ? new Date().toISOString() : undefined,
      };

      let updated: WorkerDashboardTask[];
      if (editingId) {
        updated = tasks.map((t) => (t.id === editingId ? taskToSave : t));
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
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
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
        const updated = tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status: status as WorkerDashboardTask["status"],
                completedAt: status === "completed" ? new Date().toISOString() : undefined,
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
