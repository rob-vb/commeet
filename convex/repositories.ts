import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all connected repositories for a user
export const getConnectedRepositories = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("repositories")
      .withIndex("by_user_active", (q) =>
        q.eq("userId", args.userId).eq("isActive", true)
      )
      .collect();
  },
});

// Get all repositories for a user (including inactive)
export const getAllRepositories = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("repositories")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Get repository by ID
export const getById = query({
  args: { repositoryId: v.id("repositories") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.repositoryId);
  },
});

// Get repository by GitHub repo ID
export const getByGitHubRepoId = query({
  args: { githubRepoId: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("repositories")
      .withIndex("by_github_repo_id", (q) =>
        q.eq("githubRepoId", args.githubRepoId)
      )
      .unique();
  },
});

// Connect a repository
export const connect = mutation({
  args: {
    userId: v.id("users"),
    githubRepoId: v.number(),
    name: v.string(),
    defaultBranch: v.string(),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Check if repository already exists for this user
    const existing = await ctx.db
      .query("repositories")
      .withIndex("by_github_repo_id", (q) =>
        q.eq("githubRepoId", args.githubRepoId)
      )
      .unique();

    if (existing) {
      // Reactivate if it was disconnected
      if (!existing.isActive) {
        await ctx.db.patch(existing._id, { isActive: true });
      }
      return existing._id;
    }

    return await ctx.db.insert("repositories", {
      userId: args.userId,
      provider: "github",
      githubRepoId: args.githubRepoId,
      name: args.name,
      defaultBranch: args.defaultBranch,
      isPublic: args.isPublic,
      isActive: true,
    });
  },
});

// Disconnect a repository (soft delete)
export const disconnect = mutation({
  args: { repositoryId: v.id("repositories") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.repositoryId, { isActive: false });
  },
});

// Update last synced timestamp
export const updateLastSynced = mutation({
  args: { repositoryId: v.id("repositories") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.repositoryId, { lastSyncedAt: Date.now() });
  },
});
