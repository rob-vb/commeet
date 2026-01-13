import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listByUser = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("commits")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc");

    if (args.limit) {
      return await query.take(args.limit);
    }
    return await query.collect();
  },
});

export const listByRepository = query({
  args: {
    repositoryId: v.id("repositories"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("commits")
      .withIndex("by_repository", (q) => q.eq("repositoryId", args.repositoryId))
      .order("desc");

    if (args.limit) {
      return await query.take(args.limit);
    }
    return await query.collect();
  },
});

export const get = query({
  args: { id: v.id("commits") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getMultiple = query({
  args: { ids: v.array(v.id("commits")) },
  handler: async (ctx, args) => {
    const commits = await Promise.all(args.ids.map((id) => ctx.db.get(id)));
    return commits.filter(Boolean);
  },
});

export const getBySha = query({
  args: { sha: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("commits")
      .withIndex("by_sha", (q) => q.eq("sha", args.sha))
      .unique();
  },
});

export const create = mutation({
  args: {
    repositoryId: v.id("repositories"),
    userId: v.id("users"),
    sha: v.string(),
    message: v.string(),
    authorName: v.string(),
    authorEmail: v.string(),
    committedAt: v.number(),
    url: v.string(),
    filesChanged: v.array(
      v.object({
        filename: v.string(),
        status: v.string(),
        additions: v.number(),
        deletions: v.number(),
      })
    ),
    totalAdditions: v.number(),
    totalDeletions: v.number(),
  },
  handler: async (ctx, args) => {
    // Check if commit already exists
    const existing = await ctx.db
      .query("commits")
      .withIndex("by_sha", (q) => q.eq("sha", args.sha))
      .unique();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("commits", args);
  },
});

export const createBatch = mutation({
  args: {
    commits: v.array(
      v.object({
        repositoryId: v.id("repositories"),
        userId: v.id("users"),
        sha: v.string(),
        message: v.string(),
        authorName: v.string(),
        authorEmail: v.string(),
        committedAt: v.number(),
        url: v.string(),
        filesChanged: v.array(
          v.object({
            filename: v.string(),
            status: v.string(),
            additions: v.number(),
            deletions: v.number(),
          })
        ),
        totalAdditions: v.number(),
        totalDeletions: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const insertedIds: string[] = [];

    for (const commit of args.commits) {
      // Check if commit already exists
      const existing = await ctx.db
        .query("commits")
        .withIndex("by_sha", (q) => q.eq("sha", commit.sha))
        .unique();

      if (!existing) {
        const id = await ctx.db.insert("commits", commit);
        insertedIds.push(id);
      }
    }

    return insertedIds;
  },
});
