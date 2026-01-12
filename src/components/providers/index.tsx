"use client";

import { ReactNode } from "react";
import { ConvexClientProvider } from "./convex-provider";
import { ThemeProvider } from "./theme-provider";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ConvexClientProvider>
        {children}
        <Toaster />
      </ConvexClientProvider>
    </ThemeProvider>
  );
}
