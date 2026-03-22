import { NextRequest, NextResponse } from "next/server";
import { createSqlClient, initUsersTable, initOrdersTables, migrateOrdersTable, ensureAdminUser } from "../_lib/db";

// Debug endpoint
export async function HEAD(req: NextRequest) {
  try {
    const sql = createSqlClient();
    await initUsersTable(sql);
    await ensureAdminUser(sql);
    await initOrdersTables(sql);
    
    const orders = await sql`SELECT COUNT(*) as count FROM orders`;
    const users = await sql`SELECT COUNT(*) as count FROM users`;
    
    return new Response(JSON.stringify({
      dbConnected: true,
      ordersCount: Number(orders[0]?.count || 0),
      usersCount: Number(users[0]?.count || 0),
    }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({
      dbConnected: false,
      error: error.message
    }), { status: 500 });
  }
}

// Generate order number
function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `PR${year}${month}${random}`;
}

// Calculate totals from items
function calculateTotals(items: any[], discountPercent: number = 0) {
  const subtotal = items.reduce((sum, item) => sum + Number(item.lineTotal || 0), 0);
  const discountAmount = subtotal * (discountPercent / 100);
  const totalAmount = subtotal - discountAmount;
  return { subtotal, discountAmount, totalAmount };
}

// GET - Fetch orders with filters
export async function GET(request: NextRequest) {
  try {
    const sql = createSqlClient();
    await initUsersTable(sql);
    await initOrdersTables(sql);
    await migrateOrdersTable(sql);

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");
    const paymentStatus = searchParams.get("paymentStatus");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const summary = searchParams.get("summary");
    const limit = searchParams.get("limit") || "100";

    let query = sql`
      SELECT o.*, 
             u.full_name as user_name, 
             u.username as user_username,
             u.phone as user_phone
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE 1=1
    `;

    // Build dynamic query with filters
    if (userId && userId !== 'all') {
      query = sql`${query} AND o.user_id = ${parseInt(userId)}`;
    }
    if (status && status !== 'all') {
      query = sql`${query} AND o.status = ${status}`;
    }
    if (paymentStatus && paymentStatus !== 'all') {
      query = sql`${query} AND o.payment_status = ${paymentStatus}`;
    }
    if (dateFrom) {
      query = sql`${query} AND o.created_at >= ${dateFrom}`;
    }
    if (dateTo) {
      query = sql`${query} AND o.created_at <= ${dateTo + ' 23:59:59'}`;
    }

    query = sql`${query} ORDER BY o.created_at DESC LIMIT ${parseInt(limit)}`;

    const orders = await query;

    // Fetch items for each order
    const ordersWithItems = await Promise.all(
      orders.map(async (order: any) => {
        const items = await sql`
          SELECT * FROM order_items 
          WHERE order_id = ${order.id} 
          ORDER BY id ASC
        `;
        return { ...order, items };
      })
    );

    // If summary is requested
    let summaryData = null;
    if (summary === 'true' && userId && userId !== 'all') {
      const today = new Date().toISOString().split('T')[0];
      const monthStart = today.substring(0, 7) + '-01';

      // Today's orders
      const todayStats = await sql`
        SELECT 
          COUNT(*) as count,
          COALESCE(SUM(total_amount), 0) as total,
          COALESCE(SUM(paid_amount), 0) as paid
        FROM orders 
        WHERE user_id = ${parseInt(userId)} 
          AND DATE(created_at) = ${today}
          AND payment_status != 'CANCELLED'
      `;

      // This month's orders
      const monthStats = await sql`
        SELECT 
          COUNT(*) as count,
          COALESCE(SUM(total_amount), 0) as total,
          COALESCE(SUM(paid_amount), 0) as paid
        FROM orders 
        WHERE user_id = ${parseInt(userId)} 
          AND created_at >= ${monthStart}
          AND payment_status != 'CANCELLED'
      `;

      // All-time totals (excluding cancelled)
      const allStats = await sql`
        SELECT 
          COUNT(*) as count,
          COALESCE(SUM(total_amount), 0) as total,
          COALESCE(SUM(paid_amount), 0) as paid,
          COALESCE(SUM(remaining_amount), 0) as remaining
        FROM orders 
        WHERE user_id = ${parseInt(userId)} 
          AND payment_status != 'CANCELLED'
      `;

      summaryData = {
        todayOrderCount: Number(todayStats[0]?.count || 0),
        todayOrderAmount: Number(todayStats[0]?.total || 0),
        monthOrderCount: Number(monthStats[0]?.count || 0),
        monthOrderAmount: Number(monthStats[0]?.total || 0),
        totalPaid: Number(allStats[0]?.paid || 0),
        totalDebt: Number(allStats[0]?.remaining || 0),
        totalOrders: Number(allStats[0]?.count || 0),
        totalAmount: Number(allStats[0]?.total || 0),
      };
    }

    return NextResponse.json({ 
      orders: ordersWithItems, 
      summary: summaryData,
      total: orders.length 
    });
  } catch (error) {
    console.error("GET orders error:", error);
    return NextResponse.json({ orders: [], summary: null, error: "Server xətası" }, { status: 500 });
  }
}

// POST - Create new order
export async function POST(request: NextRequest) {
  try {
    const sql = createSqlClient();
    await initUsersTable(sql);
    await initOrdersTables(sql);

    const body = await request.json();

    // Validate required fields
    if (!body.userId || !body.customerName) {
      return NextResponse.json({ error: "İstifadəçi və müştəri adı məcburidir" }, { status: 400 });
    }

    const orderNumber = generateOrderNumber();
    const items = body.items || [];
    
    // Calculate totals
    const { subtotal, discountAmount, totalAmount } = calculateTotals(items, body.discountPercent || 0);
    
    // Calculate paid and remaining based on payment info
    const paidAmount = body.paidAmount || 0;
    const remainingAmount = totalAmount - paidAmount;
    
    // Determine payment status
    let paymentStatus = 'PENDING';
    if (paidAmount >= totalAmount && totalAmount > 0) {
      paymentStatus = 'PAID';
    } else if (paidAmount > 0) {
      paymentStatus = 'PARTIAL';
    }

    // Insert order
    const orderResult = await sql`
      INSERT INTO orders (
        user_id, order_number, customer_name, customer_phone, customer_whatsapp, 
        customer_address, status, subtotal, discount_percent, discount_amount,
        total_amount, paid_amount, remaining_amount, payment_status, payment_method,
        is_credit, note
      ) VALUES (
        ${body.userId}, ${orderNumber}, ${body.customerName}, ${body.customerPhone || null},
        ${body.customerWhatsapp || null}, ${body.customerAddress || null},
        ${body.status || 'PENDING'}, ${subtotal}, ${body.discountPercent || 0}, ${discountAmount},
        ${totalAmount}, ${paidAmount}, ${remainingAmount}, ${paymentStatus},
        ${body.paymentMethod || 'CASH'}, ${body.isCredit || false}, ${body.note || null}
      )
      RETURNING *
    `;

    const newOrder = orderResult[0];

    // Insert order items
    if (items.length > 0) {
      for (const item of items) {
        const area = (Number(item.width) || 0) * (Number(item.height) || 0);
        const unitPrice = Number(item.unitPrice) || 0;
        const quantity = Number(item.quantity) || 1;
        const lineTotal = area * unitPrice * quantity;

        await sql`
          INSERT INTO order_items (
            order_id, product_id, product_name, unit, quantity,
            width, height, area, unit_price, line_total, note
          ) VALUES (
            ${newOrder.id}, ${item.productId || null}, ${item.productName},
            ${item.unit || 'm²'}, ${quantity},
            ${item.width || 0}, ${item.height || 0}, ${area}, ${unitPrice}, ${lineTotal},
            ${item.note || null}
          )
        `;
      }
    }

    // Record payment if paid amount > 0
    if (paidAmount > 0) {
      await sql`
        INSERT INTO payments (order_id, user_id, amount, payment_method, note, created_by)
        VALUES (${newOrder.id}, ${body.userId}, ${paidAmount}, ${body.paymentMethod || 'CASH'}, 'İlk ödəniş', ${body.userId})
      `;
    }

    // Fetch the complete order with items
    const completeOrder = {
      ...newOrder,
      items: items.map((item: any, idx: number) => ({
        id: idx + 1,
        ...item,
        area: (Number(item.width) || 0) * (Number(item.height) || 0),
        lineTotal: (Number(item.width) || 0) * (Number(item.height) || 0) * (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0)
      }))
    };

    return NextResponse.json({ order: completeOrder }, { status: 201 });
  } catch (error) {
    console.error("POST order error:", error);
    return NextResponse.json({ error: "Server xətası: " + (error as Error).message }, { status: 500 });
  }
}

// PATCH - Update order (status, payment, etc.)
export async function PATCH(request: NextRequest) {
  try {
    const sql = createSqlClient();
    const body = await request.json();

    if (!body.orderId) {
      return NextResponse.json({ error: "Sifariş ID məcburidir" }, { status: 400 });
    }

    // Get current order
    const currentOrder = await sql`
      SELECT * FROM orders WHERE id = ${body.orderId}
    `;

    if (!currentOrder || currentOrder.length === 0) {
      return NextResponse.json({ error: "Sifariş tapılmadı" }, { status: 404 });
    }

    const order = currentOrder[0];

    // Handle different update types
    let updateFields: any = { updated_at: new Date().toISOString() };

    // 1. Payment Update
    if (body.type === 'payment') {
      const newPaidAmount = Number(body.paidAmount);
      
      // Validation
      if (newPaidAmount < 0) {
        return NextResponse.json({ error: "Mənfi ödəniş edilə bilməz" }, { status: 400 });
      }
      if (newPaidAmount > Number(order.total_amount)) {
        return NextResponse.json({ error: "Ödəniş ümumi məbləği keçə bilməz" }, { status: 400 });
      }

      // If order is cancelled, don't allow payment changes
      if (order.payment_status === 'CANCELLED') {
        return NextResponse.json({ error: "Ləğv edilmiş sifarişə ödəniş edilə bilməz" }, { status: 400 });
      }

      const newRemainingAmount = Number(order.total_amount) - newPaidAmount;
      
      // Determine new payment status
      let newPaymentStatus = 'PENDING';
      if (newPaidAmount >= Number(order.total_amount) && Number(order.total_amount) > 0) {
        newPaymentStatus = 'PAID';
      } else if (newPaidAmount > 0) {
        newPaymentStatus = 'PARTIAL';
      }

      updateFields = {
        ...updateFields,
        paid_amount: newPaidAmount,
        remaining_amount: newRemainingAmount,
        payment_status: newPaymentStatus,
      };

      // Record payment in payments table
      const paymentDiff = newPaidAmount - Number(order.paid_amount);
      if (paymentDiff > 0) {
        await sql`
          INSERT INTO payments (order_id, user_id, amount, payment_method, note, created_by)
          VALUES (
            ${body.orderId}, 
            ${order.user_id}, 
            ${paymentDiff}, 
            ${body.paymentMethod || 'CASH'}, 
            ${body.note || 'Ödəniş'},
            ${body.adminId || null}
          )
        `;
      }
    }

    // 2. Status Update
    if (body.type === 'status') {
      updateFields.status = body.status;
    }

    // 3. Full Update
    if (body.type === 'update') {
      updateFields = {
        ...updateFields,
        customer_name: body.customerName || order.customer_name,
        customer_phone: body.customerPhone !== undefined ? body.customerPhone : order.customer_phone,
        customer_whatsapp: body.customerWhatsapp !== undefined ? body.customerWhatsapp : order.customer_whatsapp,
        customer_address: body.customerAddress !== undefined ? body.customerAddress : order.customer_address,
        status: body.status || order.status,
        note: body.note !== undefined ? body.note : order.note,
      };
    }

    // Build and execute update query using tagged template
    const updateResult = await sql`
      UPDATE orders SET 
        updated_at = ${updateFields.updated_at},
        paid_amount = ${updateFields.paid_amount !== undefined ? updateFields.paid_amount : order.paid_amount},
        remaining_amount = ${updateFields.remaining_amount !== undefined ? updateFields.remaining_amount : order.remaining_amount},
        payment_status = ${updateFields.payment_status || order.payment_status},
        status = ${updateFields.status || order.status},
        customer_name = ${updateFields.customer_name || order.customer_name},
        customer_phone = ${updateFields.customer_phone !== undefined ? updateFields.customer_phone : order.customer_phone},
        customer_address = ${updateFields.customer_address !== undefined ? updateFields.customer_address : order.customer_address},
        note = ${updateFields.note !== undefined ? updateFields.note : order.note}
      WHERE id = ${body.orderId}
      RETURNING *
    `;

    // Fetch items
    const items = await sql`SELECT * FROM order_items WHERE order_id = ${body.orderId} ORDER BY id ASC`;

    return NextResponse.json({ order: { ...updateResult[0], items } });
  } catch (error) {
    console.error("PATCH order error:", error);
    return NextResponse.json({ error: "Server xətası: " + (error as Error).message }, { status: 500 });
  }
}

// DELETE - Delete order
export async function DELETE(request: NextRequest) {
  try {
    const sql = createSqlClient();
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("id");

    if (!orderId) {
      return NextResponse.json({ error: "Sifariş ID məcburidir" }, { status: 400 });
    }

    // Delete order (cascade will delete items and payments)
    await sql`DELETE FROM orders WHERE id = ${parseInt(orderId)}`;

    return NextResponse.json({ success: true, message: "Sifariş silindi" });
  } catch (error) {
    console.error("DELETE order error:", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
