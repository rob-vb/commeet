import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("repositories")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const listActiveByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("repositories")
      .withIndex("by_user_and_active", (q) =>
        q.eq("userId", args.userId).eq("isActive", true)
      )
      .collect();
  },
});

export const get = query({
  args: { id: v.id("repositories") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByGitHubId = query({
  args: { githubId: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("repositories")
      .withIndex("by_github_id", (q) => q.eq("githubId", args.githubId))
      .unique();
  },
});

export const create = mutation({
  args: {
    userId: v.id("users"),
    githubId: v.number(),
    name: v.string(),
    fullName: v.string(),
    description: v.optional(v.string()),
    isPrivate: v.boolean(),
    defaultBranch: v.string(),
    url: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if repo already exists
    const existing = await ctx.db
      .query("repositories")
      .withIndex("by_github_id", (q) => q.eq("githubId", args.githubId))
      .unique();

    if (existing) {
      // Reactivate if it was deactivated
      await ctx.db.patch(existing._id, { isActive: true });
      return existing._id;
    }

    return await ctx.db.insert("repositories", {
      ...args,
      isActive: true,
    });
  },
});

export const deactivate = mutation({
  args: { id: v.id("repositories") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { isActive: false });
  },
});

export const updateLastSynced = mutation({
  args: { id: v.id("repositories") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { lastSyncedAt: Date.now() });
  },
});
