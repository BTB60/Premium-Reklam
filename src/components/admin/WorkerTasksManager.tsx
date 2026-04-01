"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { workerTasks, type WorkerTask, type User } from "@/lib/db";
import { ClipboardList, Plus, CheckCircle, Clock, AlertCircle, Trash2 } from "lucide-react";

interface WorkerTasksManagerProps {
  tasks: WorkerTask[];
  users: User[];
}

const PRIORITY_COLORS = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-blue-100 text-blue-600",
  high: "bg-orange-100 text-orange-600",
  urgent: "bg-red-100 text-red-600",
};

const PRIORITY_NAMES = {
  low: "Aşağı",
  medium: "Orta",
  high: "Yüksək",
  urgent: "Təcili",
};

const STATUS_NAMES = {
  pending: "Gözləyir",
  in_progress: "İcra edilir",
  completed: "Tamamlandı",
  cancelled: "Ləğv edildi",
};

export function WorkerTasksManager({ tasks, users }: WorkerTasksManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    workerId: "",
    title: "",
    description: "",
    priority: "medium" as WorkerTask["priority"],
    deadline: "",
  });

  const workers = users.filter((u) => u.role === "DECORATOR");

  const handleCreate = () => {
    if (!formData.workerId || !formData.title) return;
    const worker = workers.find((w) => w.id === formData.workerId);
    workerTasks.create({
      workerId: formData.workerId,
      workerName: worker?.fullName || "",
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
      status: "pending",
      deadline: formData.deadline,
      createdBy: "admin",
    });
    setShowForm(false);
    window.location.reload();
  };

  const handleStatusChange = (id: string, status: WorkerTask["status"]) => {
    workerTasks.update(id, { status });
    window.location.reload();
  };

  const handleDelete = (id: string) => {
    if (confirm("Tapşırığı silmək istədiyinizə əminsiniz?")) {
      workerTasks.delete(id);
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(true)} icon={<Plus className="w-4 h-4" />}>
          Yeni Tapşırıq
        </Button>
      </div>

      {showForm && (
        <Card className="p-6">
          <h3 className="font-bold mb-4">Yeni Tapşırıq</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">İşçi</label>
              <select
                value={formData.workerId}
                onChange={(e) => setFormData({ ...formData, workerId: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Seçin</option>
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.fullName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Prioritet</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="low">Aşağı</option>
                <option value="medium">Orta</option>
                <option value="high">Yüksək</option>
                <option value="urgent">Təcili</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Başlıq</label>
              <Input
                value={formData.title}
                onChange={(value) => setFormData({ ...formData, title: value })}
                placeholder="Tapşırıq başlığı"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Təsvir</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                rows={3}
                placeholder="Tapşırıq təsviri"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Son tarix</label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleCreate}>Yarat</Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Ləğv Et</Button>
          </div>
        </Card>
      )}

      <div className="grid gap-4">
        {tasks.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Tapşırıq yoxdur</p>
        ) : (
          tasks.map((task) => (
            <Card key={task.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      task.status === "completed"
                        ? "bg-emerald-100"
                        : task.status === "in_progress"
                        ? "bg-blue-100"
                        : "bg-gray-100"
                    }`}
                  >
                    {task.status === "completed" ? (
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    ) : task.status === "in_progress" ? (
                      <Clock className="w-5 h-5 text-blue-600" />
                    ) : (
                      <ClipboardList className="w-5 h-5 text-gray-600" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold">{task.title}</p>
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full ${
                          PRIORITY_COLORS[task.priority]
                        }`}
                      >
                        {PRIORITY_NAMES[task.priority]}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{task.workerName}</p>
                    <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                    {task.deadline && (
                      <p className="text-xs text-gray-400 mt-1">
                        Son tarix: {task.deadline}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(task.id, e.target.value as any)}
                    className="px-3 py-1 border rounded-lg text-sm"
                  >
                    <option value="pending">Gözləyir</option>
                    <option value="in_progress">İcra edilir</option>
                    <option value="completed">Tamamlandı</option>
                    <option value="cancelled">Ləğv edildi</option>
                  </select>
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
