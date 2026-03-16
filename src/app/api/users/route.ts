import { NextRequest, NextResponse } from "next/server";
import { pool, initMySQL } from "@/lib/mysql";

// GET - Fetch all users (for admin panel)
export async function GET() {
  try {
    await initMySQL();
    const [rows] = await pool.execute(
      `SELECT id, full_name, username, phone, email, role, level, total_orders, bonus_points, created_at 
       FROM users 
       ORDER BY created_at DESC`
    );
    return NextResponse.json({ users: rows });
  } catch (error) {
    console.error("GET users error:", error);
    return NextResponse.json({ users: [] }, { status: 500 });
  }
}

// POST - Create new user (registration)
export async function POST(request: NextRequest) {
  try {
    await initMySQL();
    const body = await request.json();

    // Check if username exists
    const [existingRows] = await pool.execute(
      'SELECT * FROM users WHERE username = ?',
      [body.username]
    );

    const existing = existingRows as any[];
    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Bu istifadəçi adı artıq mövcuddur" },
        { status: 400 }
      );
    }

    // Create new user
    const [result] = await pool.execute(
      `INSERT INTO users (full_name, username, phone, password_hash, role, level) 
       VALUES (?, ?, ?, ?, 'DECORATOR', 1)`,
      [body.fullName, body.username, body.phone || '', body.password]
    );

    // Get the created user
    const [newUserRows] = await pool.execute(
      `SELECT id, full_name, username, phone, email, role, level, total_orders, bonus_points, created_at 
       FROM users 
       WHERE id = ?`,
      [(result as any).insertId]
    );

    const newUsers = newUserRows as any[];
    if (!newUsers || newUsers.length === 0) {
      throw new Error("Failed to create user");
    }

    return NextResponse.json({ user: newUsers[0] }, { status: 201 });
  } catch (error) {
    console.error("POST user error:", error);
    return NextResponse.json(
      { error: "Server xətası" },
      { status: 500 }
    );
  }
}
