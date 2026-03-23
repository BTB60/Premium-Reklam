// Shared in-memory database for Vercel serverless
// Note: This resets on each deployment. For production, use Vercel KV, Postgres, or Neon.

export interface User {
  id: string;
  fullName: string;
  username: string;
  phone: string;
  email: string;
  password: string;
  role: "ADMIN" | "DECORATOR" | "VENDOR";
  level: number;
  totalOrders: number;
  totalSales: number;
  monthlyStats: any[];
  bonusPoints: number;
  bonusTier: "bronze" | "silver" | "gold" | "platinum";
  referralCode: string;
  referralCount: number;
  isVendor: boolean;
  vendorBalance: number;
  totalVendorSales: number;
  createdAt: string;
}

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  productType: string;
  width: number;
  height: number;
  quantity: number;
  notes: string;
  status: "pending" | "approved" | "production" | "ready" | "delivered" | "cancelled";
  totalAmount: number;
  discount: number;
  finalTotal: number;
  useDebt: boolean;
  createdAt: string;
}

// Global storage (persists during server lifetime)
declare global {
  var __db_users: User[] | undefined;
  var __db_orders: Order[] | undefined;
  var __db_user_id_counter: number | undefined;
  var __db_order_id_counter: number | undefined;
}

// Get admin password from environment variable
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Nasir147286";

// Initialize global storage
if (!global.__db_users) {
  global.__db_users = [
    // Default admin user
    {
      id: "1",
      fullName: "Admin",
      username: "admin",
      phone: "+994507988177",
      email: "premiumreklam@bk.ru",
      password: ADMIN_PASSWORD,
      role: "ADMIN",
      level: 100,
      totalOrders: 0,
      totalSales: 0,
      monthlyStats: [],
      bonusPoints: 0,
      bonusTier: "platinum",
      referralCode: "ADMIN001",
      referralCount: 0,
      isVendor: false,
      vendorBalance: 0,
      totalVendorSales: 0,
      createdAt: new Date().toISOString(),
    }
  ];
  global.__db_user_id_counter = 2;
  global.__db_orders = [];
  global.__db_order_id_counter = 1;
}

export const db = {
  get users(): User[] {
    return global.__db_users || [];
  },
  
  get orders(): Order[] {
    return global.__db_orders || [];
  },

  addUser(user: Omit<User, "id" | "createdAt">): User {
    const newUser: User = {
      ...user,
      id: String(global.__db_user_id_counter || 2),
      createdAt: new Date().toISOString(),
    };
    (global.__db_users || []).push(newUser);
    global.__db_user_id_counter = (global.__db_user_id_counter || 2) + 1;
    return newUser;
  },

  addOrder(order: Omit<Order, "id" | "createdAt">): Order {
    const newOrder: Order = {
      ...order,
      id: String(global.__db_order_id_counter || 1),
      createdAt: new Date().toISOString(),
    };
    (global.__db_orders || []).push(newOrder);
    global.__db_order_id_counter = (global.__db_order_id_counter || 1) + 1;
    return newOrder;
  },

  updateUser(id: string, updates: Partial<User>): User | null {
    const index = (global.__db_users || []).findIndex(u => u.id === id);
    if (index === -1) return null;
    (global.__db_users || [])[index] = { ...(global.__db_users || [])[index], ...updates };
    return (global.__db_users || [])[index];
  },

  updateOrder(id: string, updates: Partial<Order>): Order | null {
    const index = (global.__db_orders || []).findIndex(o => o.id === id);
    if (index === -1) return null;
    (global.__db_orders || [])[index] = { ...(global.__db_orders || [])[index], ...updates };
    return (global.__db_orders || [])[index];
  },
};
