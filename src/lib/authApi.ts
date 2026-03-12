// PostgreSQL Auth System using Neon (Vercel compatible)
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL || "");

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

// Initialize database schema
async function initDB() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        username VARCHAR(100) UNIQUE NOT NULL,
        phone VARCHAR(20),
        email VARCHAR(255),
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'DECORATOR',
        level INTEGER DEFAULT 1,
        total_orders INTEGER DEFAULT 0,
        bonus_points INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    // Check if admin exists, if not create default admin
    const adminCheck = await sql`SELECT * FROM users WHERE username = 'admin'`;
    if (adminCheck.length === 0) {
      await sql`
        INSERT INTO users (full_name, username, phone, email, password_hash, role, level)
        VALUES ('Admin', 'admin', '+994507988177', 'premiumreklam@bk.ru', 'admin123', 'ADMIN', 100)
      `;
    }
  } catch (error) {
    console.error("Database init error:", error);
  }
}

// Initialize on first load
initDB();

export const authApi = {
  // Register new user
  async register(userData: {
    fullName: string;
    username: string;
    phone?: string;
    password: string;
  }): Promise<User> {
    try {
      // Check if username exists
      const existing = await sql`SELECT * FROM users WHERE username = ${userData.username}`;
      if (existing.length > 0) {
        throw new Error("Bu istifadəçi adı artıq mövcuddur");
      }

      // Create user
      const result = await sql`
        INSERT INTO users (full_name, username, phone, password_hash, role, level)
        VALUES (${userData.fullName}, ${userData.username}, ${userData.phone || ''}, ${userData.password}, 'DECORATOR', 1)
        RETURNING id, full_name, username, phone, email, role, level, total_orders, bonus_points, created_at
      `;
      
      const user = result[0] as User;

      // Save to localStorage for session
      if (typeof window !== "undefined") {
        localStorage.setItem("currentUser", JSON.stringify(user));
      }

      return user;
    } catch (error: any) {
      throw new Error(error.message || "Qeydiyyat xətası");
    }
  },

  // Login
  async login(username: string, password: string): Promise<User> {
    try {
      const result = await sql`
        SELECT id, full_name, username, phone, email, role, level, total_orders, bonus_points, created_at
        FROM users 
        WHERE username = ${username} AND password_hash = ${password}
      `;

      if (!result || result.length === 0) {
        throw new Error("İstifadəçi adı və ya şifrə yanlışdır");
      }

      const user = result[0] as User;

      // Save to localStorage for session
      if (typeof window !== "undefined") {
        localStorage.setItem("currentUser", JSON.stringify(user));
      }

      return user;
    } catch (error: any) {
      throw new Error(error.message || "Giriş xətası");
    }
  },

  // Get current user from localStorage
  getCurrentUser(): User | null {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem("currentUser");
    return stored ? JSON.parse(stored) : null;
  },

  // Logout
  logout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("currentUser");
    }
  },

  // Get all users (for admin)
  async getAllUsers(): Promise<User[]> {
    try {
      const users = await sql`
        SELECT id, full_name, username, phone, email, role, level, total_orders, bonus_points, created_at
        FROM users
        ORDER BY created_at DESC
      `;
      return users as User[];
    } catch (error) {
      console.error("Get users error:", error);
      return [];
    }
  },

  // Get user by ID
  async getUserById(id: number): Promise<User | null> {
    try {
      const result = await sql`
        SELECT id, full_name, username, phone, email, role, level, total_orders, bonus_points, created_at
        FROM users WHERE id = ${id}
      `;
      return result.length > 0 ? (result[0] as User) : null;
    } catch (error) {
      return null;
    }
  },
};

export default authApi;
