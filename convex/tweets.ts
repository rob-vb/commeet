import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

export const listByUser = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db
      .query("generatedTweets")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc");

    if (args.limit) {
      return await q.take(args.limit);
    }
    return await q.collect();
  },
});

export const get = query({
  args: { id: v.id("generatedTweets") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Internal mutation for AI action to use
export const createInternal = internalMutation({
  args: {
    userId: v.id("users"),
    commitIds: v.array(v.id("commits")),
    content: v.string(),
    tone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("generatedTweets", {
      ...args,
      characterCount: args.content.length,
      generatedAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("generatedTweets"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      content: args.content,
      characterCount: args.content.length,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("generatedTweets") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
