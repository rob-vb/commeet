"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  GitCommit,
  Sparkles,
  Copy,
  Send,
  RefreshCw,
  Check,
  Edit2,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

// Mock data - will be replaced with actual data
const mockCommits = [
  {
    _id: "1",
    sha: "abc123def456",
    message: "feat: add user authentication with OAuth",
    author: "johndoe",
    committedAt: Date.now() - 1000 * 60 * 30,
    additions: 127,
    deletions: 34,
    repository: { name: "johndoe/my-saas-app" },
  },
  {
    _id: "5",
    sha: "mno345pqr678",
    message: "feat: add dark mode support with theme toggle",
    author: "johndoe",
    committedAt: Date.now() - 1000 * 60 * 60 * 48,
    additions: 234,
    deletions: 45,
    repository: { name: "johndoe/another-project" },
  },
];

const toneLabels = {
  casual: "Casual",
  professional: "Professional",
  excited: "Excited",
  technical: "Technical",
} as const;

type Tone = keyof typeof toneLabels;

interface GeneratedTweet {
  id: string;
  content: string;
  tone: Tone;
  isEditing: boolean;
}

function CharacterCounter({ count }: { count: number }) {
  const maxLength = 280;
  const remaining = maxLength - count;
  const isWarning = remaining <= 20 && remaining > 0;
  const isError = remaining < 0;

  return (
    <span
      className={`text-xs ${
        isError
          ? "text-destructive"
          : isWarning
          ? "text-yellow-600"
          : "text-muted-foreground"
      }`}
    >
      {remaining}
    </span>
  );
}

export default function GeneratePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const commitIds = searchParams.get("commits")?.split(",") || [];

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTweets, setGeneratedTweets] = useState<GeneratedTweet[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Get selected commits from mock data
  const selectedCommits = mockCommits.filter((c) => commitIds.includes(c._id));

  const generateTweets = async () => {
    setIsGenerating(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Mock generated tweets
    const mockTweets: GeneratedTweet[] = [
      {
        id: "tweet1",
        content:
          "Just shipped OAuth authentication! Users can now sign in with their favorite providers. Building auth from scratch is a pain, but so satisfying when it works.",
        tone: "casual",
        isEditing: false,
      },
      {
        id: "tweet2",
        content:
          "Released user authentication with OAuth support. Enhanced security and streamlined onboarding experience for our users.",
        tone: "professional",
        isEditing: false,
      },
      {
        id: "tweet3",
        content:
          "OAUTH IS LIVE! Finally finished implementing full authentication! This was a big one - users can now sign in securely with multiple providers!",
        tone: "excited",
        isEditing: false,
      },
      {
        id: "tweet4",
        content:
          "Implemented OAuth 2.0 authentication flow with PKCE. Using refresh tokens for persistent sessions. +127 lines of secure auth code.",
        tone: "technical",
        isEditing: false,
      },
    ];

    setGeneratedTweets(mockTweets);
    setIsGenerating(false);
    toast.success("Tweets generated successfully!");
  };

  const copyToClipboard = async (tweet: GeneratedTweet) => {
    await navigator.clipboard.writeText(tweet.content);
    setCopiedId(tweet.id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleEdit = (tweetId: string) => {
    setGeneratedTweets((prev) =>
      prev.map((t) =>
        t.id === tweetId ? { ...t, isEditing: !t.isEditing } : t
      )
    );
  };

  const updateContent = (tweetId: string, content: string) => {
    setGeneratedTweets((prev) =>
      prev.map((t) => (t.id === tweetId ? { ...t, content } : t))
    );
  };

  if (commitIds.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Generate Tweets</h1>
          <p className="text-muted-foreground">
            No commits selected. Go back and select some commits first.
          </p>
        </div>
        <Button asChild>
          <Link href="/commits">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Commits
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Generate Tweets</h1>
          <p className="text-muted-foreground">
            Generate AI-powered tweets from your selected commits
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/commits">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Commits
          </Link>
        </Button>
      </div>

      {/* Selected Commits */}
      <Card>
        <CardHeader>
          <CardTitle>Selected Commits</CardTitle>
          <CardDescription>
            {selectedCommits.length} commit{selectedCommits.length !== 1 ? "s" : ""}{" "}
            selected for tweet generation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {selectedCommits.map((commit) => (
              <div
                key={commit._id}
                className="flex items-start gap-4 rounded-lg border p-3"
              >
                <GitCommit className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium leading-none truncate">
                    {commit.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {commit.repository.name}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground">
                  <span className="text-green-600">+{commit.additions}</span>{" "}
                  <span className="text-red-600">-{commit.deletions}</span>
                </div>
              </div>
            ))}
          </div>
          <Button
            className="w-full mt-4 gap-2"
            onClick={generateTweets}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate Tweets
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Tweets */}
      {generatedTweets.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Generated Tweets</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={generateTweets}
              disabled={isGenerating}
              className="gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${isGenerating ? "animate-spin" : ""}`}
              />
              Regenerate
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {generatedTweets.map((tweet) => (
              <Card key={tweet.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">{toneLabels[tweet.tone]}</Badge>
                    <CharacterCounter count={tweet.content.length} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {tweet.isEditing ? (
                    <Textarea
                      value={tweet.content}
                      onChange={(e) => updateContent(tweet.id, e.target.value)}
                      className="min-h-[100px] resize-none"
                      maxLength={300}
                    />
                  ) : (
                    <p className="text-sm">{tweet.content}</p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => copyToClipboard(tweet)}
                    >
                      {copiedId === tweet.id ? (
                        <>
                          <Check className="h-4 w-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleEdit(tweet.id)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button size="sm" className="flex-1 gap-2">
                      <Send className="h-4 w-4" />
                      Post
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
