import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    // Auth (Better Auth handles core auth)
    email: v.string(),
    name: v.optional(v.string()),
    image: v.optional(v.string()),

    // GitHub Connection
    githubId: v.optional(v.string()),
    githubAccessToken: v.optional(v.string()),
    githubUsername: v.optional(v.string()),

    // Twitter Connection
    twitterAccessToken: v.optional(v.string()),
    twitterRefreshToken: v.optional(v.string()),
    twitterUsername: v.optional(v.string()),

    // Voice Settings
    voiceTone: v.optional(
      v.union(
        v.literal("casual"),
        v.literal("professional"),
        v.literal("excited"),
        v.literal("technical")
      )
    ),
    productDescription: v.optional(v.string()),
    targetAudience: v.optional(v.string()),
    exampleTweets: v.optional(v.array(v.string())),

    // Stripe & Billing
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    plan: v.union(v.literal("free"), v.literal("pro"), v.literal("builder")),
    planExpiresAt: v.optional(v.number()),
  })
    .index("by_email", ["email"])
    .index("by_github_id", ["githubId"])
    .index("by_stripe_customer_id", ["stripeCustomerId"]),

  repositories: defineTable({
    userId: v.id("users"),

    // Git Provider (extensible for GitLab, etc.)
    provider: v.union(v.literal("github"), v.literal("gitlab")),

    // GitHub-specific
    githubRepoId: v.number(),
    name: v.string(), // e.g., "owner/repo-name"
    defaultBranch: v.string(),
    isPublic: v.boolean(),
    isActive: v.boolean(),

    lastSyncedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_active", ["userId", "isActive"])
    .index("by_github_repo_id", ["githubRepoId"]),

  commits: defineTable({
    repositoryId: v.id("repositories"),
    userId: v.id("users"),

    sha: v.string(),
    message: v.string(),
    author: v.string(),
    committedAt: v.number(), // timestamp

    // File Changes Summary
    filesChanged: v.number(),
    additions: v.number(),
    deletions: v.number(),
  })
    .index("by_repository", ["repositoryId"])
    .index("by_user", ["userId"])
    .index("by_sha", ["sha"])
    .index("by_committed_at", ["repositoryId", "committedAt"]),

  generatedTweets: defineTable({
    userId: v.id("users"),

    // Can be linked to one or multiple commits
    commitIds: v.array(v.id("commits")),

    content: v.string(), // max 280 chars
    tone: v.union(
      v.literal("casual"),
      v.literal("professional"),
      v.literal("excited"),
      v.literal("technical")
    ),

    // Status
    isPosted: v.boolean(),
    postedAt: v.optional(v.number()),
    twitterTweetId: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_posted", ["userId", "isPosted"]),
});
