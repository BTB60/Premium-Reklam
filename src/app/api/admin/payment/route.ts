import { NextRequest, NextResponse } from "next/server";
import { createSqlClient } from "../../_lib/db";

// GET - Check environment
export async function GET(req: NextRequest) {
  const hasDbUrl = !!(process.env.DATABASE_URL || process.env.premiumreklambaku_DATABASE_URL);
  return NextResponse.json({
    hasDatabaseUrl: hasDbUrl,
    envKeys: Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('POSTGRES')),
  });
}

// PATCH - Add payment to order
export async function PATCH(req: NextRequest) {
  try {
    const sql = createSqlClient();

    const orderIdParam = req.nextUrl.searchParams.get("orderId");
    const orderId = Number(orderIdParam);
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

    // Get current order
    const currentOrder = await sql`
      SELECT id, total_amount, paid_amount, remaining_amount, payment_status, user_id 
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
    const currentTotal = Number(order.total_amount);
    const currentPaid = Number(order.paid_amount);
    const newPaidAmount = Math.min(currentPaid + amount, currentTotal);
    const newRemainingAmount = currentTotal - newPaidAmount;

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
  } catch (error: any) {
    console.error("Payment error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server xətası baş verdi." },
      { status: 500 }
    );
  }
}
