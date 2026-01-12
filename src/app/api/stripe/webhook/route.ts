import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const elements = signature.split(",");
  const signatureData: { t?: string; v1?: string } = {};

  elements.forEach((element) => {
    const [key, value] = element.split("=");
    if (key === "t" || key === "v1") {
      signatureData[key] = value;
    }
  });

  if (!signatureData.t || !signatureData.v1) {
    return false;
  }

  const signedPayload = `${signatureData.t}.${payload}`;
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(signedPayload)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signatureData.v1),
    Buffer.from(expectedSignature)
  );
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("Stripe webhook secret not configured");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing signature" },
      { status: 400 }
    );
  }

  const payload = await request.text();

  try {
    const isValid = verifyStripeSignature(payload, signature, webhookSecret);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    const event = JSON.parse(payload);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const customerId = session.customer;
        const subscriptionId = session.subscription;

        console.log("Checkout completed:", {
          userId,
          customerId,
          subscriptionId,
        });

        // TODO: Update user's plan in database
        // - Set stripeCustomerId
        // - Set stripeSubscriptionId
        // - Set plan based on the price ID

        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const userId = subscription.metadata?.userId;
        const status = subscription.status;

        console.log("Subscription updated:", { userId, status });

        // TODO: Update user's subscription status in database

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const userId = subscription.metadata?.userId;

        console.log("Subscription deleted:", { userId });

        // TODO: Downgrade user to free plan in database

        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const customerId = invoice.customer;

        console.log("Payment failed:", { customerId });

        // TODO: Handle failed payment (send email, etc.)

        break;
      }

      default:
        console.log("Unhandled event type:", event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
