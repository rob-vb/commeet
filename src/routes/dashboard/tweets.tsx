import { createFileRoute } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Textarea } from "~/components/ui/textarea";
import {
  MessageSquare,
  Copy,
  Send,
  RefreshCw,
  Check,
  Clock,
  Edit2,
  Trash2,
} from "lucide-react";

export const Route = createFileRoute("/dashboard/tweets")({
  component: TweetsPage,
});

function TweetsPage() {
  // Placeholder data - will be replaced with real data from Convex
  const tweets: Array<{
    id: string;
    content: string;
    tone: "casual" | "professional" | "excited" | "technical";
    characterCount: number;
    status: "generated" | "edited" | "posted" | "discarded";
    generatedAt: number;
    postedAt?: number;
  }> = [];

  const toneColors = {
    casual: "bg-blue-100 text-blue-800",
    professional: "bg-gray-100 text-gray-800",
    excited: "bg-yellow-100 text-yellow-800",
    technical: "bg-purple-100 text-purple-800",
  };

  const statusIcons = {
    generated: <Clock className="h-3 w-3" />,
    edited: <Edit2 className="h-3 w-3" />,
    posted: <Check className="h-3 w-3" />,
    discarded: <Trash2 className="h-3 w-3" />,
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Generated Tweets</h1>
        <p className="text-muted-foreground">
          View and manage your AI-generated tweets
        </p>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="generated">Generated</TabsTrigger>
          <TabsTrigger value="posted">Posted</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {tweets.length === 0 ? (
            <Card className="mx-auto max-w-md text-center">
              <CardHeader>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <MessageSquare className="h-8 w-8" />
                </div>
                <CardTitle>No Tweets Yet</CardTitle>
                <CardDescription>
                  Select commits and generate tweets to see them here.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="gap-2" asChild>
                  <a href="/dashboard/commits">Browse Commits</a>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {tweets.map((tweet) => (
                <Card key={tweet.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={toneColors[tweet.tone]}>
                          {tweet.tone}
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                          {statusIcons[tweet.status]}
                          {tweet.status}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {tweet.characterCount}/280
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      value={tweet.content}
                      readOnly
                      className="min-h-[100px] resize-none"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {new Date(tweet.generatedAt).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="gap-1">
                          <RefreshCw className="h-3 w-3" />
                          Regenerate
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-1">
                          <Copy className="h-3 w-3" />
                          Copy
                        </Button>
                        <Button size="sm" className="gap-1">
                          <Send className="h-3 w-3" />
                          Post
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="generated" className="space-y-4">
          <p className="text-muted-foreground">
            Tweets waiting to be posted will appear here.
          </p>
        </TabsContent>

        <TabsContent value="posted" className="space-y-4">
          <p className="text-muted-foreground">
            Your posted tweets will appear here.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
