import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get user by email
export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
  },
});

// Get user by ID
export const getById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

// Get user stats
export const getStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const repositories = await ctx.db
      .query("repositories")
      .withIndex("by_user_active", (q) =>
        q.eq("userId", args.userId).eq("isActive", true)
      )
      .collect();

    const commits = await ctx.db
      .query("commits")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const generatedTweets = await ctx.db
      .query("generatedTweets")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const postedTweets = generatedTweets.filter((t) => t.isPosted);

    return {
      totalRepositories: repositories.length,
      totalCommits: commits.length,
      tweetsGenerated: generatedTweets.length,
      tweetsPosted: postedTweets.length,
    };
  },
});

// Create a new user
export const create = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (existingUser) {
      return existingUser._id;
    }

    return await ctx.db.insert("users", {
      email: args.email,
      name: args.name,
      image: args.image,
      plan: "free",
    });
  },
});

// Update voice settings
export const updateVoiceSettings = mutation({
  args: {
    userId: v.id("users"),
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
  },
  handler: async (ctx, args) => {
    const { userId, ...settings } = args;
    await ctx.db.patch(userId, settings);
  },
});

// Connect GitHub
export const connectGitHub = mutation({
  args: {
    userId: v.id("users"),
    githubId: v.string(),
    githubAccessToken: v.string(),
    githubUsername: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId, ...githubData } = args;
    await ctx.db.patch(userId, githubData);
  },
});

// Disconnect GitHub
export const disconnectGitHub = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      githubId: undefined,
      githubAccessToken: undefined,
      githubUsername: undefined,
    });
  },
});

// Connect Twitter
export const connectTwitter = mutation({
  args: {
    userId: v.id("users"),
    twitterAccessToken: v.string(),
    twitterRefreshToken: v.string(),
    twitterUsername: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId, ...twitterData } = args;
    await ctx.db.patch(userId, twitterData);
  },
});

// Disconnect Twitter
export const disconnectTwitter = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      twitterAccessToken: undefined,
      twitterRefreshToken: undefined,
      twitterUsername: undefined,
    });
  },
});

// Update Stripe info
export const updateStripeInfo = mutation({
  args: {
    userId: v.id("users"),
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    plan: v.optional(
      v.union(v.literal("free"), v.literal("pro"), v.literal("builder"))
    ),
    planExpiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId, ...stripeData } = args;
    await ctx.db.patch(userId, stripeData);
  },
});
