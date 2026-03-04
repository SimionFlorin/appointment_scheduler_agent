import Link from "next/link";
import { CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <CalendarCheck className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold">ScheduleAI</span>
          </Link>
          <Link href="/login">
            <Button>Sign In</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">
          Last updated: March 4, 2026
        </p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              ScheduleAI (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) provides an AI-powered appointment 
              scheduling service that integrates with WhatsApp and Google Calendar. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard 
              your information when you use our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              2. Information We Collect
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-medium mb-2">
                  2.1 Information You Provide
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>
                    <strong>Account Information:</strong> Name, email address, and 
                    Google account credentials when you sign in
                  </li>
                  <li>
                    <strong>Business Information:</strong> Business name, profession 
                    type, operating hours, services offered, and service pricing
                  </li>
                  <li>
                    <strong>WhatsApp Information:</strong> WhatsApp Business phone 
                    number, WhatsApp Business Account ID (WABA ID), and related 
                    credentials
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-medium mb-2">
                  2.2 Information Collected Automatically
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>
                    <strong>WhatsApp Messages:</strong> Messages sent by your customers 
                    to your WhatsApp Business number, including message content, 
                    timestamps, and sender phone numbers
                  </li>
                  <li>
                    <strong>Calendar Data:</strong> Your Google Calendar availability, 
                    events, and appointment details (through Google Calendar API)
                  </li>
                  <li>
                    <strong>Appointment Data:</strong> Appointment requests, 
                    confirmations, cancellations, and rescheduling information
                  </li>
                  <li>
                    <strong>Usage Data:</strong> Log data, device information, and 
                    interaction with our service
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              3. How We Use Your Information
            </h2>
            <p className="text-muted-foreground mb-4">
              We use the information we collect for the following purposes:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>
                <strong>Provide Our Service:</strong> Process appointment requests, 
                check calendar availability, book appointments, and send confirmations 
                via WhatsApp
              </li>
              <li>
                <strong>AI Processing:</strong> Use Google Gemini AI to understand 
                and respond to customer messages in natural language
              </li>
              <li>
                <strong>Service Management:</strong> Manage your services, business 
                profile, and operating hours
              </li>
              <li>
                <strong>Communication:</strong> Send you service updates, technical 
                notices, and support messages
              </li>
              <li>
                <strong>Improve Our Service:</strong> Analyze usage patterns to 
                enhance functionality and user experience
              </li>
              <li>
                <strong>Security:</strong> Detect, prevent, and address technical 
                issues and fraudulent activity
              </li>
              <li>
                <strong>Legal Compliance:</strong> Comply with legal obligations 
                and enforce our terms of service
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              4. How We Share Your Information
            </h2>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                We share your information with third-party service providers and in 
                the following circumstances:
              </p>

              <div>
                <h3 className="text-xl font-medium mb-2">
                  4.1 Third-Party Service Providers
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>
                    <strong>Meta Platforms (WhatsApp):</strong> We use Meta&apos;s 
                    WhatsApp Cloud API or Twilio&apos;s WhatsApp service to send and 
                    receive messages with your customers. Message data is processed 
                    according to{" "}
                    <a
                      href="https://www.whatsapp.com/legal/business-policy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      WhatsApp&apos;s Business Policy
                    </a>
                    .
                  </li>
                  <li>
                    <strong>Google:</strong> We access your Google Calendar through 
                    Google Calendar API to check availability and create appointments. 
                    Data is handled according to{" "}
                    <a
                      href="https://policies.google.com/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Google&apos;s Privacy Policy
                    </a>
                    .
                  </li>
                  <li>
                    <strong>Google Gemini AI:</strong> Customer messages are processed 
                    by Google&apos;s Gemini AI to understand intent and generate 
                    appropriate responses.
                  </li>
                  <li>
                    <strong>Database Provider:</strong> We use Supabase (PostgreSQL) 
                    to securely store your account and appointment data.
                  </li>
                  <li>
                    <strong>Hosting Provider:</strong> Our application is hosted on 
                    Vercel for reliable service delivery.
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-medium mb-2">4.2 Legal Requirements</h3>
                <p className="text-muted-foreground">
                  We may disclose your information if required by law, court order, 
                  or government regulation, or if we believe disclosure is necessary 
                  to protect our rights, your safety, or the safety of others.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-medium mb-2">4.3 Business Transfers</h3>
                <p className="text-muted-foreground">
                  In the event of a merger, acquisition, or sale of assets, your 
                  information may be transferred to the acquiring entity.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Data Retention</h2>
            <p className="text-muted-foreground mb-4">
              We retain your information for as long as necessary to provide our 
              service and comply with legal obligations:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>
                <strong>Account Data:</strong> Retained while your account is active 
                and for 90 days after account deletion
              </li>
              <li>
                <strong>Messages and Conversations:</strong> Stored for service 
                functionality and retained for 1 year or until you request deletion
              </li>
              <li>
                <strong>Appointment Data:</strong> Kept for 2 years for record-keeping 
                purposes
              </li>
              <li>
                <strong>OAuth Tokens:</strong> Stored securely in our database and 
                revoked when you disconnect your account
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Data Security</h2>
            <p className="text-muted-foreground mb-4">
              We implement appropriate technical and organizational measures to 
              protect your information:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Encryption of data in transit (HTTPS/TLS)</li>
              <li>Secure storage of OAuth tokens and API credentials</li>
              <li>Database encryption at rest</li>
              <li>Access controls and authentication mechanisms</li>
              <li>Regular security assessments and updates</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              However, no method of transmission over the Internet or electronic 
              storage is 100% secure. While we strive to protect your information, 
              we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Your Rights and Choices</h2>
            <p className="text-muted-foreground mb-4">
              Depending on your location, you may have the following rights:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>
                <strong>Access:</strong> Request a copy of the personal information 
                we hold about you
              </li>
              <li>
                <strong>Correction:</strong> Update or correct inaccurate information 
                through your account settings
              </li>
              <li>
                <strong>Deletion:</strong> Request deletion of your account and 
                associated data
              </li>
              <li>
                <strong>Portability:</strong> Request a copy of your data in a 
                machine-readable format
              </li>
              <li>
                <strong>Objection:</strong> Object to processing of your information 
                for certain purposes
              </li>
              <li>
                <strong>Withdraw Consent:</strong> Revoke calendar access or 
                disconnect WhatsApp at any time through Settings
              </li>
            </ul>
            <p className="text-muted-foreground mt-4">
              To exercise these rights, please contact us at the email address 
              provided below.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              8. WhatsApp Business Policy Compliance
            </h2>
            <p className="text-muted-foreground mb-4">
              Our use of WhatsApp is subject to{" "}
              <a
                href="https://www.whatsapp.com/legal/business-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                WhatsApp Business Policy
              </a>{" "}
              and{" "}
              <a
                href="https://www.whatsapp.com/legal/commerce-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                WhatsApp Commerce Policy
              </a>
              . We comply with Meta&apos;s requirements by:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>
                Only processing messages for legitimate business purposes (appointment 
                scheduling)
              </li>
              <li>
                Not using messages for advertising or marketing without explicit 
                consent
              </li>
              <li>Respecting customer opt-out requests</li>
              <li>Maintaining this publicly accessible privacy policy</li>
              <li>
                Implementing appropriate security measures for message handling
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              9. Google API Services User Data Policy
            </h2>
            <p className="text-muted-foreground mb-4">
              ScheduleAI&apos;s use of information received from Google APIs adheres 
              to the{" "}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements. Specifically:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>
                We only request calendar scopes necessary for appointment scheduling
              </li>
              <li>
                Calendar data is used solely to check availability and create 
                appointments
              </li>
              <li>We do not share calendar data with third parties except as disclosed</li>
              <li>
                We do not use calendar data for advertising or marketing purposes
              </li>
              <li>
                You can revoke calendar access at any time through your Google Account 
                settings
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              10. International Data Transfers
            </h2>
            <p className="text-muted-foreground">
              Your information may be transferred to and processed in countries other 
              than your country of residence. These countries may have data protection 
              laws different from your jurisdiction. By using our service, you consent 
              to the transfer of your information to our facilities and service 
              providers located around the world.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Children&apos;s Privacy</h2>
            <p className="text-muted-foreground">
              Our service is not directed to individuals under the age of 18. We do 
              not knowingly collect personal information from children. If you become 
              aware that a child has provided us with personal information, please 
              contact us, and we will take steps to delete such information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              12. Changes to This Privacy Policy
            </h2>
            <p className="text-muted-foreground">
              We may update this Privacy Policy from time to time. We will notify you 
              of material changes by posting the new Privacy Policy on this page and 
              updating the &quot;Last updated&quot; date. Your continued use of the service 
              after changes become effective constitutes acceptance of the revised 
              policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">13. Contact Us</h2>
            <p className="text-muted-foreground mb-4">
              If you have questions, concerns, or requests regarding this Privacy 
              Policy or our data practices, please contact us at:
            </p>
            <div className="bg-muted p-6 rounded-lg">
              <p className="font-medium mb-2">ScheduleAI</p>
              <p className="text-muted-foreground">Email: privacy@scheduleai.app</p>
              <p className="text-muted-foreground">
                For data subject requests (access, deletion, correction), please 
                include &quot;Privacy Request&quot; in your email subject line.
              </p>
            </div>
          </section>

          <section className="border-t pt-8 mt-8">
            <h2 className="text-2xl font-semibold mb-4">Additional Resources</h2>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://www.whatsapp.com/legal/business-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  WhatsApp Business Policy
                </a>
              </li>
              <li>
                <a
                  href="https://www.whatsapp.com/legal/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  WhatsApp Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Google Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="https://developers.google.com/terms/api-services-user-data-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Google API Services User Data Policy
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

      <footer className="border-t py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>ScheduleAI &mdash; AI-powered appointment scheduling</p>
        </div>
      </footer>
    </div>
  );
}
