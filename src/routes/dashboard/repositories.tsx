import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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
import { Input } from "~/components/ui/input";
import {
  Github,
  Plus,
  Search,
  RefreshCw,
  Lock,
  Globe,
  Check,
  Loader2,
} from "lucide-react";
import { signIn } from "~/lib/auth-client";
import { useSyncUser } from "~/hooks/use-sync-user";
import { UpgradeModal } from "~/components/upgrade-modal";

export const Route = createFileRoute("/dashboard/repositories")({
  component: RepositoriesPage,
});

function RepositoriesPage() {
  const [search, setSearch] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [connectingRepo, setConnectingRepo] = useState<number | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState("");

  // Use sync hook instead of direct query
  const { appUser, hasGitHub, githubAccessToken, isLoading } = useSyncUser();
  const isGitHubConnected = hasGitHub;

  // Get repositories using app user ID
  const repositories = useQuery(
    api.repositories.listByUser,
    appUser?._id ? { userId: appUser._id } : "skip"
  );

  // Check if user can connect more repositories
  const canConnect = useQuery(
    api.usage.canConnectRepository,
    appUser?._id ? { userId: appUser._id } : "skip"
  );

  // Actions
  const fetchRepos = useAction(api.github.fetchGitHubRepos);
  const connectRepo = useMutation(api.repositories.create);
  const disconnectRepo = useMutation(api.repositories.deactivate);

  const handleConnectGitHub = async () => {
    try {
      await signIn.social({
        provider: "github",
        callbackURL: "/dashboard/repositories",
      });
    } catch (error) {
      console.error("Failed to connect GitHub:", error);
    }
  };

  const handleSyncRepos = async () => {
    if (!githubAccessToken || !appUser?._id) return;
    setSyncing(true);
    try {
      await fetchRepos({
        accessToken: githubAccessToken,
        userId: appUser._id,
      });
    } catch (error) {
      console.error("Failed to sync repos:", error);
    } finally {
      setSyncing(false);
    }
  };

  const handleToggleRepo = async (repo: any) => {
    if (!appUser?._id) return;
    if (repo.isActive) {
      await disconnectRepo({ id: repo._id });
    } else {
      // Check if user can connect more repositories
      if (canConnect && !canConnect.allowed) {
        setUpgradeReason(canConnect.reason || "You've reached your repository limit.");
        setShowUpgrade(true);
        return;
      }
      setConnectingRepo(repo.githubId);
      await connectRepo({
        userId: appUser._id,
        githubId: repo.githubId,
        name: repo.name,
        fullName: repo.fullName,
        description: repo.description,
        isPrivate: repo.isPrivate,
        defaultBranch: repo.defaultBranch,
        url: repo.url,
      });
      setConnectingRepo(null);
    }
  };

  const filteredRepos =
    repositories?.filter(
      (repo) =>
        repo.name.toLowerCase().includes(search.toLowerCase()) ||
        repo.fullName.toLowerCase().includes(search.toLowerCase())
    ) ?? [];

  if (isLoading || !appUser) {
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
          <h1 className="text-3xl font-bold">Repositories</h1>
          <p className="text-muted-foreground">
            Connect your GitHub repositories to track commits
          </p>
        </div>
        {isGitHubConnected && (
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleSyncRepos}
            disabled={syncing}
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing..." : "Sync Repositories"}
          </Button>
        )}
      </div>

      {!isGitHubConnected ? (
        <Card className="mx-auto max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Github className="h-8 w-8" />
            </div>
            <CardTitle>Connect GitHub</CardTitle>
            <CardDescription>
              Connect your GitHub account to import your repositories and start
              tracking commits.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="gap-2" onClick={handleConnectGitHub}>
              <Github className="h-4 w-4" />
              Connect GitHub Account
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-6 flex items-center gap-4">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search repositories..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {!repositories ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredRepos.length === 0 ? (
            <Card className="text-center">
              <CardContent className="py-12">
                <p className="mb-4 text-muted-foreground">
                  {repositories.length === 0
                    ? "No repositories found. Click 'Sync Repositories' to fetch your GitHub repos."
                    : "No repositories match your search."}
                </p>
                {repositories.length === 0 && (
                  <Button onClick={handleSyncRepos} disabled={syncing}>
                    <RefreshCw
                      className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`}
                    />
                    Sync Now
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredRepos.map((repo) => (
                <Card key={repo._id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{repo.name}</CardTitle>
                        <Badge variant="outline" className="gap-1">
                          {repo.isPrivate ? (
                            <>
                              <Lock className="h-3 w-3" />
                              Private
                            </>
                          ) : (
                            <>
                              <Globe className="h-3 w-3" />
                              Public
                            </>
                          )}
                        </Badge>
                        {repo.isActive && (
                          <Badge className="gap-1 bg-green-500">
                            <Check className="h-3 w-3" />
                            Connected
                          </Badge>
                        )}
                      </div>
                      <CardDescription>
                        {repo.description || "No description"}
                      </CardDescription>
                    </div>
                    <Button
                      variant={repo.isActive ? "secondary" : "default"}
                      size="sm"
                      className="gap-2"
                      onClick={() => handleToggleRepo(repo)}
                      disabled={connectingRepo === repo.githubId}
                    >
                      {connectingRepo === repo.githubId ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : repo.isActive ? (
                        "Disconnect"
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          Connect
                        </>
                      )}
                    </Button>
                  </CardHeader>
                  {repo.isActive && repo.lastSyncedAt && (
                    <CardContent>
                      <p className="text-xs text-muted-foreground">
                        Last synced: {new Date(repo.lastSyncedAt).toLocaleString()}
                      </p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      <UpgradeModal
        open={showUpgrade}
        onOpenChange={setShowUpgrade}
        userId={appUser._id}
        reason={upgradeReason}
        currentPlan={appUser.plan || "free"}
      />
    </div>
  );
}
