import { neon } from "@neondatabase/serverless";

// Environment variable names to check (in order of priority)
const DB_ENV_VARS = [
  'DATABASE_URL',
  'premiumreklambaku_DATABASE_URL',
  'premiumreklambaku_POSTGRES_URL',
  'POSTGRES_URL',
  'NEXT_PUBLIC_DATABASE_URL',
];

/**
 * Get database URL from environment variables
 */
export function getDatabaseUrl(): string {
  for (const envVar of DB_ENV_VARS) {
    const url = process.env[envVar];
    if (url) return url;
  }
  return '';
}

/**
 * Create a SQL client
 */
export function createSqlClient() {
  const dbUrl = getDatabaseUrl();
  if (!dbUrl) {
    throw new Error('Database URL not configured');
  }
  return neon(dbUrl);
}

/**
 * Initialize users table
 */
export async function initUsersTable(sql: any): Promise<void> {
  try {
    // Create users table
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

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`;
  } catch (error) {
    console.error("Users table init error:", error);
  }
}

/**
 * Ensure admin user exists with correct password
 */
export async function ensureAdminUser(sql: any): Promise<void> {
  try {
    const adminCheck = await sql`SELECT id FROM users WHERE username = 'admin' LIMIT 1`;
    
    if (!adminCheck || adminCheck.length === 0) {
      await sql`
        INSERT INTO users (full_name, username, phone, email, password_hash, role, level)
        VALUES ('Admin', 'admin', '+994507988177', 'premiumreklam@bk.ru', 'Nasir147286', 'ADMIN', 100)
      `;
    } else {
      await sql`UPDATE users SET password_hash = 'Nasir147286' WHERE username = 'admin'`;
    }
  } catch (error) {
    console.error("Admin user setup error:", error);
  }
}

/**
 * Initialize orders tables (orders, order_items, payments)
 */
export async function initOrdersTables(sql: any): Promise<void> {
  try {
    // Create orders table
    await sql`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        order_number VARCHAR(50) UNIQUE,
        customer_name VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(50),
        customer_whatsapp VARCHAR(50),
        customer_address TEXT,
        status VARCHAR(50) DEFAULT 'PENDING',
        subtotal DECIMAL(12,2) DEFAULT 0,
        discount_percent DECIMAL(5,2) DEFAULT 0,
        discount_amount DECIMAL(12,2) DEFAULT 0,
        total_amount DECIMAL(12,2) DEFAULT 0,
        paid_amount DECIMAL(12,2) DEFAULT 0,
        remaining_amount DECIMAL(12,2) DEFAULT 0,
        payment_status VARCHAR(50) DEFAULT 'PENDING',
        payment_method VARCHAR(50) DEFAULT 'CASH',
        is_credit BOOLEAN DEFAULT false,
        note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create order_items table
    await sql`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER,
        product_name VARCHAR(255) NOT NULL,
        unit VARCHAR(50) DEFAULT 'm²',
        quantity INTEGER DEFAULT 1,
        width DECIMAL(10,2) DEFAULT 0,
        height DECIMAL(10,2) DEFAULT 0,
        area DECIMAL(12,2) DEFAULT 0,
        unit_price DECIMAL(12,2) DEFAULT 0,
        line_total DECIMAL(12,2) DEFAULT 0,
        note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create payments table
    await sql`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        amount DECIMAL(12,2) NOT NULL,
        payment_method VARCHAR(50) DEFAULT 'CASH',
        note TEXT,
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id)`;

    console.log("Database tables initialized successfully");
  } catch (error) {
    console.error("Orders tables init error:", error);
  }
}

/**
 * Add missing columns to orders table (for PostgreSQL < 16)
 */
export async function migrateOrdersTable(sql: any): Promise<void> {
  const columns = [
    { name: 'payment_status', type: 'VARCHAR(50) DEFAULT' + "'PENDING'" },
    { name: 'payment_method', type: 'VARCHAR(50) DEFAULT' + "'CASH'" },
    { name: 'is_credit', type: 'BOOLEAN DEFAULT false' },
    { name: 'remaining_amount', type: 'DECIMAL(12,2) DEFAULT 0' },
  ];

  for (const col of columns) {
    try {
      await sql`ALTER TABLE orders ADD COLUMN ${sql.unsafe(col.name)} ${sql.unsafe(col.type)}`;
    } catch (e: any) {
      // Column already exists - ignore
      if (!e.message?.includes('already exists')) {
        console.warn(`Migration warning for ${col.name}:`, e.message);
      }
    }
  }
}
