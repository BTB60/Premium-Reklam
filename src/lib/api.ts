// API Client for Spring Boot Backend
// Note: This file is kept for backward compatibility. Use authApi.ts for all API calls.

import { getRestApiBase } from "./restApiBase";

const apiBase = () => getRestApiBase();

// Helper function to check if response is JSON
async function parseResponse(response: Response) {
  const contentType = response.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");
  
  if (!response.ok) {
    let errorMessage = "Xəta baş verdi";
    if (isJson) {
      try {
        const error = await response.json();
        errorMessage = error.message || error.error || error.title || `Xəta (${response.status})`;
      } catch {
        errorMessage = `Server xətası (${response.status}): ${response.statusText}`;
      }
    } else {
      const text = await response.text();
      console.error("Non-JSON error response:", text.substring(0, 500));
      errorMessage = `Server xətası (${response.status}): ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }
  
  if (isJson) {
    return response.json();
  }
  
  // Try to parse anyway
  const text = await response.text();
  if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
    return JSON.parse(text);
  }
  console.warn("Non-JSON response:", text.substring(0, 200));
  return {};
}

export const api = {
  // Auth
  async login(username: string, password: string) {
    const response = await fetch(`${apiBase()}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    return parseResponse(response);
  },

  async register(userData: {
    fullName: string;
    username: string;
    phone?: string;
    password: string;
    accountType?: string;
    email?: string;
  }) {
    const response = await fetch(`${apiBase()}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    return parseResponse(response);
  },

  // Users
  async getUsers() {
    const response = await fetch(`${apiBase()}/users`);
    const data = await parseResponse(response);
    return data || [];
  },

  // Orders
  async getOrders(userId?: string) {
    const url = userId ? `${apiBase()}/orders?userId=${userId}` : `${apiBase()}/orders`;
    const response = await fetch(url);
    const data = await parseResponse(response);
    return data || [];
  },

  async createOrder(orderData: any) {
    const response = await fetch(`${apiBase()}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData),
    });
    return parseResponse(response);
  },

  async updateOrderStatus(id: string, status: string) {
    const response = await fetch(`${apiBase()}/orders/${id}/status?status=${status}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
    });
    return parseResponse(response);
  },
};

export default api;
