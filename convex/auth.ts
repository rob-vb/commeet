import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex, crossDomain } from "@convex-dev/better-auth/plugins";
import { components } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { betterAuth, type BetterAuthOptions } from "better-auth/minimal";
import authConfig from "./auth.config";

const siteUrl = process.env.SITE_URL!;

// The component client has methods needed for integrating Convex with Better Auth
export const authComponent = createClient<DataModel>(components.betterAuth);

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth({
    trustedOrigins: [siteUrl],
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    socialProviders: {
      github: {
        clientId: process.env.GITHUB_CLIENT_ID!,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        scope: ["read:user", "user:email", "repo"],
      },
    },
    plugins: [
      // The cross domain plugin is required for client side frameworks
      crossDomain({ siteUrl }),
      // The Convex plugin is required for Convex compatibility
      convex({ authConfig }),
    ],
  } satisfies BetterAuthOptions);
};

// Get the current authenticated user
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    try {
      return await authComponent.getAuthUser(ctx);
    } catch {
      return null;
    }
  },
});

// Get the current user with their linked accounts
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

    // Get all accounts for debugging - find any that match by providerId github
    const allAccounts = await ctx.db.query("betterAuth_accounts" as any).collect();

    // Find GitHub account matching this user
    const githubAccount = allAccounts.find((acc: any) =>
      acc.providerId === "github" &&
      (acc.userId === authUser.id || acc.userId === (authUser as any)._id)
    );

    return {
      user: authUser,
      hasGitHub: !!githubAccount,
      githubAccessToken: (githubAccount as any)?.accessToken || null,
      githubUsername: (githubAccount as any)?.accountId || null,
      // Debug info - remove in production
      debug: {
        authUserId: authUser.id,
        authUser_id: (authUser as any)._id,
        accountsCount: allAccounts.length,
        accountUserIds: allAccounts.map((a: any) => ({ userId: a.userId, providerId: a.providerId })),
      },
    };
  },
});
