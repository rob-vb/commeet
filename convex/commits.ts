import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get commits by repository
export const getByRepository = query({
  args: {
    repositoryId: v.id("repositories"),
    limit: v.optional(v.number()),
    since: v.optional(v.number()),
    until: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let commits = await ctx.db
      .query("commits")
      .withIndex("by_repository", (q) => q.eq("repositoryId", args.repositoryId))
      .order("desc")
      .collect();

    // Filter by date range if provided
    if (args.since) {
      commits = commits.filter((c) => c.committedAt >= args.since!);
    }
    if (args.until) {
      commits = commits.filter((c) => c.committedAt <= args.until!);
    }

    // Apply limit
    if (args.limit) {
      commits = commits.slice(0, args.limit);
    }

    return commits;
  },
});

// Get commits by user
export const getByUser = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
    repositoryId: v.optional(v.id("repositories")),
  },
  handler: async (ctx, args) => {
    let commits = await ctx.db
      .query("commits")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    // Filter by repository if provided
    if (args.repositoryId) {
      commits = commits.filter((c) => c.repositoryId === args.repositoryId);
    }

    // Apply limit
    if (args.limit) {
      commits = commits.slice(0, args.limit);
    }

    return commits;
  },
});

// Get commits by user with repository info
export const getByUserWithRepo = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
    repositoryId: v.optional(v.id("repositories")),
    since: v.optional(v.number()),
    until: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let commits = await ctx.db
      .query("commits")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    // Filter by repository if provided
    if (args.repositoryId) {
      commits = commits.filter((c) => c.repositoryId === args.repositoryId);
    }

    // Filter by date range if provided
    if (args.since) {
      commits = commits.filter((c) => c.committedAt >= args.since!);
    }
    if (args.until) {
      commits = commits.filter((c) => c.committedAt <= args.until!);
    }

    // Apply limit
    if (args.limit) {
      commits = commits.slice(0, args.limit);
    }

    // Fetch repository info for each commit
    const commitsWithRepo = await Promise.all(
      commits.map(async (commit) => {
        const repository = await ctx.db.get(commit.repositoryId);
        return {
          ...commit,
          repository,
        };
      })
    );

    return commitsWithRepo;
  },
});

// Get commit by ID
export const getById = query({
  args: { commitId: v.id("commits") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.commitId);
  },
});

// Get commits by IDs
export const getByIds = query({
  args: { commitIds: v.array(v.id("commits")) },
  handler: async (ctx, args) => {
    const commits = await Promise.all(
      args.commitIds.map((id) => ctx.db.get(id))
    );
    return commits.filter(Boolean);
  },
});

// Get commit by SHA
export const getBySha = query({
  args: { sha: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("commits")
      .withIndex("by_sha", (q) => q.eq("sha", args.sha))
      .unique();
  },
});

// Sync commits (upsert)
export const sync = mutation({
  args: {
    repositoryId: v.id("repositories"),
    userId: v.id("users"),
    commits: v.array(
      v.object({
        sha: v.string(),
        message: v.string(),
        author: v.string(),
        committedAt: v.number(),
        filesChanged: v.number(),
        additions: v.number(),
        deletions: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const insertedIds = [];

    for (const commit of args.commits) {
      // Check if commit already exists
      const existing = await ctx.db
        .query("commits")
        .withIndex("by_sha", (q) => q.eq("sha", commit.sha))
        .unique();

      if (!existing) {
        const id = await ctx.db.insert("commits", {
          repositoryId: args.repositoryId,
          userId: args.userId,
          ...commit,
        });
        insertedIds.push(id);
      }
    }

    return insertedIds;
  },
});
