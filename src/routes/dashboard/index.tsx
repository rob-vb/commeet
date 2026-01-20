import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "~/lib/convex";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  FolderGit2,
  GitCommit,
  MessageSquare,
  Send,
  Plus,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useSyncUser } from "~/hooks/use-sync-user";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardPage,
});

function DashboardPage() {
  // Use sync hook
  const { appUser, isLoading } = useSyncUser();

  // Get stats using app user ID
  const repositories = useQuery(
    api.repositories.listActiveByUser,
    appUser?._id ? { userId: appUser._id } : "skip"
  );
  const commits = useQuery(
    api.commits.listByUser,
    appUser?._id ? { userId: appUser._id, limit: 1000 } : "skip"
  );
  const tweets = useQuery(
    api.tweets.listByUser,
    appUser?._id ? { userId: appUser._id } : "skip"
  );

  if (isLoading || !appUser) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const stats = {
    repositories: repositories?.length ?? 0,
    commits: commits?.length ?? 0,
    generatedTweets: tweets?.filter(t => t.status === "generated" || t.status === "edited").length ?? 0,
    postedTweets: tweets?.filter(t => t.status === "posted").length ?? 0,
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's your build in public overview.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Repositories</CardTitle>
            <FolderGit2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.repositories}</div>
            <p className="text-xs text-muted-foreground">Connected repos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commits</CardTitle>
            <GitCommit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.commits}</div>
            <p className="text-xs text-muted-foreground">Synced commits</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Generated</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.generatedTweets}</div>
            <p className="text-xs text-muted-foreground">Tweets created</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Posted</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.postedTweets}</div>
            <p className="text-xs text-muted-foreground">Tweets shared</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Get started with these common tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link to="/dashboard/repositories">
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Connect a Repository
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/dashboard/commits">
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <GitCommit className="h-4 w-4" />
                  Browse Commits
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/dashboard/settings">
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Configure Your Voice
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              Follow these steps to start building in public
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  1
                </span>
                <span>Connect your GitHub account and repositories</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs">
                  2
                </span>
                <span>Configure your voice settings and target audience</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs">
                  3
                </span>
                <span>Select commits and generate tweet variations</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs">
                  4
                </span>
                <span>Share your progress and grow your audience!</span>
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
