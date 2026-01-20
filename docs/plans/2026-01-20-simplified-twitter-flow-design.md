# Simplified Tweet Flow Design

## Overview

Redesign Commeet to focus on a streamlined "What did I build today?" workflow. Remove complexity around Twitter API integration, tweet status tracking, and preset voice tones.

## Core Flow

1. User logs in → lands on dashboard
2. App fetches today's commits from all connected repos
3. If commits found → show them, user clicks "Generate Tweet"
4. If no commits → show date range picker to find older commits
5. AI generates ONE tweet summarizing all selected commits
6. User can copy or share to Twitter via web intent

## App Structure

**Navigation (simplified):**
- Dashboard - Main workflow (commits → generate → share)
- Repositories - Connect/manage GitHub repos
- Settings - Account, GitHub connection, Billing

**Removed pages:**
- /dashboard/commits
- /dashboard/tweets

## Dashboard States

### State A: Has commits today
- Show today's date
- List commits with checkboxes (all pre-selected)
- "Generate Tweet" button

### State B: No commits today
- Show "No commits found today" message
- Date range picker (start date → end date)
- Search button to find commits in range

### State C: After generation
- Show generated tweet in editable textarea
- Character count (X/280)
- Tone input field for regeneration instructions
- Buttons: Regenerate, Copy, Share to X

## Tweet Generation

**Input:**
- Array of commit IDs
- Optional tone instruction (free text, e.g., "more technical", "add humor")

**Output:**
- ONE tweet summarizing all commits
- Respects 280 character limit

**Example:**
3 commits: auth feature, bug fix, docs update
→ "Shipped user auth today! Fixed a tricky login bug and updated the docs. Building in public 🚀"

## Backend Changes

### New/Modified Functions

**`commits.getByDateRange`**
- Args: userId, startDate, endDate
- Returns commits within range across all connected repos

**`ai.generateTweet`** (modify existing)
- Args: commitIds[], toneInstruction?
- Returns: single tweet string

### Schema Simplification

**generatedTweets table:**
- Keep: userId, commitIds, content, characterCount, generatedAt
- Remove: tone (enum), status, twitterPostId, postedAt

**users table:**
- Remove: twitterAccessToken, twitterRefreshToken, twitterUsername
- Remove: voiceTone (preset enum)
- Keep: productDescription, targetAudience, exampleTweets (still useful for AI context)

## UI Components

### Twitter Share
Uses web intent (no API needed):
```
https://twitter.com/intent/tweet?text={encodeURIComponent(tweetContent)}
```

Opens Twitter in new tab with pre-filled tweet. User posts manually.

## Settings Page Cleanup

**Remove:**
- Voice tab with preset tones
- Twitter connection section

**Keep:**
- Account tab (name, email)
- Connections tab (GitHub only)
- Billing tab (plans, usage)

## Files to Delete

- `src/routes/dashboard/commits.tsx`
- `src/routes/dashboard/tweets.tsx`

## Files to Modify

- `src/routes/dashboard/index.tsx` - Complete rewrite for new flow
- `src/routes/dashboard.tsx` - Update sidebar navigation
- `src/routes/dashboard/settings.tsx` - Remove voice/twitter sections
- `convex/schema.ts` - Simplify generatedTweets and users tables
- `convex/ai.ts` - Update to generate single summarized tweet
- `convex/commits.ts` - Add getByDateRange query
- `convex/tweets.ts` - Simplify, remove status-related functions
- `convex/users.ts` - Remove twitter/voice functions
