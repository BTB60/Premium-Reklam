import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

// Get database URL from environment
function getDatabaseUrl(): string {
  return (
    process.env.DATABASE_URL ||
    process.env.premiumreklambaku_DATABASE_URL ||
    process.env.premiumreklambaku_POSTGRES_URL ||
    ""
  );
}

// PATCH - Add payment to order
export async function PATCH(req: NextRequest) {
  try {
    const dbUrl = getDatabaseUrl();
    if (!dbUrl) {
      return NextResponse.json(
        { success: false, message: "Database not configured" },
        { status: 500 }
      );
    }

    const orderId = Number(req.nextUrl.searchParams.get("orderId"));
    const body = await req.json();
    const amount = Number(body?.amount);

    // Validation
    if (!Number.isFinite(orderId) || orderId <= 0) {
      return NextResponse.json(
        { success: false, message: "Sifariş ID yanlışdır." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, message: "Ödəniş məbləği düzgün deyil." },
        { status: 400 }
      );
    }

    const sql = neon(dbUrl);

    // Get current order
    const currentOrder = await sql`
      SELECT id, total_price, paid_amount, remaining_amount, payment_status, user_id 
      FROM orders 
      WHERE id = ${orderId}
    `;

    if (!currentOrder || currentOrder.length === 0) {
      return NextResponse.json(
        { success: false, message: "Sifariş tapılmadı." },
        { status: 404 }
      );
    }

    const order = currentOrder[0];

    // Check if cancelled
    if (order.payment_status === "CANCELLED") {
      return NextResponse.json(
        { success: false, message: "Ləğv edilmiş sifarişə ödəniş edilə bilməz." },
        { status: 400 }
      );
    }

    // Calculate new payment
    const newPaidAmount = Math.min(
      Number(order.paid_amount) + amount,
      Number(order.total_price)
    );
    const newRemainingAmount = Number(order.total_price) - newPaidAmount;

    // Determine new status
    let newStatus = "PARTIAL";
    if (newRemainingAmount <= 0) {
      newStatus = "PAID";
    }

    // Update order
    const updatedOrder = await sql`
      UPDATE orders
      SET 
        paid_amount = ${newPaidAmount},
        remaining_amount = ${newRemainingAmount},
        payment_status = ${newStatus},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${orderId}
      RETURNING *
    `;

    return NextResponse.json({
      success: true,
      message: "Ödəniş əlavə edildi.",
      order: updatedOrder[0],
    });
  } catch (error) {
    console.error("Payment error:", error);
    return NextResponse.json(
      { success: false, message: "Server xətası baş verdi." },
      { status: 500 }
    );
  }
}
