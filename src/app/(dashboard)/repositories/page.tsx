"use client";

import { useState } from "react";
import {
  FolderGit2,
  Plus,
  Globe,
  Lock,
  RefreshCw,
  MoreVertical,
  Unlink,
  Github,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

// Mock data - will be replaced with actual data
const isGitHubConnected = true;

const mockConnectedRepos = [
  {
    _id: "1",
    name: "johndoe/my-saas-app",
    isPublic: true,
    defaultBranch: "main",
    lastSyncedAt: Date.now() - 1000 * 60 * 5,
  },
  {
    _id: "2",
    name: "johndoe/another-project",
    isPublic: false,
    defaultBranch: "main",
    lastSyncedAt: Date.now() - 1000 * 60 * 60,
  },
];

const mockAvailableRepos = [
  { id: 1, name: "johndoe/new-repo", isPublic: true, defaultBranch: "main" },
  { id: 2, name: "johndoe/private-repo", isPublic: false, defaultBranch: "main" },
  { id: 3, name: "johndoe/open-source", isPublic: true, defaultBranch: "main" },
];

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

function ConnectRepositoryDialog() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRepos, setSelectedRepos] = useState<number[]>([]);

  const filteredRepos = mockAvailableRepos.filter((repo) =>
    repo.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleRepo = (repoId: number) => {
    setSelectedRepos((prev) =>
      prev.includes(repoId)
        ? prev.filter((id) => id !== repoId)
        : [...prev, repoId]
    );
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Connect Repository
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Connect Repository</DialogTitle>
          <DialogDescription>
            Select repositories to connect and start syncing commits.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Search repositories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="max-h-[300px] overflow-y-auto space-y-2">
            {filteredRepos.map((repo) => (
              <div
                key={repo.id}
                className={`flex items-center gap-4 rounded-lg border p-3 cursor-pointer transition-colors ${
                  selectedRepos.includes(repo.id)
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/50"
                }`}
                onClick={() => toggleRepo(repo.id)}
              >
                <Checkbox checked={selectedRepos.includes(repo.id)} />
                <FolderGit2 className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium">{repo.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {repo.defaultBranch}
                  </p>
                </div>
                {repo.isPublic ? (
                  <Badge variant="secondary">
                    <Globe className="mr-1 h-3 w-3" />
                    Public
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    <Lock className="mr-1 h-3 w-3" />
                    Private
                  </Badge>
                )}
              </div>
            ))}
          </div>
          <Button className="w-full" disabled={selectedRepos.length === 0}>
            Connect {selectedRepos.length} Repository
            {selectedRepos.length !== 1 ? "ies" : "y"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EmptyState() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Github className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">Connect GitHub First</h3>
        <p className="mt-2 text-center text-sm text-muted-foreground max-w-sm">
          You need to connect your GitHub account before you can add
          repositories.
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

export default function RepositoriesPage() {
  if (!isGitHubConnected) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Repositories</h1>
          <p className="text-muted-foreground">
            Manage your connected repositories
          </p>
        </div>
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Repositories</h1>
          <p className="text-muted-foreground">
            Manage your connected repositories
          </p>
        </div>
        <ConnectRepositoryDialog />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mockConnectedRepos.map((repo) => (
          <Card key={repo._id}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <FolderGit2 className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle className="text-base">{repo.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1 text-xs">
                    {repo.isPublic ? (
                      <>
                        <Globe className="h-3 w-3" />
                        Public
                      </>
                    ) : (
                      <>
                        <Lock className="h-3 w-3" />
                        Private
                      </>
                    )}
                    <span>&bull;</span>
                    <span>{repo.defaultBranch}</span>
                  </CardDescription>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Sync Now
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">
                    <Unlink className="mr-2 h-4 w-4" />
                    Disconnect
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Last synced</span>
                <span>
                  {repo.lastSyncedAt
                    ? formatTimeAgo(repo.lastSyncedAt)
                    : "Never"}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
