export interface DashboardProduct {
  id: number;
  name: string;
  description?: string;
  category: string;
  unitPrice?: number;
  width?: number;
  height?: number;
  status: "active" | "inactive" | "draft";
  imageUrl?: string;
  createdAt: string;
  updatedAt?: string;
}
