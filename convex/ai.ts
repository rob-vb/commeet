import Anthropic from "@anthropic-ai/sdk";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";

export const generateTweet = action({
  args: {
    userId: v.id("users"),
    commitIds: v.array(v.id("commits")),
    toneInstruction: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check usage limits
    const canGenerate = await ctx.runQuery(internal.usage.canGenerateTweetsInternal, {
      userId: args.userId,
    });
    if (!canGenerate.allowed) {
      throw new Error(canGenerate.reason || "Generation limit reached");
    }

    // Get user for context
    const user = await ctx.runQuery(internal.users.getInternal, {
      id: args.userId,
    });

    // Get commits
    const commits = await Promise.all(
      args.commitIds.map((id) =>
        ctx.runQuery(internal.commits.getInternal, { id })
      )
    );
    const validCommits = commits.filter(Boolean);

    if (validCommits.length === 0) {
      throw new Error("No valid commits found");
    }

    // Build commit summary for AI
    const commitSummary = validCommits
      .map((c) => {
        const files = c!.filesChanged.map((f) => f.filename).join(", ");
        return `- ${c!.message} (files: ${files}, +${c!.totalAdditions}/-${c!.totalDeletions})`;
      })
      .join("\n");

    // Build AI prompt
    const toneGuide = args.toneInstruction
      ? `Tone instruction: ${args.toneInstruction}`
      : "Use a casual, authentic developer voice";

    const contextGuide = user?.productDescription
      ? `Product context: ${user.productDescription}`
      : "";

    const audienceGuide = user?.targetAudience
      ? `Target audience: ${user.targetAudience}`
      : "";

    const prompt = `You are helping a developer share their coding progress on Twitter/X.

Generate ONE tweet (max 280 characters) that summarizes these commits in an engaging way:

${commitSummary}

${contextGuide}
${audienceGuide}
${toneGuide}

Guidelines:
- Be authentic and conversational, not corporate
- Focus on what was built/fixed, not technical git details
- Make it interesting to non-developers too if possible
- Stay under 280 characters
- Don't use hashtags unless they add value
- Emojis are okay but don't overdo it

Return ONLY the tweet text, nothing else.`;

    const anthropic = new Anthropic();
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 150,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (!content || content.type !== "text") {
      throw new Error("Unexpected response type");
    }

    let tweet = content.text.trim();
    // Remove quotes if AI wrapped the tweet in them
    if (tweet.startsWith('"') && tweet.endsWith('"')) {
      tweet = tweet.slice(1, -1);
    }

    // Truncate if somehow over limit
    if (tweet.length > 280) {
      tweet = tweet.slice(0, 277) + "...";
    }

    // Save to database
    const tweetId = await ctx.runMutation(internal.tweets.createInternal, {
      userId: args.userId,
      commitIds: args.commitIds,
      content: tweet,
      tone: args.toneInstruction,
    });

    // Track usage
    await ctx.runMutation(internal.usage.incrementTweetGenerationsInternal, {
      userId: args.userId,
      count: 1,
    });

    return { id: tweetId, content: tweet, characterCount: tweet.length };
  },
});
