// ⚠️ DEPRECATED: This file uses Netlify-specific @netlify/neon package
// For Vercel production, use the Spring Boot Backend API instead
// See: https://premium-reklam-backend.onrender.com/api

// This file is kept for reference only and should not be imported in production code

export const neonDb = {
  // Initialize database
  init: async () => {
    console.warn("⚠️ neonDb is deprecated. Use backend API instead.");
  },

  // Users
  getUsers: async () => [],
  getUserById: async (id: number | string) => null,
  getUserByUsername: async (username: string) => null,
  createUser: async (userData: {
    fullName: string;
    username: string;
    phone?: string;
    email?: string;
    passwordHash?: string;
    role?: string;
  }) => null,
  updateUser: async (id: number | string, updates: any) => null,

  // Orders
  getOrders: async () => [],
  getOrdersByUserId: async (userId: number | string) => [],
  createOrder: async (orderData: {
    userId: number | string;
    status?: string;
    totalAmount?: number;
    finalTotal?: number;
  }) => null,
  updateOrderStatus: async (id: number | string, status: string) => null,

  // Stores
  getStores: async () => [],
  getStoreById: async (id: number | string) => null,
  createStore: async (storeData: {
    name: string;
    description?: string;
    ownerId?: number | string;
    logoUrl?: string;
  }) => null,

  // Products
  getProductsByStoreId: async (storeId: number | string) => [],
  createProduct: async (productData: {
    storeId: number | string;
    name: string;
    description?: string;
    price?: number;
    imageUrl?: string;
  }) => null,

  // Reviews
  getReviewsByStoreId: async (storeId: number | string) => [],
  createReview: async (reviewData: {
    storeId: number | string;
    userId: number | string;
    rating: number;
    comment: string;
  }) => null,

  // Statistics
  getStats: async () => ({ users: 0, orders: 0, stores: 0, revenue: 0 }),
};

export default neonDb;
