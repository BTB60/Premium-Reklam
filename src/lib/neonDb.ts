// ⚠️ DISABLED: This file is completely disabled for Vercel deployment
// All database operations should go through the backend API
// See: https://premium-reklam-backend.onrender.com/api

// This file is kept as placeholder and throws if accidentally imported

export const neonDb = {
  init: async () => { throw new Error("neonDb is DISABLED - use backend API"); },
  getUsers: async () => { throw new Error("neonDb is DISABLED - use backend API"); },
  getUserById: async () => { throw new Error("neonDb is DISABLED - use backend API"); },
  getUserByUsername: async () => { throw new Error("neonDb is DISABLED - use backend API"); },
  createUser: async () => { throw new Error("neonDb is DISABLED - use backend API"); },
  updateUser: async () => { throw new Error("neonDb is DISABLED - use backend API"); },
  getOrders: async () => { throw new Error("neonDb is DISABLED - use backend API"); },
  getOrdersByUserId: async () => { throw new Error("neonDb is DISABLED - use backend API"); },
  createOrder: async () => { throw new Error("neonDb is DISABLED - use backend API"); },
  updateOrderStatus: async () => { throw new Error("neonDb is DISABLED - use backend API"); },
  getStores: async () => { throw new Error("neonDb is DISABLED - use backend API"); },
  getStoreById: async () => { throw new Error("neonDb is DISABLED - use backend API"); },
  createStore: async () => { throw new Error("neonDb is DISABLED - use backend API"); },
  getProductsByStoreId: async () => { throw new Error("neonDb is DISABLED - use backend API"); },
  createProduct: async () => { throw new Error("neonDb is DISABLED - use backend API"); },
  getReviewsByStoreId: async () => { throw new Error("neonDb is DISABLED - use backend API"); },
  createReview: async () => { throw new Error("neonDb is DISABLED - use backend API"); },
  getStats: async () => { throw new Error("neonDb is DISABLED - use backend API"); },
};

export default neonDb;
