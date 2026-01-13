# Commeet

Build in Public, Effortlessly. Transform your GitHub commits into engaging tweets.

## Tech Stack

- **Framework**: TanStack Start (with TanStack Router)
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **Authentication**: Better Auth
- **Database**: Convex
- **Payments**: Stripe
- **AI**: Anthropic Claude

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- A Convex account
- GitHub OAuth app credentials
- Anthropic API key

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

3. Copy the environment example and fill in your values:
```bash
cp .env.example .env
```

4. Set up Convex:
```bash
npx convex dev
```

5. Start the development server:
```bash
npm run dev
```

## Project Structure

```
commeet/
├── app/
│   ├── components/
│   │   └── ui/           # shadcn/ui components
│   ├── lib/              # Utility functions
│   ├── routes/           # TanStack Router file-based routes
│   │   ├── __root.tsx    # Root layout
│   │   ├── index.tsx     # Home page
│   │   ├── login.tsx     # Login page
│   │   ├── signup.tsx    # Signup page
│   │   └── dashboard/    # Dashboard routes
│   ├── styles/           # Global styles
│   ├── client.tsx        # Client entry point
│   ├── router.tsx        # Router configuration
│   └── ssr.tsx           # Server entry point
├── convex/
│   ├── schema.ts         # Database schema
│   ├── users.ts          # User queries/mutations
│   ├── repositories.ts   # Repository queries/mutations
│   ├── commits.ts        # Commit queries/mutations
│   └── tweets.ts         # Tweet queries/mutations
├── app.config.ts         # TanStack Start config
├── tailwind.config.ts    # Tailwind configuration
└── tsconfig.json         # TypeScript configuration
```

## Features

- **GitHub Integration**: Connect repositories and sync commits
- **AI Tweet Generation**: Generate 4 tweet variations per commit with different tones
- **Voice Customization**: Configure your product description, target audience, and writing style
- **Twitter Integration**: Post directly to Twitter/X
- **Dashboard**: Track your repositories, commits, and generated tweets

## Deployment

This project is configured for deployment on Netlify. The `app.config.ts` uses the Netlify preset.

## License

MIT
