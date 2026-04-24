// src/lib/db/types.ts

// ========================================
// USER & AUTH
// ========================================

export type UserRole = "ADMIN" | "DECORATOR" | "VENDOR";

export interface MonthlyStats {
  month: string;
  totalSpent: number;
  orderCount: number;
  discountTier: "none" | "5percent" | "10percent";
}

export interface User {
  id: string;                    // ✅ Уникальный неизменяемый ID
  fullName: string;
  username: string;
  phone?: string;                // ✅ Привязан при регистрации
  email?: string;                // ✅ Привязан при регистрации
  password: string;
  role: UserRole;
  level: number;
  totalOrders: number;
  totalSales: number;
  monthlyStats: MonthlyStats[];
  bonusPoints: number;
  bonusSpent: number;
  bonusTier: "bronze" | "silver" | "gold" | "platinum";
  referralCode: string;
  referredBy?: string;
  referralCount: number;
  isVendor: boolean;
  storeId?: string;
  vendorBalance: number;
  totalVendorSales: number;
  totalPaidAmount: number;
  createdAt: string;
}

export interface LoginResult {
  success: boolean;
  user?: User;
  error?: string;
}

// ========================================
// SYSTEM & SETTINGS
// ========================================

export interface SystemSettings {
  id: string;
  unitPricePerSqm: number;
  productDiscounts: Record<string, number>;
  monthlyBonus500: number;
  monthlyBonus1000: number;
  /** false olanda 500/1000 AZN bonus endirimi tətbiq olunmur (admin söndürə bilər). */
  loyaltyBonusEnabled?: boolean;
  updatedAt: string;
}

// ========================================
// TASKS & BUSINESS
// ========================================

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

export interface Material {
  id: string;
  name: string;
  category: string;
  unit: "metr" | "m²" | "kq" | "ədəd";
  quantity: number;
  minQuantity: number;
  unitPrice: number;
  costPrice?: number;
  supplier?: string;
  lastRestocked: string;
  createdAt: string;
}

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

export interface CalendarEvent {
  id: string;
  userId: string;              // ✅ Обязательная привязка к пользователю
  title: string;
  description?: string;
  date: string;
  type: "delivery" | "meeting" | "deadline" | "other";
  orderId?: string;
  createdAt: string;
}

// ========================================
// ORDERS & NOTIFICATIONS
// ========================================

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

export type OrderWorkflowStatus = "təsdiq" | "ödəniş" | "dizayn" | "istehsal" | "kuryer" | "bitdi" | "cancelled";

export interface Order {
  id: string;
  orderNumber?: string;
  userId: string;              // ✅ ОБЯЗАТЕЛЬНОЕ ПОЛЕ — не может быть undefined
  customerName?: string;
  customerPhone?: string;
  customerWhatsapp?: string;
  customerAddress?: string;
  items: OrderItem[];
  status: "pending" | "approved" | "confirmed" | "design" | "printing" | "production" | "ready" | "delivering" | "completed" | "cancelled";
  workflowStatus: OrderWorkflowStatus;
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
  bonusUsed: number;
  paymentBreakdown: {
    cash: number;
    bonus: number;
    total: number;
  };
  createdAt: string;
  updatedAt?: string;
}

export interface Notification {
  id: string;
  userId: string;              // ✅ Обязательная привязка
  title: string;
  message: string;
  type: "order_status" | "payment" | "system";
  isRead: boolean;
  createdAt: string;
}

// ========================================
// PRODUCTS
// ========================================

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  basePrice: number;
  costPrice?: number;
  unit: "m²" | "ədəd" | "metr";
  minOrder: number;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  description: string;
  icon?: string;
  order: number;
}

export interface OrderTemplate {
  id: string;
  userId: string;              // ✅ Обязательная привязка
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

// ========================================
// USER FEATURES
// ========================================

export interface BonusTransaction {
  id: string;
  orderNumber?: string;
  userId: string;              // ✅ Обязательная привязка
  type: "earned" | "spent" | "bonus";
  points: number;
  description: string;
  orderId?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  userId: string;              // ✅ Обязательная привязка
  orderId?: string;
  amount: number;
  type: "payment" | "debt" | "refund";
  method?: "cash" | "card" | "transfer";
  description: string;
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface Favorite {
  id: string;
  userId: string;              // ✅ Обязательная привязка
  productId: string;
  productName: string;
  productPrice: number;
  createdAt: string;
}

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

// ========================================
// VENDOR SYSTEM
// ========================================

/** Marketplace-də sıralama: VIP ən öndə, sonra Premium, sonra Standart. */
export type VendorHighlightTier = "standard" | "premium" | "vip";

export interface VendorStore {
  id: string;
  vendorId: string;            // ✅ Привязка к владельцу
  name: string;
  description: string;
  logo?: string;
  banner?: string;
  address: string;
  phone: string;
  email: string;
  category: string[];
  isActive: boolean;
  isApproved: boolean;
  /** Paket: admin təyin edir; aşağı dəyər = daha çox ön sıra. */
  highlightTier?: VendorHighlightTier;
  /** Müddətli VIP: ISO bitmə vaxtı; boş/boş string = VIP limitsiz. */
  vipExpiresAt?: string | null;
  /** Müddətli VIP bitəndə hansı paketə düşsün (yazılmayıbsa standart). */
  tierAfterVip?: "standard" | "premium";
  rating: number;
  reviewCount: number;
  totalSales: number;
  commissionRate: number;
  totalOrderAmount: number;
  totalBonusEarned: number;
  createdAt: string;
  updatedAt: string;
}

export interface StoreRequest {
  id: string;
  vendorId: string;            // ✅ Привязка к заявителю
  vendorName: string;
  vendorPhone: string;
  name: string;
  description: string;
  logo?: string;
  banner?: string;
  address: string;
  phone: string;
  email: string;
  category: string[];
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  createdAt: string;
  updatedAt?: string;
  processedAt?: string;
  processedBy?: string;
}

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

export interface Review {
  id: string;
  storeId: string;
  productId?: string;
  userId: string;              // ✅ Привязка к автору
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface VendorOrder {
  id: string;
  orderId: string;
  vendorId: string;
  storeId: string;
  storeName: string;
  customerId: string;          // ✅ Фиксированный ID клиента
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    total: number;
  }[];
  subtotal: number;
  commission: number;
  vendorTotal: number;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

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

// ========================================
// SUPPORT CHAT SYSTEM (Onlayn müraciət)
// ========================================

export interface SupportAttachment {
  type: "image" | "video";
  url: string;           // base64 или URL
  size: number;          // bytes
  name: string;
  mimeType: string;
}

export interface SupportMessage {
  id: string;                    // Date.now().toString()
  conversationId: string;        // userId (привязка к пользователю)
  senderId: string;              // ID отправителя
  senderRole: "DECORATOR" | "ADMIN" | "SUBADMIN";
  content: string;               // Текст сообщения
  attachment?: SupportAttachment; // Опционально: вложение
  createdAt: string;             // ISO8601
  read: boolean;                 // Статус прочтения
}

export interface SupportNotification {
  id: string;
  userId: string;
  type: "support_message";
  messageId: string;
  preview: string;               // Краткий текст для уведомления
  createdAt: string;
  read: boolean;
}