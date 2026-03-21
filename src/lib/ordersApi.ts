// Orders API - uses Spring Boot Backend

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

const API_BASE = 'https://backandpremiumreklam.onrender.com/api/orders';

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
  
  const text = await response.text();
  if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
    return JSON.parse(text);
  }
  console.warn("Non-JSON response:", text.substring(0, 200));
  return {};
}

export const ordersApi = {
  // Get all orders (for admin)
  async getAll(): Promise<Order[]> {
    const response = await fetch(`${API_BASE}`);
    const data = await parseResponse(response);
    return data.orders || [];
  },

  // Get orders for specific user
  async getByUserId(userId: string | number): Promise<Order[]> {
    const response = await fetch(`${API_BASE}?userId=${userId}`);
    const data = await parseResponse(response);
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
    const data = await parseResponse(response);
    return data.order;
  },

  // Update order status
  async updateStatus(orderId: number, status: string): Promise<Order> {
    const response = await fetch(`${API_BASE}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status }),
    });
    const data = await parseResponse(response);
    return data.order;
  },
};

export default ordersApi;
