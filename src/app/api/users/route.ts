import { NextRequest, NextResponse } from "next/server";
import { createSqlClient, initUsersTable, ensureAdminUser } from "../_lib/db";

// GET - Fetch all users
export async function GET() {
  try {
    const sql = createSqlClient();
    await initUsersTable(sql);
    await ensureAdminUser(sql);

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
    const sql = createSqlClient();
    await initUsersTable(sql);

    const body = await request.json();

    // Check if username exists
    const existing = await sql`SELECT id FROM users WHERE username = ${body.username} LIMIT 1`;
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
