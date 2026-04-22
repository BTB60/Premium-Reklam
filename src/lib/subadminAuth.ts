import { jwtDecode } from "jwt-decode";
import { getRestApiBase } from "@/lib/restApiBase";

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

export interface SubadminSession {
  token: string;
  subadminId: string;
  login: string;
  role: "SUBADMIN";
  permissions: SubadminPermissions;
  expiresAt?: number;
}

interface JwtPayload {
  sub: string;
  role: string;
  subadminId: string;
  permissions: Record<string, string>;
  exp: number;
  iat: number;
}

const STORAGE_KEY = "premium_subadmin_jwt";

const apiBase = () => getRestApiBase();

export const subadminAuth = {
  async login(login: string, password: string): Promise<SubadminSession> {
    const response = await fetch(`${apiBase()}/auth/subadmin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login, password }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || error.error || "Авторизация не удалась");
    }

    const data = await response.json();
    const session: SubadminSession = {
      token: data.token,
      subadminId: data.subadminId,
      login: data.login,
      role: "SUBADMIN",
      permissions: this.mapPermissions(data.permissions),
      expiresAt: this.extractExpiry(data.token),
    };

    if (typeof window !== "undefined") {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    }

    return session;
  },

  getSession(): SubadminSession | null {
    if (typeof window === "undefined") return null;
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    try {
      const session = JSON.parse(raw) as SubadminSession;
      if (session.expiresAt && Date.now() > session.expiresAt) {
        this.logout();
        return null;
      }
      return session;
    } catch {
      return null;
    }
  },

  logout(): void {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  },

  hasPermission(feature: keyof SubadminPermissions, level: PermissionLevel): boolean {
    const session = this.getSession();
    if (!session?.permissions) return false;

    const perm = session.permissions[feature];
    if (level === "edit") return perm === "edit";
    if (level === "view") return perm === "view" || perm === "edit";
    return false;
  },

  getAuthHeader(): Record<string, string> {
    const session = this.getSession();
    return session?.token 
      ? { "Authorization": `Bearer ${session.token}` }
      : {};
  },

  mapPermissions(backendPerms: Record<string, string> | undefined): SubadminPermissions {
    const defaults: SubadminPermissions = {
      users: "none", orders: "none", finance: "none", products: "none",
      inventory: "none", tasks: "none", support: "none", analytics: "none", settings: "none"
    };
    if (!backendPerms) return defaults;
    
    const result = { ...defaults };
    for (const key of Object.keys(defaults) as Array<keyof SubadminPermissions>) {
      const val = backendPerms[key];
      if (val === "view" || val === "edit" || val === "none") {
        result[key] = val;
      }
    }
    return result;
  },

  extractExpiry(token: string): number | undefined {
    try {
      const payload = jwtDecode<JwtPayload>(token);
      return payload.exp ? payload.exp * 1000 : undefined;
    } catch {
      return undefined;
    }
  },
};

export default subadminAuth;