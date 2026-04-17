// src/lib/db/worker-tasks.ts
// Mock DB слой для задач исполнителей (Worker Tasks)

import { WorkerTask, User } from "./types";
import { getFromStorage, saveToStorage } from "./storage";

const WORKER_TASKS_KEY = "decor_worker_tasks";

function getTasks(): WorkerTask[] {
  return getFromStorage<WorkerTask[]>(WORKER_TASKS_KEY, []);
}

function saveTasks(tasks: WorkerTask[]) {
  saveToStorage(WORKER_TASKS_KEY, tasks);
}

export const workerTasks = {
  getAll(): WorkerTask[] {
    return getTasks();
  },

  getByWorkerId(workerId: string): WorkerTask[] {
    return getTasks().filter(t => t.workerId === workerId);
  },

  getById(id: string): WorkerTask | undefined {
    return getTasks().find(t => t.id === id);
  },

  create(task: Omit<WorkerTask, "id" | "createdAt" | "status">): WorkerTask {
    const newTask: WorkerTask = {
      ...task,
      id: Date.now().toString(),
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    const all = getTasks();
    all.push(newTask);
    saveTasks(all);
    return newTask;
  },

  updateStatus(id: string, newStatus: WorkerTask["status"]): WorkerTask | null {
    const all = getTasks();
    const index = all.findIndex(t => t.id === id);
    if (index === -1) return null;
    
    all[index] = {
      ...all[index],
      status: newStatus,
      completedAt: newStatus === "completed" ? new Date().toISOString() : undefined,
      updatedAt: new Date().toISOString(),
    };
    saveTasks(all);
    return all[index];
  },

  update(id: string, updates: Partial<WorkerTask>): WorkerTask | null {
    const all = getTasks();
    const index = all.findIndex(t => t.id === id);
    if (index === -1) return null;
    
    all[index] = { ...all[index], ...updates, updatedAt: new Date().toISOString() };
    saveTasks(all);
    return all[index];
  },

  delete(id: string): boolean {
    const all = getTasks();
    const filtered = all.filter(t => t.id !== id);
    if (filtered.length === all.length) return false;
    saveTasks(filtered);
    return true;
  },

  // ✅ Утилита: получить задачи по статусу
  getByStatus(status: WorkerTask["status"]): WorkerTask[] {
    return getTasks().filter(t => t.status === status);
  },

  // ✅ Утилита: получить просроченные задачи
  getOverdue(): WorkerTask[] {
    const now = new Date().getTime();
    return getTasks().filter(t => {
      if (t.status !== "pending" && t.status !== "in_progress") return false;
      if (!t.deadline) return false;
      return new Date(t.deadline).getTime() < now;
    });
  },
};