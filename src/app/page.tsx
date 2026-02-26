import Link from "next/link";
import {
  CalendarCheck,
  MessageSquare,
  Bot,
  ArrowRight,
  Clock,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold">ScheduleAI</span>
          </div>
          <Link href="/login">
            <Button>Sign In</Button>
          </Link>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="container mx-auto px-4 py-24 text-center">
          <div className="mx-auto max-w-3xl space-y-6">
            <div className="inline-flex items-center rounded-full border bg-muted px-4 py-1.5 text-sm font-medium">
              <Bot className="mr-2 h-4 w-4" />
              AI-Powered Scheduling
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Your AI receptionist
              <br />
              <span className="text-muted-foreground">
                that never sleeps
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Connect your WhatsApp and Google Calendar. Our AI handles
              appointment requests from your customers 24/7 — checking
              availability, booking slots, and sending confirmations
              automatically.
            </p>
            <div className="flex items-center justify-center gap-4 pt-4">
              <Link href="/login">
                <Button size="lg" className="gap-2">
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="container mx-auto px-4 py-20">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-xl border bg-card p-8 shadow-sm">
              <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">
                WhatsApp Integration
              </h3>
              <p className="text-muted-foreground">
                Customers message your WhatsApp Business number. The AI
                understands their needs and handles the entire booking
                conversation.
              </p>
            </div>

            <div className="rounded-xl border bg-card p-8 shadow-sm">
              <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
                <CalendarCheck className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">
                Google Calendar Sync
              </h3>
              <p className="text-muted-foreground">
                Real-time availability checking against your Google Calendar.
                Appointments appear instantly with all the details.
              </p>
            </div>

            <div className="rounded-xl border bg-card p-8 shadow-sm">
              <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">
                Gemini AI Agent
              </h3>
              <p className="text-muted-foreground">
                Powered by Google Gemini with function calling. Understands
                natural language, handles rescheduling, and stays professional.
              </p>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-t bg-muted/50 py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-center text-3xl font-bold mb-12">
              How it works
            </h2>
            <div className="grid gap-8 md:grid-cols-4 max-w-4xl mx-auto">
              {[
                {
                  step: "1",
                  title: "Sign in with Google",
                  desc: "One-click sign in grants calendar access",
                },
                {
                  step: "2",
                  title: "Set up your services",
                  desc: "Pre-loaded defaults for your profession",
                },
                {
                  step: "3",
                  title: "Connect WhatsApp",
                  desc: "Link your WhatsApp Business number",
                },
                {
                  step: "4",
                  title: "AI takes over",
                  desc: "Customers book via WhatsApp automatically",
                },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">
                    {item.step}
                  </div>
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Built for */}
        <section className="container mx-auto px-4 py-20">
          <h2 className="text-center text-3xl font-bold mb-12">
            Built for service professionals
          </h2>
          <div className="grid gap-6 md:grid-cols-2 max-w-2xl mx-auto">
            <div className="flex items-start gap-4 rounded-xl border p-6">
              <div className="rounded-lg bg-blue-100 p-2 text-2xl">🦷</div>
              <div>
                <h3 className="font-semibold">Dentists</h3>
                <p className="text-sm text-muted-foreground">
                  Cleanings, exams, whitening, fillings, root canals, and crowns
                  — pre-configured and ready to go.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 rounded-xl border p-6">
              <div className="rounded-lg bg-orange-100 p-2 text-2xl">🔧</div>
              <div>
                <h3 className="font-semibold">Mechanics</h3>
                <p className="text-sm text-muted-foreground">
                  Oil changes, brake work, diagnostics, tire rotation — your
                  full service menu out of the box.
                </p>
              </div>
            </div>
          </div>
          <p className="text-center text-sm text-muted-foreground mt-6">
            More professions coming soon.
          </p>
        </section>

        {/* Bottom features */}
        <section className="border-t bg-muted/50 py-16">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 md:grid-cols-3 max-w-3xl mx-auto text-center">
              <div>
                <Clock className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                <h3 className="font-semibold mb-1">24/7 Availability</h3>
                <p className="text-sm text-muted-foreground">
                  Never miss a booking request, even at 3 AM
                </p>
              </div>
              <div>
                <Shield className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                <h3 className="font-semibold mb-1">Secure Tokens</h3>
                <p className="text-sm text-muted-foreground">
                  OAuth tokens stored securely, long-lived access
                </p>
              </div>
              <div>
                <CalendarCheck className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                <h3 className="font-semibold mb-1">No Double Bookings</h3>
                <p className="text-sm text-muted-foreground">
                  Real-time calendar checks prevent conflicts
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>ScheduleAI &mdash; AI-powered appointment scheduling</p>
        </div>
      </footer>
    </div>
  );
}
