import { NextRequest, NextResponse } from "next/server";
import { createSqlClient, initUsersTable, ensureAdminUser } from "../_lib/db";

// POST - Login
export async function POST(request: NextRequest) {
  try {
    const sql = createSqlClient();
    await initUsersTable(sql);
    await ensureAdminUser(sql);
    
    const body = await request.json();
    const { username, password } = body;

    // Find user
    const result = await sql`
      SELECT id, full_name, username, phone, email, role, level, total_orders, bonus_points, created_at
      FROM users 
      WHERE username = ${username} AND password_hash = ${password}
    `;

    if (!result || result.length === 0) {
      return NextResponse.json(
        { error: "İstifadəçi adı və ya şifrə yanlışdır" },
        { status: 401 }
      );
    }

    return NextResponse.json({ user: result[0] });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Server xətası" },
      { status: 500 }
    );
  }
}
