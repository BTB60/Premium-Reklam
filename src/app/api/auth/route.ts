import { NextRequest, NextResponse } from "next/server";
import { pool, initMySQL } from "@/lib/mysql";

// POST - Login
export async function POST(request: NextRequest) {
  try {
    await initMySQL();
    const body = await request.json();
    const { username, password } = body;

    // Find user in MySQL database
    const [rows] = await pool.execute(
      `SELECT id, full_name, username, phone, email, role, level, total_orders, bonus_points, created_at 
       FROM users 
       WHERE username = ? AND password_hash = ?`,
      [username, password]
    );

    const users = rows as any[];

    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: "İstifadəçi adı və ya şifrə yanlışdır" },
        { status: 401 }
      );
    }

    return NextResponse.json({ user: users[0] });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Server xətası" },
      { status: 500 }
    );
  }
}
