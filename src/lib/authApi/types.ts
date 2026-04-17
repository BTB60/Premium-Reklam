export interface UserData {
  token: string;
  userId: number | string;
  username: string;
  fullName: string;
  role: string;
  phone?: string;
  email?: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  unit: string;
  basePrice: number;
  salePrice: number;
  isActive: boolean;
  status?: string;
  width?: number;
  height?: number;
  minOrder?: number;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItem {
  id: number | string;
  productId: string;
  productName: string;
  unit: string;
  quantity: number;
  width?: number;
  height?: number;
  area: number;
  unitPrice: number;
  lineTotal: number;
  note?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  userFullName?: string;
  userUsername?: string;
  customerName: string;
  customerPhone?: string;
  customerWhatsapp?: string;
  customerAddress?: string;
  items: OrderItem[];
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  discountTotal?: number;
  totalAmount: number;
  finalTotal?: number;
  paidAmount: number;
  remainingAmount: number;
  isCredit: boolean;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface OrderSummary {
  todayOrderCount: number;
  todayOrderAmount: number;
  monthOrderCount: number;
  monthOrderAmount: number;
  totalPaid: number;
  totalDebt: number;
  totalOrders: number;
  totalAmount: number;
}