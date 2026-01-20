import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { authComponent, createAuth } from "./auth";

const http = httpRouter();

// CORS handling is required for client side frameworks
authComponent.registerRoutes(http, createAuth, { cors: true });

// Stripe webhook handler
http.route({
  path: "/stripe-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const stripe = await import("stripe").then(
      (m) => new m.default(process.env.STRIPE_SECRET_KEY!)
    );

    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return new Response("Missing signature", { status: 400 });
    }

    const body = await request.text();
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        const plan = (session.metadata?.plan as "pro" | "builder") || "pro";

        await ctx.runMutation(internal.stripe.updateSubscription, {
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          plan,
        });
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;

        // Determine plan from price ID
        const priceId = subscription.items.data[0]?.price.id;
        let plan: "free" | "pro" | "builder" = "pro";
        if (priceId === process.env.STRIPE_BUILDER_PRICE_ID) {
          plan = "builder";
        }

        if (subscription.status === "active") {
          await ctx.runMutation(internal.stripe.updateSubscription, {
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscription.id,
            plan,
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;

        await ctx.runMutation(internal.stripe.cancelSubscription, {
          stripeCustomerId: customerId,
        });
        break;
      }
    }

    return new Response("OK", { status: 200 });
  }),
});

export default http;
