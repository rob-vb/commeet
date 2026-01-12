import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get generated tweets for a user
export const getByUser = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
    isPosted: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let tweets;

    if (args.isPosted !== undefined) {
      tweets = await ctx.db
        .query("generatedTweets")
        .withIndex("by_posted", (q) =>
          q.eq("userId", args.userId).eq("isPosted", args.isPosted!)
        )
        .order("desc")
        .collect();
    } else {
      tweets = await ctx.db
        .query("generatedTweets")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .order("desc")
        .collect();
    }

    if (args.limit) {
      tweets = tweets.slice(0, args.limit);
    }

    return tweets;
  },
});

// Get tweets by commit IDs
export const getByCommits = query({
  args: { commitIds: v.array(v.id("commits")) },
  handler: async (ctx, args) => {
    const allTweets = await ctx.db.query("generatedTweets").collect();

    // Filter tweets that contain any of the provided commit IDs
    return allTweets.filter((tweet) =>
      tweet.commitIds.some((id) => args.commitIds.includes(id))
    );
  },
});

// Save generated tweets
export const save = mutation({
  args: {
    userId: v.id("users"),
    commitIds: v.array(v.id("commits")),
    tweets: v.array(
      v.object({
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
    const insertedIds = [];

    for (const tweet of args.tweets) {
      const id = await ctx.db.insert("generatedTweets", {
        userId: args.userId,
        commitIds: args.commitIds,
        content: tweet.content,
        tone: tweet.tone,
        isPosted: false,
      });
      insertedIds.push(id);
    }

    return insertedIds;
  },
});

// Mark tweet as posted
export const markAsPosted = mutation({
  args: {
    tweetId: v.id("generatedTweets"),
    twitterTweetId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.tweetId, {
      isPosted: true,
      postedAt: Date.now(),
      twitterTweetId: args.twitterTweetId,
    });
  },
});

// Update tweet content
export const update = mutation({
  args: {
    tweetId: v.id("generatedTweets"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.tweetId, { content: args.content });
  },
});

// Delete tweet
export const remove = mutation({
  args: { tweetId: v.id("generatedTweets") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.tweetId);
  },
});
