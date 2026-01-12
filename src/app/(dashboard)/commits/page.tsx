"use client";

import { useState } from "react";
import Link from "next/link";
import { GitCommit, Sparkles, Filter, Search, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Mock data - will be replaced with Convex queries
const mockCommits = [
  {
    _id: "1",
    sha: "abc123def456",
    message: "feat: add user authentication with OAuth",
    author: "johndoe",
    committedAt: Date.now() - 1000 * 60 * 30,
    additions: 127,
    deletions: 34,
    filesChanged: 8,
    repository: { name: "johndoe/my-saas-app" },
  },
  {
    _id: "2",
    sha: "def456ghi789",
    message: "fix: resolve login redirect issue on mobile",
    author: "johndoe",
    committedAt: Date.now() - 1000 * 60 * 60 * 2,
    additions: 15,
    deletions: 8,
    filesChanged: 2,
    repository: { name: "johndoe/my-saas-app" },
  },
  {
    _id: "3",
    sha: "ghi789jkl012",
    message: "docs: update README with setup instructions",
    author: "johndoe",
    committedAt: Date.now() - 1000 * 60 * 60 * 5,
    additions: 45,
    deletions: 12,
    filesChanged: 1,
    repository: { name: "johndoe/my-saas-app" },
  },
  {
    _id: "4",
    sha: "jkl012mno345",
    message: "refactor: improve database query performance",
    author: "johndoe",
    committedAt: Date.now() - 1000 * 60 * 60 * 24,
    additions: 89,
    deletions: 67,
    filesChanged: 5,
    repository: { name: "johndoe/another-project" },
  },
  {
    _id: "5",
    sha: "mno345pqr678",
    message: "feat: add dark mode support with theme toggle",
    author: "johndoe",
    committedAt: Date.now() - 1000 * 60 * 60 * 48,
    additions: 234,
    deletions: 45,
    filesChanged: 12,
    repository: { name: "johndoe/another-project" },
  },
];

const mockRepositories = [
  { _id: "repo1", name: "johndoe/my-saas-app" },
  { _id: "repo2", name: "johndoe/another-project" },
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

export default function CommitsPage() {
  const [selectedCommits, setSelectedCommits] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRepo, setSelectedRepo] = useState<string>("all");

  const filteredCommits = mockCommits.filter((commit) => {
    const matchesSearch = commit.message
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesRepo =
      selectedRepo === "all" || commit.repository.name === selectedRepo;
    return matchesSearch && matchesRepo;
  });

  const toggleCommit = (commitId: string) => {
    setSelectedCommits((prev) =>
      prev.includes(commitId)
        ? prev.filter((id) => id !== commitId)
        : [...prev, commitId]
    );
  };

  const toggleAll = () => {
    if (selectedCommits.length === filteredCommits.length) {
      setSelectedCommits([]);
    } else {
      setSelectedCommits(filteredCommits.map((c) => c._id));
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Commits</h1>
          <p className="text-muted-foreground">
            Browse and select commits to generate tweets
          </p>
        </div>
        <Button
          className="gap-2"
          disabled={selectedCommits.length === 0}
          asChild
        >
          <Link
            href={`/generate?commits=${selectedCommits.join(",")}`}
          >
            <Sparkles className="h-4 w-4" />
            Generate Tweets ({selectedCommits.length})
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search commits..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedRepo} onValueChange={setSelectedRepo}>
              <SelectTrigger className="w-full sm:w-[240px]">
                <SelectValue placeholder="All repositories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All repositories</SelectItem>
                {mockRepositories.map((repo) => (
                  <SelectItem key={repo._id} value={repo.name}>
                    {repo.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Commits List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Commits</CardTitle>
            <CardDescription>
              {filteredCommits.length} commits found
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="select-all"
              checked={
                selectedCommits.length === filteredCommits.length &&
                filteredCommits.length > 0
              }
              onCheckedChange={toggleAll}
            />
            <label
              htmlFor="select-all"
              className="text-sm text-muted-foreground cursor-pointer"
            >
              Select all
            </label>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredCommits.map((commit) => (
              <div
                key={commit._id}
                className={`flex items-start gap-4 rounded-lg border p-4 transition-colors ${
                  selectedCommits.includes(commit._id)
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/50"
                }`}
              >
                <Checkbox
                  checked={selectedCommits.includes(commit._id)}
                  onCheckedChange={() => toggleCommit(commit._id)}
                />
                <GitCommit className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div className="flex-1 space-y-1 min-w-0">
                  <p className="font-medium leading-none">{commit.message}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="font-mono">
                      {commit.sha.slice(0, 7)}
                    </Badge>
                    <span>{commit.repository.name}</span>
                    <span>&bull;</span>
                    <span>{formatTimeAgo(commit.committedAt)}</span>
                    <span>&bull;</span>
                    <span>{commit.filesChanged} files changed</span>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground whitespace-nowrap">
                  <span className="text-green-600">+{commit.additions}</span>{" "}
                  <span className="text-red-600">-{commit.deletions}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
