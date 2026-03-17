// API Client for Spring Boot Backend
// Backend runs on localhost:8081

const API_BASE = process.env.NODE_ENV === "production"
  ? "/api"  // Production: same domain
  : "http://localhost:8081/api";  // Development: Spring Boot

export const api = {
  // Auth
  async login(username: string, password: string) {
    const response = await fetch(`${API_BASE}/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data.user;
  },

  async register(userData: {
    fullName: string;
    username: string;
    phone?: string;
    password: string;
  }) {
    const response = await fetch(`${API_BASE}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data.user;
  },

  // Users
  async getUsers() {
    const response = await fetch(`${API_BASE}/users`);
    const data = await response.json();
    return data.users;
  },

  // Orders
  async getOrders(userId?: string) {
    const url = userId ? `${API_BASE}/orders?userId=${userId}` : `${API_BASE}/orders`;
    const response = await fetch(url);
    const data = await response.json();
    return data.orders;
  },

  async createOrder(orderData: any) {
    const response = await fetch(`${API_BASE}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data.order;
  },

  async updateOrderStatus(id: string, status: string) {
    const response = await fetch(`${API_BASE}/orders`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data.order;
  },
};

export default api;
