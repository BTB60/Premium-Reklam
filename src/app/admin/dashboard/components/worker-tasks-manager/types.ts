export interface WorkerDashboardTask {
  id: number;
  title: string;
  description?: string;
  assignedTo?: string;
  assignedToName?: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  /** Təxmini bitmə vaxtı (ISO). Tarix+saat — geri sayım üçün. */
  dueDate?: string;
  /** Status “İcra olunur” olanda — sayğacın işə düşmə anı (ISO). */
  workStartedAt?: string;
  createdAt: string;
  completedAt?: string;
  orderId?: number;
  orderNumber?: string;
  note?: string;
}

export interface WorkerDashboardUser {
  id: string;
  fullName: string;
  username: string;
  role: string;
}
