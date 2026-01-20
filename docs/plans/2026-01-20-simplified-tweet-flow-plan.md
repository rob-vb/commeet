# Simplified Tweet Flow Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign Commeet's dashboard to a streamlined "today's commits → generate one tweet → share" workflow.

**Architecture:** Replace multi-page flow with single dashboard that auto-fetches today's commits, lets user generate one AI-summarized tweet, and share via Twitter web intent. Remove unused Twitter API integration, preset tones, and tweet status tracking.

**Tech Stack:** Convex (backend), React/TanStack (frontend), Claude API (AI), Tailwind/shadcn (UI)

---

### Task 1: Simplify Schema

**Files:**
- Modify: `convex/schema.ts`

**Step 1: Update generatedTweets table**

Remove status tracking fields, simplify tone to optional string:

```typescript
generatedTweets: defineTable({
  userId: v.id("users"),
  commitIds: v.array(v.id("commits")),
  content: v.string(),
  tone: v.optional(v.string()), // Free-form tone instruction, not enum
  characterCount: v.number(),
  generatedAt: v.number(),
})
  .index("by_user", ["userId"]),
```

**Step 2: Update users table**

Remove Twitter and voiceTone fields:

```typescript
users: defineTable({
  // Better Auth link
  betterAuthId: v.string(),

  // Auth
  email: v.string(),
  name: v.optional(v.string()),
  image: v.optional(v.string()),

  // GitHub Connection
  githubId: v.optional(v.string()),
  githubAccessToken: v.optional(v.string()),
  githubUsername: v.optional(v.string()),

  // Voice Settings (kept for AI context)
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
```

**Step 3: Commit**

```bash
git add convex/schema.ts
git commit -m "refactor: simplify schema - remove twitter fields and tweet status tracking"
```

---

### Task 2: Add getByDateRange Query to Commits

**Files:**
- Modify: `convex/commits.ts`

**Step 1: Add the query**

```typescript
export const getByDateRange = query({
  args: {
    userId: v.id("users"),
    startDate: v.number(), // Unix timestamp
    endDate: v.number(),   // Unix timestamp
  },
  handler: async (ctx, args) => {
    const commits = await ctx.db
      .query("commits")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) =>
        q.and(
          q.gte(q.field("committedAt"), args.startDate),
          q.lte(q.field("committedAt"), args.endDate)
        )
      )
      .order("desc")
      .collect();

    return commits;
  },
});
```

**Step 2: Add getTodayCommits convenience query**

```typescript
export const getToday = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000 - 1;

    const commits = await ctx.db
      .query("commits")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) =>
        q.and(
          q.gte(q.field("committedAt"), startOfDay),
          q.lte(q.field("committedAt"), endOfDay)
        )
      )
      .order("desc")
      .collect();

    return commits;
  },
});
```

**Step 3: Commit**

```bash
git add convex/commits.ts
git commit -m "feat: add getByDateRange and getToday queries for commits"
```

---

### Task 3: Update AI Tweet Generation

**Files:**
- Modify: `convex/ai.ts`

**Step 1: Replace generateTweets with generateTweet (singular)**

The new function generates ONE tweet summarizing all commits:

```typescript
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
    if (content.type !== "text") {
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
    });

    return { id: tweetId, content: tweet, characterCount: tweet.length };
  },
});
```

**Step 2: Commit**

```bash
git add convex/ai.ts
git commit -m "refactor: update AI to generate single summarized tweet"
```

---

### Task 4: Simplify Tweets Module

**Files:**
- Modify: `convex/tweets.ts`

**Step 1: Rewrite with simplified functions**

```typescript
import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

export const listByUser = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("generatedTweets")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc");

    if (args.limit) {
      return await query.take(args.limit);
    }
    return await query.collect();
  },
});

export const get = query({
  args: { id: v.id("generatedTweets") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Internal mutation for AI action to use
export const createInternal = internalMutation({
  args: {
    userId: v.id("users"),
    commitIds: v.array(v.id("commits")),
    content: v.string(),
    tone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("generatedTweets", {
      ...args,
      characterCount: args.content.length,
      generatedAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("generatedTweets"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      content: args.content,
      characterCount: args.content.length,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("generatedTweets") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
```

**Step 2: Commit**

```bash
git add convex/tweets.ts
git commit -m "refactor: simplify tweets module - remove status tracking"
```

---

### Task 5: Add Internal Commits Query

**Files:**
- Modify: `convex/commits.ts`

**Step 1: Add internal query for AI action**

```typescript
import { internalQuery } from "./_generated/server";

export const getInternal = internalQuery({
  args: { id: v.id("commits") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
```

**Step 2: Commit**

```bash
git add convex/commits.ts
git commit -m "feat: add internal commits query for AI action"
```

---

### Task 6: Add Internal Usage Query

**Files:**
- Modify: `convex/usage.ts`

**Step 1: Add internal query variant**

```typescript
export const canGenerateTweetsInternal = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return { allowed: false, reason: "User not found" };

    const limit = PLAN_LIMITS[user.plan].generationsPerMonth;
    if (limit === -1) return { allowed: true };

    const month = new Date().toISOString().slice(0, 7);
    const stats = await ctx.db
      .query("usageStats")
      .withIndex("by_user_and_month", (q) =>
        q.eq("userId", args.userId).eq("month", month)
      )
      .unique();

    const used = stats?.tweetGenerations ?? 0;
    if (used >= limit) {
      return {
        allowed: false,
        reason: `You've used ${used}/${limit} tweet generations this month. Upgrade for more.`,
      };
    }

    return { allowed: true };
  },
});
```

**Step 2: Commit**

```bash
git add convex/usage.ts
git commit -m "feat: add internal usage query for AI action"
```

---

### Task 7: Simplify Users Module

**Files:**
- Modify: `convex/users.ts`

**Step 1: Remove Twitter and voiceTone functions**

Remove these functions:
- `updateVoiceSettings` (or simplify to remove voiceTone)
- `connectTwitter`
- `disconnectTwitter`

Update `updateVoiceSettings` to:

```typescript
export const updateVoiceSettings = mutation({
  args: {
    userId: v.id("users"),
    productDescription: v.optional(v.string()),
    targetAudience: v.optional(v.string()),
    exampleTweets: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { userId, ...settings } = args;
    await ctx.db.patch(userId, settings);
  },
});
```

**Step 2: Commit**

```bash
git add convex/users.ts
git commit -m "refactor: remove twitter functions and simplify voice settings"
```

---

### Task 8: Rewrite Dashboard Page

**Files:**
- Modify: `src/routes/dashboard/index.tsx`

**Step 1: Complete rewrite**

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "~/lib/convex";
import { useSyncUser } from "~/hooks/use-sync-user";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import {
  GitCommit,
  Loader2,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Calendar,
} from "lucide-react";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardPage,
});

function DashboardPage() {
  const { appUser, isLoading } = useSyncUser();

  // Date range state
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [useCustomRange, setUseCustomRange] = useState(false);

  // Selection state
  const [selectedCommits, setSelectedCommits] = useState<Set<string>>(new Set());

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [generatedTweet, setGeneratedTweet] = useState<string | null>(null);
  const [toneInstruction, setToneInstruction] = useState("");
  const [copied, setCopied] = useState(false);

  // Fetch today's commits
  const todayCommits = useQuery(
    api.commits.getToday,
    appUser?._id ? { userId: appUser._id } : "skip"
  );

  // Fetch custom range commits
  const customCommits = useQuery(
    api.commits.getByDateRange,
    appUser?._id && useCustomRange && startDate && endDate
      ? {
          userId: appUser._id,
          startDate: new Date(startDate).getTime(),
          endDate: new Date(endDate).setHours(23, 59, 59, 999),
        }
      : "skip"
  );

  const commits = useCustomRange ? customCommits : todayCommits;
  const generateTweet = useAction(api.ai.generateTweet);

  // Initialize selection when commits load
  const initializeSelection = () => {
    if (commits && selectedCommits.size === 0) {
      setSelectedCommits(new Set(commits.map((c) => c._id)));
    }
  };

  if (commits && selectedCommits.size === 0 && commits.length > 0) {
    initializeSelection();
  }

  const handleToggleCommit = (commitId: string) => {
    const newSelection = new Set(selectedCommits);
    if (newSelection.has(commitId)) {
      newSelection.delete(commitId);
    } else {
      newSelection.add(commitId);
    }
    setSelectedCommits(newSelection);
  };

  const handleSelectAll = () => {
    if (commits) {
      setSelectedCommits(new Set(commits.map((c) => c._id)));
    }
  };

  const handleGenerate = async () => {
    if (!appUser?._id || selectedCommits.size === 0) return;
    setGenerating(true);
    setGeneratedTweet(null);

    try {
      const result = await generateTweet({
        userId: appUser._id,
        commitIds: Array.from(selectedCommits) as any[],
        toneInstruction: toneInstruction || undefined,
      });
      setGeneratedTweet(result.content);
    } catch (error) {
      console.error("Failed to generate tweet:", error);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (generatedTweet) {
      await navigator.clipboard.writeText(generatedTweet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = () => {
    if (generatedTweet) {
      const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(generatedTweet)}`;
      window.open(url, "_blank");
    }
  };

  const handleSearchRange = () => {
    setUseCustomRange(true);
    setSelectedCommits(new Set());
    setGeneratedTweet(null);
  };

  const handleBackToToday = () => {
    setUseCustomRange(false);
    setSelectedCommits(new Set());
    setGeneratedTweet(null);
    setStartDate("");
    setEndDate("");
  };

  if (isLoading || !appUser) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          {useCustomRange ? "Commits" : `Today, ${today}`}
        </h1>
        <p className="text-muted-foreground">
          {commits === undefined
            ? "Loading commits..."
            : commits.length === 0
              ? "No commits found"
              : `${commits.length} commit${commits.length === 1 ? "" : "s"} found`}
        </p>
      </div>

      {/* Generated Tweet Section */}
      {generatedTweet && (
        <Card className="mb-6 border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5" />
              Your tweet is ready
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={generatedTweet}
              onChange={(e) => setGeneratedTweet(e.target.value)}
              className="min-h-[100px] bg-white dark:bg-gray-950"
              maxLength={280}
            />
            <div className="flex items-center justify-between">
              <span
                className={`text-sm ${generatedTweet.length > 280 ? "text-red-500" : "text-muted-foreground"}`}
              >
                {generatedTweet.length}/280
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  {copied ? (
                    <Check className="h-4 w-4 mr-1" />
                  ) : (
                    <Copy className="h-4 w-4 mr-1" />
                  )}
                  {copied ? "Copied!" : "Copy"}
                </Button>
                <Button size="sm" onClick={handleShare}>
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Share to 𝕏
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t space-y-3">
              <div className="space-y-2">
                <Label htmlFor="tone" className="text-sm">
                  Regenerate with different tone (optional)
                </Label>
                <Input
                  id="tone"
                  placeholder="e.g., more technical, add humor, sound excited"
                  value={toneInstruction}
                  onChange={(e) => setToneInstruction(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                onClick={handleGenerate}
                disabled={generating}
              >
                {generating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Regenerate
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Commits List or Empty State */}
      {commits === undefined ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : commits.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No commits found</CardTitle>
            <CardDescription>
              {useCustomRange
                ? "No commits in this date range. Try a different range."
                : "You haven't made any commits today. Select a date range to find older commits."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <Button onClick={handleSearchRange} disabled={!startDate || !endDate}>
                <Calendar className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
            {useCustomRange && (
              <Button variant="link" onClick={handleBackToToday} className="p-0">
                ← Back to today
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Selection Header */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {selectedCommits.size} of {commits.length} selected
            </p>
            <Button variant="link" onClick={handleSelectAll} className="p-0 h-auto">
              Select all
            </Button>
          </div>

          {/* Commits */}
          <div className="space-y-2">
            {commits.map((commit) => (
              <Card
                key={commit._id}
                className={`cursor-pointer transition-colors ${
                  selectedCommits.has(commit._id)
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/50"
                }`}
                onClick={() => handleToggleCommit(commit._id)}
              >
                <CardContent className="flex items-start gap-3 p-4">
                  <Checkbox
                    checked={selectedCommits.has(commit._id)}
                    onCheckedChange={() => handleToggleCommit(commit._id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{commit.message}</p>
                    <p className="text-sm text-muted-foreground">
                      {commit.filesChanged.length} file
                      {commit.filesChanged.length === 1 ? "" : "s"} · +
                      {commit.totalAdditions} -{commit.totalDeletions}
                    </p>
                  </div>
                  <GitCommit className="h-4 w-4 text-muted-foreground shrink-0" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Generate Button */}
          {!generatedTweet && (
            <Button
              className="w-full"
              size="lg"
              onClick={handleGenerate}
              disabled={generating || selectedCommits.size === 0}
            >
              {generating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Generate Tweet for {selectedCommits.size} commit
              {selectedCommits.size === 1 ? "" : "s"}
            </Button>
          )}

          {/* Date Range Controls */}
          {!generatedTweet && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-3">
                Want to include older commits?
              </p>
              <div className="flex gap-4 items-end">
                <div className="space-y-2">
                  <Label htmlFor="startDate2">Start date</Label>
                  <Input
                    id="startDate2"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate2">End date</Label>
                  <Input
                    id="endDate2"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={handleSearchRange}
                  disabled={!startDate || !endDate}
                >
                  Search
                </Button>
              </div>
              {useCustomRange && (
                <Button
                  variant="link"
                  onClick={handleBackToToday}
                  className="p-0 mt-2"
                >
                  ← Back to today
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/routes/dashboard/index.tsx
git commit -m "feat: rewrite dashboard with streamlined tweet generation flow"
```

---

### Task 9: Update Sidebar Navigation

**Files:**
- Modify: `src/routes/dashboard.tsx`

**Step 1: Remove Commits and Tweets links**

Find the sidebar navigation section and update to only include:
- Dashboard
- Repositories
- Settings

Remove any NavLink or Link components for `/dashboard/commits` and `/dashboard/tweets`.

**Step 2: Commit**

```bash
git add src/routes/dashboard.tsx
git commit -m "refactor: simplify sidebar - remove commits and tweets pages"
```

---

### Task 10: Delete Unused Pages

**Files:**
- Delete: `src/routes/dashboard/commits.tsx`
- Delete: `src/routes/dashboard/tweets.tsx`

**Step 1: Delete files**

```bash
rm src/routes/dashboard/commits.tsx
rm src/routes/dashboard/tweets.tsx
```

**Step 2: Commit**

```bash
git add -A
git commit -m "refactor: remove unused commits and tweets pages"
```

---

### Task 11: Simplify Settings Page

**Files:**
- Modify: `src/routes/dashboard/settings.tsx`

**Step 1: Remove Voice tab and Twitter connection**

- Remove the "Voice" tab entirely (or keep just productDescription/targetAudience fields under Account)
- Remove Twitter connection section from Connections tab
- Keep: Account, GitHub connection, Billing

**Step 2: Simplify tabs**

Update TabsList to only show:
- Connections (GitHub only)
- Account
- Billing

**Step 3: Commit**

```bash
git add src/routes/dashboard/settings.tsx
git commit -m "refactor: simplify settings - remove voice tab and twitter connection"
```

---

### Task 12: Update PRD Checklist

**Files:**
- Modify: `PRD.md`

**Step 1: Update checklist**

Mark Twitter API integration differently - it's now "Twitter Web Intent" which is complete:

```markdown
## Launch Checklist

- [x] Core authentication flow
- [x] GitHub OAuth integration
- [x] Repository management
- [x] Commit fetching
- [x] AI tweet generation
- [x] Tweet management UI
- [x] Stripe billing integration
- [x] Twitter sharing (web intent)
- [ ] Production deployment
- [ ] Monitoring and error tracking
```

**Step 2: Commit**

```bash
git add PRD.md
git commit -m "docs: update PRD - mark twitter web intent as complete"
```

---

### Task 13: Final Cleanup and Test

**Step 1: Run typecheck**

```bash
npm run typecheck
```

Fix any TypeScript errors that arise from the refactoring.

**Step 2: Run lint**

```bash
npm run lint
```

Fix any lint errors.

**Step 3: Manual testing checklist**

1. Start dev servers: `npx convex dev` and `npm run dev`
2. Log in and verify dashboard shows today's commits
3. Test date range picker with no commits today
4. Select commits and generate tweet
5. Test regenerate with tone instruction
6. Test copy and share to X buttons
7. Verify repositories page still works
8. Verify settings page billing section works

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore: fix any remaining typecheck and lint issues"
```

---

## Summary

| Task | Description |
|------|-------------|
| 1 | Simplify schema - remove twitter fields, tweet status |
| 2 | Add getByDateRange and getToday queries |
| 3 | Update AI to generate single summarized tweet |
| 4 | Simplify tweets module |
| 5 | Add internal commits query |
| 6 | Add internal usage query |
| 7 | Simplify users module |
| 8 | Rewrite dashboard page |
| 9 | Update sidebar navigation |
| 10 | Delete unused pages |
| 11 | Simplify settings page |
| 12 | Update PRD checklist |
| 13 | Final cleanup and test |
