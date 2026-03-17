// Client-side Auth API - uses Spring Boot Backend
// Backend runs on localhost:8081

export interface User {
  id: number | string;
  full_name?: string;
  fullName?: string;
  username: string;
  phone?: string;
  email?: string;
  role: "ADMIN" | "DECORATOR" | "VENDOR";
  level?: number;
  total_orders?: number;
  totalOrders?: number;
  bonus_points?: number;
  bonusPoints?: number;
  created_at?: string;
  createdAt?: string;
  // For db.ts compatibility
  password?: string;
  password_hash?: string;
  totalSales?: number;
  monthlyStats?: any[];
  bonusTier?: string;
  referralCode?: string;
  referralCount?: number;
  isVendor?: boolean;
  vendorBalance?: number;
  totalVendorSales?: number;
}

const API_BASE = process.env.NODE_ENV === "production"
  ? "/api"  // Production: same domain
  : "http://localhost:8081/api";  // Development: Spring Boot
const CURRENT_USER_KEY = "currentUser";

// Safe localStorage access
const storage = {
  get: (key: string) => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(key);
  },
  set: (key: string, value: string) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(key, value);
  },
  remove: (key: string) => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(key);
  },
};

export const authApi = {
  // Register new user
  async register(userData: {
    fullName: string;
    username: string;
    phone?: string;
    password: string;
  }): Promise<User> {
    const response = await fetch(`${API_BASE}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Qeydiyyat xətası");
    }

    if (data.user) {
      // Convert MySQL response to User format
      const user: User = {
        ...data.user,
        id: data.user.id.toString(),
        fullName: data.user.full_name,
        totalOrders: data.user.total_orders || 0,
        bonusPoints: data.user.bonus_points || 0,
        createdAt: data.user.created_at,
      };
      storage.set(CURRENT_USER_KEY, JSON.stringify(user));
      return user;
    }

    throw new Error("Qeydiyyat xətası");
  },

  // Login
  async login(username: string, password: string): Promise<User> {
    const response = await fetch(`${API_BASE}/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Giriş xətası");
    }

    if (data.user) {
      // Convert MySQL response to User format
      const user: User = {
        ...data.user,
        id: data.user.id.toString(),
        fullName: data.user.full_name,
        totalOrders: data.user.total_orders || 0,
        bonusPoints: data.user.bonus_points || 0,
        createdAt: data.user.created_at,
        // Default values for db.ts compatibility
        totalSales: 0,
        monthlyStats: [],
        bonusTier: "bronze",
        referralCode: `REF${Date.now().toString().slice(-6)}`,
        referralCount: 0,
        isVendor: false,
        vendorBalance: 0,
        totalVendorSales: 0,
      };
      storage.set(CURRENT_USER_KEY, JSON.stringify(user));
      return user;
    }

    throw new Error("Giriş xətası");
  },

  // Get current user
  getCurrentUser(): User | null {
    const stored = storage.get(CURRENT_USER_KEY);
    return stored ? JSON.parse(stored) : null;
  },

  // Logout
  logout() {
    storage.remove(CURRENT_USER_KEY);
  },

  // Get all users (for admin)
  async getAllUsers(): Promise<User[]> {
    const response = await fetch(`${API_BASE}/users`);
    const data = await response.json();
    
    // Convert MySQL response to User format
    return (data.users || []).map((u: any) => ({
      ...u,
      id: u.id.toString(),
      fullName: u.full_name,
      totalOrders: u.total_orders || 0,
      bonusPoints: u.bonus_points || 0,
      createdAt: u.created_at,
      // Default values for db.ts compatibility
      totalSales: 0,
      monthlyStats: [],
      bonusTier: "bronze",
      referralCode: `REF${u.id}`,
      referralCount: 0,
      isVendor: false,
      vendorBalance: 0,
      totalVendorSales: 0,
    }));
  },
};

export default authApi;
