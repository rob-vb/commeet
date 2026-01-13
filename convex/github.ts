import { v } from "convex/values";
import { action, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";

// Internal query to get user by auth ID
export const getUserByAuthId = internalQuery({
  args: { authId: v.string() },
  handler: async (ctx, args) => {
    // Query the better auth user table to get the user
    const authUser = await ctx.db
      .query("betterAuth_users" as any)
      .filter((q) => q.eq(q.field("id"), args.authId))
      .unique();
    return authUser;
  },
});

// Internal query to get GitHub account for a user
export const getGitHubAccount = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    // Query the better auth accounts table
    const account = await ctx.db
      .query("betterAuth_accounts" as any)
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), args.userId),
          q.eq(q.field("providerId"), "github")
        )
      )
      .unique();
    return account;
  },
});

// Internal mutation to store repositories
export const storeRepositories = internalMutation({
  args: {
    userId: v.id("users"),
    repos: v.array(
      v.object({
        githubId: v.number(),
        name: v.string(),
        fullName: v.string(),
        description: v.optional(v.string()),
        isPrivate: v.boolean(),
        defaultBranch: v.string(),
        url: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    for (const repo of args.repos) {
      // Check if repo already exists
      const existing = await ctx.db
        .query("repositories")
        .withIndex("by_github_id", (q) => q.eq("githubId", repo.githubId))
        .unique();

      if (!existing) {
        await ctx.db.insert("repositories", {
          userId: args.userId,
          ...repo,
          isActive: false,
        });
      }
    }
  },
});

// Action to fetch repositories from GitHub API
export const fetchGitHubRepos = action({
  args: { accessToken: v.string(), userId: v.id("users") },
  handler: async (ctx, args) => {
    const response = await fetch("https://api.github.com/user/repos?per_page=100&sort=updated", {
      headers: {
        Authorization: `Bearer ${args.accessToken}`,
        Accept: "application/vnd.github+json",
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const repos = await response.json();

    const formattedRepos = repos.map((repo: any) => ({
      githubId: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description || undefined,
      isPrivate: repo.private,
      defaultBranch: repo.default_branch,
      url: repo.html_url,
    }));

    // Store repos in database
    await ctx.runMutation(internal.github.storeRepositories, {
      userId: args.userId,
      repos: formattedRepos,
    });

    return formattedRepos;
  },
});
