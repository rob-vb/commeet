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

    // Get the Better Auth user ID as string for lookups
    const betterAuthUserId = String(authUser._id);

    // Query accounts through the component adapter
    const result = (await ctx.runQuery(components.betterAuth.adapter.findMany, {
      model: "account",
      where: [
        {
          field: "userId",
          value: betterAuthUserId,
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
      .withIndex("by_better_auth_id", (q) => q.eq("betterAuthId", betterAuthUserId))
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
