import { NextRequest, NextResponse } from "next/server";

// Email notification using external service (Resend, SendGrid, etc.)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, message, type } = body;

    // For production, use Resend, SendGrid, or similar
    // Example with Resend:
    // const { data, error } = await resend.emails.send({
    //   from: 'Premium Reklam <noreply@premiumreklambaku.shop>',
    //   to: [to],
    //   subject: subject,
    //   html: message,
    // });

    // Demo response
    console.log("Email notification:", { to, subject, message, type });

    return NextResponse.json({
      success: true,
      message: "Bildiriş göndərildi",
      to,
      subject,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Bildiriş xətası" },
      { status: 500 }
    );
  }
}

// Get notification settings
export async function GET() {
  return NextResponse.json({
    settings: {
      emailEnabled: true,
      smsEnabled: false,
      pushEnabled: true,
    },
    templates: {
      orderCreated: "Yeni sifariş yaradıldı",
      orderApproved: "Sifariş təsdiqləndi",
      orderReady: "Sifariş hazırdır",
      orderDelivered: "Sifariş çatdırıldı",
    },
  });
}
