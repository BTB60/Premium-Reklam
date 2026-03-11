// Hybrid Database - Uses Neon PostgreSQL when available, falls back to localStorage
import { neonDb } from "./neonDb";

const isServer = typeof window === "undefined";
const USE_NEON = process.env.NETLIFY_DATABASE_URL && !isServer;

// localStorage helpers
const localStorageDB = {
  getItem(key: string): any[] {
    if (isServer) return [];
    const data = localStorage.getItem(`decor_${key}`);
    return data ? JSON.parse(data) : [];
  },
  setItem(key: string, value: any[]): void {
    if (isServer) return;
    localStorage.setItem(`decor_${key}`, JSON.stringify(value));
  },
};

// Hybrid Database API
export const db = {
  // Users
  async getUsers() {
    if (USE_NEON) {
      try {
        const users = await neonDb.getUsers();
        // Sync to localStorage
        localStorageDB.setItem("users", users);
        return users;
      } catch (error) {
        console.warn("Neon DB failed, using localStorage:", error);
        return localStorageDB.getItem("users");
      }
    }
    return localStorageDB.getItem("users");
  },

  async getUserById(id: number | string) {
    if (USE_NEON) {
      try {
        const user = await neonDb.getUserById(Number(id));
        return user;
      } catch (error) {
        console.warn("Neon DB failed, using localStorage:", error);
      }
    }
    const users = localStorageDB.getItem("users");
    return users.find((u: any) => u.id === id);
  },

  async createUser(userData: any) {
    const newUser = {
      ...userData,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
    };

    if (USE_NEON) {
      try {
        const user = await neonDb.createUser(userData);
        // Also save to localStorage
        const users = localStorageDB.getItem("users");
        users.push(user || newUser);
        localStorageDB.setItem("users", users);
        return user || newUser;
      } catch (error) {
        console.warn("Neon DB failed, using localStorage:", error);
      }
    }

    // Fallback to localStorage
    const users = localStorageDB.getItem("users");
    users.push(newUser);
    localStorageDB.setItem("users", users);
    return newUser;
  },

  // Orders
  async getOrders() {
    if (USE_NEON) {
      try {
        const orders = await neonDb.getOrders();
        localStorageDB.setItem("orders", orders);
        return orders;
      } catch (error) {
        console.warn("Neon DB failed, using localStorage:", error);
        return localStorageDB.getItem("orders");
      }
    }
    return localStorageDB.getItem("orders");
  },

  async getOrdersByUserId(userId: number | string) {
    if (USE_NEON) {
      try {
        const orders = await neonDb.getOrdersByUserId(Number(userId));
        return orders;
      } catch (error) {
        console.warn("Neon DB failed, using localStorage:", error);
      }
    }
    const orders = localStorageDB.getItem("orders");
    return orders.filter((o: any) => o.userId === userId || o.user_id === userId);
  },

  async createOrder(orderData: any) {
    const newOrder = {
      ...orderData,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
    };

    if (USE_NEON) {
      try {
        const order = await neonDb.createOrder(orderData);
        const orders = localStorageDB.getItem("orders");
        orders.push(order || newOrder);
        localStorageDB.setItem("orders", orders);
        return order || newOrder;
      } catch (error) {
        console.warn("Neon DB failed, using localStorage:", error);
      }
    }

    const orders = localStorageDB.getItem("orders");
    orders.push(newOrder);
    localStorageDB.setItem("orders", orders);
    return newOrder;
  },

  // Stores
  async getStores() {
    if (USE_NEON) {
      try {
        const stores = await neonDb.getStores();
        localStorageDB.setItem("stores", stores);
        return stores;
      } catch (error) {
        console.warn("Neon DB failed, using localStorage:", error);
        return localStorageDB.getItem("stores");
      }
    }
    return localStorageDB.getItem("stores");
  },

  async getStoreById(id: number | string) {
    if (USE_NEON) {
      try {
        const store = await neonDb.getStoreById(Number(id));
        return store;
      } catch (error) {
        console.warn("Neon DB failed, using localStorage:", error);
      }
    }
    const stores = localStorageDB.getItem("stores");
    return stores.find((s: any) => s.id === id);
  },

  // Stats
  async getStats() {
    if (USE_NEON) {
      try {
        return await neonDb.getStats();
      } catch (error) {
        console.warn("Neon DB failed, calculating from localStorage:", error);
      }
    }
    const users = localStorageDB.getItem("users");
    const orders = localStorageDB.getItem("orders");
    const stores = localStorageDB.getItem("stores");
    return {
      users: users.length,
      orders: orders.length,
      stores: stores.length,
      revenue: orders.reduce((sum: number, o: any) => sum + (o.finalTotal || 0), 0),
    };
  },

  // Sync all data from Neon to localStorage
  async syncFromNeon() {
    if (!USE_NEON) return;
    try {
      const [users, orders, stores] = await Promise.all([
        neonDb.getUsers(),
        neonDb.getOrders(),
        neonDb.getStores(),
      ]);
      localStorageDB.setItem("users", users);
      localStorageDB.setItem("orders", orders);
      localStorageDB.setItem("stores", stores);
      console.log("Synced from Neon to localStorage");
    } catch (error) {
      console.error("Sync failed:", error);
    }
  },
};

export default db;
