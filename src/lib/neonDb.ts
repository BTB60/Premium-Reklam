// ⚠️ DEPRECATED: This file uses Netlify-specific @netlify/neon package
// For Vercel production, use the Spring Boot Backend API instead
// See: https://premium-reklam-backend.onrender.com/api

// This file is kept for reference only and should not be imported in production code

type CreateUserInput = {
  fullName: string;
  username: string;
  phone?: string;
  email?: string;
  passwordHash?: string;
  role?: string;
};

type CreateOrderInput = {
  userId: number | string;
  status?: string;
  totalAmount?: number;
  finalTotal?: number;
};

type CreateStoreInput = {
  name: string;
  description?: string;
  ownerId?: number | string;
  logoUrl?: string;
};

type CreateProductInput = {
  storeId: number | string;
  name: string;
  description?: string;
  price?: number;
  imageUrl?: string;
};

type CreateReviewInput = {
  storeId: number | string;
  userId: number | string;
  rating: number;
  comment: string;
};

type NeonDb = {
  init: () => Promise<void>;

  getUsers: () => Promise<any[]>;
  getUserById: (id: number | string) => Promise<any | null>;
  getUserByUsername: (username: string) => Promise<any | null>;
  createUser: (userData: CreateUserInput) => Promise<any | null>;
  updateUser: (id: number | string, updates: any) => Promise<any | null>;

  getOrders: () => Promise<any[]>;
  getOrdersByUserId: (userId: number | string) => Promise<any[]>;
  createOrder: (orderData: CreateOrderInput) => Promise<any | null>;
  updateOrderStatus: (id: number | string, status: string) => Promise<any | null>;

  getStores: () => Promise<any[]>;
  getStoreById: (id: number | string) => Promise<any | null>;
  createStore: (storeData: CreateStoreInput) => Promise<any | null>;

  getProductsByStoreId: (storeId: number | string) => Promise<any[]>;
  createProduct: (productData: CreateProductInput) => Promise<any | null>;

  getReviewsByStoreId: (storeId: number | string) => Promise<any[]>;
  createReview: (reviewData: CreateReviewInput) => Promise<any | null>;

  getStats: () => Promise<{ users: number; orders: number; stores: number; revenue: number }>;
};

export const neonDb: NeonDb = {
  init: async () => {
    console.warn("⚠️ neonDb is deprecated. Use backend API instead.");
  },

  getUsers: async () => [],
  getUserById: async (_id) => null,
  getUserByUsername: async (_username) => null,
  createUser: async (_userData) => null,
  updateUser: async (_id, _updates) => null,

  getOrders: async () => [],
  getOrdersByUserId: async (_userId) => [],
  createOrder: async (_orderData) => null,
  updateOrderStatus: async (_id, _status) => null,

  getStores: async () => [],
  getStoreById: async (_id) => null,
  createStore: async (_storeData) => null,

  getProductsByStoreId: async (_storeId) => [],
  createProduct: async (_productData) => null,

  getReviewsByStoreId: async (_storeId) => [],
  createReview: async (_reviewData) => null,

  getStats: async () => ({ users: 0, orders: 0, stores: 0, revenue: 0 }),
};

export default neonDb;
