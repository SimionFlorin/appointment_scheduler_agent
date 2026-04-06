"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  CreditCard,
  CheckCircle,
  Clock,
  AlertTriangle,
  Loader2,
  Sparkles,
} from "lucide-react";

interface SubscriptionInfo {
  status: "trialing" | "active" | "past_due" | "cancelled" | "expired" | "none";
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  daysLeft: number | null;
  isActive: boolean;
}

export default function BillingPage() {
  const searchParams = useSearchParams();
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [currency, setCurrency] = useState<"USD" | "RON">("USD");

  const fetchSubscription = useCallback(async () => {
    const res = await fetch("/api/billing/status");
    const data = await res.json();
    setSubscription(data.subscription);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  useEffect(() => {
    if (searchParams.get("status") === "success") {
      toast.success("Payment received! Activating your subscription...");
      const interval = setInterval(async () => {
        const res = await fetch("/api/billing/status");
        const data = await res.json();
        setSubscription(data.subscription);
        if (data.subscription.status === "active") {
          clearInterval(interval);
          toast.success("Subscription activated successfully!");
        }
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [searchParams]);

  async function handleCheckout() {
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currency }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to create checkout");
        return;
      }

      window.location.href = data.checkoutUrl;
    } catch {
      toast.error("Something went wrong");
    } finally {
      setCheckoutLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const statusConfig = {
    trialing: {
      label: "Free Trial",
      variant: "default" as const,
      icon: Clock,
      color: "text-blue-600",
      bgColor: "bg-blue-50 border-blue-200",
    },
    active: {
      label: "Active",
      variant: "default" as const,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50 border-green-200",
    },
    past_due: {
      label: "Past Due",
      variant: "destructive" as const,
      icon: AlertTriangle,
      color: "text-orange-600",
      bgColor: "bg-orange-50 border-orange-200",
    },
    expired: {
      label: "Expired",
      variant: "destructive" as const,
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50 border-red-200",
    },
    cancelled: {
      label: "Cancelled",
      variant: "secondary" as const,
      icon: AlertTriangle,
      color: "text-gray-600",
      bgColor: "bg-gray-50 border-gray-200",
    },
    none: {
      label: "No Subscription",
      variant: "secondary" as const,
      icon: AlertTriangle,
      color: "text-gray-600",
      bgColor: "bg-gray-50 border-gray-200",
    },
  };

  const status = subscription?.status || "none";
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-muted-foreground">
          Manage your subscription and payments
        </p>
      </div>

      {/* Current status */}
      <Card className={config.bgColor}>
        <CardContent className="py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <StatusIcon className={`h-5 w-5 ${config.color}`} />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{config.label}</span>
                  <Badge variant={config.variant}>{status.toUpperCase()}</Badge>
                </div>
                {subscription?.daysLeft !== null && subscription?.daysLeft !== undefined && (
                  <p className={`text-sm mt-0.5 ${config.color}`}>
                    {subscription.daysLeft} day{subscription.daysLeft !== 1 ? "s" : ""} remaining
                  </p>
                )}
              </div>
            </div>
            {subscription?.trialEndsAt && status === "trialing" && (
              <p className="text-sm text-muted-foreground">
                Trial ends{" "}
                {new Date(subscription.trialEndsAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            )}
            {subscription?.currentPeriodEnd && status === "active" && (
              <p className="text-sm text-muted-foreground">
                Renews{" "}
                {new Date(subscription.currentPeriodEnd).toLocaleDateString(
                  "en-US",
                  { month: "long", day: "numeric", year: "numeric" }
                )}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Subscription plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            BookMe AI Pro
          </CardTitle>
          <CardDescription>
            Everything you need to automate your appointment scheduling
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold">
              {currency === "USD" ? "$20" : "100 RON"}
            </span>
            <span className="text-muted-foreground">/month</span>
          </div>

          <ul className="space-y-2 text-sm">
            {[
              "AI-powered WhatsApp scheduling assistant",
              "Unlimited appointments",
              "Google Calendar integration",
              "Customer conversation history",
              "Chat simulator for testing",
              "Multi-provider AI support (Gemini & OpenAI)",
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                {feature}
              </li>
            ))}
          </ul>

          {status !== "active" && (
            <>
              <div className="flex gap-2">
                <Button
                  variant={currency === "USD" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrency("USD")}
                >
                  USD ($20)
                </Button>
                <Button
                  variant={currency === "RON" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrency("RON")}
                >
                  RON (100 lei)
                </Button>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleCheckout}
                disabled={checkoutLoading}
              >
                {checkoutLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating checkout...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    {status === "trialing"
                      ? "Subscribe Now"
                      : "Reactivate Subscription"}
                  </>
                )}
              </Button>

              {status === "trialing" && (
                <p className="text-xs text-center text-muted-foreground">
                  You can continue using BookMe AI for free during your trial
                  period. Subscribe anytime to ensure uninterrupted service.
                </p>
              )}
            </>
          )}

          {status === "active" && (
            <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700 border border-green-200">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium">Your subscription is active</span>
              </div>
              <p className="mt-1 text-green-600">
                You have full access to all BookMe AI features.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment info card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment Information</CardTitle>
          <CardDescription>
            Payments are securely processed by Revolut
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            We use Revolut&apos;s secure hosted checkout for all payments. Your
            card details are never stored on our servers.
          </p>
          <p>
            Accepted methods: Visa, Mastercard, Revolut Pay, Apple Pay, Google
            Pay, and bank transfers.
          </p>
          <p>
            For billing questions, contact us at{" "}
            <span className="font-medium text-foreground">
              support@bookmechat.com
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
