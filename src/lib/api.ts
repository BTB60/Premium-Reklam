// API Client for Spring Boot Backend

const API_BASE = 'https://backandpremiumreklam.onrender.com/api';

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
    const response = await fetch(`${API_BASE}/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    return parseResponse(response).then(data => data.user);
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
    return parseResponse(response).then(data => data.user);
  },

  // Users
  async getUsers() {
    const response = await fetch(`${API_BASE}/users`);
    const data = await parseResponse(response);
    return data.users || [];
  },

  // Orders
  async getOrders(userId?: string) {
    const url = userId ? `${API_BASE}/orders?userId=${userId}` : `${API_BASE}/orders`;
    const response = await fetch(url);
    const data = await parseResponse(response);
    return data.orders || [];
  },

  async createOrder(orderData: any) {
    const response = await fetch(`${API_BASE}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData),
    });
    return parseResponse(response).then(data => data.order);
  },

  async updateOrderStatus(id: string, status: string) {
    const response = await fetch(`${API_BASE}/orders`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    return parseResponse(response).then(data => data.order);
  },
};

export default api;
