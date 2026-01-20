import { useAction } from "convex/react";
import { api } from "~/lib/convex";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { Id } from "convex/_generated/dataModel";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: Id<"users">;
  reason: string;
  currentPlan: "free" | "pro" | "builder";
}

export function UpgradeModal({
  open,
  onOpenChange,
  userId,
  reason,
  currentPlan,
}: UpgradeModalProps) {
  const [loading, setLoading] = useState<"pro" | "builder" | null>(null);
  const createCheckout = useAction(api.stripe.createCheckoutSession);

  const handleUpgrade = async (plan: "pro" | "builder") => {
    setLoading(plan);
    try {
      const { url } = await createCheckout({
        userId,
        plan,
        successUrl: `${window.location.origin}/dashboard?upgraded=true`,
        cancelUrl: `${window.location.origin}/dashboard`,
      });
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error("Failed to create checkout:", error);
    } finally {
      setLoading(null);
    }
  };

  const plans = [
    {
      id: "pro" as const,
      name: "Pro",
      price: "$9/mo",
      features: ["5 repositories", "100 generations/month", "Direct Twitter posting"],
    },
    {
      id: "builder" as const,
      name: "Builder",
      price: "$19/mo",
      features: ["Unlimited repositories", "Unlimited generations", "Priority AI"],
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upgrade Your Plan</DialogTitle>
          <DialogDescription>{reason}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {plans
            .filter((p) => p.id !== currentPlan)
            .map((plan) => (
              <Card key={plan.id} className="relative">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <span className="text-2xl font-bold">{plan.price}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={loading !== null}
                  >
                    {loading === plan.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Upgrade to {plan.name}
                  </Button>
                </CardContent>
              </Card>
            ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
