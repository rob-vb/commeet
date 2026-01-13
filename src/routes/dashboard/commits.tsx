import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "~/lib/convex";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import {
  GitCommit,
  Search,
  Sparkles,
  RefreshCw,
  Plus,
  Minus,
  Loader2,
  ExternalLink,
} from "lucide-react";

export const Route = createFileRoute("/dashboard/commits")({
  component: CommitsPage,
});

function CommitsPage() {
  const [search, setSearch] = useState("");
  const [selectedCommits, setSelectedCommits] = useState<string[]>([]);
  const [syncing, setSyncing] = useState(false);

  // Get current user
  const userWithAccounts = useQuery(api.auth.getCurrentUserWithAccounts);

  // Get connected repositories
  const repositories = useQuery(
    api.repositories.listActiveByUser,
    userWithAccounts?.user?.id
      ? { userId: userWithAccounts.user.id as any }
      : "skip"
  );

  // Get commits
  const commits = useQuery(
    api.commits.listByUser,
    userWithAccounts?.user?.id
      ? { userId: userWithAccounts.user.id as any, limit: 100 }
      : "skip"
  );

  // Actions
  const fetchCommits = useAction(api.github.fetchGitHubCommits);

  const hasConnectedRepos = (repositories?.length ?? 0) > 0;

  // Create a map of repo IDs to names
  const repoMap = new Map(
    repositories?.map((repo) => [repo._id, repo.name]) ?? []
  );

  const handleSyncCommits = async () => {
    if (!userWithAccounts?.githubAccessToken || !repositories) return;
    setSyncing(true);

    try {
      for (const repo of repositories) {
        await fetchCommits({
          accessToken: userWithAccounts.githubAccessToken,
          userId: userWithAccounts.user!.id as any,
          repositoryId: repo._id,
          repoFullName: repo.fullName,
        });
      }
    } catch (error) {
      console.error("Failed to sync commits:", error);
    } finally {
      setSyncing(false);
    }
  };

  const handleToggleCommit = (commitId: string) => {
    setSelectedCommits((prev) =>
      prev.includes(commitId)
        ? prev.filter((id) => id !== commitId)
        : [...prev, commitId]
    );
  };

  const handleSelectAll = () => {
    setSelectedCommits(filteredCommits.map((c) => c._id));
  };

  const handleDeselectAll = () => {
    setSelectedCommits([]);
  };

  const filteredCommits =
    commits?.filter((commit) =>
      commit.message.toLowerCase().includes(search.toLowerCase())
    ) ?? [];

  if (!userWithAccounts) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Commits</h1>
          <p className="text-muted-foreground">
            Select commits to generate tweets
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasConnectedRepos && (
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleSyncCommits}
              disabled={syncing}
            >
              <RefreshCw
                className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`}
              />
              {syncing ? "Syncing..." : "Sync Commits"}
            </Button>
          )}
          {selectedCommits.length > 0 && (
            <Button className="gap-2" asChild>
              <Link
                to="/dashboard/tweets"
                search={{ commits: selectedCommits.join(",") }}
              >
                <Sparkles className="h-4 w-4" />
                Generate Tweets ({selectedCommits.length})
              </Link>
            </Button>
          )}
        </div>
      </div>

      {!hasConnectedRepos ? (
        <Card className="mx-auto max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <GitCommit className="h-8 w-8" />
            </div>
            <CardTitle>No Repositories Connected</CardTitle>
            <CardDescription>
              Connect a GitHub repository to see your commits here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="gap-2" asChild>
              <Link to="/dashboard/repositories">Connect Repository</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Filters */}
          <div className="mb-6 flex flex-wrap items-center gap-4">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search commits by message..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                Select All
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDeselectAll}>
                Deselect All
              </Button>
            </div>
          </div>

          {/* Commit List */}
          {!commits ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredCommits.length === 0 ? (
            <Card className="text-center">
              <CardContent className="py-12">
                <p className="mb-4 text-muted-foreground">
                  {commits.length === 0
                    ? "No commits found. Click 'Sync Commits' to fetch commits from your connected repositories."
                    : "No commits match your search."}
                </p>
                {commits.length === 0 && (
                  <Button onClick={handleSyncCommits} disabled={syncing}>
                    <RefreshCw
                      className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`}
                    />
                    Sync Now
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredCommits.map((commit) => (
                <Card
                  key={commit._id}
                  className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                    selectedCommits.includes(commit._id)
                      ? "border-primary bg-primary/5"
                      : ""
                  }`}
                  onClick={() => handleToggleCommit(commit._id)}
                >
                  <CardContent className="flex items-start gap-4 py-4">
                    <Checkbox
                      checked={selectedCommits.includes(commit._id)}
                      onCheckedChange={() => handleToggleCommit(commit._id)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="font-medium line-clamp-2">
                            {commit.message.split("\n")[0]}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                              {repoMap.get(commit.repositoryId) || "Unknown"}
                            </Badge>
                            <span>{commit.authorName}</span>
                            <span>•</span>
                            <span>
                              {new Date(commit.committedAt).toLocaleDateString()}
                            </span>
                            <a
                              href={commit.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 hover:text-primary"
                            >
                              <ExternalLink className="h-3 w-3" />
                              View
                            </a>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="flex items-center gap-1 text-green-600">
                            <Plus className="h-3 w-3" />
                            {commit.totalAdditions}
                          </span>
                          <span className="flex items-center gap-1 text-red-600">
                            <Minus className="h-3 w-3" />
                            {commit.totalDeletions}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
