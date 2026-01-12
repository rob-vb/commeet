import Link from "next/link";
import {
  GitCommit,
  Sparkles,
  Zap,
  Clock,
  Shield,
  Check,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: Clock,
    title: "Save Time",
    description:
      "Automatically generate tweet content from your commits. No more staring at a blank screen.",
  },
  {
    icon: Zap,
    title: "Stay Consistent",
    description:
      "Never miss sharing a shipping update. Build your audience with regular content.",
  },
  {
    icon: Sparkles,
    title: "Sound Authentic",
    description:
      "AI learns your voice and writing style. Every tweet feels like you wrote it.",
  },
  {
    icon: Shield,
    title: "Build Audience",
    description:
      "Engage followers with your development journey. Grow your presence on X.",
  },
];

const pricingPlans = [
  {
    name: "Free",
    price: "$0",
    description: "Perfect for getting started",
    features: [
      "1 connected repository",
      "10 tweet generations/month",
      "Copy to clipboard",
      "Basic voice customization",
    ],
    cta: "Get Started",
    href: "/auth/signup",
    popular: false,
  },
  {
    name: "Pro",
    price: "$9",
    period: "/month",
    description: "For serious builders",
    features: [
      "3 connected repositories",
      "100 tweet generations/month",
      "Copy to clipboard",
      "Direct posting to X",
      "Full voice customization",
    ],
    cta: "Start Pro Trial",
    href: "/auth/signup?plan=pro",
    popular: true,
  },
  {
    name: "Builder",
    price: "$19",
    period: "/month",
    description: "For power users",
    features: [
      "Unlimited repositories",
      "Unlimited tweet generations",
      "Copy to clipboard",
      "Direct posting to X",
      "Full voice customization",
      "Priority processing",
    ],
    cta: "Start Builder Trial",
    href: "/auth/signup?plan=builder",
    popular: false,
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <GitCommit className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">Commeet</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="#features">
              <Button variant="ghost">Features</Button>
            </Link>
            <Link href="#pricing">
              <Button variant="ghost">Pricing</Button>
            </Link>
            <Link href="/auth/signin">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth/signup">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="container py-24 sm:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4">
              Build in Public, Effortlessly
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Turn Your GitHub Commits Into{" "}
              <span className="text-primary">Engaging Tweets</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Stop staring at a blank screen. Commeet transforms your commits
              into AI-powered tweet variations tailored to your voice. Perfect
              for indie hackers and solopreneurs building in public.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link href="/auth/signup">
                <Button size="lg" className="gap-2">
                  Start Building in Public
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="outline" size="lg">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>

          {/* Demo Preview */}
          <div className="mt-16 sm:mt-24">
            <div className="mx-auto max-w-4xl rounded-xl border bg-card p-4 shadow-2xl">
              <div className="rounded-lg bg-muted p-8">
                <div className="space-y-4">
                  <div className="flex items-start gap-4 rounded-lg bg-background p-4">
                    <GitCommit className="mt-1 h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        feat: add dark mode support
                      </p>
                      <p className="text-xs text-muted-foreground">
                        +127 -34 | 8 files changed
                      </p>
                    </div>
                    <Badge variant="secondary">Selected</Badge>
                  </div>
                  <div className="flex items-center justify-center py-4">
                    <ArrowRight className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="space-y-3">
                    <div className="rounded-lg border bg-background p-4">
                      <p className="text-sm">
                        Just shipped dark mode! Been wanting to do this forever.
                        Your eyes will thank you for late-night sessions.
                      </p>
                      <Badge variant="outline" className="mt-2">
                        Casual
                      </Badge>
                    </div>
                    <div className="rounded-lg border bg-background p-4">
                      <p className="text-sm">
                        DARK MODE IS LIVE! The most requested feature is finally
                        here. Try it out and let me know what you think!
                      </p>
                      <Badge variant="outline" className="mt-2">
                        Excited
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="container py-24 sm:py-32">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything You Need to Build in Public
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Focus on building. Let Commeet handle your Twitter presence.
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-5xl gap-8 sm:grid-cols-2">
            {features.map((feature) => (
              <Card key={feature.title}>
                <CardHeader>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="mt-4">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="border-y bg-muted/50 py-24 sm:py-32">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                How It Works
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Three simple steps to start building in public.
              </p>
            </div>
            <div className="mx-auto mt-16 grid max-w-5xl gap-8 sm:grid-cols-3">
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                  1
                </div>
                <h3 className="mt-4 text-lg font-semibold">Connect GitHub</h3>
                <p className="mt-2 text-muted-foreground">
                  Link your repositories and sync your commits automatically.
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                  2
                </div>
                <h3 className="mt-4 text-lg font-semibold">Select Commits</h3>
                <p className="mt-2 text-muted-foreground">
                  Browse and select the commits you want to share with the
                  world.
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                  3
                </div>
                <h3 className="mt-4 text-lg font-semibold">Generate & Post</h3>
                <p className="mt-2 text-muted-foreground">
                  Get AI-powered tweet variations and post directly to X.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="container py-24 sm:py-32">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Simple, Transparent Pricing
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Start for free. Upgrade when you need more.
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-5xl gap-8 sm:grid-cols-3">
            {pricingPlans.map((plan) => (
              <Card
                key={plan.name}
                className={plan.popular ? "border-primary shadow-lg" : ""}
              >
                <CardHeader>
                  {plan.popular && (
                    <Badge className="w-fit mb-2">Most Popular</Badge>
                  )}
                  <CardTitle>{plan.name}</CardTitle>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.period && (
                      <span className="text-muted-foreground">{plan.period}</span>
                    )}
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Link href={plan.href} className="w-full">
                    <Button
                      className="w-full"
                      variant={plan.popular ? "default" : "outline"}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t bg-muted/50 py-24 sm:py-32">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Ready to Build in Public?
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Join thousands of indie hackers who are growing their audience
                by sharing their building journey.
              </p>
              <div className="mt-10">
                <Link href="/auth/signup">
                  <Button size="lg" className="gap-2">
                    Get Started for Free
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <GitCommit className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">Commeet</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Build in public, effortlessly.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
