import Link from "next/link";
import { CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TermsOfServicePage() {
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
        <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">
          Last updated: March 5, 2026
        </p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using BookMe AI | Your AI Receptionist That Never
              Sleeps (&quot;BookMe AI&quot;, &quot;we&quot;, &quot;our&quot;, or
              &quot;us&quot;), you agree to be bound by these Terms of Service
              (&quot;Terms&quot;). If you do not agree to these Terms, you may not
              access or use our service. These Terms constitute a legally binding
              agreement between you and BookMe AI.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              We may update these Terms from time to time. Your continued use of
              the service after any changes indicates your acceptance of the
              revised Terms. We encourage you to review these Terms periodically.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              BookMe AI is an AI-powered appointment scheduling platform that
              enables service professionals to automate their booking process. Our
              service integrates with:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-4">
              <li>
                <strong>WhatsApp Business Platform (via Meta):</strong> To receive
                and respond to customer appointment requests through WhatsApp
                messaging
              </li>
              <li>
                <strong>Google Calendar API:</strong> To check your real-time
                availability and create calendar events for confirmed appointments
              </li>
              <li>
                <strong>Google Gemini AI:</strong> To understand natural language
                messages from customers and generate appropriate responses
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              3. Account Registration and Security
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-medium mb-2">3.1 Account Creation</h3>
                <p className="text-muted-foreground">
                  To use BookMe AI, you must sign in using a valid Google account.
                  By signing in, you authorize us to access your Google Calendar
                  for the purpose of appointment scheduling. You must provide
                  accurate and complete information during the onboarding process,
                  including your business name, profession, and operating hours.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-medium mb-2">
                  3.2 Account Responsibility
                </h3>
                <p className="text-muted-foreground">
                  You are responsible for maintaining the confidentiality of your
                  account credentials and for all activities that occur under your
                  account. You agree to notify us immediately of any unauthorized
                  access to or use of your account.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-medium mb-2">3.3 One Account Per User</h3>
                <p className="text-muted-foreground">
                  Each user must maintain only one account. You may not create
                  multiple accounts or use another person&apos;s account without
                  permission.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              4. User Responsibilities
            </h2>
            <p className="text-muted-foreground mb-4">
              As a user of BookMe AI, you agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>
                Use the service only for lawful purposes related to appointment
                scheduling for your business
              </li>
              <li>
                Provide accurate and up-to-date business information, including
                services, pricing, and operating hours
              </li>
              <li>
                Handle your customers&apos; personal data responsibly and in
                compliance with applicable data protection laws
              </li>
              <li>
                Obtain any necessary consents from your customers before their
                data is processed through our service
              </li>
              <li>
                Respond to customer data deletion requests in a timely manner
              </li>
              <li>
                Comply with all applicable laws and regulations in your
                jurisdiction
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Prohibited Uses</h2>
            <p className="text-muted-foreground mb-4">
              You may not use BookMe AI to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>
                Send spam, unsolicited messages, or bulk communications through
                WhatsApp
              </li>
              <li>
                Violate Meta&apos;s{" "}
                <a
                  href="https://www.whatsapp.com/legal/business-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  WhatsApp Business Policy
                </a>
                ,{" "}
                <a
                  href="https://www.whatsapp.com/legal/commerce-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Commerce Policy
                </a>
                , or{" "}
                <a
                  href="https://developers.facebook.com/devpolicy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Developer Policies
                </a>
              </li>
              <li>
                Engage in deceptive practices, including misrepresenting your
                identity or business
              </li>
              <li>
                Distribute malware, spyware, or any malicious software through the
                service
              </li>
              <li>
                Attempt to reverse engineer, decompile, or disassemble any part of
                the service
              </li>
              <li>
                Interfere with or disrupt the integrity or performance of the
                service
              </li>
              <li>
                Use the service for any activity that violates applicable laws or
                regulations
              </li>
              <li>
                Scrape, harvest, or collect data from the service through
                automated means without authorization
              </li>
              <li>
                Use the service to send marketing or advertising messages without
                explicit customer consent
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              6. Third-Party Services
            </h2>
            <p className="text-muted-foreground mb-4">
              BookMe AI integrates with the following third-party services. Your
              use of these services through our platform is also subject to their
              respective terms:
            </p>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-medium mb-2">
                  6.1 Meta Platforms (WhatsApp)
                </h3>
                <p className="text-muted-foreground">
                  We use Meta&apos;s WhatsApp Cloud API to facilitate messaging
                  between your business and your customers. Your use is subject to{" "}
                  <a
                    href="https://developers.facebook.com/terms/dfc_platform_terms/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Meta Platform Terms
                  </a>
                  ,{" "}
                  <a
                    href="https://www.whatsapp.com/legal/business-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    WhatsApp Business Policy
                  </a>
                  , and{" "}
                  <a
                    href="https://www.whatsapp.com/legal/commerce-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    WhatsApp Commerce Policy
                  </a>
                  .
                </p>
              </div>

              <div>
                <h3 className="text-xl font-medium mb-2">
                  6.2 Google Services
                </h3>
                <p className="text-muted-foreground">
                  We access your Google Calendar through the Google Calendar API.
                  Your use is subject to{" "}
                  <a
                    href="https://policies.google.com/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Google&apos;s Terms of Service
                  </a>{" "}
                  and the{" "}
                  <a
                    href="https://developers.google.com/terms/api-services-user-data-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Google API Services User Data Policy
                  </a>
                  .
                </p>
              </div>

              <div>
                <h3 className="text-xl font-medium mb-2">
                  6.3 Google Gemini AI
                </h3>
                <p className="text-muted-foreground">
                  Customer messages are processed by Google&apos;s Gemini AI to
                  understand appointment requests and generate natural language
                  responses. AI-generated responses are not guaranteed to be
                  error-free, and you are responsible for reviewing any business
                  impact of automated communications.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-medium mb-2">6.4 Twilio</h3>
                <p className="text-muted-foreground">
                  We may use Twilio as an alternative provider for WhatsApp
                  messaging. Your use is subject to{" "}
                  <a
                    href="https://www.twilio.com/en-us/legal/tos"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Twilio&apos;s Terms of Service
                  </a>
                  .
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              7. Meta Platform Compliance
            </h2>
            <p className="text-muted-foreground mb-4">
              As an application built on Meta&apos;s platform, BookMe AI and its
              users must comply with Meta&apos;s policies. Specifically:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>
                <strong>Data Usage:</strong> We only access and use data received
                from Meta&apos;s platform (WhatsApp messages) for the purpose of
                providing appointment scheduling services as described in these
                Terms
              </li>
              <li>
                <strong>Data Deletion:</strong> When a user requests deletion of
                their data, we will delete all platform data associated with their
                account, regardless of local jurisdiction requirements, in
                compliance with Meta&apos;s Developer Policies
              </li>
              <li>
                <strong>Community Standards:</strong> All content processed through
                our service must comply with{" "}
                <a
                  href="https://transparency.meta.com/policies/community-standards/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Meta&apos;s Community Standards
                </a>
              </li>
              <li>
                <strong>User Consent:</strong> We obtain valid user consent before
                accessing or processing any data from Meta&apos;s platform
              </li>
              <li>
                <strong>Transparency:</strong> We clearly disclose our connection
                to Meta&apos;s platform and the data we access through it
              </li>
              <li>
                <strong>No Profile Building:</strong> We do not use data received
                from Meta&apos;s platform to build or augment user profiles for
                purposes unrelated to our stated service
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              8. Data Handling and Privacy
            </h2>
            <p className="text-muted-foreground mb-4">
              Your privacy is important to us. Our{" "}
              <Link
                href="/privacy-policy"
                className="text-primary hover:underline"
              >
                Privacy Policy
              </Link>{" "}
              describes in detail how we collect, use, store, and protect your
              information. By using BookMe AI, you consent to the data practices
              described in our Privacy Policy.
            </p>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-medium mb-2">
                  8.1 Data Deletion Requests
                </h3>
                <p className="text-muted-foreground">
                  You have the right to request deletion of your data at any time.
                  To request data deletion, please email us at{" "}
                  <a
                    href="mailto:contact@mythril-tech.com"
                    className="text-primary hover:underline"
                  >
                    contact@mythril-tech.com
                  </a>{" "}
                  with the subject line &quot;Data Deletion Request&quot;. We will
                  process your request within 30 days and confirm deletion of your
                  account data, WhatsApp message data, appointment records, and
                  any associated platform data.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-medium mb-2">
                  8.2 Customer Data Responsibilities
                </h3>
                <p className="text-muted-foreground">
                  As a business using BookMe AI, you act as a data controller for
                  your customers&apos; personal data. You are responsible for
                  ensuring that your use of our service complies with applicable
                  data protection laws, including informing your customers about
                  how their data is processed and obtaining any necessary consents.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              9. Intellectual Property
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-medium mb-2">9.1 Our Property</h3>
                <p className="text-muted-foreground">
                  BookMe AI, including its design, features, code, AI models
                  integration, and content, is owned by us and protected by
                  intellectual property laws. You may not copy, modify, distribute,
                  or create derivative works based on our service without our prior
                  written consent.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-medium mb-2">9.2 Your Content</h3>
                <p className="text-muted-foreground">
                  You retain ownership of the content you provide through our
                  service, including business information, service details, and
                  configurations. By using our service, you grant us a limited,
                  non-exclusive license to use this content solely for the purpose
                  of providing and improving our service.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              10. Disclaimers and Limitation of Liability
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-medium mb-2">10.1 Service &quot;As Is&quot;</h3>
                <p className="text-muted-foreground">
                  BookMe AI is provided on an &quot;as is&quot; and &quot;as
                  available&quot; basis without warranties of any kind, whether
                  express or implied. We do not warrant that the service will be
                  uninterrupted, error-free, or free of harmful components.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-medium mb-2">
                  10.2 AI-Generated Responses
                </h3>
                <p className="text-muted-foreground">
                  Our AI-powered responses are generated automatically and may not
                  always be accurate or appropriate. You acknowledge that AI
                  responses may contain errors, and you are responsible for
                  monitoring and managing automated communications with your
                  customers.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-medium mb-2">
                  10.3 Limitation of Liability
                </h3>
                <p className="text-muted-foreground">
                  To the maximum extent permitted by applicable law, BookMe AI
                  shall not be liable for any indirect, incidental, special,
                  consequential, or punitive damages, including but not limited to
                  loss of profits, data, business opportunities, or goodwill,
                  arising from your use of or inability to use the service.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-medium mb-2">
                  10.4 Third-Party Service Availability
                </h3>
                <p className="text-muted-foreground">
                  We are not responsible for the availability, reliability, or
                  performance of third-party services including WhatsApp, Google
                  Calendar, Google Gemini AI, or Twilio. Outages or changes to
                  these services may affect BookMe AI&apos;s functionality.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Termination</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-medium mb-2">
                  11.1 Termination by You
                </h3>
                <p className="text-muted-foreground">
                  You may stop using BookMe AI at any time. You can disconnect your
                  WhatsApp Business account and revoke Google Calendar access
                  through your account settings. To fully delete your account and
                  associated data, contact us at{" "}
                  <a
                    href="mailto:contact@mythril-tech.com"
                    className="text-primary hover:underline"
                  >
                    contact@mythril-tech.com
                  </a>
                  .
                </p>
              </div>

              <div>
                <h3 className="text-xl font-medium mb-2">
                  11.2 Termination by Us
                </h3>
                <p className="text-muted-foreground">
                  We reserve the right to suspend or terminate your account at any
                  time, with or without notice, if we reasonably believe that you
                  have violated these Terms, Meta&apos;s platform policies,
                  Google&apos;s terms, or any applicable law. Upon termination, your
                  right to use the service ceases immediately.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-medium mb-2">
                  11.3 Effect of Termination
                </h3>
                <p className="text-muted-foreground">
                  Upon termination, we will retain your data in accordance with our{" "}
                  <Link
                    href="/privacy-policy"
                    className="text-primary hover:underline"
                  >
                    Privacy Policy
                  </Link>{" "}
                  retention schedule, unless you request earlier deletion. Sections
                  of these Terms that by their nature should survive termination
                  (including Disclaimers, Limitation of Liability, and Governing
                  Law) will continue to apply.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              12. Changes to These Terms
            </h2>
            <p className="text-muted-foreground">
              We may modify these Terms at any time. When we make material
              changes, we will update the &quot;Last updated&quot; date at the top
              of this page. We may also notify you of significant changes through
              the service or via the email associated with your account. Your
              continued use of BookMe AI after changes become effective
              constitutes your acceptance of the revised Terms. If you do not
              agree to the new Terms, you must stop using the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">13. Governing Law</h2>
            <p className="text-muted-foreground">
              These Terms shall be governed by and construed in accordance with the
              laws of the jurisdiction in which BookMe AI operates, without regard
              to conflict of law principles. Any disputes arising from or relating
              to these Terms or the use of the service shall be resolved in the
              competent courts of that jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">14. Contact Us</h2>
            <p className="text-muted-foreground mb-4">
              If you have any questions or concerns about these Terms of Service,
              please contact us at:
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
                For data deletion requests, please include &quot;Data Deletion
                Request&quot; in your email subject line.
              </p>
            </div>
          </section>

          <section className="border-t pt-8 mt-8">
            <h2 className="text-2xl font-semibold mb-4">Additional Resources</h2>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/privacy-policy"
                  className="text-primary hover:underline"
                >
                  BookMe AI Privacy Policy
                </Link>
              </li>
              <li>
                <a
                  href="https://developers.facebook.com/terms/dfc_platform_terms/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Meta Platform Terms
                </a>
              </li>
              <li>
                <a
                  href="https://developers.facebook.com/devpolicy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Meta Developer Policies
                </a>
              </li>
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
                  href="https://www.whatsapp.com/legal/commerce-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  WhatsApp Commerce Policy
                </a>
              </li>
              <li>
                <a
                  href="https://policies.google.com/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Google Terms of Service
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
          <p>BookMe AI | Your AI Receptionist That Never Sleeps &mdash; AI-powered appointment scheduling</p>
          <div className="mt-4 flex items-center justify-center gap-4">
            <Link href="/privacy-policy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <span>|</span>
            <Link href="/terms-of-service" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
