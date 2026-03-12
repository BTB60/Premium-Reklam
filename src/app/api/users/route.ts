import { NextRequest, NextResponse } from "next/server";
import { db } from "../db";

// GET - Fetch all users (for admin panel)
export async function GET() {
  const users = db.users.map(({ password, ...user }) => user);
  return NextResponse.json({ users });
}

// POST - Create new user (registration)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Check if username exists
    const existingUser = db.users.find(u => u.username === body.username);
    if (existingUser) {
      return NextResponse.json(
        { error: "Bu istifadəçi adı artıq mövcuddur" },
        { status: 400 }
      );
    }

    // Create new user
    const newUser = db.addUser({
      fullName: body.fullName,
      username: body.username,
      phone: body.phone || "",
      email: body.email || "",
      password: body.password, // In production, hash this!
      role: body.role || "DECORATOR",
      level: 1,
      totalOrders: 0,
      totalSales: 0,
      monthlyStats: [],
      bonusPoints: 0,
      bonusTier: "bronze",
      referralCode: `REF${Date.now().toString().slice(-6)}`,
      referralCount: 0,
      isVendor: false,
      vendorBalance: 0,
      totalVendorSales: 0,
    });

    // Return user without password
    const { password, ...userWithoutPassword } = newUser;
    return NextResponse.json({ user: userWithoutPassword }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Server xətası" },
      { status: 500 }
    );
  }
}
