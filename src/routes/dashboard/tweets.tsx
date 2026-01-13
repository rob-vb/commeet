import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "~/lib/convex";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  MessageSquare,
  Copy,
  RefreshCw,
  Check,
  Clock,
  Edit2,
  Trash2,
  Sparkles,
  Loader2,
} from "lucide-react";

type SearchParams = {
  commits?: string;
};

export const Route = createFileRoute("/dashboard/tweets")({
  component: TweetsPage,
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    commits: search.commits as string | undefined,
  }),
});

function TweetsPage() {
  const search = useSearch({ from: "/dashboard/tweets" });
  const commitIdsFromUrl = search.commits?.split(",").filter(Boolean) ?? [];

  const [generating, setGenerating] = useState(false);
  const [tone, setTone] = useState<
    "casual" | "professional" | "excited" | "technical"
  >("casual");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  // Get current user
  const userWithAccounts = useQuery(api.auth.getCurrentUserWithAccounts);

  // Get tweets
  const allTweets = useQuery(
    api.tweets.listByUser,
    userWithAccounts?.user?.id
      ? { userId: userWithAccounts.user.id as any }
      : "skip"
  );

  // Actions
  const generateTweets = useAction(api.ai.generateTweets);
  const updateTweet = useMutation(api.tweets.update);
  const deleteTweet = useMutation(api.tweets.remove);

  const toneColors = {
    casual: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    professional:
      "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    excited:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    technical:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  };

  const statusIcons = {
    generated: <Clock className="h-3 w-3" />,
    edited: <Edit2 className="h-3 w-3" />,
    posted: <Check className="h-3 w-3" />,
    discarded: <Trash2 className="h-3 w-3" />,
  };

  const handleGenerate = async () => {
    if (!userWithAccounts?.user?.id || commitIdsFromUrl.length === 0) return;
    setGenerating(true);

    try {
      await generateTweets({
        userId: userWithAccounts.user.id as any,
        commitIds: commitIdsFromUrl as any[],
        tone,
      });
    } catch (error) {
      console.error("Failed to generate tweets:", error);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async (id: string, content: string) => {
    await navigator.clipboard.writeText(content);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSaveEdit = async (id: string) => {
    await updateTweet({ id: id as any, content: editContent });
    setEditingId(null);
    setEditContent("");
  };

  const handleDelete = async (id: string) => {
    await deleteTweet({ id: id as any });
  };

  // Auto-generate if commits are provided
  useEffect(() => {
    if (
      commitIdsFromUrl.length > 0 &&
      userWithAccounts?.user?.id &&
      !generating
    ) {
      // Check if we already have tweets for these commits
      const hasExisting = allTweets?.some((t) =>
        commitIdsFromUrl.every((id) => t.commitIds.includes(id as any))
      );
      if (!hasExisting && allTweets !== undefined) {
        handleGenerate();
      }
    }
  }, [commitIdsFromUrl.join(","), userWithAccounts?.user?.id, allTweets]);

  const generatedTweets =
    allTweets?.filter((t) => t.status === "generated" || t.status === "edited") ?? [];
  const postedTweets = allTweets?.filter((t) => t.status === "posted") ?? [];

  if (!userWithAccounts) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Generated Tweets</h1>
        <p className="text-muted-foreground">
          View and manage your AI-generated tweets
        </p>
      </div>

      {/* Generation controls when commits are selected */}
      {commitIdsFromUrl.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Generate New Tweets</CardTitle>
            <CardDescription>
              {commitIdsFromUrl.length} commit(s) selected
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <Select
              value={tone}
              onValueChange={(v) =>
                setTone(v as "casual" | "professional" | "excited" | "technical")
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select tone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="excited">Excited</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="gap-2"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {generating ? "Generating..." : "Generate Tweets"}
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All ({allTweets?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="generated">
            Ready ({generatedTweets.length})
          </TabsTrigger>
          <TabsTrigger value="posted">Posted ({postedTweets.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {!allTweets ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : allTweets.length === 0 ? (
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
                  <Link to="/dashboard/commits">Browse Commits</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <TweetGrid
              tweets={allTweets}
              toneColors={toneColors}
              statusIcons={statusIcons}
              editingId={editingId}
              editContent={editContent}
              copied={copied}
              setEditingId={setEditingId}
              setEditContent={setEditContent}
              handleCopy={handleCopy}
              handleSaveEdit={handleSaveEdit}
              handleDelete={handleDelete}
            />
          )}
        </TabsContent>

        <TabsContent value="generated" className="space-y-4">
          {generatedTweets.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Tweets ready to be posted will appear here.
            </p>
          ) : (
            <TweetGrid
              tweets={generatedTweets}
              toneColors={toneColors}
              statusIcons={statusIcons}
              editingId={editingId}
              editContent={editContent}
              copied={copied}
              setEditingId={setEditingId}
              setEditContent={setEditContent}
              handleCopy={handleCopy}
              handleSaveEdit={handleSaveEdit}
              handleDelete={handleDelete}
            />
          )}
        </TabsContent>

        <TabsContent value="posted" className="space-y-4">
          {postedTweets.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Your posted tweets will appear here.
            </p>
          ) : (
            <TweetGrid
              tweets={postedTweets}
              toneColors={toneColors}
              statusIcons={statusIcons}
              editingId={editingId}
              editContent={editContent}
              copied={copied}
              setEditingId={setEditingId}
              setEditContent={setEditContent}
              handleCopy={handleCopy}
              handleSaveEdit={handleSaveEdit}
              handleDelete={handleDelete}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TweetGrid({
  tweets,
  toneColors,
  statusIcons,
  editingId,
  editContent,
  copied,
  setEditingId,
  setEditContent,
  handleCopy,
  handleSaveEdit,
  handleDelete,
}: {
  tweets: any[];
  toneColors: Record<string, string>;
  statusIcons: Record<string, JSX.Element>;
  editingId: string | null;
  editContent: string;
  copied: string | null;
  setEditingId: (id: string | null) => void;
  setEditContent: (content: string) => void;
  handleCopy: (id: string, content: string) => void;
  handleSaveEdit: (id: string) => void;
  handleDelete: (id: string) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {tweets.map((tweet) => (
        <Card key={tweet._id}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className={toneColors[tweet.tone]}>{tweet.tone}</Badge>
                <Badge variant="outline" className="gap-1">
                  {statusIcons[tweet.status]}
                  {tweet.status}
                </Badge>
              </div>
              <span
                className={`text-xs ${tweet.characterCount > 280 ? "text-red-500" : "text-muted-foreground"}`}
              >
                {tweet.characterCount}/280
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {editingId === tweet._id ? (
              <>
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[100px] resize-none"
                  maxLength={280}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingId(null)}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" onClick={() => handleSaveEdit(tweet._id)}>
                    Save
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Textarea
                  value={tweet.content}
                  readOnly
                  className="min-h-[100px] resize-none bg-muted/50"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {new Date(tweet.generatedAt).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1"
                      onClick={() => {
                        setEditingId(tweet._id);
                        setEditContent(tweet.content);
                      }}
                    >
                      <Edit2 className="h-3 w-3" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1"
                      onClick={() => handleCopy(tweet._id, tweet.content)}
                    >
                      {copied === tweet._id ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      {copied === tweet._id ? "Copied!" : "Copy"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(tweet._id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
