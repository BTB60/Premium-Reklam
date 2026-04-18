import type { SubadminPermissions } from "./types";

export const SUBADMINS_KEY = "premium_subadmins";
export const ACTIVITY_LOGS_KEY = "premium_activity_logs";

export const FEATURES: { key: keyof SubadminPermissions; label: string }[] = [
  { key: "users", label: "İstifadəçilər" },
  { key: "orders", label: "Sifarişlər" },
  { key: "finance", label: "Maliyyə" },
  { key: "products", label: "Məhsullar" },
  { key: "inventory", label: "Anbar" },
  { key: "tasks", label: "Tapşırıqlar" },
  { key: "support", label: "Dəstək" },
  { key: "analytics", label: "Analytics" },
  { key: "settings", label: "Sistem Ayarları" },
];

export const EMPTY_PERMISSIONS: SubadminPermissions = {
  users: "none",
  orders: "none",
  finance: "none",
  products: "none",
  inventory: "none",
  tasks: "none",
  support: "none",
  analytics: "none",
  settings: "none",
};
