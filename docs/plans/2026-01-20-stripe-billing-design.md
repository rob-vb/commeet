# Stripe Billing Integration Design

**Date:** 2026-01-20
**Status:** Approved

## Overview

Integrate Stripe subscriptions to enforce plan limits and enable monetization. Users can upgrade from Free to Pro ($9/mo) or Builder ($19/mo) plans via Stripe Checkout.

## Architecture

### Flow

1. **Checkout**: User clicks "Upgrade" → Stripe Checkout → Webhook confirms → Plan updated
2. **Subscription Management**: Stripe handles billing cycles. We store `stripeCustomerId` and `stripeSubscriptionId` on user.
3. **Usage Enforcement**: Check plan limits before limited actions (connect repo, generate tweet)
4. **Webhooks**: Handle subscription lifecycle events from Stripe

### Plan Limits

| Plan | Repos | Generations/month | Price |
|------|-------|-------------------|-------|
| Free | 1 | 10 | $0 |
| Pro | 5 | 100 | $9/mo |
| Builder | Unlimited | Unlimited | $19/mo |

## Data Model

### New Table: usageStats

```typescript
usageStats: defineTable({
  userId: v.id("users"),
  month: v.string(),  // "2026-01" format
  tweetGenerations: v.number(),
}).index("by_user_and_month", ["userId", "month"])
```

### User Table Updates

Already has required fields:
- `stripeCustomerId: v.optional(v.string())`
- `stripeSubscriptionId: v.optional(v.string())`
- `plan: v.union(v.literal("free"), v.literal("pro"), v.literal("builder"))`

## Backend Functions

### convex/stripe.ts

**Actions:**
- `createCheckoutSession` - Create Stripe Checkout for plan upgrade
- `createPortalSession` - Create Stripe Customer Portal session

**HTTP Action:**
- `webhook` - Handle Stripe webhook events

### convex/usage.ts

**Queries:**
- `getCurrentUsage` - Get user's usage stats for current month
- `canConnectRepository` - Check if user can connect another repo
- `canGenerateTweets` - Check if user can generate more tweets

**Mutations:**
- `incrementTweetGenerations` - Called after successful generation

## Webhook Events

```typescript
checkout.session.completed    // New subscription created
customer.subscription.updated // Plan changed
customer.subscription.deleted // Subscription canceled
invoice.payment_failed        // Payment failed (optional handling)
```

## UI Components

### Upgrade Modal

Reusable modal shown when limits reached:
- Current usage vs limit
- Plan comparison
- "Upgrade Now" → Stripe Checkout

### Billing Section (Settings)

- Current plan with usage stats
- Upgrade buttons per tier
- "Manage Subscription" → Stripe Portal
- Cancel option

### Dashboard Usage Display

- "X/Y generations this month"
- Progress bar
- Upgrade prompt when near limit

## Security

- Webhook signature verification via `STRIPE_WEBHOOK_SECRET`
- Server-side limit checks (not client-side only)
- Customer Portal for sensitive billing operations

## Environment Variables

```
STRIPE_SECRET_KEY          # Stripe API key
STRIPE_WEBHOOK_SECRET      # Webhook signature verification
VITE_STRIPE_PUBLISHABLE_KEY # Client-side (for future Stripe.js usage)
STRIPE_PRO_PRICE_ID        # Price ID for Pro plan
STRIPE_BUILDER_PRICE_ID    # Price ID for Builder plan
```
