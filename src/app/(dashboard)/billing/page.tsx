"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { CreditCard, Check, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

// Mock data - will be replaced with actual user data
const mockUser = {
  plan: "free" as const,
  planExpiresAt: null,
};

const plans = [
  {
    id: "free",
    name: "Free",
    price: 0,
    description: "Perfect for getting started",
    features: [
      "1 connected repository",
      "10 tweet generations/month",
      "Copy to clipboard",
      "Basic voice customization",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 9,
    description: "For serious builders",
    features: [
      "3 connected repositories",
      "100 tweet generations/month",
      "Copy to clipboard",
      "Direct posting to X",
      "Full voice customization",
    ],
    popular: true,
  },
  {
    id: "builder",
    name: "Builder",
    price: 19,
    description: "For power users",
    features: [
      "Unlimited repositories",
      "Unlimited tweet generations",
      "Copy to clipboard",
      "Direct posting to X",
      "Full voice customization",
      "Priority processing",
    ],
  },
];

export default function BillingPage() {
  const searchParams = useSearchParams();
  const selectedPlan = searchParams.get("plan");
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleSubscribe = async (planId: string) => {
    if (planId === "free") return;

    setIsLoading(planId);
    // Simulate API call to create Stripe checkout session
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Would redirect to Stripe Checkout
    toast.success("Redirecting to checkout...");
    setIsLoading(null);
  };

  const handleManageSubscription = async () => {
    setIsLoading("manage");
    // Simulate API call to create Stripe portal session
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success("Redirecting to billing portal...");
    setIsLoading(null);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
        <p className="text-muted-foreground">
          Manage your subscription and billing
        </p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current Plan
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold capitalize">
                {mockUser.plan}
              </span>
              <Badge variant="secondary">Active</Badge>
            </div>
            {mockUser.planExpiresAt && (
              <p className="text-sm text-muted-foreground mt-1">
                Renews on{" "}
                {new Date(mockUser.planExpiresAt).toLocaleDateString()}
              </p>
            )}
          </div>
          {mockUser.plan !== "free" && (
            <Button
              variant="outline"
              onClick={handleManageSubscription}
              disabled={isLoading === "manage"}
              className="gap-2"
            >
              {isLoading === "manage" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4" />
              )}
              Manage Subscription
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Available Plans */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Available Plans</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => {
            const isCurrentPlan = mockUser.plan === plan.id;
            const isHighlighted = selectedPlan === plan.id || plan.popular;

            return (
              <Card
                key={plan.id}
                className={
                  isHighlighted && !isCurrentPlan ? "border-primary shadow-lg" : ""
                }
              >
                <CardHeader>
                  {plan.popular && !isCurrentPlan && (
                    <Badge className="w-fit mb-2">Most Popular</Badge>
                  )}
                  {isCurrentPlan && (
                    <Badge variant="secondary" className="w-fit mb-2">
                      Current Plan
                    </Badge>
                  )}
                  <CardTitle>{plan.name}</CardTitle>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    {plan.price > 0 && (
                      <span className="text-muted-foreground">/month</span>
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
                  <Button
                    className="w-full"
                    variant={
                      isCurrentPlan
                        ? "secondary"
                        : isHighlighted
                        ? "default"
                        : "outline"
                    }
                    disabled={isCurrentPlan || isLoading === plan.id}
                    onClick={() => handleSubscribe(plan.id)}
                  >
                    {isLoading === plan.id && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {isCurrentPlan
                      ? "Current Plan"
                      : plan.price === 0
                      ? "Downgrade"
                      : "Upgrade"}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium">Can I cancel anytime?</h4>
            <p className="text-sm text-muted-foreground">
              Yes, you can cancel your subscription at any time. Your access
              will continue until the end of your billing period.
            </p>
          </div>
          <div>
            <h4 className="font-medium">What happens when I hit my limit?</h4>
            <p className="text-sm text-muted-foreground">
              On the Free and Pro plans, you&apos;ll need to wait until next month or
              upgrade to continue generating tweets.
            </p>
          </div>
          <div>
            <h4 className="font-medium">Can I get a refund?</h4>
            <p className="text-sm text-muted-foreground">
              We offer a 14-day money-back guarantee on all paid plans. Contact
              support if you&apos;re not satisfied.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
