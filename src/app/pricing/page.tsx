import Link from "next/link";
import {
  CalendarCheck,
  Check,
  ArrowRight,
  Bot,
  MessageSquare,
  Clock,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/site-footer";

const includedFeatures = [
  "AI receptionist on WhatsApp, 24/7",
  "Google Calendar two-way sync",
  "Powered by Google Gemini with function calling",
  "Pre-loaded service catalogue for your profession",
  "Automatic confirmations, reminders, and rescheduling",
  "Per-Tenant Token Allowance for WhatsApp traffic",
  "Cancel any time from the dashboard",
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <CalendarCheck className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold">
              BookMe AI | Your AI Receptionist That Never Sleeps
            </span>
          </Link>
          <Link href="/login">
            <Button>Sign In</Button>
          </Link>
        </div>
      </header>

      <main>
        <section className="container mx-auto px-4 py-20 text-center">
          <div className="mx-auto max-w-3xl space-y-6">
            <div className="inline-flex items-center rounded-full border bg-muted px-4 py-1.5 text-sm font-medium">
              <Bot className="mr-2 h-4 w-4" />
              Simple, transparent pricing
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              One plan. Everything included.
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Start with a 30-day free trial &mdash; no card required. Pay only
              once you&apos;re sure BookMe AI is right for your business.
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 pb-20">
          <div className="mx-auto max-w-2xl rounded-2xl border bg-card shadow-sm overflow-hidden">
            <div className="p-8 sm:p-10 border-b bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-semibold">BookMe AI Subscription</h2>
                <span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold">
                  30-day free trial
                </span>
              </div>
              <p className="text-muted-foreground">
                Full access to the platform, billed monthly through our
                reseller, Paddle.com Market Ltd.
              </p>

              <div className="mt-6 rounded-xl border bg-background p-6 text-center">
                <p className="text-5xl font-bold tracking-tight">
                  $25
                  <span className="text-lg font-normal text-muted-foreground">
                    {" "}
                    USD / month
                  </span>
                </p>
              </div>

              <p className="mt-4 text-xs text-muted-foreground">
                Prices exclude VAT where applicable.
              </p>
            </div>

            <div className="p-8 sm:p-10">
              <h3 className="font-semibold mb-4">What&apos;s included</h3>
              <ul className="space-y-3">
                {includedFeatures.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-col items-center gap-3">
                <Link href="/login" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full gap-2 sm:w-auto">
                    Start your 30-day free trial
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <p className="text-xs text-muted-foreground">
                  No credit card required to start the trial.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t bg-muted/50 py-16">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 md:grid-cols-3 max-w-3xl mx-auto text-center">
              <div>
                <MessageSquare className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                <h3 className="font-semibold mb-1">WhatsApp first</h3>
                <p className="text-sm text-muted-foreground">
                  Your customers book through the channel they already use.
                </p>
              </div>
              <div>
                <Clock className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                <h3 className="font-semibold mb-1">24/7 availability</h3>
                <p className="text-sm text-muted-foreground">
                  Never miss a booking request, even at 3 AM.
                </p>
              </div>
              <div>
                <Shield className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                <h3 className="font-semibold mb-1">Cancel any time</h3>
                <p className="text-sm text-muted-foreground">
                  Cancel from the dashboard &mdash; access stays until
                  period&apos;s end.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-20">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center text-3xl font-bold mb-10">
              Frequently asked questions
            </h2>
            <div className="space-y-6">
              <div className="rounded-xl border bg-card p-6">
                <h3 className="font-semibold mb-2">
                  Do I need to enter a card to start the trial?
                </h3>
                <p className="text-muted-foreground text-sm">
                  No. The 30-day Trial gives you full platform access at zero
                  cost and no payment method required. You only enter billing
                  details when you decide to start a paid Subscription.
                </p>
              </div>
              <div className="rounded-xl border bg-card p-6">
                <h3 className="font-semibold mb-2">
                  What happens if I go over my Token Allowance?
                </h3>
                <p className="text-muted-foreground text-sm">
                  Each Subscription includes a Token Allowance for WhatsApp
                  traffic. Usage above the allowance is invoiced separately as
                  Token Overage and is non-refundable once consumed.
                </p>
              </div>
              <div className="rounded-xl border bg-card p-6">
                <h3 className="font-semibold mb-2">
                  How do I cancel?
                </h3>
                <p className="text-muted-foreground text-sm">
                  Cancel any time from the billing page in your dashboard, or
                  email{" "}
                  <a
                    href="mailto:support@bookmeai.app"
                    className="text-primary hover:underline"
                  >
                    support@bookmeai.app
                  </a>
                  . Access remains active until the end of the paid period; no
                  further charges are made after cancellation. See our{" "}
                  <Link
                    href="/refund-policy"
                    className="text-primary hover:underline"
                  >
                    Refund Policy
                  </Link>{" "}
                  for full details.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
