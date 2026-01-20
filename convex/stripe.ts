import { v } from "convex/values";
import { action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

// Price IDs - replace with your actual Stripe price IDs
const PRICE_IDS = {
  pro: process.env.STRIPE_PRO_PRICE_ID || "price_pro_placeholder",
  builder: process.env.STRIPE_BUILDER_PRICE_ID || "price_builder_placeholder",
};

export const createCheckoutSession = action({
  args: {
    userId: v.id("users"),
    plan: v.union(v.literal("pro"), v.literal("builder")),
    successUrl: v.string(),
    cancelUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const stripe = await import("stripe").then(
      (m) => new m.default(process.env.STRIPE_SECRET_KEY!)
    );

    // Get user to check for existing customer
    const user = await ctx.runQuery(internal.users.getInternal, {
      id: args.userId,
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Create or retrieve customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          userId: args.userId,
        },
      });
      customerId = customer.id;

      // Store customer ID
      await ctx.runMutation(internal.stripe.updateStripeCustomer, {
        userId: args.userId,
        stripeCustomerId: customerId,
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: PRICE_IDS[args.plan],
          quantity: 1,
        },
      ],
      success_url: args.successUrl,
      cancel_url: args.cancelUrl,
      client_reference_id: args.userId,
      metadata: {
        userId: args.userId,
        plan: args.plan,
      },
    });

    return { url: session.url };
  },
});

export const createPortalSession = action({
  args: {
    userId: v.id("users"),
    returnUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const stripe = await import("stripe").then(
      (m) => new m.default(process.env.STRIPE_SECRET_KEY!)
    );

    const user = await ctx.runQuery(internal.users.getInternal, {
      id: args.userId,
    });

    if (!user?.stripeCustomerId) {
      throw new Error("No billing account found");
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: args.returnUrl,
    });

    return { url: session.url };
  },
});

// Internal mutations for webhook handling
export const updateStripeCustomer = internalMutation({
  args: {
    userId: v.id("users"),
    stripeCustomerId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      stripeCustomerId: args.stripeCustomerId,
    });
  },
});

export const updateSubscription = internalMutation({
  args: {
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.string(),
    plan: v.union(v.literal("free"), v.literal("pro"), v.literal("builder")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_stripe_customer_id", (q) =>
        q.eq("stripeCustomerId", args.stripeCustomerId)
      )
      .unique();

    if (user) {
      await ctx.db.patch(user._id, {
        stripeSubscriptionId: args.stripeSubscriptionId,
        plan: args.plan,
      });
    }
  },
});

export const cancelSubscription = internalMutation({
  args: {
    stripeCustomerId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_stripe_customer_id", (q) =>
        q.eq("stripeCustomerId", args.stripeCustomerId)
      )
      .unique();

    if (user) {
      await ctx.db.patch(user._id, {
        stripeSubscriptionId: undefined,
        plan: "free",
      });
    }
  },
});
