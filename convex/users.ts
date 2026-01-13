import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
  },
});

export const get = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
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

export const connectGitHub = mutation({
  args: {
    userId: v.id("users"),
    githubId: v.string(),
    githubUsername: v.string(),
    githubAccessToken: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId, ...githubData } = args;
    await ctx.db.patch(userId, githubData);
  },
});

export const disconnectGitHub = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      githubId: undefined,
      githubUsername: undefined,
      githubAccessToken: undefined,
    });
  },
});

export const connectTwitter = mutation({
  args: {
    userId: v.id("users"),
    twitterUsername: v.string(),
    twitterAccessToken: v.string(),
    twitterRefreshToken: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId, ...twitterData } = args;
    await ctx.db.patch(userId, twitterData);
  },
});

export const disconnectTwitter = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      twitterUsername: undefined,
      twitterAccessToken: undefined,
      twitterRefreshToken: undefined,
    });
  },
});
