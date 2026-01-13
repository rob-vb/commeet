import { createFileRoute } from "@tanstack/react-router";
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
  Calendar,
  FileCode,
  Plus,
  Minus,
} from "lucide-react";

export const Route = createFileRoute("/dashboard/commits")({
  component: CommitsPage,
});

function CommitsPage() {
  // Placeholder data - will be replaced with real data from Convex
  const commits: Array<{
    id: string;
    sha: string;
    message: string;
    authorName: string;
    committedAt: number;
    repositoryName: string;
    totalAdditions: number;
    totalDeletions: number;
  }> = [];
  const selectedCommits: string[] = [];
  const hasConnectedRepos = false;

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Commits</h1>
          <p className="text-muted-foreground">
            Select commits to generate tweets
          </p>
        </div>
        {selectedCommits.length > 0 && (
          <Button className="gap-2">
            <Sparkles className="h-4 w-4" />
            Generate Tweets ({selectedCommits.length})
          </Button>
        )}
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
              <a href="/dashboard/repositories">Connect Repository</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Filters */}
          <div className="mb-6 flex flex-wrap items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search commits by message..."
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Calendar className="h-4 w-4" />
              Date Range
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                Select All
              </Button>
              <Button variant="ghost" size="sm">
                Deselect All
              </Button>
            </div>
          </div>

          {/* Commit List */}
          {commits.length === 0 ? (
            <Card className="text-center">
              <CardContent className="py-12">
                <p className="text-muted-foreground">
                  No commits found. Sync your repositories to see commits here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {commits.map((commit) => (
                <Card
                  key={commit.id}
                  className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                    selectedCommits.includes(commit.id)
                      ? "border-primary bg-primary/5"
                      : ""
                  }`}
                >
                  <CardContent className="flex items-start gap-4 py-4">
                    <Checkbox
                      checked={selectedCommits.includes(commit.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium">{commit.message}</p>
                          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                              {commit.repositoryName}
                            </Badge>
                            <span>{commit.authorName}</span>
                            <span>•</span>
                            <span>
                              {new Date(commit.committedAt).toLocaleDateString()}
                            </span>
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
