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

// Internal mutation to store commits
export const storeCommits = internalMutation({
  args: {
    repositoryId: v.id("repositories"),
    userId: v.id("users"),
    commits: v.array(
      v.object({
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

// Action to fetch commits from GitHub API for a repository
export const fetchGitHubCommits = action({
  args: {
    accessToken: v.string(),
    userId: v.id("users"),
    repositoryId: v.id("repositories"),
    repoFullName: v.string(),
    since: v.optional(v.string()), // ISO date string
  },
  handler: async (ctx, args) => {
    const url = new URL(`https://api.github.com/repos/${args.repoFullName}/commits`);
    url.searchParams.set("per_page", "30");
    if (args.since) {
      url.searchParams.set("since", args.since);
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${args.accessToken}`,
        Accept: "application/vnd.github+json",
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const commits = await response.json();

    // Fetch detailed info for each commit (to get file changes)
    const detailedCommits = await Promise.all(
      commits.slice(0, 20).map(async (commit: any) => {
        const detailResponse = await fetch(
          `https://api.github.com/repos/${args.repoFullName}/commits/${commit.sha}`,
          {
            headers: {
              Authorization: `Bearer ${args.accessToken}`,
              Accept: "application/vnd.github+json",
            },
          }
        );

        if (!detailResponse.ok) {
          return null;
        }

        const detail = await detailResponse.json();
        return {
          sha: commit.sha,
          message: commit.commit.message,
          authorName: commit.commit.author?.name || "Unknown",
          authorEmail: commit.commit.author?.email || "",
          committedAt: new Date(commit.commit.author?.date || Date.now()).getTime(),
          url: commit.html_url,
          filesChanged: (detail.files || []).slice(0, 50).map((file: any) => ({
            filename: file.filename,
            status: file.status,
            additions: file.additions || 0,
            deletions: file.deletions || 0,
          })),
          totalAdditions: detail.stats?.additions || 0,
          totalDeletions: detail.stats?.deletions || 0,
        };
      })
    );

    const validCommits = detailedCommits.filter(Boolean);

    // Store commits in database
    if (validCommits.length > 0) {
      await ctx.runMutation(internal.github.storeCommits, {
        repositoryId: args.repositoryId,
        userId: args.userId,
        commits: validCommits,
      });
    }

    return validCommits;
  },
});
