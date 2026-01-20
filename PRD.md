# Commeet - Product Requirements Document

## Overview

Commeet is a SaaS application that transforms GitHub commits into engaging tweets, helping indie hackers and developers build in public effortlessly.

## Problem Statement

Developers who want to build in public face two challenges:
1. Writing engaging tweets about their work is time-consuming
2. Maintaining consistency in sharing updates leads to writer's block

## Solution

Commeet automates the process by:
1. Syncing with GitHub repositories
2. Analyzing commits and code changes
3. Generating AI-powered tweet variations
4. Allowing users to edit, customize, and post directly

## Target Audience

- Indie hackers building products in public
- Developers maintaining open source projects
- Startup founders sharing development progress
- Content creators in the tech space

## Tech Stack

- **Frontend**: TanStack Start (React), Tailwind CSS v4, shadcn/ui
- **Backend**: Convex (database, serverless functions)
- **Authentication**: Better Auth with Convex adapter
- **AI**: Anthropic Claude API
- **Payments**: Stripe
- **Hosting**: Netlify

## Core Features

### 1. Authentication
- GitHub OAuth login (with repo scope for commit access)
- Email/password authentication
- Cross-domain session management

### 2. Repository Management
- Connect/disconnect GitHub repositories
- Sync repository list from GitHub
- Track repository connection status
- Support for private repositories

### 3. Commit Tracking
- Fetch commits from connected repositories
- Store commit metadata (message, author, date, files changed)
- Filter commits by repository
- Display file change statistics

### 4. AI Tweet Generation
- Select one or multiple commits
- Generate tweet variations using Claude AI
- Customize tone (casual, professional, excited, technical)
- Respect 280 character limit
- Include context from file changes

### 5. Tweet Management
- Edit generated tweets
- Copy to clipboard
- Track tweet status (generated, edited, posted, discarded)
- Tweet history

### 6. Voice Customization
- Set default tone preference
- Add product description for context
- Define target audience
- Provide example tweets for style matching

## Pricing Tiers

### Free ($0/month)
- 1 connected repository
- 10 tweet generations/month
- Basic voice settings
- Copy to clipboard only

### Pro ($9/month)
- 5 connected repositories
- 100 tweet generations/month
- Full voice customization
- Direct Twitter posting
- Tweet history

### Builder ($19/month)
- Unlimited repositories
- Unlimited generations
- Priority AI processing
- Analytics dashboard
- Batch generation

## Database Schema

### Users
- Authentication details
- GitHub connection status
- Twitter connection status
- Voice settings
- Stripe subscription info

### Repositories
- GitHub repository metadata
- Connection status
- Last sync timestamp

### Commits
- Git commit data
- File changes
- Statistics

### Generated Tweets
- Content and tone
- Associated commits
- Status tracking

## API Integrations

### GitHub API
- OAuth authentication
- Repository listing
- Commit fetching
- File change details

### Anthropic Claude API
- Tweet generation
- Context-aware content creation
- Tone customization

### Stripe API
- Subscription management
- Usage metering
- Payment processing

### Twitter API (Future)
- Direct posting
- Thread creation
- Analytics

## User Flows

### Onboarding
1. User signs up with GitHub
2. Grants repository access
3. Selects repositories to track
4. Configures voice settings
5. Views dashboard

### Tweet Generation
1. User views recent commits
2. Selects commits to tweet about
3. Chooses tone
4. AI generates variations
5. User edits/approves
6. Copies or posts tweet

## Success Metrics

- Monthly Active Users (MAU)
- Tweets generated per user
- Conversion rate (free to paid)
- User retention rate
- Time saved per tweet

## Future Roadmap

### Phase 2
- Direct Twitter integration
- Scheduled posting
- Thread generation

### Phase 3
- Analytics dashboard
- A/B testing for tweets
- Team collaboration

### Phase 4
- LinkedIn integration
- Bluesky integration
- Webhook triggers for new commits

## Security Considerations

- OAuth tokens stored securely
- No plain-text credential storage
- Repository access scoped appropriately
- CORS configured for cross-domain auth
- Rate limiting on AI generation

## Launch Checklist

- [x] Core authentication flow
- [x] GitHub OAuth integration
- [x] Repository management
- [x] Commit fetching
- [x] AI tweet generation
- [x] Tweet management UI
- [ ] Stripe billing integration
- [ ] Twitter API integration
- [ ] Production deployment
- [ ] Monitoring and error tracking
