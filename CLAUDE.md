# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Commeet transforms GitHub commits into engaging tweets using AI-powered generation. Users connect their GitHub accounts, sync repositories, and generate tweet drafts from their commit history using Claude AI.

## Commands

```bash
# Development (run in separate terminals)
npx convex dev          # Start Convex backend
npm run dev             # Start frontend (Vite, port 3000)

# Build & Deploy
npm run build           # Production build
npx convex deploy && npm run build  # Full deploy (Netlify)

# Quality
npm run lint            # ESLint
npm run typecheck       # TypeScript checking
```

## Architecture

**Frontend**: TanStack Start (meta-framework on Vite) with TanStack Router for file-based routing in `src/routes/`. Uses React 19, Tailwind CSS 4.1, and shadcn/ui components.

**Backend**: Convex (real-time BaaS) - all server functions live in `convex/` directory. No traditional REST API; Convex handles queries, mutations, and actions with automatic TypeScript bindings.

**Authentication**: Better Auth with GitHub OAuth. Auth state managed via Convex, tokens stored in users table.

**AI Integration**: Claude (claude-sonnet-4-20250514) via Anthropic API for tweet generation in `convex/ai.ts`.

## Key Files

- `convex/schema.ts` - Database schema (users, repositories, commits, generatedTweets tables)
- `convex/github.ts` - GitHub API integration (fetch repos/commits)
- `convex/ai.ts` - Claude AI tweet generation
- `src/routes/__root.tsx` - Root layout wrapping all pages
- `src/lib/convex-provider.tsx` - Convex client provider setup

## Data Flow

1. User authenticates via GitHub OAuth → access token stored in users table
2. User syncs repositories → GitHub API fetches repos → stored in repositories table
3. User views commits → GitHub API fetches commits with file changes → stored in commits table
4. User generates tweets → Claude AI creates 4 variations based on commit + user voice settings → stored in generatedTweets table

## Path Aliases

- `~/` → `src/`
- `convex/*` → `convex/`

## Environment Variables

Required for development:
- `CONVEX_DEPLOYMENT`, `VITE_CONVEX_URL`, `VITE_CONVEX_SITE_URL` - Convex config
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` - GitHub OAuth
- `ANTHROPIC_API_KEY` - Claude AI for tweet generation
- `BETTER_AUTH_SECRET`, `SITE_URL` - Set via `npx convex env set`
