// ⚠️ DEPRECATED: This file uses Netlify-specific @netlify/neon package
// For Vercel production, use the Spring Boot Backend API instead
// See: https://premium-reklam-backend.onrender.com/api

// This file is kept for reference only and should not be imported in production code

export const neonDb = {
  init: async () => {
    console.warn("⚠️ neonDb is deprecated. Use backend API instead.");
  },
  getUsers: async () => [],
  getUserById: async (id: number) => null,
  getUserByUsername: async (username: string) => null,
  createUser: async () => null,
  updateUser: async () => null,
  getOrders: async () => [],
  getOrdersByUserId: async () => [],
  createOrder: async () => null,
  updateOrderStatus: async () => null,
  getStores: async () => [],
  getStoreById: async () => null,
  createStore: async () => null,
  getProductsByStoreId: async () => [],
  createProduct: async () => null,
  getReviewsByStoreId: async () => [],
  createReview: async () => null,
  getStats: async () => ({ users: 0, orders: 0, stores: 0, revenue: 0 }),
};

export default neonDb;
