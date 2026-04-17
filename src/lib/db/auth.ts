// src/lib/db/auth.ts
// Mock DB аутентификация + бонусы (рабочая версия)

const USERS_KEY = "decor_users";
const SESSION_KEY = "decor_current_user";

// ✅ Админ
const ADMIN_USER = {
  id: "admin-1",
  username: "admin",
  password: "admin123",
  fullName: "Super Admin",
  email: "admin@premium.az",
  phone: "0500000000",
  role: "ADMIN",
  level: 100,
  totalOrders: 0,
  totalSales: 0,
  monthlyStats: [],
  bonusPoints: 0,
  bonusSpent: 0,
  bonusTier: "bronze",
  referralCode: "ADMIN001",
  referralCount: 0,
  isVendor: false,
  vendorBalance: 0,
  totalVendorSales: 0,
  totalPaidAmount: 0,
  createdAt: new Date().toISOString(),
};

// ✅ Тестовый пользователь
const TEST_USER = {
  id: "test-1",
  username: "kamal",
  password: "kamal123",
  fullName: "Kamal Test",
  email: "kamal@test.az",
  phone: "0501234567",
  role: "DECORATOR",
  level: 1,
  totalOrders: 0,
  totalSales: 0,
  monthlyStats: [],
  bonusPoints: 0,
  bonusSpent: 0,
  bonusTier: "bronze",
  referralCode: "TEST001",
  referralCount: 0,
  isVendor: false,
  vendorBalance: 0,
  totalVendorSales: 0,
  totalPaidAmount: 0,
  createdAt: new Date().toISOString(),
};

// Прямые функции работы с localStorage
function getStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    // Диспетчеризация события для реактивности
    window.dispatchEvent(new StorageEvent("storage", { key }));
    // Кастомное событие для intra-tab синхронизации
    window.dispatchEvent(new CustomEvent(`storage:${key}`));
  } catch {}
}

// Инициализация пользователей
function seedUsers() {
  const users = getStorage<any[]>(USERS_KEY, []);
  const filtered = users.filter(u => 
    !(u.username === "admin" && u.role === "ADMIN") &&
    !(u.username === "kamal" && u.role === "DECORATOR")
  );
  filtered.push(ADMIN_USER);
  filtered.push(TEST_USER);
  setStorage(USERS_KEY, filtered);
  console.log("[auth] ✅ Users seeded");
}

if (typeof window !== "undefined") {
  seedUsers();
}

export const auth = {
  async register(data: { fullName: string; username: string; phone?: string; email?: string; password: string }) {
    const users = getStorage<any[]>(USERS_KEY, []);
    
    if (users.some((u: any) => u.username === data.username)) {
      return { success: false, error: "Bu istifadəçi adı artıq mövcuddur" };
    }
    
    const newUser = {
      id: Date.now().toString(),
      fullName: data.fullName,
      username: data.username,
      phone: data.phone || "",
      email: data.email || "",
      password: data.password,
      role: "DECORATOR",
      level: 1,
      totalOrders: 0,
      totalSales: 0,
      monthlyStats: [],
      bonusPoints: 0,
      bonusSpent: 0,
      bonusTier: "bronze",
      referralCode: `REF${Date.now().toString().slice(-6)}`,
      referralCount: 0,
      isVendor: false,
      vendorBalance: 0,
      totalVendorSales: 0,
      totalPaidAmount: 0,
      createdAt: new Date().toISOString(),
    };
    
    users.push(newUser);
    setStorage(USERS_KEY, users);
    
    const { password: _, ...safe } = newUser;
    setStorage(SESSION_KEY, safe);
    
    return { success: true, user: safe };
  },

  async login(username: string, password: string) {
    console.log(`[auth] 🔐 Login: ${username}`);
    
    const users = getStorage<any[]>(USERS_KEY, []);
    const user = users.find((u: any) => u.username === username && u.password === password);
    
    if (!user) {
      console.log(`[auth] ❌ Login failed`);
      return { success: false, error: "İstifadəçi adı və ya şifrə yanlışdır" };
    }
    
    const { password: _, ...safe } = user;
    setStorage(SESSION_KEY, safe);
    
    console.log(`[auth] ✅ Login success: ${safe.username}`);
    return { success: true, user: safe };
  },

  logout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem(SESSION_KEY);
    }
  },

  getCurrentUser() {
    return getStorage<any>(SESSION_KEY, null);
  },

  getAllUsers() {
    return getStorage<any[]>(USERS_KEY, []);
  },

  getById(id: string) {
    return getStorage<any[]>(USERS_KEY, []).find((u: any) => u.id === id);
  },

  // ✅ РЕАЛЬНАЯ РЕАЛИЗАЦИЯ: обновление пользователя
  update(id: string, updates: Partial<any>): any | null {
    const users = getStorage<any[]>(USERS_KEY, []);
    const idx = users.findIndex((u: any) => u.id === id);
    
    if (idx === -1) {
      console.warn(`[auth.update] User ${id} not found`);
      return null;
    }
    
    // Обновляем пользователя
    users[idx] = { ...users[idx], ...updates };
    setStorage(USERS_KEY, users);
    
    // Если это текущий пользователь — обновляем сессию
    const current = this.getCurrentUser();
    if (current && current.id === id) {
      const { password: _, ...safe } = users[idx];
      setStorage(SESSION_KEY, safe);
    }
    
    return users[idx];
  },

  // ✅ РЕАЛЬНАЯ РЕАЛИЗАЦИЯ: начисление бонусов
  addBonusPoints(userId: string, amount: number): any | null {
    const bonusEarned = Math.round(amount * 0.05 * 100) / 100; // 5%
    const user = this.getById(userId);
    
    if (!user) {
      console.error(`[auth.addBonusPoints] User ${userId} not found`);
      return null;
    }
    
    const newBonusPoints = Math.round((user.bonusPoints + bonusEarned) * 100) / 100;
    const newTotalPaid = Math.round((user.totalPaidAmount + amount) * 100) / 100;
    
    console.log(`[auth.addBonusPoints] ${userId}: +${bonusEarned} AZN bonus (new balance: ${newBonusPoints})`);
    
    return this.update(userId, {
      bonusPoints: newBonusPoints,
      totalPaidAmount: newTotalPaid,
    });
  },

  // ✅ РЕАЛЬНАЯ РЕАЛИЗАЦИЯ: списание бонусов
  spendBonusPoints(userId: string, amount: number): any | null {
    const user = this.getById(userId);
    if (!user || user.bonusPoints < amount) return null;
    
    const newBonusPoints = Math.round((user.bonusPoints - amount) * 100) / 100;
    const newBonusSpent = Math.round((user.bonusSpent + amount) * 100) / 100;
    
    return this.update(userId, {
      bonusPoints: newBonusPoints,
      bonusSpent: newBonusSpent,
    });
  },

  // ✅ РЕАЛЬНАЯ РЕАЛИЗАЦИЯ: доступный бонус (минимум 10 AZN)
  getAvailableBonus(userId: string): number {
    const user = this.getById(userId);
    if (!user || user.bonusPoints < 10) return 0;
    return Math.round(user.bonusPoints * 100) / 100;
  },

  // ✅ РЕАЛЬНАЯ РЕАЛИЗАЦИЯ: информация о бонусах
  getBonusInfo(userId: string) {
    const user = this.getById(userId);
    if (!user) return null;
    return {
      available: this.getAvailableBonus(userId),
      spent: user.bonusSpent || 0,
      total: (user.bonusPoints || 0) + (user.bonusSpent || 0),
      tier: user.bonusTier,
    };
  },

  // Заглушка для статистики магазина (реализуется в vendor.ts при необходимости)
  updateStoreStats: () => true,
};