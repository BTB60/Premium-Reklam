// Client-side Auth API - uses API routes with fallback to localStorage

export interface User {
  id: number;
  full_name: string;
  username: string;
  phone: string;
  email: string;
  role: "ADMIN" | "DECORATOR" | "VENDOR";
  level: number;
  total_orders: number;
  bonus_points: number;
  created_at: string;
}

const API_BASE = "/api";
const USERS_KEY = "premiumreklam_users";
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

// Get users from localStorage (fallback)
function getLocalUsers(): any[] {
  const stored = storage.get(USERS_KEY);
  if (!stored) {
    // Initialize with default admin
    const defaultUsers = [
      {
        id: 1,
        full_name: "Admin",
        username: "admin",
        phone: "+994507988177",
        email: "premiumreklam@bk.ru",
        password_hash: "admin123",
        role: "ADMIN",
        level: 100,
        total_orders: 0,
        bonus_points: 0,
        created_at: new Date().toISOString(),
      },
    ];
    storage.set(USERS_KEY, JSON.stringify(defaultUsers));
    return defaultUsers;
  }
  return JSON.parse(stored);
}

// Save users to localStorage
function saveLocalUsers(users: any[]) {
  storage.set(USERS_KEY, JSON.stringify(users));
}

export const authApi = {
  // Register new user
  async register(userData: {
    fullName: string;
    username: string;
    phone?: string;
    password: string;
  }): Promise<User> {
    try {
      // Try API first
      const response = await fetch(`${API_BASE}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          storage.set("currentUser", JSON.stringify(data.user));
          return data.user;
        }
      }

      // Fallback to localStorage
      console.log("API failed, using localStorage fallback");
      const users = getLocalUsers();
      
      if (users.find((u: any) => u.username === userData.username)) {
        throw new Error("Bu istifadəçi adı artıq mövcuddur");
      }

      const newUser = {
        id: Date.now(),
        full_name: userData.fullName,
        username: userData.username,
        phone: userData.phone || "",
        email: "",
        password_hash: userData.password,
        role: "DECORATOR",
        level: 1,
        total_orders: 0,
        bonus_points: 0,
        created_at: new Date().toISOString(),
      };

      users.push(newUser);
      saveLocalUsers(users);

      const { password_hash, ...userWithoutPassword } = newUser;
      storage.set("currentUser", JSON.stringify(userWithoutPassword));
      return userWithoutPassword as User;

    } catch (error: any) {
      throw new Error(error.message || "Qeydiyyat xətası");
    }
  },

  // Login
  async login(username: string, password: string): Promise<User> {
    try {
      // Try API first
      const response = await fetch(`${API_BASE}/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          storage.set("currentUser", JSON.stringify(data.user));
          return data.user;
        }
      }

      // Fallback to localStorage
      console.log("API failed, using localStorage fallback");
      const users = getLocalUsers();
      const user = users.find(
        (u: any) => u.username === username && u.password_hash === password
      );

      if (!user) {
        throw new Error("İstifadəçi adı və ya şifrə yanlışdır");
      }

      const { password_hash, ...userWithoutPassword } = user;
      storage.set("currentUser", JSON.stringify(userWithoutPassword));
      return userWithoutPassword as User;

    } catch (error: any) {
      throw new Error(error.message || "Giriş xətası");
    }
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
    try {
      const response = await fetch(`${API_BASE}/users`);
      if (response.ok) {
        const data = await response.json();
        return data.users || [];
      }
    } catch (error) {
      console.log("API failed, using localStorage fallback");
    }

    // Fallback
    const users = getLocalUsers();
    return users.map(({ password_hash, ...user }: any) => user as User);
  },
};

export default authApi;
