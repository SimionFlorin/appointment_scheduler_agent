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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  CreditCard,
  CheckCircle,
  Clock,
  AlertTriangle,
  Loader2,
  Sparkles,
  Tag,
  XCircle,
} from "lucide-react";

interface SubscriptionInfo {
  status:
    | "trialing"
    | "active"
    | "past_due"
    | "cancelled"
    | "expired"
    | "none";
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  daysLeft: number | null;
  isActive: boolean;
  paidDuringTrial: boolean;
}

const VALID_DISCOUNTS: Record<string, { usd: number; ron: number }> = {
  AQUATIQUE: { usd: 3, ron: 15 },
};

export default function BillingPage() {
  const searchParams = useSearchParams();
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [currency, setCurrency] = useState<"USD" | "RON">("USD");

  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<string | null>(null);
  const [discountError, setDiscountError] = useState("");
  const [cardNumber, setCardNumber] = useState("");

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

  function handleApplyDiscount() {
    const code = discountCode.trim().toUpperCase();
    if (!code) {
      setDiscountError("Please enter a discount code");
      return;
    }
    if (VALID_DISCOUNTS[code]) {
      setAppliedDiscount(code);
      setDiscountError("");
      toast.success(`Discount code "${code}" applied!`);
    } else {
      setAppliedDiscount(null);
      setDiscountError("Invalid discount code");
    }
  }

  function handleRemoveDiscount() {
    setAppliedDiscount(null);
    setDiscountCode("");
    setDiscountError("");
  }

  function getDisplayPrice() {
    if (appliedDiscount && VALID_DISCOUNTS[appliedDiscount]) {
      const d = VALID_DISCOUNTS[appliedDiscount];
      return currency === "USD" ? `$${d.usd}` : `${d.ron} RON`;
    }
    return currency === "USD" ? "$20" : "100 RON";
  }

  function getOriginalPrice() {
    return currency === "USD" ? "$20" : "100 RON";
  }

  const testCardNumber = process.env.NEXT_PUBLIC_REVOLUT_TEST_CARD_NUMBER || "";
  const isSandbox =
    testCardNumber && cardNumber.replace(/\s/g, "") === testCardNumber;

  async function handleCheckout() {
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currency,
          discountCode: appliedDiscount,
          cardNumber: cardNumber.replace(/\s/g, ""),
        }),
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

  async function handleUnsubscribe() {
    if (
      !window.confirm(
        "Are you sure you want to cancel your subscription? You will lose access to BookMe AI features at the end of your current billing period."
      )
    ) {
      return;
    }

    setCancelLoading(true);
    try {
      const res = await fetch("/api/billing/cancel", {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to cancel subscription");
        return;
      }

      toast.success("Subscription cancelled successfully.");
      await fetchSubscription();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setCancelLoading(false);
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
                  <Badge variant={config.variant}>
                    {status.toUpperCase()}
                  </Badge>
                </div>
                {subscription?.daysLeft !== null &&
                  subscription?.daysLeft !== undefined && (
                    <p className={`text-sm mt-0.5 ${config.color}`}>
                      {subscription.daysLeft} day
                      {subscription.daysLeft !== 1 ? "s" : ""} remaining
                    </p>
                  )}
              </div>
            </div>
            {subscription?.trialEndsAt && status === "trialing" && (
              <p className="text-sm text-muted-foreground">
                Trial ends{" "}
                {new Date(subscription.trialEndsAt).toLocaleDateString(
                  "en-US",
                  {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  }
                )}
              </p>
            )}
            {subscription?.currentPeriodEnd && status === "active" && (
              <p className="text-sm text-muted-foreground">
                {subscription.paidDuringTrial
                  ? "Paid month starts"
                  : "Renews"}{" "}
                {subscription.paidDuringTrial && subscription.trialEndsAt
                  ? new Date(subscription.trialEndsAt).toLocaleDateString(
                      "en-US",
                      { month: "long", day: "numeric", year: "numeric" }
                    )
                  : new Date(subscription.currentPeriodEnd).toLocaleDateString(
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
            Monthly subscription — everything you need to automate appointment
            scheduling
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-baseline gap-2">
            {appliedDiscount ? (
              <>
                <span className="text-2xl font-bold text-muted-foreground line-through">
                  {getOriginalPrice()}
                </span>
                <span className="text-4xl font-bold text-green-600">
                  {getDisplayPrice()}
                </span>
              </>
            ) : (
              <span className="text-4xl font-bold">{getDisplayPrice()}</span>
            )}
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
              "Auto-renewing monthly subscription",
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                {feature}
              </li>
            ))}
          </ul>

          {status !== "active" && (
            <>
              {/* Currency selector */}
              <div className="flex gap-2">
                <Button
                  variant={currency === "USD" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrency("USD")}
                >
                  USD ({appliedDiscount ? `$${VALID_DISCOUNTS[appliedDiscount]?.usd}` : "$20"})
                </Button>
                <Button
                  variant={currency === "RON" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrency("RON")}
                >
                  RON ({appliedDiscount ? `${VALID_DISCOUNTS[appliedDiscount]?.ron} lei` : "100 lei"})
                </Button>
              </div>

              {/* Discount code */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-sm">
                  <Tag className="h-3.5 w-3.5" />
                  Discount Code
                </Label>
                {appliedDiscount ? (
                  <div className="flex items-center gap-2 rounded-md bg-green-50 border border-green-200 px-3 py-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">
                      {appliedDiscount}
                    </span>
                    <button
                      onClick={handleRemoveDiscount}
                      className="ml-auto text-green-600 hover:text-green-800"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter discount code"
                      value={discountCode}
                      onChange={(e) => {
                        setDiscountCode(e.target.value);
                        setDiscountError("");
                      }}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleApplyDiscount()
                      }
                      className={discountError ? "border-red-300" : ""}
                    />
                    <Button
                      variant="outline"
                      onClick={handleApplyDiscount}
                      type="button"
                    >
                      Apply
                    </Button>
                  </div>
                )}
                {discountError && (
                  <p className="text-xs text-red-500">{discountError}</p>
                )}
              </div>

              {/* Card number (determines sandbox vs live) */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-sm">
                  <CreditCard className="h-3.5 w-3.5" />
                  Card Number
                </Label>
                <Input
                  placeholder="Enter your card number"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  maxLength={19}
                />
                {isSandbox && (
                  <p className="text-xs text-amber-600">
                    Test card detected — sandbox mode will be used
                  </p>
                )}
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
                  Subscribe now to ensure uninterrupted service. Your remaining
                  trial days are preserved — the paid month starts after your
                  trial ends.
                </p>
              )}
            </>
          )}

          {status === "active" && (
            <div className="space-y-4">
              <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700 border border-green-200">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">
                    Your subscription is active
                  </span>
                </div>
                {subscription?.paidDuringTrial && subscription.trialEndsAt ? (
                  <p className="mt-1 text-green-600">
                    Your free trial continues until{" "}
                    <strong>
                      {new Date(subscription.trialEndsAt).toLocaleDateString(
                        "en-US",
                        { month: "long", day: "numeric", year: "numeric" }
                      )}
                    </strong>
                    , then your paid month begins. Access runs through{" "}
                    <strong>
                      {subscription.currentPeriodEnd
                        ? new Date(
                            subscription.currentPeriodEnd
                          ).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "—"}
                    </strong>
                    .
                  </p>
                ) : (
                  <p className="mt-1 text-green-600">
                    You have full access to all BookMe AI features. Your
                    subscription renews automatically each month.
                  </p>
                )}
              </div>

              <Button
                variant="outline"
                className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={handleUnsubscribe}
                disabled={cancelLoading}
              >
                {cancelLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  "Unsubscribe"
                )}
              </Button>
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
            This is a recurring monthly subscription. You can cancel anytime from
            this page.
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
