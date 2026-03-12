import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_...");

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, orderDetails, customerEmail } = body;

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "azn",
            product_data: {
              name: orderDetails?.productType || "Premium Reklam Sifariş",
              description: `Ölçü: ${orderDetails?.width}x${orderDetails?.height}sm`,
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: orderDetails?.quantity || 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_URL || "https://premiumreklambaku.vercel.app"}/dashboard/orders?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL || "https://premiumreklambaku.vercel.app"}/dashboard/orders?payment=cancelled`,
      customer_email: customerEmail,
      metadata: {
        orderType: orderDetails?.productType || "general",
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error("Stripe error:", error);
    return NextResponse.json(
      { error: error.message || "Ödəniş xətası" },
      { status: 500 }
    );
  }
}
