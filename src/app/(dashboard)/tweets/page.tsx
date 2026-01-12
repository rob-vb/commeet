"use client";

import { useState } from "react";
import {
  MessageSquare,
  Copy,
  ExternalLink,
  Trash2,
  Check,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

// Mock data - will be replaced with Convex queries
const mockTweets = [
  {
    _id: "1",
    content:
      "Just shipped OAuth authentication! Users can now sign in with their favorite providers.",
    tone: "casual" as const,
    isPosted: true,
    postedAt: Date.now() - 1000 * 60 * 60 * 2,
    twitterTweetId: "1234567890",
    createdAt: Date.now() - 1000 * 60 * 60 * 3,
  },
  {
    _id: "2",
    content:
      "DARK MODE IS LIVE! The most requested feature is finally here. Try it out!",
    tone: "excited" as const,
    isPosted: true,
    postedAt: Date.now() - 1000 * 60 * 60 * 24,
    twitterTweetId: "1234567891",
    createdAt: Date.now() - 1000 * 60 * 60 * 25,
  },
  {
    _id: "3",
    content:
      "Released user authentication with OAuth support. Enhanced security and streamlined onboarding.",
    tone: "professional" as const,
    isPosted: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 4,
  },
  {
    _id: "4",
    content:
      "Implemented OAuth 2.0 authentication flow with PKCE. Using refresh tokens for persistent sessions.",
    tone: "technical" as const,
    isPosted: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 5,
  },
];

const toneLabels = {
  casual: "Casual",
  professional: "Professional",
  excited: "Excited",
  technical: "Technical",
};

function formatTimeAgo(timestamp: number) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function TweetsPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const postedTweets = mockTweets.filter((t) => t.isPosted);
  const pendingTweets = mockTweets.filter((t) => !t.isPosted);

  const copyToClipboard = async (tweet: (typeof mockTweets)[0]) => {
    await navigator.clipboard.writeText(tweet.content);
    setCopiedId(tweet._id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const TweetCard = ({ tweet }: { tweet: (typeof mockTweets)[0] }) => (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Badge variant="secondary">{toneLabels[tweet.tone]}</Badge>
          <span className="text-xs text-muted-foreground">
            {formatTimeAgo(tweet.createdAt)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm">{tweet.content}</p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-2"
            onClick={() => copyToClipboard(tweet)}
          >
            {copiedId === tweet._id ? (
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
          {tweet.isPosted && tweet.twitterTweetId ? (
            <Button variant="outline" size="sm" asChild>
              <a
                href={`https://twitter.com/i/web/status/${tweet.twitterTweetId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          ) : (
            <>
              <Button size="sm" className="flex-1 gap-2">
                <Send className="h-4 w-4" />
                Post
              </Button>
              <Button variant="outline" size="sm">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Generated Tweets</h1>
        <p className="text-muted-foreground">
          Manage your generated and posted tweets
        </p>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pendingTweets.length})
          </TabsTrigger>
          <TabsTrigger value="posted">Posted ({postedTweets.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingTweets.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <MessageSquare className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">
                  No pending tweets
                </h3>
                <p className="mt-2 text-center text-sm text-muted-foreground max-w-sm">
                  Generate some tweets from your commits to get started.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {pendingTweets.map((tweet) => (
                <TweetCard key={tweet._id} tweet={tweet} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="posted" className="space-y-4">
          {postedTweets.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Send className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">No posted tweets</h3>
                <p className="mt-2 text-center text-sm text-muted-foreground max-w-sm">
                  Post some tweets to see them here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {postedTweets.map((tweet) => (
                <TweetCard key={tweet._id} tweet={tweet} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
