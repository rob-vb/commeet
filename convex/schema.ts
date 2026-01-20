import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    // Better Auth link
    betterAuthId: v.string(),

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
    .index("by_better_auth_id", ["betterAuthId"])
    .index("by_github_id", ["githubId"])
    .index("by_stripe_customer_id", ["stripeCustomerId"]),

  repositories: defineTable({
    userId: v.id("users"),

    // GitHub Data
    githubId: v.number(),
    name: v.string(),
    fullName: v.string(),
    description: v.optional(v.string()),
    isPrivate: v.boolean(),
    defaultBranch: v.string(),
    url: v.string(),

    // Sync Status
    isActive: v.boolean(),
    lastSyncedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_github_id", ["githubId"])
    .index("by_user_and_active", ["userId", "isActive"]),

  commits: defineTable({
    repositoryId: v.id("repositories"),
    userId: v.id("users"),

    // Git Data
    sha: v.string(),
    message: v.string(),
    authorName: v.string(),
    authorEmail: v.string(),
    committedAt: v.number(),
    url: v.string(),

    // File Changes
    filesChanged: v.array(
      v.object({
        filename: v.string(),
        status: v.string(),
        additions: v.number(),
        deletions: v.number(),
      })
    ),

    // Stats
    totalAdditions: v.number(),
    totalDeletions: v.number(),
  })
    .index("by_repository", ["repositoryId"])
    .index("by_user", ["userId"])
    .index("by_sha", ["sha"])
    .index("by_committed_at", ["committedAt"]),

  generatedTweets: defineTable({
    userId: v.id("users"),
    commitIds: v.array(v.id("commits")),

    // Tweet Content
    content: v.string(),
    tone: v.union(
      v.literal("casual"),
      v.literal("professional"),
      v.literal("excited"),
      v.literal("technical")
    ),
    characterCount: v.number(),

    // Status
    status: v.union(
      v.literal("generated"),
      v.literal("edited"),
      v.literal("posted"),
      v.literal("discarded")
    ),
    postedAt: v.optional(v.number()),
    twitterPostId: v.optional(v.string()),

    // Metadata
    generatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_user_and_status", ["userId", "status"]),
});
