import { v } from "convex/values";
import { action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

// Internal mutation to store generated tweets
export const storeTweets = internalMutation({
  args: {
    tweets: v.array(
      v.object({
        userId: v.id("users"),
        commitIds: v.array(v.id("commits")),
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
    const insertedIds: string[] = [];

    for (const tweet of args.tweets) {
      const id = await ctx.db.insert("generatedTweets", {
        ...tweet,
        characterCount: tweet.content.length,
        status: "generated",
        generatedAt: Date.now(),
      });
      insertedIds.push(id);
    }

    return insertedIds;
  },
});

// Internal mutation to get commits
export const getCommits = internalMutation({
  args: { commitIds: v.array(v.id("commits")) },
  handler: async (ctx, args) => {
    const commits = await Promise.all(
      args.commitIds.map((id) => ctx.db.get(id))
    );
    return commits.filter(Boolean);
  },
});

const tonePrompts = {
  casual: "Write in a casual, friendly tone like you're chatting with developer friends.",
  professional: "Write in a professional, informative tone suitable for LinkedIn.",
  excited: "Write with enthusiasm and excitement, using energetic language.",
  technical: "Write with technical precision, highlighting specific technologies and implementations.",
};

// Action to generate tweets using Claude
export const generateTweets = action({
  args: {
    userId: v.id("users"),
    commitIds: v.array(v.id("commits")),
    tone: v.union(
      v.literal("casual"),
      v.literal("professional"),
      v.literal("excited"),
      v.literal("technical")
    ),
    productDescription: v.optional(v.string()),
    targetAudience: v.optional(v.string()),
    exampleTweets: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }

    // Get commit details
    const commits = await ctx.runMutation(internal.ai.getCommits, {
      commitIds: args.commitIds,
    });

    if (commits.length === 0) {
      throw new Error("No commits found");
    }

    // Build the prompt
    const commitSummary = commits
      .map(
        (commit: any) =>
          `- ${commit.message.split("\n")[0]} (${commit.totalAdditions}+ / ${commit.totalDeletions}-)`
      )
      .join("\n");

    const filesChanged = commits
      .flatMap((commit: any) =>
        commit.filesChanged.map((f: any) => f.filename)
      )
      .slice(0, 20);

    let contextPrompt = "";
    if (args.productDescription) {
      contextPrompt += `\n\nProduct/Project Description: ${args.productDescription}`;
    }
    if (args.targetAudience) {
      contextPrompt += `\nTarget Audience: ${args.targetAudience}`;
    }
    if (args.exampleTweets && args.exampleTweets.length > 0) {
      contextPrompt += `\n\nExample tweets to match the style:\n${args.exampleTweets.map((t) => `"${t}"`).join("\n")}`;
    }

    const prompt = `You are a skilled developer and content creator who writes engaging tweets about coding progress and updates. Generate 3 different tweet variations for the following commit(s).

${tonePrompts[args.tone]}
${contextPrompt}

Commits:
${commitSummary}

Files changed: ${filesChanged.join(", ")}

Requirements:
- Each tweet must be under 280 characters
- Make them engaging and shareable
- Include relevant hashtags (1-3 per tweet)
- Focus on the value/impact of the changes, not just what was done
- Don't use generic phrases like "Just pushed" or "Working on"
- Be specific about what was built/fixed/improved

Return exactly 3 tweets, one per line, with no numbering or extra formatting.`;

    // Call Claude API
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const content = data.content[0]?.text || "";

    // Parse the tweets (one per line)
    const tweets = content
      .split("\n")
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0 && line.length <= 280)
      .slice(0, 3);

    if (tweets.length === 0) {
      throw new Error("Failed to generate valid tweets");
    }

    // Store tweets in database
    const tweetsToStore = tweets.map((content: string) => ({
      userId: args.userId,
      commitIds: args.commitIds,
      content,
      tone: args.tone,
    }));

    const insertedIds = await ctx.runMutation(internal.ai.storeTweets, {
      tweets: tweetsToStore,
    });

    return {
      tweets: tweets.map((content: string, i: number) => ({
        id: insertedIds[i],
        content,
        characterCount: content.length,
      })),
    };
  },
});
