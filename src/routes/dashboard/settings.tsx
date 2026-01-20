import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useAction, useQuery } from "convex/react";
import { api } from "~/lib/convex";
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
import { Progress } from "~/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  Github,
  Twitter,
  CreditCard,
  User,
  MessageSquare,
  Check,
  X,
  Loader2,
  Crown,
  Sparkles,
} from "lucide-react";
import { useSyncUser } from "~/hooks/use-sync-user";
import { signIn } from "~/lib/auth-client";

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  // Use sync hook
  const { appUser, hasGitHub, githubAccessToken, isLoading } = useSyncUser();
  const updateVoiceSettings = useMutation(api.users.updateVoiceSettings);
  const createCheckout = useAction(api.stripe.createCheckoutSession);
  const createPortal = useAction(api.stripe.createPortalSession);

  const [productDescription, setProductDescription] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [voiceTone, setVoiceTone] = useState<"casual" | "professional" | "excited" | "technical">("casual");
  const [exampleTweets, setExampleTweets] = useState<string[]>(["", "", ""]);
  const [saving, setSaving] = useState(false);
  const [upgradingTo, setUpgradingTo] = useState<"pro" | "builder" | null>(null);
  const [openingPortal, setOpeningPortal] = useState(false);

  // Get usage stats
  const usage = useQuery(
    api.usage.getCurrentUsage,
    appUser?._id ? { userId: appUser._id } : "skip"
  );

  // Get user data from appUser
  const user = {
    name: appUser?.name || "",
    email: appUser?.email || "",
    plan: appUser?.plan || "free",
    githubConnected: hasGitHub,
    githubUsername: appUser?.githubUsername || "",
    twitterConnected: !!appUser?.twitterUsername,
    twitterUsername: appUser?.twitterUsername || "",
  };

  const voiceSettings = {
    productDescription: appUser?.productDescription || "",
    targetAudience: appUser?.targetAudience || "",
    voiceTone: appUser?.voiceTone || "casual",
    exampleTweets: appUser?.exampleTweets || [],
  };

  const handleSaveVoiceSettings = async () => {
    if (!appUser?._id) return;
    setSaving(true);
    try {
      await updateVoiceSettings({
        userId: appUser._id,
        voiceTone: voiceTone || voiceSettings.voiceTone,
        productDescription: productDescription || voiceSettings.productDescription || undefined,
        targetAudience: targetAudience || voiceSettings.targetAudience || undefined,
        exampleTweets: exampleTweets.filter(t => t.trim()) || undefined,
      });
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleConnectGitHub = async () => {
    try {
      await signIn.social({
        provider: "github",
        callbackURL: "/dashboard/settings",
      });
    } catch (error) {
      console.error("Failed to connect GitHub:", error);
    }
  };

  const handleUpgrade = async (plan: "pro" | "builder") => {
    if (!appUser?._id) return;
    setUpgradingTo(plan);
    try {
      const { url } = await createCheckout({
        userId: appUser._id,
        plan,
        successUrl: `${window.location.origin}/dashboard/settings?upgraded=true`,
        cancelUrl: `${window.location.origin}/dashboard/settings`,
      });
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error("Failed to create checkout:", error);
    } finally {
      setUpgradingTo(null);
    }
  };

  const handleManageSubscription = async () => {
    if (!appUser?._id) return;
    setOpeningPortal(true);
    try {
      const { url } = await createPortal({
        userId: appUser._id,
        returnUrl: `${window.location.origin}/dashboard/settings`,
      });
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error("Failed to open billing portal:", error);
    } finally {
      setOpeningPortal(false);
    }
  };

  if (isLoading || !appUser) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

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

              <Button onClick={handleSaveVoiceSettings} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Voice Settings
              </Button>
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
                <Button className="gap-2" onClick={handleConnectGitHub}>
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
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-semibold capitalize">
                      {user.plan} Plan
                    </p>
                    {user.plan === "builder" && <Crown className="h-4 w-4 text-yellow-500" />}
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
                {user.plan === "free" && (
                  <Button onClick={() => handleUpgrade("pro")} disabled={upgradingTo !== null}>
                    {upgradingTo === "pro" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Sparkles className="mr-2 h-4 w-4" />
                    Upgrade to Pro
                  </Button>
                )}
                {user.plan !== "free" && (
                  <Button variant="outline" onClick={handleManageSubscription} disabled={openingPortal}>
                    {openingPortal && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Manage Subscription
                  </Button>
                )}
              </div>

              {/* Usage Stats */}
              {usage && (
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="text-sm font-medium">Current Usage</h4>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>Repositories</span>
                        <span className="text-muted-foreground">
                          {usage.repositoriesUsed} / {usage.repositoriesLimit === -1 ? "Unlimited" : usage.repositoriesLimit}
                        </span>
                      </div>
                      {usage.repositoriesLimit !== -1 && (
                        <Progress
                          value={(usage.repositoriesUsed / usage.repositoriesLimit) * 100}
                          className="h-2"
                        />
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>Tweet Generations (this month)</span>
                        <span className="text-muted-foreground">
                          {usage.generationsUsed} / {usage.generationsLimit === -1 ? "Unlimited" : usage.generationsLimit}
                        </span>
                      </div>
                      {usage.generationsLimit !== -1 && (
                        <Progress
                          value={(usage.generationsUsed / usage.generationsLimit) * 100}
                          className="h-2"
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}
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
                  <CardContent className="space-y-4">
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2"><Check className="h-3 w-3 text-green-500" />1 repository</li>
                      <li className="flex items-center gap-2"><Check className="h-3 w-3 text-green-500" />10 generations/month</li>
                      <li className="flex items-center gap-2"><Check className="h-3 w-3 text-green-500" />Copy to clipboard</li>
                    </ul>
                    {user.plan === "free" && (
                      <Badge className="w-full justify-center" variant="secondary">Current Plan</Badge>
                    )}
                  </CardContent>
                </Card>

                <Card className={user.plan === "pro" ? "border-primary" : ""}>
                  <CardHeader>
                    <CardTitle className="text-lg">Pro</CardTitle>
                    <div className="text-2xl font-bold">$9<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2"><Check className="h-3 w-3 text-green-500" />5 repositories</li>
                      <li className="flex items-center gap-2"><Check className="h-3 w-3 text-green-500" />100 generations/month</li>
                      <li className="flex items-center gap-2"><Check className="h-3 w-3 text-green-500" />Direct Twitter posting</li>
                    </ul>
                    {user.plan === "pro" ? (
                      <Badge className="w-full justify-center" variant="secondary">Current Plan</Badge>
                    ) : user.plan === "free" ? (
                      <Button className="w-full" onClick={() => handleUpgrade("pro")} disabled={upgradingTo !== null}>
                        {upgradingTo === "pro" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Upgrade
                      </Button>
                    ) : null}
                  </CardContent>
                </Card>

                <Card className={user.plan === "builder" ? "border-primary" : ""}>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">Builder</CardTitle>
                      <Crown className="h-4 w-4 text-yellow-500" />
                    </div>
                    <div className="text-2xl font-bold">$19<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2"><Check className="h-3 w-3 text-green-500" />Unlimited repositories</li>
                      <li className="flex items-center gap-2"><Check className="h-3 w-3 text-green-500" />Unlimited generations</li>
                      <li className="flex items-center gap-2"><Check className="h-3 w-3 text-green-500" />Priority AI processing</li>
                    </ul>
                    {user.plan === "builder" ? (
                      <Badge className="w-full justify-center" variant="secondary">Current Plan</Badge>
                    ) : (
                      <Button className="w-full" onClick={() => handleUpgrade("builder")} disabled={upgradingTo !== null}>
                        {upgradingTo === "builder" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Upgrade
                      </Button>
                    )}
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
