export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    open: "Açıq",
    in_progress: "İcra olunur",
    resolved: "Həll olunub",
    closed: "Bağlandı",
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

export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    technical: "Texniki",
    billing: "Ödəniş",
    order: "Sifariş",
    account: "Hesab",
    other: "Digər",
  };
  return labels[category] || category;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    open: "bg-blue-100 text-blue-700",
    in_progress: "bg-amber-100 text-amber-700",
    resolved: "bg-green-100 text-green-700",
    closed: "bg-gray-100 text-gray-700",
  };
  return colors[status] || "bg-gray-100 text-gray-700";
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
