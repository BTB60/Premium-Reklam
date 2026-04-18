export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "Gözləyir",
    in_progress: "İcra olunur",
    completed: "Tamamlandı",
    cancelled: "Ləğv edildi",
  };
  return labels[status] || status;
}

export function getPriorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    low: "Aşağı",
    medium: "Orta",
    high: "Yüksək",
    urgent: "Təcili",
  };
  return labels[priority] || priority;
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    low: "bg-gray-100 text-gray-700",
    medium: "bg-blue-100 text-blue-700",
    high: "bg-orange-100 text-orange-700",
    urgent: "bg-red-100 text-red-700",
  };
  return colors[priority] || "bg-gray-100 text-gray-700";
}
