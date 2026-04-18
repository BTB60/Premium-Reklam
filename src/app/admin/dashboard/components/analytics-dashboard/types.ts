export interface AnalyticsOrder {
  id: number;
  orderNumber: string;
  userId?: number;
  userFullName?: string;
  status: string;
  totalAmount: number;
  paidAmount?: number;
  createdAt: string;
  items: AnalyticsOrderItem[];
}

export interface AnalyticsOrderItem {
  id: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface AnalyticsUser {
  id: string;
  fullName: string;
  username: string;
  totalOrders?: number;
  totalSales?: number;
}

export interface DailyStats {
  date: string;
  revenue: number;
  orders: number;
}
