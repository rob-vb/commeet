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
import { Input } from "~/components/ui/input";
import { Github, Plus, Search, RefreshCw, Lock, Globe } from "lucide-react";

export const Route = createFileRoute("/dashboard/repositories")({
  component: RepositoriesPage,
});

function RepositoriesPage() {
  // Placeholder data - will be replaced with real data from Convex
  const isGitHubConnected = false;
  const repositories: Array<{
    id: string;
    name: string;
    fullName: string;
    description: string | null;
    isPrivate: boolean;
    isConnected: boolean;
    lastSyncedAt: number | null;
  }> = [];

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
          <Button variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Sync Repositories
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
            <Button className="gap-2">
              <Github className="h-4 w-4" />
              Connect GitHub Account
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Search */}
          <div className="mb-6 flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search repositories..." className="pl-10" />
            </div>
          </div>

          {/* Repository List */}
          {repositories.length === 0 ? (
            <Card className="text-center">
              <CardContent className="py-12">
                <p className="text-muted-foreground">
                  No repositories found. Your GitHub repositories will appear
                  here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {repositories.map((repo) => (
                <Card key={repo.id}>
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
                      </div>
                      <CardDescription>
                        {repo.description || "No description"}
                      </CardDescription>
                    </div>
                    <Button
                      variant={repo.isConnected ? "secondary" : "default"}
                      size="sm"
                      className="gap-2"
                    >
                      {repo.isConnected ? (
                        <>Connected</>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          Connect
                        </>
                      )}
                    </Button>
                  </CardHeader>
                  {repo.isConnected && repo.lastSyncedAt && (
                    <CardContent>
                      <p className="text-xs text-muted-foreground">
                        Last synced:{" "}
                        {new Date(repo.lastSyncedAt).toLocaleString()}
                      </p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
