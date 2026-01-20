import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "~/lib/convex";
import { useSyncUser } from "~/hooks/use-sync-user";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import {
  GitCommit,
  Loader2,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Calendar,
} from "lucide-react";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardPage,
});

function DashboardPage() {
  const { appUser, isLoading } = useSyncUser();

  // Date range state
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [useCustomRange, setUseCustomRange] = useState(false);

  // Selection state
  const [selectedCommits, setSelectedCommits] = useState<Set<string>>(new Set());

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [generatedTweet, setGeneratedTweet] = useState<string | null>(null);
  const [toneInstruction, setToneInstruction] = useState("");
  const [copied, setCopied] = useState(false);

  // Fetch today's commits
  const todayCommits = useQuery(
    api.commits.getToday,
    appUser?._id ? { userId: appUser._id } : "skip"
  );

  // Fetch custom range commits
  const customCommits = useQuery(
    api.commits.getByDateRange,
    appUser?._id && useCustomRange && startDate && endDate
      ? {
          userId: appUser._id,
          startDate: new Date(startDate).getTime(),
          endDate: new Date(endDate).setHours(23, 59, 59, 999),
        }
      : "skip"
  );

  const commits = useCustomRange ? customCommits : todayCommits;
  const generateTweet = useAction(api.ai.generateTweet);

  // Initialize selection when commits load
  if (commits && commits.length > 0 && selectedCommits.size === 0) {
    const allIds = new Set(commits.map((c) => c._id));
    if (allIds.size > 0 && selectedCommits.size === 0) {
      setSelectedCommits(allIds);
    }
  }

  const handleToggleCommit = (commitId: string) => {
    const newSelection = new Set(selectedCommits);
    if (newSelection.has(commitId)) {
      newSelection.delete(commitId);
    } else {
      newSelection.add(commitId);
    }
    setSelectedCommits(newSelection);
  };

  const handleSelectAll = () => {
    if (commits) {
      setSelectedCommits(new Set(commits.map((c) => c._id)));
    }
  };

  const handleGenerate = async () => {
    if (!appUser?._id || selectedCommits.size === 0) return;
    setGenerating(true);
    setGeneratedTweet(null);

    try {
      const result = await generateTweet({
        userId: appUser._id,
        commitIds: Array.from(selectedCommits) as any[],
        toneInstruction: toneInstruction || undefined,
      });
      setGeneratedTweet(result.content);
    } catch (error) {
      console.error("Failed to generate tweet:", error);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (generatedTweet) {
      await navigator.clipboard.writeText(generatedTweet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = () => {
    if (generatedTweet) {
      const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(generatedTweet)}`;
      window.open(url, "_blank");
    }
  };

  const handleSearchRange = () => {
    setUseCustomRange(true);
    setSelectedCommits(new Set());
    setGeneratedTweet(null);
  };

  const handleBackToToday = () => {
    setUseCustomRange(false);
    setSelectedCommits(new Set());
    setGeneratedTweet(null);
    setStartDate("");
    setEndDate("");
  };

  if (isLoading || !appUser) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          {useCustomRange ? "Commits" : `Today, ${today}`}
        </h1>
        <p className="text-muted-foreground">
          {commits === undefined
            ? "Loading commits..."
            : commits.length === 0
              ? "No commits found"
              : `${commits.length} commit${commits.length === 1 ? "" : "s"} found`}
        </p>
      </div>

      {/* Generated Tweet Section */}
      {generatedTweet && (
        <Card className="mb-6 border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5" />
              Your tweet is ready
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={generatedTweet}
              onChange={(e) => setGeneratedTweet(e.target.value)}
              className="min-h-[100px] bg-white dark:bg-gray-950"
              maxLength={280}
            />
            <div className="flex items-center justify-between">
              <span
                className={`text-sm ${generatedTweet.length > 280 ? "text-red-500" : "text-muted-foreground"}`}
              >
                {generatedTweet.length}/280
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  {copied ? (
                    <Check className="h-4 w-4 mr-1" />
                  ) : (
                    <Copy className="h-4 w-4 mr-1" />
                  )}
                  {copied ? "Copied!" : "Copy"}
                </Button>
                <Button size="sm" onClick={handleShare}>
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Share to X
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t space-y-3">
              <div className="space-y-2">
                <Label htmlFor="tone" className="text-sm">
                  Regenerate with different tone (optional)
                </Label>
                <Input
                  id="tone"
                  placeholder="e.g., more technical, add humor, sound excited"
                  value={toneInstruction}
                  onChange={(e) => setToneInstruction(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                onClick={handleGenerate}
                disabled={generating}
              >
                {generating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Regenerate
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Commits List or Empty State */}
      {commits === undefined ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : commits.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No commits found</CardTitle>
            <CardDescription>
              {useCustomRange
                ? "No commits in this date range. Try a different range."
                : "You haven't made any commits today. Select a date range to find older commits."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 items-end flex-wrap">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <Button onClick={handleSearchRange} disabled={!startDate || !endDate}>
                <Calendar className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
            {useCustomRange && (
              <Button variant="link" onClick={handleBackToToday} className="p-0">
                ← Back to today
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Selection Header */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {selectedCommits.size} of {commits.length} selected
            </p>
            <Button variant="link" onClick={handleSelectAll} className="p-0 h-auto">
              Select all
            </Button>
          </div>

          {/* Commits */}
          <div className="space-y-2">
            {commits.map((commit) => (
              <Card
                key={commit._id}
                className={`cursor-pointer transition-colors ${
                  selectedCommits.has(commit._id)
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/50"
                }`}
                onClick={() => handleToggleCommit(commit._id)}
              >
                <CardContent className="flex items-start gap-3 p-4">
                  <Checkbox
                    checked={selectedCommits.has(commit._id)}
                    onCheckedChange={() => handleToggleCommit(commit._id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{commit.message}</p>
                    <p className="text-sm text-muted-foreground">
                      {commit.filesChanged.length} file
                      {commit.filesChanged.length === 1 ? "" : "s"} · +
                      {commit.totalAdditions} -{commit.totalDeletions}
                    </p>
                  </div>
                  <GitCommit className="h-4 w-4 text-muted-foreground shrink-0" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Generate Button */}
          {!generatedTweet && (
            <Button
              className="w-full"
              size="lg"
              onClick={handleGenerate}
              disabled={generating || selectedCommits.size === 0}
            >
              {generating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Generate Tweet for {selectedCommits.size} commit
              {selectedCommits.size === 1 ? "" : "s"}
            </Button>
          )}

          {/* Date Range Controls */}
          {!generatedTweet && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-3">
                Want to include older commits?
              </p>
              <div className="flex gap-4 items-end flex-wrap">
                <div className="space-y-2">
                  <Label htmlFor="startDate2">Start date</Label>
                  <Input
                    id="startDate2"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate2">End date</Label>
                  <Input
                    id="endDate2"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={handleSearchRange}
                  disabled={!startDate || !endDate}
                >
                  Search
                </Button>
              </div>
              {useCustomRange && (
                <Button
                  variant="link"
                  onClick={handleBackToToday}
                  className="p-0 mt-2"
                >
                  ← Back to today
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
