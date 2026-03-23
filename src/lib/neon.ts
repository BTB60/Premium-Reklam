import { neon } from "@neondatabase/serverless";

/**
 * 1. Database URL-i müxtəlif mühit dəyişənlərindən götürürük.
 * Vercel və ya local mühitdə hansı adla qeyd olunubsa, onu tapacaq.
 */
function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL ||
              process.env.POSTGRES_URL ||
              process.env.premiumreklambaku_POSTGRES_URL ||
              process.env.premiumreklambaku_DATABASE_URL ||
              "";
  return url;
}

// Client-in yalnız ehtiyac olduqda yaradılması (Lazy initialization)
let sqlInstance: ReturnType<typeof neon> | null = null;

export function getSql() {
  if (!sqlInstance) {
    const dbUrl = getDatabaseUrl();
    if (!dbUrl) {
      throw new Error("Kritik Xəta: DATABASE_URL Mühit Dəyişənlərində (Environment Variables) tapılmadı!");
    }
    sqlInstance = neon(dbUrl);
  }
  return sqlInstance;
}

/**
 * 2. Database Strukturunun (Schema) Yaradılması
 * Bu funksiya UUID və cədvəllərin Java Backend-i ilə uyğunluğunu təmin edir.
 */
export async function initDB() {
  try {
    const dbSql = getSql();

    // UUID (Universally Unique Identifier) dəstəyini aktiv edirik
    await dbSql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

    // USERS Cədvəli
    await dbSql`
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
    await dbSql`
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
    // (any) əlavə edərək TypeScript-in length xətasını keçirik
    const adminCheck = await dbSql`SELECT id FROM users WHERE username = 'admin' LIMIT 1` as any;
    
    if (adminCheck && adminCheck.length === 0) {
      await dbSql`
        INSERT INTO users (full_name, username, phone, email, password_hash, role, level)
        VALUES ('Admin', 'admin', '+994507988177', 'premiumreklam@bk.ru', 'Nasir147286', 'ADMIN', 100)
      `;
      console.log("✅ Admin user created successfully.");
    }

    console.log("🚀 Verilənlər bazası strukturu (UUID ilə) sinxronizasiya olundu.");
  } catch (error) {
    console.error("❌ Verilənlər bazası başladılarkən xəta baş verdi:", error);
    throw error;
  }
}

/**
 * 4. Eksport edilən 'sql' obyekti. 
 * Digər fayllarda birbaşa 'sql`SELECT...` ' kimi istifadə etmək üçün Proxy nizamlaması.
 */
export const sql = ((...args: any[]) => {
  const instance = getSql();
  return (instance as any)(...args);
}) as ReturnType<typeof neon>;
