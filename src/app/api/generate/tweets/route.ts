import { NextRequest, NextResponse } from "next/server";

interface Commit {
  sha: string;
  message: string;
  additions: number;
  deletions: number;
  filesChanged: number;
  repositoryName?: string;
}

interface UserVoiceSettings {
  voiceTone: "casual" | "professional" | "excited" | "technical";
  productDescription?: string;
  targetAudience?: string;
  exampleTweets?: string[];
}

const toneDescriptions = {
  casual: "friendly, conversational, uses occasional emojis, approachable",
  professional: "business-like, polished, focused, clear and concise",
  excited: "enthusiastic, energetic, uses caps and exclamation marks",
  technical: "developer-focused, detailed, mentions specific technologies",
};

function buildPrompt(
  commits: Commit[],
  voiceSettings: UserVoiceSettings,
  tone: string
): string {
  const commitSummary = commits
    .map(
      (c) =>
        `- ${c.message} (${c.repositoryName || "repo"}: +${c.additions}/-${c.deletions}, ${c.filesChanged} files)`
    )
    .join("\n");

  let prompt = `You are a tweet writer for an indie hacker building in public. Generate a tweet about the following commit(s):

${commitSummary}

Tone: ${tone} (${toneDescriptions[tone as keyof typeof toneDescriptions]})
`;

  if (voiceSettings.productDescription) {
    prompt += `\nProduct context: ${voiceSettings.productDescription}`;
  }

  if (voiceSettings.targetAudience) {
    prompt += `\nTarget audience: ${voiceSettings.targetAudience}`;
  }

  if (voiceSettings.exampleTweets && voiceSettings.exampleTweets.length > 0) {
    prompt += `\n\nExample tweets from this user to match their voice:\n${voiceSettings.exampleTweets.join("\n")}`;
  }

  prompt += `

Requirements:
- Maximum 280 characters (this is Twitter's limit)
- Be authentic and engaging
- Focus on the value/impact of the change
- Don't use hashtags unless they feel natural
- Match the specified tone

Return ONLY the tweet text, nothing else.`;

  return prompt;
}

async function generateWithAnthropic(prompt: string): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY || "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
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
    throw new Error(`Anthropic API error: ${error}`);
  }

  const data = await response.json();
  return data.content[0].text.trim();
}

async function generateWithOpenAI(prompt: string): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      max_tokens: 300,
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
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { commits, voiceSettings } = body as {
      commits: Commit[];
      voiceSettings?: UserVoiceSettings;
    };

    if (!commits || commits.length === 0) {
      return NextResponse.json(
        { error: "No commits provided" },
        { status: 400 }
      );
    }

    const defaultVoiceSettings: UserVoiceSettings = {
      voiceTone: "casual",
      ...voiceSettings,
    };

    // Generate tweets for each tone
    const tones = ["casual", "professional", "excited", "technical"] as const;
    const tweets = [];

    for (const tone of tones) {
      const prompt = buildPrompt(commits, defaultVoiceSettings, tone);

      let tweetContent: string;

      // Try Anthropic first, fall back to OpenAI
      if (process.env.ANTHROPIC_API_KEY) {
        try {
          tweetContent = await generateWithAnthropic(prompt);
        } catch (error) {
          console.error("Anthropic error, falling back to OpenAI:", error);
          if (process.env.OPENAI_API_KEY) {
            tweetContent = await generateWithOpenAI(prompt);
          } else {
            throw new Error("No AI provider available");
          }
        }
      } else if (process.env.OPENAI_API_KEY) {
        tweetContent = await generateWithOpenAI(prompt);
      } else {
        // Demo mode - return mock tweets
        tweetContent = getMockTweet(commits, tone);
      }

      // Ensure tweet is within limit
      if (tweetContent.length > 280) {
        tweetContent = tweetContent.slice(0, 277) + "...";
      }

      tweets.push({
        content: tweetContent,
        tone,
      });
    }

    return NextResponse.json({ tweets });
  } catch (error) {
    console.error("Error generating tweets:", error);
    return NextResponse.json(
      { error: "Failed to generate tweets" },
      { status: 500 }
    );
  }
}

function getMockTweet(
  commits: Commit[],
  tone: "casual" | "professional" | "excited" | "technical"
): string {
  const commit = commits[0];
  const message = commit.message;

  const mockTweets = {
    casual: `Just shipped: ${message.slice(0, 100)}! Been working on this for a while. What do you think?`,
    professional: `Released: ${message.slice(0, 100)}. This update improves the overall user experience.`,
    excited: `IT'S LIVE! ${message.slice(0, 80).toUpperCase()}! So excited to finally ship this!`,
    technical: `Deployed ${message.slice(0, 80)}. ${commit.additions} additions, ${commit.deletions} deletions across ${commit.filesChanged} files.`,
  };

  return mockTweets[tone];
}
