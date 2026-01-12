"use client";

import Link from "next/link";
import {
  GitCommit,
  FolderGit2,
  MessageSquare,
  Send,
  ArrowRight,
  Github,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Mock data for now - will be replaced with Convex queries
const mockStats = {
  totalRepositories: 3,
  totalCommits: 47,
  tweetsGenerated: 23,
  tweetsPosted: 12,
};

const mockRecentCommits = [
  {
    _id: "1",
    sha: "abc123",
    message: "feat: add user authentication",
    author: "johndoe",
    committedAt: Date.now() - 1000 * 60 * 30,
    additions: 127,
    deletions: 34,
    repositoryName: "my-app",
  },
  {
    _id: "2",
    sha: "def456",
    message: "fix: resolve login redirect issue",
    author: "johndoe",
    committedAt: Date.now() - 1000 * 60 * 60 * 2,
    additions: 15,
    deletions: 8,
    repositoryName: "my-app",
  },
  {
    _id: "3",
    sha: "ghi789",
    message: "docs: update README with setup instructions",
    author: "johndoe",
    committedAt: Date.now() - 1000 * 60 * 60 * 5,
    additions: 45,
    deletions: 12,
    repositoryName: "my-app",
  },
];

const isGitHubConnected = false; // Mock - will be replaced with actual check

function StatCard({
  title,
  value,
  icon: Icon,
  description,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  description?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <Card className="col-span-full">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Github className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">Connect GitHub</h3>
        <p className="mt-2 text-center text-sm text-muted-foreground max-w-sm">
          Connect your GitHub account to start syncing repositories and
          generating tweets from your commits.
        </p>
        <Button className="mt-6 gap-2" asChild>
          <Link href="/settings">
            <Github className="h-4 w-4" />
            Connect GitHub
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

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

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s an overview of your activity.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Connected Repositories"
          value={mockStats.totalRepositories}
          icon={FolderGit2}
        />
        <StatCard
          title="Commits Synced"
          value={mockStats.totalCommits}
          icon={GitCommit}
        />
        <StatCard
          title="Tweets Generated"
          value={mockStats.tweetsGenerated}
          icon={MessageSquare}
        />
        <StatCard
          title="Tweets Posted"
          value={mockStats.tweetsPosted}
          icon={Send}
        />
      </div>

      {!isGitHubConnected ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks to help you build in public
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full justify-start gap-2" variant="outline" asChild>
                <Link href="/repositories">
                  <Plus className="h-4 w-4" />
                  Connect New Repository
                </Link>
              </Button>
              <Button className="w-full justify-start gap-2" variant="outline" asChild>
                <Link href="/commits">
                  <GitCommit className="h-4 w-4" />
                  Browse Commits
                </Link>
              </Button>
              <Button className="w-full justify-start gap-2" variant="outline" asChild>
                <Link href="/settings">
                  <MessageSquare className="h-4 w-4" />
                  Customize Voice Settings
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Recent Commits */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Commits</CardTitle>
                <CardDescription>
                  Your latest commits ready for tweeting
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/commits" className="gap-1">
                  View all
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockRecentCommits.map((commit) => (
                  <div
                    key={commit._id}
                    className="flex items-start gap-4 rounded-lg border p-3"
                  >
                    <GitCommit className="mt-0.5 h-5 w-5 text-muted-foreground" />
                    <div className="flex-1 space-y-1 min-w-0">
                      <p className="text-sm font-medium leading-none truncate">
                        {commit.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {commit.repositoryName} &bull;{" "}
                        {formatTimeAgo(commit.committedAt)}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      <span className="text-green-600">+{commit.additions}</span>{" "}
                      <span className="text-red-600">-{commit.deletions}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
