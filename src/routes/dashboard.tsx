import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Separator } from "~/components/ui/separator";
import {
  GitCommit,
  LayoutDashboard,
  FolderGit2,
  MessageSquare,
  Settings,
  LogOut,
} from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
});

function DashboardLayout() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r bg-card">
        <div className="flex h-16 items-center gap-2 px-6">
          <GitCommit className="h-6 w-6" />
          <span className="text-xl font-bold">Commeet</span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          <Link to="/dashboard">
            {({ isActive }) => (
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className="w-full justify-start gap-2"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Button>
            )}
          </Link>
          <Link to="/dashboard/repositories">
            {({ isActive }) => (
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className="w-full justify-start gap-2"
              >
                <FolderGit2 className="h-4 w-4" />
                Repositories
              </Button>
            )}
          </Link>
          <Link to="/dashboard/commits">
            {({ isActive }) => (
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className="w-full justify-start gap-2"
              >
                <GitCommit className="h-4 w-4" />
                Commits
              </Button>
            )}
          </Link>
          <Link to="/dashboard/tweets">
            {({ isActive }) => (
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className="w-full justify-start gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                Generated Tweets
              </Button>
            )}
          </Link>
        </nav>

        <Separator />

        <div className="space-y-1 px-3 py-4">
          <Link to="/dashboard/settings">
            {({ isActive }) => (
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className="w-full justify-start gap-2"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            )}
          </Link>
          <Button variant="ghost" className="w-full justify-start gap-2">
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
        </div>

        <Separator />

        <div className="flex items-center gap-3 px-4 py-4">
          <Avatar className="h-8 w-8">
            <AvatarImage src="" alt="User" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <div className="flex-1 truncate">
            <p className="truncate text-sm font-medium">User</p>
            <p className="truncate text-xs text-muted-foreground">Free Plan</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
