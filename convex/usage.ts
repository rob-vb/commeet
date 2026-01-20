import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery } from "./_generated/server";

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
        reason: `Your ${plan} plan allows ${limit} repository${limit === 1 ? "" : "s"}. Upgrade to connect more.`,
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

// Internal query for use by actions
export const canGenerateTweetsInternal = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return { allowed: false, reason: "User not found" };

    const plan = user.plan || "free";
    const limit = PLAN_LIMITS[plan].generations;

    if (limit === Infinity) {
      return { allowed: true };
    }

    const month = getCurrentMonth();
    const stats = await ctx.db
      .query("usageStats")
      .withIndex("by_user_and_month", (q) =>
        q.eq("userId", args.userId).eq("month", month)
      )
      .unique();

    const used = stats?.tweetGenerations ?? 0;
    if (used >= limit) {
      return {
        allowed: false,
        reason: `You've used ${used}/${limit} tweet generations this month. Upgrade for more.`,
      };
    }

    return { allowed: true };
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

// Internal mutation for use by actions
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

export const getPlanLimits = query({
  args: { plan: v.union(v.literal("free"), v.literal("pro"), v.literal("builder")) },
  handler: async (ctx, args) => {
    return PLAN_LIMITS[args.plan];
  },
});
