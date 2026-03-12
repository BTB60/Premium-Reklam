import { NextRequest, NextResponse } from "next/server";
import { db } from "../db";

// GET - Fetch all orders (for admin) or by userId
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  let orders = db.orders;
  if (userId) {
    orders = orders.filter(o => o.userId === userId);
  }

  return NextResponse.json({ orders });
}

// POST - Create new order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const newOrder = db.addOrder({
      userId: body.userId,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      productType: body.productType,
      width: body.width,
      height: body.height,
      quantity: body.quantity,
      notes: body.notes || "",
      status: "pending",
      totalAmount: body.totalAmount,
      discount: body.discount || 0,
      finalTotal: body.finalTotal,
      useDebt: body.useDebt || false,
    });

    // Update user's total orders
    db.updateUser(body.userId, { 
      totalOrders: (db.users.find(u => u.id === body.userId)?.totalOrders || 0) + 1 
    });

    return NextResponse.json({ order: newOrder }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Server xətası" },
      { status: 500 }
    );
  }
}

// PUT - Update order status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;

    const order = db.updateOrder(id, { status });
    if (!order) {
      return NextResponse.json(
        { error: "Sifariş tapılmadı" },
        { status: 404 }
      );
    }

    return NextResponse.json({ order });
  } catch (error) {
    return NextResponse.json(
      { error: "Server xətası" },
      { status: 500 }
    );
  }
}
