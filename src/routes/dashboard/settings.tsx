import { createFileRoute } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Separator } from "~/components/ui/separator";
import { Badge } from "~/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  Github,
  Twitter,
  CreditCard,
  User,
  MessageSquare,
  Check,
  X,
} from "lucide-react";

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  // Placeholder data - will be replaced with real data from Convex
  const user = {
    name: "",
    email: "",
    plan: "free" as const,
    githubConnected: false,
    githubUsername: "",
    twitterConnected: false,
    twitterUsername: "",
  };

  const voiceSettings = {
    productDescription: "",
    targetAudience: "",
    voiceTone: "casual" as const,
    exampleTweets: [] as string[],
  };

  const tones = [
    { value: "casual", label: "Casual", description: "Friendly and conversational" },
    { value: "professional", label: "Professional", description: "Business-like and polished" },
    { value: "excited", label: "Excited", description: "Enthusiastic and energetic" },
    { value: "technical", label: "Technical", description: "Developer-focused and detailed" },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and voice settings
        </p>
      </div>

      <Tabs defaultValue="voice" className="space-y-6">
        <TabsList>
          <TabsTrigger value="voice" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Voice
          </TabsTrigger>
          <TabsTrigger value="connections" className="gap-2">
            <Github className="h-4 w-4" />
            Connections
          </TabsTrigger>
          <TabsTrigger value="account" className="gap-2">
            <User className="h-4 w-4" />
            Account
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Billing
          </TabsTrigger>
        </TabsList>

        {/* Voice Settings */}
        <TabsContent value="voice" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Voice Configuration</CardTitle>
              <CardDescription>
                Customize how AI generates tweets in your voice
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="productDescription">Product Description</Label>
                <Textarea
                  id="productDescription"
                  placeholder="Describe what you're building (e.g., 'A task management app for remote teams')"
                  defaultValue={voiceSettings.productDescription}
                />
                <p className="text-xs text-muted-foreground">
                  Help the AI understand your product context
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetAudience">Target Audience</Label>
                <Input
                  id="targetAudience"
                  placeholder="Who are you speaking to? (e.g., 'Indie hackers, startup founders')"
                  defaultValue={voiceSettings.targetAudience}
                />
              </div>

              <div className="space-y-3">
                <Label>Default Tone</Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {tones.map((tone) => (
                    <Card
                      key={tone.value}
                      className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                        voiceSettings.voiceTone === tone.value
                          ? "border-primary bg-primary/5"
                          : ""
                      }`}
                    >
                      <CardContent className="flex items-center gap-3 p-4">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full ${
                            voiceSettings.voiceTone === tone.value
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          {voiceSettings.voiceTone === tone.value && (
                            <Check className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{tone.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {tone.description}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Example Tweets (Optional)</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Add 3-5 tweets that represent your writing style
                </p>
                {[0, 1, 2].map((index) => (
                  <Textarea
                    key={index}
                    placeholder={`Example tweet ${index + 1}`}
                    defaultValue={voiceSettings.exampleTweets[index] || ""}
                    className="min-h-[60px]"
                  />
                ))}
              </div>

              <Button>Save Voice Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Connections */}
        <TabsContent value="connections" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>GitHub</CardTitle>
              <CardDescription>
                Connect your GitHub account to import repositories and commits
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user.githubConnected ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <Github className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">@{user.githubUsername}</p>
                      <p className="text-sm text-muted-foreground">Connected</p>
                    </div>
                  </div>
                  <Button variant="outline" className="gap-2">
                    <X className="h-4 w-4" />
                    Disconnect
                  </Button>
                </div>
              ) : (
                <Button className="gap-2">
                  <Github className="h-4 w-4" />
                  Connect GitHub
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Twitter / X</CardTitle>
              <CardDescription>
                Connect your Twitter account to post tweets directly
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user.twitterConnected ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <Twitter className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">@{user.twitterUsername}</p>
                      <p className="text-sm text-muted-foreground">Connected</p>
                    </div>
                  </div>
                  <Button variant="outline" className="gap-2">
                    <X className="h-4 w-4" />
                    Disconnect
                  </Button>
                </div>
              ) : (
                <Button className="gap-2">
                  <Twitter className="h-4 w-4" />
                  Connect Twitter
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account */}
        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Update your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" defaultValue={user.name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue={user.email} />
              </div>
              <Button>Save Changes</Button>
            </CardContent>
          </Card>

          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible actions for your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive">Delete Account</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing */}
        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>Manage your subscription</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-semibold capitalize">
                      {user.plan} Plan
                    </p>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {user.plan === "free"
                      ? "10 tweet generations per month"
                      : user.plan === "pro"
                        ? "100 tweet generations per month"
                        : "Unlimited tweet generations"}
                  </p>
                </div>
                {user.plan === "free" && <Button>Upgrade to Pro</Button>}
                {user.plan !== "free" && (
                  <Button variant="outline">Manage Subscription</Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Plans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <Card className={user.plan === "free" ? "border-primary" : ""}>
                  <CardHeader>
                    <CardTitle className="text-lg">Free</CardTitle>
                    <div className="text-2xl font-bold">$0</div>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <ul className="space-y-1">
                      <li>1 repository</li>
                      <li>10 generations/month</li>
                      <li>Copy to clipboard</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className={user.plan === "pro" ? "border-primary" : ""}>
                  <CardHeader>
                    <CardTitle className="text-lg">Pro</CardTitle>
                    <div className="text-2xl font-bold">$9/mo</div>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <ul className="space-y-1">
                      <li>5 repositories</li>
                      <li>100 generations/month</li>
                      <li>Direct posting</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className={user.plan === "builder" ? "border-primary" : ""}>
                  <CardHeader>
                    <CardTitle className="text-lg">Builder</CardTitle>
                    <div className="text-2xl font-bold">$19/mo</div>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <ul className="space-y-1">
                      <li>Unlimited repos</li>
                      <li>Unlimited generations</li>
                      <li>Priority AI</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
