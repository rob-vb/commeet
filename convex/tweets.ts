import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listByUser = query({
  args: {
    userId: v.id("users"),
    status: v.optional(
      v.union(
        v.literal("generated"),
        v.literal("edited"),
        v.literal("posted"),
        v.literal("discarded")
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query;

    if (args.status) {
      query = ctx.db
        .query("generatedTweets")
        .withIndex("by_user_and_status", (q) =>
          q.eq("userId", args.userId).eq("status", args.status!)
        )
        .order("desc");
    } else {
      query = ctx.db
        .query("generatedTweets")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .order("desc");
    }

    if (args.limit) {
      return await query.take(args.limit);
    }
    return await query.collect();
  },
});

export const get = query({
  args: { id: v.id("generatedTweets") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    userId: v.id("users"),
    commitIds: v.array(v.id("commits")),
    content: v.string(),
    tone: v.union(
      v.literal("casual"),
      v.literal("professional"),
      v.literal("excited"),
      v.literal("technical")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("generatedTweets", {
      ...args,
      characterCount: args.content.length,
      status: "generated",
      generatedAt: Date.now(),
    });
  },
});

export const createBatch = mutation({
  args: {
    tweets: v.array(
      v.object({
        userId: v.id("users"),
        commitIds: v.array(v.id("commits")),
        content: v.string(),
        tone: v.union(
          v.literal("casual"),
          v.literal("professional"),
          v.literal("excited"),
          v.literal("technical")
        ),
      })
    ),
  },
  handler: async (ctx, args) => {
    const insertedIds: string[] = [];

    for (const tweet of args.tweets) {
      const id = await ctx.db.insert("generatedTweets", {
        ...tweet,
        characterCount: tweet.content.length,
        status: "generated",
        generatedAt: Date.now(),
      });
      insertedIds.push(id);
    }

    return insertedIds;
  },
});

export const update = mutation({
  args: {
    id: v.id("generatedTweets"),
    content: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("generated"),
        v.literal("edited"),
        v.literal("posted"),
        v.literal("discarded")
      )
    ),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const patchData: Record<string, unknown> = { ...updates };

    if (updates.content) {
      patchData.characterCount = updates.content.length;
      patchData.status = "edited";
    }

    await ctx.db.patch(id, patchData);
  },
});

export const markAsPosted = mutation({
  args: {
    id: v.id("generatedTweets"),
    twitterPostId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "posted",
      postedAt: Date.now(),
      twitterPostId: args.twitterPostId,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("generatedTweets") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const countByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const tweets = await ctx.db
      .query("generatedTweets")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    return {
      total: tweets.length,
      generated: tweets.filter((t) => t.status === "generated").length,
      posted: tweets.filter((t) => t.status === "posted").length,
    };
  },
});
