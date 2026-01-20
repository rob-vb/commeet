# Stripe Billing Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Stripe subscription billing with plan limits enforcement for Free/Pro/Builder tiers.

**Architecture:** Stripe Checkout for payments, webhooks for subscription lifecycle, usage tracking table for monthly generation counts, server-side limit checks before expensive operations.

**Tech Stack:** Stripe API, Convex (mutations/actions/HTTP), React components

---

## Task 1: Add Usage Stats Table to Schema

**Files:**
- Modify: `convex/schema.ts`

**Step 1: Add usageStats table**

Add after the `generatedTweets` table definition:

```typescript
usageStats: defineTable({
  userId: v.id("users"),
  month: v.string(), // "2026-01" format
  tweetGenerations: v.number(),
})
  .index("by_user_and_month", ["userId", "month"]),
```

**Step 2: Commit**

```bash
git add convex/schema.ts
git commit -m "feat: add usageStats table for billing limits"
```

---

## Task 2: Create Usage Tracking Functions

**Files:**
- Create: `convex/usage.ts`

**Step 1: Create usage.ts with queries and mutations**

```typescript
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const PLAN_LIMITS = {
  free: { repositories: 1, generations: 10 },
  pro: { repositories: 5, generations: 100 },
  builder: { repositories: Infinity, generations: Infinity },
};

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export const getCurrentUsage = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const month = getCurrentMonth();
    const stats = await ctx.db
      .query("usageStats")
      .withIndex("by_user_and_month", (q) =>
        q.eq("userId", args.userId).eq("month", month)
      )
      .unique();

    return {
      month,
      tweetGenerations: stats?.tweetGenerations ?? 0,
    };
  },
});

export const canConnectRepository = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return { allowed: false, reason: "User not found" };

    const plan = user.plan || "free";
    const limit = PLAN_LIMITS[plan].repositories;

    const activeRepos = await ctx.db
      .query("repositories")
      .withIndex("by_user_and_active", (q) =>
        q.eq("userId", args.userId).eq("isActive", true)
      )
      .collect();

    const currentCount = activeRepos.length;

    if (currentCount >= limit) {
      return {
        allowed: false,
        reason: `${plan} plan allows ${limit} repository. Upgrade to connect more.`,
        current: currentCount,
        limit,
        plan,
      };
    }

    return { allowed: true, current: currentCount, limit, plan };
  },
});

export const canGenerateTweets = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return { allowed: false, reason: "User not found" };

    const plan = user.plan || "free";
    const limit = PLAN_LIMITS[plan].generations;

    if (limit === Infinity) {
      return { allowed: true, current: 0, limit: "unlimited", plan };
    }

    const month = getCurrentMonth();
    const stats = await ctx.db
      .query("usageStats")
      .withIndex("by_user_and_month", (q) =>
        q.eq("userId", args.userId).eq("month", month)
      )
      .unique();

    const currentCount = stats?.tweetGenerations ?? 0;

    if (currentCount >= limit) {
      return {
        allowed: false,
        reason: `You've used all ${limit} generations this month. Upgrade for more.`,
        current: currentCount,
        limit,
        plan,
      };
    }

    return { allowed: true, current: currentCount, limit, plan };
  },
});

export const incrementTweetGenerations = mutation({
  args: { userId: v.id("users"), count: v.number() },
  handler: async (ctx, args) => {
    const month = getCurrentMonth();
    const existing = await ctx.db
      .query("usageStats")
      .withIndex("by_user_and_month", (q) =>
        q.eq("userId", args.userId).eq("month", month)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        tweetGenerations: existing.tweetGenerations + args.count,
      });
    } else {
      await ctx.db.insert("usageStats", {
        userId: args.userId,
        month,
        tweetGenerations: args.count,
      });
    }
  },
});

export const getPlanLimits = query({
  args: { plan: v.union(v.literal("free"), v.literal("pro"), v.literal("builder")) },
  handler: async (ctx, args) => {
    return PLAN_LIMITS[args.plan];
  },
});
```

**Step 2: Commit**

```bash
git add convex/usage.ts
git commit -m "feat: add usage tracking functions for billing limits"
```

---

## Task 3: Integrate Usage Tracking with Tweet Generation

**Files:**
- Modify: `convex/ai.ts`

**Step 1: Import internal usage mutation**

Add at top of file:

```typescript
import { internal } from "./_generated/api";
```

**Step 2: Update generateTweets to increment usage**

In the `generateTweets` action, after storing tweets (around line 179), add:

```typescript
// Increment usage stats
await ctx.runMutation(internal.usage.incrementTweetGenerationsInternal, {
  userId: args.userId,
  count: tweets.length,
});
```

**Step 3: Add internal mutation to usage.ts**

Add to `convex/usage.ts`:

```typescript
import { internalMutation } from "./_generated/server";

export const incrementTweetGenerationsInternal = internalMutation({
  args: { userId: v.id("users"), count: v.number() },
  handler: async (ctx, args) => {
    const month = getCurrentMonth();
    const existing = await ctx.db
      .query("usageStats")
      .withIndex("by_user_and_month", (q) =>
        q.eq("userId", args.userId).eq("month", month)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        tweetGenerations: existing.tweetGenerations + args.count,
      });
    } else {
      await ctx.db.insert("usageStats", {
        userId: args.userId,
        month,
        tweetGenerations: args.count,
      });
    }
  },
});
```

**Step 4: Commit**

```bash
git add convex/ai.ts convex/usage.ts
git commit -m "feat: track tweet generation usage"
```

---

## Task 4: Create Stripe Backend Functions

**Files:**
- Create: `convex/stripe.ts`

**Step 1: Create stripe.ts with checkout and portal actions**

```typescript
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
```

**Step 2: Commit**

```bash
git add convex/stripe.ts
git commit -m "feat: add Stripe checkout and portal actions"
```

---

## Task 5: Add Internal User Query

**Files:**
- Modify: `convex/users.ts`

**Step 1: Add internal query**

Add to `convex/users.ts`:

```typescript
import { internalQuery } from "./_generated/server";

export const getInternal = internalQuery({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
```

**Step 2: Commit**

```bash
git add convex/users.ts
git commit -m "feat: add internal user query for Stripe"
```

---

## Task 6: Create Stripe Webhook Handler

**Files:**
- Modify: `convex/http.ts`

**Step 1: Read current http.ts**

Check if http.ts exists and its current content.

**Step 2: Add webhook handler**

Add or update `convex/http.ts`:

```typescript
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

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
```

**Step 3: Commit**

```bash
git add convex/http.ts
git commit -m "feat: add Stripe webhook handler"
```

---

## Task 7: Create Upgrade Modal Component

**Files:**
- Create: `src/components/upgrade-modal.tsx`

**Step 1: Create the modal component**

```typescript
import { useAction } from "convex/react";
import { api } from "~/lib/convex";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { Id } from "convex/_generated/dataModel";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: Id<"users">;
  reason: string;
  currentPlan: "free" | "pro" | "builder";
}

export function UpgradeModal({
  open,
  onOpenChange,
  userId,
  reason,
  currentPlan,
}: UpgradeModalProps) {
  const [loading, setLoading] = useState<"pro" | "builder" | null>(null);
  const createCheckout = useAction(api.stripe.createCheckoutSession);

  const handleUpgrade = async (plan: "pro" | "builder") => {
    setLoading(plan);
    try {
      const { url } = await createCheckout({
        userId,
        plan,
        successUrl: `${window.location.origin}/dashboard?upgraded=true`,
        cancelUrl: `${window.location.origin}/dashboard`,
      });
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error("Failed to create checkout:", error);
    } finally {
      setLoading(null);
    }
  };

  const plans = [
    {
      id: "pro" as const,
      name: "Pro",
      price: "$9/mo",
      features: ["5 repositories", "100 generations/month", "Direct Twitter posting"],
    },
    {
      id: "builder" as const,
      name: "Builder",
      price: "$19/mo",
      features: ["Unlimited repositories", "Unlimited generations", "Priority AI"],
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upgrade Your Plan</DialogTitle>
          <DialogDescription>{reason}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {plans
            .filter((p) => p.id !== currentPlan)
            .map((plan) => (
              <Card key={plan.id} className="relative">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <span className="text-2xl font-bold">{plan.price}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={loading !== null}
                  >
                    {loading === plan.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Upgrade to {plan.name}
                  </Button>
                </CardContent>
              </Card>
            ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/upgrade-modal.tsx
git commit -m "feat: add upgrade modal component"
```

---

## Task 8: Add Limit Checks to Repositories Page

**Files:**
- Modify: `src/routes/dashboard/repositories.tsx`

**Step 1: Add usage query and upgrade modal**

Add imports:

```typescript
import { UpgradeModal } from "~/components/upgrade-modal";
```

Add state and query in component:

```typescript
const [showUpgrade, setShowUpgrade] = useState(false);
const [upgradeReason, setUpgradeReason] = useState("");

const canConnect = useQuery(
  api.usage.canConnectRepository,
  appUser?._id ? { userId: appUser._id } : "skip"
);
```

**Step 2: Update handleToggleRepo to check limits**

```typescript
const handleToggleRepo = async (repo: any) => {
  if (!appUser?._id) return;

  if (repo.isActive) {
    await disconnectRepo({ id: repo._id });
  } else {
    // Check if can connect
    if (canConnect && !canConnect.allowed) {
      setUpgradeReason(canConnect.reason || "Repository limit reached");
      setShowUpgrade(true);
      return;
    }

    setConnectingRepo(repo.githubId);
    await connectRepo({
      userId: appUser._id,
      githubId: repo.githubId,
      name: repo.name,
      fullName: repo.fullName,
      description: repo.description,
      isPrivate: repo.isPrivate,
      defaultBranch: repo.defaultBranch,
      url: repo.url,
    });
    setConnectingRepo(null);
  }
};
```

**Step 3: Add modal to JSX**

Add before closing `</div>`:

```typescript
<UpgradeModal
  open={showUpgrade}
  onOpenChange={setShowUpgrade}
  userId={appUser._id}
  reason={upgradeReason}
  currentPlan={appUser.plan || "free"}
/>
```

**Step 4: Commit**

```bash
git add src/routes/dashboard/repositories.tsx
git commit -m "feat: add repository limit checks with upgrade modal"
```

---

## Task 9: Add Limit Checks to Tweets Page

**Files:**
- Modify: `src/routes/dashboard/tweets.tsx`

**Step 1: Add usage query and upgrade modal**

Similar to repositories page - add imports, state, query, and check before `handleGenerate`:

```typescript
const canGenerate = useQuery(
  api.usage.canGenerateTweets,
  appUser?._id ? { userId: appUser._id } : "skip"
);

const handleGenerate = async () => {
  if (!appUser?._id || commitIdsFromUrl.length === 0) return;

  // Check limits
  if (canGenerate && !canGenerate.allowed) {
    setUpgradeReason(canGenerate.reason || "Generation limit reached");
    setShowUpgrade(true);
    return;
  }

  setGenerating(true);
  // ... rest of existing code
};
```

**Step 2: Add modal to JSX**

**Step 3: Commit**

```bash
git add src/routes/dashboard/tweets.tsx
git commit -m "feat: add tweet generation limit checks with upgrade modal"
```

---

## Task 10: Update Dashboard with Usage Stats

**Files:**
- Modify: `src/routes/dashboard/index.tsx`

**Step 1: Add usage query**

```typescript
const usage = useQuery(
  api.usage.getCurrentUsage,
  appUser?._id ? { userId: appUser._id } : "skip"
);

const canGenerate = useQuery(
  api.usage.canGenerateTweets,
  appUser?._id ? { userId: appUser._id } : "skip"
);
```

**Step 2: Add usage display to stats grid**

Add a new card showing generation usage with progress bar.

**Step 3: Commit**

```bash
git add src/routes/dashboard/index.tsx
git commit -m "feat: show usage stats on dashboard"
```

---

## Task 11: Update Settings Billing Section

**Files:**
- Modify: `src/routes/dashboard/settings.tsx`

**Step 1: Add Stripe portal action and upgrade functionality**

```typescript
const createPortal = useAction(api.stripe.createPortalSession);

const handleManageSubscription = async () => {
  if (!appUser?._id) return;
  try {
    const { url } = await createPortal({
      userId: appUser._id,
      returnUrl: `${window.location.origin}/dashboard/settings`,
    });
    if (url) {
      window.location.href = url;
    }
  } catch (error) {
    console.error("Failed to open portal:", error);
  }
};
```

**Step 2: Update billing tab with real data and actions**

**Step 3: Commit**

```bash
git add src/routes/dashboard/settings.tsx
git commit -m "feat: add Stripe portal integration to settings"
```

---

## Task 12: Install Stripe Package

**Files:**
- Modify: `package.json`

**Step 1: Install stripe**

```bash
npm install stripe
```

**Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add stripe dependency"
```

---

## Task 13: Update PRD Checklist

**Files:**
- Modify: `PRD.md`

**Step 1: Mark Stripe billing as complete**

Change:
```markdown
- [ ] Stripe billing integration
```

To:
```markdown
- [x] Stripe billing integration
```

**Step 2: Commit**

```bash
git add PRD.md
git commit -m "docs: mark Stripe billing as complete in PRD"
```

---

## Summary

After completing all tasks, the billing system will:
1. Track monthly tweet generation usage
2. Enforce plan limits (1/5/unlimited repos, 10/100/unlimited generations)
3. Show upgrade modal when limits reached
4. Create Stripe Checkout sessions for upgrades
5. Handle webhooks for subscription lifecycle
6. Provide Customer Portal access for billing management
7. Display usage stats on dashboard
