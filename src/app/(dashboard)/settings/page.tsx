"use client";

import { useState } from "react";
import {
  Github,
  Twitter,
  User,
  Mic,
  Unlink,
  Loader2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

// Mock data - will be replaced with actual user data
const mockUser = {
  name: "John Doe",
  email: "john@example.com",
  githubUsername: "johndoe",
  twitterUsername: null,
  voiceTone: "casual",
  productDescription: "",
  targetAudience: "",
  exampleTweets: [],
};

const toneOptions = [
  { value: "casual", label: "Casual", description: "Friendly, conversational" },
  {
    value: "professional",
    label: "Professional",
    description: "Business-like, polished",
  },
  { value: "excited", label: "Excited", description: "Enthusiastic, energetic" },
  { value: "technical", label: "Technical", description: "Developer-focused" },
];

export default function SettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [voiceTone, setVoiceTone] = useState(mockUser.voiceTone);
  const [productDescription, setProductDescription] = useState(
    mockUser.productDescription
  );
  const [targetAudience, setTargetAudience] = useState(mockUser.targetAudience);
  const [exampleTweets, setExampleTweets] = useState(
    mockUser.exampleTweets.join("\n\n")
  );

  const handleSaveVoice = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    toast.success("Voice settings saved!");
  };

  const handleConnectGitHub = () => {
    // Will redirect to GitHub OAuth
    window.location.href = "/api/github/auth";
  };

  const handleConnectTwitter = () => {
    // Will redirect to Twitter OAuth
    window.location.href = "/api/twitter/auth";
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and voice settings
        </p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile
          </CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" defaultValue={mockUser.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" defaultValue={mockUser.email} disabled />
            </div>
          </div>
          <Button>Save Profile</Button>
        </CardContent>
      </Card>

      {/* Connections Section */}
      <Card>
        <CardHeader>
          <CardTitle>Connections</CardTitle>
          <CardDescription>
            Connect your accounts to enable full functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* GitHub */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Github className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">GitHub</p>
                {mockUser.githubUsername ? (
                  <p className="text-sm text-muted-foreground">
                    Connected as @{mockUser.githubUsername}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Connect to sync repositories
                  </p>
                )}
              </div>
            </div>
            {mockUser.githubUsername ? (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  <Check className="h-3 w-3" />
                  Connected
                </Badge>
                <Button variant="outline" size="sm">
                  <Unlink className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button onClick={handleConnectGitHub} className="gap-2">
                <Github className="h-4 w-4" />
                Connect
              </Button>
            )}
          </div>

          <Separator />

          {/* Twitter */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Twitter className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">Twitter / X</p>
                {mockUser.twitterUsername ? (
                  <p className="text-sm text-muted-foreground">
                    Connected as @{mockUser.twitterUsername}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Connect to post tweets directly
                  </p>
                )}
              </div>
            </div>
            {mockUser.twitterUsername ? (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  <Check className="h-3 w-3" />
                  Connected
                </Badge>
                <Button variant="outline" size="sm">
                  <Unlink className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button onClick={handleConnectTwitter} className="gap-2">
                <Twitter className="h-4 w-4" />
                Connect
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Voice Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Voice Settings
          </CardTitle>
          <CardDescription>
            Customize how AI generates tweets to match your style
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="tone">Preferred Tone</Label>
            <Select value={voiceTone} onValueChange={setVoiceTone}>
              <SelectTrigger>
                <SelectValue placeholder="Select a tone" />
              </SelectTrigger>
              <SelectContent>
                {toneOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div>
                      <span className="font-medium">{option.label}</span>
                      <span className="text-muted-foreground">
                        {" "}
                        - {option.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="product">What are you building?</Label>
            <Textarea
              id="product"
              placeholder="A task management app for remote teams that helps them stay organized and productive..."
              value={productDescription}
              onChange={(e) => setProductDescription(e.target.value)}
              className="min-h-[80px]"
            />
            <p className="text-xs text-muted-foreground">
              Describe your product or project to help AI understand context
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="audience">Who is your target audience?</Label>
            <Input
              id="audience"
              placeholder="Indie hackers, startup founders, remote workers..."
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="examples">Example Tweets (optional)</Label>
            <Textarea
              id="examples"
              placeholder="Paste 3-5 example tweets that represent your writing style. Separate each tweet with a blank line."
              value={exampleTweets}
              onChange={(e) => setExampleTweets(e.target.value)}
              className="min-h-[120px]"
            />
            <p className="text-xs text-muted-foreground">
              Help AI learn your unique voice by providing example tweets
            </p>
          </div>

          <Button onClick={handleSaveVoice} disabled={isSaving} className="gap-2">
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Voice Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
