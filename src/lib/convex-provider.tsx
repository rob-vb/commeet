"use client";

import { type ReactNode } from "react";
import { ConvexReactClient } from "convex/react";
import { authClient } from "./auth-client";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";

const convexUrl = import.meta.env.VITE_CONVEX_URL as string;

const convex = new ConvexReactClient(convexUrl);

export function ConvexClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ConvexBetterAuthProvider client={convex} authClient={authClient}>
      {children}
    </ConvexBetterAuthProvider>
  );
}

export { convex };
