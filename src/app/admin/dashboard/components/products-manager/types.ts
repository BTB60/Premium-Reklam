export interface DashboardProduct {
  id: number;
  name: string;
  description?: string;
  category: string;
  /** Satış qiyməti (salePrice) */
  unitPrice?: number;
  /** Alış qiyməti — admin paneldə; backend ictimai API-də göstərmir */
  purchasePrice?: number;
  width?: number;
  height?: number;
  status: "active" | "inactive" | "draft";
  imageUrl?: string;
  createdAt: string;
  updatedAt?: string;
}
