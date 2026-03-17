// Orders API - uses Spring Boot Backend
// Backend runs on localhost:8081

export interface Order {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  total_price: number;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_username?: string;
}

const API_BASE = process.env.NODE_ENV === "production"
  ? "/api/orders"
  : "http://localhost:8081/api/orders";

export const ordersApi = {
  // Get all orders (for admin)
  async getAll(): Promise<Order[]> {
    const response = await fetch(`${API_BASE}`);
    const data = await response.json();
    return data.orders || [];
  },

  // Get orders for specific user
  async getByUserId(userId: string | number): Promise<Order[]> {
    const response = await fetch(`${API_BASE}?userId=${userId}`);
    const data = await response.json();
    return data.orders || [];
  },

  // Create new order
  async create(orderData: {
    userId: number;
    title: string;
    description?: string;
    status?: string;
    totalPrice?: number;
  }): Promise<Order> {
    const response = await fetch(`${API_BASE}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Sifariş yaratma xətası");
    }

    return data.order;
  },

  // Update order status
  async updateStatus(orderId: number, status: string): Promise<Order> {
    const response = await fetch(`${API_BASE}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Status yeniləmə xətası");
    }

    return data.order;
  },
};

export default ordersApi;
