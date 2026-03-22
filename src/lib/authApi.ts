// API Base URL - from environment variable or fallback to localhost for development
const BASE_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : 'https://premium-reklam-backend.onrender.com/api';

// Map backend role to frontend role
function mapRole(role: string): string {
  const roleMap: Record<string, string> = {
    'ADMIN': 'ADMIN',
    'DECORCU': 'DECORATOR',
    'DECORATOR': 'DECORATOR',
    'VENDOR': 'VENDOR',
  };
  return roleMap[role] || role;
}

// Map frontend status to backend status (lowercase for backend enum)
function mapStatus(status: string): string {
  const statusMap: Record<string, string> = {
    // Backend enum values (lowercase as sent to backend)
    'pending': 'pending',
    'approved': 'approved',
    'confirmed': 'confirmed',
    'design': 'design',
    'production': 'production',
    'printing': 'printing',
    'ready': 'ready',
    'delivering': 'delivering',
    'completed': 'completed',
    'cancelled': 'cancelled',
    // Backend enum names (UPPERCASE) - convert to lowercase
    'PENDING': 'pending',
    'APPROVED': 'approved',
    'CONFIRMED': 'confirmed',
    'DESIGN': 'design',
    'IN_PROGRESS': 'production',
    'PRINTING': 'printing',
    'READY': 'ready',
    'DELIVERING': 'delivering',
    'COMPLETED': 'completed',
    'CANCELLED': 'cancelled',
    // Azərbaycanca statuslar
    'gözləyir': 'pending',
    'tesdiqləndi': 'approved',
    'təsdiqləndi': 'confirmed',
    'dizayn': 'design',
    'çap': 'printing',
    'cap': 'printing',
    'istehsalat': 'production',
    'istehsal': 'production',
    'hazirlanir': 'production',
    'hazir': 'ready',
    'hazır': 'ready',
    'çatdırılma': 'delivering',
    'catdirilma': 'delivering',
    'tamamlandı': 'completed',
    'tamamlandi': 'completed',
    'ləğv edildi': 'cancelled',
    'legv edildi': 'cancelled',
  };
  return statusMap[status] || status.toLowerCase();
}

export interface UserData {
  token: string;
  userId: number;
  username: string;
  fullName: string;
  role: string;
  email?: string;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  description: string;
  unit: string;
  purchasePrice: number;
  salePrice: number;
  stockQuantity: number;
  minStockLevel: number;
  width?: number;
  height?: number;
  status: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  customerWhatsapp?: string;
  customerAddress?: string;
  userId?: number;
  userFullName?: string;
  userUsername?: string;
  status: string;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: 'PENDING' | 'PARTIAL' | 'PAID' | 'CANCELLED';
  paymentMethod: string;
  isCredit: boolean;
  note?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: number;
  productId?: number;
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

export interface UserPrice {
  id: number;
  userId: number;
  productId: number;
  customPrice: number;
  discountPercent: number;
  isActive: boolean;
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  const user = getCurrentUser();
  return user?.token || null;
}

function getCurrentUser(): UserData | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem("decor_current_user");
  return stored ? JSON.parse(stored) : null;
}

// Local API fetch for Vercel API Routes
async function fetchLocalApi(endpoint: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const res = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = res.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");

  if (!res.ok) {
    let errorMessage = "Xəta baş verdi";
    if (isJson) {
      try {
        const error = await res.json();
        errorMessage = error.message || error.error || error.title || `Xəta (${res.status})`;
      } catch {
        errorMessage = `Server xətası (${res.status}): ${res.statusText}`;
      }
    }
    throw new Error(errorMessage);
  }

  if (isJson) {
    return res.json();
  }
  return {};
}

async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Check content type first
    const contentType = res.headers.get("content-type");
    const isJson = contentType && contentType.includes("application/json");

    if (!res.ok) {
      let errorMessage = "Xəta baş verdi";
      if (isJson) {
        try {
          const error = await res.json();
          errorMessage = error.message || error.error || error.title || `Xəta (${res.status})`;
        } catch {
          errorMessage = `Server xətası (${res.status}): ${res.statusText}`;
        }
      } else {
        const text = await res.text();
        console.error("Non-JSON error response:", text);
        errorMessage = `Server xətası (${res.status}): ${res.statusText}`;
      }
      throw new Error(errorMessage);
    }

    if (isJson) {
      return res.json();
    } else {
      // If not JSON, try to parse anyway, otherwise return empty object
      try {
        const text = await res.text();
        if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
          return JSON.parse(text);
        }
        console.warn("Non-JSON response:", text.substring(0, 200));
        return {};
      } catch {
        return {};
      }
    }
  } catch (error: any) {
    if (error.message === "Failed to fetch" || error.message.includes("fetch") || error.message.includes("NetworkError")) {
      throw new Error("Server bağlantısı yoxdur. Backend işləyirmi?");
    }
    throw error;
  }
}

export const authApi = {
  async register(userData: any) {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.error || "Xəta baş verdi");
    return data;
  },

  async login(username: string, password: string): Promise<UserData> {
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const text = await res.text();
      
      // Check if response is HTML (error page) instead of JSON
      if (text.startsWith("<")) {
        throw new Error("Server bağlantısı yoxdur. Backend xidmətini işə salın.");
      }
      
      const data = JSON.parse(text);
      if (!res.ok) {
        throw new Error(data.message || data.error || "Giriş uğursuz oldu");
      }
      
      return {
        ...data,
        role: mapRole(data.role),
      };
    } catch (error: any) {
      if (error.message.includes("Server bağlantısı") || error.message.includes("fetch") || error.message.includes("Failed to fetch")) {
        throw new Error("Server bağlantısı yoxdur. Backend işləyirmi? " + BASE_URL + " ünvanını yoxlayın.");
      }
      throw new Error(error.message || "Giriş uğursuz oldu");
    }
  },

  async getAllUsers(): Promise<any[]> {
    try {
      // Use local API (Neon DB) instead of external backend
      const data = await fetchLocalApi("/api/users");
      return (data.users || []).map((user: any) => ({
        ...user,
        role: mapRole(user.role),
        fullName: user.fullName || user.full_name || user.username,
        id: user.id || user.userId,
      }));
    } catch {
      return [];
    }
  },

  getCurrentUser,

  saveCurrentUser(user: UserData) {
    if (typeof window !== "undefined") {
      localStorage.setItem("decor_current_user", JSON.stringify(user));
    }
  },

  logout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("decor_current_user");
    }
  },
};

export const productApi = {
  async getAll(): Promise<Product[]> {
    return fetchApi("/products");
  },

  async getById(id: number): Promise<Product> {
    return fetchApi(`/products/${id}`);
  },

  async getCategories(): Promise<string[]> {
    return fetchApi("/products/categories");
  },

  async create(product: Partial<Product>): Promise<Product> {
    return fetchApi("/products", {
      method: "POST",
      body: JSON.stringify(product),
    });
  },

  async update(id: number, product: Partial<Product>): Promise<Product> {
    return fetchApi(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(product),
    });
  },

  async delete(id: number): Promise<void> {
    return fetchApi(`/products/${id}`, {
      method: "DELETE",
    });
  },

  async getUserPrice(userId: number, productId: number): Promise<number> {
    return fetchApi(`/products/user-prices/${userId}/product/${productId}`);
  },

  async setUserPrice(userId: number, productId: number, customPrice: number, discountPercent?: number): Promise<UserPrice> {
    return fetchApi("/products/user-prices", {
      method: "POST",
      body: JSON.stringify({
        userId,
        productId,
        customPrice,
        discountPercent: discountPercent || 0,
      }),
    });
  },

  async getUserPrices(userId: number): Promise<UserPrice[]> {
    return fetchApi(`/products/user-prices/${userId}`);
  },

  async deleteUserPrice(userId: number, productId: number): Promise<void> {
    return fetchApi(`/products/user-prices/${userId}/product/${productId}`, {
      method: "DELETE",
    });
  },
};

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

export const orderApi = {
  async getAll(filters?: { userId?: string; status?: string; paymentStatus?: string; dateFrom?: string; dateTo?: string }): Promise<{ orders: Order[]; summary?: OrderSummary; total: number }> {
    const params = new URLSearchParams();
    if (filters?.userId) params.set('userId', filters.userId);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.paymentStatus) params.set('paymentStatus', filters.paymentStatus);
    if (filters?.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.set('dateTo', filters.dateTo);
    
    const queryString = params.toString();
    return fetchApi(`/orders${queryString ? '?' + queryString : ''}`);
  },

  async getMyOrders(): Promise<{ orders: Order[]; summary?: OrderSummary; total: number }> {
    const user = getCurrentUser();
    if (!user) return { orders: [], summary: undefined, total: 0 };
    return fetchApi(`/orders?userId=${user.userId}`);
  },

  async getMySummary(): Promise<OrderSummary> {
    const user = getCurrentUser();
    if (!user) {
      return {
        todayOrderCount: 0,
        todayOrderAmount: 0,
        monthOrderCount: 0,
        monthOrderAmount: 0,
        totalPaid: 0,
        totalDebt: 0,
        totalOrders: 0,
        totalAmount: 0,
      };
    }
    const data = await fetchApi(`/orders?userId=${user.userId}&summary=true`);
    return data.summary || {
      todayOrderCount: 0,
      todayOrderAmount: 0,
      monthOrderCount: 0,
      monthOrderAmount: 0,
      totalPaid: 0,
      totalDebt: 0,
      totalOrders: 0,
      totalAmount: 0,
    };
  },

  async getById(id: number): Promise<Order> {
    const data = await fetchApi(`/orders?limit=1000`);
    const order = data.orders?.find((o: any) => o.id === id);
    return order || null;
  },

  async create(orderData: any): Promise<Order> {
    const user = getCurrentUser();
    const data = await fetchApi("/orders", {
      method: "POST",
      body: JSON.stringify({
        ...orderData,
        userId: user?.userId || orderData.userId,
      }),
    });
    return data.order;
  },

  async updateStatus(id: number, status: string): Promise<Order> {
    return fetchApi(`/orders?orderId=${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        type: 'status',
        orderId: id,
        status: mapStatus(status),
      }),
    });
  },

  async updatePayment(id: number, paidAmount: number, paymentMethod?: string, note?: string): Promise<Order> {
    return fetchApi("/orders", {
      method: "PATCH",
      body: JSON.stringify({
        type: 'payment',
        orderId: id,
        paidAmount,
        paymentMethod: paymentMethod || 'CASH',
        note,
      }),
    });
  },

  async addPayment(id: number, amount: number, paymentMethod?: string, note?: string): Promise<Order> {
    const order = await this.getById(id);
    const newPaidAmount = (order?.paidAmount || 0) + amount;
    return this.updatePayment(id, newPaidAmount, paymentMethod, note);
  },

  async delete(id: number): Promise<void> {
    return fetchApi(`/orders?id=${id}`, {
      method: "DELETE",
    });
  },

  // Admin payment via Vercel API Route
  async adminPayment(orderId: number, amount: number, paymentMethod?: string, note?: string): Promise<any> {
    return fetchLocalApi(`/api/admin/payment?orderId=${orderId}`, {
      method: "PATCH",
      body: JSON.stringify({
        amount,
        paymentMethod: paymentMethod || 'CASH',
        note,
      }),
    });
  },

  // Get all orders from Vercel API (Neon DB)
  async getOrdersFromNeon(filters?: { userId?: string; status?: string; paymentStatus?: string; dateFrom?: string; dateTo?: string }): Promise<{ orders: any[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.userId) params.set('userId', filters.userId);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.paymentStatus) params.set('paymentStatus', filters.paymentStatus);
    if (filters?.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.set('dateTo', filters.dateTo);
    
    const queryString = params.toString();
    return fetchLocalApi(`/api/orders${queryString ? '?' + queryString : ''}`);
  },
};

export default authApi;
