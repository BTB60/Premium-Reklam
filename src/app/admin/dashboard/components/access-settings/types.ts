export type PermissionLevel = "none" | "view" | "edit";

export interface SubadminPermissions {
  users: PermissionLevel;
  orders: PermissionLevel;
  finance: PermissionLevel;
  products: PermissionLevel;
  inventory: PermissionLevel;
  tasks: PermissionLevel;
  support: PermissionLevel;
  analytics: PermissionLevel;
  settings: PermissionLevel;
}

export interface Subadmin {
  id: string;
  login: string;
  password: string;
  permissions: SubadminPermissions;
  createdAt: string;
  lastLogin?: string;
}

export interface ActivityLog {
  id: string;
  subadminId: string;
  subadminLogin: string;
  action: string;
  feature: string;
  timestamp: string;
  details?: string;
}

export interface SubadminFormState {
  login: string;
  password: string;
  permissions: SubadminPermissions;
}
