import Link from "next/link";
import { CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/site-footer";

export const metadata = {
  title: "User Data Deletion – BookMe AI",
  description:
    "Delete your BookMe AI account to permanently remove all your data. Instructions for account and data deletion.",
};

export default function DataDeletionPage() {
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
        <h1 className="text-4xl font-bold mb-2">User Data Deletion</h1>
        <p className="text-muted-foreground mb-8">
          Last updated: March 5, 2026
        </p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">
              1. Delete Your Account to Delete Your Data
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              At BookMe AI, deleting your account means deleting all of your
              data. When you delete your account, we permanently remove all
              personal information we have stored about you, including:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>
                Your <strong>profile information</strong> (name, email address,
                Facebook User ID)
              </li>
              <li>
                Your <strong>WhatsApp Business Account</strong> information and
                connection credentials
              </li>
              <li>
                Your <strong>business profile data</strong> (business name,
                profession type, operating hours, and services)
              </li>
              <li>
                All <strong>appointment and scheduling records</strong>
              </li>
              <li>
                All <strong>conversation history</strong> from WhatsApp messages
              </li>
              <li>
                All <strong>OAuth tokens and credentials</strong> linked to your
                account
              </li>
            </ul>
            <p className="text-muted-foreground mt-4 leading-relaxed">
              There is no separate &quot;data deletion&quot; process — deleting
              your account is the single action that removes everything.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              2. How to Delete Your Account
            </h2>
            <p className="text-muted-foreground mb-4">
              You can delete your account and all associated data through any of
              the following methods:
            </p>

            <div className="space-y-6">
              <div className="bg-muted p-6 rounded-lg border-2 border-primary/20">
                <h3 className="text-xl font-medium mb-2">
                  Option A: Delete from Your Account Settings (Recommended)
                </h3>
                <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
                  <li>
                    Log in to your BookMe AI account
                  </li>
                  <li>
                    Go to <strong>Settings</strong>
                  </li>
                  <li>
                    Click <strong>&quot;Delete Account&quot;</strong>
                  </li>
                  <li>
                    Confirm the deletion when prompted
                  </li>
                </ol>
                <p className="text-muted-foreground mt-3">
                  Your account and all data will be permanently deleted
                  immediately.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-medium mb-2">
                  Option B: Email Request
                </h3>
                <p className="text-muted-foreground mb-3">
                  If you are unable to access your account, you can request
                  account deletion by emailing us with the subject line
                  &quot;Account Deletion Request&quot;:
                </p>
                <div className="bg-muted p-6 rounded-lg">
                  <p className="font-medium mb-1">Email:</p>
                  <p className="text-muted-foreground">
                    <a
                      href="mailto:contact@mythril-tech.com?subject=Account%20Deletion%20Request"
                      className="text-primary hover:underline"
                    >
                      contact@mythril-tech.com
                    </a>
                  </p>
                  <p className="text-muted-foreground mt-3">
                    Please include the email address associated with your account
                    so we can locate and delete it along with all your data.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-medium mb-2">
                  Option C: Remove App Access via Facebook
                </h3>
                <p className="text-muted-foreground mb-3">
                  You can remove BookMe AI&apos;s access through Facebook, then
                  contact us to complete the account deletion:
                </p>
                <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
                  <li>
                    Go to your{" "}
                    <a
                      href="https://www.facebook.com/settings?tab=applications"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Facebook Settings &gt; Apps and Websites
                    </a>
                  </li>
                  <li>Find &quot;BookMe AI&quot; in the list of active apps</li>
                  <li>Click &quot;Remove&quot; to revoke access</li>
                  <li>
                    Email{" "}
                    <a
                      href="mailto:contact@mythril-tech.com?subject=Account%20Deletion%20Request"
                      className="text-primary hover:underline"
                    >
                      contact@mythril-tech.com
                    </a>{" "}
                    to confirm you want your account and all stored data deleted
                  </li>
                </ol>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              3. What Happens When You Delete Your Account
            </h2>
            <p className="text-muted-foreground mb-4">
              When your account is deleted — whether by you directly or upon
              your request — the following actions are taken:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>
                Your account and <strong>all personal data</strong> are
                permanently removed from our systems
              </li>
              <li>
                All <strong>OAuth tokens are revoked</strong> and linked services
                (WhatsApp, Google Calendar) are disconnected
              </li>
              <li>
                All <strong>conversation history</strong> and{" "}
                <strong>appointment records</strong> are deleted
              </li>
              <li>
                Your <strong>business profile</strong>, services, and operating
                hours are erased
              </li>
              <li>
                If you requested deletion via email, you will receive a{" "}
                <strong>confirmation email</strong> once the process is complete
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              4. Data That May Be Retained
            </h2>
            <p className="text-muted-foreground mb-4">
              In limited circumstances, some data may be retained even after
              account deletion:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>
                <strong>Legal obligations:</strong> Data required by law,
                regulation, or legal proceedings may be retained for the
                mandated period
              </li>
              <li>
                <strong>Anonymized/aggregated data:</strong> Non-personally
                identifiable data used for analytics may be retained in
                aggregate form
              </li>
              <li>
                <strong>Backup systems:</strong> Data in automated backup
                systems will be purged according to our backup rotation schedule
                (up to 90 days)
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              5. Third-Party Data
            </h2>
            <p className="text-muted-foreground mb-4">
              Deleting your BookMe AI account removes all data from our systems,
              but does not delete data held by third-party services. You may need
              to manage your data separately with:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>
                <strong>Meta / Facebook:</strong>{" "}
                <a
                  href="https://www.facebook.com/help/delete_account"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Facebook Account Deletion
                </a>
              </li>
              <li>
                <strong>WhatsApp:</strong>{" "}
                <a
                  href="https://faq.whatsapp.com/general/account-and-profile/how-to-delete-your-account"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  WhatsApp Account Deletion
                </a>
              </li>
              <li>
                <strong>Google:</strong>{" "}
                <a
                  href="https://myaccount.google.com/permissions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Google Third-Party App Access
                </a>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Contact Us</h2>
            <p className="text-muted-foreground mb-4">
              If you have any questions about account deletion or need
              assistance, please contact us:
            </p>
            <div className="bg-muted p-6 rounded-lg">
              <p className="font-medium mb-2">BookMe AI | Your AI Receptionist That Never Sleeps</p>
              <p className="text-muted-foreground">
                Email:{" "}
                <a
                  href="mailto:contact@mythril-tech.com"
                  className="text-primary hover:underline"
                >
                  contact@mythril-tech.com
                </a>
              </p>
              <p className="text-muted-foreground mt-2">
                Please include &quot;Data Deletion&quot; in your email subject
                line for faster processing.
              </p>
            </div>
          </section>

          <section className="border-t pt-8 mt-8">
            <h2 className="text-2xl font-semibold mb-4">Related Policies</h2>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/privacy-policy"
                  className="text-primary hover:underline"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms-of-service"
                  className="text-primary hover:underline"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <a
                  href="https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Facebook Data Deletion Policy
                </a>
              </li>
            </ul>
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
