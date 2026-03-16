import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

// Get database URL from environment
function getDatabaseUrl(): string {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.premiumreklambaku_POSTGRES_URL ||
    process.env.premiumreklambaku_DATABASE_URL ||
    ""
  );
}

// Initialize database
async function initDB(sql: any) {
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

    // Check if admin exists
    const adminCheck = await sql`SELECT * FROM users WHERE username = 'admin'`;
    if (!adminCheck || adminCheck.length === 0) {
      // Create admin with new password
      await sql`
        INSERT INTO users (full_name, username, phone, email, password_hash, role, level)
        VALUES ('Admin', 'admin', '+994507988177', 'premiumreklam@bk.ru', 'Nasir147286', 'ADMIN', 100)
      `;
    } else {
      // Update existing admin password
      await sql`
        UPDATE users SET password_hash = 'Nasir147286' WHERE username = 'admin'
      `;
    }
  } catch (error) {
    console.error("DB init error:", error);
  }
}

// GET - Fetch all users
export async function GET() {
  try {
    const dbUrl = getDatabaseUrl();
    if (!dbUrl) {
      return NextResponse.json({ users: [] }, { status: 500 });
    }

    const sql = neon(dbUrl);
    await initDB(sql);

    const users = await sql`
      SELECT id, full_name, username, phone, email, role, level, total_orders, bonus_points, created_at
      FROM users ORDER BY created_at DESC
    `;

    return NextResponse.json({ users });
  } catch (error) {
    console.error("GET users error:", error);
    return NextResponse.json({ users: [] }, { status: 500 });
  }
}

// POST - Create new user
export async function POST(request: NextRequest) {
  try {
    const dbUrl = getDatabaseUrl();
    if (!dbUrl) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    const sql = neon(dbUrl);
    await initDB(sql);

    const body = await request.json();

    // Check if username exists
    const existing = await sql`SELECT * FROM users WHERE username = ${body.username}`;
    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: "Bu istifadəçi adı artıq mövcuddur" },
        { status: 400 }
      );
    }

    // Create new user
    const result = await sql`
      INSERT INTO users (full_name, username, phone, password_hash, role, level)
      VALUES (${body.fullName}, ${body.username}, ${body.phone || ''}, ${body.password}, 'DECORATOR', 1)
      RETURNING id, full_name, username, phone, email, role, level, total_orders, bonus_points, created_at
    `;

    return NextResponse.json({ user: result[0] }, { status: 201 });
  } catch (error) {
    console.error("POST user error:", error);
    return NextResponse.json(
      { error: "Server xətası" },
      { status: 500 }
    );
  }
}
