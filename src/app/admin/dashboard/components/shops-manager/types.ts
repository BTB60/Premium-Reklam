export interface DashboardShop {
  id: string | number;
  userId: string;
  userFullName: string;
  userUsername: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  status: "active" | "inactive" | "pending";
  createdAt: string;
  updatedAt?: string;
}

export interface ShopUserOption {
  id: string;
  fullName: string;
  username: string;
  email?: string;
  phone?: string;
  role?: string;
}
