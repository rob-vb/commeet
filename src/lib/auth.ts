import { betterAuth } from "better-auth";

export const auth = betterAuth({
  database: {
    // Using Better Auth's built-in database adapter
    // For production, you'd connect this to Convex or another DB
    type: "sqlite",
    url: "./auth.db",
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  trustedOrigins: [
    process.env.BETTER_AUTH_URL || "http://localhost:3000",
  ],
});

export type Session = typeof auth.$Infer.Session;
