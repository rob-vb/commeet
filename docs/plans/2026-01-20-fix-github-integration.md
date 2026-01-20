# Fix GitHub Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the broken GitHub integration by syncing Better Auth users to the app's users table and ensuring proper user ID handling throughout the codebase.

**Architecture:** Better Auth manages authentication in `betterAuth_users`/`betterAuth_accounts` tables. The app needs to sync authenticated users to the `users` table and use the app's user ID (`v.id("users")`) for all queries. We'll add a user sync mechanism and create a helper to get the current app user.

**Tech Stack:** Convex (queries/mutations), Better Auth component adapter, TypeScript

---

## Root Cause Analysis

The app has two user systems that aren't connected:
1. **Better Auth**: Stores users in `betterAuth_users` table with string IDs, stores OAuth tokens in `betterAuth_accounts`
2. **App**: Expects users in `users` table with Convex document IDs (`v.id("users")`)

When `getCurrentUserWithAccounts` returns `authUser.id`, the frontend passes this to queries expecting `v.id("users")`, causing type mismatches and query failures.

---

### Task 1: Add Better Auth User ID to Users Table

**Files:**
- Modify: `convex/schema.ts:5-42`

**Step 1: Add betterAuthId field to users table**

Add an index for Better Auth user ID lookup:

```typescript
users: defineTable({
  // Better Auth link
  betterAuthId: v.string(),

  // Auth (Better Auth handles core auth)
  email: v.string(),
  name: v.optional(v.string()),
  image: v.optional(v.string()),

  // ... rest of existing fields unchanged ...
})
  .index("by_email", ["email"])
  .index("by_better_auth_id", ["betterAuthId"])  // Add this index
  .index("by_github_id", ["githubId"])
  .index("by_stripe_customer_id", ["stripeCustomerId"]),
```

**Step 2: Run Convex dev to apply schema**

Run: `npx convex dev` (in separate terminal)
Expected: Schema updated successfully

**Step 3: Commit**

```bash
git add convex/schema.ts
git commit -m "feat: add betterAuthId field to users table for auth sync"
```

---

### Task 2: Create User Sync Functions

**Files:**
- Modify: `convex/users.ts`

**Step 1: Add getOrCreateFromBetterAuth mutation**

Add this mutation to `convex/users.ts`:

```typescript
// Get or create app user from Better Auth user
export const getOrCreateFromBetterAuth = mutation({
  args: {
    betterAuthId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists with this Better Auth ID
    const existing = await ctx.db
      .query("users")
      .withIndex("by_better_auth_id", (q) => q.eq("betterAuthId", args.betterAuthId))
      .unique();

    if (existing) {
      // Update name/image if changed
      if (args.name !== existing.name || args.image !== existing.image) {
        await ctx.db.patch(existing._id, {
          name: args.name,
          image: args.image,
        });
      }
      return existing._id;
    }

    // Create new user
    return await ctx.db.insert("users", {
      betterAuthId: args.betterAuthId,
      email: args.email,
      name: args.name,
      image: args.image,
      plan: "free",
    });
  },
});

// Get app user by Better Auth ID
export const getByBetterAuthId = query({
  args: { betterAuthId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_better_auth_id", (q) => q.eq("betterAuthId", args.betterAuthId))
      .unique();
  },
});
```

**Step 2: Commit**

```bash
git add convex/users.ts
git commit -m "feat: add user sync functions for Better Auth integration"
```

---

### Task 3: Update Auth Query to Return App User

**Files:**
- Modify: `convex/auth.ts:51-88`

**Step 1: Update getCurrentUserWithAccounts to sync and return app user**

Replace the `getCurrentUserWithAccounts` query:

```typescript
// Get the current user with their linked accounts and app user ID
export const getCurrentUserWithAccounts = query({
  args: {},
  handler: async (ctx) => {
    let authUser;
    try {
      authUser = await authComponent.getAuthUser(ctx);
    } catch {
      return null;
    }
    if (!authUser) return null;

    // Query accounts through the component adapter
    const result = (await ctx.runQuery(components.betterAuth.adapter.findMany, {
      model: "account",
      where: [
        {
          field: "userId",
          value: authUser.id,
        },
      ],
      paginationOpts: {
        cursor: null,
        numItems: 10,
      },
    })) as any;
    const accounts = result?.page || [];

    // Find GitHub account
    const githubAccount = accounts.find((acc: any) => acc.providerId === "github");

    // Get app user by Better Auth ID
    const appUser = await ctx.db
      .query("users")
      .withIndex("by_better_auth_id", (q) => q.eq("betterAuthId", authUser.id))
      .unique();

    return {
      authUser,
      appUser,  // This is the users table record with _id
      hasGitHub: !!githubAccount,
      githubAccessToken: githubAccount?.accessToken || null,
      githubUsername: githubAccount?.accountId || null,
    };
  },
});
```

**Step 2: Commit**

```bash
git add convex/auth.ts
git commit -m "feat: update getCurrentUserWithAccounts to return app user"
```

---

### Task 4: Create User Sync Hook in Frontend

**Files:**
- Create: `src/hooks/use-sync-user.ts`

**Step 1: Create the sync hook**

```typescript
import { useEffect, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "~/lib/convex";
import { useSession } from "~/lib/auth-client";

export function useSyncUser() {
  const { data: session } = useSession();
  const syncedRef = useRef(false);

  const userWithAccounts = useQuery(api.auth.getCurrentUserWithAccounts);
  const syncUser = useMutation(api.users.getOrCreateFromBetterAuth);

  useEffect(() => {
    // Only sync once per session when we have auth user but no app user
    if (
      userWithAccounts?.authUser &&
      !userWithAccounts?.appUser &&
      !syncedRef.current
    ) {
      syncedRef.current = true;
      syncUser({
        betterAuthId: userWithAccounts.authUser.id,
        email: userWithAccounts.authUser.email,
        name: userWithAccounts.authUser.name || undefined,
        image: userWithAccounts.authUser.image || undefined,
      }).catch(console.error);
    }
  }, [userWithAccounts, syncUser]);

  return {
    isLoading: !userWithAccounts,
    appUser: userWithAccounts?.appUser,
    authUser: userWithAccounts?.authUser,
    hasGitHub: userWithAccounts?.hasGitHub ?? false,
    githubAccessToken: userWithAccounts?.githubAccessToken,
  };
}
```

**Step 2: Commit**

```bash
git add src/hooks/use-sync-user.ts
git commit -m "feat: add useSyncUser hook to sync Better Auth users to app"
```

---

### Task 5: Update Dashboard Layout to Use Sync Hook

**Files:**
- Modify: `src/routes/dashboard.tsx`

**Step 1: Import and use the sync hook**

Add import at top:

```typescript
import { useSyncUser } from "~/hooks/use-sync-user";
```

Replace the session check with the sync hook in `DashboardLayout`:

```typescript
function DashboardLayout() {
  const navigate = useNavigate();
  const { data: session, isPending } = useSession();
  const { appUser, isLoading: isSyncLoading } = useSyncUser();

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  // Redirect to login if not authenticated
  if (!isPending && !session) {
    navigate({ to: "/login" });
    return null;
  }

  // Show loading state while syncing
  if (isPending || isSyncLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const user = session?.user;
  // ... rest unchanged
```

**Step 2: Commit**

```bash
git add src/routes/dashboard.tsx
git commit -m "feat: use sync hook in dashboard layout"
```

---

### Task 6: Update Repositories Page to Use App User ID

**Files:**
- Modify: `src/routes/dashboard/repositories.tsx`

**Step 1: Import and use sync hook**

Replace the current user query usage:

```typescript
import { useSyncUser } from "~/hooks/use-sync-user";

function RepositoriesPage() {
  const [search, setSearch] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [connectingRepo, setConnectingRepo] = useState<number | null>(null);

  // Use sync hook instead of direct query
  const { appUser, hasGitHub, githubAccessToken, isLoading } = useSyncUser();
  const isGitHubConnected = hasGitHub;

  // Get repositories using app user ID
  const repositories = useQuery(
    api.repositories.listByUser,
    appUser?._id ? { userId: appUser._id } : "skip"
  );

  // Actions
  const fetchRepos = useAction(api.github.fetchGitHubRepos);
  const connectRepo = useMutation(api.repositories.create);
  const disconnectRepo = useMutation(api.repositories.deactivate);

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

  // ... rest of the component with updated loading check
  if (isLoading || !appUser) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
```

**Step 2: Commit**

```bash
git add src/routes/dashboard/repositories.tsx
git commit -m "fix: use app user ID in repositories page"
```

---

### Task 7: Update Commits Page to Use App User ID

**Files:**
- Modify: `src/routes/dashboard/commits.tsx`

**Step 1: Import and use sync hook**

Similar changes as repositories page:

```typescript
import { useSyncUser } from "~/hooks/use-sync-user";

function CommitsPage() {
  const [search, setSearch] = useState("");
  const [selectedCommits, setSelectedCommits] = useState<string[]>([]);
  const [syncing, setSyncing] = useState(false);

  // Use sync hook
  const { appUser, githubAccessToken, isLoading } = useSyncUser();

  // Get connected repositories
  const repositories = useQuery(
    api.repositories.listActiveByUser,
    appUser?._id ? { userId: appUser._id } : "skip"
  );

  // Get commits
  const commits = useQuery(
    api.commits.listByUser,
    appUser?._id ? { userId: appUser._id, limit: 100 } : "skip"
  );

  // Actions
  const fetchCommits = useAction(api.github.fetchGitHubCommits);

  const handleSyncCommits = async () => {
    if (!githubAccessToken || !repositories || !appUser?._id) return;
    setSyncing(true);

    try {
      for (const repo of repositories) {
        await fetchCommits({
          accessToken: githubAccessToken,
          userId: appUser._id,
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

  // ... rest unchanged except loading check:
  if (isLoading || !appUser) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
```

**Step 2: Commit**

```bash
git add src/routes/dashboard/commits.tsx
git commit -m "fix: use app user ID in commits page"
```

---

### Task 8: Update Tweets Page to Use App User ID

**Files:**
- Modify: `src/routes/dashboard/tweets.tsx`

**Step 1: Import and use sync hook**

```typescript
import { useSyncUser } from "~/hooks/use-sync-user";

function TweetsPage() {
  // ... existing state ...

  // Use sync hook
  const { appUser, isLoading } = useSyncUser();

  // Get tweets using app user ID
  const allTweets = useQuery(
    api.tweets.listByUser,
    appUser?._id ? { userId: appUser._id } : "skip"
  );

  // ... actions unchanged ...

  const handleGenerate = async () => {
    if (!appUser?._id || commitIdsFromUrl.length === 0) return;
    setGenerating(true);

    try {
      await generateTweets({
        userId: appUser._id,
        commitIds: commitIdsFromUrl as any[],
        tone,
      });
    } catch (error) {
      console.error("Failed to generate tweets:", error);
    } finally {
      setGenerating(false);
    }
  };

  // Update useEffect dependency
  useEffect(() => {
    if (
      commitIdsFromUrl.length > 0 &&
      appUser?._id &&
      !generating
    ) {
      const hasExisting = allTweets?.some((t) =>
        commitIdsFromUrl.every((id) => t.commitIds.includes(id as any))
      );
      if (!hasExisting && allTweets !== undefined) {
        handleGenerate();
      }
    }
  }, [commitIdsFromUrl.join(","), appUser?._id, allTweets]);

  if (isLoading || !appUser) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
```

**Step 2: Commit**

```bash
git add src/routes/dashboard/tweets.tsx
git commit -m "fix: use app user ID in tweets page"
```

---

### Task 9: Update Settings Page to Use App User ID

**Files:**
- Modify: `src/routes/dashboard/settings.tsx`

**Step 1: Read the current settings page**

Check current implementation and update to use `useSyncUser` hook similar to other pages.

**Step 2: Update to use sync hook**

Update the component to use `appUser._id` for the `updateVoiceSettings` mutation.

**Step 3: Commit**

```bash
git add src/routes/dashboard/settings.tsx
git commit -m "fix: use app user ID in settings page"
```

---

### Task 10: Update Dashboard Index to Use App User ID

**Files:**
- Modify: `src/routes/dashboard/index.tsx`

**Step 1: Read and update**

Check current implementation and update queries to use `appUser._id`.

**Step 2: Commit**

```bash
git add src/routes/dashboard/index.tsx
git commit -m "fix: use app user ID in dashboard index"
```

---

### Task 11: Test the Full Flow

**Step 1: Start development servers**

Terminal 1:
```bash
npx convex dev
```

Terminal 2:
```bash
npm run dev
```

**Step 2: Test authentication**

1. Open http://localhost:3000
2. Click "Login with GitHub"
3. Authorize the app
4. Verify redirect to dashboard

**Step 3: Test repository sync**

1. Navigate to Repositories page
2. Click "Sync Repositories"
3. Verify repositories appear in the list
4. Connect a repository

**Step 4: Test commit sync**

1. Navigate to Commits page
2. Click "Sync Commits"
3. Verify commits appear

**Step 5: Test tweet generation**

1. Select one or more commits
2. Click "Generate Tweets"
3. Verify tweets are generated

**Step 6: Final commit**

```bash
git add -A
git commit -m "test: verify GitHub integration end-to-end"
```

---

## Summary

This plan fixes the core issue: Better Auth users weren't synced to the app's `users` table, causing all queries with `v.id("users")` to fail. The fix:

1. Adds `betterAuthId` field to link tables
2. Creates sync functions to create/update app users from Better Auth
3. Updates `getCurrentUserWithAccounts` to return the app user
4. Creates a `useSyncUser` hook that automatically syncs users
5. Updates all dashboard pages to use the app user ID

After implementation, the GitHub integration flow will work:
1. User logs in via GitHub OAuth (Better Auth handles this)
2. App syncs Better Auth user to `users` table
3. Repositories/commits/tweets are stored with the app user ID
4. All queries work correctly
