import Link from "next/link";
import { CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/site-footer";

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <CalendarCheck className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold">BookMe AI | Your AI Receptionist That Never Sleeps</span>
          </Link>
          <Link href="/login">
            <Button>Sign In</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-2">Refund Policy</h1>
        <p className="text-muted-foreground mb-8">
          Last updated: May 5, 2026
        </p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <p className="text-muted-foreground leading-relaxed">
              BookMe AI is a B2B subscription service. The following terms apply
              to all paid Subscriptions and Token Overage charges processed by
              our reseller, Paddle.com Market Ltd.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              1. 30-day free Trial
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Every Tenant receives a 30-day Trial with full platform access at
              zero cost and no payment method required. The Trial is the
              evaluation window for the service &mdash; by entering payment
              details and starting a paid Subscription, the Tenant confirms they
              have evaluated BookMe AI and accepted that it meets their needs.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              2. Subscription Fees are non-refundable
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Subscription Fees paid for the current billing period are
              non-refundable, including (but not limited to) cases of partial
              use, non-use, or mid-period cancellation. Cancelling a
              Subscription stops future renewals; it does not refund the current
              period.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              3. Token Overage charges are non-refundable
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Charges for Token usage above the Tier&apos;s Token Allowance
              reflect resources already consumed by the Tenant&apos;s WhatsApp
              traffic and are non-refundable once invoiced.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Cancellation</h2>
            <p className="text-muted-foreground leading-relaxed">
              A Tenant may cancel at any time from the dashboard or by emailing{" "}
              <a
                href="mailto:support@bookmeai.app"
                className="text-primary hover:underline"
              >
                support@bookmeai.app
              </a>
              . Access remains active until the end of the paid period; no
              further charges are made after cancellation.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Exceptions</h2>
            <p className="text-muted-foreground mb-4">
              We will issue a refund in these specific cases:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Duplicate charges caused by a billing error.</li>
              <li>
                Charges after a confirmed cancellation that should not have been
                billed.
              </li>
              <li>
                Service unavailable for an extended period due to a verified
                fault on our side (not third-party outages such as Meta, Twilio,
                or Google).
              </li>
            </ul>
            <p className="text-muted-foreground mt-4">
              Refund requests for the above must be submitted to{" "}
              <a
                href="mailto:support@bookmeai.app"
                className="text-primary hover:underline"
              >
                support@bookmeai.app
              </a>{" "}
              within 30 days of the charge.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              6. How to request a refund
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Email{" "}
              <a
                href="mailto:support@bookmeai.app"
                className="text-primary hover:underline"
              >
                support@bookmeai.app
              </a>{" "}
              from the address associated with the Tenant account, including
              the Paddle order number and a brief description of the issue.
              Approved refunds are processed by Paddle to the original payment
              method, typically within 5&ndash;10 business days.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Disputes</h2>
            <p className="text-muted-foreground leading-relaxed">
              Before raising a chargeback, please contact us &mdash; most
              billing issues are resolved within one business day.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Contact</h2>
            <div className="bg-muted p-6 rounded-lg">
              <p className="font-medium mb-2">BookMe AI</p>
              <p className="text-muted-foreground">
                Email:{" "}
                <a
                  href="mailto:support@bookmeai.app"
                  className="text-primary hover:underline"
                >
                  support@bookmeai.app
                </a>
              </p>
            </div>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t text-center">
          <Link href="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>
      </main>

      <SiteFooter className="mt-12" />
    </div>
  );
}
