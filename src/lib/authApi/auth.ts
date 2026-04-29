// src/lib/authApi/auth.ts
// ГИБРИДНЫЙ СЛОЙ: ловим ВСЁ, фоллбэк на Mock — ВСЕГДА

import { BASE_URL, mapRole, getCurrentUser, saveCurrentUser, logoutUser } from "./config";
import { UserData } from "./types";
import { auth as mockAuth } from "@/lib/db/auth";

export const authApi = {
  async register(userData: {
    fullName: string;
    username: string;
    email?: string;
    phone?: string;
    password: string;
    accountType?: string;
  }) {
    try {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      const text = await res.text();
      if (text.startsWith("<")) throw new Error("HTML");
      const data = JSON.parse(text);
      if (!res.ok) throw new Error(data.message || "Error");
      return { ...data, role: mapRole(data.role) };
    } catch (e) {
      console.log("[authApi] register → Mock DB (backend offline)");
    }

    const result = await mockAuth.register(userData);
    if (!result.success) throw new Error(result.error || "Failed");
    const u = result.user as { role?: string; token?: string };
    return { ...u, role: mapRole(u.role ?? "DECORATOR") };
  },

  async login(username: string, password: string): Promise<UserData> {
    console.log(`[authApi] 🌐 Trying backend login: "${username}"`);
    
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const text = await res.text();
      if (text.startsWith("<")) throw new Error("HTML");
      const data = JSON.parse(text);
      if (!res.ok) throw new Error(data.message || "Error");
      console.log("[authApi] ✅ Backend login success");
      return { ...data, role: mapRole(data.role) };
    } catch (e: any) {
      console.log(`[authApi] ❌ Backend failed: ${e?.message || e}`);
      console.log("[authApi] 🔄 Falling back to Mock DB");
    }
    
    // ✅ Фоллбэк на Mock — ТОЧНО выполнится
    console.log(`[authApi] 🔐 Mock login: "${username}" / "${password}"`);
    const result = await mockAuth.login(username, password);
    
    console.log(`[authApi] 📦 Mock result:`, { success: result.success, error: result.error });
    
    if (!result.success) {
      throw new Error(result.error || "Giriş uğursuz");
    }
    if (!result.user) {
      throw new Error("İstifadəçi tapılmadı");
    }
    
    const { password: _, ...safe } = result.user;
    return {
      id: safe.id,
      fullName: safe.fullName,
      username: safe.username,
      email: safe.email,
      phone: safe.phone,
      role: mapRole(safe.role),
      createdAt: safe.createdAt,
    };
  },

  getAllUsers: () => mockAuth.getAllUsers(),
  getCurrentUser,
  saveCurrentUser,
  logout: logoutUser,

  async forgotPassword() {
    return { message: "OK" };
  },
  async resetPassword() {
    throw new Error("Not implemented in Mock");
  },
};