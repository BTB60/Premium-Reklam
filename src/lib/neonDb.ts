// Neon PostgreSQL Database Client
import { neon } from "@netlify/neon";

// Initialize Neon SQL client
// Uses NETLIFY_DATABASE_URL environment variable automatically
const sql = neon(process.env.NETLIFY_DATABASE_URL || "");

// Database schema setup
const setupSchema = async () => {
  try {
    // Users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        username VARCHAR(100) UNIQUE NOT NULL,
        phone VARCHAR(20),
        email VARCHAR(255),
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'DECORATOR',
        level INTEGER DEFAULT 1,
        total_orders INTEGER DEFAULT 0,
        bonus_points INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Orders table
    await sql`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        status VARCHAR(50) DEFAULT 'pending',
        total_amount DECIMAL(10,2),
        final_total DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Stores table
    await sql`
      CREATE TABLE IF NOT EXISTS stores (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        owner_id INTEGER REFERENCES users(id),
        logo_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Products table
    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        store_id INTEGER REFERENCES stores(id),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        image_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Reviews table
    await sql`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        store_id INTEGER REFERENCES stores(id),
        user_id INTEGER REFERENCES users(id),
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log("Database schema created successfully");
  } catch (error) {
    console.error("Error creating schema:", error);
  }
};

// Neon Database API
export const neonDb = {
  // Initialize database
  async init() {
    await setupSchema();
  },

  // Users
  async getUsers() {
    return await sql`SELECT * FROM users ORDER BY created_at DESC`;
  },

  async getUserById(id: number) {
    const [user] = await sql`SELECT * FROM users WHERE id = ${id}`;
    return user;
  },

  async getUserByUsername(username: string) {
    const [user] = await sql`SELECT * FROM users WHERE username = ${username}`;
    return user;
  },

  async createUser(userData: {
    fullName: string;
    username: string;
    phone?: string;
    email?: string;
    passwordHash: string;
    role?: string;
  }) {
    const [user] = await sql`
      INSERT INTO users (full_name, username, phone, email, password_hash, role)
      VALUES (${userData.fullName}, ${userData.username}, ${userData.phone}, ${userData.email}, ${userData.passwordHash}, ${userData.role || 'DECORATOR'})
      RETURNING *
    `;
    return user;
  },

  async updateUser(id: number, updates: Partial<{
    fullName: string;
    phone: string;
    email: string;
    level: number;
    totalOrders: number;
    bonusPoints: number;
  }>) {
    const [user] = await sql`
      UPDATE users 
      SET 
        full_name = COALESCE(${updates.fullName}, full_name),
        phone = COALESCE(${updates.phone}, phone),
        email = COALESCE(${updates.email}, email),
        level = COALESCE(${updates.level}, level),
        total_orders = COALESCE(${updates.totalOrders}, total_orders),
        bonus_points = COALESCE(${updates.bonusPoints}, bonus_points)
      WHERE id = ${id}
      RETURNING *
    `;
    return user;
  },

  // Orders
  async getOrders() {
    return await sql`SELECT * FROM orders ORDER BY created_at DESC`;
  },

  async getOrdersByUserId(userId: number) {
    return await sql`SELECT * FROM orders WHERE user_id = ${userId} ORDER BY created_at DESC`;
  },

  async createOrder(orderData: {
    userId: number;
    status?: string;
    totalAmount: number;
    finalTotal: number;
  }) {
    const [order] = await sql`
      INSERT INTO orders (user_id, status, total_amount, final_total)
      VALUES (${orderData.userId}, ${orderData.status || 'pending'}, ${orderData.totalAmount}, ${orderData.finalTotal})
      RETURNING *
    `;
    return order;
  },

  async updateOrderStatus(id: number, status: string) {
    const [order] = await sql`
      UPDATE orders SET status = ${status} WHERE id = ${id} RETURNING *
    `;
    return order;
  },

  // Stores
  async getStores() {
    return await sql`SELECT * FROM stores ORDER BY created_at DESC`;
  },

  async getStoreById(id: number) {
    const [store] = await sql`SELECT * FROM stores WHERE id = ${id}`;
    return store;
  },

  async createStore(storeData: {
    name: string;
    description?: string;
    ownerId: number;
    logoUrl?: string;
  }) {
    const [store] = await sql`
      INSERT INTO stores (name, description, owner_id, logo_url)
      VALUES (${storeData.name}, ${storeData.description}, ${storeData.ownerId}, ${storeData.logoUrl})
      RETURNING *
    `;
    return store;
  },

  // Products
  async getProductsByStoreId(storeId: number) {
    return await sql`SELECT * FROM products WHERE store_id = ${storeId} ORDER BY created_at DESC`;
  },

  async createProduct(productData: {
    storeId: number;
    name: string;
    description?: string;
    price: number;
    imageUrl?: string;
  }) {
    const [product] = await sql`
      INSERT INTO products (store_id, name, description, price, image_url)
      VALUES (${productData.storeId}, ${productData.name}, ${productData.description}, ${productData.price}, ${productData.imageUrl})
      RETURNING *
    `;
    return product;
  },

  // Reviews
  async getReviewsByStoreId(storeId: number) {
    return await sql`
      SELECT r.*, u.full_name as user_name 
      FROM reviews r 
      JOIN users u ON r.user_id = u.id 
      WHERE r.store_id = ${storeId} 
      ORDER BY r.created_at DESC
    `;
  },

  async createReview(reviewData: {
    storeId: number;
    userId: number;
    rating: number;
    comment: string;
  }) {
    const [review] = await sql`
      INSERT INTO reviews (store_id, user_id, rating, comment)
      VALUES (${reviewData.storeId}, ${reviewData.userId}, ${reviewData.rating}, ${reviewData.comment})
      RETURNING *
    `;
    return review;
  },

  // Statistics
  async getStats() {
    const [userCount] = await sql`SELECT COUNT(*) as count FROM users`;
    const [orderCount] = await sql`SELECT COUNT(*) as count FROM orders`;
    const [storeCount] = await sql`SELECT COUNT(*) as count FROM stores`;
    const [totalRevenue] = await sql`SELECT COALESCE(SUM(final_total), 0) as total FROM orders`;
    
    return {
      users: parseInt(userCount.count),
      orders: parseInt(orderCount.count),
      stores: parseInt(storeCount.count),
      revenue: parseFloat(totalRevenue.total),
    };
  },
};

export default neonDb;
