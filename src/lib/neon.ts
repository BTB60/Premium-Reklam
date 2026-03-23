import { neon } from "@neondatabase/serverless";

// 1. Database URL-i müxtəlif mühit dəyişənlərindən götürürük
function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL ||
              process.env.POSTGRES_URL ||
              process.env.premiumreklambaku_POSTGRES_URL ||
              process.env.premiumreklambaku_DATABASE_URL ||
              "";
  return url;
}

// 2. Client-in yalnız ehtiyac olduqda yaradılması (Lazy initialization)
let sqlInstance: ReturnType<typeof neon> | null = null;

export function getSql() {
  if (!sqlInstance) {
    const dbUrl = getDatabaseUrl();
    if (!dbUrl) {
      throw new Error("DATABASE_URL is not configured in Environment Variables");
    }
    sqlInstance = neon(dbUrl);
  }
  return sqlInstance;
}

// 3. Database Cədvəllərinin Yaradılması (UUID Uyğunluğu ilə)
export async function initDB() {
  try {
    const sql = getSql();

    // UUID yaratmaq üçün PostgreSQL extension-nı aktiv edirik
    await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

    // USERS Cədvəli (Backend-dəki Java kodu ilə tam eyni ID tipi)
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

    // ORDERS Cədvəli
    await sql`
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'PENDING',
        total_price DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // 4. Admin istifadəçisini yoxlayıb yoxdursa əlavə edirik
    const adminCheck = await sql`SELECT id FROM users WHERE username = 'admin' LIMIT 1`;
    
    if (adminCheck.length === 0) {
      await sql`
        INSERT INTO users (full_name, username, phone, email, password_hash, role, level)
        VALUES ('Admin', 'admin', '+994507988177', 'premiumreklam@bk.ru', 'Nasir147286', 'ADMIN', 100)
      `;
      console.log("✅ Admin user created successfully.");
    }

    console.log("🚀 Database schema synchronized with UUID.");
  } catch (error) {
    console.error("❌ Database initialization error:", error);
    throw error;
  }
}

// Geriye uyğunluq üçün sql obyekti (Proxy)
export const sql = new Proxy({} as ReturnType<typeof neon>, {
  get: (target, prop) => {
    const instance = getSql();
    return (instance as any)[prop];
  },
});
