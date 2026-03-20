export type UserRole = "ADMIN" | "DECORATOR" | "VENDOR";

export interface MonthlyStats {
  month: string; // YYYY-MM format
  totalSpent: number;
  orderCount: number;
  discountTier: "none" | "5percent" | "10percent";
}

// System Settings Interface
export interface SystemSettings {
  id: string;
  unitPricePerSqm: number; // 1 m² qiymət (default: 5 AZN)
  productDiscounts: Record<string, number>; // Hər məhsul üçün endirim %
  monthlyBonus500: number; // 500 AZN keçəndə bonus % (default: 5)
  monthlyBonus1000: number; // 1000 AZN keçəndə bonus % (default: 10)
  updatedAt: string;
}

// Task Interface
export interface Task {
  id: string;
  decoratorId: string;
  title: string;
  description: string;
  deadline: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  createdBy: string;
  createdAt: string;
  completedAt?: string;
}

// Bonus/Rewards Interface
export interface BonusTransaction {
  id: string;
  orderNumber?: string;
  userId: string;
  type: "earned" | "spent" | "bonus";
  points: number;
  description: string;
  orderId?: string;
  createdAt: string;
}

// Payment/Debt Interface
export interface Payment {
  id: string;
  userId: string;
  orderId?: string;
  amount: number;
  type: "payment" | "debt" | "refund";
  method?: "cash" | "card" | "transfer";
  description: string;
  createdAt: string;
}

// Message/Chat Interface
export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

// Product Interface
export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  basePrice: number;
  unit: "m²" | "ədəd" | "metr";
  minOrder: number;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Product Category Interface
export interface ProductCategory {
  id: string;
  name: string;
  description: string;
  icon?: string;
  order: number;
}

// Order Template Interface
export interface OrderTemplate {
  id: string;
  userId: string;
  name: string;
  items: {
    productId: string;
    productName: string;
    width?: number;
    height?: number;
    quantity: number;
    notes?: string;
  }[];
  createdAt: string;
}

// Inventory/Material Interface
export interface Material {
  id: string;
  name: string;
  category: string;
  unit: "metr" | "m²" | "kq" | "ədəd";
  quantity: number;
  minQuantity: number;
  unitPrice: number;
  supplier?: string;
  lastRestocked: string;
  createdAt: string;
}

// Worker Task Interface
export interface WorkerTask {
  id: string;
  workerId: string;
  workerName: string;
  title: string;
  description: string;
  orderId?: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in_progress" | "completed" | "cancelled";
  deadline?: string;
  createdBy: string;
  createdAt: string;
  completedAt?: string;
}

// Financial Transaction Interface
export interface FinancialTransaction {
  id: string;
  type: "income" | "expense";
  category: string;
  amount: number;
  description: string;
  orderId?: string;
  date: string;
  createdBy: string;
  createdAt: string;
}

// Calendar Event Interface
export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  description?: string;
  date: string;
  type: "delivery" | "meeting" | "deadline" | "other";
  orderId?: string;
  createdAt: string;
}

// Favorite Product Interface
export interface Favorite {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  productPrice: number;
  createdAt: string;
}

// Referral Record Interface
export interface ReferralRecord {
  id: string;
  referrerId: string;
  referredId: string;
  referredName: string;
  status: "pending" | "completed";
  bonusPoints: number;
  createdAt: string;
  completedAt?: string;
}

// Promo Code Interface
export interface PromoCode {
  id: string;
  code: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrderAmount: number;
  maxUses: number;
  usedCount: number;
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
}

// Vendor Store Interface
export interface VendorStore {
  id: string;
  vendorId: string;
  name: string;
  description: string;
  logo?: string;
  banner?: string;
  address: string;
  phone: string;
  email: string;
  category: string[];
  isActive: boolean;
  rating: number;
  reviewCount: number;
  totalSales: number;
  commissionRate: number; // default 5%
  createdAt: string;
  updatedAt: string;
}

// Vendor Product Interface (products sold by vendors)
export interface VendorProduct {
  id: string;
  vendorId: string;
  storeId: string;
  name: string;
  description: string;
  category: string;
  price: number;
  unit: "m²" | "ədəd" | "metr";
  images: string[];
  stock: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Review Interface
export interface Review {
  id: string;
  storeId: string;
  productId?: string;
  userId: string;
  userName: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
}

// Vendor Order Interface
export interface VendorOrder {
  id: string;
  orderId: string;
  vendorId: string;
  customerId: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    total: number;
  }[];
  subtotal: number;
  commission: number; // 5% of subtotal
  vendorTotal: number; // subtotal - commission
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

// Vendor Balance/Withdrawal Interface
export interface VendorWithdrawal {
  id: string;
  vendorId: string;
  amount: number;
  status: "pending" | "approved" | "rejected" | "completed";
  method: "bank" | "cash";
  accountInfo: string;
  requestedAt: string;
  processedAt?: string;
  notes?: string;
}

export interface User {
  id: string;
  fullName: string;
  username: string;
  phone?: string;
  email?: string;
  password: string;
  role: UserRole;
  level: number;
  totalOrders: number;
  totalSales: number;
  monthlyStats: MonthlyStats[];
  // Bonus system
  bonusPoints: number;
  bonusTier: "bronze" | "silver" | "gold" | "platinum";
  // Referral system
  referralCode: string;
  referredBy?: string;
  referralCount: number;
  // Vendor system
  isVendor: boolean;
  storeId?: string;
  vendorBalance: number;
  totalVendorSales: number;
  createdAt: string;
}

export interface LoginResult {
  success: boolean;
  user?: User;
  error?: string;
}

const USERS_KEY = "decor_users";
const CURRENT_USER_KEY = "decor_current_user";

function getUsers(): User[] {
  if (typeof window === "undefined") return [];

  const raw = localStorage.getItem(USERS_KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveUsers(users: User[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function saveCurrentUser(user: User) {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

function seedAdminIfNeeded() {
  const users = getUsers();

  const hasAdmin = users.some(
    (u) => u.username === "admin" && u.role === "ADMIN"
  );

  if (!hasAdmin) {
    const admin: User = {
      id: "admin-1",
      fullName: "Super Admin",
      username: "admin",
      phone: "0500000000",
      password: "nasir147286",
      role: "ADMIN",
      level: 100,
      totalOrders: 0,
      totalSales: 0,
      monthlyStats: [],
      bonusPoints: 0,
      bonusTier: "bronze",
      referralCode: "ADMIN001",
      referralCount: 0,
      isVendor: false,
      vendorBalance: 0,
      totalVendorSales: 0,
      createdAt: new Date().toISOString(),
    };

    users.push(admin);
    saveUsers(users);
  }
}

if (typeof window !== "undefined") {
  seedAdminIfNeeded();
}

// Order types
export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  width: number;
  height: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  orderNumber?: string;
  userId: string;
  user?: {
    id: number;
    fullName: string;
    username: string;
  };
  customerName?: string;
  customerPhone?: string;
  customerWhatsapp?: string;
  customerAddress?: string;
  items: OrderItem[];
  status: "pending" | "approved" | "confirmed" | "design" | "printing" | "production" | "ready" | "delivering" | "completed" | "cancelled";
  paymentStatus: "pending" | "partial" | "paid";
  paymentMethod: "cash" | "card" | "transfer" | "debt";
  subtotal: number;
  discountPercent?: number;
  discountTotal: number;
  finalTotal: number;
  totalAmount?: number;
  paidAmount?: number;
  remainingAmount?: number;
  isCredit?: boolean;
  note?: string;
  createdAt: string;
  updatedAt?: string;
}

// Notification type
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "order_status" | "payment" | "system";
  isRead: boolean;
  createdAt: string;
}

const ORDERS_KEY = "decor_orders";
const NOTIFICATIONS_KEY = "decor_notifications";
const SETTINGS_KEY = "decor_settings";
const TASKS_KEY = "decor_tasks";

// Default settings
const DEFAULT_SETTINGS: SystemSettings = {
  id: "default",
  unitPricePerSqm: 5,
  productDiscounts: {
    banner: 0,
    vinyl: 0,
    poster: 0,
    canvas: 0,
    oracal: 0
  },
  monthlyBonus500: 5,
  monthlyBonus1000: 10,
  updatedAt: new Date().toISOString()
};

function getSettings(): SystemSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
    return DEFAULT_SETTINGS;
  }
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(settings: SystemSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function getTasks(): Task[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(TASKS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveTasks(tasks: Task[]) {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

function getOrders(): Order[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(ORDERS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveOrders(orders: Order[]) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

function getNotifications(): Notification[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(NOTIFICATIONS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveNotifications(notifications: Notification[]) {
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
}

// Discount calculation functions
export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function getUserMonthlyStats(user: User): MonthlyStats {
  const currentMonth = getCurrentMonth();
  
  // Initialize monthlyStats if undefined (for existing users)
  if (!user.monthlyStats) {
    user.monthlyStats = [];
  }
  
  let stats = user.monthlyStats.find(s => s.month === currentMonth);
  
  if (!stats) {
    stats = {
      month: currentMonth,
      totalSpent: 0,
      orderCount: 0,
      discountTier: "none"
    };
    user.monthlyStats.push(stats);
  }
  
  return stats;
}

export function calculateDiscount(monthlySpent: number): { rate: number; tier: MonthlyStats["discountTier"] } {
  if (monthlySpent >= 1000) {
    return { rate: 0.10, tier: "10percent" }; // 10% discount for 1000+ AZN
  } else if (monthlySpent >= 500) {
    return { rate: 0.05, tier: "5percent" }; // 5% discount for 500+ AZN
  }
  return { rate: 0, tier: "none" };
}

export function getDiscountMessage(tier: MonthlyStats["discountTier"]): string {
  switch (tier) {
    case "10percent":
      return "🎉 Bu ay 1000+ AZN sifariş etdiyiniz üçün 10% endirim qazandınız!";
    case "5percent":
      return "⭐ Bu ay 500+ AZN sifariş etdiyiniz üçün 5% endirim qazandınız!";
    default:
      return "💡 500 AZN sifariş edin 5%, 1000 AZN edin 10% endirim qazanın!";
  }
}

export const orders = {
  getAll(): Order[] {
    return getOrders();
  },
  getByUserId(userId: string): Order[] {
    return getOrders().filter((o) => o.userId === userId);
  },
  create(order: Omit<Order, "id" | "createdAt">): Order {
    const newOrder: Order = {
      ...order,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    const orders = getOrders();
    orders.push(newOrder);
    saveOrders(orders);

    // Update user XP and level
    const user = auth.getById(order.userId);
    if (user) {
      const userOrders = this.getByUserId(order.userId);
      const totalXP = userOrders.reduce((sum, o) => sum + Math.floor(o.finalTotal), 0);
      const newLevel = calculateLevelFromXP(totalXP);
      
      if (newLevel > user.level) {
        auth.update(user.id, { 
          level: newLevel,
          totalOrders: userOrders.length 
        });
        
        // Create level up notification
        notifications.create({
          userId: user.id,
          title: "Səviyyə artışı! 🎉",
          message: `Təbriklər! Siz Level ${newLevel}-ə çatdınız!`,
          type: "system",
        });
      } else {
        auth.update(user.id, { totalOrders: userOrders.length });
      }
    }

    return newOrder;
  },
};

// Level calculation helper
function calculateLevelFromXP(xp: number): number {
  const levels = [
    { level: 100, xp: 1500 },
    { level: 75, xp: 1000 },
    { level: 50, xp: 600 },
    { level: 25, xp: 300 },
    { level: 10, xp: 100 },
    { level: 1, xp: 0 },
  ];
  for (const l of levels) {
    if (xp >= l.xp) return l.level;
  }
  return 1;
}

export const notifications = {
  getAll(): Notification[] {
    return getNotifications();
  },
  getByUserId(userId: string): Notification[] {
    return getNotifications().filter((n) => n.userId === userId);
  },
  create(notification: Omit<Notification, "id" | "createdAt" | "isRead">): Notification {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    const notifications = getNotifications();
    notifications.push(newNotification);
    saveNotifications(notifications);
    return newNotification;
  },
  markAsRead(id: string): void {
    const notifications = getNotifications();
    const index = notifications.findIndex((n) => n.id === id);
    if (index !== -1) {
      notifications[index].isRead = true;
      saveNotifications(notifications);
    }
  },
  delete(id: string): void {
    const notifications = getNotifications().filter((n) => n.id !== id);
    saveNotifications(notifications);
  },
};

// Settings API
export const settings = {
  get(): SystemSettings {
    return getSettings();
  },
  update(updates: Partial<Omit<SystemSettings, "id" | "updatedAt">>): SystemSettings {
    const current = getSettings();
    const updated: SystemSettings = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    saveSettings(updated);
    return updated;
  },
  reset(): SystemSettings {
    saveSettings(DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  }
};

// DB helper object for direct localStorage access
export const db = {
  getUsers(): User[] {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem("decor_users");
    return raw ? JSON.parse(raw) : [];
  },

  updateUser(updatedUser: User) {
    if (typeof window === "undefined") return;
    const users = this.getUsers();
    const updatedUsers = users.map((user) =>
      user.id === updatedUser.id ? updatedUser : user
    );
    localStorage.setItem("decor_users", JSON.stringify(updatedUsers));

    const currentRaw = localStorage.getItem("decor_current_user");
    if (currentRaw) {
      const currentUser: User = JSON.parse(currentRaw);
      if (currentUser.id === updatedUser.id) {
        localStorage.setItem("decor_current_user", JSON.stringify(updatedUser));
      }
    }
  },

  getOrders(): Order[] {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem("decor_orders");
    return raw ? JSON.parse(raw) : [];
  },

  saveOrders(orders: Order[]) {
    if (typeof window === "undefined") return;
    localStorage.setItem("decor_orders", JSON.stringify(orders));
  },

  getNotifications(): Notification[] {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem("decor_notifications");
    return raw ? JSON.parse(raw) : [];
  },

  saveNotifications(notifications: Notification[]) {
    if (typeof window === "undefined") return;
    localStorage.setItem("decor_notifications", JSON.stringify(notifications));
  },
};

// Bonus/Rewards API
const BONUS_KEY = "decor_bonus_transactions";

function getBonusTransactions(): BonusTransaction[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(BONUS_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveBonusTransactions(transactions: BonusTransaction[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(BONUS_KEY, JSON.stringify(transactions));
}

export const bonus = {
  getByUserId(userId: string): BonusTransaction[] {
    return getBonusTransactions().filter(t => t.userId === userId);
  },
  getBalance(userId: string): number {
    const transactions = this.getByUserId(userId);
    return transactions.reduce((sum, t) => {
      if (t.type === "earned" || t.type === "bonus") return sum + t.points;
      return sum - t.points;
    }, 0);
  },
  addTransaction(userId: string, type: BonusTransaction["type"], points: number, description: string, orderId?: string) {
    const transaction: BonusTransaction = {
      id: Date.now().toString(),
      userId,
      type,
      points,
      description,
      orderId,
      createdAt: new Date().toISOString(),
    };
    const all = getBonusTransactions();
    all.push(transaction);
    saveBonusTransactions(all);
    
    // Update user bonus points
    const users = getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      const currentBalance = this.getBalance(userId);
      users[userIndex].bonusPoints = currentBalance;
      // Update tier based on total earned
      const totalEarned = this.getByUserId(userId)
        .filter(t => t.type === "earned" || t.type === "bonus")
        .reduce((sum, t) => sum + t.points, 0);
      if (totalEarned >= 5000) users[userIndex].bonusTier = "platinum";
      else if (totalEarned >= 2000) users[userIndex].bonusTier = "gold";
      else if (totalEarned >= 500) users[userIndex].bonusTier = "silver";
      saveUsers(users);
    }
    return transaction;
  },
  getTierBenefits(tier: User["bonusTier"]) {
    const benefits = {
      bronze: { discount: 0, name: "Bronze" },
      silver: { discount: 0.05, name: "Silver" },
      gold: { discount: 0.10, name: "Gold" },
      platinum: { discount: 0.15, name: "Platinum" },
    };
    return benefits[tier];
  },
};

// Payments/Debt API
const PAYMENTS_KEY = "decor_payments";

function getPayments(): Payment[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(PAYMENTS_KEY);
  return raw ? JSON.parse(raw) : [];
}

function savePayments(payments: Payment[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments));
}

export const payments = {
  getAll(): Payment[] {
    return getPayments();
  },
  getByUserId(userId: string): Payment[] {
    return getPayments().filter(p => p.userId === userId);
  },
  getBalance(userId: string): number {
    const userPayments = this.getByUserId(userId);
    return userPayments.reduce((sum, p) => {
      if (p.type === "payment" || p.type === "refund") return sum + p.amount;
      return sum - p.amount;
    }, 0);
  },
  getDebt(userId: string): number {
    const balance = this.getBalance(userId);
    return balance < 0 ? Math.abs(balance) : 0;
  },
  create(payment: Omit<Payment, "id" | "createdAt">): Payment {
    const newPayment: Payment = {
      ...payment,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    const all = getPayments();
    all.push(newPayment);
    savePayments(all);
    return newPayment;
  },
};

// Messages/Chat API
const MESSAGES_KEY = "decor_messages";

function getMessages(): Message[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(MESSAGES_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveMessages(messages: Message[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
}

export const messages = {
  getAll(): Message[] {
    return getMessages();
  },
  getConversation(userId1: string, userId2: string): Message[] {
    return getMessages().filter(m => 
      (m.senderId === userId1 && m.receiverId === userId2) ||
      (m.senderId === userId2 && m.receiverId === userId1)
    ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },
  getUnreadCount(userId: string): number {
    return getMessages().filter(m => m.receiverId === userId && !m.isRead).length;
  },
  send(senderId: string, receiverId: string, content: string): Message {
    const message: Message = {
      id: Date.now().toString(),
      senderId,
      receiverId,
      content,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    const all = getMessages();
    all.push(message);
    saveMessages(all);
    return message;
  },
  markAsRead(messageId: string): void {
    const all = getMessages();
    const index = all.findIndex(m => m.id === messageId);
    if (index !== -1) {
      all[index].isRead = true;
      saveMessages(all);
    }
  },
  markAllAsRead(receiverId: string): void {
    const all = getMessages();
    all.forEach(m => {
      if (m.receiverId === receiverId && !m.isRead) {
        m.isRead = true;
      }
    });
    saveMessages(all);
  },
};

// Products API
const PRODUCTS_KEY = "decor_products";
const CATEGORIES_KEY = "decor_categories";

function getProducts(): Product[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(PRODUCTS_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveProducts(products: Product[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}

function getCategories(): ProductCategory[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(CATEGORIES_KEY);
  return raw ? JSON.parse(raw) : seedCategories();
}

function seedCategories(): ProductCategory[] {
  const defaultCategories: ProductCategory[] = [
    { id: "1", name: "Vinil Banner", description: "Reklam bannerləri", order: 1 },
    { id: "2", name: "Orakal", description: "Kəsiləbilən plenka", order: 2 },
    { id: "3", name: "Laminasiya", description: "Məhsul laminasiyası", order: 3 },
    { id: "4", name: "Karton", description: "Reklam kartonları", order: 4 },
    { id: "5", name: "Plexi", description: "Akril materiallar", order: 5 },
  ];
  if (typeof window !== "undefined") {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(defaultCategories));
  }
  return defaultCategories;
}

function saveCategories(categories: ProductCategory[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
}

export const products = {
  getAll(): Product[] {
    return getProducts();
  },
  getActive(): Product[] {
    return getProducts().filter(p => p.isActive);
  },
  getByCategory(categoryId: string): Product[] {
    return getProducts().filter(p => p.category === categoryId && p.isActive);
  },
  getById(id: string): Product | undefined {
    return getProducts().find(p => p.id === id);
  },
  create(product: Omit<Product, "id" | "createdAt" | "updatedAt">): Product {
    const newProduct: Product = {
      ...product,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const all = getProducts();
    all.push(newProduct);
    saveProducts(all);
    return newProduct;
  },
  update(id: string, updates: Partial<Product>): Product | null {
    const all = getProducts();
    const index = all.findIndex(p => p.id === id);
    if (index === -1) return null;
    all[index] = { ...all[index], ...updates, updatedAt: new Date().toISOString() };
    saveProducts(all);
    return all[index];
  },
  delete(id: string): boolean {
    const all = getProducts();
    const filtered = all.filter(p => p.id !== id);
    if (filtered.length === all.length) return false;
    saveProducts(filtered);
    return true;
  },
  getCategories(): ProductCategory[] {
    return getCategories();
  },
  createCategory(category: Omit<ProductCategory, "id">): ProductCategory {
    const newCategory: ProductCategory = {
      ...category,
      id: Date.now().toString(),
    };
    const all = getCategories();
    all.push(newCategory);
    saveCategories(all);
    return newCategory;
  },
  updateCategory(id: string, updates: Partial<ProductCategory>): ProductCategory | null {
    const all = getCategories();
    const index = all.findIndex(c => c.id === id);
    if (index === -1) return null;
    all[index] = { ...all[index], ...updates };
    saveCategories(all);
    return all[index];
  },
  deleteCategory(id: string): boolean {
    const all = getCategories();
    const filtered = all.filter(c => c.id !== id);
    if (filtered.length === all.length) return false;
    saveCategories(filtered);
    return true;
  },
};

// Order Templates API
const TEMPLATES_KEY = "decor_templates";

function getTemplates(): OrderTemplate[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(TEMPLATES_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveTemplates(templates: OrderTemplate[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
}

export const templates = {
  getByUserId(userId: string): OrderTemplate[] {
    return getTemplates().filter(t => t.userId === userId);
  },
  getById(id: string): OrderTemplate | undefined {
    return getTemplates().find(t => t.id === id);
  },
  create(template: Omit<OrderTemplate, "id" | "createdAt">): OrderTemplate {
    const newTemplate: OrderTemplate = {
      ...template,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    const all = getTemplates();
    all.push(newTemplate);
    saveTemplates(all);
    return newTemplate;
  },
  update(id: string, updates: Partial<OrderTemplate>): OrderTemplate | null {
    const all = getTemplates();
    const index = all.findIndex(t => t.id === id);
    if (index === -1) return null;
    all[index] = { ...all[index], ...updates };
    saveTemplates(all);
    return all[index];
  },
  delete(id: string): boolean {
    const all = getTemplates();
    const filtered = all.filter(t => t.id !== id);
    if (filtered.length === all.length) return false;
    saveTemplates(filtered);
    return true;
  },
};

// Inventory/Materials API
const MATERIALS_KEY = "decor_materials";

function getMaterials(): Material[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(MATERIALS_KEY);
  return raw ? JSON.parse(raw) : seedMaterials();
}

function seedMaterials(): Material[] {
  const defaultMaterials: Material[] = [
    { id: "1", name: "Vinil Banner 440g", category: "Banner", unit: "m²", quantity: 500, minQuantity: 50, unitPrice: 8, supplier: "Oriflame", lastRestocked: new Date().toISOString(), createdAt: new Date().toISOString() },
    { id: "2", name: "Orakal 641", category: "Plenka", unit: "metr", quantity: 200, minQuantity: 30, unitPrice: 3, supplier: "Oriflame", lastRestocked: new Date().toISOString(), createdAt: new Date().toISOString() },
    { id: "3", name: "Laminasiya", category: "Laminasiya", unit: "m²", quantity: 300, minQuantity: 40, unitPrice: 4, supplier: "Oriflame", lastRestocked: new Date().toISOString(), createdAt: new Date().toISOString() },
    { id: "4", name: "Karton 3mm", category: "Karton", unit: "m²", quantity: 100, minQuantity: 20, unitPrice: 12, supplier: "Oriflame", lastRestocked: new Date().toISOString(), createdAt: new Date().toISOString() },
  ];
  if (typeof window !== "undefined") {
    localStorage.setItem(MATERIALS_KEY, JSON.stringify(defaultMaterials));
  }
  return defaultMaterials;
}

function saveMaterials(materials: Material[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(MATERIALS_KEY, JSON.stringify(materials));
}

export const inventory = {
  getAll(): Material[] {
    return getMaterials();
  },
  getLowStock(): Material[] {
    return getMaterials().filter(m => m.quantity <= m.minQuantity);
  },
  getByCategory(category: string): Material[] {
    return getMaterials().filter(m => m.category === category);
  },
  create(material: Omit<Material, "id" | "createdAt" | "lastRestocked">): Material {
    const newMaterial: Material = {
      ...material,
      id: Date.now().toString(),
      lastRestocked: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    const all = getMaterials();
    all.push(newMaterial);
    saveMaterials(all);
    return newMaterial;
  },
  update(id: string, updates: Partial<Material>): Material | null {
    const all = getMaterials();
    const index = all.findIndex(m => m.id === id);
    if (index === -1) return null;
    all[index] = { ...all[index], ...updates };
    saveMaterials(all);
    return all[index];
  },
  delete(id: string): boolean {
    const all = getMaterials();
    const filtered = all.filter(m => m.id !== id);
    if (filtered.length === all.length) return false;
    saveMaterials(filtered);
    return true;
  },
  restock(id: string, amount: number): Material | null {
    const all = getMaterials();
    const index = all.findIndex(m => m.id === id);
    if (index === -1) return null;
    all[index].quantity += amount;
    all[index].lastRestocked = new Date().toISOString();
    saveMaterials(all);
    return all[index];
  },
};

// Worker Tasks API
const WORKER_TASKS_KEY = "decor_worker_tasks";

function getWorkerTasks(): WorkerTask[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(WORKER_TASKS_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveWorkerTasks(tasks: WorkerTask[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(WORKER_TASKS_KEY, JSON.stringify(tasks));
}

export const workerTasks = {
  getAll(): WorkerTask[] {
    return getWorkerTasks();
  },
  getByWorkerId(workerId: string): WorkerTask[] {
    return getWorkerTasks().filter(t => t.workerId === workerId);
  },
  getByStatus(status: WorkerTask["status"]): WorkerTask[] {
    return getWorkerTasks().filter(t => t.status === status);
  },
  create(task: Omit<WorkerTask, "id" | "createdAt">): WorkerTask {
    const newTask: WorkerTask = {
      ...task,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    const all = getWorkerTasks();
    all.push(newTask);
    saveWorkerTasks(all);
    return newTask;
  },
  update(id: string, updates: Partial<WorkerTask>): WorkerTask | null {
    const all = getWorkerTasks();
    const index = all.findIndex(t => t.id === id);
    if (index === -1) return null;
    all[index] = { ...all[index], ...updates };
    if (updates.status === "completed") {
      all[index].completedAt = new Date().toISOString();
    }
    saveWorkerTasks(all);
    return all[index];
  },
  delete(id: string): boolean {
    const all = getWorkerTasks();
    const filtered = all.filter(t => t.id !== id);
    if (filtered.length === all.length) return false;
    saveWorkerTasks(filtered);
    return true;
  },
};

// Financial Transactions API
const FINANCE_KEY = "decor_finance";

function getFinancialTransactions(): FinancialTransaction[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(FINANCE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveFinancialTransactions(transactions: FinancialTransaction[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(FINANCE_KEY, JSON.stringify(transactions));
}

export const finance = {
  getAll(): FinancialTransaction[] {
    return getFinancialTransactions();
  },
  getByDateRange(startDate: string, endDate: string): FinancialTransaction[] {
    return getFinancialTransactions().filter(
      t => t.date >= startDate && t.date <= endDate
    );
  },
  getByType(type: "income" | "expense"): FinancialTransaction[] {
    return getFinancialTransactions().filter(t => t.type === type);
  },
  getSummary(): { income: number; expense: number; balance: number } {
    const all = getFinancialTransactions();
    const income = all.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
    const expense = all.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
    return { income, expense, balance: income - expense };
  },
  create(transaction: Omit<FinancialTransaction, "id" | "createdAt">): FinancialTransaction {
    const newTransaction: FinancialTransaction = {
      ...transaction,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    const all = getFinancialTransactions();
    all.push(newTransaction);
    saveFinancialTransactions(all);
    return newTransaction;
  },
  update(id: string, updates: Partial<FinancialTransaction>): FinancialTransaction | null {
    const all = getFinancialTransactions();
    const index = all.findIndex(t => t.id === id);
    if (index === -1) return null;
    all[index] = { ...all[index], ...updates };
    saveFinancialTransactions(all);
    return all[index];
  },
  delete(id: string): boolean {
    const all = getFinancialTransactions();
    const filtered = all.filter(t => t.id !== id);
    if (filtered.length === all.length) return false;
    saveFinancialTransactions(filtered);
    return true;
  },
};

// Calendar API
const CALENDAR_KEY = "decor_calendar";

function getCalendarEvents(): CalendarEvent[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(CALENDAR_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveCalendarEvents(events: CalendarEvent[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CALENDAR_KEY, JSON.stringify(events));
}

export const calendar = {
  getAll(): CalendarEvent[] {
    return getCalendarEvents();
  },
  getByUserId(userId: string): CalendarEvent[] {
    return getCalendarEvents().filter(e => e.userId === userId);
  },
  getByDateRange(startDate: string, endDate: string): CalendarEvent[] {
    return getCalendarEvents().filter(
      e => e.date >= startDate && e.date <= endDate
    );
  },
  create(event: Omit<CalendarEvent, "id" | "createdAt">): CalendarEvent {
    const newEvent: CalendarEvent = {
      ...event,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    const all = getCalendarEvents();
    all.push(newEvent);
    saveCalendarEvents(all);
    return newEvent;
  },
  update(id: string, updates: Partial<CalendarEvent>): CalendarEvent | null {
    const all = getCalendarEvents();
    const index = all.findIndex(e => e.id === id);
    if (index === -1) return null;
    all[index] = { ...all[index], ...updates };
    saveCalendarEvents(all);
    return all[index];
  },
  delete(id: string): boolean {
    const all = getCalendarEvents();
    const filtered = all.filter(e => e.id !== id);
    if (filtered.length === all.length) return false;
    saveCalendarEvents(filtered);
    return true;
  },
};

// Favorites API
const FAVORITES_KEY = "decor_favorites";

function getFavorites(): Favorite[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(FAVORITES_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveFavorites(favorites: Favorite[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

export const favorites = {
  getByUserId(userId: string): Favorite[] {
    return getFavorites().filter(f => f.userId === userId);
  },
  isFavorite(userId: string, productId: string): boolean {
    return getFavorites().some(f => f.userId === userId && f.productId === productId);
  },
  add(userId: string, productId: string, productName: string, productPrice: number): Favorite {
    const newFavorite: Favorite = {
      id: Date.now().toString(),
      userId,
      productId,
      productName,
      productPrice,
      createdAt: new Date().toISOString(),
    };
    const all = getFavorites();
    all.push(newFavorite);
    saveFavorites(all);
    return newFavorite;
  },
  remove(userId: string, productId: string): boolean {
    const all = getFavorites();
    const filtered = all.filter(f => !(f.userId === userId && f.productId === productId));
    if (filtered.length === all.length) return false;
    saveFavorites(filtered);
    return true;
  },
  toggle(userId: string, productId: string, productName: string, productPrice: number): boolean {
    if (this.isFavorite(userId, productId)) {
      this.remove(userId, productId);
      return false;
    } else {
      this.add(userId, productId, productName, productPrice);
      return true;
    }
  },
};

// Referral API
const REFERRALS_KEY = "decor_referrals";

function getReferrals(): ReferralRecord[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(REFERRALS_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveReferrals(referrals: ReferralRecord[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(REFERRALS_KEY, JSON.stringify(referrals));
}

export const referrals = {
  getAll(): ReferralRecord[] {
    return getReferrals();
  },
  getByReferrerId(referrerId: string): ReferralRecord[] {
    return getReferrals().filter(r => r.referrerId === referrerId);
  },
  getStats(referrerId: string): { total: number; completed: number; pending: number; totalBonus: number } {
    const userReferrals = this.getByReferrerId(referrerId);
    return {
      total: userReferrals.length,
      completed: userReferrals.filter(r => r.status === "completed").length,
      pending: userReferrals.filter(r => r.status === "pending").length,
      totalBonus: userReferrals.filter(r => r.status === "completed").reduce((sum, r) => sum + r.bonusPoints, 0),
    };
  },
  create(referrerId: string, referredId: string, referredName: string): ReferralRecord {
    const newReferral: ReferralRecord = {
      id: Date.now().toString(),
      referrerId,
      referredId,
      referredName,
      status: "pending",
      bonusPoints: 100, // Default bonus
      createdAt: new Date().toISOString(),
    };
    const all = getReferrals();
    all.push(newReferral);
    saveReferrals(all);
    return newReferral;
  },
  complete(id: string): ReferralRecord | null {
    const all = getReferrals();
    const index = all.findIndex(r => r.id === id);
    if (index === -1) return null;
    all[index].status = "completed";
    all[index].completedAt = new Date().toISOString();
    saveReferrals(all);
    return all[index];
  },
};

// Vendor Store API
const VENDOR_STORES_KEY = "decor_vendor_stores";
const VENDOR_PRODUCTS_KEY = "decor_vendor_products";
const VENDOR_ORDERS_KEY = "decor_vendor_orders";
const VENDOR_WITHDRAWALS_KEY = "decor_vendor_withdrawals";

function getVendorStores(): VendorStore[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(VENDOR_STORES_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveVendorStores(stores: VendorStore[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(VENDOR_STORES_KEY, JSON.stringify(stores));
}

function getVendorProducts(): VendorProduct[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(VENDOR_PRODUCTS_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveVendorProducts(products: VendorProduct[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(VENDOR_PRODUCTS_KEY, JSON.stringify(products));
}

function getVendorOrders(): VendorOrder[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(VENDOR_ORDERS_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveVendorOrders(orders: VendorOrder[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(VENDOR_ORDERS_KEY, JSON.stringify(orders));
}

function getVendorWithdrawals(): VendorWithdrawal[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(VENDOR_WITHDRAWALS_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveVendorWithdrawals(withdrawals: VendorWithdrawal[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(VENDOR_WITHDRAWALS_KEY, JSON.stringify(withdrawals));
}

export const vendorStores = {
  getAll(): VendorStore[] {
    return getVendorStores().filter(s => s.isActive);
  },
  getById(id: string): VendorStore | undefined {
    return getVendorStores().find(s => s.id === id);
  },
  getByVendorId(vendorId: string): VendorStore | undefined {
    return getVendorStores().find(s => s.vendorId === vendorId);
  },
  create(store: Omit<VendorStore, "id" | "createdAt" | "updatedAt" | "rating" | "reviewCount" | "totalSales">): VendorStore {
    const newStore: VendorStore = {
      ...store,
      id: Date.now().toString(),
      rating: 0,
      reviewCount: 0,
      totalSales: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const all = getVendorStores();
    all.push(newStore);
    saveVendorStores(all);
    return newStore;
  },
  update(id: string, updates: Partial<VendorStore>): VendorStore | null {
    const all = getVendorStores();
    const index = all.findIndex(s => s.id === id);
    if (index === -1) return null;
    all[index] = { ...all[index], ...updates, updatedAt: new Date().toISOString() };
    saveVendorStores(all);
    return all[index];
  },
};

export const vendorProducts = {
  getAll(): VendorProduct[] {
    return getVendorProducts().filter(p => p.isActive);
  },
  getById(id: string): VendorProduct | undefined {
    return getVendorProducts().find(p => p.id === id);
  },
  getByStoreId(storeId: string): VendorProduct[] {
    return getVendorProducts().filter(p => p.storeId === storeId && p.isActive);
  },
  getByVendorId(vendorId: string): VendorProduct[] {
    return getVendorProducts().filter(p => p.vendorId === vendorId);
  },
  create(product: Omit<VendorProduct, "id" | "createdAt" | "updatedAt">): VendorProduct {
    const newProduct: VendorProduct = {
      ...product,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const all = getVendorProducts();
    all.push(newProduct);
    saveVendorProducts(all);
    return newProduct;
  },
  update(id: string, updates: Partial<VendorProduct>): VendorProduct | null {
    const all = getVendorProducts();
    const index = all.findIndex(p => p.id === id);
    if (index === -1) return null;
    all[index] = { ...all[index], ...updates, updatedAt: new Date().toISOString() };
    saveVendorProducts(all);
    return all[index];
  },
  delete(id: string): boolean {
    const all = getVendorProducts();
    const index = all.findIndex(p => p.id === id);
    if (index === -1) return false;
    all[index].isActive = false;
    saveVendorProducts(all);
    return true;
  },
};

// Reviews API
const REVIEWS_KEY = "decor_reviews";

function getReviews(): Review[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(REVIEWS_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveReviews(reviews: Review[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
}

export const reviews = {
  getAll(): Review[] {
    return getReviews();
  },
  getByStoreId(storeId: string): Review[] {
    return getReviews().filter(r => r.storeId === storeId);
  },
  getByProductId(productId: string): Review[] {
    return getReviews().filter(r => r.productId === productId);
  },
  create(review: Omit<Review, "id" | "createdAt">): Review {
    const newReview: Review = {
      ...review,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    const all = getReviews();
    all.push(newReview);
    saveReviews(all);
    
    // Update store rating
    const storeReviews = this.getByStoreId(review.storeId);
    const avgRating = storeReviews.reduce((sum, r) => sum + r.rating, 0) / storeReviews.length;
    const store = vendorStores.getById(review.storeId);
    if (store) {
      vendorStores.update(store.id, { 
        rating: Math.round(avgRating * 10) / 10,
        reviewCount: storeReviews.length 
      });
    }
    
    return newReview;
  },
  delete(id: string): boolean {
    const all = getReviews();
    const index = all.findIndex(r => r.id === id);
    if (index === -1) return false;
    all.splice(index, 1);
    saveReviews(all);
    return true;
  },
};

// Promo Codes API
const PROMO_CODES_KEY = "decor_promo_codes";
const USED_PROMOS_KEY = "decor_used_promos";

function getPromoCodes(): PromoCode[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(PROMO_CODES_KEY);
  const defaultCodes: PromoCode[] = [
    {
      id: "1",
      code: "PREMIUM20",
      description: "İlk sifarişə 20% endirim",
      discountType: "percentage",
      discountValue: 20,
      minOrderAmount: 50,
      maxUses: 100,
      usedCount: 0,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "2",
      code: "WELCOME10",
      description: "Xoş gəldin 10 AZN endirim",
      discountType: "fixed",
      discountValue: 10,
      minOrderAmount: 30,
      maxUses: 200,
      usedCount: 0,
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  ];
  return raw ? JSON.parse(raw) : defaultCodes;
}

function savePromoCodes(codes: PromoCode[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROMO_CODES_KEY, JSON.stringify(codes));
}

function getUsedPromos(): { userId: string; promoId: string; usedAt: string }[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(USED_PROMOS_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveUsedPromos(used: { userId: string; promoId: string; usedAt: string }[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(USED_PROMOS_KEY, JSON.stringify(used));
}

export const promoCodes = {
  getAll(): PromoCode[] {
    return getPromoCodes().filter(c => c.isActive && new Date(c.expiresAt) > new Date());
  },
  getByCode(code: string): PromoCode | undefined {
    return this.getAll().find(c => c.code.toUpperCase() === code.toUpperCase());
  },
  validate(code: string, userId: string, orderAmount: number): { valid: boolean; message: string; discount?: number } {
    const promo = this.getByCode(code);
    if (!promo) return { valid: false, message: "Promo kod tapılmadı" };
    
    if (orderAmount < promo.minOrderAmount) {
      return { valid: false, message: `Minimum sifariş məbləği ${promo.minOrderAmount} AZN olmalıdır` };
    }
    
    if (promo.usedCount >= promo.maxUses) {
      return { valid: false, message: "Bu kodun istifadə limiti bitib" };
    }
    
    const usedByUser = getUsedPromos().find(u => u.userId === userId && u.promoId === promo.id);
    if (usedByUser) {
      return { valid: false, message: "Siz bu kodu artıq istifadə etmisiniz" };
    }
    
    const discount = promo.discountType === "percentage" 
      ? orderAmount * (promo.discountValue / 100)
      : promo.discountValue;
    
    return { valid: true, message: "Kod aktivləşdirildi", discount };
  },
  apply(code: string, userId: string): boolean {
    const promo = this.getByCode(code);
    if (!promo) return false;
    
    const all = getPromoCodes();
    const index = all.findIndex(c => c.id === promo.id);
    if (index === -1) return false;
    
    all[index].usedCount++;
    savePromoCodes(all);
    
    const used = getUsedPromos();
    used.push({ userId, promoId: promo.id, usedAt: new Date().toISOString() });
    saveUsedPromos(used);
    
    return true;
  },
};

export const vendorOrders = {
  getAll(): VendorOrder[] {
    return getVendorOrders();
  },
  getByVendorId(vendorId: string): VendorOrder[] {
    return getVendorOrders().filter(o => o.vendorId === vendorId);
  },
  getByCustomerId(customerId: string): VendorOrder[] {
    return getVendorOrders().filter(o => o.customerId === customerId);
  },
  create(order: Omit<VendorOrder, "id" | "createdAt" | "updatedAt">): VendorOrder {
    const newOrder: VendorOrder = {
      ...order,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const all = getVendorOrders();
    all.push(newOrder);
    saveVendorOrders(all);
    return newOrder;
  },
  updateStatus(id: string, status: VendorOrder["status"]): VendorOrder | null {
    const all = getVendorOrders();
    const index = all.findIndex(o => o.id === id);
    if (index === -1) return null;
    all[index].status = status;
    all[index].updatedAt = new Date().toISOString();
    saveVendorOrders(all);
    return all[index];
  },
};

export const vendorWithdrawals = {
  getAll(): VendorWithdrawal[] {
    return getVendorWithdrawals();
  },
  getByVendorId(vendorId: string): VendorWithdrawal[] {
    return getVendorWithdrawals().filter(w => w.vendorId === vendorId);
  },
  create(withdrawal: Omit<VendorWithdrawal, "id" | "requestedAt">): VendorWithdrawal {
    const newWithdrawal: VendorWithdrawal = {
      ...withdrawal,
      id: Date.now().toString(),
      requestedAt: new Date().toISOString(),
    };
    const all = getVendorWithdrawals();
    all.push(newWithdrawal);
    saveVendorWithdrawals(all);
    return newWithdrawal;
  },
  updateStatus(id: string, status: VendorWithdrawal["status"], notes?: string): VendorWithdrawal | null {
    const all = getVendorWithdrawals();
    const index = all.findIndex(w => w.id === id);
    if (index === -1) return null;
    all[index].status = status;
    if (notes) all[index].notes = notes;
    if (status === "completed" || status === "rejected") {
      all[index].processedAt = new Date().toISOString();
    }
    saveVendorWithdrawals(all);
    return all[index];
  },
};

// Commission calculation (5% default)
export function calculateCommission(amount: number, rate: number = 0.05): { commission: number; vendorTotal: number } {
  const commission = amount * rate;
  return {
    commission: Math.round(commission * 100) / 100,
    vendorTotal: Math.round((amount - commission) * 100) / 100,
  };
}

// Notification Sound
export function playNotificationSound() {
  if (typeof window === "undefined") return;
  
  // Create a simple beep sound using Web Audio API
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800; // Hz
    oscillator.type = "sine";
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (e) {
    console.error("Failed to play notification sound:", e);
  }
}

// Tasks API
export const tasks = {
  getAll(): Task[] {
    return getTasks();
  },
  getByDecoratorId(decoratorId: string): Task[] {
    return getTasks().filter(t => t.decoratorId === decoratorId);
  },
  getById(id: string): Task | undefined {
    return getTasks().find(t => t.id === id);
  },
  create(task: Omit<Task, "id" | "createdAt" | "status">): Task {
    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
      status: "pending",
      createdAt: new Date().toISOString()
    };
    const allTasks = getTasks();
    allTasks.push(newTask);
    saveTasks(allTasks);
    return newTask;
  },
  updateStatus(id: string, status: Task["status"]): void {
    const allTasks = getTasks();
    const index = allTasks.findIndex(t => t.id === id);
    if (index !== -1) {
      allTasks[index].status = status;
      if (status === "completed") {
        allTasks[index].completedAt = new Date().toISOString();
      }
      saveTasks(allTasks);
    }
  },
  delete(id: string): void {
    const allTasks = getTasks().filter(t => t.id !== id);
    saveTasks(allTasks);
  }
};

export const auth = {
  async register(data: {
    fullName: string;
    username: string;
    phone?: string;
    password: string;
  }): Promise<{ success: boolean; error?: string }> {
    const users = getUsers();

    const usernameExists = users.some(
      (u) => u.username.toLowerCase() === data.username.trim().toLowerCase()
    );

    if (usernameExists) {
      return { success: false, error: "Bu istifadəçi adı artıq mövcuddur" };
    }

    if (data.phone) {
      const phoneExists = users.some((u) => u.phone === data.phone!.trim());
      if (phoneExists) {
        return { success: false, error: "Bu telefon nömrəsi artıq mövcuddur" };
      }
    }

    const newUser: User = {
      id: Date.now().toString(),
      fullName: data.fullName.trim(),
      username: data.username.trim(),
      phone: data.phone?.trim() || "",
      password: data.password,
      role: "DECORATOR",
      level: 1,
      totalOrders: 0,
      totalSales: 0,
      monthlyStats: [],
      bonusPoints: 0,
      bonusTier: "bronze",
      referralCode: `REF${Date.now().toString().slice(-6)}`,
      referralCount: 0,
      isVendor: false,
      vendorBalance: 0,
      totalVendorSales: 0,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    saveUsers(users);

    return { success: true };
  },

  async login(usernameOrPhone: string, password: string): Promise<LoginResult> {
    const users = getUsers();

    const cleanValue = usernameOrPhone.trim();
    const cleanPassword = password.trim();

    const user = users.find(
      (u) =>
        (u.username === cleanValue || u.phone === cleanValue) &&
        u.password === cleanPassword
    );

    if (!user) {
      return {
        success: false,
        error: "İstifadəçi adı və ya şifrə yanlışdır",
      };
    }

    saveCurrentUser(user);

    return {
      success: true,
      user,
    };
  },

  logout() {
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  getCurrentUser(): User | null {
    if (typeof window === "undefined") return null;

    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  getAllUsers(): User[] {
    return getUsers();
  },

  getById(id: string): User | undefined {
    return getUsers().find(u => u.id === id);
  },

  update(id: string, updates: Partial<User>): User | null {
    const users = getUsers();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return null;
    users[index] = { ...users[index], ...updates };
    saveUsers(users);

    // Update current user in localStorage if it's the same user
    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser.id === id) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(users[index]));
    }

    return users[index];
  },
};
