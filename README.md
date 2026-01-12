# Commeet - Build in Public, Effortlessly

Transform your GitHub commits into engaging tweets. Commeet helps indie hackers and solopreneurs share their development journey with AI-powered tweet generation.

## Features

- **GitHub Integration** - Connect your repositories and sync commits automatically
- **AI-Powered Tweet Generation** - Generate 4 tweet variations per commit (casual, professional, excited, technical)
- **Voice Customization** - Customize AI output to match your writing style
- **Direct Posting** - Post tweets directly to X/Twitter (Pro and Builder plans)
- **Multi-repo Support** - Connect multiple repositories and batch generate tweets

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: shadcn/ui + Tailwind CSS
- **Authentication**: Better Auth
- **Database**: Convex
- **Payments**: Stripe
- **AI**: Anthropic Claude / OpenAI GPT-4o

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- A Convex account
- GitHub OAuth App credentials
- (Optional) Twitter/X OAuth App credentials
- (Optional) Stripe account for payments
- (Optional) Anthropic or OpenAI API key for AI generation

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/commeet.git
cd commeet
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your environment variables in `.env.local`:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
BETTER_AUTH_SECRET=your-secret-key
NEXT_PUBLIC_CONVEX_URL=your-convex-url
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
# ... other variables
```

5. Initialize Convex:
```bash
npx convex dev
```

6. Run the development server:
```bash
npm run dev:next
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (dashboard)/       # Protected dashboard routes
│   ├── api/               # API routes
│   └── auth/              # Authentication pages
├── components/
│   ├── layout/            # Layout components (sidebar, header)
│   ├── providers/         # React context providers
│   └── ui/                # shadcn/ui components
├── lib/                   # Utility functions and auth config
convex/
├── schema.ts              # Database schema
├── users.ts               # User-related functions
├── repositories.ts        # Repository-related functions
├── commits.ts             # Commit-related functions
└── generatedTweets.ts     # Tweet-related functions
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_APP_URL` | Application URL | Yes |
| `BETTER_AUTH_SECRET` | Auth secret key | Yes |
| `NEXT_PUBLIC_CONVEX_URL` | Convex deployment URL | Yes |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID | Yes |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret | Yes |
| `TWITTER_CLIENT_ID` | Twitter OAuth client ID | No |
| `TWITTER_CLIENT_SECRET` | Twitter OAuth client secret | No |
| `STRIPE_SECRET_KEY` | Stripe secret key | No |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | No |
| `ANTHROPIC_API_KEY` | Anthropic API key | No |
| `OPENAI_API_KEY` | OpenAI API key (fallback) | No |

## Pricing Plans

| Feature | Free | Pro ($9/mo) | Builder ($19/mo) |
|---------|------|-------------|------------------|
| Connected Repositories | 1 | 3 | Unlimited |
| Tweet Generations/month | 10 | 100 | Unlimited |
| Copy to Clipboard | Yes | Yes | Yes |
| Direct Posting to X | No | Yes | Yes |
| Voice Customization | Basic | Full | Full |
| Priority Processing | No | No | Yes |

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
