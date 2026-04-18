import { ACTIVITY_LOGS_KEY, SUBADMINS_KEY } from "./constants";
import type { ActivityLog, Subadmin } from "./types";

export function getSubadmins(): Subadmin[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(SUBADMINS_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function saveSubadmins(list: Subadmin[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(SUBADMINS_KEY, JSON.stringify(list));
  }
}

export function getActivityLogs(): ActivityLog[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(ACTIVITY_LOGS_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function saveActivityLogs(list: ActivityLog[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(ACTIVITY_LOGS_KEY, JSON.stringify(list));
  }
}

export function logActivity(
  subadminId: string,
  subadminLogin: string,
  action: string,
  feature: string,
  details?: string
) {
  const logs = getActivityLogs();
  logs.unshift({
    id: crypto.randomUUID(),
    subadminId,
    subadminLogin,
    action,
    feature,
    timestamp: new Date().toISOString(),
    details,
  });
  saveActivityLogs(logs);
}
