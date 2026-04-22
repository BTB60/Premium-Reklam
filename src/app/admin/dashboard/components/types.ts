export type PermissionLevel = "none" | "view" | "edit";

export type ActiveTab = 
  | "dashboard" | "users" | "orders" | "shops" | "elan" 
  | "notifications" | "analytics" | "products" | "userPrices" | "finance" 
  | "inventory" | "workerTasks" | "support" | "settings" 
  | "tasks" | "accessSettings";

export interface SubadminSession {
  subadminId: string;
  login: string;
  role: "SUBADMIN";
  permissions: Record<string, PermissionLevel>;
}

export interface NavItemConfig {
  id: ActiveTab;
  label: string;
  icon: any;
  permission?: keyof SubadminSession["permissions"];
  adminOnly?: boolean;
}