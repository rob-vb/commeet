import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { GitCommit, Twitter, Sparkles, Zap } from "lucide-react";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <GitCommit className="h-6 w-6" />
            <span className="text-xl font-bold">Commeet</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost">Log in</Button>
            </Link>
            <Link to="/signup">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <Badge variant="secondary" className="mb-4">
          Build in Public, Effortlessly
        </Badge>
        <h1 className="mb-6 text-5xl font-bold tracking-tight">
          Turn Your Commits Into
          <br />
          <span className="text-primary">Engaging Tweets</span>
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-xl text-muted-foreground">
          Commeet transforms your GitHub commits into AI-powered tweet
          variations. Share your shipping progress and grow your audience
          without the writer's block.
        </p>
        <div className="flex justify-center gap-4">
          <Link to="/signup">
            <Button size="lg" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Start for Free
            </Button>
          </Link>
          <Link to="/login">
            <Button size="lg" variant="outline">
              Log in
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="mb-12 text-center text-3xl font-bold">How It Works</h2>
        <div className="grid gap-8 md:grid-cols-3">
          <Card>
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <GitCommit className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Connect GitHub</CardTitle>
              <CardDescription>
                Link your GitHub repositories and we'll sync your commits
                automatically.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Generate Tweets</CardTitle>
              <CardDescription>
                Select commits and let AI generate multiple tweet variations
                tailored to your voice.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Twitter className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Share & Grow</CardTitle>
              <CardDescription>
                Post directly to Twitter or copy to clipboard. Build your
                audience with consistent updates.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="mb-4 text-center text-3xl font-bold">
          Simple, Transparent Pricing
        </h2>
        <p className="mb-12 text-center text-muted-foreground">
          Start free, upgrade when you need more.
        </p>
        <div className="grid gap-8 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Free</CardTitle>
              <CardDescription>Perfect for getting started</CardDescription>
              <div className="text-3xl font-bold">$0</div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>1 connected repository</li>
                <li>10 tweet generations/month</li>
                <li>Basic voice settings</li>
                <li>Copy to clipboard</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-primary">
            <CardHeader>
              <Badge className="mb-2 w-fit">Popular</Badge>
              <CardTitle>Pro</CardTitle>
              <CardDescription>For active builders</CardDescription>
              <div className="text-3xl font-bold">
                $9<span className="text-base font-normal">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>5 connected repositories</li>
                <li>100 tweet generations/month</li>
                <li>Full voice customization</li>
                <li>Direct Twitter posting</li>
                <li>Tweet history</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Builder</CardTitle>
              <CardDescription>For power users</CardDescription>
              <div className="text-3xl font-bold">
                $19<span className="text-base font-normal">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Unlimited repositories</li>
                <li>Unlimited generations</li>
                <li>Priority AI processing</li>
                <li>Analytics dashboard</li>
                <li>Batch generation</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <Card className="mx-auto max-w-2xl bg-primary text-primary-foreground">
          <CardHeader>
            <CardTitle className="text-2xl">
              Ready to Build in Public?
            </CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Join thousands of indie hackers sharing their journey.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/signup">
              <Button size="lg" variant="secondary" className="gap-2">
                <Zap className="h-4 w-4" />
                Get Started Free
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <GitCommit className="h-4 w-4" />
            <span>Commeet</span>
          </div>
          <div className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Commeet. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
